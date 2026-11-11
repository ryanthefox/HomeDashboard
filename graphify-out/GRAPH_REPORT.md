# Graph Report - HomeDashboard  (2026-11-11)

## Corpus Check
- 91 files · ~31,781 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 36 file(s) not represented in the graph (top: .dll 23, (none) 3, .bat 2)
- WARNING: 36 of 128 files seen (28%) have no supported extractor and are missing from this graph entirely. It may look complete while representing only part of the codebase.

## Summary
- 677 nodes · 1788 edges · 29 communities (21 shown, 8 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 48 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2891ff44`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- UI Primitives & Mini Tiles
- DashboardBackgroundService
- package.json
- Dashboard.tsx
- Afval & Plex Data
- System & Weather Monitoring
- LG Washer Integration
- WeatherWidget.tsx
- Music Media Controls
- IPolicyConfig
- Task
- HueService
- HomeDashboard.Api.Services
- PlexWidget.tsx
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
- SystemWidget.tsx
- CLAUDE.md

## God Nodes (most connected - your core abstractions)
1. `cn()` - 59 edges
2. `PlexService` - 29 edges
3. `react` - 25 edges
4. `Skeleton()` - 24 edges
5. `HomeDashboard.Api.Services` - 22 edges
6. `AircoService` - 22 edges
7. `lucide-react` - 22 edges
8. `HomeDashboard.Api.Models` - 21 edges
9. `motion` - 21 edges
10. `@tanstack/react-query` - 21 edges

## Surprising Connections (you probably didn't know these)
- `PlexController` --references--> `PlexService`  [EXTRACTED]
  HomeDashboard.Api/Controllers/PlexController.cs → HomeDashboard.Api/Services/PlexService.cs
- `StatTile()` --calls--> `AnimatedNumber()`  [EXTRACTED]
  frontend/src/components/widgets/PlexWidget.tsx → frontend/src/components/ui/motion.tsx
- `StatTile()` --calls--> `Panel`  [EXTRACTED]
  frontend/src/components/widgets/PlexWidget.tsx → frontend/src/components/ui/motion.tsx
- `StatTile()` --calls--> `cn()`  [EXTRACTED]
  frontend/src/components/widgets/PlexWidget.tsx → frontend/src/lib/utils.ts
- `NowPlayingCard()` --calls--> `Panel`  [EXTRACTED]
  frontend/src/components/widgets/PlexWidget.tsx → frontend/src/components/ui/motion.tsx

## Import Cycles
- None detected.

## Communities (29 total, 8 thin omitted)

### Community 0 - "UI Primitives & Mini Tiles"
Cohesion: 0.07
Nodes (86): BrightnessSlider(), EmptyState(), fadeUp, Label(), Panel, Press, Segmented(), Skeleton() (+78 more)

### Community 2 - "package.json"
Cohesion: 0.06
Nodes (46): dependencies, class-variance-authority@^0.7.0, clsx@^2.1.1, @fontsource-variable/inter@^5.3.0, leaflet@^1.9.4, lucide-react@^0.441.0, motion@^14.12.0, react@^18.3.1 (+38 more)

### Community 3 - "Dashboard.tsx"
Cohesion: 0.06
Nodes (47): @microsoft/signalr@^8.0.7, @tanstack/react-query-devtools@^5.56.2, App(), AfvalWidget, AircoWidget, AmbientBackground, Clock(), ConnectionDot() (+39 more)

### Community 4 - "Afval & Plex Data"
Cohesion: 0.10
Nodes (7): PlexItem, PlexSession, PlexStats, AfvalService, PlexService, ServerUrl, Token

### Community 5 - "System & Weather Monitoring"
Cohesion: 0.10
Nodes (7): DiskDriveInfo, SystemStats, DailyForecastItem, HourlyForecastItem, WeatherData, SystemMonitorService, WeatherService

### Community 6 - "LG Washer Integration"
Cohesion: 0.10
Nodes (5): AircoDevice, WasherDevice, AircoService, LgThinqClient, WasherService

### Community 7 - "WeatherWidget.tsx"
Cohesion: 0.14
Nodes (27): AnimatedNumber(), CloudShape(), effectiveIcon(), RAIN, skyGradient(), SNOW, STARS, WeatherFx (+19 more)

### Community 9 - "IPolicyConfig"
Cohesion: 0.08
Nodes (7): AudioOutputDevice, AudioService, ERole, eCommunications, eConsole, eMultimedia, IPolicyConfig

### Community 10 - "Task"
Cohesion: 0.15
Nodes (4): AircoController, HueController, PlexController, WasherController

### Community 11 - "HueService"
Cohesion: 0.26
Nodes (3): HueLightStateRequest, HueService, BaseUrl

### Community 12 - "HomeDashboard.Api.Services"
Cohesion: 0.06
Nodes (12): HomeDashboard.Api.Services, HomeDashboard.Api.BackgroundServices, HomeDashboard.Api.Hubs, HomeDashboard.Api.Models, HomeDashboard.Api.Controllers, SetDefaultRequest, AfvalItem, LgThinqOptions (+4 more)

### Community 13 - "PlexWidget.tsx"
Cohesion: 0.22
Nodes (25): itemSubtitle(), itemTitle(), LiveCard(), MiniPlex(), PosterRow(), addedAgo(), PlexLink(), PlexPoster() (+17 more)

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
Cohesion: 0.25
Nodes (4): HueGroupActionRequest, HueLight, HueRoom, HueScene

### Community 18 - "Airco Request Models"
Cohesion: 0.22
Nodes (4): SetFanSpeedRequest, SetModeRequest, SetPowerRequest, SetTemperatureRequest

### Community 19 - "ControllerBase"
Cohesion: 0.18
Nodes (4): AfvalController, AudioController, SystemController, WeatherController

### Community 20 - ".NET Project Setup"
Cohesion: 0.25
Nodes (6): net8.0-windows10.0.19041.0, LibreHardwareMonitorLib (0.9.4), Microsoft.AspNetCore.OpenApi (8.0.0), NAudio (2.2.1), Swashbuckle.AspNetCore (6.6.2), Microsoft.NET.Sdk.Web

### Community 21 - "Docker Compose"
Cohesion: 0.25
Nodes (7): build, environment, extra_hosts, ports, restart, services, dashboard

### Community 27 - "SystemWidget.tsx"
Cohesion: 0.25
Nodes (11): ArcGauge(), ArcGaugeProps, SIZES, Bar(), DiskRow(), SystemWidget(), tempColor(), DiskDriveInfo (+3 more)

## Knowledge Gaps
- **16 isolated node(s):** `ServerUrl`, `Token`, `BaseUrl`, `BaseUrl`, `ClientId` (+11 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 194 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `HomeDashboard.Api.Services` connect `HomeDashboard.Api.Services` to `IPolicyConfig`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **What connects `ServerUrl`, `Token`, `BaseUrl` to the rest of the system?**
  _16 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Primitives & Mini Tiles` be split into smaller, more focused modules?**
  _Cohesion score 0.06998069498069498 - nodes in this community are weakly interconnected._
- **Why does `HomeDashboard.Api.Models` connect `HomeDashboard.Api.Services` to `Afval & Plex Data`, `System & Weather Monitoring`, `LG Washer Integration`, `IPolicyConfig`, `HueLight.cs`, `Airco Request Models`, `MusicService.GetCurrentMediaAsync`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Should `DashboardBackgroundService` be split into smaller, more focused modules?**
  _Cohesion score 0.14705882352941177 - nodes in this community are weakly interconnected._
- **Why does `react` connect `UI Primitives & Mini Tiles` to `package.json`, `Dashboard.tsx`, `WeatherWidget.tsx`, `PlexWidget.tsx`, `SystemWidget.tsx`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.055272108843537414 - nodes in this community are weakly interconnected._