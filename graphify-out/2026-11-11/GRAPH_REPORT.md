# Graph Report - HomeDashboard  (2026-11-11)

## Corpus Check
- Corpus is ~29,224 words - fits in a single context window. You may not need a graph.

## Summary
- 644 nodes · 1677 edges · 26 communities (21 shown, 5 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 47 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- UI Primitives & Mini Tiles
- Backend Namespaces & Services
- Frontend Dependencies
- App Shell & Navigation
- Afval & Plex Data
- System & Weather Monitoring
- LG Washer Integration
- Hue Lighting UI
- Music Media Controls
- Audio Output Switching
- API Controllers Base
- Weather Visual Effects
- Hue Backend API
- Airco Controller API
- TS App Config
- TS Node Config
- LG OAuth Setup Script
- SignalR Push Poller
- Airco Request Models
- Hue Models
- .NET Project Setup
- Docker Compose
- TS Root Config

## God Nodes (most connected - your core abstractions)
1. `cn()` - 51 edges
2. `react` - 24 edges
3. `Skeleton()` - 24 edges
4. `PlexService` - 23 edges
5. `HomeDashboard.Api.Services` - 22 edges
6. `AircoService` - 22 edges
7. `HomeDashboard.Api.Models` - 21 edges
8. `lucide-react` - 21 edges
9. `motion` - 21 edges
10. `@tanstack/react-query` - 20 edges

## Surprising Connections (you probably didn't know these)
- `DashboardBackgroundService` --references--> `DashboardHub`  [EXTRACTED]
  HomeDashboard.Api/BackgroundServices/DashboardBackgroundService.cs → HomeDashboard.Api/Hubs/DashboardHub.cs
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

## Communities (26 total, 5 thin omitted)

### Community 0 - "UI Primitives & Mini Tiles"
Cohesion: 0.06
Nodes (97): ArcGauge(), ArcGaugeProps, SIZES, AnimatedNumber(), easeOutExpo, EmptyState(), fadeUp, Label() (+89 more)

### Community 1 - "Backend Namespaces & Services"
Cohesion: 0.06
Nodes (12): HomeDashboard.Api.Services, HomeDashboard.Api.BackgroundServices, HomeDashboard.Api.Hubs, HomeDashboard.Api.Models, HomeDashboard.Api.Controllers, SetDefaultRequest, DashboardHub, LgThinqOptions (+4 more)

### Community 2 - "Frontend Dependencies"
Cohesion: 0.05
Nodes (49): dependencies, class-variance-authority@^0.7.0, clsx@^2.1.1, @fontsource-variable/inter@^5.3.0, leaflet@^1.9.4, lucide-react@^0.441.0, @microsoft/signalr@^8.0.7, motion@^14.12.0 (+41 more)

### Community 3 - "App Shell & Navigation"
Cohesion: 0.07
Nodes (43): App(), AfvalWidget, AircoWidget, AmbientBackground, Clock(), ConnectionDot(), Dashboard(), greeting() (+35 more)

### Community 4 - "Afval & Plex Data"
Cohesion: 0.12
Nodes (7): AfvalItem, PlexItem, PlexSession, AfvalService, PlexService, ServerUrl, Token

### Community 5 - "System & Weather Monitoring"
Cohesion: 0.10
Nodes (7): DiskDriveInfo, SystemStats, DailyForecastItem, HourlyForecastItem, WeatherData, SystemMonitorService, WeatherService

### Community 6 - "LG Washer Integration"
Cohesion: 0.14
Nodes (4): WasherController, WasherDevice, LgThinqClient, WasherService

### Community 7 - "Hue Lighting UI"
Cohesion: 0.22
Nodes (17): BrightnessSlider(), Toggle(), BulbBadge(), MiniHue(), SceneChips(), HueWidget(), LightRow(), RoomCard() (+9 more)

### Community 8 - "Music Media Controls"
Cohesion: 0.16
Nodes (3): MusicController, MediaInfo, MusicService

### Community 9 - "Audio Output Switching"
Cohesion: 0.08
Nodes (7): AudioOutputDevice, AudioService, ERole, eCommunications, eConsole, eMultimedia, IPolicyConfig

### Community 10 - "API Controllers Base"
Cohesion: 0.14
Nodes (5): AfvalController, AudioController, PlexController, SystemController, WeatherController

### Community 11 - "Weather Visual Effects"
Cohesion: 0.16
Nodes (21): CloudShape(), effectiveIcon(), RAIN, skyGradient(), SNOW, STARS, WeatherFx, WeatherIcon() (+13 more)

### Community 12 - "Hue Backend API"
Cohesion: 0.14
Nodes (4): HueController, HueLightStateRequest, HueService, BaseUrl

### Community 13 - "Airco Controller API"
Cohesion: 0.16
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

### Community 18 - "Airco Request Models"
Cohesion: 0.22
Nodes (4): SetFanSpeedRequest, SetModeRequest, SetPowerRequest, SetTemperatureRequest

### Community 19 - "Hue Models"
Cohesion: 0.25
Nodes (4): HueGroupActionRequest, HueLight, HueRoom, HueScene

### Community 20 - ".NET Project Setup"
Cohesion: 0.25
Nodes (7): net8.0-windows10.0.19041.0, HomeDashboard.Api, LibreHardwareMonitorLib (0.9.4), Microsoft.AspNetCore.OpenApi (8.0.0), NAudio (2.2.1), Swashbuckle.AspNetCore (6.6.2), Microsoft.NET.Sdk.Web

### Community 21 - "Docker Compose"
Cohesion: 0.29
Nodes (6): build, environment, ports, restart, services, dashboard

## Knowledge Gaps
- **16 isolated node(s):** `net8.0-windows10.0.19041.0`, `Microsoft.AspNetCore.OpenApi (8.0.0)`, `Swashbuckle.AspNetCore (6.6.2)`, `LibreHardwareMonitorLib (0.9.4)`, `NAudio (2.2.1)` (+11 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 187 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `HomeDashboard.Api.Services` connect `Backend Namespaces & Services` to `Audio Output Switching`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **What connects `net8.0-windows10.0.19041.0`, `Microsoft.AspNetCore.OpenApi (8.0.0)`, `Swashbuckle.AspNetCore (6.6.2)` to the rest of the system?**
  _16 weakly-connected nodes found - possible missing edges._
- **Should `UI Primitives & Mini Tiles` be split into smaller, more focused modules?**
  _Cohesion score 0.06308539944903581 - nodes in this community are weakly interconnected._
- **Why does `HomeDashboard.Api.Models` connect `Backend Namespaces & Services` to `Afval & Plex Data`, `System & Weather Monitoring`, `LG Washer Integration`, `Music Media Controls`, `Audio Output Switching`, `Airco Request Models`, `Hue Models`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Should `Backend Namespaces & Services` be split into smaller, more focused modules?**
  _Cohesion score 0.06009783368273934 - nodes in this community are weakly interconnected._
- **Why does `react` connect `UI Primitives & Mini Tiles` to `Weather Visual Effects`, `Frontend Dependencies`, `App Shell & Navigation`, `Hue Lighting UI`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Should `Frontend Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05203619909502263 - nodes in this community are weakly interconnected._