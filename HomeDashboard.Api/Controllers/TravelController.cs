using HomeDashboard.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace HomeDashboard.Api.Controllers;

[ApiController]
[Route("api/travel")]
public class TravelController(TravelService service) : ControllerBase
{
    /// <summary>Car (Google Maps, live traffic) and train (NS) travel time. dir=work (home → work) or home.</summary>
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] string dir = "work", [FromQuery] bool refresh = false) =>
        Ok(await service.GetAsync(dir, refresh));

    [HttpGet("settings")]
    public IActionResult GetSettings() => Ok(service.GetSettings());

    public record StationsBody(StationRef? HomeStation, StationRef? WorkStation);

    /// <summary>Stations chosen in the dashboard (null = back to the .env value).</summary>
    [HttpPut("settings")]
    public async Task<IActionResult> SaveSettings([FromBody] StationsBody body) =>
        Ok(await service.SaveStationsAsync(body.HomeStation, body.WorkStation));

    [HttpGet("stations")]
    public async Task<IActionResult> Stations([FromQuery] string q = "")
    {
        try { return Ok(await service.SearchStationsAsync(q)); }
        catch (Exception ex) { return StatusCode(502, new { error = ex.Message }); }
    }

    /// <summary>Raw API answers, to check the keys/addresses of a fresh setup.</summary>
    [HttpGet("debug")]
    public async Task<IActionResult> Debug() => Ok(await service.DebugAsync());
}
