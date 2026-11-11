# Graph Report - HomeDashboard  (2026-11-11)

## Corpus Check
- 100 files · ~36,629 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 36 file(s) not represented in the graph (top: .dll 23, (none) 3, .bat 2)
- WARNING: 36 of 137 files seen (26%) have no supported extractor and are missing from this graph entirely. It may look complete while representing only part of the codebase.

## Summary
- 759 nodes · 1989 edges · 43 communities (21 shown, 22 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 54 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d0a51cad`
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
- Music Media Controls
- IPolicyConfig
- Task
- HueService
- HomeDashboard.Api.Services
- AircoController.SetTemperature
- TS App Config
- TS Node Config
- LG OAuth Setup Script
- AircoService
- SystemMonitorService
- AfvalService
- .NET Project Setup
- Docker Compose
- TS Root Config
- HomeDashboard.Api.Models
- SystemWidget.tsx
- MusicController
- AudioController.SetDefault
- CLAUDE.md
- AudioService.cs
- HomeDashboard.Agent/Program.cs
- List
- WasherService
- LgThinqOptions
- AfvalItem
- DashboardBackgroundService
- AudioOutputDevice
- PcStatus.cs

## God Nodes (most connected - your core abstractions)
1. `cn()` - 63 edges
2. `PcService` - 34 edges
3. `PlexService` - 29 edges
4. `react` - 26 edges
5. `HomeDashboard.Api.Services` - 25 edges
6. `Skeleton()` - 24 edges
7. `lucide-react` - 23 edges
8. `motion` - 22 edges
9. `AircoService` - 21 edges
10. `HomeDashboard.Api.Models` - 21 edges

## Surprising Connections (you probably didn't know these)
- `HomeDashboard.Api` --references--> `net8.0-windows10.0.19041.0`  [EXTRACTED]
  HomeDashboard.Api/HomeDashboard.Api.csproj → HomeDashboard.Agent/HomeDashboard.Agent.csproj
- `HomeDashboard.Api` --references--> `Microsoft.NET.Sdk.Web`  [EXTRACTED]
  HomeDashboard.Api/HomeDashboard.Api.csproj → HomeDashboard.Agent/HomeDashboard.Agent.csproj
- `AudioController` --references--> `PcService`  [EXTRACTED]
  HomeDashboard.Api/Controllers/AudioController.cs → HomeDashboard.Api/Services/PcService.cs
- `DashboardBackgroundService` --references--> `PcService`  [EXTRACTED]
  HomeDashboard.Api/BackgroundServices/DashboardBackgroundService.cs → HomeDashboard.Api/Services/PcService.cs
- `MusicController` --references--> `PcService`  [EXTRACTED]
  HomeDashboard.Api/Controllers/MusicController.cs → HomeDashboard.Api/Services/PcService.cs

## Import Cycles
- None detected.

## Communities (43 total, 22 thin omitted)

### Community 0 - "UI Primitives & Mini Tiles"
Cohesion: 0.06
Nodes (94): BrightnessSlider(), EmptyState(), fadeUp, Label(), Panel, Press, Segmented(), Skeleton() (+86 more)

### Community 1 - "PcService"
Cohesion: 0.10
Nodes (11): PcController, AgentPing, MediaCommandResult, PcService, AgentKey, AgentUrl, Broadcast, HasAgent (+3 more)

### Community 2 - "package.json"
Cohesion: 0.05
Nodes (48): dependencies, class-variance-authority@^0.7.0, clsx@^2.1.1, @fontsource-variable/inter@^5.3.0, leaflet@^1.9.4, lucide-react@^0.441.0, motion@^14.12.0, react@^18.3.1 (+40 more)

### Community 3 - "Dashboard.tsx"
Cohesion: 0.08
Nodes (36): @microsoft/signalr@^8.0.7, App(), AfvalWidget, AircoWidget, AmbientBackground, Clock(), ConnectionDot(), Dashboard() (+28 more)

### Community 4 - "PlexService"
Cohesion: 0.16
Nodes (5): PlexSession, PlexStats, PlexService, ServerUrl, Token

### Community 5 - "WeatherService"
Cohesion: 0.14
Nodes (6): DiskDriveInfo, SystemStats, DailyForecastItem, HourlyForecastItem, WeatherData, WeatherService

### Community 6 - "PlexWidget.tsx"
Cohesion: 0.22
Nodes (24): itemSubtitle(), itemTitle(), LiveCard(), MiniPlex(), PosterRow(), addedAgo(), PlexLink(), PlexPoster() (+16 more)

### Community 7 - "WeatherWidget.tsx"
Cohesion: 0.15
Nodes (26): CloudShape(), effectiveIcon(), RAIN, skyGradient(), SNOW, STARS, WeatherFx, WeatherIcon() (+18 more)

### Community 10 - "Task"
Cohesion: 0.11
Nodes (6): AfvalController, AircoController, PlexController, SystemController, WasherController, WeatherController

### Community 11 - "HueService"
Cohesion: 0.12
Nodes (8): HueController, HueGroupActionRequest, HueLight, HueLightStateRequest, HueRoom, HueScene, HueService, BaseUrl

### Community 13 - "AircoController.SetTemperature"
Cohesion: 0.20
Nodes (4): SetFanSpeedRequest, SetModeRequest, SetPowerRequest, SetTemperatureRequest

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
Cohesion: 0.22
Nodes (3): AircoDevice, AircoService, LgThinqClient

### Community 20 - ".NET Project Setup"
Cohesion: 0.33
Nodes (7): net8.0-windows10.0.19041.0, HomeDashboard.Api, LibreHardwareMonitorLib (0.9.4), Microsoft.AspNetCore.OpenApi (8.0.0), NAudio (2.2.1), Swashbuckle.AspNetCore (6.6.2), Microsoft.NET.Sdk.Web

### Community 21 - "Docker Compose"
Cohesion: 0.25
Nodes (7): build, environment, network_mode, restart, volumes, services, dashboard

### Community 27 - "SystemWidget.tsx"
Cohesion: 0.16
Nodes (27): ArcGauge(), ArcGaugeProps, SIZES, AnimatedNumber(), MiniSystem(), PcOfflineNote(), PcPowerButton(), POWER_ITEMS (+19 more)

### Community 32 - "AudioService.cs"
Cohesion: 0.22
Nodes (4): ERole, eCommunications, eConsole, eMultimedia

### Community 37 - "LgThinqOptions"
Cohesion: 0.33
Nodes (5): LgThinqOptions, BaseUrl, ClientId, CountryCode, PersonalAccessToken

### Community 39 - "DashboardBackgroundService"
Cohesion: 0.07
Nodes (4): HomeDashboard.Api.BackgroundServices, HomeDashboard.Api.Hubs, DashboardBackgroundService, DashboardHub

## Knowledge Gaps
- **13 isolated node(s):** `HasAgent`, `BaseUrl`, `Microsoft.AspNetCore.OpenApi (8.0.0)`, `Swashbuckle.AspNetCore (6.6.2)`, `ServerUrl` (+8 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 213 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `HomeDashboard.Api.Services` connect `HomeDashboard.Api.Models` to `AudioService.cs`, `HomeDashboard.Agent/Program.cs`, `PcService.cs`, `LgThinqOptions`, `DashboardBackgroundService`, `HomeDashboard.Api.Services`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **What connects `HasAgent`, `BaseUrl`, `Microsoft.AspNetCore.OpenApi (8.0.0)` to the rest of the system?**
  _13 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Primitives & Mini Tiles` be split into smaller, more focused modules?**
  _Cohesion score 0.06167212647770973 - nodes in this community are weakly interconnected._
- **Why does `PcService` connect `PcService` to `PcService.cs`, `WeatherService`, `DashboardBackgroundService`, `SystemMonitorService`, `AfvalService`, `MusicController`, `Task`, `AudioController.SetDefault`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Should `PcService` be split into smaller, more focused modules?**
  _Cohesion score 0.0967741935483871 - nodes in this community are weakly interconnected._
- **Why does `HomeDashboard.Api.Models` connect `HomeDashboard.Api.Models` to `AudioService.cs`, `WasherService`, `PlexService`, `WeatherService`, `AfvalItem`, `AudioOutputDevice`, `Music Media Controls`, `PcStatus.cs`, `HueService`, `HomeDashboard.Api.Services`, `AircoController.SetTemperature`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.05333333333333334 - nodes in this community are weakly interconnected._