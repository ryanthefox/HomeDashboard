using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Text;
using HomeDashboard.Api.Services;

// HomeDashboard PC agent
// ──────────────────────
// Runs on the Windows PC (started at boot by a scheduled task, see install-agent.ps1).
// The dashboard server polls it for hardware stats and asks it to sleep / shut down.
// Every request must carry the shared secret in the "X-Agent-Key" header.

var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    Args            = args,
    ContentRootPath = AppContext.BaseDirectory,   // find appsettings.json when started as a task
});

var port = builder.Configuration.GetValue("Agent:Port", 5055);
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
builder.Services.AddSingleton<SystemMonitorService>();

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
