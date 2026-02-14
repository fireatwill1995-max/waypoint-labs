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

## Deploying to Fly.io (backend)

**Frontend** is on **Cloudflare Pages** (see below). **Backend** (Python API) runs on Fly.io. The repo’s `fly.toml` uses `Dockerfile.backend` (Python + FastAPI on port 8000). The Cloudflare build sets `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_WS_URL` to your Fly backend URL (e.g. `https://civilian-drone-app.fly.dev`).

### Option A: Deploy via GitHub Actions

1. Push the repo to **GitHub**.
2. Get a Fly.io API token: [fly.io/user/settings/tokens](https://fly.io/user/settings/tokens) → Create token.
3. In GitHub: **Settings → Secrets and variables → Actions** → New repository secret:
   - Name: `FLY_API_TOKEN`  
   - Value: your Fly API token
4. Push to `main` or `master` (or run the workflow manually: Actions → Deploy to Fly.io → Run workflow).
5. Ensure the Fly app exists (`fly apps create civilian-drone-app` once if needed).
6. Set secrets on Fly for the backend (if your API URL differs):
   ```bash
   flyctl secrets set NEXT_PUBLIC_API_URL=https://civilian-drone-app.fly.dev
   flyctl secrets set NEXT_PUBLIC_WS_URL=wss://civilian-drone-app.fly.dev
   ```

### Option B: Deploy from your machine

1. **Login:** `flyctl auth login`
2. **Create app (if needed):** `flyctl apps create civilian-drone-app`
3. **Secrets (if needed):** `flyctl secrets set NEXT_PUBLIC_API_URL=...` and `NEXT_PUBLIC_WS_URL=...`
4. **Deploy:** `flyctl deploy`
5. **Check:** `flyctl open` and `flyctl logs`

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

## Deploying to Cloudflare Pages (frontend)

**Frontend** is static on **Cloudflare Pages**. **Backend** is on **Fly.io**; the frontend calls it via `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL`.

1. Push the repo to **GitHub**.
2. **Use the included GitHub Action:**
   - In GitHub: **Settings → Secrets and variables → Actions** → add:
     - `CLOUDFLARE_API_TOKEN` (from Cloudflare: My Profile → API Tokens → Create Token, “Edit Cloudflare Workers” template)
     - `CLOUDFLARE_ACCOUNT_ID` (from Cloudflare Dashboard → right sidebar)
   - Optional **Variables**: `NEXT_PUBLIC_APP_URL` (frontend live URL for manifest/OG), `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL` (default to `https://civilian-drone-app.fly.dev` and `wss://civilian-drone-app.fly.dev`).
   - Push to `main` or `master` runs “Deploy to Cloudflare Pages”: builds with `BUILD_FOR_CF=1` (static export) and deploys the `out` directory.
3. Live frontend URL: `https://waypoint-labs.pages.dev` (or your custom domain). Set `NEXT_PUBLIC_APP_URL` to that URL in repo Variables so manifest and Open Graph use the correct base.

## Repo not loading to Cloudflare?

1. **Project name must match:** The workflow deploys to a project named **waypoint-labs**. In Cloudflare: **Workers & Pages** → **Create application** → **Pages** → **Create with Direct Upload** → set name to **waypoint-labs** (no spaces). If you already created a project with another name, either rename it to `waypoint-labs` or change `projectName` in `.github/workflows/deploy-cloudflare.yml` to match.
2. **Secrets in GitHub:** **Settings** → **Secrets and variables** → **Actions** → add **CLOUDFLARE_API_TOKEN** and **CLOUDFLARE_ACCOUNT_ID**. Token needs “Edit Cloudflare Workers” (or “Cloudflare Pages” edit) permission; Account ID is in the dashboard URL or right sidebar.
3. **Branch:** The workflow runs on push to **main** or **master**. Push to one of those branches (or run the workflow manually from the Actions tab).
4. **Direct Upload:** The Action builds in GitHub and uploads the `out` folder. The Cloudflare project must be created with **Direct Upload** (not “Connect to Git”) so it accepts uploads from the API.

## Notes

- Next.js 14 App Router; demo auth only (no Clerk).
- **Cloudflare Pages** = frontend (static). **Fly.io** = backend; set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL` to your Fly backend so the frontend can reach it.
