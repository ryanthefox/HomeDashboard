# Graph Report - HomeDashboard  (2026-11-11)

## Corpus Check
- 89 files · ~29,682 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 35 file(s) not represented in the graph (top: .dll 23, (none) 3, .bat 2)
- WARNING: 35 of 125 files seen (28%) have no supported extractor and are missing from this graph entirely. It may look complete while representing only part of the codebase.

## Summary
- 647 nodes · 1681 edges · 33 communities (17 shown, 16 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 47 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a7137d71`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- UI Primitives & Mini Tiles
- HomeDashboard.Api.Models
- Frontend Dependencies
- App Shell & Navigation
- Afval & Plex Data
- System & Weather Monitoring
- LG Washer Integration
- Hue Lighting UI
- Music Media Controls
- IPolicyConfig
- IActionResult
- Weather Visual Effects
- HomeDashboard.Api.Services
- Airco Controller API
- TS App Config
- TS Node Config
- LG OAuth Setup Script
- PlexController
- Airco Request Models
- AudioService.cs
- .NET Project Setup
- Docker Compose
- TS Root Config
- MusicService.GetCurrentMediaAsync
- ERole
- LgThinqOptions
- CLAUDE.md
- SetDefaultRequest

## God Nodes (most connected - your core abstractions)
1. `cn()` - 52 edges
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
- `DashboardBackgroundService` --references--> `AircoService`  [EXTRACTED]
  HomeDashboard.Api/BackgroundServices/DashboardBackgroundService.cs → HomeDashboard.Api/Services/AircoService.cs
- `DashboardBackgroundService` --references--> `HueService`  [EXTRACTED]
  HomeDashboard.Api/BackgroundServices/DashboardBackgroundService.cs → HomeDashboard.Api/Services/HueService.cs
- `DashboardBackgroundService` --references--> `MusicService`  [EXTRACTED]
  HomeDashboard.Api/BackgroundServices/DashboardBackgroundService.cs → HomeDashboard.Api/Services/MusicService.cs
- `AfvalController` --references--> `AfvalService`  [EXTRACTED]
  HomeDashboard.Api/Controllers/AfvalController.cs → HomeDashboard.Api/Services/AfvalService.cs
- `AircoController` --references--> `AircoService`  [EXTRACTED]
  HomeDashboard.Api/Controllers/AircoController.cs → HomeDashboard.Api/Services/AircoService.cs

## Import Cycles
- None detected.

## Communities (33 total, 16 thin omitted)

### Community 0 - "UI Primitives & Mini Tiles"
Cohesion: 0.06
Nodes (101): ArcGauge(), ArcGaugeProps, SIZES, AnimatedNumber(), EmptyState(), fadeUp, Label(), Panel (+93 more)

### Community 2 - "Frontend Dependencies"
Cohesion: 0.06
Nodes (44): dependencies, class-variance-authority@^0.7.0, clsx@^2.1.1, leaflet@^1.9.4, lucide-react@^0.441.0, motion@^14.12.0, react@^18.3.1, tailwind-merge@^2.5.2 (+36 more)

### Community 3 - "App Shell & Navigation"
Cohesion: 0.07
Nodes (41): @fontsource-variable/inter@^5.3.0, @microsoft/signalr@^8.0.7, react-dom@^18.3.1, App(), AfvalWidget, AircoWidget, AmbientBackground, Clock() (+33 more)

### Community 4 - "Afval & Plex Data"
Cohesion: 0.07
Nodes (14): AfvalItem, HueGroupActionRequest, HueLight, HueLightStateRequest, HueRoom, HueScene, PlexItem, PlexSession (+6 more)

### Community 5 - "System & Weather Monitoring"
Cohesion: 0.06
Nodes (11): HomeDashboard.Api.BackgroundServices, HomeDashboard.Api.Hubs, DashboardBackgroundService, DashboardHub, DiskDriveInfo, SystemStats, DailyForecastItem, HourlyForecastItem (+3 more)

### Community 6 - "LG Washer Integration"
Cohesion: 0.13
Nodes (4): WasherController, WasherDevice, LgThinqClient, WasherService

### Community 7 - "Hue Lighting UI"
Cohesion: 0.23
Nodes (17): BrightnessSlider(), Toggle(), BulbBadge(), HUE_FAVORITE_KEY, MiniHue(), SceneChips(), HueWidget(), LightRow() (+9 more)

### Community 10 - "IActionResult"
Cohesion: 0.12
Nodes (6): AfvalController, AircoController, AudioController, HueController, SystemController, WeatherController

### Community 11 - "Weather Visual Effects"
Cohesion: 0.14
Nodes (25): CloudShape(), effectiveIcon(), RAIN, skyGradient(), SNOW, STARS, WeatherFx, WeatherIcon() (+17 more)

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

### Community 20 - ".NET Project Setup"
Cohesion: 0.25
Nodes (7): net8.0-windows10.0.19041.0, HomeDashboard.Api, LibreHardwareMonitorLib (0.9.4), Microsoft.AspNetCore.OpenApi (8.0.0), NAudio (2.2.1), Swashbuckle.AspNetCore (6.6.2), Microsoft.NET.Sdk.Web

### Community 21 - "Docker Compose"
Cohesion: 0.29
Nodes (6): build, environment, ports, restart, services, dashboard

### Community 27 - "ERole"
Cohesion: 0.33
Nodes (4): ERole, eCommunications, eConsole, eMultimedia

### Community 28 - "LgThinqOptions"
Cohesion: 0.33
Nodes (5): LgThinqOptions, BaseUrl, ClientId, CountryCode, PersonalAccessToken

## Knowledge Gaps
- **16 isolated node(s):** `net8.0-windows10.0.19041.0`, `Microsoft.AspNetCore.OpenApi (8.0.0)`, `Swashbuckle.AspNetCore (6.6.2)`, `LibreHardwareMonitorLib (0.9.4)`, `NAudio (2.2.1)` (+11 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 189 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `HomeDashboard.Api.Services` connect `HomeDashboard.Api.Services` to `HomeDashboard.Api.Models`, `System & Weather Monitoring`, `AudioService.cs`, `LgThinqOptions`, `LgThinqClient.cs`, `MusicService.cs`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **What connects `net8.0-windows10.0.19041.0`, `Microsoft.AspNetCore.OpenApi (8.0.0)`, `Swashbuckle.AspNetCore (6.6.2)` to the rest of the system?**
  _16 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Primitives & Mini Tiles` be split into smaller, more focused modules?**
  _Cohesion score 0.06133333333333333 - nodes in this community are weakly interconnected._
- **Why does `HomeDashboard.Api.Models` connect `HomeDashboard.Api.Models` to `Afval & Plex Data`, `System & Weather Monitoring`, `LG Washer Integration`, `HomeDashboard.Api.Services`, `Airco Request Models`, `AudioService.cs`, `MusicService.GetCurrentMediaAsync`, `MusicService.cs`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Should `Frontend Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05735430157261795 - nodes in this community are weakly interconnected._
- **Why does `react` connect `UI Primitives & Mini Tiles` to `Weather Visual Effects`, `Frontend Dependencies`, `App Shell & Navigation`, `Hue Lighting UI`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Should `App Shell & Navigation` be split into smaller, more focused modules?**
  _Cohesion score 0.07142857142857142 - nodes in this community are weakly interconnected._