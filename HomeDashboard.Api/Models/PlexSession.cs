namespace HomeDashboard.Api.Models;

public record PlexSession(
    string  Key,
    string  Title,
    string  Type,
    string? ThumbUrl,
    string? ShowTitle,
    int?    Season,
    int?    Episode,
    string? User,
    string? PlayerName,
    string  State,       // "playing" | "paused" | "buffering"
    long    ViewOffset,  // ms
    long    Duration     // ms
);
