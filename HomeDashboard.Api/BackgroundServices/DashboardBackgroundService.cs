using HomeDashboard.Api.Hubs;
using HomeDashboard.Api.Services;
using Microsoft.AspNetCore.SignalR;

namespace HomeDashboard.Api.BackgroundServices;

public class DashboardBackgroundService : BackgroundService
{
    private readonly IHubContext<DashboardHub> _hub;
    private readonly WeatherService _weather;
    private readonly HueService _hue;
    private readonly MusicService _music;
    private readonly SystemMonitorService _system;
    private readonly AircoService _airco;
    private readonly ILogger<DashboardBackgroundService> _logger;

    private string? _lastWeatherJson, _lastMusicJson, _lastHueJson, _lastSystemJson, _lastAircoJson;

    public DashboardBackgroundService(
        IHubContext<DashboardHub> hub,
        WeatherService weather, HueService hue, MusicService music,
        SystemMonitorService system, AircoService airco,
        ILogger<DashboardBackgroundService> logger)
    {
        _hub = hub; _weather = weather; _hue = hue; _music = music;
        _system = system; _airco = airco; _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Dashboard background service started");
        await Task.WhenAll(
            RunPollerAsync("weather", TimeSpan.FromMinutes(10), PushWeatherAsync, stoppingToken),
            RunPollerAsync("hue",     TimeSpan.FromSeconds(4),  PushHueAsync,     stoppingToken),
            RunPollerAsync("music",   TimeSpan.FromSeconds(2),  PushMusicAsync,   stoppingToken),
            RunPollerAsync("system",  TimeSpan.FromSeconds(2),  PushSystemAsync,  stoppingToken),
            RunPollerAsync("airco",   TimeSpan.FromSeconds(30), PushAircoAsync,   stoppingToken)
        );
    }

    private async Task RunPollerAsync(string name, TimeSpan interval, Func<Task> poll, CancellationToken ct)
    {
        await SafePollAsync(name, poll);
        using var timer = new PeriodicTimer(interval);
        while (!ct.IsCancellationRequested && await timer.WaitForNextTickAsync(ct))
            await SafePollAsync(name, poll);
    }

    private async Task SafePollAsync(string name, Func<Task> poll)
    {
        try { await poll(); }
        catch (Exception ex) { _logger.LogWarning(ex, "Poll failed for {Widget}", name); }
    }

    private async Task PushWeatherAsync()
    {
        var data = await _weather.GetCurrentWeatherAsync();
        var json = System.Text.Json.JsonSerializer.Serialize(data);
        if (json == _lastWeatherJson) return;
        _lastWeatherJson = json;
        await _hub.Clients.Group("weather").SendAsync("WeatherUpdate", data);
    }

    private async Task PushHueAsync()
    {
        var rooms = await _hue.GetRoomsAsync();
        var json  = System.Text.Json.JsonSerializer.Serialize(rooms);
        if (json == _lastHueJson) return;
        _lastHueJson = json;
        await _hub.Clients.Group("hue").SendAsync("HueUpdate", rooms);
    }

    private async Task PushMusicAsync()
    {
        var media = await _music.GetCurrentMediaAsync();
        var json  = System.Text.Json.JsonSerializer.Serialize(media with { AlbumArtDataUrl = null });
        if (json == _lastMusicJson) return;
        _lastMusicJson = json;
        await _hub.Clients.Group("music").SendAsync("MusicUpdate", media);
    }

    private async Task PushSystemAsync()
    {
        var stats = _system.GetStats();
        var json  = System.Text.Json.JsonSerializer.Serialize(stats);
        if (json == _lastSystemJson) return;
        _lastSystemJson = json;
        await _hub.Clients.Group("system").SendAsync("SystemUpdate", stats);
    }

    private async Task PushAircoAsync()
    {
        var devices = await _airco.GetDevicesAsync();
        var json    = System.Text.Json.JsonSerializer.Serialize(devices);
        if (json == _lastAircoJson) return;
        _lastAircoJson = json;
        await _hub.Clients.Group("airco").SendAsync("AircoUpdate", devices);
    }
}
