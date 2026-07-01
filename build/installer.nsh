!macro customInit
  nsExec::ExecToLog 'taskkill /IM "PrintCardFlow.exe" /T /F'
!macroend

!macro customUnInstall
  nsExec::ExecToLog 'taskkill /IM "PrintCardFlow.exe" /T /F'
!macroend
