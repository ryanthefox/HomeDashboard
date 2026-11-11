using System.Net;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace HomeDashboard.Api.Services;

public record SpotifyStatus(bool Configured, bool Connected, string RedirectUri, string? User, string? Product, string? Error, bool CanStream = false, string? HttpsUrl = null);
public record SpotifyDevice(string Id, string Name, string Type, bool IsActive, int? Volume, bool Restricted, bool SupportsVolume = true);
public record SpotifyTrack(string Id, string Uri, string Name, string Artists, string? Album, string? Image, int DurationMs);
public record SpotifyPlayback(bool IsPlaying, int ProgressMs, SpotifyTrack? Track, SpotifyDevice? Device, bool Shuffle, string Repeat, string? ContextUri);
public record SpotifyItem(string Id, string Uri, string Kind, string Name, string? Subtitle, string? Image);

/// <summary>
/// Spotify Web API: log in once (authorization code flow), then control playback on any
/// Spotify Connect device (Sonos, speakers, phone, pc…). Playback control needs Spotify Premium.
/// </summary>
public sealed class SpotifyService(IHttpClientFactory http, IConfiguration config, ILogger<SpotifyService> log)
{
    private const string Api = "https://api.spotify.com/v1/";
    private const string Scopes = "user-read-playback-state user-modify-playback-state user-read-currently-playing " +
                                  "playlist-read-private playlist-read-collaborative user-library-read user-read-recently-played user-read-private " +
                                  "streaming user-read-email"; // streaming + email: play inside the browser (Web Playback SDK)

    private string ClientId => config["Spotify:ClientId"] ?? "";
    private string ClientSecret => config["Spotify:ClientSecret"] ?? "";
    public string RedirectUri => config["Spotify:RedirectUri"] is { Length: > 0 } r ? r : "http://127.0.0.1:8888/callback";
    public bool Configured => ClientId.Length > 0 && ClientSecret.Length > 0;
    /// <summary>Public https address of the dashboard (DuckDNS), if set up.</summary>
    private string? HttpsUrl => config["App:PublicUrl"] is { Length: > 0 } u ? u.TrimEnd('/') : null;

    private readonly SemaphoreSlim _lock = new(1, 1);
    private string? _state;
    private string? _accessToken;
    private DateTime _expires;
    private (string? Name, string? Product)? _me;

    private string TokenFile
    {
        get
        {
            var dir = config["Auth:KeysPath"];
            if (string.IsNullOrWhiteSpace(dir)) dir = Path.Combine(AppContext.BaseDirectory, "keys");
            return Path.Combine(dir, "spotify.json");
        }
    }

    private JsonNode? TokenJson
    {
        get
        {
            try { return File.Exists(TokenFile) ? JsonNode.Parse(File.ReadAllText(TokenFile)) : null; }
            catch { return null; }
        }
    }

    private string? RefreshToken => TokenJson?["refreshToken"]?.GetValue<string>();

    /// <summary>Scopes the user granted at login (older logins lack 'streaming').</summary>
    private string GrantedScope => TokenJson?["scope"]?.GetValue<string>() ?? "";

    /// <summary>True when the login allows playing inside the browser (Web Playback SDK).</summary>
    public bool CanStream => GrantedScope.Split(' ').Contains("streaming");

    private void SaveToken(string? refreshToken, string? scope)
    {
        var current = TokenJson as JsonObject;
        var rt = refreshToken ?? current?["refreshToken"]?.GetValue<string>();
        if (rt == null) return;
        Directory.CreateDirectory(Path.GetDirectoryName(TokenFile)!);
        File.WriteAllText(TokenFile, new JsonObject
        {
            ["refreshToken"] = rt,
            ["scope"] = scope ?? current?["scope"]?.GetValue<string>(),
            ["savedAt"] = DateTime.UtcNow.ToString("o"),
        }.ToJsonString());
    }

    // ── Login ─────────────────────────────────────────────────────────────────
    public string LoginUrl()
    {
        _state = Convert.ToHexString(RandomNumberGenerator.GetBytes(16)).ToLowerInvariant();
        return "https://accounts.spotify.com/authorize?response_type=code" +
               $"&client_id={Uri.EscapeDataString(ClientId)}&scope={Uri.EscapeDataString(Scopes)}" +
               $"&redirect_uri={Uri.EscapeDataString(RedirectUri)}&state={_state}&show_dialog=true";
    }

    /// <summary>Accepts the code, or the whole address Spotify sent the browser back to.</summary>
    public async Task<string?> CompleteLoginAsync(string codeOrUrl, string? state = null)
    {
        var input = codeOrUrl.Trim();
        string? code = input;
        if (input.Contains("code=") || input.Contains("error="))
        {
            var query = input.Contains('?') ? input[(input.IndexOf('?') + 1)..] : input;
            var parts = query.Split('&').Select(p => p.Split('=', 2)).Where(p => p.Length == 2)
                .ToDictionary(p => p[0], p => Uri.UnescapeDataString(p[1]));
            if (parts.TryGetValue("error", out var err)) return err == "access_denied" ? "Je hebt de toegang geweigerd" : $"Spotify: {err}";
            code = parts.GetValueOrDefault("code");
            state ??= parts.GetValueOrDefault("state");
        }
        if (string.IsNullOrEmpty(code)) return "Geen code gevonden — plak het hele adres uit de adresbalk";
        if (state != null && _state != null && state != _state) return "Deze inloglink is verlopen — klik opnieuw op 'Spotify koppelen'";

        var res = await TokenRequestAsync(new Dictionary<string, string>
        {
            ["grant_type"] = "authorization_code", ["code"] = code, ["redirect_uri"] = RedirectUri,
        });
        if (res is null) return "Inloggen bij Spotify mislukt — probeer het opnieuw (een code werkt maar één keer)";
        _state = null;
        return null;
    }

    /// <summary>The login link this dashboard handed out most recently (protects the anonymous callback).</summary>
    public bool StateMatches(string? state) => state != null && _state != null && state == _state;

    public void Logout()
    {
        try { File.Delete(TokenFile); } catch { /* ignore */ }
        _accessToken = null; _me = null;
    }

    private async Task<JsonNode?> TokenRequestAsync(Dictionary<string, string> form)
    {
        var req = new HttpRequestMessage(HttpMethod.Post, "https://accounts.spotify.com/api/token") { Content = new FormUrlEncodedContent(form) };
        req.Headers.Authorization = new AuthenticationHeaderValue("Basic", Convert.ToBase64String(Encoding.UTF8.GetBytes($"{ClientId}:{ClientSecret}")));
        using var res = await http.CreateClient().SendAsync(req);
        var text = await res.Content.ReadAsStringAsync();
        if (!res.IsSuccessStatusCode) { log.LogWarning("Spotify token request failed: {Status} {Body}", (int)res.StatusCode, text); return null; }
        var json = JsonNode.Parse(text)!;
        _accessToken = json["access_token"]!.GetValue<string>();
        _expires = DateTime.UtcNow.AddSeconds(json["expires_in"]!.GetValue<int>() - 60);
        var newRefresh = json["refresh_token"]?.GetValue<string>() is { Length: > 0 } rt ? rt : null;
        var scope = json["scope"]?.GetValue<string>();
        if (newRefresh != null || (scope != null && scope != GrantedScope)) SaveToken(newRefresh, scope);
        _me = null;
        return json;
    }

    private async Task<string?> TokenAsync()
    {
        if (_accessToken != null && DateTime.UtcNow < _expires) return _accessToken;
        await _lock.WaitAsync();
        try
        {
            if (_accessToken != null && DateTime.UtcNow < _expires) return _accessToken;
            var refresh = RefreshToken;
            if (refresh == null) return null;
            var res = await TokenRequestAsync(new Dictionary<string, string> { ["grant_type"] = "refresh_token", ["refresh_token"] = refresh });
            return res == null ? null : _accessToken;
        }
        finally { _lock.Release(); }
    }

    /// <summary>Short-lived access token for the in-browser player (Web Playback SDK).</summary>
    public async Task<(string Token, int ExpiresIn)> PlayerTokenAsync()
    {
        var token = await TokenAsync() ?? throw new SpotifyException(HttpStatusCode.Unauthorized, "Spotify is niet gekoppeld");
        return (token, (int)Math.Max(60, (_expires - DateTime.UtcNow).TotalSeconds));
    }

    // ── API helper ────────────────────────────────────────────────────────────
    public sealed class SpotifyException(HttpStatusCode status, string message) : Exception(message) { public HttpStatusCode Status { get; } = status; }

    private async Task<JsonNode?> SendAsync(HttpMethod method, string path, object? body = null)
    {
        var token = await TokenAsync() ?? throw new SpotifyException(HttpStatusCode.Unauthorized, "Spotify is niet gekoppeld");
        var req = new HttpRequestMessage(method, Api + path);
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        if (body != null) req.Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");
        else if (method != HttpMethod.Get) req.Content = new StringContent("", Encoding.UTF8, "application/json");
        using var res = await http.CreateClient().SendAsync(req);
        var text = await res.Content.ReadAsStringAsync();
        if (res.IsSuccessStatusCode)
        {
            // Player commands answer 200/204 with an empty or non-JSON body (e.g. a snapshot id) — that's still a success.
            if (string.IsNullOrWhiteSpace(text)) return null;
            try { return JsonNode.Parse(text); } catch (JsonException) { return null; }
        }

        string? apiMessage = null, reason = null;
        try
        {
            var err = JsonNode.Parse(text)?["error"];
            apiMessage = err?["message"]?.GetValue<string>();
            reason = err?["reason"]?.GetValue<string>();
        }
        catch { /* not json */ }

        // 403 has many causes — only one of them is a missing Premium subscription.
        string msg = (res.StatusCode, reason) switch
        {
            (HttpStatusCode.NotFound, _) => "Geen actief afspeelapparaat — kies eerst een apparaat",
            (HttpStatusCode.TooManyRequests, _) => "Even te veel verzoeken naar Spotify, probeer het zo opnieuw",
            (HttpStatusCode.Forbidden, "PREMIUM_REQUIRED") => "Spotify Premium is nodig om af te spelen vanuit het dashboard",
            (HttpStatusCode.Forbidden, "VOLUME_CONTROL_DISALLOW") => "Dit apparaat laat het volume niet op afstand regelen — pas het volume op het apparaat zelf aan",
            (HttpStatusCode.Forbidden, "UNKNOWN") when apiMessage?.Contains("volume", StringComparison.OrdinalIgnoreCase) == true
                => "Dit apparaat laat het volume niet op afstand regelen — pas het volume op het apparaat zelf aan",
            (HttpStatusCode.Forbidden, "ALREADY_PAUSED") => "Staat al op pauze",
            (HttpStatusCode.Forbidden, "ALREADY_PLAYING") or (HttpStatusCode.Forbidden, "ENDLESS_CONTEXT") => "Dat kan hier niet",
            (HttpStatusCode.Forbidden, "NO_PREV_TRACK") => "Er is geen vorig nummer",
            (HttpStatusCode.Forbidden, "NO_NEXT_TRACK") => "Er is geen volgend nummer",
            (HttpStatusCode.Forbidden, "DISALLOWED") or (HttpStatusCode.Forbidden, "UNKNOWN") or (HttpStatusCode.Forbidden, null)
                => apiMessage is { Length: > 0 } ? $"Spotify staat dit niet toe: {apiMessage}" : "Spotify staat dit op dit apparaat niet toe",
            (HttpStatusCode.Forbidden, _) => $"Spotify staat dit niet toe ({reason})",
            _ => apiMessage is { Length: > 0 } ? $"Spotify: {apiMessage}" : $"Spotify: {(int)res.StatusCode}",
        };
        log.LogInformation("Spotify {Method} {Path} -> {Status} {Reason} {Message}", method, path, (int)res.StatusCode, reason, apiMessage);
        throw new SpotifyException(res.StatusCode, msg);
    }

    // ── Status ────────────────────────────────────────────────────────────────
    public async Task<SpotifyStatus> GetStatusAsync()
    {
        if (!Configured) return new(false, false, RedirectUri, null, null, null);
        if (RefreshToken == null) return new(true, false, RedirectUri, null, null, null);
        try
        {
            if (_me == null)
            {
                var me = await SendAsync(HttpMethod.Get, "me");
                _me = (me?["display_name"]?.GetValue<string>() ?? me?["id"]?.GetValue<string>(), me?["product"]?.GetValue<string>());
            }
            return new(true, true, RedirectUri, _me.Value.Name, _me.Value.Product, null, CanStream, HttpsUrl);
        }
        catch (SpotifyException ex) when (ex.Status == HttpStatusCode.Unauthorized)
        {
            return new(true, false, RedirectUri, null, null, "Koppeling verlopen — koppel Spotify opnieuw");
        }
        catch (Exception ex) { return new(true, true, RedirectUri, null, null, ex.Message); }
    }

    // ── Mapping ───────────────────────────────────────────────────────────────
    private static string? Img(JsonNode? images) =>
        images is JsonArray a && a.Count > 0 ? (a.Count > 1 ? a[1] : a[0])?["url"]?.GetValue<string>() : null;

    private static SpotifyTrack? Track(JsonNode? t)
    {
        if (t == null) return null;
        var artists = string.Join(", ", (t["artists"] as JsonArray ?? []).Select(a => a?["name"]?.GetValue<string>()).Where(n => n != null));
        if (artists.Length == 0) artists = t["show"]?["name"]?.GetValue<string>() ?? ""; // podcast episode
        return new SpotifyTrack(
            t["id"]?.GetValue<string>() ?? "", t["uri"]?.GetValue<string>() ?? "", t["name"]?.GetValue<string>() ?? "", artists,
            t["album"]?["name"]?.GetValue<string>() ?? t["show"]?["name"]?.GetValue<string>(),
            Img(t["album"]?["images"]) ?? Img(t["images"]),
            t["duration_ms"]?.GetValue<int>() ?? 0);
    }

    private static SpotifyDevice Device(JsonNode d) => new(
        d["id"]?.GetValue<string>() ?? "", d["name"]?.GetValue<string>() ?? "", d["type"]?.GetValue<string>() ?? "",
        d["is_active"]?.GetValue<bool>() ?? false, d["volume_percent"]?.GetValue<int>(), d["is_restricted"]?.GetValue<bool>() ?? false,
        d["supports_volume"]?.GetValue<bool>() ?? true);

    // ── Player ────────────────────────────────────────────────────────────────
    public async Task<SpotifyPlayback?> GetPlaybackAsync()
    {
        var p = await SendAsync(HttpMethod.Get, "me/player?additional_types=episode");
        if (p == null) return null;
        return new SpotifyPlayback(
            p["is_playing"]?.GetValue<bool>() ?? false, p["progress_ms"]?.GetValue<int>() ?? 0, Track(p["item"]),
            p["device"] is { } d ? Device(d) : null, p["shuffle_state"]?.GetValue<bool>() ?? false,
            p["repeat_state"]?.GetValue<string>() ?? "off", p["context"]?["uri"]?.GetValue<string>());
    }

    public async Task<List<SpotifyDevice>> GetDevicesAsync()
    {
        var j = await SendAsync(HttpMethod.Get, "me/player/devices");
        return (j?["devices"] as JsonArray ?? []).Where(d => d != null).Select(d => Device(d!)).ToList();
    }

    private static string Dev(string? deviceId) => string.IsNullOrEmpty(deviceId) ? "" : $"device_id={Uri.EscapeDataString(deviceId)}";

    public Task Play(string? deviceId, string? contextUri, string[]? uris, int? offset)
    {
        object? body = contextUri != null
            ? (offset is { } o ? new { context_uri = contextUri, offset = new { position = o } } : new { context_uri = contextUri })
            : uris is { Length: > 0 } ? new { uris } : null;
        return SendAsync(HttpMethod.Put, $"me/player/play?{Dev(deviceId)}", body);
    }
    public Task Pause() => SendAsync(HttpMethod.Put, "me/player/pause");
    public Task Next() => SendAsync(HttpMethod.Post, "me/player/next");
    public Task Previous() => SendAsync(HttpMethod.Post, "me/player/previous");
    public Task Seek(int ms) => SendAsync(HttpMethod.Put, $"me/player/seek?position_ms={Math.Max(0, ms)}");
    public Task Volume(int pct) => SendAsync(HttpMethod.Put, $"me/player/volume?volume_percent={Math.Clamp(pct, 0, 100)}");
    public Task Shuffle(bool on) => SendAsync(HttpMethod.Put, $"me/player/shuffle?state={(on ? "true" : "false")}");
    public Task Repeat(string mode) => SendAsync(HttpMethod.Put, $"me/player/repeat?state={(mode is "track" or "context" ? mode : "off")}");
    public Task Transfer(string deviceId, bool play) => SendAsync(HttpMethod.Put, "me/player", new { device_ids = new[] { deviceId }, play });

    // ── Library / search ──────────────────────────────────────────────────────
    public async Task<List<SpotifyItem>> GetPlaylistsAsync()
    {
        var j = await SendAsync(HttpMethod.Get, "me/playlists?limit=50");
        return (j?["items"] as JsonArray ?? []).Where(p => p != null).Select(p => new SpotifyItem(
            p!["id"]?.GetValue<string>() ?? "", p["uri"]?.GetValue<string>() ?? "", "playlist", p["name"]?.GetValue<string>() ?? "",
            p["owner"]?["display_name"]?.GetValue<string>(), Img(p["images"]))).ToList();
    }

    public async Task<List<SpotifyItem>> GetRecentAsync()
    {
        var j = await SendAsync(HttpMethod.Get, "me/player/recently-played?limit=30");
        var seen = new HashSet<string>();
        var list = new List<SpotifyItem>();
        foreach (var it in j?["items"] as JsonArray ?? [])
        {
            if (Track(it?["track"]) is not { } t || !seen.Add(t.Uri)) continue;
            list.Add(new SpotifyItem(t.Id, t.Uri, "track", t.Name, t.Artists, t.Image));
        }
        return list;
    }

    public async Task<List<SpotifyItem>> SearchAsync(string q)
    {
        if (string.IsNullOrWhiteSpace(q)) return [];
        var j = await SendAsync(HttpMethod.Get, $"search?q={Uri.EscapeDataString(q)}&type=track,artist,album,playlist&limit=6&market=from_token");
        var list = new List<SpotifyItem>();
        foreach (var t in j?["tracks"]?["items"] as JsonArray ?? [])
            if (Track(t) is { } tr) list.Add(new(tr.Id, tr.Uri, "track", tr.Name, tr.Artists, tr.Image));
        foreach (var a in j?["artists"]?["items"] as JsonArray ?? [])
            if (a != null) list.Add(new(a["id"]?.GetValue<string>() ?? "", a["uri"]?.GetValue<string>() ?? "", "artist", a["name"]?.GetValue<string>() ?? "", "Artiest", Img(a["images"])));
        foreach (var a in j?["albums"]?["items"] as JsonArray ?? [])
            if (a != null) list.Add(new(a["id"]?.GetValue<string>() ?? "", a["uri"]?.GetValue<string>() ?? "", "album", a["name"]?.GetValue<string>() ?? "",
                string.Join(", ", (a["artists"] as JsonArray ?? []).Select(x => x?["name"]?.GetValue<string>())), Img(a["images"])));
        foreach (var p in j?["playlists"]?["items"] as JsonArray ?? [])
            if (p != null) list.Add(new(p["id"]?.GetValue<string>() ?? "", p["uri"]?.GetValue<string>() ?? "", "playlist", p["name"]?.GetValue<string>() ?? "",
                p["owner"]?["display_name"]?.GetValue<string>(), Img(p["images"])));
        return list;
    }
}
