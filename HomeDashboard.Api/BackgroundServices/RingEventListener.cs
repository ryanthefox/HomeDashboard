using System.Text.Json;
using HomeDashboard.Api.Hubs;
using HomeDashboard.Api.Services;
using Microsoft.AspNetCore.SignalR;

namespace HomeDashboard.Api.BackgroundServices;

/// <summary>
/// Listens to the Ring bridge's event stream and pushes doorbell presses / motion
/// to every open dashboard via SignalR ("RingEvent").
/// </summary>
public sealed class RingEventListener(RingService ring, IHubContext<DashboardHub> hub, ILogger<RingEventListener> log) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        var delay = TimeSpan.FromSeconds(5);
        while (!ct.IsCancellationRequested)
        {
            try
            {
                await using var stream = await ring.OpenStreamAsync(ct);
                using var reader = new StreamReader(stream);
                log.LogInformation("Ring: listening for doorbell events");
                delay = TimeSpan.FromSeconds(5);

                while (!ct.IsCancellationRequested && await reader.ReadLineAsync(ct) is { } line)
                {
                    if (!line.StartsWith("data: ")) continue; // comments / keep-alives
                    using var doc = JsonDocument.Parse(line[6..]);
                    await hub.Clients.All.SendAsync("RingEvent", doc.RootElement.Clone(), ct);
                }
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested) { break; }
            catch (Exception ex)
            {
                log.LogDebug(ex, "Ring: event stream unavailable, retrying in {Delay}", delay);
            }
            // Bridge not running (yet): back off up to a minute
            await Task.Delay(delay, ct).ContinueWith(_ => { }, CancellationToken.None);
            delay = TimeSpan.FromSeconds(Math.Min(60, delay.TotalSeconds * 2));
        }
    }
}
