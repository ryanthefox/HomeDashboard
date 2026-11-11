# Graph Report - HomeDashboard  (2026-11-11)

## Corpus Check
- 108 files · ~42,031 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 38 file(s) not represented in the graph (top: .dll 23, (none) 5, .bat 2)
- WARNING: 38 of 148 files seen (26%) have no supported extractor and are missing from this graph entirely. It may look complete while representing only part of the codebase.

## Summary
- 885 nodes · 2321 edges · 38 communities (25 shown, 13 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 69 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2cdf1fa9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- UI Primitives & Mini Tiles
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
- Task
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
- IActionResult
- ILogger
- AircoDevice.cs
- AircoService
- CLAUDE.md
- HueLight.cs
- HomeDashboard.Agent/Program.cs
- LgThinqOptions
- MusicService

## God Nodes (most connected - your core abstractions)
1. `cn()` - 67 edges
2. `PcService` - 34 edges
3. `react` - 30 edges
4. `HomeDashboard.Api.Services` - 29 edges
5. `PlexService` - 29 edges
6. `GoogleHomeService` - 26 edges
7. `useLocalStorage()` - 25 edges
8. `lucide-react` - 25 edges
9. `Skeleton()` - 24 edges
10. `motion` - 24 edges

## Surprising Connections (you probably didn't know these)
- `HomeDashboard.Api` --references--> `net8.0-windows10.0.19041.0`  [EXTRACTED]
  HomeDashboard.Api/HomeDashboard.Api.csproj → HomeDashboard.Agent/HomeDashboard.Agent.csproj
- `HomeDashboard.Api` --references--> `Microsoft.NET.Sdk.Web`  [EXTRACTED]
  HomeDashboard.Api/HomeDashboard.Api.csproj → HomeDashboard.Agent/HomeDashboard.Agent.csproj
- `AfvalController` --references--> `AfvalService`  [EXTRACTED]
  HomeDashboard.Api/Controllers/AfvalController.cs → HomeDashboard.Api/Services/AfvalService.cs
- `AircoController` --references--> `AircoService`  [EXTRACTED]
  HomeDashboard.Api/Controllers/AircoController.cs → HomeDashboard.Api/Services/AircoService.cs
- `NavTabs()` --calls--> `cn()`  [EXTRACTED]
  frontend/src/components/Dashboard.tsx → frontend/src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (38 total, 13 thin omitted)

### Community 0 - "UI Primitives & Mini Tiles"
Cohesion: 0.06
Nodes (113): BrightnessSlider(), EmptyState(), fadeUp, Label(), Panel, Press, Segmented(), Skeleton() (+105 more)

### Community 1 - "PcService"
Cohesion: 0.08
Nodes (12): AudioController, AudioService, AgentPing, MediaCommandResult, PcService, AgentKey, AgentUrl, Broadcast (+4 more)

### Community 2 - "package.json"
Cohesion: 0.05
Nodes (48): dependencies, class-variance-authority@^0.7.0, clsx@^2.1.1, @fontsource-variable/inter@^5.3.0, leaflet@^1.9.4, lucide-react@^0.441.0, motion@^14.12.0, react@^18.3.1 (+40 more)

### Community 3 - "Dashboard.tsx"
Cohesion: 0.07
Nodes (49): @microsoft/signalr@^8.0.7, App(), AuthGate(), AfvalWidget, AircoWidget, AmbientBackground, Clock(), ConnectionDot() (+41 more)

### Community 4 - "PlexService"
Cohesion: 0.09
Nodes (8): AfvalItem, PlexItem, PlexSession, PlexStats, AfvalService, PlexService, ServerUrl, Token

### Community 5 - "WeatherService"
Cohesion: 0.15
Nodes (6): DiskDriveInfo, SystemStats, DailyForecastItem, HourlyForecastItem, WeatherData, WeatherService

### Community 6 - "PlexWidget.tsx"
Cohesion: 0.24
Nodes (22): itemSubtitle(), itemTitle(), LiveCard(), MiniPlex(), PosterRow(), addedAgo(), PlexLink(), PlexPoster() (+14 more)

### Community 7 - "GoogleHomeService"
Cohesion: 0.10
Nodes (7): DashboardAuth, Required, Stamp, GoogleHomeService, ClientId, ClientSecret, Enabled

### Community 8 - "SystemWidget.tsx"
Cohesion: 0.11
Nodes (35): ArcGauge(), ArcGaugeProps, SIZES, AnimatedNumber(), MiniSystem(), PcOfflineNote(), PcPowerButton(), POWER_ITEMS (+27 more)

### Community 9 - "IPolicyConfig"
Cohesion: 0.11
Nodes (5): ERole, eCommunications, eConsole, eMultimedia, IPolicyConfig

### Community 10 - "WeatherWidget.tsx"
Cohesion: 0.15
Nodes (23): CloudShape(), effectiveIcon(), RAIN, skyGradient(), SNOW, STARS, WeatherFx, WeatherIcon() (+15 more)

### Community 11 - "Task"
Cohesion: 0.12
Nodes (3): HueController, HueService, BaseUrl

### Community 12 - "HomeDashboard.Api.Services"
Cohesion: 0.30
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
Cohesion: 0.12
Nodes (3): HomeDashboard.Api.Models, AudioOutputDevice, PcStatus

### Community 27 - "IActionResult"
Cohesion: 0.10
Nodes (7): AfvalController, AircoController, PcController, PlexController, SystemController, WasherController, WeatherController

### Community 28 - "ILogger"
Cohesion: 0.17
Nodes (3): AuthController, LoginRequest, MusicController

### Community 29 - "AircoDevice.cs"
Cohesion: 0.18
Nodes (5): AircoDevice, SetFanSpeedRequest, SetModeRequest, SetPowerRequest, SetTemperatureRequest

### Community 30 - "AircoService"
Cohesion: 0.12
Nodes (4): WasherDevice, AircoService, LgThinqClient, WasherService

### Community 32 - "HueLight.cs"
Cohesion: 0.20
Nodes (5): HueGroupActionRequest, HueLight, HueLightStateRequest, HueRoom, HueScene

### Community 34 - "LgThinqOptions"
Cohesion: 0.33
Nodes (5): LgThinqOptions, BaseUrl, ClientId, CountryCode, PersonalAccessToken

## Knowledge Gaps
- **16 isolated node(s):** `HasAgent`, `BaseUrl`, `Microsoft.AspNetCore.OpenApi (8.0.0)`, `Swashbuckle.AspNetCore (6.6.2)`, `Required` (+11 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 244 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `HomeDashboard.Api.Services` connect `HomeDashboard.Api.Services` to `HomeDashboard.Agent/Program.cs`, `LgThinqOptions`, `PcService.cs`, `IPolicyConfig`, `AuthController.cs`, `HomeDashboard.Api.Models`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **What connects `HasAgent`, `BaseUrl`, `Microsoft.AspNetCore.OpenApi (8.0.0)` to the rest of the system?**
  _16 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Primitives & Mini Tiles` be split into smaller, more focused modules?**
  _Cohesion score 0.05689136968656076 - nodes in this community are weakly interconnected._
- **Why does `PcService` connect `PcService` to `PlexService`, `PcService.cs`, `GoogleHomeService`, `Task`, `DashboardBackgroundService`, `IActionResult`, `ILogger`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Should `PcService` be split into smaller, more focused modules?**
  _Cohesion score 0.07827260458839407 - nodes in this community are weakly interconnected._
- **Why does `HomeDashboard.Api.Models` connect `HomeDashboard.Api.Models` to `HueLight.cs`, `MusicService`, `PlexService`, `WeatherService`, `IPolicyConfig`, `HomeDashboard.Api.Services`, `AircoDevice.cs`, `AircoService`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.05333333333333334 - nodes in this community are weakly interconnected._