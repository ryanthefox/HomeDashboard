using System.Security.Claims;
using HomeDashboard.Api.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace HomeDashboard.Api.Controllers;

[ApiController]
[Route("api/auth")]
[AllowAnonymous]
public class AuthController(DashboardAuth auth, ILogger<AuthController> logger) : ControllerBase
{
    public record LoginRequest(string? Password);

    [HttpGet("me")]
    public IActionResult Me() => Ok(new
    {
        required = auth.Required,
        authenticated = !auth.Required || User.Identity?.IsAuthenticated == true,
    });

    [HttpPost("login")]
    [EnableRateLimiting("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (!auth.Required) return NoContent();

        if (!auth.Check(request.Password))
        {
            logger.LogWarning("Mislukte inlogpoging vanaf {Ip}", HttpContext.Connection.RemoteIpAddress);
            await Task.Delay(1000); // slow down guessing
            return Unauthorized(new { error = "Onjuist wachtwoord" });
        }

        var identity = new ClaimsIdentity(
            [new Claim(ClaimTypes.Name, "dashboard"), new Claim(DashboardAuth.StampClaim, auth.Stamp)],
            CookieAuthenticationDefaults.AuthenticationScheme);

        await HttpContext.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            new ClaimsPrincipal(identity),
            new AuthenticationProperties { IsPersistent = true });

        return NoContent();
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return NoContent();
    }
}
