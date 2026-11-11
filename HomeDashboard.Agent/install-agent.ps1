<#
  Installeert (of werkt bij) de HomeDashboard PC-agent.

  Uitvoeren in een PowerShell-venster als administrator:
      powershell -ExecutionPolicy Bypass -File .\HomeDashboard.Agent\install-agent.ps1 -SetupWakeOnLan

  Wat het doet:
    1. Bouwt de agent naar C:\Program Files\HomeDashboardAgent
    2. Opent poort 5055 in de Windows-firewall, alleen voor je thuisnetwerk
    3. Maakt twee geplande taken:
       - "HomeDashboard Agent": stats + aan/uit, start bij het opstarten van Windows als SYSTEM
         (temperaturen uitlezen, en werkt al voordat je inlogt)
       - "HomeDashboard Agent Media": wat er nu speelt + bediening, start bij het inloggen onder
         jouw account (Windows laat media alleen aan de ingelogde gebruiker zien), poort 5056
    4. -SetupWakeOnLan: zet "Snel opstarten" uit en Wake-on-LAN aan op je netwerkkaart
    5. Toont de regels die je in .env op de server zet
#>
param(
    [int]    $Port = 5055,
    [string] $InstallDir = "$env:ProgramFiles\HomeDashboardAgent",
    [switch] $SetupWakeOnLan
)

$ErrorActionPreference = 'Stop'
$TaskName      = 'HomeDashboard Agent'
$MediaTaskName = 'HomeDashboard Agent Media'
$LockTaskName  = 'HomeDashboard Vergrendelen'
$MediaPort     = $Port + 1

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) { throw 'Start PowerShell als administrator en voer dit script opnieuw uit.' }

Write-Host "`n[1/4] Agent stoppen (als die al draait)..." -ForegroundColor Cyan
foreach ($t in @($TaskName, $MediaTaskName)) {
    if (Get-ScheduledTask -TaskName $t -ErrorAction SilentlyContinue) { Stop-ScheduledTask -TaskName $t }
}
Get-Process HomeDashboardAgent -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 1

Write-Host "[2/4] Agent bouwen naar $InstallDir ..." -ForegroundColor Cyan
$project = Join-Path $PSScriptRoot 'HomeDashboard.Agent.csproj'
# Keep an existing agent.key / appsettings.json so the server keeps working after an update
$keepSettings = Join-Path $InstallDir 'appsettings.json'
$backup = $null
if (Test-Path $keepSettings) { $backup = Get-Content $keepSettings -Raw }
dotnet publish $project -c Release -r win-x64 --self-contained true -o $InstallDir --nologo -v quiet
if ($LASTEXITCODE -ne 0) { throw 'dotnet publish mislukt.' }
if ($backup) { Set-Content -Path $keepSettings -Value $backup -Encoding utf8 }
else {
    $cfg = Get-Content $keepSettings -Raw | ConvertFrom-Json
    $cfg.Agent.Port = $Port
    $cfg | ConvertTo-Json -Depth 5 | Set-Content -Path $keepSettings -Encoding utf8
}

Write-Host "[3/4] Firewall en opstarttaak instellen..." -ForegroundColor Cyan
$ruleName = 'HomeDashboard Agent'
Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue | Remove-NetFirewallRule
New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Protocol TCP -LocalPort $Port, $MediaPort `
    -RemoteAddress LocalSubnet -Action Allow -Profile Any | Out-Null

$exe       = Join-Path $InstallDir 'HomeDashboardAgent.exe'
$action    = New-ScheduledTaskAction -Execute $exe -WorkingDirectory $InstallDir
$trigger   = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest
$settings  = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
    -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 5 -RestartInterval (New-TimeSpan -Minutes 1) -StartWhenAvailable
Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Principal $principal `
    -Settings $settings -Force | Out-Null
Start-ScheduledTask -TaskName $TaskName

if ($SetupWakeOnLan) {
    Write-Host "[extra] Wake-on-LAN voorbereiden..." -ForegroundColor Cyan
    # Fast Startup puts the PC in a hybrid hibernate state where most network cards ignore WoL
    Set-ItemProperty 'HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager\Power' -Name HiberbootEnabled -Value 0
    Write-Host "  Snel opstarten uitgezet"
    $nic = Get-NetAdapter -Physical | Where-Object { $_.Status -eq 'Up' -and $_.MediaType -eq '802.3' } | Select-Object -First 1
    if ($nic) {
        try { Set-NetAdapterPowerManagement -Name $nic.Name -WakeOnMagicPacket Enabled -ErrorAction Stop; Write-Host "  Wake on Magic Packet aan voor $($nic.Name)" }
        catch { Write-Host "  Kon Wake on Magic Packet niet automatisch aanzetten: doe dit in Apparaatbeheer > $($nic.InterfaceDescription) > Energiebeheer" -ForegroundColor Yellow }
        Get-NetAdapterAdvancedProperty -Name $nic.Name -ErrorAction SilentlyContinue |
            Where-Object { $_.DisplayName -match 'Wake on Magic Packet|Magic Packet|Shutdown Wake' } |
            ForEach-Object {
                $on = $_.ValidDisplayValues | Where-Object { $_ -match '^(Enabled|Ingeschakeld|On)$' } | Select-Object -First 1
                if ($on) { Set-NetAdapterAdvancedProperty -Name $nic.Name -DisplayName $_.DisplayName -DisplayValue $on; Write-Host "  $($_.DisplayName): $on" }
            }
    }
    Write-Host "  Vergeet niet Wake-on-LAN ook in je BIOS aan te zetten." -ForegroundColor Yellow
}

Write-Host "[4/4] Controleren..." -ForegroundColor Cyan
$keyFile = Join-Path $InstallDir 'agent.key'
$key = $null
for ($i = 0; $i -lt 15 -and -not $key; $i++) {
    Start-Sleep -Seconds 1
    $configured = (Get-Content $keepSettings -Raw | ConvertFrom-Json).Agent.Key
    if ($configured) { $key = $configured } elseif (Test-Path $keyFile) { $key = (Get-Content $keyFile -Raw).Trim() }
}
if (-not $key) { throw 'De agent is niet gestart (geen agent.key aangemaakt). Kijk in Taakplanner bij "HomeDashboard Agent".' }

try {
    $ping = Invoke-RestMethod "http://localhost:$Port/ping" -Headers @{ 'X-Agent-Key' = $key } -TimeoutSec 10
    Write-Host "  Agent draait op $($ping.hostname)" -ForegroundColor Green
} catch { Write-Host "  Agent reageert (nog) niet: $($_.Exception.Message)" -ForegroundColor Yellow }

# Media helper: runs as the user who installs this (the account you watch/listen on)
$user = (Get-CimInstance Win32_ComputerSystem).UserName
if (-not $user) { $user = "$env:USERDOMAIN\$env:USERNAME" }
$mediaAction    = New-ScheduledTaskAction -Execute $exe -Argument '--media' -WorkingDirectory $InstallDir
$mediaTrigger   = New-ScheduledTaskTrigger -AtLogOn -User $user
$mediaPrincipal = New-ScheduledTaskPrincipal -UserId $user -LogonType Interactive -RunLevel Limited
Register-ScheduledTask -TaskName $MediaTaskName -Action $mediaAction -Trigger $mediaTrigger -Principal $mediaPrincipal `
    -Settings $settings -Force | Out-Null
Start-ScheduledTask -TaskName $MediaTaskName
Start-Sleep -Seconds 3
try {
    $media = Invoke-RestMethod "http://localhost:$MediaPort/media" -Headers @{ 'X-Agent-Key' = $key } -TimeoutSec 10
    $now = if ($media.title) { "$($media.artist) - $($media.title)" } else { 'niets' }
    Write-Host "  Media-helper draait voor $user (speelt nu: $now)" -ForegroundColor Green
} catch { Write-Host "  Media-helper reageert (nog) niet: $($_.Exception.Message)" -ForegroundColor Yellow }

# Remove the old lock-after-autologon task from earlier versions (not needed: the agent runs as
# SYSTEM at boot, so stats work without anyone signing in)
if (Get-ScheduledTask -TaskName $LockTaskName -ErrorAction SilentlyContinue) {
    Unregister-ScheduledTask -TaskName $LockTaskName -Confirm:$false
    Write-Host "  Oude taak '$LockTaskName' verwijderd"
}

$nic = Get-NetAdapter -Physical | Where-Object { $_.Status -eq 'Up' -and $_.MediaType -eq '802.3' } | Select-Object -First 1
$ip  = if ($nic) { (Get-NetIPAddress -InterfaceIndex $nic.ifIndex -AddressFamily IPv4 | Select-Object -First 1).IPAddress }
$mac = if ($nic) { $nic.MacAddress -replace '-', ':' }

Write-Host "`nKlaar! Zet deze regels in .env op de server (/opt/homedashboard/.env):`n" -ForegroundColor Green
Write-Host "PC_AGENT_URL=http://${ip}:$Port"
Write-Host "PC_AGENT_KEY=$key"
Write-Host "PC_MAC=$mac"
Write-Host "`nTip: geef deze PC een vast IP-adres in je FritzBox, zodat ${ip} niet verandert.`n"
