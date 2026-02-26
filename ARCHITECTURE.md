# Architecture & Codebase Map

## Entry points

- **Frontend**: Next.js App Router — `app/layout.tsx` (root), `app/page.tsx` (home), `app/civilian/page.tsx`, `app/pilot/page.tsx` (redirects to `/civilian`), `app/admin/page.tsx`, `app/sign-in/page.tsx`, `app/supported-drones/page.tsx`, `app/military/page.tsx`, `app/api/*` (Next route handlers).
- **Backend**: FastAPI — `src/ground_control_station/server.py` (single server module). Run with `uvicorn`; `sys.path` includes `src`, so imports use `modules.*` and `utils.*`.

## Data flow

- **UI → API**: Frontend uses `useApi()` from `app/lib/api.ts` (base URL from `NEXT_PUBLIC_API_URL`), plus `useWebSocket`/`useCivilianRealtime` for `NEXT_PUBLIC_WS_URL`.
- **Backend**: Server wires `CivilianAIAdvisor`, `CivilianRoutePlanner`, `ClaudeIntegration`; no service layer — route handlers call modules directly. No DB layer; endpoints return in-memory/mock data.

## Layer separation

- **Missing**: Dedicated service layer (business logic lives in route handlers and in `CivilianAIAdvisor`/`CivilianRoutePlanner`). No repository/DB abstraction.
- **Frontend**: Business logic and API calls are mixed in components; `lib/api.ts` is a thin client. Types in `app/types/api.ts`.

## Module boundaries

- **Backend**: `server.py` imports only `civilian_ai_advisor`, `civilian_route_planner`, `claude_integration`. Other Python modules under `src/modules/civilian/` and `src/utils/utils/` are **not** loaded by the running app (see Dead code).
- **Frontend**: `app/components/` is flat; no clear feature-based grouping. Admin components live in `app/components/admin/`.

## Anti-patterns

- **God component**: `app/civilian/page.tsx` is very large (many tabs, many components); consider splitting by tab or feature.
- **Business logic in UI**: Route planning, mode selection, and API orchestration are in page/hook code; consider custom hooks or a small facade layer.
- **Backend**: Single 1000+ line `server.py` with many endpoints; consider splitting by domain (admin, civilian, mining, sdk, websocket).

## Dead code (module level)

- **Frontend components never imported**: `SARDashboard.tsx`, `AgricultureDashboard.tsx`, `FlightLogAnalyzer.tsx`, `OfflineMissionManager.tsx`, `RemoteIDManager.tsx`. Safe to remove or wire into a route when needed.
- **Backend Python never imported by server**: `animal_detector.py`, `camera_manager.py`, `advanced_mustering.py`, `conservation_mode.py`, `size_estimator.py`, `precision_agriculture.py`, `filming_tracker.py` (re-exported in `civilian/__init__.py` but that package is not used by server), `config_loader.py`, `alerting.py`, `performance_monitor.py`, `exceptions.py`. Kept for future use or optional features; not required for current run.

## Folder structure

- **Consistency**: `app/components` mixes shared and page-specific components; `app/components/admin/` is the only subfolder. Consider `app/components/civilian/`, `app/components/shared/` if the tree grows.
- **Backend**: `src/ground_control_station/` contains only `server.py`; `src/modules/civilian/` holds domain logic. Structure is workable; optional move of `server.py` to `src/` or `src/api/` for clarity.

## Fixes applied

### Phase 1
- **`src/utils/utils/alerting.py`**: Imports changed from `src.utils.performance_monitor` / `src.utils.exceptions` to relative `.performance_monitor` and `.exceptions` so they resolve when the run path is `src` (as set by the server).

### Phase 2
- **`requirements.txt`**: Removed duplicate entries (opencv-python, websockets, pyserial, pyserial-asyncio).
- **`requirements-backend.txt`**: Added `psutil` (used by server admin metrics with fallback).

### Phase 3
- **`app/useRealtimeStatus.ts`**: Removed (dead code; no imports; `useCivilianRealtime` is used instead).
- **`app/api/mission/templates/route.ts`**: Added explicit return type, simplified `templates` assignment, defensive `request.nextUrl?.` access.

### Phase 4–5
- **`app/civilian/page.tsx`**: Request bodies now passed as objects to `fetchWithAuth` (API layer stringifies) for consistency and to avoid double-stringify.
- **`app/api/status/route.ts`**: Validate backend response is a plain object before proxying; otherwise return OFFLINE_STATUS.

### Phase 10 (Security)
- **`app/lib/demoAuth.ts`**: Demo admin password now read from `NEXT_PUBLIC_DEMO_ADMIN_PASSWORD` with fallback for dev; documented in `.env.example`.
