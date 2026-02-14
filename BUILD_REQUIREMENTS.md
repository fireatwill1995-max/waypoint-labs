# Build Requirements – Waypoint Labs

This document lists all requirements for the software build and confirms implementation status.

---

## 1. Core Product Requirements

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| **Live viewer to see drone stream** | ✅ | `MultiDroneVideoManager` + `ResizableVideoPlayer`; WebSocket video feed (`/ws/video/:cameraId`); visible on Civilian (Monitoring tab) and Pilot (sidebar + Monitoring). |
| **Interact with AI while drone is flying** | ✅ | `AIChatInterface` (mission planning, advice); `LLMCommandInterface` (natural-language commands); `AIDroneCommandInterface`; Voice Control; AI route recommend/cleanup/takeover. Live viewer and AI are available at the same time (see §3). |
| **Multi-drone video** | ✅ | `MultiDroneVideoManager` – add/remove drones, grid/split/focus layouts, per-drone settings. |
| **Role-based access** | ✅ | Civilian, Pilot, Admin; demo auth; Select Role page. |
| **Modes: Cattle, Hunting, People, Filming, Fishing** | ✅ | Mode selector; mode-specific operations, analytics, and AI. |

---

## 2. Feature Requirements (from README & DRONE_COMPATIBILITY)

| Feature | Status | Notes |
|---------|--------|--------|
| Cattle mustering (AI livestock tracking) | ✅ | Mode + operations + detections + analytics. |
| Hunting assistance (animal detection, size/weight) | ✅ | Mode + detections + analytics. |
| People recognition | ✅ | Mode + operations. |
| Filming operations (AI guidance) | ✅ | Mode + MultiDroneVideoManager + AI. |
| Fishing (fish detection, scouting) | ✅ | Mode + FishDetectionPanel + FishingAnalyticsDashboard. |
| Mission planning & waypoints | ✅ | CesiumMissionView, ManualControlPanel, route plan APIs. |
| AI route recommend / cleanup / takeover | ✅ | Buttons + `/api/civilian/route/*`. |
| Real-time detections (WebSocket) | ✅ | `/ws/civilian/detections`; ResizableVideoPlayer. |
| Video streaming (WebSocket) | ✅ | `/ws/video/:cameraId`; requires `NEXT_PUBLIC_WS_URL`. |
| Analytics dashboard | ✅ | AnalyticsDashboard, FishingAnalyticsDashboard. |
| Voice / gesture / VR / multi-screen | ✅ | VoiceControl, GestureControl, VRMissionControl, MultiScreenControl. |
| SDK-ready API (commands, waypoints, telemetry) | ✅ | `/api/sdk/*`; `app/lib/sdk.ts`. |
| Demo auth (no Clerk) | ✅ | Demo Login; demo accounts; `demoAuth.ts`. |
| Backend (optional) | ✅ | FastAPI `server.py`; CORS for ngrok/production. |

---

## 3. Live Viewer + AI While Flying (Explicit Requirement)

- **Requirement:** User must be able to **see the live drone stream** and **interact with the AI** at the same time while the drone is flying.
- **Civilian dashboard:** When a mode is selected, the **Live Drone Feed** panel (video / analytics / detections) is shown in a **persistent right column** on Plan, Chat, Manual, and Autonomous tabs so the stream is always visible while using AI chat, route planning, or controls.
- **Monitoring tab:** Full-width video/analytics/detections (unchanged).
- **Pilot dashboard:** Video sidebar is always visible next to Control, Mission, Monitoring, and Advanced (including AI chat and LLM commands).

---

## 4. Build & Deploy (from DEPLOYMENT.md)

| Item | Status |
|------|--------|
| Node 20+, Next.js 14 | ✅ |
| Python 3.10+ (backend) | ✅ Optional |
| `.env.local` (API/WS URLs, keys) | ✅ |
| `npm run build` / `npm start` | ✅ |
| Backend: `python src/ground_control_station/server.py` | ✅ |
| Ngrok: `npm run ngrok` (host-header + domain) | ✅ |
| Fly.io / Docker | ✅ Documented |

---

## 5. Safety & Compliance (from DRONE_COMPATIBILITY / AUDIT)

| Item | Status |
|------|--------|
| Error boundaries | ✅ ErrorBoundary component. |
| WebSocket/localStorage error handling | ✅ |
| No sensitive data in client errors | ✅ |
| XSS/role validation (localStorage) | ✅ |
| TypeScript types, no critical `any` | ✅ |

---

## 6. Verification Checklist

- [ ] **Live viewer:** Open Civilian → select mode → open Plan or Chat → confirm **Live Drone Feed** panel on the right with video/analytics/detections.
- [ ] **AI while flying:** On same view, use AI Chat or route buttons; confirm stream remains visible.
- [ ] **Pilot:** Open Pilot → confirm video sidebar on Control/Mission/Monitoring/Advanced.
- [ ] **WebSocket:** Set `NEXT_PUBLIC_WS_URL`; confirm video/detections connect when backend is running.
- [ ] **Backend optional:** With backend down, app still loads; API status shows disconnected.

---

## Summary

The build is intended to meet all stated requirements, including:

1. **Live viewer** for the drone stream (multi-drone, resizable, WebSocket).
2. **AI interaction while flying** via chat, LLM commands, voice, and route AI, with the live viewer visible at the same time on Civilian (persistent right column) and Pilot (sidebar).
3. All planned modes, roles, mission planning, and SDK-ready API are implemented and documented.
