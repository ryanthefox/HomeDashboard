using System.Text.Json;
using HomeDashboard.Api.Models;

namespace HomeDashboard.Api.Services;

public class WeatherService
{
    private readonly HttpClient _http;
    private readonly IConfiguration _config;
    private readonly ILogger<WeatherService> _logger;

    public WeatherService(IHttpClientFactory httpFactory, IConfiguration config, ILogger<WeatherService> logger)
    {
        _http = httpFactory.CreateClient("weather");
        _config = config;
        _logger = logger;
    }

    public async Task<WeatherData?> GetCurrentWeatherAsync()
    {
        try
        {
            var lat = _config.GetValue<double>("Weather:Latitude", 52.0259);
            var lon = _config.GetValue<double>("Weather:Longitude", 5.5553);
            var tz  = _config.GetValue<string>("Weather:Timezone", "Europe/Amsterdam");
            var latStr = lat.ToString(System.Globalization.CultureInfo.InvariantCulture);
            var lonStr = lon.ToString(System.Globalization.CultureInfo.InvariantCulture);

            var url = $"https://api.open-meteo.com/v1/forecast" +
                      $"?latitude={latStr}&longitude={lonStr}" +
                      $"&current=temperature_2m,apparent_temperature,relative_humidity_2m," +
                      $"wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation,is_day,weather_code" +
                      $"&hourly=temperature_2m,precipitation_probability,weather_code,is_day" +
                      $"&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max,precipitation_sum,uv_index_max,sunrise,sunset" +
                      $"&forecast_days=7" +
                      $"&timezone={Uri.EscapeDataString(tz!)}";

            var json    = await _http.GetFromJsonAsync<JsonElement>(url);
            var current = json.GetProperty("current");
            var code    = current.GetProperty("weather_code").GetInt32();
            var dailyEl = json.GetProperty("daily");

            var hourly = ParseHourly(json.GetProperty("hourly"));
            var daily  = ParseDaily(dailyEl);

            var uvIndex     = dailyEl.GetProperty("uv_index_max").EnumerateArray().FirstOrDefault().GetDouble();
            var sunriseRaw  = dailyEl.GetProperty("sunrise").EnumerateArray().FirstOrDefault().GetString() ?? "";
            var sunsetRaw   = dailyEl.GetProperty("sunset").EnumerateArray().FirstOrDefault().GetString() ?? "";
            var sunriseTime = DateTime.TryParse(sunriseRaw, out var sr) ? sr.ToString("HH:mm") : sunriseRaw;
            var sunsetTime  = DateTime.TryParse(sunsetRaw,  out var ss) ? ss.ToString("HH:mm") : sunsetRaw;

            var (grassPollen, treePollen) = await GetPollenAsync(latStr, lonStr, tz!);

            return new WeatherData(
                Temperature:   current.GetProperty("temperature_2m").GetDouble(),
                FeelsLike:     current.GetProperty("apparent_temperature").GetDouble(),
                Humidity:      current.GetProperty("relative_humidity_2m").GetDouble(),
                WindSpeed:     current.GetProperty("wind_speed_10m").GetDouble(),
                WindDirection: current.GetProperty("wind_direction_10m").GetDouble(),
                WindGusts:     current.GetProperty("wind_gusts_10m").GetDouble(),
                Precipitation: current.GetProperty("precipitation").GetDouble(),
                IsDay:         current.GetProperty("is_day").GetInt32() == 1,
                WeatherCode:   code,
                Condition:     GetCondition(code),
                Icon:          GetIcon(code),
                UpdatedAt:     current.GetProperty("time").GetString() ?? DateTime.Now.ToString("o"),
                UvIndex:       uvIndex,
                SunriseTime:   sunriseTime,
                SunsetTime:    sunsetTime,
                GrassPollen:   grassPollen,
                TreePollen:    treePollen,
                Hourly:        hourly,
                Daily:         daily
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch weather data");
            return null;
        }
    }

    private async Task<(double? GrassPollen, double? TreePollen)> GetPollenAsync(string lat, string lon, string tz)
    {
        try
        {
            var url = $"https://air-quality-api.open-meteo.com/v1/air-quality" +
                      $"?latitude={lat}&longitude={lon}" +
                      $"&hourly=grass_pollen,birch_pollen,alder_pollen" +
                      $"&timezone={Uri.EscapeDataString(tz)}&forecast_days=1";

            var json   = await _http.GetFromJsonAsync<JsonElement>(url);
            var hourly = json.GetProperty("hourly");

            double? Max(string field) => hourly.GetProperty(field).EnumerateArray()
                .Select(e => e.ValueKind != JsonValueKind.Null ? (double?)e.GetDouble() : null)
                .Where(v => v.HasValue).DefaultIfEmpty(null).Max();

            var grass = Max("grass_pollen");
            var birch = Max("birch_pollen");
            var alder = Max("alder_pollen");
            var tree  = (birch.HasValue || alder.HasValue) ? (double?)((birch ?? 0) + (alder ?? 0)) : null;

            return (grass, tree);
        }
        catch
        {
            return (null, null);
        }
    }

    private static IReadOnlyList<HourlyForecastItem> ParseHourly(JsonElement hourlyEl)
    {
        try
        {
            var times  = hourlyEl.GetProperty("time").EnumerateArray().Select(e => e.GetString()!).ToList();
            var temps  = hourlyEl.GetProperty("temperature_2m").EnumerateArray().Select(e => e.GetDouble()).ToList();
            var probs  = hourlyEl.GetProperty("precipitation_probability").EnumerateArray().Select(e => e.GetInt32()).ToList();
            var codes  = hourlyEl.GetProperty("weather_code").EnumerateArray().Select(e => e.GetInt32()).ToList();
            var isDays = hourlyEl.GetProperty("is_day").EnumerateArray().Select(e => e.GetInt32() == 1).ToList();

            var nowHour = DateTime.Now.ToString("yyyy-MM-ddTHH:00");
            var start   = times.FindIndex(t => string.Compare(t, nowHour, StringComparison.Ordinal) > 0);
            if (start < 0) start = 0;

            return Enumerable.Range(start, Math.Min(12, times.Count - start))
                .Select(i =>
                {
                    var isDay = i < isDays.Count && isDays[i];
                    var icon  = GetIcon(codes[i]);
                    // Replace day-only icons with night equivalents
                    if (!isDay)
                    {
                        if (icon == "sun")       icon = "moon";
                        else if (icon == "cloud-sun") icon = "cloud";
                    }
                    return new HourlyForecastItem(
                        Time: times[i],
                        Temperature: temps[i],
                        PrecipitationProbability: probs[i],
                        WeatherCode: codes[i],
                        Icon: icon
                    );
                })
                .ToList();
        }
        catch { return []; }
    }

    private static IReadOnlyList<DailyForecastItem> ParseDaily(JsonElement dailyEl)
    {
        try
        {
            var dates  = dailyEl.GetProperty("time").EnumerateArray().Select(e => e.GetString()!).ToList();
            var maxT   = dailyEl.GetProperty("temperature_2m_max").EnumerateArray().Select(e => e.GetDouble()).ToList();
            var minT   = dailyEl.GetProperty("temperature_2m_min").EnumerateArray().Select(e => e.GetDouble()).ToList();
            var codes  = dailyEl.GetProperty("weather_code").EnumerateArray().Select(e => e.GetInt32()).ToList();
            var probs  = dailyEl.GetProperty("precipitation_probability_max").EnumerateArray().Select(e => e.GetInt32()).ToList();
            var sums   = dailyEl.GetProperty("precipitation_sum").EnumerateArray().Select(e => e.GetDouble()).ToList();

            return Enumerable.Range(0, dates.Count)
                .Select(i => new DailyForecastItem(
                    Date: dates[i],
                    TempMax: Math.Round(maxT[i], 1),
                    TempMin: Math.Round(minT[i], 1),
                    WeatherCode: codes[i],
                    Icon: GetIcon(codes[i]),
                    PrecipitationProbability: probs[i],
                    PrecipitationSum: Math.Round(sums[i], 1)
                ))
                .ToList();
        }
        catch { return []; }
    }

    private static string GetCondition(int code) => code switch
    {
        0            => "Helder",
        1            => "Overwegend helder",
        2            => "Gedeeltelijk bewolkt",
        3            => "Bewolkt",
        45 or 48     => "Mist",
        51 or 53 or 55 => "Motregen",
        56 or 57     => "IJzel",
        61 or 63 or 65 => "Regen",
        66 or 67     => "IJsregen",
        71 or 73 or 75 => "Sneeuw",
        77           => "Sneeuwkorrels",
        80 or 81 or 82 => "Regenbuien",
        85 or 86     => "Sneeuwbuien",
        95           => "Onweer",
        96 or 99     => "Onweer met hagel",
        _            => "Onbekend"
    };

    private static string GetIcon(int code) => code switch
    {
        0 or 1       => "sun",
        2            => "cloud-sun",
        3            => "cloud",
        45 or 48     => "cloud-fog",
        51 or 53 or 55 or 56 or 57 => "cloud-drizzle",
        61 or 63 or 65 or 66 or 67 or 80 or 81 or 82 => "cloud-rain",
        71 or 73 or 75 or 77 or 85 or 86 => "snowflake",
        95 or 96 or 99 => "cloud-lightning",
        _            => "cloud"
    };
}
