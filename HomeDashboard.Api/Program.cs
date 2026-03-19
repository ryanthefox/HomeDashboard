using HomeDashboard.Api.BackgroundServices;
using HomeDashboard.Api.Hubs;
using HomeDashboard.Api.Services;
using Microsoft.Extensions.FileProviders;
// SystemMonitorService is registered below

var builder = WebApplication.CreateBuilder(args);

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

app.UseAuthorization();
app.MapControllers();
app.MapHub<DashboardHub>("/hubs/dashboard");

// SPA fallback: serve index.html for unknown routes
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
});

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
