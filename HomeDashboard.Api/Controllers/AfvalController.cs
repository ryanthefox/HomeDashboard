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

    /// <summary>All collections from the start of last month on, for the calendar view.</summary>
    [HttpGet("all")]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            var from = new DateTime(DateTime.Now.Year, DateTime.Now.Month, 1).AddMonths(-1);
            return Ok((await service.GetAllAsync()).Where(i => i.Date >= from));
        }
        catch { return Ok(Array.Empty<object>()); }
    }
}
