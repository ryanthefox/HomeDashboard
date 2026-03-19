#if WINDOWS
using Windows.Media.Control;
using Windows.Storage.Streams;
#endif
using HomeDashboard.Api.Models;

namespace HomeDashboard.Api.Services;

public class MusicService
{
    private readonly ILogger<MusicService> _logger;

#if WINDOWS
    private GlobalSystemMediaTransportControlsSessionManager? _sessionManager;

    public MusicService(ILogger<MusicService> logger)
    {
        _logger = logger;
        InitAsync().ConfigureAwait(false);
    }

    private async Task InitAsync()
    {
        try
        {
            _sessionManager = await GlobalSystemMediaTransportControlsSessionManager.RequestAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to initialize SMTC session manager");
        }
    }

    public async Task<MediaInfo> GetCurrentMediaAsync()
    {
        try
        {
            if (_sessionManager == null)
                _sessionManager = await GlobalSystemMediaTransportControlsSessionManager.RequestAsync();

            var session = _sessionManager.GetCurrentSession();
            if (session == null) return EmptyMedia();

            var mediaProperties = await session.TryGetMediaPropertiesAsync();
            var playbackInfo    = session.GetPlaybackInfo();

            string? albumArtDataUrl = null;
            if (mediaProperties.Thumbnail != null)
            {
                try
                {
                    using var stream = await mediaProperties.Thumbnail.OpenReadAsync();
                    using var ms     = new MemoryStream();
                    await stream.AsStream().CopyToAsync(ms);
                    var bytes = ms.ToArray();
                    var mime  = stream.ContentType is { Length: > 0 } ct ? ct : "image/jpeg";
                    albumArtDataUrl = $"data:{mime};base64,{Convert.ToBase64String(bytes)}";
                }
                catch { /* thumbnail unavailable */ }
            }

            var status = playbackInfo.PlaybackStatus switch
            {
                GlobalSystemMediaTransportControlsSessionPlaybackStatus.Playing => "Playing",
                GlobalSystemMediaTransportControlsSessionPlaybackStatus.Paused  => "Paused",
                GlobalSystemMediaTransportControlsSessionPlaybackStatus.Stopped => "Stopped",
                _ => "Unknown"
            };

            return new MediaInfo(
                Title:           mediaProperties.Title,
                Artist:          mediaProperties.Artist,
                AlbumTitle:      mediaProperties.AlbumTitle,
                AlbumArtDataUrl: albumArtDataUrl,
                PlaybackStatus:  status,
                CanPlay:         playbackInfo.Controls.IsPlayEnabled,
                CanPause:        playbackInfo.Controls.IsPauseEnabled,
                CanSkipNext:     playbackInfo.Controls.IsNextEnabled,
                CanSkipPrev:     playbackInfo.Controls.IsPreviousEnabled
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get current media info");
            return EmptyMedia();
        }
    }

    public async Task<bool> PlayAsync()          => await TryControlAsync(s => s.TryPlayAsync());
    public async Task<bool> PauseAsync()         => await TryControlAsync(s => s.TryPauseAsync());
    public async Task<bool> SkipNextAsync()      => await TryControlAsync(s => s.TrySkipNextAsync());
    public async Task<bool> SkipPreviousAsync()  => await TryControlAsync(s => s.TrySkipPreviousAsync());

    private async Task<bool> TryControlAsync(
        Func<GlobalSystemMediaTransportControlsSession, Windows.Foundation.IAsyncOperation<bool>> action)
    {
        try
        {
            var session = _sessionManager?.GetCurrentSession();
            if (session == null) return false;
            return await action(session);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Media control failed");
            return false;
        }
    }

#else
    // Non-Windows stub — music widget is not supported on Linux/Docker
    public MusicService(ILogger<MusicService> logger) { _logger = logger; }

    public Task<MediaInfo> GetCurrentMediaAsync() => Task.FromResult(EmptyMedia());
    public Task<bool> PlayAsync()         => Task.FromResult(false);
    public Task<bool> PauseAsync()        => Task.FromResult(false);
    public Task<bool> SkipNextAsync()     => Task.FromResult(false);
    public Task<bool> SkipPreviousAsync() => Task.FromResult(false);
#endif

    private static MediaInfo EmptyMedia() => new(
        Title: null, Artist: null, AlbumTitle: null, AlbumArtDataUrl: null,
        PlaybackStatus: "Stopped",
        CanPlay: false, CanPause: false, CanSkipNext: false, CanSkipPrev: false
    );
}
