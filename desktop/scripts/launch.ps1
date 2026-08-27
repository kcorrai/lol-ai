#Requires -Version 5.1
<#
    Masaustu uygulamasini tek tikla acar: Postgres, sitenin dev sunucusu, uygulama.

    Neden bir baslatici gerekiyor: uygulama kendi basina yalnizca oyunu okur. Koc olan
    yari -- es okumasi, oyun plani, mac bitti bildirimi -- siteye gider, ve site derleme
    aninda sabitlenmis bir adrese bakar (`api.rs`). Yayindaki adres henuz cozulmedigi
    icin exe yerel siteye, `http://localhost:3001`e bakacak sekilde derleniyor; o da
    ayakta bir Postgres ve ayakta bir `npm run dev` demek. Bu dosya o ikisini kendisi
    ayaga kaldirir, boylece uygulamayi acmak bir kisayola tiklamak kadar kaliyor.

    Kendi baslatmadigi hicbir seyi kapatmaz. Zaten calisan bir dev sunucusu oldugu gibi
    birakilir -- muhtemelen biri uzerinde calisiyordur.
#>

$ErrorActionPreference = 'Stop'

$Repo     = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$Exe      = Join-Path $Repo 'desktop\src-tauri\target\release\lol-ai-desktop.exe'
$PgCtl    = 'C:\Program Files\PostgreSQL\16\bin\pg_ctl.exe'
$PgData   = 'C:\pgdata\lolai'
$LogDir   = Join-Path $env:LOCALAPPDATA 'lol-ai-coach\launcher'
$SiteLog  = Join-Path $LogDir 'website.log'
$PgLog    = Join-Path $LogDir 'postgres.log'
$SitePort = 3001
$PgPort   = 5432
$AppName  = 'lol-ai-desktop'

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Say([string]$Message) {
    Write-Host ("  " + $Message)
}

function Die([string]$Message) {
    Write-Host ''
    Write-Host $Message -ForegroundColor Red
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.MessageBox]::Show(
        $Message, 'LoL AI Coach acilamadi', 'OK', 'Error') | Out-Null
    exit 1
}

function Test-Listening([int]$Port) {
    $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    return [bool]$conn
}

<#
    3001'de ne oldugunu soyler: 'ours', 'foreign', 'down'.

    Kimlik sorusu bos bir titizlik degil. Bu makinede 3001'i baska bir uygulama da
    tutuyor, ve `desktop_fetch` cihaz jetonunu bu porta gonderiyor -- yanlis uygulamaya
    baglanmak jetonu ona vermek olurdu. `/api/health` veritabani duz yatmisken 503
    dondugu icin cevabin govdesine bakiliyor, durum koduna degil.
#>
function Get-SiteState {
    $request = [System.Net.HttpWebRequest]::Create("http://127.0.0.1:$SitePort/api/health")
    $request.Timeout = 5000
    $request.Method = 'GET'

    $response = $null
    try {
        $response = $request.GetResponse()
    } catch [System.Net.WebException] {
        $response = $_.Exception.Response
        if (-not $response) { return 'down' }
    } catch {
        return 'down'
    }

    try {
        $reader = New-Object System.IO.StreamReader($response.GetResponseStream())
        $body = $reader.ReadToEnd()
    } finally {
        $response.Close()
    }

    if ($body -match '"services"' -and $body -match '"database"') { return 'ours' }
    return 'foreign'
}

Write-Host ''
Write-Host '  LoL AI Coach' -ForegroundColor Cyan
Write-Host ''

if (-not (Test-Path $Exe)) {
    Die @"
Uygulama henuz derlenmemis:
  $Exe

Claude Code'da su komut bir kez calistirilmali:
  cd desktop; `$env:LOLAI_API_BASE = 'http://localhost:3001'; npm run tauri build -- --no-bundle
"@
}

# Uygulama zaten aciksa exe'yi bir daha calistirmak yeni bir kopya acmaz -- ikinci kopya
# istegini birinciye devredip cikar. Servislere dokunmadan cikilir: onlari baslatan
# calisan baslatici hala bekliyor ve kapatmayi o yapacak.
if (Get-Process -Name $AppName -ErrorAction SilentlyContinue) {
    Say 'Uygulama zaten acik, one getiriliyor.'
    Start-Process -FilePath $Exe | Out-Null
    exit 0
}

if (Test-Listening $PgPort) {
    Say 'Postgres calisiyor.'
} else {
    if (-not (Test-Path $PgCtl)) {
        Die "Postgres 16 bulunamadi: $PgCtl"
    }
    Say 'Postgres baslatiliyor...'
    Start-Process -FilePath $PgCtl `
        -ArgumentList @('-D', $PgData, '-l', $PgLog, '-w', 'start') `
        -WindowStyle Hidden -Wait
    if (-not (Test-Listening $PgPort)) {
        Die "Postgres baslamadi. Kaydi: $PgLog"
    }
    Say 'Postgres hazir.'
}

$startedSite = $null
$siteState = Get-SiteState

if ($siteState -eq 'foreign') {
    Die @"
$SitePort portunu LoL AI Coach sitesi disinda bir sey tutuyor -- baska bir uygulama,
ya da yarim kalmis eski bir dev sunucusu. Uygulama cihaz jetonunu bu porta gonderdigi
icin baslatilmiyor.

Portu tutan islem:
  Get-Process -Id (Get-NetTCPConnection -LocalPort $SitePort -State Listen).OwningProcess
"@
}

if ($siteState -eq 'ours') {
    Say 'Site zaten calisiyor.'
} else {
    if (Test-Listening $SitePort) {
        Die "$SitePort dinleniyor ama cevap vermiyor. Takilmis bir dev sunucusu olabilir."
    }
    Say 'Site baslatiliyor (ilk derleme bir dakikayi bulabilir)...'
    $startedSite = Start-Process -FilePath $env:ComSpec `
        -ArgumentList @('/c', "npm run dev > `"$SiteLog`" 2>&1") `
        -WorkingDirectory $Repo -WindowStyle Hidden -PassThru

    $deadline = (Get-Date).AddMinutes(3)
    while ((Get-Date) -lt $deadline) {
        if ($startedSite.HasExited) {
            Die "Site dev sunucusu kapandi. Kaydi: $SiteLog"
        }
        $siteState = Get-SiteState
        if ($siteState -eq 'ours') { break }
        Start-Sleep -Seconds 2
    }
    if ($siteState -ne 'ours') {
        Die "Site 3 dakikada acilmadi. Kaydi: $SiteLog"
    }
    Say 'Site hazir.'
}

Say 'Uygulama aciliyor.'
$app = Start-Process -FilePath $Exe -PassThru

if (-not $startedSite) {
    exit 0
}

# Pencereyi kapatmak uygulamayi kapatmiyor -- tepsiye iniyor ve oyunu izlemeye devam
# ediyor. Yani bu bekleyis tepsiden "cik" denene kadar surer, ki dev sunucusunu kapatmak
# icin dogru an tam olarak o.
Write-Host ''
Say 'Site arka planda calisiyor. Uygulamadan cikilinca kapatilacak.'
Say 'Bu pencereyi kapatmak da site sunucusunu kapatir.'
$app.WaitForExit()

if (Get-Process -Name $AppName -ErrorAction SilentlyContinue) {
    exit 0
}

Say 'Site kapatiliyor.'
& taskkill.exe /PID $startedSite.Id /T /F 2>&1 | Out-Null
