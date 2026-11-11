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

    private static readonly TimeSpan CacheTtl     = TimeSpan.FromSeconds(30);
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

            var user       = item.TryGetProperty("User",   out var u) && u.TryGetProperty("title", out var ut) ? ut.GetString() : null;
            var playerName = item.TryGetProperty("Player", out var pl) && pl.TryGetProperty("title", out var pt) ? pt.GetString() : null;
            var state      = item.TryGetProperty("Player", out var pl2) && pl2.TryGetProperty("state", out var st) ? (st.GetString() ?? "playing") : "playing";

            var gp = Str("grandparentTitle");
            result.Add(new PlexSession(
                Key:        Str("ratingKey"),
                Title:      Str("title"),
                Type:       Str("type"),
                ThumbUrl:   thumbUrl,
                ShowTitle:  string.IsNullOrEmpty(gp) ? null : gp,
                Season:     Int("parentIndex"),
                Episode:    Int("index"),
                User:       user,
                PlayerName: playerName,
                State:      state,
                ViewOffset: Lng("viewOffset"),
                Duration:   Lng("duration")
            ));
        }
        return result;
    }

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
            Summary:   string.IsNullOrEmpty(summary) ? null : summary
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
