# Graph Report - HomeDashboard  (2026-11-11)

## Corpus Check
- 89 files · ~29,842 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 36 file(s) not represented in the graph (top: .dll 23, (none) 3, .bat 2)
- WARNING: 36 of 126 files seen (29%) have no supported extractor and are missing from this graph entirely. It may look complete while representing only part of the codebase.

## Summary
- 652 nodes · 1686 edges · 33 communities (25 shown, 8 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 47 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d2be32a6`
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
- dependencies
- App.tsx
- useSignalR.ts
- vite.config.ts
- CLAUDE.md
- scripts

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
- `DashboardBackgroundService` --references--> `AircoService`  [EXTRACTED]
  HomeDashboard.Api/BackgroundServices/DashboardBackgroundService.cs → HomeDashboard.Api/Services/AircoService.cs
- `DashboardBackgroundService` --references--> `HueService`  [EXTRACTED]
  HomeDashboard.Api/BackgroundServices/DashboardBackgroundService.cs → HomeDashboard.Api/Services/HueService.cs
- `DashboardBackgroundService` --references--> `MusicService`  [EXTRACTED]
  HomeDashboard.Api/BackgroundServices/DashboardBackgroundService.cs → HomeDashboard.Api/Services/MusicService.cs
- `DashboardBackgroundService` --references--> `SystemMonitorService`  [EXTRACTED]
  HomeDashboard.Api/BackgroundServices/DashboardBackgroundService.cs → HomeDashboard.Api/Services/SystemMonitorService.cs

## Import Cycles
- None detected.

## Communities (33 total, 8 thin omitted)

### Community 0 - "UI Primitives & Mini Tiles"
Cohesion: 0.07
Nodes (91): ArcGauge(), ArcGaugeProps, SIZES, AnimatedNumber(), easeOutExpo, EmptyState(), fadeUp, Label() (+83 more)

### Community 2 - "package.json"
Cohesion: 0.14
Nodes (19): devDependencies, autoprefixer@^10.4.20, postcss@^8.4.45, tailwindcss@^3.4.11, @types/node@^20.0.0, @types/react@^18.3.5, @types/react-dom@^18.3.0, typescript@^5.5.3 (+11 more)

### Community 3 - "Dashboard.tsx"
Cohesion: 0.08
Nodes (46): AfvalWidget, AircoWidget, AmbientBackground, Clock(), ConnectionDot(), Dashboard(), greeting(), HueWidget (+38 more)

### Community 4 - "Afval & Plex Data"
Cohesion: 0.14
Nodes (6): PlexItem, PlexSession, AfvalService, PlexService, ServerUrl, Token

### Community 5 - "System & Weather Monitoring"
Cohesion: 0.10
Nodes (7): DiskDriveInfo, SystemStats, DailyForecastItem, HourlyForecastItem, WeatherData, SystemMonitorService, WeatherService

### Community 6 - "LG Washer Integration"
Cohesion: 0.14
Nodes (3): WasherDevice, LgThinqClient, WasherService

### Community 7 - "WeatherWidget.tsx"
Cohesion: 0.14
Nodes (25): CloudShape(), effectiveIcon(), RAIN, skyGradient(), SNOW, STARS, WeatherFx, WeatherIcon() (+17 more)

### Community 8 - "Music Media Controls"
Cohesion: 0.14
Nodes (3): AudioController, MusicController, MusicService

### Community 9 - "IPolicyConfig"
Cohesion: 0.08
Nodes (7): AudioOutputDevice, AudioService, ERole, eCommunications, eConsole, eMultimedia, IPolicyConfig

### Community 11 - "HueService"
Cohesion: 0.19
Nodes (4): HueController, HueLightStateRequest, HueService, BaseUrl

### Community 12 - "HomeDashboard.Api.Services"
Cohesion: 0.06
Nodes (12): HomeDashboard.Api.Services, HomeDashboard.Api.BackgroundServices, HomeDashboard.Api.Hubs, HomeDashboard.Api.Models, HomeDashboard.Api.Controllers, SetDefaultRequest, AfvalItem, LgThinqOptions (+4 more)

### Community 13 - "Airco Controller API"
Cohesion: 0.17
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
Cohesion: 0.25
Nodes (4): HueGroupActionRequest, HueLight, HueRoom, HueScene

### Community 18 - "Airco Request Models"
Cohesion: 0.22
Nodes (4): SetFanSpeedRequest, SetModeRequest, SetPowerRequest, SetTemperatureRequest

### Community 19 - "ControllerBase"
Cohesion: 0.29
Nodes (3): AfvalController, SystemController, WeatherController

### Community 20 - ".NET Project Setup"
Cohesion: 0.25
Nodes (6): net8.0-windows10.0.19041.0, LibreHardwareMonitorLib (0.9.4), Microsoft.AspNetCore.OpenApi (8.0.0), NAudio (2.2.1), Swashbuckle.AspNetCore (6.6.2), Microsoft.NET.Sdk.Web

### Community 21 - "Docker Compose"
Cohesion: 0.25
Nodes (7): build, environment, extra_hosts, ports, restart, services, dashboard

### Community 27 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, class-variance-authority@^0.7.0, clsx@^2.1.1, leaflet@^1.9.4, lucide-react@^0.441.0, motion@^14.12.0, react@^18.3.1, react-dom@^18.3.1 (+9 more)

### Community 28 - "App.tsx"
Cohesion: 0.17
Nodes (10): @fontsource-variable/inter@^5.3.0, @tanstack/react-query-devtools@^5.56.2, App(), queryClient, Theme, ThemeCtx, ThemeCtxValue, ThemeProvider() (+2 more)

### Community 29 - "useSignalR.ts"
Cohesion: 0.24
Nodes (12): @microsoft/signalr@^8.0.7, useConnectionState(), SystemStats, WeatherData, connection, getConnectionState(), listeners, notify() (+4 more)

### Community 30 - "vite.config.ts"
Cohesion: 0.33
Nodes (4): vite@^5.4.2, @vitejs/plugin-react@^4.3.1, vite, @vitejs/plugin-react

### Community 32 - "scripts"
Cohesion: 0.50
Nodes (4): scripts, build, dev, preview

## Knowledge Gaps
- **16 isolated node(s):** `net8.0-windows10.0.19041.0`, `Microsoft.AspNetCore.OpenApi (8.0.0)`, `Swashbuckle.AspNetCore (6.6.2)`, `LibreHardwareMonitorLib (0.9.4)`, `NAudio (2.2.1)` (+11 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 192 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `HomeDashboard.Api.Services` connect `HomeDashboard.Api.Services` to `IPolicyConfig`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **What connects `net8.0-windows10.0.19041.0`, `Microsoft.AspNetCore.OpenApi (8.0.0)`, `Swashbuckle.AspNetCore (6.6.2)` to the rest of the system?**
  _16 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Primitives & Mini Tiles` be split into smaller, more focused modules?**
  _Cohesion score 0.0679160419790105 - nodes in this community are weakly interconnected._
- **Why does `HomeDashboard.Api.Models` connect `HomeDashboard.Api.Services` to `System & Weather Monitoring`, `LG Washer Integration`, `IPolicyConfig`, `HueLight.cs`, `Airco Request Models`, `MusicService.GetCurrentMediaAsync`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Should `DashboardBackgroundService` be split into smaller, more focused modules?**
  _Cohesion score 0.13725490196078433 - nodes in this community are weakly interconnected._
- **Why does `react` connect `UI Primitives & Mini Tiles` to `package.json`, `Dashboard.tsx`, `WeatherWidget.tsx`, `dependencies`, `App.tsx`, `useSignalR.ts`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.1368421052631579 - nodes in this community are weakly interconnected._