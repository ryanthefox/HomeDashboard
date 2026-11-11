namespace HomeDashboard.Api.Models;

/// <summary>One price slot (usually an hour). <see cref="Total"/> is the all-in price incl. VAT and energy tax.</summary>
public record EnergyPrice(DateTimeOffset From, DateTimeOffset Till, decimal Total, decimal Market, decimal MarketTax, decimal Markup, decimal EnergyTax);

public record EnergyPrices(List<EnergyPrice> Electricity, List<EnergyPrice> Gas);

/// <summary>Usage and costs of one day (or hour, in <see cref="EnergyUsage.Hours"/>).</summary>
public record EnergyUsagePoint(
    string Date, DateTimeOffset? From,
    decimal ElectricityKwh, decimal ElectricityCost,
    decimal GasM3, decimal GasCost,
    decimal FeedInKwh, decimal FeedInCost);

public record EnergyMonthSummary(
    decimal ActualCosts,          // costs so far (until the last meter reading)
    decimal ExpectedCostsSoFar,   // what Frank expected up to that day
    decimal ExpectedCosts,        // expected for the whole month
    string? LastMeterReadingDate,
    bool GasExcluded);

public record EnergyUsage(
    bool Configured,
    string? Error,
    string? LastMeterReadingDate,
    EnergyMonthSummary? Month,
    List<EnergyUsagePoint> Days,   // oldest first
    List<EnergyUsagePoint> Hours,  // hourly detail of the latest day with data
    string? HoursDate);
