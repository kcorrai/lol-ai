#Requires -Version 5.1
<#
    Masaustune ve Baslat menusune "LoL AI Coach" kisayolu koyar.

    Kisayol exe'yi degil baslaticiyi hedefler: exe tek basina acilir ama kocluk yapan
    hicbir panelini dolduramaz, cunku onlarin hepsi sitede. Hedefin baslatici olmasi ayni
    zamanda kisayolun eskimemesi demek -- uygulama yeniden derlendiginde kisayol zaten
    yeni exe'yi calistiriyor olur.

    Hedef `launch.ps1` degil `launch.vbs`, ve arasindaki fark bir konsol penceresi.
    powershell.exe'yi dogrudan hedeflemek, kisayolun pencere ayari ne olursa olsun, gorev
    cubugunda oturum boyunca duran siyah bir pencere birakiyordu -- onu kapatan da site
    sunucusunu goturuyordu. wscript.exe'nin konsolu yok.

    Bir kez calistirilir:
      powershell -ExecutionPolicy Bypass -File desktop\scripts\install-shortcuts.ps1
#>

$ErrorActionPreference = 'Stop'

$Repo     = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$Launcher = Join-Path $Repo 'desktop\scripts\launch.vbs'
$Icon     = Join-Path $Repo 'desktop\src-tauri\icons\icon.ico'
$Name     = 'LoL AI Coach.lnk'

if (-not (Test-Path $Launcher)) { throw "Baslatici bulunamadi: $Launcher" }
if (-not (Test-Path $Icon))     { throw "Ikon bulunamadi: $Icon" }

$targets = @(
    (Join-Path ([Environment]::GetFolderPath('Desktop')) $Name),
    (Join-Path ([Environment]::GetFolderPath('Programs')) $Name)
)

$shell = New-Object -ComObject WScript.Shell

foreach ($path in $targets) {
    $link = $shell.CreateShortcut($path)
    $link.TargetPath = Join-Path $env:SystemRoot 'System32\wscript.exe'
    $link.Arguments = "`"$Launcher`""
    $link.WorkingDirectory = $Repo
    $link.IconLocation = "$Icon,0"
    $link.Description = 'LoL AI Coach masaustu uygulamasi'
    $link.Save()
    Write-Host "kuruldu: $path"
}
