# Graph Report - HomeDashboard  (2026-11-11)

## Corpus Check
- 145 files · ~70,949 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 41 file(s) not represented in the graph (top: .dll 23, (none) 7, .bat 2)
- WARNING: 41 of 188 files seen (22%) have no supported extractor and are missing from this graph entirely. It may look complete while representing only part of the codebase.

## Summary
- 1386 nodes · 4045 edges · 67 communities (49 shown, 18 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 111 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e876a4f2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- EnergyWidget.tsx
- PcService
- frontend/package.json
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
- WasherService
- CLAUDE.md
- HomeWidget.tsx
- HomeDashboard.Agent/Program.cs
- LgThinqClient
- HttpPost
- PcService.cs
- react
- AircoService
- MusicService
- PlexWidget.tsx
- cn
- cn
- MiniAirco.tsx
- api.ts
- MiniWeather.tsx
- Task
- IActionResult
- CalendarWidget.tsx
- TravelService
- EmptyState
- JsonElement
- ServerStatusService
- TravelService.cs
- dependencies
- HomeWidget
- CalendarService
- AfvalService
- StationRef
- AuthController
- main.tsx
- PcService.GetMediaAsync
- vite.config.ts
- scripts
- leaflet

## God Nodes (most connected - your core abstractions)
1. `cn()` - 100 edges
2. `useLocalStorage()` - 52 edges
3. `react` - 50 edges
4. `TravelService` - 48 edges
5. `Skeleton()` - 47 edges
6. `Panel` - 44 edges
7. `HomeDashboard.Api.Services` - 42 edges
8. `SpotifyService` - 42 edges
9. `lucide-react` - 39 edges
10. `EmptyState()` - 37 edges

## Surprising Connections (you probably didn't know these)
- `CalendarController` --references--> `CalendarService`  [EXTRACTED]
  HomeDashboard.Api/Controllers/CalendarController.cs → HomeDashboard.Api/Services/CalendarService.cs
- `ServerController` --references--> `ServerStatusService`  [EXTRACTED]
  HomeDashboard.Api/Controllers/ServerController.cs → HomeDashboard.Api/Services/ServerStatusService.cs
- `SpotifyController` --references--> `SpotifyService`  [EXTRACTED]
  HomeDashboard.Api/Controllers/SpotifyController.cs → HomeDashboard.Api/Services/SpotifyService.cs
- `TravelController` --references--> `TravelService`  [EXTRACTED]
  HomeDashboard.Api/Controllers/TravelController.cs → HomeDashboard.Api/Services/TravelService.cs
- `NavTabs()` --calls--> `cn()`  [EXTRACTED]
  frontend/src/components/Dashboard.tsx → frontend/src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (67 total, 18 thin omitted)

### Community 0 - "EnergyWidget.tsx"
Cohesion: 0.23
Nodes (27): Bar, BarChart(), EnergyWidget(), priceBars(), PriceChart(), Stat(), usageBars(), UsageSection() (+19 more)

### Community 1 - "PcService"
Cohesion: 0.08
Nodes (13): AudioController, PcController, AudioService, AgentPing, MediaCommandResult, PcService, AgentKey, AgentUrl (+5 more)

### Community 2 - "frontend/package.json"
Cohesion: 0.14
Nodes (19): devDependencies, autoprefixer@^10.4.20, postcss@^8.4.45, tailwindcss@^3.4.11, @types/node@^20.0.0, @types/react@^18.3.5, @types/react-dom@^18.3.0, typescript@^5.5.3 (+11 more)

### Community 3 - "Dashboard.tsx"
Cohesion: 0.06
Nodes (63): App(), AuthGate(), AfvalWidget, AircoWidget, AmbientBackground, CalendarWidget, Clock(), ConnectionDot() (+55 more)

### Community 4 - "PlexService"
Cohesion: 0.15
Nodes (6): PlexItem, PlexSession, PlexStats, PlexService, ServerUrl, Token

### Community 5 - "WeatherService"
Cohesion: 0.16
Nodes (3): DiskDriveInfo, SystemStats, SystemMonitorService

### Community 6 - "server.mjs"
Cohesion: 0.09
Nodes (32): ring-client-api, dependencies, ring-client-api@14.3.0, description, name, private, scripts, start (+24 more)

### Community 7 - "GoogleHomeService"
Cohesion: 0.11
Nodes (7): DashboardAuth, Required, Stamp, GoogleHomeService, ClientId, ClientSecret, Enabled

### Community 8 - "SystemWidget.tsx"
Cohesion: 0.11
Nodes (37): ArcGauge(), ArcGaugeProps, SIZES, AnimatedNumber(), Skeleton(), GAUGE_PX, GaugeSize, MiniSystem() (+29 more)

### Community 9 - "IPolicyConfig"
Cohesion: 0.11
Nodes (5): ERole, eCommunications, eConsole, eMultimedia, IPolicyConfig

### Community 10 - "WeatherWidget.tsx"
Cohesion: 0.14
Nodes (24): CloudShape(), effectiveIcon(), RAIN, skyGradient(), SNOW, STARS, WeatherFx, WeatherIcon() (+16 more)

### Community 11 - "HueService"
Cohesion: 0.15
Nodes (7): HueGroupActionRequest, HueLight, HueLightStateRequest, HueRoom, HueScene, HueService, BaseUrl

### Community 12 - "HomeDashboard.Api.Services"
Cohesion: 0.24
Nodes (3): HomeDashboard.Api.Services, HomeDashboard.Api.Controllers, SetDefaultRequest

### Community 13 - "DashboardBackgroundService.cs"
Cohesion: 0.24
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
Cohesion: 0.15
Nodes (4): DashboardBackgroundService, RingEventListener, RingService, BridgeUrl

### Community 20 - "HomeDashboard.Api"
Cohesion: 0.14
Nodes (12): net8.0-windows10.0.19041.0, HomeDashboard.Agent, net8.0-windows10.0.19041.0, LibreHardwareMonitorLib (0.9.4), NAudio (2.2.1), Microsoft.NET.Sdk.Web, Ical.Net (4.3.1), LibreHardwareMonitorLib (0.9.4) (+4 more)

### Community 21 - "caddy"
Cohesion: 0.06
Nodes (30): build, environment, network_mode, profiles, restart, volumes, build, environment (+22 more)

### Community 27 - "HttpGet"
Cohesion: 0.06
Nodes (10): AfvalController, CalendarController, EnergyController, HueController, PlexController, ServerController, SystemController, TravelController (+2 more)

### Community 28 - "FrankEnergieService"
Cohesion: 0.10
Nodes (11): EnergyMonthSummary, EnergyPrice, EnergyPrices, EnergyUsage, EnergyUsagePoint, DayData, FrankApiException, IsAuthError (+3 more)

### Community 29 - "AircoDevice.cs"
Cohesion: 0.22
Nodes (4): SetFanSpeedRequest, SetModeRequest, SetPowerRequest, SetTemperatureRequest

### Community 30 - "WasherService"
Cohesion: 0.19
Nodes (3): AircoDevice, WasherDevice, WasherService

### Community 32 - "HomeWidget.tsx"
Cohesion: 0.10
Nodes (33): fadeUp, AIRCO_VISIBLE_KEY, AircoTileConfig(), CalendarTileConfig(), ENERGY_ITEMS, EnergyTileConfig(), HUE_VISIBLE_KEY, HueTileConfig() (+25 more)

### Community 34 - "LgThinqClient"
Cohesion: 0.19
Nodes (6): LgThinqClient, LgThinqOptions, BaseUrl, ClientId, CountryCode, PersonalAccessToken

### Community 36 - "PcService.cs"
Cohesion: 0.12
Nodes (3): HomeDashboard.Api.Models, AudioOutputDevice, PcStatus

### Community 37 - "react"
Cohesion: 0.10
Nodes (39): MiniRing(), DoorbellAlert(), playChime(), EventRow(), RingDetail(), RingSnapshot(), RingLogin(), dayHeading() (+31 more)

### Community 40 - "PlexWidget.tsx"
Cohesion: 0.20
Nodes (26): easeOutExpo, itemSubtitle(), itemTitle(), LiveCard(), MiniPlex(), PosterRow(), addedAgo(), PlexLink() (+18 more)

### Community 41 - "cn"
Cohesion: 0.22
Nodes (18): BrightnessSlider(), Toggle(), BulbBadge(), HUE_FAVORITE_KEY, MiniHue(), SceneChips(), pickVisible(), HueWidget() (+10 more)

### Community 42 - "cn"
Cohesion: 0.17
Nodes (27): Dialog(), Panel, ArtBackdrop(), DeviceIcon(), Equalizer(), MiniMusic(), shortDeviceName(), useMusicControls() (+19 more)

### Community 44 - "MiniAirco.tsx"
Cohesion: 0.25
Nodes (20): Press, softSpring, spring, ThermostatRing(), AircoSetupPrompt(), AircoWidget(), MiniAirco(), PowerButton() (+12 more)

### Community 45 - "api.ts"
Cohesion: 0.08
Nodes (25): CalendarData, CalendarInfo, CarRoute, DiskDriveInfo, energyApi, EnergyPrices, EnergyUsage, EnergyUsagePoint (+17 more)

### Community 46 - "MiniWeather.tsx"
Cohesion: 0.35
Nodes (9): MiniAfval(), MiniWeather(), uvColor(), uvLabel(), TileHeader(), useCompactColumns(), useContainerSize(), useIsMobile() (+1 more)

### Community 47 - "Task"
Cohesion: 0.10
Nodes (13): SpotifyDevice, SpotifyException, Status, SpotifyItem, SpotifyPlayback, SpotifyService, ClientId, ClientSecret (+5 more)

### Community 48 - "IActionResult"
Cohesion: 0.09
Nodes (5): AircoController, CodeBody, PlayBody, SpotifyController, TransferBody

### Community 49 - "CalendarWidget.tsx"
Cohesion: 0.13
Nodes (39): AfvalWidget(), CalendarView(), ListView(), NextCollection(), View, CalendarWidget(), EventRow(), ListView() (+31 more)

### Community 50 - "TravelService"
Cohesion: 0.11
Nodes (16): CarRoute, TravelService, CarCacheFor, CarConfigured, EnvHomeStation, EnvWorkStation, GoogleKey, Home (+8 more)

### Community 51 - "EmptyState"
Cohesion: 0.26
Nodes (19): EmptyState(), Label(), Segmented(), MiniTravel(), TrainRow(), CarPanel(), crowdLabel, TrainPanel() (+11 more)

### Community 52 - "JsonElement"
Cohesion: 0.20
Nodes (4): DailyForecastItem, HourlyForecastItem, WeatherData, WeatherService

### Community 53 - "ServerStatusService"
Cohesion: 0.21
Nodes (6): ContainerInfo, DockerInfo, ServerStatus, ServerStatusService, Docker, SocketPath

### Community 54 - "TravelService.cs"
Cohesion: 0.18
Nodes (3): TrainLeg, TrainTrip, TravelResponse

### Community 55 - "dependencies"
Cohesion: 0.12
Nodes (16): dependencies, class-variance-authority@^0.7.0, clsx@^2.1.1, lucide-react@^0.441.0, @microsoft/signalr@^8.0.7, motion@^14.12.0, react@^18.3.1, tailwind-merge@^2.5.2 (+8 more)

### Community 56 - "HomeWidget"
Cohesion: 0.23
Nodes (16): ConfigSheet(), DragOverlay(), HomeWidget(), buildRows(), computeCompactDrop(), computeDrop(), moveWidget(), renderCell() (+8 more)

### Community 57 - "CalendarService"
Cohesion: 0.23
Nodes (5): CalendarEventDto, CalendarInfo, CalendarResponse, CalendarService, Urls

### Community 59 - "StationRef"
Cohesion: 0.24
Nodes (5): StationsBody, StationRef, StationSettings, Stations, TravelSettingsDto

### Community 61 - "main.tsx"
Cohesion: 0.29
Nodes (5): @fontsource-variable/inter@^5.3.0, react-dom@^18.3.1, blockTouchContextMenu(), @fontsource-variable/inter, react-dom

### Community 63 - "vite.config.ts"
Cohesion: 0.33
Nodes (4): vite@^5.4.2, @vitejs/plugin-react@^4.3.1, vite, @vitejs/plugin-react

### Community 65 - "scripts"
Cohesion: 0.50
Nodes (4): scripts, build, dev, preview

## Knowledge Gaps
- **53 isolated node(s):** `net8.0-windows10.0.19041.0`, `Ical.Net (4.3.1)`, `Microsoft.AspNetCore.OpenApi (8.0.0)`, `Swashbuckle.AspNetCore (6.6.2)`, `LibreHardwareMonitorLib (0.9.4)` (+48 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 346 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `TravelService` connect `TravelService` to `HttpPost`, `PlexService`, `WeatherService`, `HttpGet`, `DashboardBackgroundService`, `TravelService.cs`, `CalendarService`, `AfvalService`, `StationRef`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **What connects `net8.0-windows10.0.19041.0`, `Ical.Net (4.3.1)`, `Microsoft.AspNetCore.OpenApi (8.0.0)` to the rest of the system?**
  _53 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `PcService` be split into smaller, more focused modules?**
  _Cohesion score 0.08076923076923077 - nodes in this community are weakly interconnected._
- **Why does `HomeDashboard.Api.Services` connect `HomeDashboard.Api.Services` to `HomeDashboard.Agent/Program.cs`, `LgThinqClient`, `PcService.cs`, `IPolicyConfig`, `DashboardBackgroundService.cs`, `AuthController.cs`, `ServerStatusService`, `TravelService.cs`, `CalendarService`, `MusicService.cs`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Should `frontend/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.1368421052631579 - nodes in this community are weakly interconnected._
- **Why does `FrankEnergieService` connect `FrankEnergieService` to `PcService.cs`, `GoogleHomeService`, `DashboardBackgroundService`, `CalendarService`, `AfvalService`, `HttpGet`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Should `Dashboard.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05745814307458143 - nodes in this community are weakly interconnected._