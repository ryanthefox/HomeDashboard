using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Text;
using HomeDashboard.Api.Services;

// HomeDashboard PC agent
// ──────────────────────
// Runs on the Windows PC (started by scheduled tasks, see install-agent.ps1). Two modes:
//   default  → hardware stats + sleep/restart/shutdown. Runs as SYSTEM at boot.
//   --media  → now-playing media + play/pause/skip + sound output device. Runs in the user's
//              session at logon, because Windows keeps media sessions and the default audio
//              device per logged-in user.
// Every request must carry the shared secret in the "X-Agent-Key" header.

var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    Args            = args,
    ContentRootPath = AppContext.BaseDirectory,   // find appsettings.json when started as a task
});

var mediaMode = args.Contains("--media");
var basePort  = builder.Configuration.GetValue("Agent:Port", 5055);
var port      = mediaMode ? builder.Configuration.GetValue("Agent:MediaPort", basePort + 1) : basePort;
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
if (mediaMode) { builder.Services.AddSingleton<MusicService>(); builder.Services.AddSingleton<AudioService>(); }
else           builder.Services.AddSingleton<SystemMonitorService>();

var app = builder.Build();
var key = LoadOrCreateKey(app.Configuration["Agent:Key"]);
var keyBytes = Encoding.UTF8.GetBytes(key);

// ── Auth: shared secret, compared in constant time ──────────────────────────────
app.Use(async (ctx, next) =>
{
    var given = Encoding.UTF8.GetBytes(ctx.Request.Headers["X-Agent-Key"].ToString());
    if (!CryptographicOperations.FixedTimeEquals(given, keyBytes))
    {
        ctx.Response.StatusCode = StatusCodes.Status401Unauthorized;
        return;
    }
    await next();
});

app.MapGet("/ping", () => new
{
    hostname      = Environment.MachineName,
    uptimeSeconds = Environment.TickCount64 / 1000,
});

if (mediaMode)
{
    app.MapGet("/media", (MusicService music) => music.GetCurrentMediaAsync());
    app.MapPost("/media/{command}", async (string command, MusicService music) =>
    {
        var ok = command switch
        {
            "play"  => await music.PlayAsync(),
            "pause" => await music.PauseAsync(),
            "next"  => await music.SkipNextAsync(),
            "prev"  => await music.SkipPreviousAsync(),
            _       => (bool?)null,
        };
        return ok == null ? Results.BadRequest(new { error = "Onbekende actie" }) : Results.Ok(new { success = ok });
    });
    app.MapGet("/audio/outputs", (AudioService audio) => audio.GetOutputDevices());
    app.MapPost("/audio/outputs/default", (AudioDeviceRequest req, AudioService audio) =>
    {
        if (string.IsNullOrWhiteSpace(req.DeviceId)) return Results.BadRequest(new { error = "Geen apparaat opgegeven" });
        // Windows silently ignores unknown ids, so check the device exists first
        if (!audio.GetOutputDevices().Any(d => d.Id == req.DeviceId)) return Results.NotFound(new { error = "Apparaat niet gevonden" });
        try   { audio.SetDefaultDevice(req.DeviceId); return Results.NoContent(); }
        catch (Exception ex) { return Results.BadRequest(new { error = ex.Message }); }
    });
    app.Run();
    return;
}

app.MapGet("/stats", (SystemMonitorService monitor) => monitor.GetStats());

app.MapPost("/power/{command}", (string command, ILogger<Program> log) =>
{
    Action? run = command switch
    {
        "shutdown" => () => Process.Start(new ProcessStartInfo("shutdown", "/s /t 0") { CreateNoWindow = true }),
        "restart"  => () => Process.Start(new ProcessStartInfo("shutdown", "/r /t 0") { CreateNoWindow = true }),
        "sleep"    => () => SetSuspendState(hibernate: false, forceCritical: false, disableWakeEvent: false),
        _          => null,
    };
    if (run == null) return Results.BadRequest(new { error = "Onbekende actie" });

    log.LogWarning("Power action requested: {Command}", command);
    // Reply first, then act, so the dashboard gets its answer before the network goes away.
    _ = Task.Run(async () => { await Task.Delay(1500); run(); });
    return Results.Accepted();
});

app.Run();

// The key comes from appsettings.json, or else from agent.key next to the exe (created on first run).
static string LoadOrCreateKey(string? configured)
{
    if (!string.IsNullOrWhiteSpace(configured)) return configured.Trim();

    var path = Path.Combine(AppContext.BaseDirectory, "agent.key");
    if (File.Exists(path))
    {
        var existing = File.ReadAllText(path).Trim();
        if (existing.Length > 0) return existing;
    }
    var created = Convert.ToHexString(RandomNumberGenerator.GetBytes(24)).ToLowerInvariant();
    File.WriteAllText(path, created);
    return created;
}

[DllImport("powrprof.dll", SetLastError = true)]
static extern bool SetSuspendState(bool hibernate, bool forceCritical, bool disableWakeEvent);

record AudioDeviceRequest(string DeviceId);
