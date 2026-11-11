namespace HomeDashboard.Api.Models;

public record PlexStats(
    string? MachineId,     // used to build app.plex.tv deep links
    string? ServerName,
    int     Movies,
    int     Shows,
    int     Episodes,
    int     AddedThisWeek  // movies + episodes added in the last 7 days
);
