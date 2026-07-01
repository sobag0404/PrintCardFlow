!macro killPrintCardFlow
  DetailPrint "Stopping PrintCardFlow..."
  ExecWait '"$SYSDIR\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -Command "Stop-Process -Name PrintCardFlow -Force -ErrorAction SilentlyContinue"'
  Sleep 1500
!macroend

!macro customCheckAppRunning
  !insertmacro killPrintCardFlow
!macroend

!macro customInit
  !insertmacro killPrintCardFlow
!macroend

!macro customUnInit
  !insertmacro killPrintCardFlow
!macroend

!macro customRemoveFiles
  SetOutPath "$TEMP"
  !insertmacro killPrintCardFlow
  RMDir /r "$INSTDIR"
!macroend

!macro customUnInstall
  !insertmacro killPrintCardFlow
!macroend
