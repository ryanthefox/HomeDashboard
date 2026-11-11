using System.Net;
using System.Text;

namespace HomeDashboard.Api.Services;

/// <summary>
/// Talks to the local Ring bridge (ring-bridge/, Node + ring-client-api), which keeps the
/// Ring session alive. This class only forwards requests; the bridge listens on 127.0.0.1.
/// </summary>
public sealed class RingService(IHttpClientFactory http, IConfiguration config)
{
    public string BridgeUrl { get; } = (config["Ring:BridgeUrl"] is { Length: > 0 } u ? u : "http://127.0.0.1:5057").TrimEnd('/');

    private HttpClient Client(TimeSpan? timeout = null)
    {
        var c = http.CreateClient();
        c.Timeout = timeout ?? TimeSpan.FromSeconds(20);
        return c;
    }

    /// <summary>Forwards a GET and returns (status, content type, body).</summary>
    public async Task<(HttpStatusCode Status, string ContentType, byte[] Body)> GetAsync(string path, TimeSpan? timeout = null)
    {
        try
        {
            using var res = await Client(timeout).GetAsync(BridgeUrl + path);
            return (res.StatusCode, res.Content.Headers.ContentType?.ToString() ?? "application/json", await res.Content.ReadAsByteArrayAsync());
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            return (HttpStatusCode.ServiceUnavailable, "application/json",
                Encoding.UTF8.GetBytes("{\"error\":\"De Ring-koppeling (ring-bridge) draait niet\",\"bridgeDown\":true}"));
        }
    }

    public async Task<(HttpStatusCode Status, string Body)> PostAsync(string path, string json)
    {
        try
        {
            using var res = await Client(TimeSpan.FromSeconds(60)).PostAsync(BridgeUrl + path, new StringContent(json, Encoding.UTF8, "application/json"));
            return (res.StatusCode, await res.Content.ReadAsStringAsync());
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            return (HttpStatusCode.ServiceUnavailable, "{\"error\":\"De Ring-koppeling (ring-bridge) draait niet\",\"bridgeDown\":true}");
        }
    }

    /// <summary>Opens the bridge's Server-Sent Events stream.</summary>
    public async Task<Stream> OpenStreamAsync(CancellationToken ct)
    {
        var c = http.CreateClient();
        c.Timeout = Timeout.InfiniteTimeSpan;
        var res = await c.GetAsync(BridgeUrl + "/stream", HttpCompletionOption.ResponseHeadersRead, ct);
        res.EnsureSuccessStatusCode();
        return await res.Content.ReadAsStreamAsync(ct);
    }
}
