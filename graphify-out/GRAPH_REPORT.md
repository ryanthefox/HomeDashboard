# Graph Report - HomeDashboard  (2026-11-11)

## Corpus Check
- 105 files · ~38,017 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 36 file(s) not represented in the graph (top: .dll 23, (none) 3, .bat 2)
- WARNING: 36 of 142 files seen (25%) have no supported extractor and are missing from this graph entirely. It may look complete while representing only part of the codebase.

## Summary
- 802 nodes · 2100 edges · 37 communities (24 shown, 13 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 55 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4032f10d`
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
- WeatherWidget.tsx
- PcService.GetMediaAsync
- IPolicyConfig
- Task
- HueService
- HomeDashboard.Api.Services
- DashboardBackgroundService.cs
- TS App Config
- TS Node Config
- LG OAuth Setup Script
- AircoService
- HueLight.cs
- .NET Project Setup
- Docker Compose
- TS Root Config
- HomeDashboard.Api.Models
- HomeWidget
- ILogger
- Task
- AudioController.SetDefault
- CLAUDE.md
- HomeDashboard.Agent/Program.cs
- DashboardBackgroundService

## God Nodes (most connected - your core abstractions)
1. `cn()` - 63 edges
2. `PcService` - 34 edges
3. `PlexService` - 29 edges
4. `react` - 29 edges
5. `HomeDashboard.Api.Services` - 27 edges
6. `Skeleton()` - 24 edges
7. `lucide-react` - 24 edges
8. `motion` - 23 edges
9. `Dashboard()` - 21 edges
10. `AircoService` - 21 edges

## Surprising Connections (you probably didn't know these)
- `HomeDashboard.Api` --references--> `net8.0-windows10.0.19041.0`  [EXTRACTED]
  HomeDashboard.Api/HomeDashboard.Api.csproj → HomeDashboard.Agent/HomeDashboard.Agent.csproj
- `HomeDashboard.Api` --references--> `Microsoft.NET.Sdk.Web`  [EXTRACTED]
  HomeDashboard.Api/HomeDashboard.Api.csproj → HomeDashboard.Agent/HomeDashboard.Agent.csproj
- `AuthController` --references--> `DashboardAuth`  [EXTRACTED]
  HomeDashboard.Api/Controllers/AuthController.cs → HomeDashboard.Api/Services/DashboardAuth.cs
- `NavTabs()` --calls--> `cn()`  [EXTRACTED]
  frontend/src/components/Dashboard.tsx → frontend/src/lib/utils.ts
- `Dashboard()` --calls--> `HomeWidget()`  [EXTRACTED]
  frontend/src/components/Dashboard.tsx → frontend/src/components/widgets/HomeWidget.tsx

## Import Cycles
- None detected.

## Communities (37 total, 13 thin omitted)

### Community 0 - "UI Primitives & Mini Tiles"
Cohesion: 0.06
Nodes (116): ArcGauge(), ArcGaugeProps, SIZES, BrightnessSlider(), AnimatedNumber(), EmptyState(), fadeUp, Label() (+108 more)

### Community 1 - "PcService"
Cohesion: 0.10
Nodes (11): PcController, AgentPing, MediaCommandResult, PcService, AgentKey, AgentUrl, Broadcast, HasAgent (+3 more)

### Community 2 - "package.json"
Cohesion: 0.05
Nodes (49): dependencies, class-variance-authority@^0.7.0, clsx@^2.1.1, @fontsource-variable/inter@^5.3.0, leaflet@^1.9.4, lucide-react@^0.441.0, @microsoft/signalr@^8.0.7, motion@^14.12.0 (+41 more)

### Community 3 - "Dashboard.tsx"
Cohesion: 0.07
Nodes (51): App(), AuthGate(), AfvalWidget, AircoWidget, AmbientBackground, Clock(), ConnectionDot(), Dashboard() (+43 more)

### Community 4 - "PlexService"
Cohesion: 0.10
Nodes (7): PlexItem, PlexSession, PlexStats, AfvalService, PlexService, ServerUrl, Token

### Community 5 - "WeatherService"
Cohesion: 0.15
Nodes (6): DiskDriveInfo, SystemStats, DailyForecastItem, HourlyForecastItem, WeatherData, WeatherService

### Community 6 - "PlexWidget.tsx"
Cohesion: 0.21
Nodes (25): itemSubtitle(), itemTitle(), LiveCard(), MiniPlex(), PosterRow(), addedAgo(), PlexLink(), PlexPoster() (+17 more)

### Community 7 - "WeatherWidget.tsx"
Cohesion: 0.15
Nodes (23): CloudShape(), effectiveIcon(), RAIN, skyGradient(), SNOW, STARS, WeatherFx, WeatherIcon() (+15 more)

### Community 9 - "IPolicyConfig"
Cohesion: 0.11
Nodes (5): ERole, eCommunications, eConsole, eMultimedia, IPolicyConfig

### Community 10 - "Task"
Cohesion: 0.11
Nodes (6): AfvalController, HueController, PlexController, SystemController, WasherController, WeatherController

### Community 11 - "HueService"
Cohesion: 0.19
Nodes (3): HueLightStateRequest, HueService, BaseUrl

### Community 12 - "HomeDashboard.Api.Services"
Cohesion: 0.30
Nodes (3): HomeDashboard.Api.Services, HomeDashboard.Api.Controllers, SetDefaultRequest

### Community 13 - "DashboardBackgroundService.cs"
Cohesion: 0.18
Nodes (3): HomeDashboard.Api.BackgroundServices, HomeDashboard.Api.Hubs, DashboardHub

### Community 14 - "TS App Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleDetection (+11 more)

### Community 15 - "TS Node Config"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection, moduleResolution, noEmit (+8 more)

### Community 16 - "LG OAuth Setup Script"
Cohesion: 0.22
Nodes (4): b64url(), exchange_code(), get_gateway(), main()

### Community 17 - "AircoService"
Cohesion: 0.06
Nodes (15): AircoDevice, SetFanSpeedRequest, SetModeRequest, SetPowerRequest, SetTemperatureRequest, WasherDevice, AircoService, LgThinqClient (+7 more)

### Community 19 - "HueLight.cs"
Cohesion: 0.25
Nodes (4): HueGroupActionRequest, HueLight, HueRoom, HueScene

### Community 20 - ".NET Project Setup"
Cohesion: 0.33
Nodes (7): net8.0-windows10.0.19041.0, HomeDashboard.Api, LibreHardwareMonitorLib (0.9.4), Microsoft.AspNetCore.OpenApi (8.0.0), NAudio (2.2.1), Swashbuckle.AspNetCore (6.6.2), Microsoft.NET.Sdk.Web

### Community 21 - "Docker Compose"
Cohesion: 0.20
Nodes (9): build, environment, network_mode, restart, volumes, services, dashboard, volumes (+1 more)

### Community 26 - "HomeDashboard.Api.Models"
Cohesion: 0.12
Nodes (4): HomeDashboard.Api.Models, AfvalItem, AudioOutputDevice, PcStatus

### Community 27 - "HomeWidget"
Cohesion: 0.52
Nodes (7): HomeWidget(), buildRows(), handleDrop(), renderCell(), renderColumn(), IconBtn(), sanitize()

### Community 28 - "ILogger"
Cohesion: 0.16
Nodes (3): AuthController, LoginRequest, MusicController

### Community 33 - "HomeDashboard.Agent/Program.cs"
Cohesion: 0.18
Nodes (4): AudioDeviceRequest, DashboardAuth, Required, Stamp

## Knowledge Gaps
- **15 isolated node(s):** `Required`, `Stamp`, `HasAgent`, `BaseUrl`, `Microsoft.AspNetCore.OpenApi (8.0.0)` (+10 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 223 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `HomeDashboard.Api.Services` connect `HomeDashboard.Api.Services` to `MusicService.cs`, `HomeDashboard.Agent/Program.cs`, `PcService.cs`, `IPolicyConfig`, `DashboardBackgroundService.cs`, `AircoService`, `AuthController.cs`, `HomeDashboard.Api.Models`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **What connects `Required`, `Stamp`, `HasAgent` to the rest of the system?**
  _15 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Primitives & Mini Tiles` be split into smaller, more focused modules?**
  _Cohesion score 0.055077940481813886 - nodes in this community are weakly interconnected._
- **Why does `PcService` connect `PcService` to `PlexService`, `PcService.cs`, `WeatherService`, `DashboardBackgroundService`, `PcService.GetMediaAsync`, `ILogger`, `AudioController.SetDefault`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Should `PcService` be split into smaller, more focused modules?**
  _Cohesion score 0.0967741935483871 - nodes in this community are weakly interconnected._
- **Why does `HomeDashboard.Api.Models` connect `HomeDashboard.Api.Models` to `MusicService.cs`, `PlexService`, `WeatherService`, `PcService.GetMediaAsync`, `IPolicyConfig`, `HomeDashboard.Api.Services`, `AircoService`, `HueLight.cs`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.05203619909502263 - nodes in this community are weakly interconnected._