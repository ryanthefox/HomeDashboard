using HomeDashboard.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace HomeDashboard.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SystemController : ControllerBase
{
    private readonly SystemMonitorService _service;

    public SystemController(SystemMonitorService service) => _service = service;

    [HttpGet]
    public IActionResult Get() => Ok(_service.GetStats());
}
