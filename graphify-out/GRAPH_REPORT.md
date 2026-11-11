# Graph Report - HomeDashboard  (2026-11-11)

## Corpus Check
- 105 files · ~38,122 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 38 file(s) not represented in the graph (top: .dll 23, (none) 5, .bat 2)
- WARNING: 38 of 144 files seen (26%) have no supported extractor and are missing from this graph entirely. It may look complete while representing only part of the codebase.

## Summary
- 818 nodes · 2115 edges · 38 communities (28 shown, 10 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 55 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d9c7d6f7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- UI Primitives & Mini Tiles
- PcService
- devDependencies
- Dashboard.tsx
- PlexService
- WeatherService
- PlexWidget.tsx
- WeatherWidget.tsx
- SystemWidget.tsx
- IPolicyConfig
- Task
- HueService
- HomeDashboard.Api.Services
- DashboardBackgroundService.cs
- TS App Config
- TS Node Config
- LG OAuth Setup Script
- DashboardBackgroundService
- WasherService
- .NET Project Setup
- caddy
- TS Root Config
- HomeDashboard.Api.Models
- HomeWidget
- ILogger
- Task
- JsonElement
- CLAUDE.md
- AircoDevice.cs
- HomeDashboard.Agent/Program.cs
- LgThinqOptions
- scripts

## God Nodes (most connected - your core abstractions)
1. `cn()` - 63 edges
2. `PcService` - 34 edges
3. `PlexService` - 29 edges
4. `react` - 29 edges
5. `HomeDashboard.Api.Services` - 26 edges
6. `Skeleton()` - 24 edges
7. `lucide-react` - 24 edges
8. `motion` - 23 edges
9. `AircoService` - 21 edges
10. `Dashboard()` - 21 edges

## Surprising Connections (you probably didn't know these)
- `HomeDashboard.Api` --references--> `net8.0-windows10.0.19041.0`  [EXTRACTED]
  HomeDashboard.Api/HomeDashboard.Api.csproj → HomeDashboard.Agent/HomeDashboard.Agent.csproj
- `HomeDashboard.Api` --references--> `Microsoft.NET.Sdk.Web`  [EXTRACTED]
  HomeDashboard.Api/HomeDashboard.Api.csproj → HomeDashboard.Agent/HomeDashboard.Agent.csproj
- `PcController` --references--> `PcService`  [EXTRACTED]
  HomeDashboard.Api/Controllers/PcController.cs → HomeDashboard.Api/Services/PcService.cs
- `DashboardBackgroundService` --references--> `PcService`  [EXTRACTED]
  HomeDashboard.Api/BackgroundServices/DashboardBackgroundService.cs → HomeDashboard.Api/Services/PcService.cs
- `MusicController` --references--> `PcService`  [EXTRACTED]
  HomeDashboard.Api/Controllers/MusicController.cs → HomeDashboard.Api/Services/PcService.cs

## Import Cycles
- None detected.

## Communities (38 total, 10 thin omitted)

### Community 0 - "UI Primitives & Mini Tiles"
Cohesion: 0.06
Nodes (106): dependencies, class-variance-authority@^0.7.0, clsx@^2.1.1, lucide-react@^0.441.0, motion@^14.12.0, react@^18.3.1, tailwind-merge@^2.5.2, @tanstack/react-query@^5.56.2 (+98 more)

### Community 1 - "PcService"
Cohesion: 0.07
Nodes (14): AudioController, SetDefaultRequest, AudioOutputDevice, AudioService, AgentPing, MediaCommandResult, PcService, AgentKey (+6 more)

### Community 2 - "devDependencies"
Cohesion: 0.10
Nodes (19): devDependencies, autoprefixer@^10.4.20, postcss@^8.4.45, tailwindcss@^3.4.11, @types/node@^20.0.0, @types/react@^18.3.5, @types/react-dom@^18.3.0, typescript@^5.5.3 (+11 more)

### Community 3 - "Dashboard.tsx"
Cohesion: 0.06
Nodes (59): @fontsource-variable/inter@^5.3.0, @microsoft/signalr@^8.0.7, react-dom@^18.3.1, @tanstack/react-query-devtools@^5.56.2, App(), AuthGate(), AfvalWidget, AircoWidget (+51 more)

### Community 4 - "PlexService"
Cohesion: 0.10
Nodes (7): PlexItem, PlexSession, PlexStats, AfvalService, PlexService, ServerUrl, Token

### Community 5 - "WeatherService"
Cohesion: 0.15
Nodes (6): DiskDriveInfo, SystemStats, DailyForecastItem, HourlyForecastItem, WeatherData, WeatherService

### Community 6 - "PlexWidget.tsx"
Cohesion: 0.21
Nodes (25): Segmented(), itemSubtitle(), itemTitle(), LiveCard(), MiniPlex(), PosterRow(), addedAgo(), PlexLink() (+17 more)

### Community 7 - "WeatherWidget.tsx"
Cohesion: 0.13
Nodes (25): leaflet@^1.9.4, CloudShape(), effectiveIcon(), RAIN, skyGradient(), SNOW, STARS, WeatherFx (+17 more)

### Community 8 - "SystemWidget.tsx"
Cohesion: 0.16
Nodes (25): ArcGauge(), ArcGaugeProps, SIZES, AnimatedNumber(), MiniSystem(), PcOfflineNote(), PcPowerButton(), POWER_ITEMS (+17 more)

### Community 9 - "IPolicyConfig"
Cohesion: 0.11
Nodes (5): ERole, eCommunications, eConsole, eMultimedia, IPolicyConfig

### Community 10 - "Task"
Cohesion: 0.12
Nodes (4): AfvalController, PlexController, SystemController, WeatherController

### Community 11 - "HueService"
Cohesion: 0.11
Nodes (8): HueController, HueGroupActionRequest, HueLight, HueLightStateRequest, HueRoom, HueScene, HueService, BaseUrl

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

### Community 17 - "DashboardBackgroundService"
Cohesion: 0.06
Nodes (4): DashboardBackgroundService, MediaInfo, MusicService, SystemMonitorService

### Community 19 - "WasherService"
Cohesion: 0.20
Nodes (3): WasherController, WasherDevice, WasherService

### Community 20 - ".NET Project Setup"
Cohesion: 0.33
Nodes (7): net8.0-windows10.0.19041.0, HomeDashboard.Api, LibreHardwareMonitorLib (0.9.4), Microsoft.AspNetCore.OpenApi (8.0.0), NAudio (2.2.1), Swashbuckle.AspNetCore (6.6.2), Microsoft.NET.Sdk.Web

### Community 21 - "caddy"
Cohesion: 0.08
Nodes (23): build, environment, network_mode, profiles, restart, volumes, build, environment (+15 more)

### Community 26 - "HomeDashboard.Api.Models"
Cohesion: 0.12
Nodes (3): HomeDashboard.Api.Models, AfvalItem, PcStatus

### Community 27 - "HomeWidget"
Cohesion: 0.43
Nodes (8): useIsMobile(), HomeWidget(), buildRows(), handleDrop(), renderCell(), renderColumn(), IconBtn(), sanitize()

### Community 28 - "ILogger"
Cohesion: 0.13
Nodes (4): AuthController, LoginRequest, MusicController, PcController

### Community 29 - "Task"
Cohesion: 0.20
Nodes (3): AircoController, AircoDevice, AircoService

### Community 32 - "AircoDevice.cs"
Cohesion: 0.22
Nodes (4): SetFanSpeedRequest, SetModeRequest, SetPowerRequest, SetTemperatureRequest

### Community 33 - "HomeDashboard.Agent/Program.cs"
Cohesion: 0.14
Nodes (4): AudioDeviceRequest, DashboardAuth, Required, Stamp

### Community 34 - "LgThinqOptions"
Cohesion: 0.33
Nodes (5): LgThinqOptions, BaseUrl, ClientId, CountryCode, PersonalAccessToken

### Community 35 - "scripts"
Cohesion: 0.50
Nodes (4): scripts, build, dev, preview

## Knowledge Gaps
- **15 isolated node(s):** `HasAgent`, `BaseUrl`, `BaseUrl`, `ClientId`, `CountryCode` (+10 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 237 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `HomeDashboard.Api.Services` connect `HomeDashboard.Api.Services` to `HomeDashboard.Agent/Program.cs`, `LgThinqOptions`, `PcService.cs`, `IPolicyConfig`, `DashboardBackgroundService.cs`, `AuthController.cs`, `HomeDashboard.Api.Models`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **What connects `HasAgent`, `BaseUrl`, `BaseUrl` to the rest of the system?**
  _15 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Primitives & Mini Tiles` be split into smaller, more focused modules?**
  _Cohesion score 0.05648854961832061 - nodes in this community are weakly interconnected._
- **Why does `PcService` connect `PcService` to `PlexService`, `PcService.cs`, `WeatherService`, `Task`, `DashboardBackgroundService`, `ILogger`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Should `PcService` be split into smaller, more focused modules?**
  _Cohesion score 0.06736353077816493 - nodes in this community are weakly interconnected._
- **Why does `HomeDashboard.Api.Models` connect `HomeDashboard.Api.Models` to `AircoDevice.cs`, `PcService`, `PlexService`, `WeatherService`, `IPolicyConfig`, `HueService`, `HomeDashboard.Api.Services`, `DashboardBackgroundService`, `WasherService`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._