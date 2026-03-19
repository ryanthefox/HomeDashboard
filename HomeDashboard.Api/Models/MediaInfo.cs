namespace HomeDashboard.Api.Models;

public record MediaInfo(
    string? Title,
    string? Artist,
    string? AlbumTitle,
    string? AlbumArtDataUrl,
    string PlaybackStatus,
    bool CanPlay,
    bool CanPause,
    bool CanSkipNext,
    bool CanSkipPrev
);
