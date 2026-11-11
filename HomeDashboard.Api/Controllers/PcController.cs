using HomeDashboard.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace HomeDashboard.Api.Controllers;

[ApiController]
[Route("api/pc")]
public class PcController(PcService service) : ControllerBase
{
    [HttpGet("status")]
    public async Task<IActionResult> GetStatus() => Ok(await service.GetStatusAsync());

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var stats = await service.GetStatsAsync();
        return stats == null ? NoContent() : Ok(stats);
    }

    [HttpPost("wake")]
    public async Task<IActionResult> Wake() =>
        await service.WakeAsync() ? Accepted() : BadRequest(new { error = "Geen geldig MAC-adres ingesteld (Pc:MacAddress)" });

    [HttpPost("power/{command}")]
    public async Task<IActionResult> Power(string command)
    {
        if (command is not ("shutdown" or "sleep" or "restart"))
            return BadRequest(new { error = "Onbekende actie" });
        return await service.PowerAsync(command) ? Accepted() : StatusCode(502, new { error = "PC-agent niet bereikbaar" });
    }
}
