# Deployment Guide – Waypoint Labs

## Prerequisites

- **Node.js** 20+
- **Fly.io CLI** (`flyctl`) for deploy
- **Python 3.10+** (for backend; optional if you only deploy frontend)
- **Demo auth** – no Clerk; use Demo Login and demo accounts

## Environment Variables

### Frontend (Next.js)

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_API_URL=https://your-backend-api-url.com
NEXT_PUBLIC_WS_URL=wss://your-backend-api-url.com
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key_if_needed
```

For **local dev** with backend on same machine, you can leave defaults (API at `http://localhost:8000`).

### Backend (Python FastAPI)

- `ANTHROPIC_API_KEY` – optional; for AI/Claude integration
- `CORS_ORIGINS` – optional; comma-separated origins (e.g. your ngrok or production frontend URL)
- `CORS_ALLOW_ALL=1` – optional; allow any origin (dev/ngrok only)

## Building the Application

### Frontend

```bash
npm install
npm run build
npm start
```

### Backend (optional; for full API + SDK-ready endpoints)

```bash
pip install -r requirements.txt
# Or minimal: pip install fastapi uvicorn pydantic python-dotenv
```

Start backend:

- **Windows:** `start_server.bat` or:
  ```bash
  python src\ground_control_station\server.py
  ```
- **Linux/macOS:** `python src/ground_control_station/server.py`

Backend runs at **http://localhost:8000**. Use `CORS_ORIGINS` or `CORS_ALLOW_ALL=1` when the frontend is on another origin (e.g. ngrok).

## ngrok (dev tunnel)

The project uses **NGROK_AUTHTOKEN** from `.env.local`. Run:

```bash
npm run ngrok
```

This starts ngrok on port 3001 with `--host-header=localhost:3001` so the Next.js dev server gets the correct Host and won’t return 404 for `/_next/static/chunks/...`. The public URL is shown in the ngrok terminal (e.g. `https://xxxx.ngrok-free.app`).

To use a different auth token, set `NGROK_AUTHTOKEN` in `.env.local`.

## SDK-Ready API (for programming into a drone SDK)

The backend exposes endpoints that can be wired to MAVLink/DroneKit/real drone later:

- `POST /api/sdk/command` – send command: `takeoff`, `land`, `rtl`, `arm`, `disarm`, `goto`, `pause`, `resume`, `set_speed`, `set_altitude`
- `POST /api/sdk/waypoints` – upload waypoint mission
- `GET /api/sdk/telemetry` – current telemetry (stub until wired to drone)
- `GET /api/sdk/drones` – list drones (stub)

Frontend helpers: `app/lib/sdk.ts` – `sendSDKCommand()`, `uploadWaypoints()`, `getSDKTelemetry()`.

## Deploying to Fly.io (frontend)

### Option A: Deploy via GitHub Actions (recommended)

1. Push the repo to **GitHub**.
2. Get a Fly.io API token: [fly.io/user/settings/tokens](https://fly.io/user/settings/tokens) → Create token.
3. In GitHub: **Settings → Secrets and variables → Actions** → New repository secret:
   - Name: `FLY_API_TOKEN`  
   - Value: your Fly API token
4. Push to the `main` branch (or run the workflow manually: Actions → Deploy to Fly.io → Run workflow).
5. First run: ensure the Fly app exists (`fly apps create civilian-drone-app` from your machine once, or let the first deploy create it).
6. Set secrets on Fly (for backend URL if different):
   ```bash
   flyctl secrets set NEXT_PUBLIC_API_URL=https://your-backend.fly.dev
   flyctl secrets set NEXT_PUBLIC_WS_URL=wss://your-backend.fly.dev
   ```
   Or leave unset to use the same Fly app (rewrites proxy to NEXT_PUBLIC_API_URL from env).

### Option B: Deploy from your machine

1. **Login**
   ```bash
   flyctl auth login
   ```

2. **Create app (if needed)**
   ```bash
   flyctl apps create civilian-drone-app
   ```

3. **Secrets**
   ```bash
   flyctl secrets set NEXT_PUBLIC_API_URL=https://your-api-url.com
   flyctl secrets set NEXT_PUBLIC_WS_URL=wss://your-api-url.com
   ```

4. **Deploy**
   ```bash
   flyctl deploy
   ```

5. **Check**
   ```bash
   flyctl open
   flyctl logs
   ```

## Application Features

- **Auth:** Demo Login only (demo@waypointlabs.io, admin@waypointlabs.com, pilot@waypointlabs.io)
- **Pages:** Home, Sign-in, Select Role, Civilian, Pilot, Admin
- **Components:** 50+ (AI Chat, Multi-Drone Video, Analytics, Voice Control, Mission View, etc.)
- **API:** Health `/api/status`, civilian routes, AI chat, admin, fleet, SDK command/waypoints/telemetry
- **UI:** Waypoint Labs theme, responsive, dark-optimized

## Docker

The repo includes a **Dockerfile** for the Next.js app (standalone output). It does **not** run the Python backend; deploy the backend separately or use a separate Dockerfile for it.

## Troubleshooting

- **API 500 / connection refused:** Start the Python backend (`python src/ground_control_station/server.py`) or point `NEXT_PUBLIC_API_URL` to a running API.
- **CORS errors with ngrok:** Set `CORS_ORIGINS=https://your-ngrok-url.ngrok-free.dev` or `CORS_ALLOW_ALL=1` for dev.
- **WebSocket:** Use `wss://` in production for `NEXT_PUBLIC_WS_URL`.

## Deploying to Cloudflare Pages (via GitHub)

1. Push the repo to **GitHub**.
2. In Cloudflare Dashboard: **Workers & Pages** → Create application → **Pages** → **Connect to Git** → select the repo.
3. **Or** use the included GitHub Action:
   - In GitHub: **Settings → Secrets and variables → Actions** → add:
     - `CLOUDFLARE_API_TOKEN` (from Cloudflare: My Profile → API Tokens → Create Token, “Edit Cloudflare Workers” template)
     - `CLOUDFLARE_ACCOUNT_ID` (from Cloudflare Dashboard → right sidebar)
   - Optional: **Settings → Secrets and variables → Actions → Variables**: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL` (e.g. your Fly backend).
   - Push to `main` runs the “Deploy to Cloudflare Pages” workflow. It builds with static export and deploys the `out` directory.
4. In Cloudflare Pages project settings, set **Environment variables** (production) if needed: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (the workflow can also use GitHub vars/secrets for build).
5. The Cloudflare build uses `BUILD_FOR_CF=1` so the app is exported as static; API calls go to `NEXT_PUBLIC_API_URL` (set your backend URL so the frontend can reach it).

## Notes

- Next.js 14 App Router; demo auth only (no Clerk).
- Backend can be deployed on Fly.io, Railway, or any host; set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL` to that host.
- **Fly.io** runs the full Next.js server (standalone + Dockerfile). **Cloudflare Pages** runs a static export; point `NEXT_PUBLIC_API_URL` at your backend.
