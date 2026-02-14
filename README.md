# Waypoint Labs

Drone flight control platform with fully automated missions, semi-automated workflows, and manual flight tools. Designed to match and exceed [Dronelink](https://www.dronelink.com/)-style features while supporting **more drones** (30+ protocols).

## Features (vs Dronelink)

- **Mapping**: Grid, Crosshatch, Linear, Lawnmower, Spiral, Zigzag, Terrain Following — with terrain follow, oblique angles, overlaps
- **3D Mission Previews & Estimates**: Preview flight path in 3D; waypoint count, distance, estimated time, and image count
- **Cross-Platform**: Web (iOS/Android-ready). One account; 30+ drone protocols
- **Supported Drones**: DJI (SDK, Tello, Mini, Air, FPV), Autel, PX4, ArduPilot, Parrot, Skydio, Yuneec, and 20+ more (see `/supported-drones`)
- **Three Workflows**: Pre-plan on web/app, generate on-the-fly in the field, or hybrid manual/auto
- **Mission Planning Hub**: Unified hub for 3D preview, pattern generator, and mission templates
- **Operations**: Cattle mustering, hunting, people recognition, filming, fishing, mining (Australia) with AI route planning and compliance

## Live URL & Vercel

The app is configured to run on **Vercel**. The live URL is set automatically from Vercel’s `VERCEL_URL`, or you can set it explicitly:

- **In the repo:** Edit `app/config/site.ts` — the default fallback is `https://waypoint-labs.vercel.app`. Change it if your live URL is different and you don’t use env.
- **On Vercel (recommended):** Project → Settings → Environment Variables → add:
  - `NEXT_PUBLIC_APP_URL` = your production URL (e.g. `https://your-project.vercel.app` or your custom domain).

With this, links, Open Graph, and the PWA manifest use the correct base URL. Optional: set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL` if you run a separate backend.

## Setup

1. Install dependencies:
```bash
npm install
pip install -r requirements.txt
```

2. Set up environment variables (see `.env.local` or DEPLOYMENT.md):
- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:8000)
- `NEXT_PUBLIC_WS_URL` - WebSocket URL for live video/detections (e.g. ws://localhost:8000)
- Demo auth: use Demo Login; no Clerk.
- Optional: `NEXT_PUBLIC_ADMIN_ACCESS_CODE` - Admin page access code (default: WL-ADMIN-2024).

3. Start the development server:
```bash
npm run dev
```

4. Start the backend server:
```bash
python src/ground_control_station/server.py
```

## Project Structure

- `app/` - Next.js frontend application
- `src/modules/civilian/` - Civilian-specific backend modules
- `src/ground_control_station/` - Backend server

## Admin access

The admin dashboard requires an admin account and an access code:

- **Email:** `admin@waypointlabs.com`
- **Password:** `WlAdmin2024!`
- **Access code** (entered on the admin page after sign-in): `WL-ADMIN-2024`

To change the access code, set `NEXT_PUBLIC_ADMIN_ACCESS_CODE` in `.env.local`.

## Notes

This app is completely separate from the military application and focuses solely on civilian drone operations.

