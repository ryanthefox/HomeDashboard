using System.Security.Cryptography;
using System.Text;

namespace HomeDashboard.Api.Services;

/// <summary>
/// Single shared dashboard password (config "Auth:Password", env Auth__Password).
/// Empty password = login disabled (handy for local development).
/// </summary>
public sealed class DashboardAuth
{
    public const string StampClaim = "hd_pw_stamp";

    private readonly byte[]? _passwordHash;

    public DashboardAuth(IConfiguration config)
    {
        var password = config["Auth:Password"];
        if (!string.IsNullOrWhiteSpace(password))
        {
            _passwordHash = SHA256.HashData(Encoding.UTF8.GetBytes(password));
            // Stored in the cookie: changing the password invalidates every existing login.
            Stamp = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes("stamp:" + password)))[..16];
        }
    }

    public bool Required => _passwordHash != null;

    public string Stamp { get; } = "";

    public bool Check(string? password)
    {
        if (_passwordHash == null) return true;
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(password ?? ""));
        return CryptographicOperations.FixedTimeEquals(hash, _passwordHash);
    }
}
