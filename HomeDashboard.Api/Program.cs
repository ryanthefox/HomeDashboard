using HomeDashboard.Api.BackgroundServices;
using HomeDashboard.Api.Hubs;
using System.Threading.RateLimiting;
using HomeDashboard.Api.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.FileProviders;
// SystemMonitorService is registered below

var builder = WebApplication.CreateBuilder(args);

// ── Login ────────────────────────────────────────────────────────────────────
// One shared password (Auth:Password). When set, every API call and the SignalR hub
// require the login cookie; when empty, the dashboard stays open (local dev).
var dashboardAuth = new DashboardAuth(builder.Configuration);
builder.Services.AddSingleton(dashboardAuth);

// Persist the cookie-encryption keys, otherwise every restart/redeploy logs everyone out.
var keysPath = builder.Configuration["Auth:KeysPath"];
if (string.IsNullOrWhiteSpace(keysPath)) keysPath = Path.Combine(AppContext.BaseDirectory, "keys");
builder.Services.AddDataProtection()
    .SetApplicationName("HomeDashboard")
    .PersistKeysToFileSystem(new DirectoryInfo(keysPath));

builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(o =>
    {
        o.Cookie.Name = "hd_auth";
        o.Cookie.HttpOnly = true;
        o.Cookie.SameSite = SameSiteMode.Lax;
        o.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
        o.ExpireTimeSpan = TimeSpan.FromDays(365);
        o.SlidingExpiration = true;
        // API: answer 401/403 instead of redirecting to a login page
        o.Events.OnRedirectToLogin = ctx => { ctx.Response.StatusCode = 401; return Task.CompletedTask; };
        o.Events.OnRedirectToAccessDenied = ctx => { ctx.Response.StatusCode = 403; return Task.CompletedTask; };
        // Password changed → old cookies are no longer valid
        o.Events.OnValidatePrincipal = async ctx =>
        {
            if (ctx.Principal?.FindFirst(DashboardAuth.StampClaim)?.Value != dashboardAuth.Stamp)
            {
                ctx.RejectPrincipal();
                await ctx.HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            }
        };
    });

builder.Services.AddAuthorization(o =>
{
    if (dashboardAuth.Required)
        o.FallbackPolicy = new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build();
});

// Max 5 login attempts per minute per IP
builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    o.AddPolicy("login", ctx => RateLimitPartition.GetFixedWindowLimiter(
        ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 5, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 }));
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddSignalR(opts =>
{
    opts.EnableDetailedErrors = builder.Environment.IsDevelopment();
    opts.MaximumReceiveMessageSize = 512 * 1024;
});

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy
            .WithOrigins("http://localhost:5173", "http://localhost:4173")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

builder.Services.AddHttpClient();

builder.Services.AddSingleton<WeatherService>();
builder.Services.AddSingleton<HueService>();
builder.Services.AddSingleton<MusicService>();
builder.Services.AddSingleton<SystemMonitorService>();
builder.Services.AddSingleton<AudioService>();

builder.Services.Configure<LgThinqOptions>(builder.Configuration.GetSection("LgThinq"));
builder.Services.AddSingleton<LgThinqClient>();
builder.Services.AddSingleton<AircoService>();
builder.Services.AddSingleton<WasherService>();

builder.Services.AddSingleton<AfvalService>();
builder.Services.AddSingleton<PlexService>();
builder.Services.AddSingleton<PcService>();

builder.Services.AddHostedService<DashboardBackgroundService>();

var app = builder.Build();

// Locate the built React app.
// Published exe: AppContext.BaseDirectory = release\app\ → release\frontend\dist
// dotnet run:    current dir = HomeDashboard.Api\       → frontend\dist
var frontendDist = new[]
    {
        Path.Combine(AppContext.BaseDirectory, "frontend", "dist"),           // Docker: /app/frontend/dist
        Path.Combine(AppContext.BaseDirectory, "..", "frontend", "dist"),     // published exe layout
        Path.Combine(Directory.GetCurrentDirectory(), "..", "frontend", "dist"), // dotnet run
    }
    .Select(Path.GetFullPath)
    .FirstOrDefault(Directory.Exists);

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();

if (frontendDist != null)
{
    app.Logger.LogInformation("Serving frontend from: {Path}", frontendDist);
    var fp = new PhysicalFileProvider(frontendDist);
    app.UseDefaultFiles(new DefaultFilesOptions { FileProvider = fp });
    app.UseStaticFiles(new StaticFileOptions { FileProvider = fp });
}
else
{
    app.Logger.LogWarning("frontend/dist niet gevonden – draai eerst publish.bat");
}

if (!dashboardAuth.Required)
    app.Logger.LogWarning("Geen Auth:Password ingesteld – het dashboard is zonder inloggen bereikbaar");

app.UseAuthentication();
app.UseRateLimiter();
app.UseAuthorization();
app.MapControllers();
app.MapHub<DashboardHub>("/hubs/dashboard");

// SPA fallback: serve index.html for unknown routes (the login screen lives in the SPA)
app.MapFallback(async ctx =>
{
    if (frontendDist == null)
    {
        ctx.Response.StatusCode = 503;
        await ctx.Response.WriteAsync("Frontend niet gevonden. Draai eerst publish.bat.");
        return;
    }
    ctx.Response.ContentType = "text/html";
    await ctx.Response.SendFileAsync(Path.Combine(frontendDist, "index.html"));
}).AllowAnonymous();

if (!builder.Environment.IsDevelopment())
{
    app.Lifetime.ApplicationStarted.Register(() =>
    {
        try
        {
            System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
            {
                FileName = "http://localhost:5000",
                UseShellExecute = true,
            });
        }
        catch { }
    });
}

app.Run();
