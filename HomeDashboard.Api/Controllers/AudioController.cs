using HomeDashboard.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace HomeDashboard.Api.Controllers;

/// Sound output of this machine (Windows), or of the PC through its agent when the
/// dashboard runs on the Linux server.
[ApiController]
[Route("api/audio")]
public class AudioController(AudioService audio, PcService pc) : ControllerBase
{
    [HttpGet("outputs")]
    public async Task<IActionResult> GetOutputs()
    {
        try
        {
            var local = audio.GetOutputDevices();
            return Ok(local.Count > 0 ? local : await pc.GetAudioOutputsAsync());
        }
        catch { return Ok(Array.Empty<object>()); }
    }

    [HttpPost("outputs/default")]
    public async Task<IActionResult> SetDefault([FromBody] SetDefaultRequest req)
    {
        try
        {
            if (audio.GetOutputDevices().Any(d => d.Id == req.DeviceId))
            {
                audio.SetDefaultDevice(req.DeviceId);
                return NoContent();
            }
            return await pc.SetAudioOutputAsync(req.DeviceId)
                ? NoContent()
                : StatusCode(502, new { error = "Kon de geluidsuitvoer op de PC niet aanpassen" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}

public record SetDefaultRequest(string DeviceId);
