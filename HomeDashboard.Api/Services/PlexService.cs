using System.Net.Http;
using System.Text.Json;
using HomeDashboard.Api.Models;

namespace HomeDashboard.Api.Services;

public sealed class PlexService
{
    private readonly IHttpClientFactory    _http;
    private readonly IConfiguration        _config;
    private readonly ILogger<PlexService>  _log;

    private List<PlexItem>?    _onDeckCache;
    private DateTime            _onDeckExpiry = DateTime.MinValue;

    private List<PlexItem>?    _recentCache;
    private DateTime            _recentExpiry = DateTime.MinValue;

    private List<PlexSession>? _sessionsCache;
    private DateTime            _sessionsExpiry = DateTime.MinValue;

    private PlexStats?          _statsCache;
    private DateTime            _statsExpiry = DateTime.MinValue;

    private static readonly TimeSpan CacheTtl     = TimeSpan.FromSeconds(30);
    private static readonly TimeSpan StatsCacheTtl = TimeSpan.FromMinutes(10);
    private static readonly TimeSpan SessionCacheTtl = TimeSpan.FromSeconds(5);

    public PlexService(IHttpClientFactory http, IConfiguration config, ILogger<PlexService> log)
    {
        _http   = http;
        _config = config;
        _log    = log;
    }

    private string ServerUrl => (_config["Plex:ServerUrl"] ?? "http://localhost:32400").TrimEnd('/');
    private string Token     => _config["Plex:Token"] ?? "";

    public async Task<List<PlexItem>> GetOnDeckAsync()
    {
        if (_onDeckCache != null && DateTime.UtcNow < _onDeckExpiry)
            return _onDeckCache;

        var items = await FetchItemsAsync("/library/onDeck", 10);
        _onDeckCache  = items;
        _onDeckExpiry = DateTime.UtcNow.Add(CacheTtl);
        return items;
    }

    public async Task<List<PlexItem>> GetRecentlyAddedAsync()
    {
        if (_recentCache != null && DateTime.UtcNow < _recentExpiry)
            return _recentCache;

        var items = await FetchItemsAsync("/library/recentlyAdded", 20);
        _recentCache  = items;
        _recentExpiry = DateTime.UtcNow.Add(CacheTtl);
        return items;
    }

    public async Task<List<PlexSession>> GetSessionsAsync()
    {
        if (_sessionsCache != null && DateTime.UtcNow < _sessionsExpiry)
            return _sessionsCache;

        if (string.IsNullOrEmpty(Token)) return [];

        try
        {
            var client   = CreateClient();
            var url      = $"{ServerUrl}/status/sessions?X-Plex-Token={Uri.EscapeDataString(Token)}";
            var response = await client.GetStringAsync(url);
            var sessions = ParseSessions(response);
            _sessionsCache  = sessions;
            _sessionsExpiry = DateTime.UtcNow.Add(SessionCacheTtl);
            return sessions;
        }
        catch (Exception ex)
        {
            _log.LogWarning(ex, "Plex: failed to fetch sessions");
            return [];
        }
    }

    private List<PlexSession> ParseSessions(string json)
    {
        var result = new List<PlexSession>();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        if (!root.TryGetProperty("MediaContainer", out var mc)) return result;
        if (!mc.TryGetProperty("Metadata", out var metadata) || metadata.ValueKind != JsonValueKind.Array)
            return result;

        foreach (var item in metadata.EnumerateArray())
        {
            string Str(string p) => item.TryGetProperty(p, out var v) ? (v.GetString() ?? "") : "";
            long   Lng(string p) => item.TryGetProperty(p, out var v) && v.ValueKind == JsonValueKind.Number ? v.GetInt64() : 0;
            int?   Int(string p) => item.TryGetProperty(p, out var v) && v.ValueKind == JsonValueKind.Number ? v.GetInt32() : null;

            var thumbPath = Str("thumb");
            var thumbUrl  = !string.IsNullOrEmpty(thumbPath)
                ? $"/api/plex/thumb?key={Uri.EscapeDataString(thumbPath)}"
                : null;

            var user = item.TryGetProperty("User", out var u) ? ChildStr(u, "title") : null;

            string? playerName = null, platform = null;
            var state = "playing";
            var local = true;
            if (item.TryGetProperty("Player", out var pl))
            {
                playerName = ChildStr(pl, "title");
                platform   = ChildStr(pl, "product") ?? ChildStr(pl, "platform");
                state      = ChildStr(pl, "state") ?? "playing";
                if (pl.TryGetProperty("local", out var lo) && (lo.ValueKind == JsonValueKind.False || lo.ValueKind == JsonValueKind.True))
                    local = lo.GetBoolean();
            }

            int? bandwidth = null;
            var sessionId = Str("sessionKey");
            if (item.TryGetProperty("Session", out var se))
            {
                sessionId = ChildStr(se, "id") ?? sessionId;
                if (se.TryGetProperty("bandwidth", out var bw) && bw.ValueKind == JsonValueKind.Number) bandwidth = bw.GetInt32();
                if (ChildStr(se, "location") is { } loc) local = loc == "lan";
            }

            // Transcode decision: TranscodeSession only exists when the server converts the stream
            var decision = "directplay";
            if (item.TryGetProperty("TranscodeSession", out var ts))
            {
                var video = ChildStr(ts, "videoDecision");
                var audio = ChildStr(ts, "audioDecision");
                decision = video == "transcode" || audio == "transcode" ? "transcode" : "directstream";
            }

            string? quality = null;
            if (item.TryGetProperty("Media", out var media) && media.ValueKind == JsonValueKind.Array && media.GetArrayLength() > 0)
                quality = FormatResolution(ChildStr(media[0], "videoResolution"));

            var gp = Str("grandparentTitle");
            result.Add(new PlexSession(
                Key:        Str("ratingKey"),
                SessionId:  string.IsNullOrEmpty(sessionId) ? Str("ratingKey") : sessionId,
                Title:      Str("title"),
                Type:       Str("type"),
                ThumbUrl:   thumbUrl,
                ShowTitle:  string.IsNullOrEmpty(gp) ? null : gp,
                Season:     Int("parentIndex"),
                Episode:    Int("index"),
                User:       user,
                PlayerName: playerName,
                Platform:   platform,
                State:      state,
                ViewOffset: Lng("viewOffset"),
                Duration:   Lng("duration"),
                Decision:   decision,
                Quality:    quality,
                Local:      local,
                Bandwidth:  bandwidth
            ));
        }
        return result;
    }

    public async Task<PlexStats?> GetStatsAsync()
    {
        if (_statsCache != null && DateTime.UtcNow < _statsExpiry)
            return _statsCache;
        if (string.IsNullOrEmpty(Token)) return null;

        try
        {
            using var root = await GetJsonAsync("/");
            var rootMc     = root.RootElement.GetProperty("MediaContainer");
            var machineId  = ChildStr(rootMc, "machineIdentifier");
            var serverName = ChildStr(rootMc, "friendlyName");

            using var sections = await GetJsonAsync("/library/sections");
            var weekAgo = DateTimeOffset.UtcNow.AddDays(-7).ToUnixTimeSeconds();
            int movies = 0, shows = 0, episodes = 0, added = 0;

            if (sections.RootElement.GetProperty("MediaContainer").TryGetProperty("Directory", out var dirs) &&
                dirs.ValueKind == JsonValueKind.Array)
            {
                foreach (var dir in dirs.EnumerateArray())
                {
                    var key  = ChildStr(dir, "key");
                    var type = ChildStr(dir, "type");
                    if (string.IsNullOrEmpty(key)) continue;

                    var basePath = $"/library/sections/{Uri.EscapeDataString(key)}/all";
                    if (type == "movie")
                    {
                        movies += await CountAsync(basePath, "");
                        added  += await CountAsync(basePath, $"addedAt%3E%3E={weekAgo}");
                    }
                    else if (type == "show")
                    {
                        shows    += await CountAsync(basePath, "");
                        episodes += await CountAsync(basePath, "type=4");
                        added    += await CountAsync(basePath, $"type=4&addedAt%3E%3E={weekAgo}");
                    }
                }
            }

            _statsCache  = new PlexStats(machineId, serverName, movies, shows, episodes, added);
            _statsExpiry = DateTime.UtcNow.Add(StatsCacheTtl);
            return _statsCache;
        }
        catch (Exception ex)
        {
            _log.LogWarning(ex, "Plex: failed to fetch library stats");
            return _statsCache; // keep showing the last known numbers
        }
    }

    /// Number of items behind a library query, without downloading them.
    private async Task<int> CountAsync(string path, string filter)
    {
        var query = string.IsNullOrEmpty(filter) ? "" : filter + "&";
        using var doc = await GetJsonAsync($"{path}?{query}X-Plex-Container-Start=0&X-Plex-Container-Size=0");
        var mc = doc.RootElement.GetProperty("MediaContainer");
        if (mc.TryGetProperty("totalSize", out var t) && t.ValueKind == JsonValueKind.Number) return t.GetInt32();
        if (mc.TryGetProperty("size",      out var s) && s.ValueKind == JsonValueKind.Number) return s.GetInt32();
        return 0;
    }

    private async Task<JsonDocument> GetJsonAsync(string pathAndQuery)
    {
        var sep  = pathAndQuery.Contains('?') ? '&' : '?';
        var url  = $"{ServerUrl}{pathAndQuery}{sep}X-Plex-Token={Uri.EscapeDataString(Token)}";
        var json = await CreateClient().GetStringAsync(url);
        return JsonDocument.Parse(json);
    }

    private static string? ChildStr(JsonElement el, string prop) =>
        el.ValueKind == JsonValueKind.Object && el.TryGetProperty(prop, out var v) && v.ValueKind == JsonValueKind.String
            ? v.GetString() : null;

    private static string? FormatResolution(string? res) => res?.ToLowerInvariant() switch
    {
        null or "" => null,
        "4k"       => "4K",
        "sd"       => "SD",
        var r when char.IsDigit(r[0]) => r + "p",
        var r      => r.ToUpperInvariant(),
    };

    /// Thumb keys must be server-relative paths like "/library/metadata/123/thumb/456".
    /// Anything else (e.g. "@evil.host/x" or "//host") could redirect the request — and the
    /// Plex token — to another server.
    public static bool IsSafeThumbKey(string? key) =>
        !string.IsNullOrWhiteSpace(key)
        && key.StartsWith("/library/", StringComparison.Ordinal)
        && !key.Contains("..")
        && !key.Contains('@')
        && !key.Contains('\\')
        && !key.Contains("//");

    public async Task<(Stream? stream, string contentType)> GetThumbAsync(string key)
    {
        if (string.IsNullOrEmpty(Token) || !IsSafeThumbKey(key)) return (null, "");
        try
        {
            var client  = CreateClient();
            var url     = $"{ServerUrl}{key}?X-Plex-Token={Uri.EscapeDataString(Token)}";
            var response = await client.GetAsync(url);
            if (!response.IsSuccessStatusCode) return (null, "");
            var ct     = response.Content.Headers.ContentType?.MediaType ?? "image/jpeg";
            var stream = await response.Content.ReadAsStreamAsync();
            return (stream, ct);
        }
        catch (Exception ex)
        {
            _log.LogWarning(ex, "Plex: failed to proxy thumb {Key}", key);
            return (null, "");
        }
    }

    // ── Helpers ─────────────────────────────────────────────────────────────────

    private async Task<List<PlexItem>> FetchItemsAsync(string path, int maxItems)
    {
        if (string.IsNullOrEmpty(Token))
            return [];

        try
        {
            var client   = CreateClient();
            var url      = $"{ServerUrl}{path}?X-Plex-Token={Uri.EscapeDataString(Token)}";
            var response = await client.GetStringAsync(url);
            return ParseItems(response, maxItems);
        }
        catch (Exception ex)
        {
            _log.LogWarning(ex, "Plex: failed to fetch {Path}", path);
            return [];
        }
    }

    private List<PlexItem> ParseItems(string json, int maxItems)
    {
        var result = new List<PlexItem>();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        JsonElement metadata;
        if (root.TryGetProperty("MediaContainer", out var mc) &&
            mc.TryGetProperty("Metadata", out metadata) &&
            metadata.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in metadata.EnumerateArray().Take(maxItems))
            {
                result.Add(ParseItem(item));
            }
        }

        return result;
    }

    private PlexItem ParseItem(JsonElement item)
    {
        string Str(string prop) =>
            item.TryGetProperty(prop, out var v) ? (v.GetString() ?? "") : "";

        int? Int(string prop) =>
            item.TryGetProperty(prop, out var v) && v.ValueKind == JsonValueKind.Number
                ? v.GetInt32() : null;

        var key            = Str("ratingKey");
        var title          = Str("title");
        var type           = Str("type");
        var thumbPath      = Str("thumb");
        var grandparent    = Str("grandparentTitle");
        var year           = Int("year");
        var parentIndex    = Int("parentIndex");
        var index          = Int("index");
        var summary        = Str("summary");

        long Lng(string prop) =>
            item.TryGetProperty(prop, out var v) && v.ValueKind == JsonValueKind.Number ? v.GetInt64() : 0;

        var thumbUrl = !string.IsNullOrEmpty(thumbPath)
            ? $"/api/plex/thumb?key={Uri.EscapeDataString(thumbPath)}"
            : null;

        return new PlexItem(
            Key:       key,
            Title:     title,
            Type:      type,
            ThumbUrl:  thumbUrl,
            Year:      year,
            ShowTitle: string.IsNullOrEmpty(grandparent) ? null : grandparent,
            Season:    parentIndex,
            Episode:   index,
            Summary:    string.IsNullOrEmpty(summary) ? null : summary,
            ViewOffset: Lng("viewOffset"),
            Duration:   Lng("duration"),
            AddedAt:    Lng("addedAt")
        );
    }

    private HttpClient CreateClient()
    {
        var client = _http.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(8);
        client.DefaultRequestHeaders.Add("Accept", "application/json");
        client.DefaultRequestHeaders.Add("X-Plex-Token", Token);
        return client;
    }
}
