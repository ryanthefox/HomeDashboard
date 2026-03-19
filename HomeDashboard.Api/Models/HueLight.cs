namespace HomeDashboard.Api.Models;

public record HueLight(
    string Id,
    string Name,
    bool IsOn,
    int Brightness,
    int? ColorHue,
    int? ColorSat,
    int? ColorTemp,
    bool IsReachable,
    string Type
);

public record HueLightStateRequest(
    bool? On,
    int? Brightness,
    int? Hue,
    int? Sat,
    int? Ct
);

public record HueRoom(
    string Id,
    string Name,
    List<HueLight> Lights,
    bool AnyOn,
    bool AllOn
);

public record HueGroupActionRequest(bool On);

public record HueScene(string Id, string Name);
