@echo off
rem AtölyeKart'ı geliştirme sunucusuyla başlatır ve tarayıcıda açar.
cd /d "%~dp0"
if not exist node_modules call npm install
call npm run dev -- --open
