#Requires -Version 5.1
<#
    Masaustune ve Baslat menusune "LoL AI Coach" kisayolu koyar.

    Kisayol exe'yi degil `launch.ps1`i hedefler: exe tek basina acilir ama kocluk yapan
    hicbir panelini dolduramaz, cunku onlarin hepsi sitede. Hedefin baslatici olmasi ayni
    zamanda kisayolun eskimemesi demek -- uygulama yeniden derlendiginde kisayol zaten
    yeni exe'yi calistiriyor olur.

    Bir kez calistirilir:
      powershell -ExecutionPolicy Bypass -File desktop\scripts\install-shortcuts.ps1
#>

$ErrorActionPreference = 'Stop'

$Repo     = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$Launcher = Join-Path $Repo 'desktop\scripts\launch.ps1'
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
    $link.TargetPath = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
    $link.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$Launcher`""
    $link.WorkingDirectory = $Repo
    $link.IconLocation = "$Icon,0"
    $link.Description = 'LoL AI Coach masaustu uygulamasi'
    # 7: kucultulmus ve one gelmeden. Baslatici penceresi bir kayit penceresi; onun
    # onunde durmasi gereken tek sey hata mesaji, o da ayri bir kutuda cikiyor.
    $link.WindowStyle = 7
    $link.Save()
    Write-Host "kuruldu: $path"
}
