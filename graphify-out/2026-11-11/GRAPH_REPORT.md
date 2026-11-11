# Graph Report - HomeDashboard  (2026-11-11)

## Corpus Check
- 115 files · ~47,818 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 39 file(s) not represented in the graph (top: .dll 23, (none) 5, .bat 2)
- WARNING: 39 of 156 files seen (25%) have no supported extractor and are missing from this graph entirely. It may look complete while representing only part of the codebase.

## Summary
- 986 nodes · 2675 edges · 40 communities (26 shown, 14 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 77 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `917866cc`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- EnergyWidget.tsx
- PcService
- package.json
- Dashboard.tsx
- PlexService
- WeatherService
- AudioService.cs
- GoogleHomeService
- SystemWidget.tsx
- IPolicyConfig
- WeatherWidget.tsx
- HueService
- HomeDashboard.Api.Services
- DashboardBackgroundService.cs
- TS App Config
- TS Node Config
- LG OAuth Setup Script
- DashboardBackgroundService
- GoogleHomeController
- .NET Project Setup
- caddy
- TS Root Config
- HomeDashboard.Api.Models
- HttpGet
- FrankEnergieService
- AircoDevice.cs
- AircoService
- CLAUDE.md
- HomeDashboard.Agent/Program.cs
- LgThinqOptions
- IActionResult
- AircoService
- MusicService
- cn

## God Nodes (most connected - your core abstractions)
1. `cn()` - 73 edges
2. `PcService` - 34 edges
3. `react` - 33 edges
4. `FrankEnergieService` - 32 edges
5. `useLocalStorage()` - 31 edges
6. `HomeDashboard.Api.Services` - 31 edges
7. `PlexService` - 29 edges
8. `Skeleton()` - 29 edges
9. `lucide-react` - 27 edges
10. `GoogleHomeService` - 26 edges

## Surprising Connections (you probably didn't know these)
- `HomeDashboard.Api` --references--> `net8.0-windows10.0.19041.0`  [EXTRACTED]
  HomeDashboard.Api/HomeDashboard.Api.csproj → HomeDashboard.Agent/HomeDashboard.Agent.csproj
- `HomeDashboard.Api` --references--> `Microsoft.NET.Sdk.Web`  [EXTRACTED]
  HomeDashboard.Api/HomeDashboard.Api.csproj → HomeDashboard.Agent/HomeDashboard.Agent.csproj
- `BarChart()` --calls--> `cn()`  [EXTRACTED]
  frontend/src/components/ui/BarChart.tsx → frontend/src/lib/utils.ts
- `Stat()` --calls--> `Panel`  [EXTRACTED]
  frontend/src/components/widgets/EnergyWidget.tsx → frontend/src/components/ui/motion.tsx
- `PriceChart()` --calls--> `Label()`  [EXTRACTED]
  frontend/src/components/widgets/EnergyWidget.tsx → frontend/src/components/ui/motion.tsx

## Import Cycles
- None detected.

## Communities (40 total, 14 thin omitted)

### Community 0 - "EnergyWidget.tsx"
Cohesion: 0.19
Nodes (31): Bar, BarChart(), EnergyWidget(), priceBars(), PriceChart(), Stat(), usageBars(), UsageSection() (+23 more)

### Community 1 - "PcService"
Cohesion: 0.08
Nodes (11): PcController, AgentPing, MediaCommandResult, PcService, AgentKey, AgentUrl, Broadcast, HasAgent (+3 more)

### Community 2 - "package.json"
Cohesion: 0.05
Nodes (48): dependencies, class-variance-authority@^0.7.0, clsx@^2.1.1, @fontsource-variable/inter@^5.3.0, leaflet@^1.9.4, lucide-react@^0.441.0, motion@^14.12.0, react@^18.3.1 (+40 more)

### Community 3 - "Dashboard.tsx"
Cohesion: 0.05
Nodes (67): @microsoft/signalr@^8.0.7, App(), AuthGate(), AfvalWidget, AircoWidget, AmbientBackground, Clock(), ConnectionDot() (+59 more)

### Community 4 - "PlexService"
Cohesion: 0.08
Nodes (9): AfvalController, AfvalItem, PlexItem, PlexSession, PlexStats, AfvalService, PlexService, ServerUrl (+1 more)

### Community 5 - "WeatherService"
Cohesion: 0.16
Nodes (6): DiskDriveInfo, SystemStats, DailyForecastItem, HourlyForecastItem, WeatherData, WeatherService

### Community 7 - "GoogleHomeService"
Cohesion: 0.14
Nodes (4): GoogleHomeService, ClientId, ClientSecret, Enabled

### Community 8 - "SystemWidget.tsx"
Cohesion: 0.13
Nodes (31): ArcGauge(), ArcGaugeProps, SIZES, AnimatedNumber(), GAUGE_PX, GaugeSize, MiniSystem(), pickLayout() (+23 more)

### Community 9 - "IPolicyConfig"
Cohesion: 0.12
Nodes (5): ERole, eCommunications, eConsole, eMultimedia, IPolicyConfig

### Community 10 - "WeatherWidget.tsx"
Cohesion: 0.14
Nodes (27): CloudShape(), effectiveIcon(), RAIN, skyGradient(), SNOW, STARS, WeatherFx, WeatherIcon() (+19 more)

### Community 11 - "HueService"
Cohesion: 0.10
Nodes (8): HueController, HueGroupActionRequest, HueLight, HueLightStateRequest, HueRoom, HueScene, HueService, BaseUrl

### Community 12 - "HomeDashboard.Api.Services"
Cohesion: 0.29
Nodes (3): HomeDashboard.Api.Services, HomeDashboard.Api.Controllers, SetDefaultRequest

### Community 14 - "TS App Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleDetection (+11 more)

### Community 15 - "TS Node Config"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection, moduleResolution, noEmit (+8 more)

### Community 16 - "LG OAuth Setup Script"
Cohesion: 0.22
Nodes (4): b64url(), exchange_code(), get_gateway(), main()

### Community 17 - "DashboardBackgroundService"
Cohesion: 0.09
Nodes (3): DashboardBackgroundService, SystemController, SystemMonitorService

### Community 20 - ".NET Project Setup"
Cohesion: 0.33
Nodes (7): net8.0-windows10.0.19041.0, HomeDashboard.Api, LibreHardwareMonitorLib (0.9.4), Microsoft.AspNetCore.OpenApi (8.0.0), NAudio (2.2.1), Swashbuckle.AspNetCore (6.6.2), Microsoft.NET.Sdk.Web

### Community 21 - "caddy"
Cohesion: 0.08
Nodes (23): build, environment, network_mode, profiles, restart, volumes, build, environment (+15 more)

### Community 27 - "HttpGet"
Cohesion: 0.11
Nodes (6): AudioController, AuthController, LoginRequest, EnergyController, PlexController, WeatherController

### Community 28 - "FrankEnergieService"
Cohesion: 0.11
Nodes (11): EnergyMonthSummary, EnergyPrice, EnergyPrices, EnergyUsage, EnergyUsagePoint, DayData, FrankApiException, IsAuthError (+3 more)

### Community 29 - "AircoDevice.cs"
Cohesion: 0.18
Nodes (5): AircoDevice, SetFanSpeedRequest, SetModeRequest, SetPowerRequest, SetTemperatureRequest

### Community 30 - "AircoService"
Cohesion: 0.14
Nodes (4): WasherController, WasherDevice, LgThinqClient, WasherService

### Community 33 - "HomeDashboard.Agent/Program.cs"
Cohesion: 0.14
Nodes (4): AudioDeviceRequest, DashboardAuth, Required, Stamp

### Community 34 - "LgThinqOptions"
Cohesion: 0.33
Nodes (5): LgThinqOptions, BaseUrl, ClientId, CountryCode, PersonalAccessToken

### Community 38 - "AircoService"
Cohesion: 0.14
Nodes (3): AircoController, DashboardHub, AircoService

### Community 41 - "cn"
Cohesion: 0.05
Nodes (133): BrightnessSlider(), easeOutExpo, EmptyState(), fadeUp, Label(), Panel, Press, Segmented() (+125 more)

## Knowledge Gaps
- **19 isolated node(s):** `HasAgent`, `BaseUrl`, `Microsoft.AspNetCore.OpenApi (8.0.0)`, `Swashbuckle.AspNetCore (6.6.2)`, `IsAuthError` (+14 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 262 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `HomeDashboard.Api.Services` connect `HomeDashboard.Api.Services` to `HomeDashboard.Agent/Program.cs`, `LgThinqOptions`, `PcService.cs`, `AudioService.cs`, `DashboardBackgroundService.cs`, `AuthController.cs`, `HomeDashboard.Api.Models`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **What connects `HasAgent`, `BaseUrl`, `Microsoft.AspNetCore.OpenApi (8.0.0)` to the rest of the system?**
  _19 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `PcService` be split into smaller, more focused modules?**
  _Cohesion score 0.08258258258258258 - nodes in this community are weakly interconnected._
- **Why does `PcService` connect `PcService` to `IActionResult`, `PcService.cs`, `PlexService`, `GoogleHomeService`, `HueService`, `DashboardBackgroundService`, `GoogleHomeController`, `HttpGet`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.05333333333333334 - nodes in this community are weakly interconnected._
- **Why does `HomeDashboard.Api.Models` connect `HomeDashboard.Api.Models` to `HomeDashboard.Agent/Program.cs`, `PlexService`, `WeatherService`, `AudioService.cs`, `MusicService`, `HueService`, `HomeDashboard.Api.Services`, `FrankEnergieService`, `AircoDevice.cs`, `AircoService`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Should `Dashboard.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05225576111652061 - nodes in this community are weakly interconnected._