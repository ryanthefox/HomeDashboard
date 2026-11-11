namespace HomeDashboard.Api.Models;

public record PlexSession(
    string  Key,
    string  SessionId,
    string  Title,
    string  Type,
    string? ThumbUrl,
    string? ShowTitle,
    int?    Season,
    int?    Episode,
    string? User,
    string? PlayerName,
    string? Platform,    // e.g. "Roku", "Chrome", "Android"
    string  State,       // "playing" | "paused" | "buffering"
    long    ViewOffset,  // ms
    long    Duration,    // ms
    string  Decision,    // "directplay" | "directstream" | "transcode"
    string? Quality,     // e.g. "1080p", "4K"
    bool    Local,       // played on the home network
    int?    Bandwidth    // kbps
);
