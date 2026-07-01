!macro customInit
  nsExec::ExecToLog 'taskkill /IM "PrintCardFlow.exe" /T /F'
!macroend

!macro customUnInit
  nsExec::ExecToLog 'taskkill /IM "PrintCardFlow.exe" /T /F'
  Sleep 1000
!macroend

!macro customRemoveFiles
  nsExec::ExecToLog 'taskkill /IM "PrintCardFlow.exe" /T /F'
  Sleep 1000
  RMDir /r "$INSTDIR"
!macroend

!macro customUnInstall
  nsExec::ExecToLog 'taskkill /IM "PrintCardFlow.exe" /T /F'
!macroend
