@echo off
echo Starting JARVIS AI Backend Server...
cd /d "%~dp0"
python src\ground_control_station\server.py
pause
