using HomeDashboard.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace HomeDashboard.Api.Controllers;

[ApiController]
[Route("api/energy")]
public class EnergyController(FrankEnergieService service) : ControllerBase
{
    /// <summary>Electricity (hourly) and gas prices for today and, once published, tomorrow.</summary>
    [HttpGet("prices")]
    public async Task<IActionResult> GetPrices()
    {
        try   { return Ok(await service.GetPricesAsync()); }
        catch (Exception ex) { return StatusCode(502, new { error = ex.Message }); }
    }

    /// <summary>Own usage and costs (needs FrankEnergie:Email/Password).</summary>
    [HttpGet("usage")]
    public async Task<IActionResult> GetUsage() => Ok(await service.GetUsageAsync());

    /// <summary>Raw API answers, to troubleshoot the (unofficial) Frank Energie API.</summary>
    [HttpGet("debug")]
    public async Task<IActionResult> GetDebug() => Ok(await service.GetDebugAsync());
}
