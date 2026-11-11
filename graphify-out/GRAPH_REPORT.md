# Graph Report - HomeDashboard  (2026-11-11)

## Corpus Check
- 89 files · ~29,823 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 35 file(s) not represented in the graph (top: .dll 23, (none) 3, .bat 2)
- WARNING: 35 of 125 files seen (28%) have no supported extractor and are missing from this graph entirely. It may look complete while representing only part of the codebase.

## Summary
- 653 nodes · 1687 edges · 28 communities (20 shown, 8 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 47 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `13074ee8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- UI Primitives & Mini Tiles
- DashboardBackgroundService
- Frontend Dependencies
- App Shell & Navigation
- Afval & Plex Data
- System & Weather Monitoring
- LG Washer Integration
- Hue Lighting UI
- Music Media Controls
- IPolicyConfig
- Task
- HueService
- HomeDashboard.Api.Services
- Airco Controller API
- TS App Config
- TS Node Config
- LG OAuth Setup Script
- HueLight.cs
- Airco Request Models
- ControllerBase
- .NET Project Setup
- Docker Compose
- TS Root Config
- MusicService.GetCurrentMediaAsync
- CLAUDE.md

## God Nodes (most connected - your core abstractions)
1. `cn()` - 52 edges
2. `Skeleton()` - 24 edges
3. `react` - 24 edges
4. `PlexService` - 23 edges
5. `HomeDashboard.Api.Services` - 22 edges
6. `AircoService` - 22 edges
7. `lucide-react` - 21 edges
8. `motion` - 21 edges
9. `@tanstack/react-query` - 20 edges
10. `HomeDashboard.Api.Models` - 20 edges

## Surprising Connections (you probably didn't know these)
- `AfvalController` --references--> `AfvalService`  [EXTRACTED]
  HomeDashboard.Api/Controllers/AfvalController.cs → HomeDashboard.Api/Services/AfvalService.cs
- `AudioController` --references--> `AudioService`  [EXTRACTED]
  HomeDashboard.Api/Controllers/AudioController.cs → HomeDashboard.Api/Services/AudioService.cs
- `SystemController` --references--> `SystemMonitorService`  [EXTRACTED]
  HomeDashboard.Api/Controllers/SystemController.cs → HomeDashboard.Api/Services/SystemMonitorService.cs
- `WeatherController` --references--> `WeatherService`  [EXTRACTED]
  HomeDashboard.Api/Controllers/WeatherController.cs → HomeDashboard.Api/Services/WeatherService.cs
- `DashboardBackgroundService` --references--> `AircoService`  [EXTRACTED]
  HomeDashboard.Api/BackgroundServices/DashboardBackgroundService.cs → HomeDashboard.Api/Services/AircoService.cs

## Import Cycles
- None detected.

## Communities (28 total, 8 thin omitted)

### Community 0 - "UI Primitives & Mini Tiles"
Cohesion: 0.06
Nodes (104): ArcGauge(), ArcGaugeProps, SIZES, AnimatedNumber(), easeOutExpo, EmptyState(), fadeUp, Label() (+96 more)

### Community 2 - "Frontend Dependencies"
Cohesion: 0.05
Nodes (48): dependencies, class-variance-authority@^0.7.0, clsx@^2.1.1, @fontsource-variable/inter@^5.3.0, leaflet@^1.9.4, lucide-react@^0.441.0, motion@^14.12.0, react@^18.3.1 (+40 more)

### Community 3 - "App Shell & Navigation"
Cohesion: 0.06
Nodes (58): @microsoft/signalr@^8.0.7, App(), AfvalWidget, AircoWidget, AmbientBackground, Clock(), ConnectionDot(), Dashboard() (+50 more)

### Community 4 - "Afval & Plex Data"
Cohesion: 0.09
Nodes (7): AfvalItem, PlexItem, PlexSession, AfvalService, PlexService, ServerUrl, Token

### Community 5 - "System & Weather Monitoring"
Cohesion: 0.11
Nodes (7): DiskDriveInfo, SystemStats, DailyForecastItem, HourlyForecastItem, WeatherData, SystemMonitorService, WeatherService

### Community 6 - "LG Washer Integration"
Cohesion: 0.18
Nodes (3): WasherDevice, LgThinqClient, WasherService

### Community 7 - "Hue Lighting UI"
Cohesion: 0.21
Nodes (18): BrightnessSlider(), Toggle(), BulbBadge(), HUE_FAVORITE_KEY, MiniHue(), SceneChips(), HueWidget(), LightRow() (+10 more)

### Community 8 - "Music Media Controls"
Cohesion: 0.14
Nodes (3): AudioController, MusicController, MusicService

### Community 9 - "IPolicyConfig"
Cohesion: 0.08
Nodes (7): AudioOutputDevice, AudioService, ERole, eCommunications, eConsole, eMultimedia, IPolicyConfig

### Community 11 - "HueService"
Cohesion: 0.21
Nodes (3): HueController, HueService, BaseUrl

### Community 12 - "HomeDashboard.Api.Services"
Cohesion: 0.08
Nodes (11): HomeDashboard.Api.Services, HomeDashboard.Api.BackgroundServices, HomeDashboard.Api.Hubs, HomeDashboard.Api.Models, HomeDashboard.Api.Controllers, SetDefaultRequest, LgThinqOptions, BaseUrl (+3 more)

### Community 13 - "Airco Controller API"
Cohesion: 0.18
Nodes (3): AircoController, AircoDevice, AircoService

### Community 14 - "TS App Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleDetection (+11 more)

### Community 15 - "TS Node Config"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection, moduleResolution, noEmit (+8 more)

### Community 16 - "LG OAuth Setup Script"
Cohesion: 0.22
Nodes (4): b64url(), exchange_code(), get_gateway(), main()

### Community 17 - "HueLight.cs"
Cohesion: 0.20
Nodes (5): HueGroupActionRequest, HueLight, HueLightStateRequest, HueRoom, HueScene

### Community 18 - "Airco Request Models"
Cohesion: 0.22
Nodes (4): SetFanSpeedRequest, SetModeRequest, SetPowerRequest, SetTemperatureRequest

### Community 19 - "ControllerBase"
Cohesion: 0.29
Nodes (3): AfvalController, SystemController, WeatherController

### Community 20 - ".NET Project Setup"
Cohesion: 0.25
Nodes (7): net8.0-windows10.0.19041.0, HomeDashboard.Api, LibreHardwareMonitorLib (0.9.4), Microsoft.AspNetCore.OpenApi (8.0.0), NAudio (2.2.1), Swashbuckle.AspNetCore (6.6.2), Microsoft.NET.Sdk.Web

### Community 21 - "Docker Compose"
Cohesion: 0.22
Nodes (8): build, environment, extra_hosts, ports, restart, volumes, services, dashboard

## Knowledge Gaps
- **16 isolated node(s):** `LibreHardwareMonitorLib (0.9.4)`, `Microsoft.AspNetCore.OpenApi (8.0.0)`, `NAudio (2.2.1)`, `Swashbuckle.AspNetCore (6.6.2)`, `net8.0-windows10.0.19041.0` (+11 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 193 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `HomeDashboard.Api.Services` connect `HomeDashboard.Api.Services` to `IPolicyConfig`, `Afval & Plex Data`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **What connects `LibreHardwareMonitorLib (0.9.4)`, `Microsoft.AspNetCore.OpenApi (8.0.0)`, `NAudio (2.2.1)` to the rest of the system?**
  _16 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Primitives & Mini Tiles` be split into smaller, more focused modules?**
  _Cohesion score 0.057897286821705425 - nodes in this community are weakly interconnected._
- **Why does `HomeDashboard.Api.Models` connect `HomeDashboard.Api.Services` to `Afval & Plex Data`, `System & Weather Monitoring`, `LG Washer Integration`, `IPolicyConfig`, `HueLight.cs`, `Airco Request Models`, `MusicService.GetCurrentMediaAsync`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Should `DashboardBackgroundService` be split into smaller, more focused modules?**
  _Cohesion score 0.13725490196078433 - nodes in this community are weakly interconnected._
- **Why does `react` connect `UI Primitives & Mini Tiles` to `Frontend Dependencies`, `App Shell & Navigation`, `Hue Lighting UI`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Should `Frontend Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05333333333333334 - nodes in this community are weakly interconnected._