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

    /// <summary>Raw API answers, to check the keys/addresses of a fresh setup.</summary>
    [HttpGet("debug")]
    public async Task<IActionResult> Debug() => Ok(await service.DebugAsync());
}
