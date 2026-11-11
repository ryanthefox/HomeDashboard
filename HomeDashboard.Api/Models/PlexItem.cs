namespace HomeDashboard.Api.Models;

public record PlexItem(
    string  Key,
    string  Title,
    string  Type,
    string? ThumbUrl,
    int?    Year,
    string? ShowTitle,
    int?    Season,
    int?    Episode,
    string? Summary,
    long    ViewOffset,  // ms watched so far (0 when not started)
    long    Duration,    // ms
    long    AddedAt      // unix seconds
);
