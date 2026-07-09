@echo off
REM Script de atalho para iniciar o runtime em PowerShell
REM O .bat vai chamar o .ps1 passando o bypass de execucao

echo Iniciando o script do Apex AI Runtime em PowerShell...
powershell -ExecutionPolicy Bypass -File "%~dp0start-apex-runtime.ps1"

pause
