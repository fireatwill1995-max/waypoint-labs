# Using Waypoint Labs Over Ngrok & Linking Drones

## Your ngrok URL (this session)

**App URL:** https://procambial-maybell-direful.ngrok-free.dev

- **Home:** https://procambial-maybell-direful.ngrok-free.dev  
- **Sign in:** https://procambial-maybell-direful.ngrok-free.dev/sign-in  
- **Select role:** https://procambial-maybell-direful.ngrok-free.dev/select-role  
- **Civilian dashboard:** https://procambial-maybell-direful.ngrok-free.dev/civilian  
- **Pilot dashboard:** https://procambial-maybell-direful.ngrok-free.dev/pilot  
- **Admin dashboard:** https://procambial-maybell-direful.ngrok-free.dev/admin  

*Note: Free ngrok URLs change each time you restart ngrok. For a fixed URL, set `NGROK_DOMAIN` in `.env.local` (paid ngrok).*

---

## Linking ALL drones to this software

The app is built to support **any drone** that can be reached via the supported protocols and connection types.

### Supported protocols (30+)

| Category | Protocols |
|----------|-----------|
| **Open source / DIY** | MAVLink, PX4, ArduPilot, Betaflight, iNav, AuterionOS |
| **DJI** | DJI SDK, DJI Tello, DJI Mini, DJI Air, DJI FPV |
| **Commercial** | Parrot (ARSDK), Skydio, Yuneec, Autel, 3DR Solo, Holy Stone, Potensic, Walkera, Hubsan, Eachine, Fimi, PowerVision, ZeroTech |
| **Military / gov** | STANAG 4586, Bayraktar, MQ-9 Reaper, Heron TP, Shield AI |
| **Standards** | ROS/ROS2, WebRTC, OpenDroneID, ASTM F3411, LoRa, 4G/5G, Satellite, Mesh |
| **Video** | RTSP, RTMP |

### Connection types

Serial, UDP, TCP, USB, WiFi, Bluetooth, WebRTC, RTSP, RTMP.

### How to link a drone

1. **Open the app** at the ngrok URL above and sign in (e.g. Demo Login → use any demo account).
2. **Choose role** (Civilian, Pilot, or Admin) and go to the dashboard.
3. **Civilian / Pilot:** In the dashboard, use the **Drone Connection** / connection panel.
4. **Select protocol** that matches your drone (e.g. MAVLink for PX4/ArduPilot, DJI Tello for Tello, etc.).
5. **Set connection type and params** (e.g. Serial port and baudrate, or UDP/TCP host and port).
6. **Connect:** The UI calls the backend API; for real hardware, the **Python backend** must be running and able to reach the drone (same network / serial / etc.).

### Backend required for real drone links

- **Frontend (Next.js)** – what you see at the ngrok URL – is running and works for all protocols in the UI.
- **Actual link to the drone** is done by the **Python backend** (`src/ground_control_station/server.py`). It uses MAVLink/DroneKit and optional vendor SDKs.
- To connect real drones:
  1. Start the Python backend (e.g. `uvicorn` on port 8000).
  2. Set `NEXT_PUBLIC_API_URL` (or run Next.js so it proxies to that backend).
  3. Ensure the backend can reach the drone (serial, UDP, or network to the drone’s GCS/companion).

So: **any drone that speaks one of the supported protocols can be linked**; the app UI supports them all, and the backend implements the actual connection (MAVLink first; others via SDKs or future modules).

---

## Run app + ngrok again later

```bash
# Terminal 1 – Next.js on port 3001 (required for ngrok script)
npx next dev -p 3001 -H 0.0.0.0

# Terminal 2 – Ngrok (loads NGROK_AUTHTOKEN from .env.local)
npm run ngrok
```

Then open the URL shown by ngrok (or read it from http://127.0.0.1:4040/api/tunnels).
