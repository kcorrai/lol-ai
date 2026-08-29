' Baslaticiyi hicbir konsol penceresi acmadan calistirir.
'
' Kisayol dogrudan powershell.exe'yi hedefleseydi, kisayolun "kucultulmus" ayarina ragmen
' bir konsol penceresi acilir ve gorev cubugunda oturum boyunca dururdu -- kapatildiginda
' da site sunucusunu goturerek. wscript.exe'nin konsolu yoktur, dolayisiyla asagidaki
' cagri hicbir sey cizmez: kullanicinin gordugu tek pencere `launch.ps1`in kendi acilis
' penceresi olur.
'
' Betigin yolu bu dosyaya gore bulunuyor; ikisi ayni klasorde durdugu surece depo
' istenilen yere tasinabilir.

Option Explicit

Dim shell, fso, here, script, command

Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

here = fso.GetParentFolderName(WScript.ScriptFullName)
script = fso.BuildPath(here, "launch.ps1")

If Not fso.FileExists(script) Then
    MsgBox "Baslatici bulunamadi:" & vbCrLf & script, vbCritical, "LoL AI Coach acilamadi"
    WScript.Quit 1
End If

command = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File """ & script & """"

' 0: pencere yok. False: beklemeden cik -- baslatici uygulama kapanana kadar yasar ve
' bu kabugun onu beklemesi icin bir sebep yok.
shell.Run command, 0, False
