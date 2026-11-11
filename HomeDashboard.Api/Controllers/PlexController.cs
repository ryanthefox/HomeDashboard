using HomeDashboard.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace HomeDashboard.Api.Controllers;

[ApiController]
[Route("api/plex")]
public class PlexController(PlexService service) : ControllerBase
{
    [HttpGet("ondeck")]
    public async Task<IActionResult> GetOnDeck()
    {
        try   { return Ok(await service.GetOnDeckAsync()); }
        catch { return Ok(Array.Empty<object>()); }
    }

    [HttpGet("recent")]
    public async Task<IActionResult> GetRecent()
    {
        try   { return Ok(await service.GetRecentlyAddedAsync()); }
        catch { return Ok(Array.Empty<object>()); }
    }

    [HttpGet("sessions")]
    public async Task<IActionResult> GetSessions()
    {
        try   { return Ok(await service.GetSessionsAsync()); }
        catch { return Ok(Array.Empty<object>()); }
    }

    [HttpGet("thumb")]
    [ResponseCache(Duration = 86400, Location = ResponseCacheLocation.Client)]
    public async Task<IActionResult> GetThumb([FromQuery] string key)
    {
        if (!PlexService.IsSafeThumbKey(key))
            return BadRequest();

        var (stream, contentType) = await service.GetThumbAsync(key);
        if (stream == null)
            return NotFound();

        return File(stream, contentType);
    }
}
