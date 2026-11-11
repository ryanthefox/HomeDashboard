# Graph Report - HomeDashboard  (2026-11-11)

## Corpus Check
- 151 files · ~77,338 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 41 file(s) not represented in the graph (top: .dll 23, (none) 7, .bat 2)
- WARNING: 41 of 194 files seen (21%) have no supported extractor and are missing from this graph entirely. It may look complete while representing only part of the codebase.

## Summary
- 1447 nodes · 4258 edges · 72 communities (51 shown, 21 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 112 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0bb8657f`
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
- AircoService
- SpotifyService.cs
- CLAUDE.md
- HomeWidget.tsx
- HomeDashboard.Agent/Program.cs
- JsonElement
- HttpPost
- PcService.cs
- react
- useSignalR.ts
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
- App.tsx
- dependencies
- HomeWidget
- CalendarService
- AfvalService
- spotifyPlayer.ts
- HttpPost
- main.tsx
- PcService.GetMediaAsync
- vite.config.ts
- LoginScreen.tsx
- scripts
- homeScreens.ts
- apiFetch
- SystemStats
- swipe.ts
- @tanstack/react-query-devtools
- SetDefaultRequest

## God Nodes (most connected - your core abstractions)
1. `cn()` - 109 edges
2. `useLocalStorage()` - 56 edges
3. `react` - 55 edges
4. `SpotifyService` - 48 edges
5. `TravelService` - 48 edges
6. `Skeleton()` - 47 edges
7. `Panel` - 45 edges
8. `lucide-react` - 43 edges
9. `HomeDashboard.Api.Services` - 42 edges
10. `EmptyState()` - 38 edges

## Surprising Connections (you probably didn't know these)
- `SpotifyController` --references--> `SpotifyService`  [EXTRACTED]
  HomeDashboard.Api/Controllers/SpotifyController.cs → HomeDashboard.Api/Services/SpotifyService.cs
- `ConnectionDot()` --calls--> `useConnectionState()`  [EXTRACTED]
  frontend/src/components/Dashboard.tsx → frontend/src/hooks/useSignalR.ts
- `NavTabs()` --calls--> `cn()`  [EXTRACTED]
  frontend/src/components/Dashboard.tsx → frontend/src/lib/utils.ts
- `AuthGate()` --calls--> `Dashboard()`  [EXTRACTED]
  frontend/src/App.tsx → frontend/src/components/Dashboard.tsx
- `Dashboard()` --calls--> `HomeWidget()`  [EXTRACTED]
  frontend/src/components/Dashboard.tsx → frontend/src/components/widgets/HomeWidget.tsx

## Import Cycles
- 2-file cycle: `frontend/src/components/widgets/home/MiniMusic.tsx -> frontend/src/components/widgets/music/MiniSpotify.tsx -> frontend/src/components/widgets/home/MiniMusic.tsx`
- 3-file cycle: `frontend/src/components/widgets/home/MiniMusic.tsx -> frontend/src/components/widgets/music/MiniSpotify.tsx -> frontend/src/components/widgets/music/SpotifyView.tsx -> frontend/src/components/widgets/home/MiniMusic.tsx`

## Communities (72 total, 21 thin omitted)

### Community 0 - "EnergyWidget.tsx"
Cohesion: 0.26
Nodes (25): Bar, BarChart(), EnergyWidget(), priceBars(), PriceChart(), Stat(), usageBars(), UsageSection() (+17 more)

### Community 1 - "PcService"
Cohesion: 0.07
Nodes (15): AudioController, PcController, AudioOutputDevice, PcStatus, AudioService, AgentPing, MediaCommandResult, PcService (+7 more)

### Community 2 - "frontend/package.json"
Cohesion: 0.14
Nodes (19): devDependencies, autoprefixer@^10.4.20, postcss@^8.4.45, tailwindcss@^3.4.11, @types/node@^20.0.0, @types/react@^18.3.5, @types/react-dom@^18.3.0, typescript@^5.5.3 (+11 more)

### Community 3 - "Dashboard.tsx"
Cohesion: 0.12
Nodes (29): AfvalWidget, AircoWidget, CalendarWidget, Clock(), ConnectionDot(), Dashboard(), EnergyWidget, fsDoc (+21 more)

### Community 4 - "PlexService"
Cohesion: 0.14
Nodes (6): PlexItem, PlexSession, PlexStats, PlexService, ServerUrl, Token

### Community 6 - "server.mjs"
Cohesion: 0.09
Nodes (32): ring-client-api, dependencies, ring-client-api@14.3.0, description, name, private, scripts, start (+24 more)

### Community 7 - "GoogleHomeService"
Cohesion: 0.11
Nodes (7): DashboardAuth, Required, Stamp, GoogleHomeService, ClientId, ClientSecret, Enabled

### Community 8 - "SystemWidget.tsx"
Cohesion: 0.11
Nodes (36): ArcGauge(), ArcGaugeProps, SIZES, AnimatedNumber(), GAUGE_PX, GaugeSize, MiniSystem(), pickLayout() (+28 more)

### Community 9 - "IPolicyConfig"
Cohesion: 0.11
Nodes (5): ERole, eCommunications, eConsole, eMultimedia, IPolicyConfig

### Community 10 - "WeatherWidget.tsx"
Cohesion: 0.14
Nodes (23): CloudShape(), effectiveIcon(), RAIN, skyGradient(), SNOW, STARS, WeatherFx, WeatherIcon() (+15 more)

### Community 11 - "HueService"
Cohesion: 0.11
Nodes (8): HueController, HueGroupActionRequest, HueLight, HueLightStateRequest, HueRoom, HueScene, HueService, BaseUrl

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

### Community 20 - "HomeDashboard.Api"
Cohesion: 0.14
Nodes (12): net8.0-windows10.0.19041.0, HomeDashboard.Agent, net8.0-windows10.0.19041.0, LibreHardwareMonitorLib (0.9.4), NAudio (2.2.1), Microsoft.NET.Sdk.Web, Ical.Net (4.3.1), LibreHardwareMonitorLib (0.9.4) (+4 more)

### Community 21 - "caddy"
Cohesion: 0.06
Nodes (30): build, environment, network_mode, profiles, restart, volumes, build, environment (+22 more)

### Community 27 - "HttpGet"
Cohesion: 0.08
Nodes (8): AfvalController, CalendarController, EnergyController, PlexController, ServerController, SystemController, TravelController, WeatherController

### Community 28 - "FrankEnergieService"
Cohesion: 0.10
Nodes (11): EnergyMonthSummary, EnergyPrice, EnergyPrices, EnergyUsage, EnergyUsagePoint, DayData, FrankApiException, IsAuthError (+3 more)

### Community 29 - "AircoService"
Cohesion: 0.11
Nodes (7): AircoController, AircoDevice, SetFanSpeedRequest, SetModeRequest, SetPowerRequest, SetTemperatureRequest, AircoService

### Community 30 - "SpotifyService.cs"
Cohesion: 0.17
Nodes (5): SpotifyDevice, SpotifyItem, SpotifyPlayback, SpotifyStatus, SpotifyTrack

### Community 32 - "HomeWidget.tsx"
Cohesion: 0.09
Nodes (35): fadeUp, softSpring, AIRCO_VISIBLE_KEY, AircoTileConfig(), CalendarTileConfig(), ENERGY_ITEMS, ENERGY_VISIBLE_KEY, EnergyItem (+27 more)

### Community 34 - "JsonElement"
Cohesion: 0.11
Nodes (9): WasherController, WasherDevice, LgThinqClient, LgThinqOptions, BaseUrl, ClientId, CountryCode, PersonalAccessToken (+1 more)

### Community 37 - "react"
Cohesion: 0.11
Nodes (37): Dialog(), Label(), MiniRing(), DoorbellAlert(), playChime(), EventRow(), RingDetail(), RingSnapshot() (+29 more)

### Community 38 - "useSignalR.ts"
Cohesion: 0.22
Nodes (14): @microsoft/signalr@^8.0.7, useConnectionState(), useSignalR(), MediaInfo, WeatherData, emitRingEvent(), connection, getConnectionState() (+6 more)

### Community 40 - "PlexWidget.tsx"
Cohesion: 0.22
Nodes (24): itemSubtitle(), itemTitle(), LiveCard(), MiniPlex(), PosterRow(), addedAgo(), PlexLink(), PlexPoster() (+16 more)

### Community 41 - "cn"
Cohesion: 0.19
Nodes (21): BrightnessSlider(), Toggle(), BulbBadge(), HUE_FAVORITE_KEY, MiniHue(), SceneChips(), HueWidget(), LightRow() (+13 more)

### Community 42 - "cn"
Cohesion: 0.13
Nodes (44): Press, spring, ArtBackdrop(), DeviceIcon(), Equalizer(), MiniMusic(), MiniPcMusic(), MusicSourceSwitch() (+36 more)

### Community 44 - "MiniAirco.tsx"
Cohesion: 0.28
Nodes (17): ThermostatRing(), AircoSetupPrompt(), AircoWidget(), MiniAirco(), PowerButton(), TempStepper(), pickVisible(), AIRCO_MODES (+9 more)

### Community 45 - "api.ts"
Cohesion: 0.08
Nodes (23): CalendarData, CalendarInfo, CarRoute, DiskDriveInfo, energyApi, EnergyPrices, EnergyUsage, EnergyUsagePoint (+15 more)

### Community 46 - "MiniWeather.tsx"
Cohesion: 0.22
Nodes (15): Skeleton(), WeatherIllustration(), MiniAfval(), MiniWeather(), uvColor(), uvLabel(), goToTab(), NAVIGATE_EVENT (+7 more)

### Community 47 - "Task"
Cohesion: 0.09
Nodes (13): SpotifyException, Status, SpotifyService, CanStream, ClientId, ClientSecret, Configured, GrantedScope (+5 more)

### Community 48 - "IActionResult"
Cohesion: 0.12
Nodes (4): CodeBody, PlayBody, SpotifyController, TransferBody

### Community 49 - "CalendarWidget.tsx"
Cohesion: 0.14
Nodes (40): Panel, AfvalWidget(), CalendarView(), ListView(), NextCollection(), View, CalendarWidget(), EventRow() (+32 more)

### Community 50 - "TravelService"
Cohesion: 0.07
Nodes (24): StationsBody, CarRoute, StationRef, StationSettings, TrainLeg, TrainTrip, TravelResponse, TravelService (+16 more)

### Community 51 - "EmptyState"
Cohesion: 0.27
Nodes (18): EmptyState(), Segmented(), MiniTravel(), TrainRow(), CarPanel(), crowdLabel, TrainPanel(), TravelWidget() (+10 more)

### Community 52 - "JsonElement"
Cohesion: 0.22
Nodes (4): DailyForecastItem, HourlyForecastItem, WeatherData, WeatherService

### Community 53 - "ServerStatusService"
Cohesion: 0.21
Nodes (6): ContainerInfo, DockerInfo, ServerStatus, ServerStatusService, Docker, SocketPath

### Community 54 - "App.tsx"
Cohesion: 0.25
Nodes (11): App(), AuthGate(), KEY, useAuth(), authApi, AuthStatus, onAuthRequired(), UnauthorizedError (+3 more)

### Community 55 - "dependencies"
Cohesion: 0.13
Nodes (15): dependencies, class-variance-authority@^0.7.0, clsx@^2.1.1, leaflet@^1.9.4, lucide-react@^0.441.0, motion@^14.12.0, react@^18.3.1, tailwind-merge@^2.5.2 (+7 more)

### Community 56 - "HomeWidget"
Cohesion: 0.20
Nodes (18): entranceInitial(), ConfigSheet(), DragOverlay(), HomeWidget(), buildRows(), computeCompactDrop(), computeDrop(), moveWidget() (+10 more)

### Community 57 - "CalendarService"
Cohesion: 0.17
Nodes (7): CalendarEventDto, CalendarInfo, CalendarResponse, CalendarService, Urls, RingService, BridgeUrl

### Community 59 - "spotifyPlayer.ts"
Cohesion: 0.15
Nodes (10): browserPlaybackBlocker(), BrowserPlayerState, BrowserPlayerStatus, deviceName(), listeners, loadSdk(), SdkPlayer, startBrowserPlayer() (+2 more)

### Community 60 - "HttpPost"
Cohesion: 0.19
Nodes (3): AuthController, LoginRequest, MusicController

### Community 61 - "main.tsx"
Cohesion: 0.29
Nodes (5): @fontsource-variable/inter@^5.3.0, react-dom@^18.3.1, blockTouchContextMenu(), @fontsource-variable/inter, react-dom

### Community 63 - "vite.config.ts"
Cohesion: 0.33
Nodes (4): vite@^5.4.2, @vitejs/plugin-react@^4.3.1, vite, @vitejs/plugin-react

### Community 64 - "LoginScreen.tsx"
Cohesion: 0.27
Nodes (9): AmbientBackground, LoginScreen(), submit(), easeOutExpo, login(), Theme, ThemeCtx, ThemeCtxValue (+1 more)

### Community 65 - "scripts"
Cohesion: 0.50
Nodes (4): scripts, build, dev, preview

### Community 66 - "homeScreens.ts"
Cohesion: 0.29
Nodes (7): deleteScreenStorage(), EMPTY_SCREEN_LAYOUT, MAX_SCREENS, PER_SCREEN, SCREEN_KEY, screenKey(), SCREENS_KEY

### Community 67 - "apiFetch"
Cohesion: 0.33
Nodes (6): apiFetch(), json(), ringJson(), send(), spotifyCall(), notifyAuthRequired()

### Community 69 - "swipe.ts"
Cohesion: 0.67
Nodes (3): handlesHorizontal(), SwipeOptions, useSwipeNavigation()

## Knowledge Gaps
- **57 isolated node(s):** `ClientId`, `ClientSecret`, `RedirectUri`, `Configured`, `HttpsUrl` (+52 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 365 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `HomeDashboard.Api.Services` connect `HomeDashboard.Api.Services` to `HomeDashboard.Agent/Program.cs`, `JsonElement`, `PcService.cs`, `IPolicyConfig`, `DashboardBackgroundService.cs`, `AuthController.cs`, `TravelService`, `ServerStatusService`, `CalendarService`, `MusicService.cs`, `SpotifyService.cs`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **What connects `ClientId`, `ClientSecret`, `RedirectUri` to the rest of the system?**
  _57 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `PcService` be split into smaller, more focused modules?**
  _Cohesion score 0.06859903381642513 - nodes in this community are weakly interconnected._
- **Why does `TravelService` connect `TravelService` to `PcService`, `HttpPost`, `PlexService`, `WeatherService`, `DashboardBackgroundService`, `CalendarService`, `AfvalService`, `HttpGet`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Should `frontend/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.1368421052631579 - nodes in this community are weakly interconnected._
- **Why does `react` connect `react` to `EnergyWidget.tsx`, `frontend/package.json`, `Dashboard.tsx`, `SystemWidget.tsx`, `WeatherWidget.tsx`, `HomeWidget.tsx`, `useSignalR.ts`, `PlexWidget.tsx`, `cn`, `cn`, `MiniAirco.tsx`, `MiniWeather.tsx`, `CalendarWidget.tsx`, `EmptyState`, `App.tsx`, `dependencies`, `spotifyPlayer.ts`, `main.tsx`, `LoginScreen.tsx`, `swipe.ts`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Should `Dashboard.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11724137931034483 - nodes in this community are weakly interconnected._