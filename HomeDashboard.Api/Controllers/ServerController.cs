using HomeDashboard.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace HomeDashboard.Api.Controllers;

[ApiController]
[Route("api/server")]
public class ServerController(ServerStatusService service) : ControllerBase
{
    /// <summary>Uptime, load and Docker containers of the server the dashboard runs on.</summary>
    [HttpGet("status")]
    public async Task<IActionResult> Status() => Ok(await service.GetAsync());
}
