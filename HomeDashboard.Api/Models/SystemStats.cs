namespace HomeDashboard.Api.Models;

public record DiskDriveInfo(string Name, double UsedGb, double TotalGb, double Percent);

public record SystemStats(
    double CpuLoad,
    double CpuTemp,
    double GpuLoad,
    double GpuTemp,
    double MemoryPercent,
    double MemoryUsedGb,
    double MemoryTotalGb,
    double DiskPercent,
    long   NetworkDownBps,
    long   NetworkUpBps,
    IReadOnlyList<DiskDriveInfo> Disks
);
