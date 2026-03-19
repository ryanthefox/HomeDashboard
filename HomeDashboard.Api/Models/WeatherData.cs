namespace HomeDashboard.Api.Models;

public record WeatherData(
    double Temperature,
    double FeelsLike,
    double Humidity,
    double WindSpeed,
    double WindDirection,
    double WindGusts,
    double Precipitation,
    bool IsDay,
    int WeatherCode,
    string Condition,
    string Icon,
    string UpdatedAt,
    double UvIndex,
    string SunriseTime,
    string SunsetTime,
    double? GrassPollen,
    double? TreePollen,
    IReadOnlyList<HourlyForecastItem> Hourly,
    IReadOnlyList<DailyForecastItem> Daily
);

public record DailyForecastItem(
    string Date,
    double TempMax,
    double TempMin,
    int WeatherCode,
    string Icon,
    int PrecipitationProbability,
    double PrecipitationSum
);

public record HourlyForecastItem(
    string Time,
    double Temperature,
    int PrecipitationProbability,
    int WeatherCode,
    string Icon
);
