using System.Net;
using System.Net.Http.Json;
using System.Net.Sockets;
using System.Text.Json;
using HomeDashboard.Api.Models;

namespace HomeDashboard.Api.Services;

/// <summary>
/// Talks to the HomeDashboard agent on the Windows PC (stats, sleep/shutdown)
/// and wakes the PC with a Wake-on-LAN magic packet.
/// Config section "Pc": AgentUrl, AgentKey, MacAddress, BroadcastAddress, Name.
/// </summary>
public sealed class PcService
{
    private readonly IHttpClientFactory  _http;
    private readonly IConfiguration      _config;
    private readonly ILogger<PcService>  _log;

    private PcStatus? _statusCache;
    private DateTime  _statusExpiry = DateTime.MinValue;
    private DateTime? _wakeSentAt;
    private DateTime? _powerOffAt;

    private static readonly TimeSpan StatusCacheTtl = TimeSpan.FromSeconds(3);
    private static readonly TimeSpan WakeWindow     = TimeSpan.FromMinutes(3);
    private static readonly TimeSpan PowerOffWindow = TimeSpan.FromSeconds(90);
    private static readonly JsonSerializerOptions JsonOpts = new(JsonSerializerDefaults.Web);

    public PcService(IHttpClientFactory http, IConfiguration config, ILogger<PcService> log)
    {
        _http   = http;
        _config = config;
        _log    = log;
    }

    private string? AgentUrl => NullIfEmpty(_config["Pc:AgentUrl"])?.TrimEnd('/');
    /// Media helper runs in the user's session on the next port (5056); override with Pc:MediaUrl.
    private string? MediaUrl => NullIfEmpty(_config["Pc:MediaUrl"])?.TrimEnd('/') ?? DeriveMediaUrl(AgentUrl);
    private string? AgentKey => NullIfEmpty(_config["Pc:AgentKey"]);
    private string? Mac      => NullIfEmpty(_config["Pc:MacAddress"]);
    private string  Name     => NullIfEmpty(_config["Pc:Name"]) ?? "PC";
    private string  Broadcast => NullIfEmpty(_config["Pc:BroadcastAddress"]) ?? "255.255.255.255";

    private bool HasAgent => AgentUrl != null && AgentKey != null;

    public async Task<PcStatus> GetStatusAsync()
    {
        if (_statusCache != null && DateTime.UtcNow < _statusExpiry)
            return _statusCache;

        string? hostname = null;
        long?   uptime   = null;
        var     online   = false;

        if (HasAgent)
        {
            try
            {
                using var client = CreateClient(TimeSpan.FromSeconds(2));
                var ping = await client.GetFromJsonAsync<AgentPing>($"{AgentUrl}/ping", JsonOpts);
                online   = ping != null;
                hostname = ping?.Hostname;
                uptime   = ping?.UptimeSeconds;
            }
            catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
            {
                // PC is off, asleep or the agent isn't running: that's the normal "offline" case
            }
        }

        var now = DateTime.UtcNow;
        if (online) _wakeSentAt = null;          // it woke up
        else        _powerOffAt = null;          // it went down

        var state = online
            ? (_powerOffAt != null && now - _powerOffAt < PowerOffWindow ? "stopping" : "online")
            : (_wakeSentAt != null && now - _wakeSentAt < WakeWindow ? "waking" : "offline");

        _statusCache = new PcStatus(
            Configured: HasAgent || Mac != null,
            HasAgent:   HasAgent,
            CanWake:    Mac != null,
            State:      state,
            Name:       Name,
            Hostname:   hostname,
            UptimeSeconds: uptime);
        _statusExpiry = now.Add(StatusCacheTtl);
        return _statusCache;
    }

    public async Task<SystemStats?> GetStatsAsync()
    {
        if (!HasAgent) return null;
        try
        {
            using var client = CreateClient(TimeSpan.FromSeconds(2.5));
            return await client.GetFromJsonAsync<SystemStats>($"{AgentUrl}/stats", JsonOpts);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or JsonException)
        {
            return null;
        }
    }

    /// Sends a Wake-on-LAN magic packet: 6 × 0xFF followed by the MAC address 16 times.
    public async Task<bool> WakeAsync()
    {
        if (Mac == null || !TryParseMac(Mac, out var mac)) return false;

        var packet = new byte[6 + 16 * 6];
        for (var i = 0; i < 6; i++) packet[i] = 0xFF;
        for (var i = 0; i < 16; i++) Buffer.BlockCopy(mac, 0, packet, 6 + i * 6, 6);

        var targets = new HashSet<string> { Broadcast, "255.255.255.255" };
        using var udp = new UdpClient { EnableBroadcast = true };
        foreach (var target in targets)
        {
            if (!IPAddress.TryParse(target, out var ip)) continue;
            foreach (var port in new[] { 9, 7 })
            {
                try { await udp.SendAsync(packet, packet.Length, new IPEndPoint(ip, port)); }
                catch (SocketException ex) { _log.LogWarning(ex, "WoL: send to {Ip}:{Port} failed", ip, port); }
            }
        }

        _log.LogInformation("WoL: magic packet sent to {Mac}", Mac);
        _wakeSentAt   = DateTime.UtcNow;
        _statusExpiry = DateTime.MinValue;
        return true;
    }

    public async Task<bool> PowerAsync(string action)
    {
        if (!HasAgent || action is not ("shutdown" or "sleep" or "restart")) return false;
        try
        {
            using var client = CreateClient(TimeSpan.FromSeconds(4));
            var res = await client.PostAsync($"{AgentUrl}/power/{action}", null);
            if (!res.IsSuccessStatusCode) return false;
            _powerOffAt   = action == "restart" ? null : DateTime.UtcNow;
            _statusExpiry = DateTime.MinValue;
            return true;
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            _log.LogWarning(ex, "PC agent: power action {Action} failed", action);
            return false;
        }
    }

    /// Now-playing media on the PC, or null when the PC/media helper isn't reachable.
    public async Task<MediaInfo?> GetMediaAsync()
    {
        if (!HasAgent || MediaUrl == null) return null;
        var status = await GetStatusAsync();
        if (status.State != "online") return null;   // don't wait on timeouts while the PC is off
        try
        {
            using var client = CreateClient(TimeSpan.FromSeconds(2));
            return await client.GetFromJsonAsync<MediaInfo>($"{MediaUrl}/media", JsonOpts);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or JsonException)
        {
            return null;   // not logged in yet, or the media helper isn't running
        }
    }

    public async Task<bool> MediaControlAsync(string command)
    {
        if (!HasAgent || MediaUrl == null || command is not ("play" or "pause" or "next" or "prev")) return false;
        try
        {
            using var client = CreateClient(TimeSpan.FromSeconds(3));
            var res = await client.PostAsync($"{MediaUrl}/media/{command}", null);
            if (!res.IsSuccessStatusCode) return false;
            var body = await res.Content.ReadFromJsonAsync<MediaCommandResult>(JsonOpts);
            return body?.Success ?? false;
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or JsonException)
        {
            return false;
        }
    }

    private static string? DeriveMediaUrl(string? agentUrl)
    {
        if (agentUrl == null || !Uri.TryCreate(agentUrl, UriKind.Absolute, out var uri)) return null;
        return new UriBuilder(uri) { Port = uri.Port + 1 }.Uri.ToString().TrimEnd('/');
    }

    private HttpClient CreateClient(TimeSpan timeout)
    {
        var client = _http.CreateClient();
        client.Timeout = timeout;
        client.DefaultRequestHeaders.Add("X-Agent-Key", AgentKey);
        return client;
    }

    private static bool TryParseMac(string text, out byte[] mac)
    {
        var hex = new string(text.Where(Uri.IsHexDigit).ToArray());
        mac = hex.Length == 12 ? Convert.FromHexString(hex) : [];
        return mac.Length == 6;
    }

    private static string? NullIfEmpty(string? s) => string.IsNullOrWhiteSpace(s) ? null : s.Trim();

    private sealed record AgentPing(string Hostname, long UptimeSeconds);
    private sealed record MediaCommandResult(bool Success);
}
