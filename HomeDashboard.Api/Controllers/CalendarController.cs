using HomeDashboard.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace HomeDashboard.Api.Controllers;

[ApiController]
[Route("api/calendar")]
public class CalendarController(CalendarService service) : ControllerBase
{
    /// <summary>Events of all configured iCal feeds, from a month back to ~3 months ahead.</summary>
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] bool refresh = false) => Ok(await service.GetAsync(refresh));
}
