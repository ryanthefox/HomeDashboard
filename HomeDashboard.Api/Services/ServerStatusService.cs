using System.Net.Sockets;
using System.Text.Json;

namespace HomeDashboard.Api.Services;

public record ContainerInfo(string Name, string Image, string State, string Status, string? Health, string? Project, DateTime Created);
public record DockerInfo(bool Available, string? Error, string? Version, int Running, int Stopped, List<ContainerInfo> Containers);
public record ServerStatus(string Hostname, string? Os, string? Kernel, long UptimeSeconds, double[] Load, int CpuCount, DockerInfo Docker);

/// <summary>
/// Server overview for the System tab: uptime/load from /proc and the Docker containers via
/// the (read-only mounted) Docker socket. Only meaningful when the API runs on the Linux server.
/// </summary>
public sealed class ServerStatusService(IConfiguration config)
{
    private string SocketPath => config["Server:DockerSocket"] is { Length: > 0 } p ? p : "/var/run/docker.sock";

    private HttpClient? _docker;
    private HttpClient Docker => _docker ??= new HttpClient(new SocketsHttpHandler
    {
        ConnectCallback = async (_, ct) =>
        {
            var s = new Socket(AddressFamily.Unix, SocketType.Stream, ProtocolType.Unspecified);
            await s.ConnectAsync(new UnixDomainSocketEndPoint(SocketPath), ct);
            return new NetworkStream(s, ownsSocket: true);
        },
    }) { BaseAddress = new Uri("http://docker/v1.41/"), Timeout = TimeSpan.FromSeconds(8) };

    public async Task<ServerStatus> GetAsync()
    {
        var (os, kernel, cpus) = (ReadOsName(), ReadFirstLine("/proc/sys/kernel/osrelease"), Environment.ProcessorCount);
        var docker = await GetDockerAsync();
        return new ServerStatus(
            Environment.MachineName,
            docker.Os ?? os,
            docker.Kernel ?? kernel,
            ReadUptime(),
            ReadLoad(),
            docker.Cpus ?? cpus,
            docker.Info);
    }

    private async Task<(DockerInfo Info, string? Os, string? Kernel, int? Cpus)> GetDockerAsync()
    {
        if (OperatingSystem.IsWindows() || !File.Exists(SocketPath))
            return (new DockerInfo(false, "Docker-socket niet gekoppeld", null, 0, 0, []), null, null, null);
        try
        {
            using var infoDoc = JsonDocument.Parse(await Docker.GetStringAsync("info"));
            var info = infoDoc.RootElement;
            using var listDoc = JsonDocument.Parse(await Docker.GetStringAsync("containers/json?all=true"));

            var containers = new List<ContainerInfo>();
            foreach (var c in listDoc.RootElement.EnumerateArray())
            {
                var name = c.TryGetProperty("Names", out var n) && n.GetArrayLength() > 0 ? n[0].GetString()!.TrimStart('/') : c.GetProperty("Id").GetString()![..12];
                var status = c.GetProperty("Status").GetString() ?? "";
                string? health = status.Contains("(healthy)") ? "healthy" : status.Contains("(unhealthy)") ? "unhealthy" : status.Contains("(health: starting)") ? "starting" : null;
                string? project = c.TryGetProperty("Labels", out var l) && l.ValueKind == JsonValueKind.Object
                    && l.TryGetProperty("com.docker.compose.project", out var p) ? p.GetString() : null;
                containers.Add(new ContainerInfo(
                    name,
                    c.GetProperty("Image").GetString() ?? "",
                    c.GetProperty("State").GetString() ?? "unknown",
                    status, health, project,
                    DateTimeOffset.FromUnixTimeSeconds(c.GetProperty("Created").GetInt64()).UtcDateTime));
            }
            // Problems first, then alphabetical
            containers = containers
                .OrderBy(c => c.State == "running" && c.Health != "unhealthy" ? 1 : 0)
                .ThenBy(c => c.Name, StringComparer.OrdinalIgnoreCase).ToList();

            string? Str(string prop) => info.TryGetProperty(prop, out var v) ? v.GetString() : null;
            int? cpus = info.TryGetProperty("NCPU", out var nc) ? nc.GetInt32() : null;
            var running = containers.Count(c => c.State == "running");
            return (new DockerInfo(true, null, Str("ServerVersion"), running, containers.Count - running, containers),
                Str("OperatingSystem"), Str("KernelVersion"), cpus);
        }
        catch (Exception ex)
        {
            return (new DockerInfo(false, $"Docker niet bereikbaar: {ex.Message}", null, 0, 0, []), null, null, null);
        }
    }

    private static string? ReadFirstLine(string path)
    {
        try { return File.Exists(path) ? File.ReadLines(path).FirstOrDefault()?.Trim() : null; } catch { return null; }
    }

    private static long ReadUptime()
    {
        var line = ReadFirstLine("/proc/uptime");
        if (line != null && double.TryParse(line.Split(' ')[0], System.Globalization.CultureInfo.InvariantCulture, out var s)) return (long)s;
        return Environment.TickCount64 / 1000;
    }

    private static double[] ReadLoad()
    {
        var line = ReadFirstLine("/proc/loadavg");
        if (line == null) return [];
        return line.Split(' ').Take(3)
            .Select(x => double.TryParse(x, System.Globalization.CultureInfo.InvariantCulture, out var v) ? v : 0).ToArray();
    }

    private static string? ReadOsName()
    {
        try
        {
            if (!File.Exists("/etc/os-release")) return OperatingSystem.IsWindows() ? "Windows" : null;
            var line = File.ReadLines("/etc/os-release").FirstOrDefault(l => l.StartsWith("PRETTY_NAME="));
            return line?["PRETTY_NAME=".Length..].Trim('"');
        }
        catch { return null; }
    }
}
