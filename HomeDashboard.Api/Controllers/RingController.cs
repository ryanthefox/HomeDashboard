using HomeDashboard.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace HomeDashboard.Api.Controllers;

[ApiController]
[Route("api/ring")]
public class RingController(RingService ring) : ControllerBase
{
    private async Task<IActionResult> Forward(string path, TimeSpan? timeout = null)
    {
        var (status, type, body) = await ring.GetAsync(path, timeout);
        if (status == System.Net.HttpStatusCode.OK) return File(body, type);
        return new ContentResult { StatusCode = (int)status, Content = System.Text.Encoding.UTF8.GetString(body), ContentType = type };
    }

    [HttpGet("status")]
    public Task<IActionResult> Status() => Forward("/status");

    /// <summary>Latest snapshot; ?t= is only a cache buster for the browser.</summary>
    [HttpGet("snapshot/{id}")]
    public Task<IActionResult> Snapshot(string id) => Forward($"/snapshot/{Uri.EscapeDataString(id)}", TimeSpan.FromSeconds(40));

    [HttpGet("events/{id}")]
    public Task<IActionResult> Events(string id, [FromQuery] int limit = 10) => Forward($"/events/{Uri.EscapeDataString(id)}?limit={Math.Clamp(limit, 1, 50)}");

    [HttpGet("recording/{id}/{dingId}")]
    public Task<IActionResult> Recording(string id, string dingId) => Forward($"/recording/{Uri.EscapeDataString(id)}/{Uri.EscapeDataString(dingId)}");

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] System.Text.Json.JsonElement body)
    {
        var (status, json) = await ring.PostAsync("/login", body.GetRawText());
        return new ContentResult { StatusCode = (int)status, Content = json, ContentType = "application/json" };
    }

    /// <summary>Fake doorbell/motion event, to try the popup on every screen.</summary>
    [HttpPost("test")]
    public async Task<IActionResult> Test([FromQuery] string type = "ding")
    {
        var (status, json) = await ring.PostAsync("/test", $"{{\"type\":\"{(type == "motion" ? "motion" : "ding")}\"}}");
        return new ContentResult { StatusCode = (int)status, Content = json, ContentType = "application/json" };
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var (status, json) = await ring.PostAsync("/logout", "{}");
        return new ContentResult { StatusCode = (int)status, Content = json, ContentType = "application/json" };
    }
}
