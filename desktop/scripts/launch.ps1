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

    Hicbir konsol penceresi acmaz. Kisayol bunu `launch.vbs` uzerinden gizli calistirir,
    ve ilerleme siyah bir kabuk yerine kucuk bir pencerede yazar: uygulamayi acan kisi
    gelistirici degil, ve bir kayit penceresi ona bir uygulamanin acilmadigini soyluyor.
    Bir terminalden elle calistirildiginda `Write-Host` satirlari da yerinde duruyor.
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
$Icon     = Join-Path $Repo 'desktop\src-tauri\icons\icon.ico'

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Uygulamanin kendi renkleri (`tailwind.config.ts`). Acilis penceresi uygulamaya ait
# gorunmeli: bir kisayolun actigi ilk sey, tikladigi seyin acildigina dair tek isaret.
$Ink    = [System.Drawing.Color]::FromArgb(0x08, 0x0B, 0x0A)
$Accent = [System.Drawing.Color]::FromArgb(0xC6, 0xFF, 0x3D)
$Muted  = [System.Drawing.Color]::FromArgb(0x6C, 0x81, 0x7B)

$script:Ui = $null

<#
    Ne olup bittigini soyleyen kucuk pencere.

    Modal degil: `Show` doner ve is akisi devam eder, mesajlar da `DoEvents` ile islenir.
    Pencerenin kendisi bir sey yapmaz -- yalnizca bir satir yazi tutar, ve uygulama acilinca
    kapanir. Kullanici kapatirsa baslatma yine surer; `Say` kapanmis pencereyi es geciyor.
#>
function Show-Splash {
    $form = New-Object System.Windows.Forms.Form
    $form.Text            = 'LoL AI Coach'
    $form.ClientSize      = New-Object System.Drawing.Size(420, 132)
    $form.FormBorderStyle = 'FixedSingle'
    $form.StartPosition   = 'CenterScreen'
    $form.MaximizeBox     = $false
    $form.MinimizeBox     = $false
    $form.BackColor       = $Ink
    # Bir dakikayi bulabilen ilk derleme boyunca ustte kalir. Kaybolan tek geri bildirim,
    # hic geri bildirim olmamasiyla ayni sey.
    $form.TopMost         = $true
    if (Test-Path $Icon) { $form.Icon = New-Object System.Drawing.Icon($Icon) }

    $title = New-Object System.Windows.Forms.Label
    $title.Text      = 'LoL AI Coach'
    $title.Font      = New-Object System.Drawing.Font('Segoe UI', 15, [System.Drawing.FontStyle]::Bold)
    $title.ForeColor = $Accent
    $title.AutoSize  = $true
    $title.Location  = New-Object System.Drawing.Point(24, 22)
    $form.Controls.Add($title)

    # Bos baslamaz. Pencerenin acildigi an ile ilk adimin arasi kisa ama sifir degil, ve
    # o araliktaki bos satir "takildi" gibi okunuyor.
    $status = New-Object System.Windows.Forms.Label
    $status.Text      = 'Hazirlaniyor...'
    $status.Font      = New-Object System.Drawing.Font('Consolas', 9.5)
    $status.ForeColor = $Muted
    $status.AutoSize  = $false
    $status.Size      = New-Object System.Drawing.Size(372, 20)
    $status.Location  = New-Object System.Drawing.Point(24, 62)
    $form.Controls.Add($status)

    # Ilerleme cubugu degil, duz bir cizgi. Win32 ilerleme cubugu gorsel stillerini
    # isletim sisteminden aliyor ve rengi ayarlanamiyor: koyu zeminde parlak beyaz bir
    # dikdortgen olarak duruyordu. Hareket zaten durum satirinda -- orasi saniyeyi sayiyor.
    $rule = New-Object System.Windows.Forms.Label
    $rule.AutoSize  = $false
    $rule.BackColor = $Accent
    $rule.Size      = New-Object System.Drawing.Size(372, 2)
    $rule.Location  = New-Object System.Drawing.Point(24, 96)
    $form.Controls.Add($rule)

    # `Minimized` -> `Show` -> `Normal` sirasi bos bir tuhaflik degil. Kisayol bu betigi
    # wscript uzerinden gizli baslatiyor, ve bir surecin ilk ust duzey penceresi o baslangic
    # durumunu miras aliyor: duz bir `Show()` pencereyi olusturuyor, `Visible` true diyor, ve
    # ekranda hicbir sey cizilmiyordu. Durumu bir kez degistirmek ShowWindow'u acik bir
    # durumla cagirtir ve mirasi kirar.
    $form.WindowState = 'Minimized'
    $form.Show()
    $form.WindowState = 'Normal'
    $form.Activate()

    $script:Ui = @{ Form = $form; Status = $status }
    Pump
}

function Pump {
    [System.Windows.Forms.Application]::DoEvents()
}

function Close-Splash {
    if ($script:Ui -and -not $script:Ui.Form.IsDisposed) { $script:Ui.Form.Close() }
    $script:Ui = $null
    Pump
}

function Say([string]$Message) {
    Write-Host ("  " + $Message)
    if ($script:Ui -and -not $script:Ui.Form.IsDisposed) {
        $script:Ui.Status.Text = $Message
        Pump
    }
}

function Die([string]$Message) {
    Write-Host ''
    Write-Host $Message -ForegroundColor Red
    # Once acilis penceresi gider: hatanin ustunde duran bir "aciliyor" satiri, hata
    # kutusunun soyledigi seyle celisir.
    Close-Splash
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

# Kisayola iki kez tiklamak iki baslatici demek, ve ikisi de uygulamayi henuz acilmamis
# gorup ayni `npm run dev`i baslatmaya kalkar -- ikincisi 3001'i tutulmus bulur ve
# birincisinin sitesini yabanci sanabilir. Ilk giren isi bitirir, ikincisi sessizce cikar.
$launcherLock = New-Object System.Threading.Mutex($false, 'Local\lol-ai-coach-launcher')
$haveLock = $false
try {
    $haveLock = $launcherLock.WaitOne(0)
} catch [System.Threading.AbandonedMutexException] {
    # Onceki baslatici kilidi birakmadan oldu. Kilit yine bizim.
    $haveLock = $true
}
if (-not $haveLock) {
    Say 'Zaten baslatiliyor.'
    exit 0
}

Show-Splash

if (Test-Listening $PgPort) {
    Say 'Postgres calisiyor.'
} else {
    if (-not (Test-Path $PgCtl)) {
        Die "Postgres 16 bulunamadi: $PgCtl"
    }
    Say 'Postgres baslatiliyor...'

    # Neden `-Wait` degil: Start-Process -Wait islemi degil, islem agacini bekler --
    # torunlari da cikana kadar donmez. `pg_ctl -l` ise postmaster'i gunlugu dosyaya
    # yonlendiren bir cmd.exe'nin altinda baslatir, ve o cmd.exe Postgres ayakta oldugu
    # surece yasar. Yani -Wait ile baslatici, veritabani hazir olduktan sonra bile bu
    # satirda sonsuza kadar bekliyordu. Process nesnesinin WaitForExit'i yalnizca
    # pg_ctl'nin kendisini bekler, ki beklenmesi gereken tam olarak o.
    $pgctl = Start-Process -FilePath $PgCtl `
        -ArgumentList @('-D', $PgData, '-l', $PgLog, '-w', 'start') `
        -WindowStyle Hidden -PassThru

    # `pg_ctl -w` sunucu cevap verene kadar kendisi bekler; varsayilan siniri 60 saniye.
    # Buradaki sinir onun uzerinde, boylece asilan tek durum pg_ctl'nin gercekten
    # takilmasi olur.
    if (-not $pgctl.WaitForExit(90000)) {
        Die "Postgres 90 saniyede cevap vermedi. Kaydi: $PgLog"
    }

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

    $waitingSince = Get-Date
    $deadline = $waitingSince.AddMinutes(3)
    while ((Get-Date) -lt $deadline) {
        if ($startedSite.HasExited) {
            Die "Site dev sunucusu kapandi. Kaydi: $SiteLog"
        }
        $siteState = Get-SiteState
        if ($siteState -eq 'ours') { break }
        # Gecen saniye, bekleyisin tek hareketli parcasi. Bir dakika boyunca degismeyen
        # bir satir, calismayi birakmis bir pencereden ayirt edilemiyor.
        Say ("Site baslatiliyor... {0} sn" -f [int]((Get-Date) - $waitingSince).TotalSeconds)
        Start-Sleep -Seconds 1
    }
    if ($siteState -ne 'ours') {
        Die "Site 3 dakikada acilmadi. Kaydi: $SiteLog"
    }
    Say 'Site hazir.'
}

Say 'Uygulama aciliyor.'
$app = Start-Process -FilePath $Exe -PassThru

# Acilis penceresi, uygulamanin penceresi cizilene kadar durur. Start-Process doner donmez
# kapatmak ekranda birkac saniyelik bir bosluk birakiyor, ve o bosluk tiklamanin ise
# yaramadigi gibi okunuyor -- gosterilecek bir sey kalmadigi icin degil, henuz gelmedigi icin.
$appeared = (Get-Date).AddSeconds(20)
while ((Get-Date) -lt $appeared) {
    $app.Refresh()
    if ($app.HasExited -or $app.MainWindowHandle -ne [IntPtr]::Zero) { break }
    Pump
    Start-Sleep -Milliseconds 150
}
Close-Splash

if (-not $startedSite) {
    exit 0
}

# Pencereyi kapatmak uygulamayi kapatmiyor -- tepsiye iniyor ve oyunu izlemeye devam
# ediyor. Yani bu bekleyis tepsiden "cik" denene kadar surer, ki dev sunucusunu kapatmak
# icin dogru an tam olarak o. Bu noktadan sonra ekranda bu betige ait hicbir sey yok:
# gorunmez bir islem olarak yalnizca o ani bekler.
Write-Host ''
Write-Host '  Site arka planda calisiyor. Uygulamadan cikilinca kapatilacak.'
$app.WaitForExit()

if (Get-Process -Name $AppName -ErrorAction SilentlyContinue) {
    exit 0
}

Say 'Site kapatiliyor.'
& taskkill.exe /PID $startedSite.Id /T /F 2>&1 | Out-Null
