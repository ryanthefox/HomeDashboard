using HomeDashboard.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HomeDashboard.Api.Controllers;

[ApiController]
[Route("api/spotify")]
public class SpotifyController(SpotifyService spotify) : ControllerBase
{
    /// <summary>Runs a Spotify call; errors become JSON (never 401, which would log the dashboard out).</summary>
    private async Task<IActionResult> Run(Func<Task<object?>> action)
    {
        try { return Ok(await action() ?? new { ok = true }); }
        catch (SpotifyService.SpotifyException ex)
        {
            var status = ex.Status == System.Net.HttpStatusCode.Unauthorized ? 409 : (int)ex.Status is >= 400 and < 600 ? (int)ex.Status : 502;
            return StatusCode(status, new { error = ex.Message });
        }
        catch (Exception ex) { return StatusCode(502, new { error = ex.Message }); }
    }
    private Task<IActionResult> Run(Func<Task> action) => Run(async () => { await action(); return null; });

    [HttpGet("status")]
    public async Task<IActionResult> Status() => Ok(await spotify.GetStatusAsync());

    /// <summary>Access token for the browser player (behind the dashboard login, never cached by the browser).</summary>
    [HttpGet("token")]
    public Task<IActionResult> Token() => Run(async () =>
    {
        Response.Headers.CacheControl = "no-store";
        var (token, expiresIn) = await spotify.PlayerTokenAsync();
        return new { accessToken = token, expiresIn };
    });

    [HttpGet("login")]
    public IActionResult Login() => spotify.Configured ? Ok(new { url = spotify.LoginUrl(), redirectUri = spotify.RedirectUri }) : BadRequest(new { error = "Spotify is niet ingesteld" });

    public record CodeBody(string Code);

    /// <summary>Manual step: the address the browser landed on after logging in (127.0.0.1 redirect).</summary>
    [HttpPost("code")]
    public async Task<IActionResult> Code([FromBody] CodeBody body)
    {
        var error = await spotify.CompleteLoginAsync(body.Code);
        return error == null ? Ok(new { ok = true }) : BadRequest(new { error });
    }

    /// <summary>Automatic step when the redirect URI points at the dashboard itself (HTTPS setup).</summary>
    [AllowAnonymous]
    [HttpGet("callback")]
    public async Task<IActionResult> Callback([FromQuery] string? code, [FromQuery] string? state, [FromQuery] string? error)
    {
        var err = error ?? (code == null ? "geen code" : !spotify.StateMatches(state) ? "inloglink verlopen" : await spotify.CompleteLoginAsync(code, state));
        return Redirect(err == null ? "/?tab=muziek&spotify=ok" : $"/?tab=muziek&spotify={Uri.EscapeDataString(err)}");
    }

    [HttpPost("logout")]
    public IActionResult Logout() { spotify.Logout(); return Ok(new { ok = true }); }

    [HttpGet("player")]
    public Task<IActionResult> Player() => Run(async () => (object?)await spotify.GetPlaybackAsync() ?? new { idle = true });

    [HttpGet("devices")]
    public Task<IActionResult> Devices() => Run(async () => (object?)await spotify.GetDevicesAsync());

    public record PlayBody(string? DeviceId, string? ContextUri, string[]? Uris, int? Offset);

    [HttpPut("play")]
    public Task<IActionResult> Play([FromBody] PlayBody? body) => Run(() => spotify.Play(body?.DeviceId, body?.ContextUri, body?.Uris, body?.Offset));
    [HttpPut("pause")]    public Task<IActionResult> Pause() => Run(spotify.Pause);
    [HttpPost("next")]    public Task<IActionResult> Next() => Run(spotify.Next);
    [HttpPost("previous")] public Task<IActionResult> Previous() => Run(spotify.Previous);
    [HttpPut("seek")]     public Task<IActionResult> Seek([FromQuery] int ms) => Run(() => spotify.Seek(ms));
    [HttpPut("volume")]   public Task<IActionResult> Volume([FromQuery] int pct) => Run(() => spotify.Volume(pct));
    [HttpPut("shuffle")]  public Task<IActionResult> Shuffle([FromQuery] bool on) => Run(() => spotify.Shuffle(on));
    [HttpPut("repeat")]   public Task<IActionResult> Repeat([FromQuery] string mode) => Run(() => spotify.Repeat(mode));

    public record TransferBody(string DeviceId, bool Play = true);
    [HttpPut("transfer")] public Task<IActionResult> Transfer([FromBody] TransferBody body) => Run(() => spotify.Transfer(body.DeviceId, body.Play));

    [HttpGet("playlists")] public Task<IActionResult> Playlists() => Run(async () => (object?)await spotify.GetPlaylistsAsync());
    [HttpGet("recent")]    public Task<IActionResult> Recent() => Run(async () => (object?)await spotify.GetRecentAsync());
    [HttpGet("search")]    public Task<IActionResult> Search([FromQuery] string q = "") => Run(async () => (object?)await spotify.SearchAsync(q));
}
