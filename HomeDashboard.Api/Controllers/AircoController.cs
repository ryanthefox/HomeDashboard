using HomeDashboard.Api.Models;
using HomeDashboard.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace HomeDashboard.Api.Controllers;

[ApiController]
[Route("api/airco")]
public class AircoController(AircoService service) : ControllerBase
{
    // Returns raw device list from ThinQ for setup/discovery
    [HttpGet("devices/all")]
    public async Task<IActionResult> GetAllDevices()
    {
        var raw = await service.GetRawDevicesAsync();
        return raw != null ? Ok(raw) : StatusCode(503, "LG ThinQ niet beschikbaar — controleer je PAT en BaseUrl");
    }

    // Returns raw state for a single device — useful for debugging field names
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

    [HttpPut("devices/{deviceId}/power")]
    public async Task<IActionResult> SetPower(string deviceId, [FromBody] SetPowerRequest req)
        => await service.SetPowerAsync(Uri.UnescapeDataString(deviceId), req.On) ? NoContent() : StatusCode(503);

    [HttpPut("devices/{deviceId}/temperature")]
    public async Task<IActionResult> SetTemperature(string deviceId, [FromBody] SetTemperatureRequest req)
        => await service.SetTargetTemperatureAsync(Uri.UnescapeDataString(deviceId), req.Temperature) ? NoContent() : StatusCode(503);

    [HttpPut("devices/{deviceId}/mode")]
    public async Task<IActionResult> SetMode(string deviceId, [FromBody] SetModeRequest req)
        => await service.SetModeAsync(Uri.UnescapeDataString(deviceId), req.Mode) ? NoContent() : StatusCode(503);

    [HttpPut("devices/{deviceId}/fanspeed")]
    public async Task<IActionResult> SetFanSpeed(string deviceId, [FromBody] SetFanSpeedRequest req)
        => await service.SetFanSpeedAsync(Uri.UnescapeDataString(deviceId), req.Speed) ? NoContent() : StatusCode(503);
}
