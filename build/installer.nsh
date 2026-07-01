!macro killPrintCardFlow
  DetailPrint "Stopping PrintCardFlow..."
  ExecWait '"$SYSDIR\taskkill.exe" /F /T /IM PrintCardFlow.exe'
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
  !insertmacro killPrintCardFlow
  RMDir /r "$INSTDIR"
!macroend

!macro customUnInstall
  !insertmacro killPrintCardFlow
!macroend
