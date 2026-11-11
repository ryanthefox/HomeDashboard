using Ical.Net.CalendarComponents;

namespace HomeDashboard.Api.Services;

public record CalendarInfo(int Index, string Name, string? Error);
public record CalendarEventDto(string Id, int Calendar, string Title, DateTime Start, DateTime End, bool AllDay, string? Location);
public record CalendarResponse(bool Configured, List<CalendarInfo> Calendars, List<CalendarEventDto> Events);

/// <summary>
/// Reads one or more iCal feeds (e.g. the "secret address in iCal format" of a Google Calendar)
/// and expands recurring events. Feeds are fetched at most every few minutes.
/// </summary>
public sealed class CalendarService(IHttpClientFactory http, IConfiguration config, ILogger<CalendarService> log)
{
    private static readonly TimeSpan CacheFor = TimeSpan.FromMinutes(10);
    private readonly SemaphoreSlim _lock = new(1, 1);
    private (DateTime At, CalendarResponse Data)? _cache;

    private string[] Urls => (config["Calendar:IcsUrls"] ?? "")
        .Split([',', ';', '\n', ' '], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
        .Select(u => u.StartsWith("webcal://", StringComparison.OrdinalIgnoreCase) ? "https://" + u[9..] : u)
        .ToArray();

    public async Task<CalendarResponse> GetAsync(bool force = false)
    {
        var urls = Urls;
        if (urls.Length == 0) return new(false, [], []);

        await _lock.WaitAsync();
        try
        {
            if (!force && _cache is { } c && DateTime.UtcNow - c.At < CacheFor) return c.Data;

            var from = DateTime.Today.AddDays(-35);   // a month back, so the month view is filled
            var till = DateTime.Today.AddDays(100);
            var results = await Task.WhenAll(urls.Select((u, i) => LoadAsync(i, u, from, till)));

            var data = new CalendarResponse(true,
                results.Select(r => r.Info).ToList(),
                results.SelectMany(r => r.Events).OrderBy(e => e.Start).ThenBy(e => e.Title).ToList());
            // Keep showing the last good events of a feed that fails temporarily
            if (_cache is { } old && results.Any(r => r.Info.Error != null))
            {
                var failed = results.Where(r => r.Info.Error != null).Select(r => r.Info.Index).ToHashSet();
                data = data with { Events = data.Events.Concat(old.Data.Events.Where(e => failed.Contains(e.Calendar))).OrderBy(e => e.Start).ToList() };
            }
            _cache = (DateTime.UtcNow, data);
            return data;
        }
        finally { _lock.Release(); }
    }

    private async Task<(CalendarInfo Info, List<CalendarEventDto> Events)> LoadAsync(int index, string url, DateTime from, DateTime till)
    {
        var fallbackName = $"Agenda {index + 1}";
        try
        {
            var client = http.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(20);
            var text = await client.GetStringAsync(url);
            var cal = Ical.Net.Calendar.Load(text);
            var name = cal.Properties["X-WR-CALNAME"]?.Value as string;

            var events = new List<CalendarEventDto>();
            foreach (var occ in cal.GetOccurrences(from, till))
            {
                if (occ.Source is not CalendarEvent ev) continue;
                if (string.Equals(ev.Status, "CANCELLED", StringComparison.OrdinalIgnoreCase)) continue;
                var start = occ.Period.StartTime;
                var allDay = ev.IsAllDay || !start.HasTime;
                var end = occ.Period.EndTime ?? (ev.Duration > TimeSpan.Zero ? start.Add(ev.Duration) : start);

                // All-day events: plain dates (no time zone shifts). Timed events: UTC.
                var s = allDay ? DateTime.SpecifyKind(start.Value.Date, DateTimeKind.Unspecified) : start.AsUtc;
                var e = allDay ? DateTime.SpecifyKind(end.Value.Date, DateTimeKind.Unspecified) : end.AsUtc;
                if (allDay && e <= s) e = s.AddDays(1);

                events.Add(new CalendarEventDto(
                    $"{index}:{ev.Uid}:{s:yyyyMMddHHmm}", index,
                    string.IsNullOrWhiteSpace(ev.Summary) ? "(geen titel)" : ev.Summary.Trim(),
                    s, e, allDay, string.IsNullOrWhiteSpace(ev.Location) ? null : ev.Location.Trim()));
            }
            return (new CalendarInfo(index, string.IsNullOrWhiteSpace(name) ? fallbackName : name.Trim(), null), events);
        }
        catch (Exception ex)
        {
            // Never log the URL itself: the secret address gives read access to the calendar
            log.LogWarning("Calendar {Index} could not be loaded: {Message}", index + 1, ex.Message);
            return (new CalendarInfo(index, fallbackName, "Agenda kon niet worden geladen"), []);
        }
    }
}
