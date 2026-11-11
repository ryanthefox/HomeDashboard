# Graph Report - HomeDashboard  (2026-11-11)

## Corpus Check
- 100 files · ~36,357 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 36 file(s) not represented in the graph (top: .dll 23, (none) 3, .bat 2)
- WARNING: 36 of 137 files seen (26%) have no supported extractor and are missing from this graph entirely. It may look complete while representing only part of the codebase.

## Summary
- 753 nodes · 1971 edges · 33 communities (17 shown, 16 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 51 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cd97cccd`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- UI Primitives & Mini Tiles
- PcService
- package.json
- Dashboard.tsx
- Afval & Plex Data
- JsonElement
- PlexWidget.tsx
- Music Media Controls
- IPolicyConfig
- Task
- HueService
- HomeDashboard.Api.Services
- AircoService
- TS App Config
- TS Node Config
- LG OAuth Setup Script
- .NET Project Setup
- Docker Compose
- TS Root Config
- HomeDashboard.Api.Models
- api.ts
- IActionResult
- Task
- CLAUDE.md
- AudioService.cs
- DashboardBackgroundService.cs
- SetDefaultRequest

## God Nodes (most connected - your core abstractions)
1. `cn()` - 63 edges
2. `PcService` - 31 edges
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
- `MusicController` --references--> `PcService`  [EXTRACTED]
  HomeDashboard.Api/Controllers/MusicController.cs → HomeDashboard.Api/Services/PcService.cs
- `PcController` --references--> `PcService`  [EXTRACTED]
  HomeDashboard.Api/Controllers/PcController.cs → HomeDashboard.Api/Services/PcService.cs
- `SystemController` --references--> `SystemMonitorService`  [EXTRACTED]
  HomeDashboard.Api/Controllers/SystemController.cs → HomeDashboard.Api/Services/SystemMonitorService.cs

## Import Cycles
- None detected.

## Communities (33 total, 16 thin omitted)

### Community 0 - "UI Primitives & Mini Tiles"
Cohesion: 0.07
Nodes (92): ArcGauge(), ArcGaugeProps, SIZES, AnimatedNumber(), easeOutExpo, EmptyState(), fadeUp, Label() (+84 more)

### Community 1 - "PcService"
Cohesion: 0.05
Nodes (12): DashboardBackgroundService, AgentPing, MediaCommandResult, PcService, AgentKey, AgentUrl, Broadcast, HasAgent (+4 more)

### Community 2 - "package.json"
Cohesion: 0.05
Nodes (48): dependencies, class-variance-authority@^0.7.0, clsx@^2.1.1, @fontsource-variable/inter@^5.3.0, leaflet@^1.9.4, lucide-react@^0.441.0, motion@^14.12.0, react@^18.3.1 (+40 more)

### Community 3 - "Dashboard.tsx"
Cohesion: 0.06
Nodes (57): @microsoft/signalr@^8.0.7, App(), AfvalWidget, AircoWidget, AmbientBackground, Clock(), ConnectionDot(), Dashboard() (+49 more)

### Community 4 - "Afval & Plex Data"
Cohesion: 0.09
Nodes (8): AfvalItem, PlexItem, PlexSession, PlexStats, AfvalService, PlexService, ServerUrl, Token

### Community 5 - "JsonElement"
Cohesion: 0.07
Nodes (14): DiskDriveInfo, SystemStats, WasherDevice, DailyForecastItem, HourlyForecastItem, WeatherData, LgThinqClient, LgThinqOptions (+6 more)

### Community 6 - "PlexWidget.tsx"
Cohesion: 0.22
Nodes (24): itemSubtitle(), itemTitle(), LiveCard(), MiniPlex(), PosterRow(), addedAgo(), PlexLink(), PlexPoster() (+16 more)

### Community 9 - "IPolicyConfig"
Cohesion: 0.12
Nodes (5): ERole, eCommunications, eConsole, eMultimedia, IPolicyConfig

### Community 10 - "Task"
Cohesion: 0.13
Nodes (5): AfvalController, AudioController, PlexController, SystemController, WeatherController

### Community 11 - "HueService"
Cohesion: 0.11
Nodes (8): HueController, HueGroupActionRequest, HueLight, HueLightStateRequest, HueRoom, HueScene, HueService, BaseUrl

### Community 13 - "AircoService"
Cohesion: 0.11
Nodes (7): AircoController, AircoDevice, SetFanSpeedRequest, SetModeRequest, SetPowerRequest, SetTemperatureRequest, AircoService

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
Cohesion: 0.31
Nodes (7): net8.0-windows10.0.19041.0, HomeDashboard.Api, LibreHardwareMonitorLib (0.9.4), Microsoft.AspNetCore.OpenApi (8.0.0), NAudio (2.2.1), Swashbuckle.AspNetCore (6.6.2), Microsoft.NET.Sdk.Web

### Community 21 - "Docker Compose"
Cohesion: 0.25
Nodes (7): build, environment, network_mode, restart, volumes, services, dashboard

### Community 27 - "api.ts"
Cohesion: 0.10
Nodes (34): BrightnessSlider(), Toggle(), BulbBadge(), HUE_FAVORITE_KEY, MiniHue(), SceneChips(), HueWidget(), LightRow() (+26 more)

## Knowledge Gaps
- **14 isolated node(s):** `HasAgent`, `BaseUrl`, `Microsoft.AspNetCore.OpenApi (8.0.0)`, `NAudio (2.2.1)`, `Swashbuckle.AspNetCore (6.6.2)` (+9 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 211 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `HomeDashboard.Api.Services` connect `HomeDashboard.Api.Services` to `AudioService.cs`, `PcService.cs`, `JsonElement`, `DashboardBackgroundService.cs`, `MusicService.cs`, `HomeDashboard.Api.Models`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **What connects `HasAgent`, `BaseUrl`, `Microsoft.AspNetCore.OpenApi (8.0.0)` to the rest of the system?**
  _14 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Primitives & Mini Tiles` be split into smaller, more focused modules?**
  _Cohesion score 0.06558154235145386 - nodes in this community are weakly interconnected._
- **Why does `HomeDashboard.Api.Models` connect `HomeDashboard.Api.Models` to `AudioService.cs`, `Afval & Plex Data`, `JsonElement`, `Music Media Controls`, `MusicService.cs`, `HueService`, `HomeDashboard.Api.Services`, `AircoService`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Should `PcService` be split into smaller, more focused modules?**
  _Cohesion score 0.05380852550663871 - nodes in this community are weakly interconnected._
- **Why does `PcService` connect `PcService` to `Afval & Plex Data`, `JsonElement`, `PcService.cs`, `IActionResult`, `Task`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.05333333333333334 - nodes in this community are weakly interconnected._