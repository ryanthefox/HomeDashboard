namespace HomeDashboard.Api.Models;

public record AircoDevice(
    string DeviceId,
    string Name,
    bool IsOnline,
    bool IsOn,
    int CurrentTemperature,
    int TargetTemperature,
    string Mode,        // cool | heat | fan | dry | auto
    int FanSpeed        // 0=auto 2=low 3=med 4=high 6=turbo
);

public record SetTemperatureRequest(double Temperature);
public record SetModeRequest(string Mode);
public record SetPowerRequest(bool On);
public record SetFanSpeedRequest(int Speed);
