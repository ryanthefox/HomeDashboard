# Graph Report - HomeDashboard  (2026-11-11)

## Corpus Check
- 126 files · ~52,701 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 41 file(s) not represented in the graph (top: .dll 23, (none) 7, .bat 2)
- WARNING: 41 of 169 files seen (24%) have no supported extractor and are missing from this graph entirely. It may look complete while representing only part of the codebase.

## Summary
- 1071 nodes · 2973 edges · 48 communities (34 shown, 14 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 85 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4f6a1f40`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- EnergyWidget.tsx
- PcService
- package.json
- Dashboard.tsx
- PlexService
- WeatherService
- server.mjs
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
- HomeDashboard.Api
- caddy
- TS Root Config
- HttpGet
- FrankEnergieService
- AircoDevice.cs
- AircoService
- CLAUDE.md
- HomeWidget.tsx
- HomeDashboard.Agent/Program.cs
- LgThinqOptions
- HttpPost
- PcService.cs
- react
- AircoService
- MusicService
- PlexWidget.tsx
- cn
- motion.tsx
- MiniAirco.tsx
- api.ts
- MiniWeather.tsx
- HueLight.cs

## God Nodes (most connected - your core abstractions)
1. `cn()` - 81 edges
2. `react` - 39 edges
3. `useLocalStorage()` - 36 edges
4. `PcService` - 35 edges
5. `HomeDashboard.Api.Services` - 34 edges
6. `FrankEnergieService` - 32 edges
7. `lucide-react` - 32 edges
8. `Skeleton()` - 31 edges
9. `PlexService` - 29 edges
10. `motion` - 28 edges

## Surprising Connections (you probably didn't know these)
- `DashboardBackgroundService` --references--> `AircoService`  [EXTRACTED]
  HomeDashboard.Api/BackgroundServices/DashboardBackgroundService.cs → HomeDashboard.Api/Services/AircoService.cs
- `DashboardBackgroundService` --references--> `HueService`  [EXTRACTED]
  HomeDashboard.Api/BackgroundServices/DashboardBackgroundService.cs → HomeDashboard.Api/Services/HueService.cs
- `DashboardBackgroundService` --references--> `MusicService`  [EXTRACTED]
  HomeDashboard.Api/BackgroundServices/DashboardBackgroundService.cs → HomeDashboard.Api/Services/MusicService.cs
- `DashboardBackgroundService` --references--> `PcService`  [EXTRACTED]
  HomeDashboard.Api/BackgroundServices/DashboardBackgroundService.cs → HomeDashboard.Api/Services/PcService.cs
- `DashboardBackgroundService` --references--> `SystemMonitorService`  [EXTRACTED]
  HomeDashboard.Api/BackgroundServices/DashboardBackgroundService.cs → HomeDashboard.Api/Services/SystemMonitorService.cs

## Import Cycles
- None detected.

## Communities (48 total, 14 thin omitted)

### Community 0 - "EnergyWidget.tsx"
Cohesion: 0.12
Nodes (46): Bar, BarChart(), Label(), Panel, Segmented(), AfvalWidget(), CalendarView(), ListView() (+38 more)

### Community 1 - "PcService"
Cohesion: 0.07
Nodes (14): PcController, AudioOutputDevice, PcStatus, AudioService, AgentPing, MediaCommandResult, PcService, AgentKey (+6 more)

### Community 2 - "package.json"
Cohesion: 0.05
Nodes (48): dependencies, class-variance-authority@^0.7.0, clsx@^2.1.1, @fontsource-variable/inter@^5.3.0, leaflet@^1.9.4, lucide-react@^0.441.0, motion@^14.12.0, react@^18.3.1 (+40 more)

### Community 3 - "Dashboard.tsx"
Cohesion: 0.05
Nodes (63): @microsoft/signalr@^8.0.7, App(), AuthGate(), AfvalWidget, AircoWidget, AmbientBackground, Clock(), ConnectionDot() (+55 more)

### Community 4 - "PlexService"
Cohesion: 0.09
Nodes (8): AfvalItem, PlexItem, PlexSession, PlexStats, AfvalService, PlexService, ServerUrl, Token

### Community 5 - "WeatherService"
Cohesion: 0.09
Nodes (7): DiskDriveInfo, SystemStats, DailyForecastItem, HourlyForecastItem, WeatherData, SystemMonitorService, WeatherService

### Community 6 - "server.mjs"
Cohesion: 0.09
Nodes (30): ring-client-api, dependencies, ring-client-api@14.3.0, description, name, private, scripts, start (+22 more)

### Community 7 - "GoogleHomeService"
Cohesion: 0.11
Nodes (7): DashboardAuth, Required, Stamp, GoogleHomeService, ClientId, ClientSecret, Enabled

### Community 8 - "SystemWidget.tsx"
Cohesion: 0.13
Nodes (31): ArcGauge(), ArcGaugeProps, SIZES, AnimatedNumber(), GAUGE_PX, GaugeSize, MiniSystem(), pickLayout() (+23 more)

### Community 9 - "IPolicyConfig"
Cohesion: 0.11
Nodes (5): ERole, eCommunications, eConsole, eMultimedia, IPolicyConfig

### Community 10 - "WeatherWidget.tsx"
Cohesion: 0.14
Nodes (24): CloudShape(), effectiveIcon(), RAIN, skyGradient(), SNOW, STARS, WeatherFx, WeatherIcon() (+16 more)

### Community 11 - "HueService"
Cohesion: 0.14
Nodes (4): HueController, HueLightStateRequest, HueService, BaseUrl

### Community 12 - "HomeDashboard.Api.Services"
Cohesion: 0.28
Nodes (3): HomeDashboard.Api.Services, HomeDashboard.Api.Controllers, SetDefaultRequest

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
Cohesion: 0.11
Nodes (5): DashboardBackgroundService, RingEventListener, DashboardHub, RingService, BridgeUrl

### Community 20 - "HomeDashboard.Api"
Cohesion: 0.15
Nodes (12): HomeDashboard.Agent, net8.0-windows10.0.19041.0, LibreHardwareMonitorLib (0.9.4), NAudio (2.2.1), Microsoft.NET.Sdk.Web, HomeDashboard.Api, net8.0-windows10.0.19041.0, LibreHardwareMonitorLib (0.9.4) (+4 more)

### Community 21 - "caddy"
Cohesion: 0.06
Nodes (30): build, environment, network_mode, profiles, restart, volumes, build, environment (+22 more)

### Community 27 - "HttpGet"
Cohesion: 0.10
Nodes (9): AfvalController, AudioController, AuthController, LoginRequest, EnergyController, PlexController, RingController, SystemController (+1 more)

### Community 28 - "FrankEnergieService"
Cohesion: 0.10
Nodes (11): EnergyMonthSummary, EnergyPrice, EnergyPrices, EnergyUsage, EnergyUsagePoint, DayData, FrankApiException, IsAuthError (+3 more)

### Community 29 - "AircoDevice.cs"
Cohesion: 0.22
Nodes (4): SetFanSpeedRequest, SetModeRequest, SetPowerRequest, SetTemperatureRequest

### Community 30 - "AircoService"
Cohesion: 0.14
Nodes (4): WasherController, WasherDevice, LgThinqClient, WasherService

### Community 32 - "HomeWidget.tsx"
Cohesion: 0.13
Nodes (28): AIRCO_VISIBLE_KEY, AircoTileConfig(), ENERGY_ITEMS, EnergyTileConfig(), HueTileConfig(), ItemPicker(), RingTileConfig(), SYSTEM_ITEMS (+20 more)

### Community 34 - "LgThinqOptions"
Cohesion: 0.33
Nodes (5): LgThinqOptions, BaseUrl, ClientId, CountryCode, PersonalAccessToken

### Community 37 - "react"
Cohesion: 0.17
Nodes (21): Dialog(), MiniRing(), pickVisible(), RING_VISIBLE_KEY, EventRow(), RingDetail(), RingSnapshot(), RingLogin() (+13 more)

### Community 38 - "AircoService"
Cohesion: 0.15
Nodes (3): AircoController, AircoDevice, AircoService

### Community 40 - "PlexWidget.tsx"
Cohesion: 0.22
Nodes (24): itemSubtitle(), itemTitle(), LiveCard(), MiniPlex(), PosterRow(), addedAgo(), PlexLink(), PlexPoster() (+16 more)

### Community 41 - "cn"
Cohesion: 0.20
Nodes (23): BrightnessSlider(), EmptyState(), Skeleton(), Toggle(), MiniAfval(), BulbBadge(), HUE_FAVORITE_KEY, MiniHue() (+15 more)

### Community 42 - "motion.tsx"
Cohesion: 0.22
Nodes (16): easeOutExpo, fadeUp, softSpring, spring, ArtBackdrop(), DeviceIcon(), Equalizer(), MiniMusic() (+8 more)

### Community 44 - "MiniAirco.tsx"
Cohesion: 0.30
Nodes (17): Press, ThermostatRing(), AircoSetupPrompt(), AircoWidget(), MiniAirco(), PowerButton(), TempStepper(), AIRCO_MODES (+9 more)

### Community 45 - "api.ts"
Cohesion: 0.14
Nodes (14): afvalApi, AfvalItem, DailyForecastItem, energyApi, EnergyPrices, EnergyUsage, EnergyUsagePoint, HueLight (+6 more)

### Community 46 - "MiniWeather.tsx"
Cohesion: 0.38
Nodes (8): MiniWeather(), uvColor(), uvLabel(), TileHeader(), useCompactColumns(), useContainerSize(), useIsMobile(), useMediaQuery()

### Community 47 - "HueLight.cs"
Cohesion: 0.25
Nodes (4): HueGroupActionRequest, HueLight, HueRoom, HueScene

## Knowledge Gaps
- **28 isolated node(s):** `net8.0-windows10.0.19041.0`, `LibreHardwareMonitorLib (0.9.4)`, `NAudio (2.2.1)`, `Microsoft.NET.Sdk.Web`, `net8.0-windows10.0.19041.0` (+23 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 284 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `GoogleHomeService` connect `GoogleHomeService` to `HomeDashboard.Agent/Program.cs`, `GoogleHomeController`, `PlexService`, `DashboardBackgroundService`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **What connects `net8.0-windows10.0.19041.0`, `LibreHardwareMonitorLib (0.9.4)`, `NAudio (2.2.1)` to the rest of the system?**
  _28 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `EnergyWidget.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12368024132730016 - nodes in this community are weakly interconnected._
- **Why does `FrankEnergieService` connect `FrankEnergieService` to `HomeDashboard.Agent/Program.cs`, `PlexService`, `GoogleHomeService`, `HueService`, `DashboardBackgroundService`, `HttpGet`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Should `PcService` be split into smaller, more focused modules?**
  _Cohesion score 0.06976744186046512 - nodes in this community are weakly interconnected._
- **Why does `HomeDashboard.Api.Services` connect `HomeDashboard.Api.Services` to `HomeDashboard.Agent/Program.cs`, `LgThinqOptions`, `PcService.cs`, `IPolicyConfig`, `DashboardBackgroundService.cs`, `AuthController.cs`, `MusicService.cs`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.05333333333333334 - nodes in this community are weakly interconnected._