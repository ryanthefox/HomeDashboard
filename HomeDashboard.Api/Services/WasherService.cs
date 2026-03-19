using System.Text.Json;
using HomeDashboard.Api.Models;

namespace HomeDashboard.Api.Services;

public sealed class WasherService
{
    private readonly LgThinqClient         _client;
    private readonly ILogger<WasherService> _log;

    // Dutch labels for run states
    private static readonly Dictionary<string, string> RunStateLabel = new(StringComparer.OrdinalIgnoreCase)
    {
        ["STANDBY"]          = "standby",
        ["POWER_OFF"]        = "standby",
        ["INITIAL"]          = "standby",
        ["RUNNING"]          = "running",
        ["DETECTING"]        = "running",
        ["COURSE_DOWNLOAD"]  = "running",
        ["PAUSE"]            = "pause",
        ["RINSING"]          = "rinsing",
        ["SPINNING"]         = "spinning",
        ["DRYING"]           = "drying",
        ["COOLING"]          = "cooling",
        ["STEAM_SOFTENING"]  = "steam",
        ["END"]              = "end",
        ["COMPLETE"]         = "end",
        ["ERROR"]            = "error",
    };

    // Dutch labels for wash cycles
    private static readonly Dictionary<string, string> CycleLabel = new(StringComparer.OrdinalIgnoreCase)
    {
        ["COTTON"]           = "Katoen",
        ["SYNTHETICS"]       = "Synthetisch",
        ["WOOL"]             = "Wol",
        ["DRUM_CLEAN"]       = "Trommel reinigen",
        ["QUICK_WASH"]       = "Snel wassen",
        ["RINSE"]            = "Spoelen",
        ["SPIN"]             = "Centrifugeren",
        ["DELICATE"]         = "Fijn",
        ["MIXED"]            = "Mix",
        ["NORMAL"]           = "Normaal",
        ["HEAVY_DUTY"]       = "Zwaar",
        ["SANITIZE"]         = "Sanitize",
        ["STEAM_SOFTENING"]  = "Stoomverzachten",
        ["BEDDING"]          = "Beddengoed",
        ["SPORTS"]           = "Sport",
        ["DOWNLOAD"]         = "Download",
        ["AIR_REFRESH"]      = "Verfrissen",
    };

    // In-memory cache — short TTL since washer state changes quickly
    private List<WasherDevice>? _cache;
    private DateTime             _cacheExpiry = DateTime.MinValue;
    private static readonly TimeSpan CacheTtl = TimeSpan.FromSeconds(30);

    public WasherService(LgThinqClient client, ILogger<WasherService> log)
    {
        _client = client;
        _log    = log;
    }

    public async Task<object?> GetRawDevicesAsync()
        => await _client.GetDevicesAsync();

    public async Task<object?> GetRawDeviceStateAsync(string deviceId)
        => await _client.GetDeviceStateAsync(deviceId);

    public async Task<List<WasherDevice>> GetDevicesAsync(bool forceRefresh = false)
    {
        if (!forceRefresh && _cache != null && DateTime.UtcNow < _cacheExpiry)
            return _cache;

        var data = await _client.GetDevicesAsync();
        if (data == null) return [];

        JsonElement items;
        if (data.Value.ValueKind == JsonValueKind.Array)
            items = data.Value;
        else if (data.Value.TryGetProperty("items", out var arr))
            items = arr;
        else
        {
            _log.LogWarning("LG ThinQ: unexpected devices response shape");
            return [];
        }

        var result = new List<WasherDevice>();
        foreach (var item in items.EnumerateArray())
        {
            try
            {
                var id   = item.TryGetProperty("deviceId",   out var d) ? d.GetString()! : "";
                var info = item.TryGetProperty("deviceInfo", out var i) ? i : default;

                // Filter to washer device types only
                var deviceType = info.ValueKind != JsonValueKind.Undefined && info.TryGetProperty("deviceType", out var dt)
                    ? (dt.GetString() ?? "") : "";

                if (!deviceType.Contains("WASHER", StringComparison.OrdinalIgnoreCase))
                    continue;

                var name = info.ValueKind != JsonValueKind.Undefined && info.TryGetProperty("alias", out var a)
                    ? a.GetString()! : id;

                var washer = await GetWasherWithStateAsync(id, name);
                result.Add(washer);
            }
            catch (Exception ex)
            {
                _log.LogWarning(ex, "LG ThinQ: failed to parse washer device, skipping");
            }
        }

        _cache       = result;
        _cacheExpiry = DateTime.UtcNow.Add(CacheTtl);
        return result;
    }

    private async Task<WasherDevice> GetWasherWithStateAsync(string id, string name)
    {
        var state = await _client.GetDeviceStateAsync(id);
        _log.LogDebug("LG ThinQ washer state for {Name}: {State}", name, state?.ToString() ?? "null");

        var runState = "standby";
        var cycle    = "";
        var remainMin = 0;

        if (state != null && state.Value.ValueKind == JsonValueKind.Object)
        {
            // runState.currentState
            if (TryGetResource(state.Value, "runState", out var rs) &&
                rs.TryGetProperty("currentState", out var cs))
            {
                var raw = cs.GetString() ?? "";
                runState = RunStateLabel.GetValueOrDefault(raw, raw.ToLower());
            }

            // washerJobMode.currentJobMode
            if (TryGetResource(state.Value, "washerJobMode", out var jm) &&
                jm.TryGetProperty("currentJobMode", out var cjm))
            {
                var raw = cjm.GetString() ?? "";
                cycle = CycleLabel.GetValueOrDefault(raw, raw);
            }

            // timer: remainTimeHour + remainTimeMinute
            if (TryGetResource(state.Value, "timer", out var timer))
            {
                var hours = timer.TryGetProperty("remainTimeHour",   out var h) ? h.GetInt32() : 0;
                var mins  = timer.TryGetProperty("remainTimeMinute", out var m) ? m.GetInt32() : 0;
                remainMin = hours * 60 + mins;
            }
        }

        return new WasherDevice(id, name, true, runState, cycle, remainMin);
    }

    /// Handles both flat and array-wrapped ThinQ Connect state shapes.
    private static bool TryGetResource(JsonElement root, string key, out JsonElement result)
    {
        if (!root.TryGetProperty(key, out var prop)) { result = default; return false; }

        if (prop.ValueKind == JsonValueKind.Object) { result = prop; return true; }

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
}
