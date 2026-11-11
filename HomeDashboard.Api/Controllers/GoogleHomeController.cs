using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using HomeDashboard.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace HomeDashboard.Api.Controllers;

/// <summary>
/// Google Home cloud-to-cloud integration: OAuth account linking (/oauth/authorize, /oauth/token)
/// and the smart-home fulfillment webhook (/api/google/fulfillment).
/// Exposes the PC as an on/off switch: on = Wake-on-LAN, off = shut down via the PC agent.
/// </summary>
[ApiController]
[AllowAnonymous] // these endpoints do their own (OAuth / bearer) authentication
public class GoogleHomeController(
    GoogleHomeService google, PcService pc, IConfiguration config, ILogger<GoogleHomeController> logger) : ControllerBase
{
    private const string PcDeviceId = "pc";

    // ── Account linking: consent page ─────────────────────────────────────────

    [HttpGet("oauth/authorize")]
    public IActionResult Authorize(
        [FromQuery(Name = "client_id")] string? clientId,
        [FromQuery(Name = "redirect_uri")] string? redirectUri,
        [FromQuery] string? state,
        [FromQuery(Name = "response_type")] string? responseType)
    {
        if (ValidateAuthorizeRequest(clientId, redirectUri, responseType) is { } error) return error;
        return ConsentPage(clientId!, redirectUri!, state, null);
    }

    [HttpPost("oauth/authorize")]
    [EnableRateLimiting("login")]
    [Consumes("application/x-www-form-urlencoded")]
    public async Task<IActionResult> AuthorizePost(
        [FromForm(Name = "client_id")] string? clientId,
        [FromForm(Name = "redirect_uri")] string? redirectUri,
        [FromForm] string? state,
        [FromForm(Name = "response_type")] string? responseType,
        [FromForm] string? password)
    {
        if (ValidateAuthorizeRequest(clientId, redirectUri, responseType) is { } error) return error;

        if (!google.CheckPassword(password))
        {
            logger.LogWarning("Google-koppeling: onjuist wachtwoord vanaf {Ip}", HttpContext.Connection.RemoteIpAddress);
            await Task.Delay(1000);
            return ConsentPage(clientId!, redirectUri!, state, "Onjuist wachtwoord");
        }

        var code = google.IssueCode(redirectUri!);
        logger.LogInformation("Google-koppeling: autorisatie gegeven");
        var sep = redirectUri!.Contains('?') ? '&' : '?';
        return Redirect($"{redirectUri}{sep}code={Uri.EscapeDataString(code)}&state={Uri.EscapeDataString(state ?? "")}");
    }

    private IActionResult? ValidateAuthorizeRequest(string? clientId, string? redirectUri, string? responseType)
    {
        if (!google.Enabled)
            return BadRequest("Google-koppeling staat uit: stel Google__ClientId, Google__ClientSecret en een dashboardwachtwoord in.");
        if (!google.IsValidClient(clientId)) return BadRequest("Onbekende client_id");
        if (!GoogleHomeService.IsAllowedRedirect(redirectUri)) return BadRequest("Ongeldige redirect_uri");
        if (responseType != "code") return BadRequest("response_type moet 'code' zijn");
        return null;
    }

    private ContentResult ConsentPage(string clientId, string redirectUri, string? state, string? error)
    {
        static string E(string? s) => WebUtility.HtmlEncode(s ?? "");
        var html = $$"""
            <!doctype html>
            <html lang="nl"><head>
            <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Google koppelen – Home Dashboard</title>
            <link rel="icon" type="image/svg+xml" href="/favicon.svg">
            <style>
              :root { color-scheme: dark; }
              *, *::before, *::after { box-sizing: border-box; }
              body { margin:0; min-height:100dvh; display:flex; align-items:center; justify-content:center;
                     background:#06070a; color:#f4f4f5; font:16px/1.5 system-ui, sans-serif; padding:16px; }
              form { width:100%; max-width:360px; background:#14151a; border:1px solid #26272e;
                     border-radius:24px; padding:28px; box-sizing:border-box; }
              img { width:48px; height:48px; display:block; margin:0 auto 16px; }
              h1 { font-size:20px; margin:0 0 4px; text-align:center; }
              p { color:#a1a1aa; font-size:14px; margin:0 0 20px; text-align:center; }
              input[type=password] { width:100%; box-sizing:border-box; padding:12px 16px; border-radius:12px;
                     border:1px solid #2e2f37; background:#1d1e24; color:inherit; font-size:16px; }
              button { width:100%; margin-top:16px; padding:12px; border:0; border-radius:12px; font-weight:600;
                     font-size:15px; color:#0b0c10; background:linear-gradient(135deg,#ffb86b,#ff7a45); cursor:pointer; }
              .err { color:#f87171; font-size:14px; margin:10px 0 0; text-align:left; }
            </style></head>
            <body>
              <form method="post" action="/oauth/authorize">
                <img src="/favicon.svg" alt="">
                <h1>Google Home koppelen</h1>
                <p>Google wil je pc kunnen aan- en uitzetten via Home Dashboard. Vul je dashboardwachtwoord in om dit toe te staan.</p>
                <input type="hidden" name="client_id" value="{{E(clientId)}}">
                <input type="hidden" name="redirect_uri" value="{{E(redirectUri)}}">
                <input type="hidden" name="state" value="{{E(state)}}">
                <input type="hidden" name="response_type" value="code">
                <input type="password" name="password" placeholder="Wachtwoord" autocomplete="current-password" autofocus required>
                {{(error != null ? $"<p class=\"err\" role=\"alert\">{E(error)}</p>" : "")}}
                <button type="submit">Toestaan</button>
              </form>
            </body></html>
            """;
        return new ContentResult { Content = html, ContentType = "text/html; charset=utf-8", StatusCode = error == null ? 200 : 401 };
    }

    // ── Account linking: token exchange ───────────────────────────────────────

    [HttpPost("oauth/token")]
    [Consumes("application/x-www-form-urlencoded")]
    public IActionResult Token(
        [FromForm(Name = "grant_type")] string? grantType,
        [FromForm(Name = "client_id")] string? clientId,
        [FromForm(Name = "client_secret")] string? clientSecret,
        [FromForm] string? code,
        [FromForm(Name = "redirect_uri")] string? redirectUri,
        [FromForm(Name = "refresh_token")] string? refreshToken)
    {
        // Google may send the client credentials as HTTP Basic auth instead of form fields
        var header = Request.Headers.Authorization.ToString();
        if (header.StartsWith("Basic ", StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                var decoded = Encoding.UTF8.GetString(Convert.FromBase64String(header[6..].Trim()));
                var i = decoded.IndexOf(':');
                if (i > 0)
                {
                    clientId     = Uri.UnescapeDataString(decoded[..i]);
                    clientSecret = Uri.UnescapeDataString(decoded[(i + 1)..]);
                }
            }
            catch (FormatException) { /* fall through: invalid_client */ }
        }

        if (!google.IsValidClient(clientId, clientSecret))
            return Unauthorized(new { error = "invalid_client" });

        switch (grantType)
        {
            case "authorization_code":
                if (!google.RedeemCode(code, redirectUri)) return BadRequest(new { error = "invalid_grant" });
                logger.LogInformation("Google-koppeling: tokens uitgegeven");
                return Ok(new
                {
                    token_type    = "Bearer",
                    access_token  = google.IssueAccessToken(),
                    refresh_token = google.IssueRefreshToken(),
                    expires_in    = (int)GoogleHomeService.AccessLifetime.TotalSeconds,
                });

            case "refresh_token":
                if (!google.ValidateRefreshToken(refreshToken)) return BadRequest(new { error = "invalid_grant" });
                return Ok(new
                {
                    token_type   = "Bearer",
                    access_token = google.IssueAccessToken(),
                    expires_in   = (int)GoogleHomeService.AccessLifetime.TotalSeconds,
                });

            default:
                return BadRequest(new { error = "unsupported_grant_type" });
        }
    }

    // ── Smart-home fulfillment ────────────────────────────────────────────────

    [HttpPost("api/google/fulfillment")]
    public async Task<IActionResult> Fulfillment([FromBody] JsonElement body)
    {
        var header = Request.Headers.Authorization.ToString();
        var token = header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase) ? header[7..].Trim() : null;
        if (!google.Enabled || !google.ValidateAccessToken(token))
            return Unauthorized(new { error = "invalid_token" });

        var requestId = body.TryGetProperty("requestId", out var rid) ? rid.GetString() : "";
        if (!body.TryGetProperty("inputs", out var inputs) || inputs.GetArrayLength() == 0)
            return BadRequest();

        var input  = inputs[0];
        var intent = input.GetProperty("intent").GetString();
        logger.LogInformation("Google-intent {Intent}", intent);

        JsonObject? payload = intent switch
        {
            "action.devices.SYNC"       => Sync(),
            "action.devices.QUERY"      => await Query(input),
            "action.devices.EXECUTE"    => await Execute(input),
            "action.devices.DISCONNECT" => null,
            _ => new JsonObject { ["errorCode"] = "notSupported" },
        };

        if (payload == null) return Ok(new { });
        return Ok(new JsonObject { ["requestId"] = requestId, ["payload"] = payload });
    }

    private JsonObject Sync()
    {
        var name = config["Google:DeviceName"];
        if (string.IsNullOrWhiteSpace(name)) name = config["Pc:Name"];
        if (string.IsNullOrWhiteSpace(name)) name = "Computer";

        return new JsonObject
        {
            ["agentUserId"] = "homedashboard",
            ["devices"] = new JsonArray
            {
                new JsonObject
                {
                    ["id"]     = PcDeviceId,
                    ["type"]   = "action.devices.types.SWITCH",
                    ["traits"] = new JsonArray { "action.devices.traits.OnOff" },
                    ["name"]   = new JsonObject
                    {
                        ["name"]      = name,
                        ["nicknames"] = new JsonArray { "pc", "computer" },
                    },
                    ["willReportState"] = false,
                    ["deviceInfo"] = new JsonObject { ["manufacturer"] = "Home Dashboard", ["model"] = "PC" },
                },
            },
        };
    }

    private async Task<JsonObject> Query(JsonElement input)
    {
        var devices = new JsonObject();
        var status = await pc.GetStatusAsync();
        foreach (var d in input.GetProperty("payload").GetProperty("devices").EnumerateArray())
        {
            var id = d.GetProperty("id").GetString()!;
            devices[id] = id == PcDeviceId
                ? new JsonObject { ["status"] = "SUCCESS", ["online"] = true, ["on"] = IsOn(status.State) }
                : new JsonObject { ["status"] = "ERROR", ["errorCode"] = "deviceNotFound" };
        }
        return new JsonObject { ["devices"] = devices };
    }

    private async Task<JsonObject> Execute(JsonElement input)
    {
        var results = new JsonArray();
        foreach (var command in input.GetProperty("payload").GetProperty("commands").EnumerateArray())
        {
            var ids = command.GetProperty("devices").EnumerateArray().Select(d => d.GetProperty("id").GetString()!).ToList();
            foreach (var exec in command.GetProperty("execution").EnumerateArray())
            {
                if (exec.GetProperty("command").GetString() != "action.devices.commands.OnOff" || !ids.Contains(PcDeviceId))
                {
                    results.Add(new JsonObject { ["ids"] = ToArray(ids), ["status"] = "ERROR", ["errorCode"] = "functionNotSupported" });
                    continue;
                }

                var on = exec.GetProperty("params").GetProperty("on").GetBoolean();
                var ok = on ? await pc.WakeAsync() : await pc.PowerAsync("shutdown");
                logger.LogInformation("Google: pc {Action} → {Result}", on ? "aan" : "uit", ok ? "ok" : "mislukt");

                results.Add(ok
                    ? new JsonObject
                    {
                        ["ids"] = ToArray([PcDeviceId]), ["status"] = "SUCCESS",
                        ["states"] = new JsonObject { ["on"] = on, ["online"] = true },
                    }
                    : new JsonObject
                    {
                        ["ids"] = ToArray([PcDeviceId]), ["status"] = "ERROR",
                        // Off failed = agent unreachable (PC already off?); on failed = no MAC configured
                        ["errorCode"] = on ? "hardError" : "deviceOffline",
                    });
            }
        }
        return new JsonObject { ["commands"] = results };
    }

    private static bool IsOn(string state) => state is "online" or "waking";

    private static JsonArray ToArray(IEnumerable<string> ids) => new(ids.Select(i => (JsonNode)JsonValue.Create(i)!).ToArray());
}
