using HomeDashboard.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace HomeDashboard.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MusicController : ControllerBase
{
    private readonly MusicService _service;

    public MusicController(MusicService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> Get()
        => Ok(await _service.GetCurrentMediaAsync());

    [HttpPost("play")]
    public async Task<IActionResult> Play()
        => Ok(new { success = await _service.PlayAsync() });

    [HttpPost("pause")]
    public async Task<IActionResult> Pause()
        => Ok(new { success = await _service.PauseAsync() });

    [HttpPost("next")]
    public async Task<IActionResult> Next()
        => Ok(new { success = await _service.SkipNextAsync() });

    [HttpPost("prev")]
    public async Task<IActionResult> Prev()
        => Ok(new { success = await _service.SkipPreviousAsync() });
}
