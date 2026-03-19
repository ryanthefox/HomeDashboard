using HomeDashboard.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace HomeDashboard.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WeatherController : ControllerBase
{
    private readonly WeatherService _service;

    public WeatherController(WeatherService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var data = await _service.GetCurrentWeatherAsync();
        if (data == null) return StatusCode(503, "Weather data unavailable");
        return Ok(data);
    }
}
