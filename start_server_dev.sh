#!/bin/bash
echo "Starting JARVIS AI Backend Server..."
cd "$(dirname "$0")"
python src/ground_control_station/server.py
