using System.Text.Json;
using System.Text.Json.Nodes;
using HomeDashboard.Api.Models;

namespace HomeDashboard.Api.Services;

public class HueService
{
    private readonly IHttpClientFactory _httpFactory;
    private readonly IConfiguration _config;
    private readonly ILogger<HueService> _logger;

    public HueService(IHttpClientFactory httpFactory, IConfiguration config, ILogger<HueService> logger)
    {
        _httpFactory = httpFactory;
        _config = config;
        _logger = logger;
    }

    private string? BaseUrl
    {
        get
        {
            var ip = _config["HueBridge:BridgeIp"];
            var key = _config["HueBridge:ApiKey"];
            if (string.IsNullOrWhiteSpace(ip) || ip.Contains("xxx") ||
                string.IsNullOrWhiteSpace(key) || key.Contains("your-"))
            {
                _logger.LogWarning("Hue bridge niet geconfigureerd. Vul BridgeIp en ApiKey in appsettings.json in.");
                return null;
            }
            return $"http://{ip}/api/{key}";
        }
    }

    private HttpClient CreateClient()
    {
        var client = _httpFactory.CreateClient("hue");
        client.Timeout = TimeSpan.FromSeconds(5);
        return client;
    }

    public async Task<List<HueLight>> GetLightsAsync()
    {
        try
        {
            if (BaseUrl is null) return [];
            var client = CreateClient();
            var json = await client.GetFromJsonAsync<JsonElement>($"{BaseUrl}/lights");
            var lights = new List<HueLight>();

            foreach (var prop in json.EnumerateObject())
            {
                var id = prop.Name;
                var light = prop.Value;
                var state = light.GetProperty("state");

                int? hue = state.TryGetProperty("hue", out var hueEl) ? hueEl.GetInt32() : null;
                int? sat = state.TryGetProperty("sat", out var satEl) ? satEl.GetInt32() : null;
                int? ct = state.TryGetProperty("ct", out var ctEl) ? ctEl.GetInt32() : null;

                lights.Add(new HueLight(
                    Id: id,
                    Name: light.GetProperty("name").GetString() ?? $"Lamp {id}",
                    IsOn: state.GetProperty("on").GetBoolean(),
                    Brightness: state.TryGetProperty("bri", out var briEl) ? briEl.GetInt32() : 0,
                    ColorHue: hue,
                    ColorSat: sat,
                    ColorTemp: ct,
                    IsReachable: state.TryGetProperty("reachable", out var reachEl) && reachEl.GetBoolean(),
                    Type: light.GetProperty("type").GetString() ?? "Unknown"
                ));
            }

            return lights;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch Hue lights");
            return [];
        }
    }

    public async Task<List<HueRoom>> GetRoomsAsync()
    {
        var lights = await GetLightsAsync();
        if (lights.Count == 0) return [];

        var lightDict = lights.ToDictionary(l => l.Id);

        try
        {
            if (BaseUrl is null) return [];
            var client = CreateClient();
            var json = await client.GetFromJsonAsync<JsonElement>($"{BaseUrl}/groups");
            var rooms = new List<HueRoom>();

            foreach (var prop in json.EnumerateObject())
            {
                var group = prop.Value;
                if (!group.TryGetProperty("type", out var typeEl)) continue;
                var type = typeEl.GetString();
                if (type != "Room" && type != "Zone") continue;

                var roomLights = group.GetProperty("lights")
                    .EnumerateArray()
                    .Select(l => l.GetString()!)
                    .Where(id => lightDict.ContainsKey(id))
                    .Select(id => lightDict[id])
                    .ToList();

                var state = group.GetProperty("state");
                bool anyOn = state.TryGetProperty("any_on", out var ao) && ao.GetBoolean();
                bool allOn = state.TryGetProperty("all_on", out var al) && al.GetBoolean();

                rooms.Add(new HueRoom(
                    Id: prop.Name,
                    Name: group.GetProperty("name").GetString() ?? "Ruimte",
                    Lights: roomLights,
                    AnyOn: anyOn,
                    AllOn: allOn
                ));
            }

            // Fallback: no rooms configured
            if (rooms.Count == 0)
                rooms.Add(new HueRoom("all", "Alle lampen", lights,
                    lights.Any(l => l.IsOn), lights.All(l => l.IsOn)));

            return rooms;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch Hue rooms");
            return [new HueRoom("all", "Alle lampen", lights,
                lights.Any(l => l.IsOn), lights.All(l => l.IsOn))];
        }
    }

    public async Task<List<HueScene>> GetScenesForGroupAsync(string groupId)
    {
        try
        {
            if (BaseUrl is null) return [];
            var client = CreateClient();
            var json = await client.GetFromJsonAsync<JsonElement>($"{BaseUrl}/scenes");
            var scenes = new List<HueScene>();
            foreach (var prop in json.EnumerateObject())
            {
                var s = prop.Value;
                if (!s.TryGetProperty("group", out var g) || g.GetString() != groupId) continue;
                var name = s.TryGetProperty("name", out var n) ? n.GetString()! : prop.Name;
                scenes.Add(new HueScene(prop.Name, name));
            }
            return [.. scenes.OrderBy(s => s.Name)];
        }
        catch (Exception ex) { _logger.LogError(ex, "Failed to fetch scenes for group {Id}", groupId); return []; }
    }

    public async Task<bool> ActivateSceneAsync(string groupId, string sceneId)
    {
        try
        {
            if (BaseUrl is null) return false;
            var client = CreateClient();
            var body = new JsonObject { ["scene"] = sceneId };
            var resp = await client.PutAsJsonAsync($"{BaseUrl}/groups/{groupId}/action", body);
            return resp.IsSuccessStatusCode;
        }
        catch (Exception ex) { _logger.LogError(ex, "Failed to activate scene {Id}", sceneId); return false; }
    }

    public async Task<bool> SetGroupStateAsync(string groupId, bool on)
    {
        try
        {
            if (BaseUrl is null) return false;
            var client = CreateClient();
            var body = new JsonObject { ["on"] = on };
            var response = await client.PutAsJsonAsync($"{BaseUrl}/groups/{groupId}/action", body);
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to set group {Id} state", groupId);
            return false;
        }
    }

    public async Task<bool> SetLightStateAsync(string id, HueLightStateRequest request)
    {
        try
        {
            if (BaseUrl is null) return false;
            var client = CreateClient();
            var body = new JsonObject();

            if (request.On.HasValue) body["on"] = request.On.Value;
            if (request.Brightness.HasValue) body["bri"] = Math.Clamp(request.Brightness.Value, 1, 254);
            if (request.Hue.HasValue) body["hue"] = Math.Clamp(request.Hue.Value, 0, 65535);
            if (request.Sat.HasValue) body["sat"] = Math.Clamp(request.Sat.Value, 0, 254);
            if (request.Ct.HasValue) body["ct"] = Math.Clamp(request.Ct.Value, 153, 500);

            var response = await client.PutAsJsonAsync($"{BaseUrl}/lights/{id}/state", body);
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to set Hue light {Id} state", id);
            return false;
        }
    }
}
