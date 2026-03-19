using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;

namespace HomeDashboard.Api.Services;

/// <summary>
/// Thin HTTP wrapper around the official LG ThinQ Connect API.
/// Docs: https://connect-api.lgthinq.com
/// </summary>
public sealed class LgThinqClient
{
    // Static API key shared by all ThinQ Connect clients (from pythinqconnect source)
    private const string ThinqApiKey = "v6GFvkweNo7DK7yD3ylIZ9w52aKBU0eJ7wLXkSR3";

    private readonly IHttpClientFactory   _factory;
    private readonly LgThinqOptions       _opts;
    private readonly ILogger<LgThinqClient> _log;

    public LgThinqClient(IHttpClientFactory factory, IOptions<LgThinqOptions> opts, ILogger<LgThinqClient> log)
    {
        _factory = factory;
        _opts    = opts.Value;
        _log     = log;
    }

    // ── Public methods ──────────────────────────────────────────────────────────

    public async Task<JsonElement?> GetDevicesAsync()
        => await SendAsync(HttpMethod.Get, "devices");

    public async Task<JsonElement?> GetDeviceStateAsync(string deviceId)
        => await SendAsync(HttpMethod.Get, $"devices/{Uri.EscapeDataString(deviceId)}/state");

    public async Task<JsonElement?> GetDeviceProfileAsync(string deviceId)
        => await SendAsync(HttpMethod.Get, $"devices/{Uri.EscapeDataString(deviceId)}/profile");

    public async Task<JsonElement?> ControlAsync(string deviceId, object payload)
        => await SendAsync(
            HttpMethod.Post,
            $"devices/{Uri.EscapeDataString(deviceId)}/control",
            payload);

    // ── Private helpers ─────────────────────────────────────────────────────────

    private async Task<JsonElement?> SendAsync(
        HttpMethod method,
        string endpoint,
        object? body = null,
        Dictionary<string, string>? extraHeaders = null)
    {
        if (string.IsNullOrWhiteSpace(_opts.PersonalAccessToken))
        {
            _log.LogWarning("LG ThinQ: PersonalAccessToken not configured");
            return null;
        }

        var url = $"{_opts.BaseUrl.TrimEnd('/')}/{endpoint}";
        using var http    = _factory.CreateClient();
        using var request = new HttpRequestMessage(method, url);

        // Standard ThinQ Connect headers
        request.Headers.TryAddWithoutValidation("Authorization",  $"Bearer {_opts.PersonalAccessToken}");
        request.Headers.TryAddWithoutValidation("x-api-key",      ThinqApiKey);
        request.Headers.TryAddWithoutValidation("x-country",      _opts.CountryCode);
        request.Headers.TryAddWithoutValidation("x-client-id",    EnsureClientId());
        request.Headers.TryAddWithoutValidation("x-message-id",   GenerateMessageId());
        request.Headers.TryAddWithoutValidation("x-service-phase","OP");

        if (extraHeaders != null)
            foreach (var (k, v) in extraHeaders)
                request.Headers.TryAddWithoutValidation(k, v);

        if (body != null)
            request.Content = new StringContent(
                JsonSerializer.Serialize(body),
                Encoding.UTF8,
                "application/json");

        _log.LogDebug("LG ThinQ → {Method} {Url}", method.Method, url);

        using var resp = await http.SendAsync(request);
        var raw = await resp.Content.ReadAsStringAsync();

        _log.LogDebug("LG ThinQ ← {Status}: {Body}", (int)resp.StatusCode,
            raw.Length > 300 ? raw[..300] : raw);

        if (!resp.IsSuccessStatusCode)
        {
            _log.LogError("LG ThinQ {Method} {Url} → {Status}: {Body}",
                method.Method, url, resp.StatusCode, raw.Length > 500 ? raw[..500] : raw);
            return null;
        }

        try
        {
            var doc = JsonSerializer.Deserialize<JsonElement>(raw);
            // Unwrap "response" envelope if present
            return doc.TryGetProperty("response", out var inner) ? inner : doc;
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "LG ThinQ: failed to parse response JSON");
            return null;
        }
    }

    private string EnsureClientId()
    {
        // If no ClientId configured, generate one and warn — the user should persist it
        if (!string.IsNullOrWhiteSpace(_opts.ClientId)) return _opts.ClientId;
        _log.LogWarning("LG ThinQ: ClientId not set in config. Using temp ID — set a fixed UUID in appsettings.json");
        return Guid.NewGuid().ToString();
    }

    /// x-message-id: base64url-encoded UUID v4 bytes, last 2 chars stripped
    private static string GenerateMessageId()
    {
        var bytes = Guid.NewGuid().ToByteArray();
        return Convert.ToBase64String(bytes)
            .Replace('+', '-').Replace('/', '_').TrimEnd('=')[..^2];
    }
}
