using HomeDashboard.Api.Models;
#if WINDOWS
using LibreHardwareMonitor.Hardware;
#endif

namespace HomeDashboard.Api.Services;

public class SystemMonitorService : IDisposable
{
    private readonly ILogger<SystemMonitorService> _logger;

#if WINDOWS
    private readonly Computer _computer;
    private readonly object _lock = new();

    public SystemMonitorService(ILogger<SystemMonitorService> logger)
    {
        _logger = logger;
        _computer = new Computer
        {
            IsCpuEnabled     = true,
            IsGpuEnabled     = true,
            IsMemoryEnabled  = true,
            IsStorageEnabled = false,
            IsNetworkEnabled = true,
        };
        try { _computer.Open(); }
        catch (Exception ex) { _logger.LogWarning(ex, "LibreHardwareMonitor kon niet worden geopend (probeer als administrator voor temperaturen)"); }
    }

    public SystemStats GetStats()
    {
        lock (_lock)
        {
            try
            {
                foreach (var hw in _computer.Hardware)
                {
                    hw.Update();
                    foreach (var sub in hw.SubHardware) sub.Update();
                }
            }
            catch (Exception ex) { _logger.LogDebug(ex, "Hardware update fout"); }

            double cpuLoad = 0, cpuTemp = 0;
            double gpuLoad = 0, gpuTemp = 0;
            double memUsed = 0, memAvail = 0, memPct = 0;
            long   netDown = 0, netUp   = 0;

            foreach (var hw in _computer.Hardware)
            {
                switch (hw.HardwareType)
                {
                    case HardwareType.Cpu:
                        foreach (var s in hw.Sensors)
                        {
                            if (s.SensorType == SensorType.Load && s.Name.Contains("Total"))
                                cpuLoad = s.Value ?? cpuLoad;
                            if (s.SensorType == SensorType.Temperature &&
                                (s.Name.Contains("Package") || s.Name.Contains("Tctl") || s.Name.Contains("Average")))
                                cpuTemp = s.Value ?? cpuTemp;
                        }
                        if (cpuTemp == 0)
                            cpuTemp = hw.Sensors
                                .FirstOrDefault(s => s.SensorType == SensorType.Temperature)
                                ?.Value ?? 0;
                        break;

                    case HardwareType.GpuNvidia:
                    case HardwareType.GpuAmd:
                    case HardwareType.GpuIntel:
                        foreach (var s in hw.Sensors)
                        {
                            if (s.SensorType == SensorType.Load && s.Name.Contains("Core"))
                                gpuLoad = s.Value ?? gpuLoad;
                            if (s.SensorType == SensorType.Temperature && s.Name.Contains("Core"))
                                gpuTemp = s.Value ?? gpuTemp;
                        }
                        break;

                    case HardwareType.Memory:
                        foreach (var s in hw.Sensors)
                        {
                            if (s.SensorType == SensorType.Data && s.Name == "Memory Used")
                                memUsed = s.Value ?? 0;
                            if (s.SensorType == SensorType.Data && s.Name == "Memory Available")
                                memAvail = s.Value ?? 0;
                            if (s.SensorType == SensorType.Load && s.Name == "Memory")
                                memPct = s.Value ?? 0;
                        }
                        break;

                    case HardwareType.Network:
                        foreach (var s in hw.Sensors)
                        {
                            if (s.SensorType == SensorType.Throughput && s.Name.Contains("Download"))
                                netDown += (long)(s.Value ?? 0);
                            if (s.SensorType == SensorType.Throughput && s.Name.Contains("Upload"))
                                netUp += (long)(s.Value ?? 0);
                        }
                        break;
                }
            }

            var (disks, diskPct) = GetDiskStats();
            double memTotal      = memUsed + memAvail;

            return new SystemStats(
                CpuLoad:        Math.Round(cpuLoad, 1),
                CpuTemp:        Math.Round(cpuTemp, 1),
                GpuLoad:        Math.Round(gpuLoad, 1),
                GpuTemp:        Math.Round(gpuTemp, 1),
                MemoryPercent:  Math.Round(memPct > 0 ? memPct : (memTotal > 0 ? memUsed / memTotal * 100 : 0), 1),
                MemoryUsedGb:   Math.Round(memUsed, 1),
                MemoryTotalGb:  Math.Round(memTotal, 1),
                DiskPercent:    Math.Round(diskPct, 1),
                NetworkDownBps: netDown,
                NetworkUpBps:   netUp,
                Disks:          disks
            );
        }
    }

    public void Dispose() => _computer.Close();

#else
    // ── Linux implementation — reads from /proc ────────────────────────────────
    private double _prevIdle, _prevTotal;
    private long   _prevNetRx, _prevNetTx;

    public SystemMonitorService(ILogger<SystemMonitorService> logger)
    {
        _logger = logger;
        // Prime the CPU and network counters on first call
        ReadCpuTimes(out _prevIdle, out _prevTotal);
        ReadNetBytes(out _prevNetRx, out _prevNetTx);
    }

    public SystemStats GetStats()
    {
        var cpuLoad = ReadCpuLoad();
        var (memUsed, memTotal, memPct) = ReadMemory();
        var (netDown, netUp) = ReadNetwork();
        var (disks, diskPct) = GetDiskStats();

        return new SystemStats(
            CpuLoad:        Math.Round(cpuLoad, 1),
            CpuTemp:        0,  // not easily available without sensors
            GpuLoad:        0,
            GpuTemp:        0,
            MemoryPercent:  Math.Round(memPct, 1),
            MemoryUsedGb:   Math.Round(memUsed, 1),
            MemoryTotalGb:  Math.Round(memTotal, 1),
            DiskPercent:    Math.Round(diskPct, 1),
            NetworkDownBps: netDown,
            NetworkUpBps:   netUp,
            Disks:          disks
        );
    }

    private double ReadCpuLoad()
    {
        try
        {
            ReadCpuTimes(out var idle, out var total);
            var diffIdle  = idle  - _prevIdle;
            var diffTotal = total - _prevTotal;
            _prevIdle  = idle;
            _prevTotal = total;
            return diffTotal > 0 ? (1.0 - diffIdle / diffTotal) * 100.0 : 0;
        }
        catch { return 0; }
    }

    private static void ReadCpuTimes(out double idle, out double total)
    {
        idle  = 0; total = 0;
        var line = File.ReadLines("/proc/stat").FirstOrDefault(l => l.StartsWith("cpu "));
        if (line == null) return;
        var parts = line.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length < 5) return;
        var values = parts.Skip(1).Select(double.Parse).ToArray();
        idle  = values[3]; // idle
        total = values.Sum();
    }

    private static (double usedGb, double totalGb, double pct) ReadMemory()
    {
        try
        {
            long memTotal = 0, memFree = 0, buffers = 0, cached = 0, sReclaimable = 0;
            foreach (var line in File.ReadLines("/proc/meminfo"))
            {
                var parts = line.Split(':', StringSplitOptions.TrimEntries);
                if (parts.Length < 2) continue;
                if (!long.TryParse(parts[1].Split(' ')[0], out var val)) continue;
                switch (parts[0])
                {
                    case "MemTotal":      memTotal      = val; break;
                    case "MemFree":       memFree       = val; break;
                    case "Buffers":       buffers       = val; break;
                    case "Cached":        cached        = val; break;
                    case "SReclaimable":  sReclaimable  = val; break;
                }
            }
            var used  = memTotal - memFree - buffers - cached - sReclaimable;
            var usedGb  = used      / 1024.0 / 1024.0;
            var totalGb = memTotal  / 1024.0 / 1024.0;
            var pct     = totalGb > 0 ? usedGb / totalGb * 100.0 : 0;
            return (usedGb, totalGb, pct);
        }
        catch { return (0, 0, 0); }
    }

    private (long downBps, long upBps) ReadNetwork()
    {
        try
        {
            ReadNetBytes(out var rx, out var tx);
            var down = Math.Max(0, rx - _prevNetRx);
            var up   = Math.Max(0, tx - _prevNetTx);
            _prevNetRx = rx; _prevNetTx = tx;
            return (down, up);
        }
        catch { return (0, 0); }
    }

    private static void ReadNetBytes(out long rx, out long tx)
    {
        rx = 0; tx = 0;
        foreach (var line in File.ReadLines("/proc/net/dev").Skip(2))
        {
            var parts = line.Split(':', StringSplitOptions.TrimEntries);
            if (parts.Length < 2) continue;
            var iface = parts[0].Trim();
            if (iface == "lo") continue;
            var nums = parts[1].Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (nums.Length >= 9 && long.TryParse(nums[0], out var r) && long.TryParse(nums[8], out var t))
            { rx += r; tx += t; }
        }
    }

    public void Dispose() { }
#endif

    // ── Shared: disk stats via DriveInfo (cross-platform) ─────────────────────
    private static (List<DiskDriveInfo> disks, double diskPct) GetDiskStats()
    {
        // In Docker the host's filesystems are bind-mounted read-only at HOST_ROOT (e.g. /hostfs);
        // read the real disks from there instead of the container's own overlay filesystem.
        if (OperatingSystem.IsLinux())
        {
            var hostRoot = Environment.GetEnvironmentVariable("HOST_ROOT")?.TrimEnd('/');
            if (!string.IsNullOrEmpty(hostRoot) && Directory.Exists(hostRoot))
            {
                var host = GetHostDisks(hostRoot);
                if (host.Count > 0) return (host, host[0].Percent);
            }
        }

        var disks = new List<DiskDriveInfo>();
        double diskPct = 0;
        try
        {
            var fixedDrives = DriveInfo.GetDrives()
                .Where(d => d.DriveType == DriveType.Fixed && d.IsReady)
                .ToList();

            foreach (var d in fixedDrives)
            {
                double usedGb  = Math.Round((d.TotalSize - d.AvailableFreeSpace) / 1e9, 1);
                double totalGb = Math.Round(d.TotalSize / 1e9, 1);
                double pct     = Math.Round((1.0 - (double)d.AvailableFreeSpace / d.TotalSize) * 100, 1);
                disks.Add(new DiskDriveInfo(d.Name.TrimEnd('\\', '/'), usedGb, totalGb, pct));
            }
            if (disks.Count > 0) diskPct = disks[0].Percent;
        }
        catch { }
        return (disks, diskPct);
    }

    // ── Linux host disks (Docker with "/:/hostfs:ro,rslave") ───────────────────
    private static readonly HashSet<string> DiskFsTypes =
        ["ext2", "ext3", "ext4", "xfs", "btrfs", "zfs", "f2fs", "jfs", "ntfs", "ntfs3", "fuseblk", "exfat"];

    private static readonly string[] SkipPrefixes =
        ["/proc", "/sys", "/dev", "/run", "/boot", "/var/lib/docker", "/var/lib/containers", "/snap"];

    /// Real disks of the host, found through the container's mount table. Docker bind mounts
    /// are recursive, so every host mount (OMV data disks under /srv included) shows up below hostRoot.
    private static List<DiskDriveInfo> GetHostDisks(string hostRoot)
    {
        var result = new List<(DiskDriveInfo Disk, bool IsRoot)>();
        try
        {
            var labels = ReadDiskLabels(hostRoot);
            var seen   = new Dictionary<string, (string MountPoint, string Source)>(); // device id -> shortest mount

            foreach (var line in File.ReadLines("/proc/self/mountinfo"))
            {
                // 36 35 98:0 /mnt1 /mnt/parent rw,noatime master:1 - ext4 /dev/sdb1 rw
                var sep = line.IndexOf(" - ", StringComparison.Ordinal);
                if (sep < 0) continue;
                var pre  = line[..sep].Split(' ');
                var post = line[(sep + 3)..].Split(' ');
                if (pre.Length < 5 || post.Length < 2) continue;

                var deviceId   = pre[2];
                var mountPoint = UnescapeMount(pre[4]);
                var fsType     = post[0];
                var source     = UnescapeMount(post[1]);

                if (!DiskFsTypes.Contains(fsType)) continue;
                if (mountPoint != hostRoot && !mountPoint.StartsWith(hostRoot + "/", StringComparison.Ordinal)) continue;

                var hostPath = mountPoint == hostRoot ? "/" : mountPoint[hostRoot.Length..];
                if (SkipPrefixes.Any(p => hostPath == p || hostPath.StartsWith(p + "/", StringComparison.Ordinal))) continue;

                if (!seen.TryGetValue(deviceId, out var prev) || mountPoint.Length < prev.MountPoint.Length)
                    seen[deviceId] = (mountPoint, source);
            }

            foreach (var (mountPoint, source) in seen.Values)
            {
                var drive = new DriveInfo(mountPoint);
                if (!drive.IsReady || drive.TotalSize < 1_000_000_000) continue;   // skip tiny partitions

                var hostPath = mountPoint == hostRoot ? "/" : mountPoint[hostRoot.Length..];
                var isRoot   = hostPath == "/";
                double usedGb  = Math.Round((drive.TotalSize - drive.AvailableFreeSpace) / 1e9, 1);
                double totalGb = Math.Round(drive.TotalSize / 1e9, 1);
                double pct     = Math.Round((1.0 - (double)drive.AvailableFreeSpace / drive.TotalSize) * 100, 1);
                var name = isRoot ? "Systeem" : DiskName(hostPath, source, labels);
                result.Add((new DiskDriveInfo(name, usedGb, totalGb, pct), isRoot));
            }
        }
        catch { /* fall back to the container view */ }

        return result
            .OrderByDescending(r => r.IsRoot)
            .ThenByDescending(r => r.Disk.TotalGb)
            .Select(r => r.Disk)
            .ToList();
    }

    /// device name (e.g. "sdb1") -> filesystem label, from /dev/disk/by-label.
    private static Dictionary<string, string> ReadDiskLabels(string hostRoot)
    {
        var map = new Dictionary<string, string>();
        try
        {
            var dir = Path.Combine(hostRoot, "dev/disk/by-label");
            if (!Directory.Exists(dir)) return map;
            foreach (var link in Directory.GetFiles(dir))
            {
                var target = new FileInfo(link).LinkTarget;
                if (target != null) map[Path.GetFileName(target)] = UnescapeMount(Path.GetFileName(link).Replace("\\x20", " "));
            }
        }
        catch { }
        return map;
    }

    private static string DiskName(string hostPath, string source, Dictionary<string, string> labels)
    {
        var device = Path.GetFileName(source);
        if (labels.TryGetValue(device, out var label) && label.Length > 0) return label;

        var last = Path.GetFileName(hostPath.TrimEnd('/'));
        // OMV mounts disks as /srv/dev-disk-by-label-<label> or /srv/dev-disk-by-uuid-<uuid>
        if (last.StartsWith("dev-disk-by-label-", StringComparison.Ordinal)) return last["dev-disk-by-label-".Length..];
        if (last.StartsWith("dev-disk-by-", StringComparison.Ordinal) || last.Length > 16)
            return string.IsNullOrEmpty(device) ? "Schijf" : device;
        return last;
    }

    /// mountinfo escapes spaces etc. as octal: "\040".
    private static string UnescapeMount(string s) =>
        System.Text.RegularExpressions.Regex.Replace(s, @"\\([0-7]{3})", m => ((char)Convert.ToInt32(m.Groups[1].Value, 8)).ToString());
}
