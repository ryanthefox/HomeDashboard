namespace HomeDashboard.Api.Services;

public sealed class LgThinqOptions
{
    public string PersonalAccessToken { get; set; } = "";
    public string CountryCode         { get; set; } = "NL";
    public string ClientId            { get; set; } = "";   // fixed UUID, generated once
    public string BaseUrl             { get; set; } = "https://api-eic.lgthinq.com"; // EIC = EU/India/China region
}
