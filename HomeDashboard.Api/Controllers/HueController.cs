using HomeDashboard.Api.Models;
using HomeDashboard.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace HomeDashboard.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HueController : ControllerBase
{
    private readonly HueService _service;

    public HueController(HueService service) => _service = service;

    [HttpGet("lights")]
    public async Task<IActionResult> GetLights()
        => Ok(await _service.GetLightsAsync());

    [HttpGet("rooms")]
    public async Task<IActionResult> GetRooms()
        => Ok(await _service.GetRoomsAsync());

    [HttpPut("lights/{id}/state")]
    public async Task<IActionResult> SetLightState(string id, [FromBody] HueLightStateRequest request)
    {
        var success = await _service.SetLightStateAsync(id, request);
        return success ? Ok() : StatusCode(503, "Failed to update light");
    }

    [HttpGet("groups/{groupId}/scenes")]
    public async Task<IActionResult> GetScenes(string groupId)
        => Ok(await _service.GetScenesForGroupAsync(groupId));

    [HttpPut("groups/{groupId}/scene/{sceneId}")]
    public async Task<IActionResult> ActivateScene(string groupId, string sceneId)
    {
        var success = await _service.ActivateSceneAsync(groupId, sceneId);
        return success ? Ok() : StatusCode(503, "Failed");
    }

    [HttpPut("groups/{groupId}/action")]
    public async Task<IActionResult> SetGroupAction(string groupId, [FromBody] HueGroupActionRequest request)
    {
        var success = await _service.SetGroupStateAsync(groupId, request.On);
        return success ? Ok() : StatusCode(503, "Failed to update group");
    }
}
