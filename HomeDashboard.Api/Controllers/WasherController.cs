using HomeDashboard.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace HomeDashboard.Api.Controllers;

[ApiController]
[Route("api/washer")]
public class WasherController(WasherService service) : ControllerBase
{
    // Raw device list — handy for discovering the deviceType string your washer uses
    [HttpGet("devices/all")]
    public async Task<IActionResult> GetAllDevices()
    {
        var raw = await service.GetRawDevicesAsync();
        return raw != null ? Ok(raw) : StatusCode(503, "LG ThinQ niet beschikbaar");
    }

    // Raw state for a single device — handy for seeing which state keys your washer exposes
    [HttpGet("devices/{deviceId}/state/raw")]
    public async Task<IActionResult> GetDeviceStateRaw(string deviceId)
    {
        var raw = await service.GetRawDeviceStateAsync(Uri.UnescapeDataString(deviceId));
        return raw != null ? Ok(raw) : StatusCode(503, "State ophalen mislukt");
    }

    [HttpGet("devices")]
    public async Task<IActionResult> GetDevices()
    {
        try   { return Ok(await service.GetDevicesAsync()); }
        catch { return Ok(Array.Empty<object>()); }
    }
}
