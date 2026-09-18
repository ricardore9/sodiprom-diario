@echo off
title Diario do Professor - Servidor Local
echo Iniciando servidor local do Diario do Professor...
start "" "http://localhost:3000"
node "%~dp0servidor.js"
pause
