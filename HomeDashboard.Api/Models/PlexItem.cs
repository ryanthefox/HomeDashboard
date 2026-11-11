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
    string? Summary
);
