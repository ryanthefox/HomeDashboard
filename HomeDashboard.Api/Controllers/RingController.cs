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
    public Task<IActionResult> Events(string id, [FromQuery] int limit = 10, [FromQuery] string? kind = null, [FromQuery] string? page = null)
    {
        var q = $"?limit={Math.Clamp(limit, 1, 50)}";
        if (kind is "ding" or "motion" or "on_demand") q += $"&kind={kind}";
        if (!string.IsNullOrEmpty(page)) q += $"&page={Uri.EscapeDataString(page)}";
        return Forward($"/events/{Uri.EscapeDataString(id)}{q}");
    }

    private ContentResult Json((System.Net.HttpStatusCode Status, string Body) r) =>
        new() { StatusCode = (int)r.Status, Content = r.Body, ContentType = "application/json" };

    /// <summary>Starts a live view: the browser sends its WebRTC offer, Ring answers. Video then flows straight from Ring to the browser.</summary>
    [HttpPost("live/{id}")]
    public async Task<IActionResult> LiveStart(string id, [FromBody] System.Text.Json.JsonElement body) =>
        Json(await ring.PostAsync($"/live/{Uri.EscapeDataString(id)}", body.GetRawText()));

    [HttpPost("live-end/{sessionId}")]
    public async Task<IActionResult> LiveEnd(string sessionId) =>
        Json(await ring.PostAsync($"/live-end/{Uri.EscapeDataString(sessionId)}", "{}"));

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
