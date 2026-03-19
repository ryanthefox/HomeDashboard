using HomeDashboard.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace HomeDashboard.Api.Controllers;

[ApiController]
[Route("api/audio")]
public class AudioController(AudioService audio) : ControllerBase
{
    [HttpGet("outputs")]
    public IActionResult GetOutputs()
    {
        try   { return Ok(audio.GetOutputDevices()); }
        catch { return Ok(Array.Empty<object>()); }
    }

    [HttpPost("outputs/default")]
    public IActionResult SetDefault([FromBody] SetDefaultRequest req)
    {
        try
        {
            audio.SetDefaultDevice(req.DeviceId);
            return NoContent();
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}

public record SetDefaultRequest(string DeviceId);
