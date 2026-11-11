using HomeDashboard.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace HomeDashboard.Api.Controllers;

[ApiController]
[Route("api/afval")]
public class AfvalController(AfvalService service) : ControllerBase
{
    [HttpGet("upcoming")]
    public async Task<IActionResult> GetUpcoming()
    {
        try   { return Ok(await service.GetUpcomingAsync()); }
        catch { return Ok(Array.Empty<object>()); }
    }
}
