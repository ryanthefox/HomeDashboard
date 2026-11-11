namespace HomeDashboard.Api.Models;

public record PcStatus(
    bool    Configured,     // any PC settings present
    bool    HasAgent,       // agent URL + key configured (stats, sleep, shutdown)
    bool    CanWake,        // MAC address configured (Wake-on-LAN)
    string  State,          // "online" | "offline" | "waking" | "stopping"
    string  Name,
    string? Hostname,
    long?   UptimeSeconds
);
