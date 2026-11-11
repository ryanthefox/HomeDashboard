using System.Collections.Concurrent;
using System.Globalization;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using HomeDashboard.Api.Models;

namespace HomeDashboard.Api.Services;

/// <summary>
/// Frank Energie via its (unofficial) GraphQL API — the same one their app and the
/// Home Assistant integration use. Prices are public; usage/costs need the account
/// login (config FrankEnergie:Email / FrankEnergie:Password).
/// </summary>
public sealed class FrankEnergieService
{
    private const string Endpoint = "https://graphql.frankenergie.nl/";
    private const int HistoryDays = 31;

    private readonly IHttpClientFactory _http;
    private readonly ILogger<FrankEnergieService> _log;
    private readonly string _email;
    private readonly string _password;
    private readonly TimeZoneInfo _tz;

    // Auth state
    private readonly SemaphoreSlim _authLock = new(1, 1);
    private string? _authToken, _refreshToken, _siteReference;
    private DateTime _loginBlockedUntil = DateTime.MinValue;
    private string? _loginError;

    // Caches
    private EnergyPrices? _prices;
    private DateTime _pricesExpiry = DateTime.MinValue;
    private readonly SemaphoreSlim _usageLock = new(1, 1);
    private EnergyUsage? _usage;
    private DateTime _usageExpiry = DateTime.MinValue;
    private readonly ConcurrentDictionary<string, DayData> _completeDays = new(); // past days never change

    private sealed record DayData(EnergyUsagePoint Total, List<EnergyUsagePoint> Hours);

    public FrankEnergieService(IHttpClientFactory http, IConfiguration config, ILogger<FrankEnergieService> log)
    {
        _http = http;
        _log = log;
        _email = config["FrankEnergie:Email"] ?? "";
        _password = config["FrankEnergie:Password"] ?? "";
        try { _tz = TimeZoneInfo.FindSystemTimeZoneById("Europe/Amsterdam"); }
        catch { _tz = TimeZoneInfo.Local; }
    }

    public bool HasLogin => !string.IsNullOrWhiteSpace(_email) && !string.IsNullOrWhiteSpace(_password);

    private DateOnly Today => DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(DateTime.UtcNow, _tz));
    private static string Iso(DateOnly d) => d.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);

    // ── Prices ───────────────────────────────────────────────────────────────

    /// <summary>All-in prices for today and (from ~14:00) tomorrow.</summary>
    public async Task<EnergyPrices> GetPricesAsync()
    {
        if (_prices != null && DateTime.UtcNow < _pricesExpiry) return _prices;

        const string q = """
            query MarketPrices($date: String!) {
              marketPrices(date: $date) {
                electricityPrices { from till marketPrice marketPriceTax sourcingMarkupPrice energyTaxPrice }
                gasPrices { from till marketPrice marketPriceTax sourcingMarkupPrice energyTaxPrice }
              }
            }
            """;

        var elec = new Dictionary<DateTimeOffset, EnergyPrice>();
        var gas  = new Dictionary<DateTimeOffset, EnergyPrice>();
        foreach (var day in new[] { Today, Today.AddDays(1) })
        {
            try
            {
                var data = await QueryAsync(q, new { date = Iso(day) }, auth: false);
                var mp = data.GetProperty("marketPrices");
                foreach (var p in ParsePrices(mp, "electricityPrices")) elec[p.From] = p;
                foreach (var p in ParsePrices(mp, "gasPrices"))         gas[p.From]  = p;
            }
            catch (Exception ex) when (day != Today)
            {
                _log.LogDebug(ex, "Frank Energie: no prices for {Day} yet", day);
            }
        }

        _prices = new EnergyPrices(
            elec.Values.OrderBy(p => p.From).ToList(),
            gas.Values.OrderBy(p => p.From).ToList());
        // Tomorrow's prices appear in the afternoon: refresh more often until we have them
        var haveTomorrow = _prices.Electricity.Any(p => TimeZoneInfo.ConvertTime(p.From, _tz).Date == Today.AddDays(1).ToDateTime(TimeOnly.MinValue));
        _pricesExpiry = DateTime.UtcNow.Add(haveTomorrow ? TimeSpan.FromHours(1) : TimeSpan.FromMinutes(15));
        return _prices;
    }

    private static IEnumerable<EnergyPrice> ParsePrices(JsonElement mp, string key)
    {
        if (!mp.TryGetProperty(key, out var arr) || arr.ValueKind != JsonValueKind.Array) yield break;
        foreach (var p in arr.EnumerateArray())
        {
            var market = Dec(p, "marketPrice");
            var tax    = Dec(p, "marketPriceTax");
            var markup = Dec(p, "sourcingMarkupPrice");
            var eTax   = Dec(p, "energyTaxPrice");
            yield return new EnergyPrice(
                DateTimeOffset.Parse(p.GetProperty("from").GetString()!, CultureInfo.InvariantCulture),
                DateTimeOffset.Parse(p.GetProperty("till").GetString()!, CultureInfo.InvariantCulture),
                market + tax + markup + eTax, market, tax, markup, eTax);
        }
    }

    // ── Usage & costs ────────────────────────────────────────────────────────

    public async Task<EnergyUsage> GetUsageAsync()
    {
        if (!HasLogin) return new EnergyUsage(false, null, null, null, [], [], null);
        if (_usage != null && DateTime.UtcNow < _usageExpiry) return _usage;

        await _usageLock.WaitAsync();
        try
        {
            if (_usage != null && DateTime.UtcNow < _usageExpiry) return _usage;
            _usage = await LoadUsageAsync();
            _usageExpiry = DateTime.UtcNow.Add(_usage.Error == null ? TimeSpan.FromMinutes(30) : TimeSpan.FromMinutes(5));
            return _usage;
        }
        finally { _usageLock.Release(); }
    }

    private async Task<EnergyUsage> LoadUsageAsync()
    {
        try
        {
            var site = await GetSiteReferenceAsync();

            const string monthQ = """
                query MonthSummary($siteReference: String!) {
                  monthSummary(siteReference: $siteReference) {
                    actualCostsUntilLastMeterReadingDate expectedCostsUntilLastMeterReadingDate
                    expectedCosts lastMeterReadingDate gasExcluded
                  }
                }
                """;
            var ms = (await QueryAsync(monthQ, new { siteReference = site })).GetProperty("monthSummary");
            var lastReading = Str(ms, "lastMeterReadingDate");
            var month = new EnergyMonthSummary(
                Dec(ms, "actualCostsUntilLastMeterReadingDate"),
                Dec(ms, "expectedCostsUntilLastMeterReadingDate"),
                Dec(ms, "expectedCosts"),
                lastReading,
                ms.TryGetProperty("gasExcluded", out var ge) && ge.ValueKind == JsonValueKind.True);

            // Days up to the last meter reading (the grid operator delivers data a day or so late)
            var last = DateOnly.TryParse(lastReading?[..Math.Min(10, lastReading.Length)], CultureInfo.InvariantCulture, out var lr)
                ? lr : Today.AddDays(-1);
            if (last > Today) last = Today;
            var days = Enumerable.Range(0, HistoryDays).Select(i => last.AddDays(-i)).Reverse().ToList();

            var results = new DayData?[days.Count];
            using var throttle = new SemaphoreSlim(4);
            await Task.WhenAll(days.Select(async (d, i) =>
            {
                await throttle.WaitAsync();
                try { results[i] = await GetDayAsync(site, d, complete: d < last); }
                catch (Exception ex) { _log.LogDebug(ex, "Frank Energie: no usage for {Day}", d); }
                finally { throttle.Release(); }
            }));

            var dayPoints = results.Where(r => r != null).Select(r => r!.Total).ToList();
            var latest = results.LastOrDefault(r => r != null && r.Hours.Count > 0);

            return new EnergyUsage(true, null, lastReading, month, dayPoints, latest?.Hours ?? [], latest?.Total.Date);
        }
        catch (Exception ex)
        {
            _log.LogWarning(ex, "Frank Energie: loading usage failed");
            return new EnergyUsage(true, _loginError ?? ex.Message, null, null, [], [], null);
        }
    }

    private async Task<DayData> GetDayAsync(string site, DateOnly day, bool complete)
    {
        var key = Iso(day);
        if (_completeDays.TryGetValue(key, out var cached)) return cached;

        const string q = """
            query PeriodUsageAndCosts($date: String!, $siteReference: String!) {
              periodUsageAndCosts(date: $date, siteReference: $siteReference) {
                gas { usageTotal costsTotal items { from till usage costs } }
                electricity { usageTotal costsTotal items { from till usage costs } }
                feedIn { usageTotal costsTotal items { from till usage costs } }
              }
            }
            """;
        var p = (await QueryAsync(q, new { date = key, siteReference = site })).GetProperty("periodUsageAndCosts");

        JsonElement Part(string name) => p.TryGetProperty(name, out var e) && e.ValueKind == JsonValueKind.Object ? e : default;
        var elec = Part("electricity"); var gas = Part("gas"); var feed = Part("feedIn");

        var total = new EnergyUsagePoint(key, null,
            Dec(elec, "usageTotal"), Dec(elec, "costsTotal"),
            Dec(gas, "usageTotal"),  Dec(gas, "costsTotal"),
            Dec(feed, "usageTotal"), Dec(feed, "costsTotal"));

        // Merge the hourly items of the three parts by start time
        var hours = new SortedDictionary<DateTimeOffset, decimal[]>();
        void Add(JsonElement part, int idx)
        {
            if (part.ValueKind != JsonValueKind.Object || !part.TryGetProperty("items", out var items) || items.ValueKind != JsonValueKind.Array) return;
            foreach (var it in items.EnumerateArray())
            {
                if (Str(it, "from") is not { } f || !DateTimeOffset.TryParse(f, CultureInfo.InvariantCulture, out var from)) continue;
                if (!hours.TryGetValue(from, out var v)) hours[from] = v = new decimal[6];
                v[idx] += Dec(it, "usage"); v[idx + 1] += Dec(it, "costs");
            }
        }
        Add(elec, 0); Add(gas, 2); Add(feed, 4);
        var hourPoints = hours.Select(h => new EnergyUsagePoint(key, h.Key, h.Value[0], h.Value[1], h.Value[2], h.Value[3], h.Value[4], h.Value[5])).ToList();

        var data = new DayData(total, hourPoints);
        if (complete) _completeDays[key] = data;
        return data;
    }

    private async Task<string> GetSiteReferenceAsync()
    {
        if (_siteReference != null) return _siteReference;
        const string q = "query UserSites { userSites { reference status } }";
        var sites = (await QueryAsync(q, new { })).GetProperty("userSites");
        string? pick = null;
        foreach (var s in sites.EnumerateArray())
        {
            var reference = Str(s, "reference");
            if (reference == null) continue;
            pick ??= reference;
            if (string.Equals(Str(s, "status"), "IN_DELIVERY", StringComparison.OrdinalIgnoreCase)) { pick = reference; break; }
        }
        return _siteReference = pick ?? throw new InvalidOperationException("Geen aansluiting gevonden in je Frank Energie-account");
    }

    /// <summary>Raw responses for troubleshooting (/api/energy/debug).</summary>
    public async Task<object> GetDebugAsync()
    {
        var result = new Dictionary<string, object?> { ["hasLogin"] = HasLogin, ["loginError"] = _loginError };
        if (!HasLogin) return result;
        try
        {
            result["userSites"] = await QueryAsync("query { userSites { reference status segments propositionType deliveryStartDate firstMeterReadingDate lastMeterReadingDate } }", new { });
            var site = await GetSiteReferenceAsync();
            result["site"] = site;
            result["yesterday"] = await QueryAsync(
                "query($d:String!,$s:String!){ periodUsageAndCosts(date:$d, siteReference:$s){ electricity{ usageTotal costsTotal unit items{ date from till usage costs unit } } gas{ usageTotal costsTotal unit items{ from till usage costs unit } } } }",
                new { d = Iso(Today.AddDays(-1)), s = site });
        }
        catch (Exception ex) { result["error"] = ex.Message; }
        return result;
    }

    // ── GraphQL + auth ───────────────────────────────────────────────────────

    private async Task<JsonElement> QueryAsync(string query, object variables, bool auth = true)
    {
        if (auth) await EnsureLoggedInAsync();
        try
        {
            return await SendAsync(query, variables, auth ? _authToken : null);
        }
        catch (FrankApiException ex) when (auth && ex.IsAuthError)
        {
            // Token expired: renew (or log in again) and retry once
            await RenewAsync();
            return await SendAsync(query, variables, _authToken);
        }
    }

    private async Task<JsonElement> SendAsync(string query, object variables, string? token)
    {
        using var req = new HttpRequestMessage(HttpMethod.Post, Endpoint)
        {
            Content = new StringContent(JsonSerializer.Serialize(new { query, variables }), Encoding.UTF8, "application/json"),
        };
        if (token != null) req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        req.Headers.UserAgent.ParseAdd("HomeDashboard/1.0");

        var client = _http.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(20);
        using var res = await client.SendAsync(req);
        var body = await res.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;

        if (root.TryGetProperty("errors", out var errs) && errs.ValueKind == JsonValueKind.Array && errs.GetArrayLength() > 0)
            throw new FrankApiException(Str(errs[0], "message") ?? "Onbekende fout");
        if (!res.IsSuccessStatusCode)
            throw new FrankApiException($"HTTP {(int)res.StatusCode}");

        return root.GetProperty("data").Clone();
    }

    private async Task EnsureLoggedInAsync()
    {
        if (_authToken != null) return;
        await _authLock.WaitAsync();
        try
        {
            if (_authToken != null) return;
            await LoginAsync();
        }
        finally { _authLock.Release(); }
    }

    private async Task LoginAsync()
    {
        if (DateTime.UtcNow < _loginBlockedUntil)
            throw new InvalidOperationException(_loginError ?? "Inloggen tijdelijk gepauzeerd");

        const string q = """
            mutation Login($email: String!, $password: String!) {
              login(email: $email, password: $password) { authToken refreshToken }
            }
            """;
        try
        {
            var login = (await SendAsync(q, new { email = _email, password = _password }, null)).GetProperty("login");
            _authToken = Str(login, "authToken");
            _refreshToken = Str(login, "refreshToken");
            _loginError = null;
            _log.LogInformation("Frank Energie: logged in");
        }
        catch (FrankApiException ex)
        {
            // Don't hammer the login with a wrong password
            _loginError = ex.Message.Contains("password", StringComparison.OrdinalIgnoreCase) || ex.Message.Contains("email", StringComparison.OrdinalIgnoreCase)
                ? "Inloggen bij Frank Energie mislukt: controleer FRANK_EMAIL en FRANK_PASSWORD"
                : $"Inloggen bij Frank Energie mislukt ({ex.Message})";
            _loginBlockedUntil = DateTime.UtcNow.AddMinutes(15);
            throw new InvalidOperationException(_loginError, ex);
        }
    }

    private async Task RenewAsync()
    {
        await _authLock.WaitAsync();
        try
        {
            if (_authToken != null && _refreshToken != null)
            {
                const string q = """
                    mutation RenewToken($authToken: String!, $refreshToken: String!) {
                      renewToken(authToken: $authToken, refreshToken: $refreshToken) { authToken refreshToken }
                    }
                    """;
                try
                {
                    var r = (await SendAsync(q, new { authToken = _authToken, refreshToken = _refreshToken }, null)).GetProperty("renewToken");
                    _authToken = Str(r, "authToken");
                    _refreshToken = Str(r, "refreshToken");
                    return;
                }
                catch (FrankApiException ex) { _log.LogDebug(ex, "Frank Energie: token renew failed, logging in again"); }
            }
            _authToken = _refreshToken = null;
            await LoginAsync();
        }
        finally { _authLock.Release(); }
    }

    // ── JSON helpers ─────────────────────────────────────────────────────────

    private static string? Str(JsonElement e, string name) =>
        e.ValueKind == JsonValueKind.Object && e.TryGetProperty(name, out var v) && v.ValueKind == JsonValueKind.String ? v.GetString() : null;

    private static decimal Dec(JsonElement e, string name)
    {
        if (e.ValueKind != JsonValueKind.Object || !e.TryGetProperty(name, out var v)) return 0;
        return v.ValueKind switch
        {
            JsonValueKind.Number => v.GetDecimal(),
            JsonValueKind.String when decimal.TryParse(v.GetString(), NumberStyles.Any, CultureInfo.InvariantCulture, out var d) => d,
            _ => 0,
        };
    }

    private sealed class FrankApiException(string message) : Exception(message)
    {
        public bool IsAuthError => Message.Contains("auth-", StringComparison.OrdinalIgnoreCase);
    }
}
