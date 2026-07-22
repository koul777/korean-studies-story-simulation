@echo off
chcp 65001 > nul
"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -File "%~dp0게임_실행.ps1"
if errorlevel 1 (
  echo.
  echo 게임 실행에 실패했습니다. 위 오류 내용을 확인해 주세요.
  pause
)
