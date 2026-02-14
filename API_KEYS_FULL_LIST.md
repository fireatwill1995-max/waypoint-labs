# API Keys & Env Vars – Full List for Fully Functioning App

Use this list to run the app **fully built and fully functioning**. Get any keys you don’t have from the linked signup pages.

---

## Required (core app + AI + maps)

| # | Env variable / key | Where to get it | Used for |
|---|--------------------|-----------------|----------|
| 1 | **ANTHROPIC_API_KEY** | [console.anthropic.com](https://console.anthropic.com) → API Keys | Backend AI (Claude): chat, route advice, filming/mustering/hunting. **Required for AI features.** |
| 2 | **NEXT_PUBLIC_GOOGLE_MAPS_API_KEY** | [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → Create API Key → enable Maps JavaScript API (and others if you use them) | Frontend map display and location services. **Required if any map component is used.** |

---

## Required for app URLs (not “keys” – set to your backend)

| # | Env variable | Example | Used for |
|---|--------------|--------|----------|
| 3 | **NEXT_PUBLIC_API_URL** | `http://localhost:8000` (local) or `https://your-api.fly.dev` (prod) | Frontend: where to send API requests. |
| 4 | **NEXT_PUBLIC_WS_URL** | `ws://localhost:8000` (local) or `wss://your-api.fly.dev` (prod) | Frontend: WebSocket for live video/detections and real-time updates. |

---

## Optional but recommended for full use

| # | Env variable / key | Where to get it | Used for |
|---|--------------------|-----------------|----------|
| 5 | **NGROK_AUTHTOKEN** | [ngrok.com](https://ngrok.com) → Sign up → Your Authtoken | Dev tunnel script (`npm run ngrok`) so you can open the app from another device or share a URL. **Needed for full “shareable dev” use.** |
| 6 | **NGROK_DOMAIN** | ngrok paid plan → Reserved Domain | Optional; only if you want a fixed ngrok URL (e.g. `https://myapp.ngrok-free.app`) instead of a random one. |
| 7 | **Cesium Ion Access Token** | [cesium.com/ion](https://cesium.com/ion) → Access Tokens | 3D globe in Mission Planning (CesiumMissionView). App can run with Cesium’s default token; use your own for production or higher-quality terrain/imagery. |

---

## Optional (backend / deployment)

| # | Env variable | Used for |
|---|--------------|----------|
| 8 | **CORS_ORIGINS** | Comma-separated frontend origins (e.g. your ngrok or production URL). Needed when frontend and backend run on different origins. |
| 9 | **CORS_ALLOW_ALL=1** | Allow any origin (dev/ngrok only; not for production). |
| 10 | **Fly.io / flyctl** | Deploy frontend/backend to Fly.io. Uses `flyctl auth login` (browser); no API key in env. |

---

## Where to set them

- **Backend (Python):** `.env` in project root, or `set`/`export` in the shell before starting the server.  
  Backend reads: `ANTHROPIC_API_KEY`, `CORS_ORIGINS`, `CORS_ALLOW_ALL`.
- **Frontend (Next.js):** `.env.local` in project root.  
  Frontend reads: `NEXT_PUBLIC_*` (all of the above that start with `NEXT_PUBLIC_`).  
  Ngrok script also reads: `NGROK_AUTHTOKEN`, `NGROK_DOMAIN` from `.env.local`.

---

## Minimal `.env.local` (frontend) for full use

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<your-google-maps-api-key>
NGROK_AUTHTOKEN=<your-ngrok-authtoken>
```

## Minimal backend env for full use

```env
ANTHROPIC_API_KEY=<your-anthropic-api-key>
```

---

## Security note

If any API key was ever committed or pasted into docs, **rotate it** (revoke and create a new one) in the provider’s console and update your local `.env` / `.env.local` only. Do not commit real keys to git.
