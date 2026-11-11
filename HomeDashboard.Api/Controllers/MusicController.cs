using HomeDashboard.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace HomeDashboard.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MusicController : ControllerBase
{
    private readonly MusicService _service;
    private readonly PcService    _pc;

    public MusicController(MusicService service, PcService pc)
    {
        _service = service;
        _pc      = pc;
    }

    /// Media playing on this machine (Windows), otherwise what's playing on the PC.
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var local = await _service.GetCurrentMediaAsync();
        if (local.Title != null) return Ok(local);
        return Ok(await _pc.GetMediaAsync() ?? local);
    }

    [HttpPost("play")]  public Task<IActionResult> Play()  => Control(_service.PlayAsync, "play");
    [HttpPost("pause")] public Task<IActionResult> Pause() => Control(_service.PauseAsync, "pause");
    [HttpPost("next")]  public Task<IActionResult> Next()  => Control(_service.SkipNextAsync, "next");
    [HttpPost("prev")]  public Task<IActionResult> Prev()  => Control(_service.SkipPreviousAsync, "prev");

    private async Task<IActionResult> Control(Func<Task<bool>> local, string command)
    {
        var success = await local() || await _pc.MediaControlAsync(command);
        return Ok(new { success });
    }
}
