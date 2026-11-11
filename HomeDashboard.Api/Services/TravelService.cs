using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace HomeDashboard.Api.Services;

public record CarRoute(int Minutes, int TypicalMinutes, int DelayMinutes, double Km, string? Via, DateTime UpdatedAt);
public record TrainLeg(string Product, string Direction, string From, string To, DateTime Departure, DateTime? DepartureActual, DateTime Arrival, DateTime? ArrivalActual, string? Track, bool Cancelled);
public record TrainTrip(DateTime Departure, DateTime? DepartureActual, DateTime Arrival, DateTime? ArrivalActual, int Minutes, int Transfers, int DelayMinutes, bool Cancelled, string Status, string? Crowd, List<TrainLeg> Legs);
public record TravelResponse(string Direction, string FromName, string ToName, bool CarConfigured, bool TrainConfigured,
    CarRoute? Car, string? CarError, List<TrainTrip> Trains, string? TrainError);

/// <summary>
/// Travel time home ↔ work: by car via TomTom (free, no credit card) or the Google Maps Routes API — both with live traffic —
/// by train via the NS Reisinformatie API. Directions are cached so the daily free quota is never reached.
/// </summary>
public sealed partial class TravelService(IHttpClientFactory http, IConfiguration config, ILogger<TravelService> log)
{
    private const string RoutesUrl = "https://routes.googleapis.com/directions/v2:computeRoutes";
    private const string NsTripsUrl = "https://gateway.apiportal.ns.nl/reisinformatie-api/api/v3/trips";

    private string Home => config["Travel:HomeAddress"] ?? "";
    private string Work => config["Travel:WorkAddress"] ?? "";
    private string HomeStation => config["Travel:HomeStation"] ?? "";
    private string WorkStation => config["Travel:WorkStation"] ?? "";
    private string GoogleKey => config["Travel:GoogleMapsKey"] ?? "";
    private string TomTomKey => config["Travel:TomTomKey"] ?? "";
    private bool UseGoogle => GoogleKey.Length > 0;
    private string NsKey => config["Travel:NsKey"] ?? "";

    public bool CarConfigured => Home.Length > 0 && Work.Length > 0 && (GoogleKey.Length > 0 || TomTomKey.Length > 0);
    public bool TrainConfigured => HomeStation.Length > 0 && WorkStation.Length > 0 && NsKey.Length > 0;

    private readonly Dictionary<string, (DateTime At, CarRoute Route)> _car = new();
    private readonly Dictionary<string, (DateTime At, List<TrainTrip> Trips)> _train = new();
    private readonly SemaphoreSlim _lock = new(1, 1);

    /// <summary>Google charges per route: every 10 min by day (~3,000 calls/month). TomTom's free tier (2,500/day) allows every 5 min. Hourly at night.</summary>
    private TimeSpan CarCacheFor => DateTime.Now.Hour is >= 1 and < 6 ? TimeSpan.FromHours(1) : TimeSpan.FromMinutes(UseGoogle ? 10 : 5);
    private readonly Dictionary<string, (double Lat, double Lon)> _geo = new();
    private static readonly TimeSpan TrainCacheFor = TimeSpan.FromMinutes(2);

    public async Task<TravelResponse> GetAsync(string direction, bool force = false)
    {
        var toWork = direction != "home";
        var dir = toWork ? "work" : "home";
        CarRoute? car = null; string? carError = null;
        List<TrainTrip> trains = []; string? trainError = null;

        await _lock.WaitAsync();
        try
        {
            if (CarConfigured)
            {
                try
                {
                    if (!force && _car.TryGetValue(dir, out var c) && DateTime.UtcNow - c.At < CarCacheFor) car = c.Route;
                    else
                    {
                        var (from, to) = (toWork ? Home : Work, toWork ? Work : Home);
                        car = UseGoogle ? await FetchCarAsync(from, to) : await FetchTomTomAsync(from, to);
                        _car[dir] = (DateTime.UtcNow, car);
                    }
                }
                catch (Exception ex)
                {
                    log.LogWarning("Car route failed: {Message}", ex.Message);
                    carError = ex.Message;
                    if (_car.TryGetValue(dir, out var old)) car = old.Route; // show the last known time
                }
            }
            if (TrainConfigured)
            {
                try
                {
                    if (!force && _train.TryGetValue(dir, out var t) && DateTime.UtcNow - t.At < TrainCacheFor) trains = t.Trips;
                    else { trains = await FetchTrainsAsync(toWork ? HomeStation : WorkStation, toWork ? WorkStation : HomeStation); _train[dir] = (DateTime.UtcNow, trains); }
                }
                catch (Exception ex)
                {
                    log.LogWarning("NS trips failed: {Message}", ex.Message);
                    trainError = ex.Message;
                    if (_train.TryGetValue(dir, out var old)) trains = old.Trips;
                }
            }
        }
        finally { _lock.Release(); }

        // Drop trains that have left already
        var now = DateTime.UtcNow;
        trains = trains.Where(t => (t.DepartureActual ?? t.Departure) > now.AddMinutes(-1)).Take(5).ToList();

        return new TravelResponse(dir, toWork ? "Thuis" : "Werk", toWork ? "Werk" : "Thuis",
            CarConfigured, TrainConfigured, car, carError, trains, trainError);
    }

    // ── Google Maps Routes API ────────────────────────────────────────────────
    private HttpRequestMessage CarRequest(string from, string to)
    {
        var body = JsonSerializer.Serialize(new
        {
            origin = new { address = from },
            destination = new { address = to },
            travelMode = "DRIVE",
            routingPreference = "TRAFFIC_AWARE",
            languageCode = "nl-NL",
            regionCode = "nl",
            units = "METRIC",
        });
        var req = new HttpRequestMessage(HttpMethod.Post, RoutesUrl) { Content = new StringContent(body, Encoding.UTF8, "application/json") };
        req.Headers.Add("X-Goog-Api-Key", GoogleKey);
        req.Headers.Add("X-Goog-FieldMask", "routes.duration,routes.staticDuration,routes.distanceMeters,routes.description");
        return req;
    }

    private async Task<CarRoute> FetchCarAsync(string from, string to)
    {
        using var res = await http.CreateClient().SendAsync(CarRequest(from, to));
        var text = await res.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(text);
        if (!res.IsSuccessStatusCode)
        {
            var msg = doc.RootElement.TryGetProperty("error", out var e) && e.TryGetProperty("message", out var m) ? m.GetString() : res.StatusCode.ToString();
            throw new InvalidOperationException($"Google Maps: {msg}");
        }
        if (!doc.RootElement.TryGetProperty("routes", out var routes) || routes.GetArrayLength() == 0)
            throw new InvalidOperationException("Google Maps vond geen route — controleer de adressen");

        var r = routes[0];
        int Seconds(string prop) => r.TryGetProperty(prop, out var d) && int.TryParse(d.GetString()?.TrimEnd('s'), out var s) ? s : 0;
        var dur = Seconds("duration");
        var typical = Seconds("staticDuration");
        if (typical == 0) typical = dur;
        var km = r.TryGetProperty("distanceMeters", out var dm) ? dm.GetInt32() / 1000.0 : 0;
        var via = r.TryGetProperty("description", out var desc) ? desc.GetString() : null;
        var minutes = (int)Math.Round(dur / 60.0);
        var typicalMin = (int)Math.Round(typical / 60.0);
        return new CarRoute(minutes, typicalMin, Math.Max(0, minutes - typicalMin), Math.Round(km, 1), string.IsNullOrWhiteSpace(via) ? null : via, DateTime.UtcNow);
    }

    // ── TomTom (free tier) ────────────────────────────────────────────────────
    private string TomTomRouteUrl((double Lat, double Lon) a, (double Lat, double Lon) b) =>
        string.Create(CultureInfo.InvariantCulture,
            $"https://api.tomtom.com/routing/1/calculateRoute/{a.Lat},{a.Lon}:{b.Lat},{b.Lon}/json?key={TomTomKey}&traffic=true&travelMode=car&routeType=fastest&computeTravelTimeFor=all");

    /// <summary>Address → coordinates, once per address.</summary>
    private async Task<(double Lat, double Lon)> GeocodeAsync(string address)
    {
        if (_geo.TryGetValue(address, out var hit)) return hit;
        var url = $"https://api.tomtom.com/search/2/geocode/{Uri.EscapeDataString(address)}.json?key={TomTomKey}&countrySet=NL&limit=1&language=nl-NL";
        using var res = await http.CreateClient().GetAsync(url);
        if (res.StatusCode is System.Net.HttpStatusCode.Forbidden or System.Net.HttpStatusCode.Unauthorized)
            throw new InvalidOperationException("TomTom: ongeldige API-sleutel");
        res.EnsureSuccessStatusCode();
        using var doc = JsonDocument.Parse(await res.Content.ReadAsStringAsync());
        var results = doc.RootElement.GetProperty("results");
        if (results.GetArrayLength() == 0) throw new InvalidOperationException($"TomTom kan het adres niet vinden — controleer het adres");
        var pos = results[0].GetProperty("position");
        var p = (pos.GetProperty("lat").GetDouble(), pos.GetProperty("lon").GetDouble());
        _geo[address] = p;
        return p;
    }

    private async Task<CarRoute> FetchTomTomAsync(string from, string to)
    {
        var a = await GeocodeAsync(from);
        var b = await GeocodeAsync(to);
        using var res = await http.CreateClient().GetAsync(TomTomRouteUrl(a, b));
        var text = await res.Content.ReadAsStringAsync();
        if (!res.IsSuccessStatusCode)
            throw new InvalidOperationException(res.StatusCode is System.Net.HttpStatusCode.Forbidden or System.Net.HttpStatusCode.Unauthorized
                ? "TomTom: ongeldige API-sleutel" : $"TomTom: {(int)res.StatusCode}");
        using var doc = JsonDocument.Parse(text);
        var routes = doc.RootElement.GetProperty("routes");
        if (routes.GetArrayLength() == 0) throw new InvalidOperationException("TomTom vond geen route");
        var s = routes[0].GetProperty("summary");
        int Sec(string prop) => s.TryGetProperty(prop, out var v) ? v.GetInt32() : 0;
        var dur = Sec("travelTimeInSeconds");
        var free = Sec("noTrafficTravelTimeInSeconds");
        if (free == 0) free = dur - Sec("trafficDelayInSeconds");
        var minutes = (int)Math.Round(dur / 60.0);
        var typical = (int)Math.Round(free / 60.0);
        return new CarRoute(minutes, typical, Math.Max(0, minutes - typical), Math.Round(Sec("lengthInMeters") / 1000.0, 1), null, DateTime.UtcNow);
    }

    // ── NS Reisinformatie ─────────────────────────────────────────────────────
    private HttpRequestMessage TrainRequest(string from, string to)
    {
        var q = $"?fromStation={Uri.EscapeDataString(from)}&toStation={Uri.EscapeDataString(to)}&lang=nl";
        var req = new HttpRequestMessage(HttpMethod.Get, NsTripsUrl + q);
        req.Headers.Add("Ocp-Apim-Subscription-Key", NsKey);
        return req;
    }

    private async Task<List<TrainTrip>> FetchTrainsAsync(string from, string to)
    {
        using var res = await http.CreateClient().SendAsync(TrainRequest(from, to));
        var text = await res.Content.ReadAsStringAsync();
        if (!res.IsSuccessStatusCode)
            throw new InvalidOperationException(res.StatusCode == System.Net.HttpStatusCode.Unauthorized
                ? "NS: ongeldige API-sleutel" : $"NS: {(int)res.StatusCode} — controleer de stationscodes");
        using var doc = JsonDocument.Parse(text);
        var list = new List<TrainTrip>();
        if (!doc.RootElement.TryGetProperty("trips", out var trips)) return list;

        foreach (var t in trips.EnumerateArray())
        {
            var legs = new List<TrainLeg>();
            if (t.TryGetProperty("legs", out var ls))
                foreach (var l in ls.EnumerateArray())
                {
                    var o = l.GetProperty("origin"); var d = l.GetProperty("destination");
                    var product = l.TryGetProperty("product", out var p)
                        ? Str(p, "shortCategoryName") ?? Str(p, "categoryCode") ?? Str(p, "displayName") ?? "" : "";
                    legs.Add(new TrainLeg(product, Str(l, "direction") ?? "", Str(o, "name") ?? "", Str(d, "name") ?? "",
                        Time(o, "plannedDateTime") ?? DateTime.MinValue, Time(o, "actualDateTime"),
                        Time(d, "plannedDateTime") ?? DateTime.MinValue, Time(d, "actualDateTime"),
                        Str(o, "actualTrack") ?? Str(o, "plannedTrack"),
                        l.TryGetProperty("cancelled", out var c) && c.ValueKind == JsonValueKind.True));
                }
            if (legs.Count == 0) continue;

            var first = legs[0]; var last = legs[^1];
            var dep = first.Departure; var depAct = first.DepartureActual;
            var arr = last.Arrival; var arrAct = last.ArrivalActual;
            var planned = t.TryGetProperty("plannedDurationInMinutes", out var pd) ? pd.GetInt32() : (int)(arr - dep).TotalMinutes;
            var actual = t.TryGetProperty("actualDurationInMinutes", out var ad) ? ad.GetInt32() : planned;
            var delay = depAct is { } da ? (int)Math.Round((da - dep).TotalMinutes) : 0;
            var status = Str(t, "status") ?? "NORMAL";
            list.Add(new TrainTrip(dep, depAct, arr, arrAct, actual, t.TryGetProperty("transfers", out var tr) ? tr.GetInt32() : legs.Count - 1,
                Math.Max(0, delay), status == "CANCELLED" || legs.Any(x => x.Cancelled), status, Str(t, "crowdForecast"), legs));
        }
        return list.OrderBy(x => x.Departure).ToList();
    }

    private static string? Str(JsonElement e, string prop) =>
        e.TryGetProperty(prop, out var v) && v.ValueKind == JsonValueKind.String ? v.GetString() : null;

    /// <summary>NS writes offsets without a colon ("+0100").</summary>
    private static DateTime? Time(JsonElement e, string prop)
    {
        var s = Str(e, prop);
        if (string.IsNullOrEmpty(s)) return null;
        s = OffsetRegex().Replace(s, "$1:$2");
        return DateTimeOffset.TryParse(s, CultureInfo.InvariantCulture, DateTimeStyles.None, out var d) ? d.UtcDateTime : null;
    }

    [GeneratedRegex(@"([+-]\d{2})(\d{2})$")]
    private static partial Regex OffsetRegex();

    // ── Debug: raw answers, to check a fresh setup ────────────────────────────
    private async Task<object> TomTomDebugAsync(Func<HttpRequestMessage, Task<object>> raw)
    {
        try { return await raw(new HttpRequestMessage(HttpMethod.Get, TomTomRouteUrl(await GeocodeAsync(Home), await GeocodeAsync(Work)))); }
        catch (Exception ex) { return new { error = ex.Message }; }
    }

    public async Task<object> DebugAsync()
    {
        async Task<object> Raw(HttpRequestMessage req)
        {
            try
            {
                using var res = await http.CreateClient().SendAsync(req);
                var text = await res.Content.ReadAsStringAsync();
                return new { status = (int)res.StatusCode, body = text.Length > 4000 ? text[..4000] + "…" : text };
            }
            catch (Exception ex) { return new { error = ex.Message }; }
        }
        return new
        {
            carConfigured = CarConfigured,
            trainConfigured = TrainConfigured,
            carProvider = UseGoogle ? "google" : TomTomKey.Length > 0 ? "tomtom" : null,
            car = !CarConfigured ? null : UseGoogle ? await Raw(CarRequest(Home, Work)) : await TomTomDebugAsync(Raw),
            train = TrainConfigured ? await Raw(TrainRequest(HomeStation, WorkStation)) : null,
        };
    }
}
