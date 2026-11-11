# Graph Report - HomeDashboard  (2026-11-11)

## Corpus Check
- 115 files · ~47,585 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 39 file(s) not represented in the graph (top: .dll 23, (none) 5, .bat 2)
- WARNING: 39 of 156 files seen (25%) have no supported extractor and are missing from this graph entirely. It may look complete while representing only part of the codebase.

## Summary
- 985 nodes · 2669 edges · 41 communities (27 shown, 14 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 77 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c5e2808d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- EnergyWidget.tsx
- PcService
- package.json
- Dashboard.tsx
- PlexService
- WeatherService
- PlexWidget.tsx
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
- AuthController.cs
- GoogleHomeController
- .NET Project Setup
- caddy
- TS Root Config
- HomeDashboard.Api.Models
- Task
- FrankEnergieService
- AircoDevice.cs
- AircoService
- CLAUDE.md
- HomeDashboard.Agent/Program.cs
- LgThinqOptions
- ILogger
- AircoService
- MusicService
- cn
- HueLight.cs

## God Nodes (most connected - your core abstractions)
1. `cn()` - 73 edges
2. `PcService` - 34 edges
3. `react` - 33 edges
4. `FrankEnergieService` - 32 edges
5. `HomeDashboard.Api.Services` - 31 edges
6. `useLocalStorage()` - 31 edges
7. `PlexService` - 29 edges
8. `Skeleton()` - 29 edges
9. `lucide-react` - 27 edges
10. `GoogleHomeService` - 26 edges

## Surprising Connections (you probably didn't know these)
- `HomeDashboard.Api` --references--> `net8.0-windows10.0.19041.0`  [EXTRACTED]
  HomeDashboard.Api/HomeDashboard.Api.csproj → HomeDashboard.Agent/HomeDashboard.Agent.csproj
- `HomeDashboard.Api` --references--> `Microsoft.NET.Sdk.Web`  [EXTRACTED]
  HomeDashboard.Api/HomeDashboard.Api.csproj → HomeDashboard.Agent/HomeDashboard.Agent.csproj
- `EnergyController` --references--> `FrankEnergieService`  [EXTRACTED]
  HomeDashboard.Api/Controllers/EnergyController.cs → HomeDashboard.Api/Services/FrankEnergieService.cs
- `NavTabs()` --calls--> `cn()`  [EXTRACTED]
  frontend/src/components/Dashboard.tsx → frontend/src/lib/utils.ts
- `Dashboard()` --calls--> `HomeWidget()`  [EXTRACTED]
  frontend/src/components/Dashboard.tsx → frontend/src/components/widgets/HomeWidget.tsx

## Import Cycles
- None detected.

## Communities (41 total, 14 thin omitted)

### Community 0 - "EnergyWidget.tsx"
Cohesion: 0.26
Nodes (25): Bar, BarChart(), EmptyState(), EnergyWidget(), priceBars(), PriceChart(), Stat(), usageBars() (+17 more)

### Community 1 - "PcService"
Cohesion: 0.08
Nodes (11): PcController, AgentPing, MediaCommandResult, PcService, AgentKey, AgentUrl, Broadcast, HasAgent (+3 more)

### Community 2 - "package.json"
Cohesion: 0.05
Nodes (49): dependencies, class-variance-authority@^0.7.0, clsx@^2.1.1, @fontsource-variable/inter@^5.3.0, leaflet@^1.9.4, lucide-react@^0.441.0, @microsoft/signalr@^8.0.7, motion@^14.12.0 (+41 more)

### Community 3 - "Dashboard.tsx"
Cohesion: 0.07
Nodes (53): App(), AuthGate(), AfvalWidget, AircoWidget, AmbientBackground, Clock(), ConnectionDot(), Dashboard() (+45 more)

### Community 4 - "PlexService"
Cohesion: 0.09
Nodes (8): AfvalItem, PlexItem, PlexSession, PlexStats, AfvalService, PlexService, ServerUrl, Token

### Community 5 - "WeatherService"
Cohesion: 0.16
Nodes (6): DiskDriveInfo, SystemStats, DailyForecastItem, HourlyForecastItem, WeatherData, WeatherService

### Community 6 - "PlexWidget.tsx"
Cohesion: 0.22
Nodes (24): itemSubtitle(), itemTitle(), LiveCard(), MiniPlex(), PosterRow(), addedAgo(), PlexLink(), PlexPoster() (+16 more)

### Community 7 - "GoogleHomeService"
Cohesion: 0.10
Nodes (7): DashboardAuth, Required, Stamp, GoogleHomeService, ClientId, ClientSecret, Enabled

### Community 8 - "SystemWidget.tsx"
Cohesion: 0.08
Nodes (46): ArcGauge(), ArcGaugeProps, SIZES, AnimatedNumber(), GAUGE_PX, GaugeSize, MiniSystem(), pickLayout() (+38 more)

### Community 9 - "IPolicyConfig"
Cohesion: 0.12
Nodes (5): ERole, eCommunications, eConsole, eMultimedia, IPolicyConfig

### Community 10 - "WeatherWidget.tsx"
Cohesion: 0.15
Nodes (24): CloudShape(), effectiveIcon(), RAIN, skyGradient(), SNOW, STARS, WeatherFx, WeatherIcon() (+16 more)

### Community 11 - "HueService"
Cohesion: 0.16
Nodes (4): HueController, HueLightStateRequest, HueService, BaseUrl

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

### Community 20 - ".NET Project Setup"
Cohesion: 0.33
Nodes (7): net8.0-windows10.0.19041.0, HomeDashboard.Api, LibreHardwareMonitorLib (0.9.4), Microsoft.AspNetCore.OpenApi (8.0.0), NAudio (2.2.1), Swashbuckle.AspNetCore (6.6.2), Microsoft.NET.Sdk.Web

### Community 21 - "caddy"
Cohesion: 0.08
Nodes (23): build, environment, network_mode, profiles, restart, volumes, build, environment (+15 more)

### Community 26 - "HomeDashboard.Api.Models"
Cohesion: 0.15
Nodes (3): HomeDashboard.Api.Models, AudioOutputDevice, PcStatus

### Community 27 - "Task"
Cohesion: 0.15
Nodes (3): EnergyController, PlexController, WasherController

### Community 28 - "FrankEnergieService"
Cohesion: 0.10
Nodes (11): EnergyMonthSummary, EnergyPrice, EnergyPrices, EnergyUsage, EnergyUsagePoint, DayData, FrankApiException, IsAuthError (+3 more)

### Community 29 - "AircoDevice.cs"
Cohesion: 0.18
Nodes (5): AircoDevice, SetFanSpeedRequest, SetModeRequest, SetPowerRequest, SetTemperatureRequest

### Community 30 - "AircoService"
Cohesion: 0.19
Nodes (3): WasherDevice, LgThinqClient, WasherService

### Community 34 - "LgThinqOptions"
Cohesion: 0.33
Nodes (5): LgThinqOptions, BaseUrl, ClientId, CountryCode, PersonalAccessToken

### Community 35 - "ILogger"
Cohesion: 0.08
Nodes (8): AfvalController, AudioController, AuthController, LoginRequest, MusicController, SystemController, WeatherController, AudioService

### Community 41 - "cn"
Cohesion: 0.05
Nodes (115): BrightnessSlider(), easeOutExpo, fadeUp, Label(), Panel, Press, Segmented(), Skeleton() (+107 more)

### Community 44 - "HueLight.cs"
Cohesion: 0.25
Nodes (4): HueGroupActionRequest, HueLight, HueRoom, HueScene

## Knowledge Gaps
- **19 isolated node(s):** `HasLogin`, `Today`, `IsAuthError`, `HasAgent`, `BaseUrl` (+14 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 262 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `HomeDashboard.Api.Services` connect `HomeDashboard.Api.Services` to `HomeDashboard.Agent/Program.cs`, `LgThinqOptions`, `PcService.cs`, `AuthController.cs`, `HomeDashboard.Api.Models`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **What connects `HasLogin`, `Today`, `IsAuthError` to the rest of the system?**
  _19 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `PcService` be split into smaller, more focused modules?**
  _Cohesion score 0.08408408408408409 - nodes in this community are weakly interconnected._
- **Why does `PcService` connect `PcService` to `ILogger`, `PcService.cs`, `PlexService`, `GoogleHomeService`, `HueService`, `DashboardBackgroundService`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.05203619909502263 - nodes in this community are weakly interconnected._
- **Why does `HomeDashboard.Api.Models` connect `HomeDashboard.Api.Models` to `HomeDashboard.Agent/Program.cs`, `PlexService`, `WeatherService`, `MusicService`, `HomeDashboard.Api.Services`, `HueLight.cs`, `FrankEnergieService`, `AircoDevice.cs`, `AircoService`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Should `Dashboard.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06682692307692308 - nodes in this community are weakly interconnected._