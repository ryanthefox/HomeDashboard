# Graph Report - HomeDashboard  (2026-11-11)

## Corpus Check
- 108 files · ~42,344 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 39 file(s) not represented in the graph (top: .dll 23, (none) 5, .bat 2)
- WARNING: 39 of 149 files seen (26%) have no supported extractor and are missing from this graph entirely. It may look complete while representing only part of the codebase.

## Summary
- 891 nodes · 2333 edges · 52 communities (28 shown, 24 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 70 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f621454a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- MiniHue.tsx
- PcService
- package.json
- Dashboard.tsx
- PlexService
- WeatherService
- PlexWidget.tsx
- GoogleHomeService
- SystemWidget.tsx
- IPolicyConfig
- WeatherWidget.tsx
- HueService
- HomeDashboard.Api.Services
- DashboardBackgroundService.cs
- TS App Config
- TS Node Config
- LG OAuth Setup Script
- DashboardBackgroundService
- GoogleHomeController
- .NET Project Setup
- caddy
- TS Root Config
- HomeDashboard.Api.Models
- HttpGet
- ILogger
- AircoDevice.cs
- AircoService
- CLAUDE.md
- cn
- HomeDashboard.Agent/Program.cs
- LgThinqOptions
- List
- AfvalWidget.tsx
- Task
- SystemMonitorService
- MiniMusic.tsx
- HomeWidget.tsx
- PlexController
- SetDefaultRequest
- WasherService
- HomeWidget
- AircoService
- DateTime
- DashboardBackgroundService.cs

## God Nodes (most connected - your core abstractions)
1. `cn()` - 67 edges
2. `PcService` - 34 edges
3. `react` - 30 edges
4. `PlexService` - 29 edges
5. `HomeDashboard.Api.Services` - 29 edges
6. `GoogleHomeService` - 26 edges
7. `useLocalStorage()` - 25 edges
8. `lucide-react` - 25 edges
9. `Skeleton()` - 24 edges
10. `motion` - 24 edges

## Surprising Connections (you probably didn't know these)
- `HomeDashboard.Api` --references--> `net8.0-windows10.0.19041.0`  [EXTRACTED]
  HomeDashboard.Api/HomeDashboard.Api.csproj → HomeDashboard.Agent/HomeDashboard.Agent.csproj
- `HomeDashboard.Api` --references--> `Microsoft.NET.Sdk.Web`  [EXTRACTED]
  HomeDashboard.Api/HomeDashboard.Api.csproj → HomeDashboard.Agent/HomeDashboard.Agent.csproj
- `SystemWidget()` --calls--> `AnimatedNumber()`  [EXTRACTED]
  frontend/src/components/widgets/SystemWidget.tsx → frontend/src/components/ui/motion.tsx
- `SystemWidget()` --calls--> `Label()`  [EXTRACTED]
  frontend/src/components/widgets/SystemWidget.tsx → frontend/src/components/ui/motion.tsx
- `SystemWidget()` --calls--> `Panel`  [EXTRACTED]
  frontend/src/components/widgets/SystemWidget.tsx → frontend/src/components/ui/motion.tsx

## Import Cycles
- None detected.

## Communities (52 total, 24 thin omitted)

### Community 0 - "MiniHue.tsx"
Cohesion: 0.15
Nodes (27): BrightnessSlider(), Toggle(), BulbBadge(), HUE_FAVORITE_KEY, MiniHue(), SceneChips(), AIRCO_VISIBLE_KEY, AircoTileConfig() (+19 more)

### Community 1 - "PcService"
Cohesion: 0.08
Nodes (12): AudioController, AudioService, AgentPing, MediaCommandResult, PcService, AgentKey, AgentUrl, Broadcast (+4 more)

### Community 2 - "package.json"
Cohesion: 0.05
Nodes (49): dependencies, class-variance-authority@^0.7.0, clsx@^2.1.1, @fontsource-variable/inter@^5.3.0, leaflet@^1.9.4, lucide-react@^0.441.0, @microsoft/signalr@^8.0.7, motion@^14.12.0 (+41 more)

### Community 3 - "Dashboard.tsx"
Cohesion: 0.06
Nodes (56): App(), AuthGate(), AfvalWidget, AircoWidget, AmbientBackground, Clock(), ConnectionDot(), Dashboard() (+48 more)

### Community 4 - "PlexService"
Cohesion: 0.13
Nodes (6): PlexItem, PlexSession, PlexStats, PlexService, ServerUrl, Token

### Community 5 - "WeatherService"
Cohesion: 0.16
Nodes (6): DiskDriveInfo, SystemStats, DailyForecastItem, HourlyForecastItem, WeatherData, WeatherService

### Community 6 - "PlexWidget.tsx"
Cohesion: 0.19
Nodes (27): itemSubtitle(), itemTitle(), LiveCard(), MiniPlex(), PosterRow(), addedAgo(), PlexLink(), PlexPoster() (+19 more)

### Community 7 - "GoogleHomeService"
Cohesion: 0.10
Nodes (7): DashboardAuth, Required, Stamp, GoogleHomeService, ClientId, ClientSecret, Enabled

### Community 8 - "SystemWidget.tsx"
Cohesion: 0.17
Nodes (23): ArcGauge(), ArcGaugeProps, SIZES, MiniSystem(), PcOfflineNote(), PcPowerButton(), SourceToggle(), Bar() (+15 more)

### Community 9 - "IPolicyConfig"
Cohesion: 0.12
Nodes (5): ERole, eCommunications, eConsole, eMultimedia, IPolicyConfig

### Community 10 - "WeatherWidget.tsx"
Cohesion: 0.12
Nodes (32): AnimatedNumber(), Label(), Skeleton(), CloudShape(), effectiveIcon(), RAIN, skyGradient(), SNOW (+24 more)

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

### Community 17 - "DashboardBackgroundService"
Cohesion: 0.08
Nodes (3): DashboardBackgroundService, MediaInfo, MusicService

### Community 20 - ".NET Project Setup"
Cohesion: 0.33
Nodes (7): net8.0-windows10.0.19041.0, HomeDashboard.Api, LibreHardwareMonitorLib (0.9.4), Microsoft.AspNetCore.OpenApi (8.0.0), NAudio (2.2.1), Swashbuckle.AspNetCore (6.6.2), Microsoft.NET.Sdk.Web

### Community 21 - "caddy"
Cohesion: 0.08
Nodes (23): build, environment, network_mode, profiles, restart, volumes, build, environment (+15 more)

### Community 26 - "HomeDashboard.Api.Models"
Cohesion: 0.19
Nodes (3): HomeDashboard.Api.Models, AudioOutputDevice, PcStatus

### Community 27 - "HttpGet"
Cohesion: 0.14
Nodes (4): AfvalController, SystemController, WasherController, WeatherController

### Community 28 - "ILogger"
Cohesion: 0.16
Nodes (4): AuthController, LoginRequest, MusicController, PcController

### Community 29 - "AircoDevice.cs"
Cohesion: 0.18
Nodes (5): AircoDevice, SetFanSpeedRequest, SetModeRequest, SetPowerRequest, SetTemperatureRequest

### Community 32 - "cn"
Cohesion: 0.21
Nodes (26): Press, Segmented(), softSpring, spring, ThermostatRing(), AircoWidget(), MiniAirco(), PowerButton() (+18 more)

### Community 34 - "LgThinqOptions"
Cohesion: 0.33
Nodes (5): LgThinqOptions, BaseUrl, ClientId, CountryCode, PersonalAccessToken

### Community 37 - "AfvalWidget.tsx"
Cohesion: 0.18
Nodes (23): EmptyState(), Panel, AfvalWidget(), CalendarView(), ListView(), NextCollection(), View, AircoSetupPrompt() (+15 more)

### Community 40 - "MiniMusic.tsx"
Cohesion: 0.34
Nodes (12): ArtBackdrop(), DeviceIcon(), Equalizer(), MiniMusic(), shortDeviceName(), useMusicControls(), MusicWidget(), audioApi (+4 more)

### Community 41 - "HomeWidget.tsx"
Cohesion: 0.16
Nodes (13): fadeUp, useCompactColumns(), useIsMobile(), useMediaQuery(), ALL_IDS, COL_LABEL, Column, COLUMNS (+5 more)

### Community 46 - "HomeWidget"
Cohesion: 0.46
Nodes (8): ConfigSheet(), HomeWidget(), buildRows(), handleDrop(), renderCell(), renderColumn(), IconBtn(), sanitize()

## Knowledge Gaps
- **16 isolated node(s):** `HasAgent`, `BaseUrl`, `Microsoft.AspNetCore.OpenApi (8.0.0)`, `Swashbuckle.AspNetCore (6.6.2)`, `BaseUrl` (+11 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 247 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **24 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `HomeDashboard.Api.Services` connect `HomeDashboard.Api.Services` to `HomeDashboard.Agent/Program.cs`, `LgThinqOptions`, `homedashboard_api_models`, `PcService.cs`, `DashboardBackgroundService.cs`, `AuthController.cs`, `MusicService.cs`, `HomeDashboard.Api.Models`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **What connects `HasAgent`, `BaseUrl`, `Microsoft.AspNetCore.OpenApi (8.0.0)` to the rest of the system?**
  _16 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `MiniHue.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14564564564564564 - nodes in this community are weakly interconnected._
- **Why does `PcService` connect `PcService` to `PlexService`, `Task`, `GoogleHomeService`, `WasherService`, `PcService.cs`, `DashboardBackgroundService`, `DateTime`, `ILogger`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Should `PcService` be split into smaller, more focused modules?**
  _Cohesion score 0.08108108108108109 - nodes in this community are weakly interconnected._
- **Why does `HomeDashboard.Api.Models` connect `HomeDashboard.Api.Models` to `HomeDashboard.Agent/Program.cs`, `PlexService`, `WeatherService`, `HueService`, `HomeDashboard.Api.Services`, `WasherService`, `DateTime`, `DashboardBackgroundService`, `MusicService.cs`, `AircoDevice.cs`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.05203619909502263 - nodes in this community are weakly interconnected._