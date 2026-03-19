using Microsoft.AspNetCore.SignalR;

namespace HomeDashboard.Api.Hubs;

public class DashboardHub : Hub
{
    public async Task SubscribeToAll()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "weather");
        await Groups.AddToGroupAsync(Context.ConnectionId, "hue");
        await Groups.AddToGroupAsync(Context.ConnectionId, "music");
        await Groups.AddToGroupAsync(Context.ConnectionId, "system");
        await Groups.AddToGroupAsync(Context.ConnectionId, "airco");
    }

    public async Task Subscribe(string widget)
        => await Groups.AddToGroupAsync(Context.ConnectionId, widget);

    public async Task Unsubscribe(string widget)
        => await Groups.RemoveFromGroupAsync(Context.ConnectionId, widget);
}
