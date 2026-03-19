namespace HomeDashboard.Api.Models;

public record WasherDevice(
    string DeviceId,
    string Name,
    bool   IsOnline,
    string RunState,         // standby | running | pause | rinsing | spinning | end | error
    string Cycle,            // Dutch display name of the wash cycle
    int    RemainingMinutes  // 0 when not running
);
