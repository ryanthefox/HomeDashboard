using System.Text.Json;
using HomeDashboard.Api.Models;

namespace HomeDashboard.Api.Services;

public sealed class AircoService
{
    private readonly LgThinqClient           _client;
    private readonly ILogger<AircoService>   _log;

    // Mode mapping: frontend values → ThinQ Connect enum values
    private static readonly Dictionary<string, string> ModeToThinq = new(StringComparer.OrdinalIgnoreCase)
    {
        ["cool"] = "COOL",
        ["heat"] = "HEAT",
        ["fan"]  = "FAN",
        ["dry"]  = "DRY",
        ["auto"] = "AUTO",
    };
    private static readonly Dictionary<string, string> ThinqToMode = new(StringComparer.OrdinalIgnoreCase)
    {
        ["COOL"]       = "cool",
        ["HEAT"]       = "heat",
        ["FAN"]        = "fan",
        ["DRY"]        = "dry",
        ["AUTO"]       = "auto",
        ["AIR_CLEAN"]  = "fan",
        ["POWER_OFF"]  = "cool",  // treat as cool when restoring
    };

    // Fan speed mapping: frontend int → ThinQ string
    private static readonly Dictionary<int, string> FanToThinq = new()
    {
        [0] = "AUTO",
        [2] = "LOW",
        [3] = "MID",
        [4] = "HIGH",
        [6] = "POWER",   // Turbo
    };
    private static readonly Dictionary<string, int> ThinqToFan = new(StringComparer.OrdinalIgnoreCase)
    {
        ["AUTO"]  = 0,
        ["LOW"]   = 2,
        ["MID"]   = 3,
        ["HIGH"]  = 4,
        ["POWER"] = 6,
    };

    // Simple in-memory cache to avoid hammering the LG rate limit
    private List<AircoDevice>? _cachedDevices;
    private DateTime           _cacheExpiry = DateTime.MinValue;
    private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(2);

    public AircoService(LgThinqClient client, ILogger<AircoService> log)
    {
        _client = client;
        _log    = log;
    }

    // ── Queries ─────────────────────────────────────────────────────────────────

    public async Task<object?> GetRawDevicesAsync()
        => await _client.GetDevicesAsync();

    public async Task<object?> GetRawDeviceStateAsync(string deviceId)
        => await _client.GetDeviceStateAsync(deviceId);

    public async Task<List<AircoDevice>> GetDevicesAsync(bool forceRefresh = false)
    {
        if (!forceRefresh && _cachedDevices != null && DateTime.UtcNow < _cacheExpiry)
            return _cachedDevices;

        var data = await _client.GetDevicesAsync();
        if (data == null) return [];

        // Response may be a bare array or wrapped
        JsonElement items;
        if (data.Value.ValueKind == JsonValueKind.Array)
            items = data.Value;
        else if (data.Value.TryGetProperty("items", out var arr))
            items = arr;
        else
        {
            _log.LogWarning("LG ThinQ: unexpected devices response shape: {Kind}", data.Value.ValueKind);
            return [];
        }

        var result = new List<AircoDevice>();
        foreach (var item in items.EnumerateArray())
        {
            try
            {
                var id   = item.TryGetProperty("deviceId",   out var d) ? d.GetString()! : "";
                var info = item.TryGetProperty("deviceInfo", out var i) ? i : default;
                var name = info.ValueKind != JsonValueKind.Undefined && info.TryGetProperty("alias", out var a)
                    ? a.GetString()! : id;

                var device = await GetDeviceWithStateAsync(id, name);
                result.Add(device);
            }
            catch (Exception ex)
            {
                _log.LogWarning(ex, "LG ThinQ: failed to load device, skipping");
            }
        }

        _cachedDevices = result;
        _cacheExpiry   = DateTime.UtcNow.Add(CacheTtl);
        return result;
    }

    private async Task<AircoDevice> GetDeviceWithStateAsync(string id, string name)
    {
        var state = await _client.GetDeviceStateAsync(id);
        _log.LogDebug("LG ThinQ state for {Name}: {State}", name,
            state?.ToString() ?? "null");

        // Defaults
        var isOn    = false;
        var curTemp = 0;
        var tgtTemp = 22;
        var mode    = "cool";
        var fan     = 0;

        if (state != null && state.Value.ValueKind == JsonValueKind.Object)
        {
            // ThinQ Connect wraps each resource in an array of {locationName, rawData} objects
            // Try both flat and wrapped formats
            ParseState(state.Value, ref isOn, ref curTemp, ref tgtTemp, ref mode, ref fan);
        }

        return new AircoDevice(id, name, true, isOn, curTemp, tgtTemp, mode, fan);
    }

    // ── State parser ────────────────────────────────────────────────────────────

    /// Handles both ThinQ Connect state shapes:
    ///   Flat:    { "operation": { "airConOperationMode": "COOL" }, ... }
    ///   Wrapped: { "operation": [{ "locationName": "...", "rawData": { "airConOperationMode": "COOL" } }], ... }
    private void ParseState(JsonElement root,
        ref bool isOn, ref int curTemp, ref int tgtTemp, ref string mode, ref int fan)
    {
        if (TryGetResource(root, "operation", out var op))
        {
            if (op.TryGetProperty("airConOperationMode", out var opMode))
            {
                var opStr = opMode.GetString() ?? "";
                isOn = opStr.Length > 0
                    && !opStr.Equals("POWER_OFF", StringComparison.OrdinalIgnoreCase)
                    && !opStr.Equals("STANDBY",   StringComparison.OrdinalIgnoreCase);
                // Don't read mode from here — airConJobMode is the actual mode field
            }
        }

        // airConJobMode.currentJobMode holds the real mode (persists even when off)
        if (TryGetResource(root, "airConJobMode", out var jobMode))
        {
            if (jobMode.TryGetProperty("currentJobMode", out var jm))
                mode = ThinqToMode.GetValueOrDefault(jm.GetString() ?? "", "cool");
        }

        // ThinQ Connect may use "temperature" or "temperatureInUnits"; fields may or may not have "C" suffix
        var tempKey = TryGetResource(root, "temperature", out var temps)
            ? "temperature"
            : TryGetResource(root, "temperatureInUnits", out temps) ? "temperatureInUnits" : null;

        if (tempKey != null)
        {
            if      (temps.TryGetProperty("currentTemperature",  out var ct)) curTemp = (int)Math.Round(ct.GetDouble());
            else if (temps.TryGetProperty("currentTemperatureC", out ct))     curTemp = (int)Math.Round(ct.GetDouble());

            if      (temps.TryGetProperty("targetTemperature",   out var tt)) tgtTemp = (int)Math.Round(tt.GetDouble());
            else if (temps.TryGetProperty("targetTemperatureC",  out tt))     tgtTemp = (int)Math.Round(tt.GetDouble());
        }

        if (TryGetResource(root, "airFlow", out var af) &&
            af.TryGetProperty("windStrength", out var ws))
        {
            fan = ThinqToFan.GetValueOrDefault(ws.GetString() ?? "", 0);
        }
    }

    /// Extracts a resource object from either flat or array-wrapped format.
    private static bool TryGetResource(JsonElement root, string key, out JsonElement result)
    {
        if (!root.TryGetProperty(key, out var prop)) { result = default; return false; }

        if (prop.ValueKind == JsonValueKind.Object)  { result = prop; return true; }

        // Array format: [{ "locationName": "...", "rawData": { ... } }]
        if (prop.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in prop.EnumerateArray())
            {
                if (item.TryGetProperty("rawData", out var raw)) { result = raw; return true; }
            }
        }

        result = default;
        return false;
    }

    // ── Commands ────────────────────────────────────────────────────────────────

    public async Task<bool> SetPowerAsync(string deviceId, bool on)
    {
        if (!on)
            return await ControlAsync(deviceId, new
            {
                operation = new { airConOperationMode = "POWER_OFF" }
            });

        return await ControlAsync(deviceId, new
        {
            operation = new { airConOperationMode = "POWER_ON" }
        });
    }

    public async Task<bool> SetTargetTemperatureAsync(string deviceId, double temp)
    {
        var t = (int)Math.Round(temp);
        // Try "temperature"/"targetTemperature" first (standard ThinQ Connect);
        // fallback field name is handled server-side — just send both keys so either format is accepted.
        return await ControlAsync(deviceId, new
        {
            temperature = new { targetTemperature = t }
        });
    }

    public async Task<bool> SetModeAsync(string deviceId, string mode)
    {
        var thinqMode = ModeToThinq.GetValueOrDefault(mode, "COOL");
        return await ControlAsync(deviceId, new
        {
            airConJobMode = new { currentJobMode = thinqMode }
        });
    }

    public async Task<bool> SetFanSpeedAsync(string deviceId, int speed)
    {
        var thinqFan = FanToThinq.GetValueOrDefault(speed, "AUTO");
        return await ControlAsync(deviceId, new
        {
            airFlow = new { windStrength = thinqFan }
        });
    }

    // ── Helpers ─────────────────────────────────────────────────────────────────

    private async Task<bool> ControlAsync(string deviceId, object payload)
    {
        var result = await _client.ControlAsync(deviceId, payload);
        if (result == null)
        {
            _log.LogWarning("LG ThinQ: control command returned null for device {Id}", deviceId);
            return false;
        }
        // Invalidate cache so next poll fetches fresh state
        _cacheExpiry = DateTime.MinValue;
        return true;
    }
}
