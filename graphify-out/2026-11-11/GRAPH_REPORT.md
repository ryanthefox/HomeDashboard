# Graph Report - HomeDashboard  (2026-11-11)

## Corpus Check
- 99 files · ~35,167 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 36 file(s) not represented in the graph (top: .dll 23, (none) 3, .bat 2)
- WARNING: 36 of 136 files seen (26%) have no supported extractor and are missing from this graph entirely. It may look complete while representing only part of the codebase.

## Summary
- 732 nodes · 1930 edges · 44 communities (20 shown, 24 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 52 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `72437d29`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- UI Primitives & Mini Tiles
- DashboardBackgroundService
- package.json
- Dashboard.tsx
- Afval & Plex Data
- System & Weather Monitoring
- JsonElement
- WeatherWidget.tsx
- Music Media Controls
- IPolicyConfig
- Task
- HueService
- HomeDashboard.Api.Services
- Task
- TS App Config
- TS Node Config
- LG OAuth Setup Script
- PcService
- Airco Request Models
- ControllerBase
- .NET Project Setup
- Docker Compose
- TS Root Config
- HomeDashboard.Api.Models
- SystemWidget.tsx
- PcController
- DashboardHub
- WasherService
- CLAUDE.md
- AircoService
- AudioService
- ERole
- LgThinqOptions
- SystemStats
- SetDefaultRequest

## God Nodes (most connected - your core abstractions)
1. `cn()` - 63 edges
2. `PlexService` - 29 edges
3. `react` - 26 edges
4. `HomeDashboard.Api.Services` - 25 edges
5. `PcService` - 24 edges
6. `Skeleton()` - 24 edges
7. `HomeDashboard.Api.Models` - 23 edges
8. `lucide-react` - 23 edges
9. `AircoService` - 22 edges
10. `motion` - 22 edges

## Surprising Connections (you probably didn't know these)
- `HomeDashboard.Api` --references--> `Microsoft.NET.Sdk.Web`  [EXTRACTED]
  HomeDashboard.Api/HomeDashboard.Api.csproj → HomeDashboard.Agent/HomeDashboard.Agent.csproj
- `PcController` --references--> `PcService`  [EXTRACTED]
  HomeDashboard.Api/Controllers/PcController.cs → HomeDashboard.Api/Services/PcService.cs
- `SystemWidget()` --calls--> `Label()`  [EXTRACTED]
  frontend/src/components/widgets/SystemWidget.tsx → frontend/src/components/ui/motion.tsx
- `SystemWidget()` --calls--> `Panel`  [EXTRACTED]
  frontend/src/components/widgets/SystemWidget.tsx → frontend/src/components/ui/motion.tsx
- `SystemWidget()` --calls--> `Skeleton()`  [EXTRACTED]
  frontend/src/components/widgets/SystemWidget.tsx → frontend/src/components/ui/motion.tsx

## Import Cycles
- None detected.

## Communities (44 total, 24 thin omitted)

### Community 0 - "UI Primitives & Mini Tiles"
Cohesion: 0.06
Nodes (117): BrightnessSlider(), easeOutExpo, EmptyState(), fadeUp, Label(), Panel, Press, Segmented() (+109 more)

### Community 2 - "package.json"
Cohesion: 0.06
Nodes (45): dependencies, class-variance-authority@^0.7.0, clsx@^2.1.1, @fontsource-variable/inter@^5.3.0, leaflet@^1.9.4, lucide-react@^0.441.0, @microsoft/signalr@^8.0.7, motion@^14.12.0 (+37 more)

### Community 3 - "Dashboard.tsx"
Cohesion: 0.07
Nodes (46): react-dom@^18.3.1, @tanstack/react-query-devtools@^5.56.2, App(), AfvalWidget, AircoWidget, AmbientBackground, Clock(), ConnectionDot() (+38 more)

### Community 4 - "Afval & Plex Data"
Cohesion: 0.09
Nodes (8): AfvalItem, PlexItem, PlexSession, PlexStats, AfvalService, PlexService, ServerUrl, Token

### Community 5 - "System & Weather Monitoring"
Cohesion: 0.21
Nodes (4): DailyForecastItem, HourlyForecastItem, WeatherData, WeatherService

### Community 7 - "WeatherWidget.tsx"
Cohesion: 0.16
Nodes (22): CloudShape(), effectiveIcon(), RAIN, skyGradient(), SNOW, STARS, WeatherFx, WeatherIcon() (+14 more)

### Community 8 - "Music Media Controls"
Cohesion: 0.12
Nodes (3): MusicController, MediaInfo, MusicService

### Community 11 - "HueService"
Cohesion: 0.11
Nodes (8): HueController, HueGroupActionRequest, HueLight, HueLightStateRequest, HueRoom, HueScene, HueService, BaseUrl

### Community 14 - "TS App Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleDetection (+11 more)

### Community 15 - "TS Node Config"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection, moduleResolution, noEmit (+8 more)

### Community 16 - "LG OAuth Setup Script"
Cohesion: 0.22
Nodes (4): b64url(), exchange_code(), get_gateway(), main()

### Community 17 - "PcService"
Cohesion: 0.15
Nodes (9): PcStatus, AgentPing, PcService, AgentKey, AgentUrl, Broadcast, HasAgent, Mac (+1 more)

### Community 18 - "Airco Request Models"
Cohesion: 0.22
Nodes (4): SetFanSpeedRequest, SetModeRequest, SetPowerRequest, SetTemperatureRequest

### Community 19 - "ControllerBase"
Cohesion: 0.20
Nodes (4): AfvalController, AudioController, SystemController, WeatherController

### Community 20 - ".NET Project Setup"
Cohesion: 0.24
Nodes (9): net8.0-windows, net8.0-windows10.0.19041.0, HomeDashboard.Agent, HomeDashboard.Api, LibreHardwareMonitorLib (0.9.4), Microsoft.AspNetCore.OpenApi (8.0.0), NAudio (2.2.1), Swashbuckle.AspNetCore (6.6.2) (+1 more)

### Community 21 - "Docker Compose"
Cohesion: 0.29
Nodes (6): build, environment, network_mode, restart, services, dashboard

### Community 27 - "SystemWidget.tsx"
Cohesion: 0.16
Nodes (25): ArcGauge(), ArcGaugeProps, SIZES, AnimatedNumber(), MiniSystem(), PcOfflineNote(), PcPowerButton(), POWER_ITEMS (+17 more)

### Community 29 - "DashboardHub"
Cohesion: 0.22
Nodes (3): HomeDashboard.Api.BackgroundServices, HomeDashboard.Api.Hubs, DashboardHub

### Community 35 - "ERole"
Cohesion: 0.33
Nodes (4): ERole, eCommunications, eConsole, eMultimedia

### Community 37 - "LgThinqOptions"
Cohesion: 0.33
Nodes (5): LgThinqOptions, BaseUrl, ClientId, CountryCode, PersonalAccessToken

## Knowledge Gaps
- **16 isolated node(s):** `net8.0-windows`, `HasAgent`, `BaseUrl`, `BaseUrl`, `ClientId` (+11 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 206 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **24 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `HomeDashboard.Api.Services` connect `HomeDashboard.Api.Services` to `AudioService.cs`, `PcService.cs`, `LgThinqOptions`, `HomeDashboard.Api/Program.cs`, `AfvalService.cs`, `MusicService.cs`, `HomeDashboard.Api.Models`, `DashboardHub`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **What connects `net8.0-windows`, `HasAgent`, `BaseUrl` to the rest of the system?**
  _16 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Primitives & Mini Tiles` be split into smaller, more focused modules?**
  _Cohesion score 0.05581958810921629 - nodes in this community are weakly interconnected._
- **Why does `HomeDashboard.Api.Models` connect `HomeDashboard.Api.Models` to `AudioService.cs`, `AudioService`, `Afval & Plex Data`, `System & Weather Monitoring`, `SystemStats`, `PcService.cs`, `Music Media Controls`, `MusicService.cs`, `HueService`, `HomeDashboard.Api.Services`, `PcService`, `Airco Request Models`, `WasherService`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Should `DashboardBackgroundService` be split into smaller, more focused modules?**
  _Cohesion score 0.1368421052631579 - nodes in this community are weakly interconnected._
- **Why does `PcService` connect `PcService` to `DashboardBackgroundService`, `Afval & Plex Data`, `System & Weather Monitoring`, `PcService.cs`, `HueService`, `PcController`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.05585106382978723 - nodes in this community are weakly interconnected._