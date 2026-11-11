using System.Text.RegularExpressions;
using HomeDashboard.Api.Models;

namespace HomeDashboard.Api.Services;

public sealed class AfvalService
{
    private readonly IHttpClientFactory    _http;
    private readonly IConfiguration        _config;
    private readonly ILogger<AfvalService> _log;

    private List<AfvalItem>? _cache;
    private DateTime          _cacheExpiry = DateTime.MinValue;
    private static readonly TimeSpan CacheTtl = TimeSpan.FromHours(6);

    private static readonly Dictionary<string, string> TypeLabels = new(StringComparer.OrdinalIgnoreCase)
    {
        ["gft"]               = "GFT",
        ["gft-e"]             = "GFT",
        ["papier"]            = "Papier",
        ["pmd"]               = "PMD/Plastic",
        ["pmd-straat"]        = "PMD/Plastic",
        ["restafval"]         = "Restafval",
        ["rest"]              = "Restafval",
        ["kerstbomen"]        = "Kerstbomen",
        ["grof"]              = "Grof vuil",
        ["grofvuil"]          = "Grof vuil",
        ["textiel"]           = "Textiel",
        ["plastic"]           = "Plastic",
    };

    // Map common iCal SUMMARY values to type keys
    private static readonly (string Pattern, string Type)[] SummaryMap =
    [
        ("gft",        "gft"),
        ("groente",    "gft"),
        ("papier",     "papier"),
        ("karton",     "papier"),
        ("pmd",        "pmd"),
        ("plastic",    "pmd"),
        ("restafval",  "restafval"),
        ("rest ",      "restafval"),
        ("grof",       "grof"),
        ("textiel",    "textiel"),
        ("kerstboom",  "kerstbomen"),
    ];

    public AfvalService(IHttpClientFactory http, IConfiguration config, ILogger<AfvalService> log)
    {
        _http   = http;
        _config = config;
        _log    = log;
    }

    public async Task<List<AfvalItem>> GetUpcomingAsync()
    {
        if (_cache != null && DateTime.UtcNow < _cacheExpiry)
            return FilterUpcoming(_cache);

        var icalUrl = _config["Afval:ICalUrl"] ?? "";
        if (string.IsNullOrWhiteSpace(icalUrl))
            return [];

        try
        {
            var client   = _http.CreateClient();
            var response = await client.GetStringAsync(icalUrl);
            var items    = ParseICal(response);

            _cache       = items;
            _cacheExpiry = DateTime.UtcNow.Add(CacheTtl);
            return FilterUpcoming(items);
        }
        catch (Exception ex)
        {
            _log.LogWarning(ex, "Afval: failed to fetch iCal from {Url}", icalUrl);
            return [];
        }
    }

    private List<AfvalItem> ParseICal(string ical)
    {
        var items = new List<AfvalItem>();

        // Split into VEVENT blocks
        var events = Regex.Split(ical, @"BEGIN:VEVENT", RegexOptions.IgnoreCase)
                          .Skip(1); // first element is before first VEVENT

        foreach (var evt in events)
        {
            try
            {
                var summary = GetICalValue(evt, "SUMMARY");
                var dtStart = GetICalValue(evt, "DTSTART");

                if (string.IsNullOrEmpty(summary) || string.IsNullOrEmpty(dtStart)) continue;

                if (!TryParseICalDate(dtStart, out var date)) continue;

                var (type, label) = ClassifySummary(summary);
                items.Add(new AfvalItem(type, date, label));
            }
            catch (Exception ex)
            {
                _log.LogDebug(ex, "Afval: skipping VEVENT");
            }
        }

        return items.OrderBy(i => i.Date).ToList();
    }

    private static string GetICalValue(string vevent, string key)
    {
        // Match "KEY:" or "KEY;...:" at start of line, capture value (may be multi-line with folded lines)
        var match = Regex.Match(vevent, $@"^{key}[^:]*:(.+?)(?=\r?\n[^\s]|\z)",
            RegexOptions.Multiline | RegexOptions.IgnoreCase | RegexOptions.Singleline);

        if (!match.Success) return "";

        // Unfold: remove CRLF/LF followed by whitespace (iCal line folding)
        return Regex.Replace(match.Groups[1].Value.Trim(), @"\r?\n[ \t]", "");
    }

    private static bool TryParseICalDate(string value, out DateTime result)
    {
        result = default;
        value  = value.Trim();

        // DATE-only: 20260325
        if (Regex.IsMatch(value, @"^\d{8}$"))
        {
            result = new DateTime(
                int.Parse(value[..4]),
                int.Parse(value[4..6]),
                int.Parse(value[6..8]),
                0, 0, 0, DateTimeKind.Local);
            return true;
        }

        // DATETIME: 20260325T090000 or 20260325T090000Z
        var dtMatch = Regex.Match(value, @"^(\d{8})T(\d{6})(Z?)$");
        if (dtMatch.Success)
        {
            var datePart = dtMatch.Groups[1].Value;
            var isUtc    = dtMatch.Groups[3].Value == "Z";
            var dt = new DateTime(
                int.Parse(datePart[..4]),
                int.Parse(datePart[4..6]),
                int.Parse(datePart[6..8]),
                0, 0, 0,
                isUtc ? DateTimeKind.Utc : DateTimeKind.Local);
            result = isUtc ? dt.ToLocalTime() : dt;
            return true;
        }

        return DateTime.TryParse(value, out result);
    }

    private static (string type, string label) ClassifySummary(string summary)
    {
        var lower = summary.ToLowerInvariant();

        foreach (var (pattern, type) in SummaryMap)
        {
            if (lower.Contains(pattern))
            {
                var label = TypeLabels.TryGetValue(type, out var l) ? l : summary;
                return (type, label);
            }
        }

        // Unknown type — use summary as-is
        var cleaned = summary.Trim();
        return (cleaned.ToLower(), cleaned);
    }

    private static List<AfvalItem> FilterUpcoming(List<AfvalItem> items)
    {
        var today  = DateTime.Now.Date;
        var cutoff = today.AddDays(60);
        return items.Where(i => i.Date >= today && i.Date <= cutoff)
                    .OrderBy(i => i.Date)
                    .ToList();
    }
}
