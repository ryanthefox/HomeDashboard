using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.DataProtection;

namespace HomeDashboard.Api.Services;

/// <summary>
/// Google Home cloud-to-cloud ("smart home") account linking.
/// Tokens are stateless: encrypted with ASP.NET Data Protection (keys persist in Auth:KeysPath)
/// and bound to the dashboard password stamp, so changing the password unlinks Google.
/// </summary>
public sealed class GoogleHomeService
{
    private static readonly TimeSpan CodeLifetime    = TimeSpan.FromMinutes(5);
    public  static readonly TimeSpan AccessLifetime  = TimeSpan.FromHours(1);
    private static readonly TimeSpan RefreshLifetime = TimeSpan.FromDays(3650);

    private static readonly string[] AllowedRedirectPrefixes =
    [
        "https://oauth-redirect.googleusercontent.com/r/",
        "https://oauth-redirect-sandbox.googleusercontent.com/r/",
    ];

    private readonly ITimeLimitedDataProtector _protector;
    private readonly DashboardAuth _auth;
    private readonly IConfiguration _config;
    // Authorization codes are single-use: remember the ones already redeemed (until they expire anyway)
    private readonly ConcurrentDictionary<string, DateTime> _usedCodes = new();

    public GoogleHomeService(IDataProtectionProvider dp, DashboardAuth auth, IConfiguration config)
    {
        _protector = dp.CreateProtector("HomeDashboard.GoogleHome.v1").ToTimeLimitedDataProtector();
        _auth = auth;
        _config = config;
    }

    private string? ClientId     => NullIfEmpty(_config["Google:ClientId"]);
    private string? ClientSecret => NullIfEmpty(_config["Google:ClientSecret"]);

    /// Google linking needs client credentials and a dashboard password (that's what you log in with).
    public bool Enabled => ClientId != null && ClientSecret != null && _auth.Required;

    public bool IsValidClient(string? clientId) => Enabled && FixedEquals(clientId, ClientId);

    public bool IsValidClient(string? clientId, string? clientSecret) =>
        IsValidClient(clientId) && FixedEquals(clientSecret, ClientSecret);

    public static bool IsAllowedRedirect(string? uri) =>
        uri != null && AllowedRedirectPrefixes.Any(p => uri.StartsWith(p, StringComparison.Ordinal));

    public bool CheckPassword(string? password) => _auth.Check(password);

    // ── Tokens ────────────────────────────────────────────────────────────────
    // Payload: "<kind>|<password stamp>|<extra>"

    public string IssueCode(string redirectUri) =>
        Protect("code", redirectUri + "|" + Convert.ToHexString(RandomNumberGenerator.GetBytes(8)), CodeLifetime);

    public string IssueAccessToken()  => Protect("access", "", AccessLifetime);
    public string IssueRefreshToken() => Protect("refresh", "", RefreshLifetime);

    /// Validates and consumes an authorization code; it must be used with the same redirect_uri.
    public bool RedeemCode(string? code, string? redirectUri)
    {
        if (code == null || !TryUnprotect(code, "code", out var extra)) return false;
        var uri = extra[..extra.LastIndexOf('|')];
        if (uri != redirectUri) return false;

        var now = DateTime.UtcNow;
        foreach (var (k, at) in _usedCodes)
            if (now - at > CodeLifetime) _usedCodes.TryRemove(k, out _);
        return _usedCodes.TryAdd(code, now);
    }

    public bool ValidateAccessToken(string? token)  => token != null && TryUnprotect(token, "access", out _);
    public bool ValidateRefreshToken(string? token) => token != null && TryUnprotect(token, "refresh", out _);

    private string Protect(string kind, string extra, TimeSpan lifetime) =>
        _protector.Protect($"{kind}|{_auth.Stamp}|{extra}", lifetime);

    private bool TryUnprotect(string token, string kind, out string extra)
    {
        extra = "";
        try
        {
            var parts = _protector.Unprotect(token).Split('|', 3);
            if (parts.Length != 3 || parts[0] != kind || parts[1] != _auth.Stamp) return false;
            extra = parts[2];
            return true;
        }
        catch (CryptographicException)
        {
            return false; // tampered, expired or from old keys
        }
    }

    private static bool FixedEquals(string? a, string? b)
    {
        if (a == null || b == null) return false;
        return CryptographicOperations.FixedTimeEquals(
            SHA256.HashData(Encoding.UTF8.GetBytes(a)), SHA256.HashData(Encoding.UTF8.GetBytes(b)));
    }

    private static string? NullIfEmpty(string? s) => string.IsNullOrWhiteSpace(s) ? null : s;
}
