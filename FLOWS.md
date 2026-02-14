# Step-by-Step Flows: Mining Survey & Pilot Mission

## Prerequisites

1. **Start the backend** (optional but required for live API/WebSocket):
   ```bash
   python src/ground_control_station/server.py
   ```
   Runs on `http://localhost:8000`.

2. **Start the frontend**:
   ```bash
   npx next dev -p 3001 -H 0.0.0.0
   ```
   App at `http://localhost:3001`.

3. **Sign in**: Open app → **Demo Login** → use any demo account (e.g. **Use** on Demo User) → you are redirected to **Select Role**.

---

## Flow 1: Mining Survey (Australia)

**Goal:** Plan a pit/stockpile survey grid, check CASA compliance, and generate waypoints.

### Steps

1. **Select Civilian role**  
   On **Select Role**, click **Civilian** (or **Continue to Dashboard** to go to civilian).

2. **Open Civilian dashboard**  
   You see mode cards: Cattle, Hunting, People, Filming, Fishing, **Mining (Australia)**.

3. **Choose Mining mode**  
   Click **Mining (Australia)**. The **Operation Planning** tab is active.

4. **Pick a mining operation**  
   Under **Operation Type**, choose one of:
   - **Pit & Stockpile Survey** – survey grid + volumetric (needs Location + Destination).
   - **Infrastructure Inspection** – conveyors, highwalls, etc. (needs Location).
   - **Safety & Exclusion Zone** – blast exclusion (Location + Destination).
   - **Environmental & Rehab** – fauna, vegetation (Location).
   - **Dust & Visual Monitoring** – dust/compliance (Location).
   - **Incident Response** – quick deployment (Location + Destination).
   - **Stockpile Volume Estimate** – volume from survey (Location).

5. **Enter location (and destination if required)**  
   - **Location:** Latitude, Longitude (e.g. `-23.6980`, `133.8807` for Australia).
   - **Destination:** If the operation needs it, fill Destination lat/lon (can be same as location for grid center).

6. **Use Mining Dashboard (survey grid)**  
   Below Operation Type you see **Mining Operations (Australia)**:
   - **Survey Grid:** Set **Rows**, **Cols**, **Spacing (m)** (e.g. 5, 5, 20).
   - Click **Generate Survey Grid** (uses current Location as center).  
   - Waypoints and route are generated (from backend if running, else client-side fallback).

7. **Check Australian compliance**  
   In the same Mining section:
   - Click **Check Compliance Status**.
   - View CASA Part 101, Remote ID, Airspace clear, Blast zone.

8. **Load inspection templates**  
   - Click **Load Templates**.
   - See Conveyor Run, Highwall Survey, Stockpile Perimeter, etc.

9. **Plan route (alternative to Mining Dashboard)**  
   If you chose an operation (e.g. **Pit & Stockpile Survey**) and filled Location (and Destination if needed):
   - Click **Plan Route**.  
   - Backend returns waypoints and route; they appear in **Planned Route** and on the mission view.

10. **View waypoints / execute**  
   - **Planned Route** shows the route JSON.  
   - **Cesium Mission View** (e.g. in Manual or Mission tab) shows waypoints on the map.  
   - Use **Execute Mission** (or **Let AI Take Over**) to run the mission when the backend/drone is wired.

---

## Flow 2: Pilot Mission

**Goal:** Plan a mission, add waypoints, use AI chat and autonomy, and monitor video/analytics.

### Steps

1. **Select Pilot role**  
   On **Select Role**, click **Pilot**. (You must be signed in; if not, sign in first.)

2. **Open Pilot Control Center**  
   You see status bar (API, WebSocket), **Quick Actions**, and tabs: **Flight Control**, **Mission Planning**, **Monitoring**, **Advanced**.

3. **Flight Control tab (1)**  
   - **Manual Control:** Add waypoints (Lat, Lon, Alt) and **Add Waypoint**; then **Execute Mission**.
   - **Autonomous Mode:** Choose Manual, Semi-Auto, Auto Follow, or Full Autonomous (e.g. for filming).

4. **Mission Planning tab (2)**  
   - **Cesium Mission View:** Add/update/delete waypoints on the map.
   - **LLM Command:** Type a natural-language command (e.g. “Move drone 1 to 37.77, -122.42 at 100m”) and process it; waypoints can be added from the result.

5. **Monitoring tab (3)**  
   - **Multi-Drone Video:** Add drones, see live feed (when `NEXT_PUBLIC_WS_URL` and backend are set).
   - **Analytics:** View analytics dashboard for the current feed/detections.

6. **Advanced tab (4)**  
   - **AI Chat:** Ask for mission/route advice (mode is “filming” for pilot); quick actions and route generation available.
   - **Explainable AI:** View AI reasoning/explainability.
   - **Voice Control:** Speak commands; toast shows the recognized command.
   - **Gesture Control:** Use touch/gesture; toast shows the detected gesture.
   - **VR Mission Control** and **Multi-Screen Control** for extended workflows.

7. **Sidebar (right)**  
   - Switch **Video** / **Analytics** / **Detections**.
   - Video and analytics match the main Monitoring content; detections list shows current detections.

8. **Execute a mission**  
   - Add waypoints via Manual Control or Mission Planning (Cesium or LLM).
   - Use **Execute Mission** (or the equivalent in Manual Control) when ready.  
   - With the backend running and SDK/drone wired, commands are sent to the drone.

---

## Quick reference

| Flow            | Role    | Main entry                    | Key actions                                              |
|-----------------|---------|-------------------------------|----------------------------------------------------------|
| Mining survey   | Civilian| Mining (Australia) → Plan    | Location/destination → Survey grid or Plan Route → Execute |
| Pilot mission   | Pilot   | Flight Control / Mission      | Waypoints (manual or Cesium/LLM) → Execute / AI chat     |

Backend optional for UI; required for live API, WebSocket, and real drone/SDK execution.
