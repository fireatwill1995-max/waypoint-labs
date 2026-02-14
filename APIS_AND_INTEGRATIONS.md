# APIs & Integrations — Full List

Use this list to wire the app to all services. Everything is built ready to go; add keys where indicated.

---

## Required for core app + AI + maps

| # | Env variable / key | Where to get it | Used for |
|---|--------------------|-----------------|----------|
| 1 | **ANTHROPIC_API_KEY** | [console.anthropic.com](https://console.anthropic.com) → API Keys | Backend AI (Claude): conversational chat, route advice, mission planning, proposed actions (e.g. execute_mission). **Required for AI and voice→AI flow.** |
| 2 | **NEXT_PUBLIC_GOOGLE_MAPS_API_KEY** | [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → Create API Key → enable Maps JavaScript API | Frontend map display and location services. **Required if any map component is used.** |

---

## Required for app URLs (backend / WebSocket)

| # | Env variable | Example | Used for |
|---|--------------|--------|----------|
| 3 | **NEXT_PUBLIC_API_URL** | `http://localhost:8000` (local) or `https://your-api.fly.dev` (prod) | Frontend: where to send API requests (AI chat, routes, execute, status). |
| 4 | **NEXT_PUBLIC_WS_URL** | `ws://localhost:8000` (local) or `wss://your-api.fly.dev` (prod) | Frontend: WebSocket for live video, detections, real-time telemetry. |

---

## Optional but recommended

| # | Env variable / key | Where to get it | Used for |
|---|--------------------|-----------------|----------|
| 5 | **REDIS_URL** (or **REDIS_TLS_URL**) | e.g. [Upstash](https://upstash.com) Redis | Session store, cache, rate limiting. Use `rediss://` for TLS. Set via Fly secrets: `fly secrets set REDIS_URL=rediss://...` |
| 6 | **NGROK_AUTHTOKEN** | [ngrok.com](https://ngrok.com) → Your Authtoken | Dev tunnel (`npm run ngrok`) for mobile/headset testing and shareable URL. |
| 7 | **NGROK_DOMAIN** | ngrok paid plan → Reserved Domain | Optional; fixed ngrok URL. |
| 8 | **Cesium Ion Access Token** | [cesium.com/ion](https://cesium.com/ion) → Access Tokens | 3D globe in Mission Planning (CesiumMissionView). Use your own for production. |

---

## Optional (backend / deployment)

| # | Env variable | Used for |
|---|--------------|----------|
| 9 | **CORS_ORIGINS** | Comma-separated frontend origins when frontend and backend differ. |
| 10 | **CORS_ALLOW_ALL=1** | Allow any origin (dev/ngrok only). |
| 11 | **Fly.io / flyctl** | Deploy via `flyctl auth login`; no API key in env. |

---

## Browser / device APIs (no keys)

- **Web Speech API** (SpeechRecognition): voice input; works with headset mic. Chrome/Edge recommended.
- **Speech Synthesis**: AI reply and confirmation prompts read aloud.
- **WebSocket**: real-time updates (uses NEXT_PUBLIC_WS_URL).

---

## Backend AI chat contract (for proposed actions)

The frontend supports **confirm-then-execute**. The backend can return:

```json
{
  "response": "I've planned the route. Confirm to run the mission.",
  "route": { "waypoints": [...] },
  "advice": "Optional advice text.",
  "proposed_action": {
    "type": "execute_mission",
    "label": "Execute mission",
    "payload": {}
  }
}
```

- **response** (required): assistant message shown in chat.
- **route** (optional): when present, frontend shows “Apply this route” and “Confirm — run now” / “Cancel”.
- **proposed_action** (optional): when `type === "execute_mission"`, frontend shows “Execute mission” confirm; on confirm it calls the app’s mission execute handler.

---

## Third-party drone / GCS APIs (optional for future hardware)

| Service | Purpose | Link / notes |
|---------|---------|--------------|
| **FlytBase** | Unified drone API (DJI, PX4, ArduPilot): navigation, telemetry, mission planning, video, gimbal. | [flytbase.com/drone-api](https://www.flytbase.com/drone-api), [devdocs.flytbase.com](https://devdocs.flytbase.com) |
| **DJI SDK / Mobile SDK** | Direct DJI drone control (waypoints, camera, telemetry). | developer.dji.com |
| **Autel SDK** | Autel drone control. | Autel developer program |
| **MAVLink / PX4 / ArduPilot** | Open protocol for PX4/ArduPilot drones; often used with FlytBase or custom backend. | mavlink.io, px4.io, ardupilot.org |
| **DroneDeploy API** | Mapping, 3D models, fleet (if integrating with DroneDeploy). | dronedeploy.com/developers |
| **Pix4D** | Photogrammetry; export/import for processing. | pix4d.com |

---

## Where to set them

- **Backend (Python):** `.env` in project root, or shell. Reads: `ANTHROPIC_API_KEY`, `CORS_ORIGINS`, `CORS_ALLOW_ALL`.
- **Frontend (Next.js):** `.env.local`. Reads all `NEXT_PUBLIC_*`. Ngrok script also reads `NGROK_AUTHTOKEN`, `NGROK_DOMAIN`.

---

## Minimal `.env.local` (frontend)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<your-google-maps-api-key>
NGROK_AUTHTOKEN=<optional-ngrok-token>
```

## Minimal backend env

```env
ANTHROPIC_API_KEY=<your-anthropic-api-key>
```

Do not commit real keys to git. Rotate any key if it was ever pasted or committed.
