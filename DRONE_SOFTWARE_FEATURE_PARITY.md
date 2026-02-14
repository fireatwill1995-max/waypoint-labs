# Drone Software Feature Parity & Differentiators

This app is built to match or exceed features of leading civilian drone software (DroneDeploy, Dronelink, Litchi, Pix4D, DJI Terra, FlytBase, etc.) and to be more user-friendly with integrated AI and voice.

---

## Feature parity (vs DroneDeploy, Dronelink, Litchi, Pix4D, DJI Terra)

| Feature | This app | Notes |
|--------|----------|--------|
| **Mission planning** | ✅ | Waypoints, 3D preview (Cesium), mission templates, grid/crosshatch/linear patterns (MissionPlanningHub, MiningDashboard). |
| **Waypoint navigation** | ✅ | Add/update/delete waypoints; execute mission. |
| **3D mission preview** | ✅ | CesiumMissionView with terrain. |
| **Multiple workflows** | ✅ | Pre-plan, on-the-fly, hybrid manual/auto. |
| **Mapping types** | ✅ | Grid, crosshatch, linear; terrain follow; survey grids (e.g. mining). |
| **Cross-platform** | ✅ | Web (responsive); same stack can target iOS/Android. |
| **Multi-drone** | ✅ | MultiDroneVideoManager, fleet state, multiple protocols. |
| **Live video / streaming** | ✅ | Video feed and WebSocket real-time. |
| **Telemetry / analytics** | ✅ | AnalyticsDashboard, telemetry panels, flight stats. |
| **Detections** | ✅ | Cattle, hunting, people, fishing, mining; FishDetectionPanel, detections list. |
| **Flight logging / compliance** | ✅ | Flight logs, compliance surfaces (ComplianceDashboard, AirspaceChecker). |
| **Manual + autonomous** | ✅ | ManualControlPanel, AutonomousModeSelector, AI command interfaces. |
| **Supported protocols** | ✅ | 30+ (DJI, Autel, PX4, ArduPilot, Parrot, Skydio, etc.) — see supported-drones. |
| **Dark theme / GCS-style UI** | ✅ | DJI-style theme, glass panels, telemetry-style layout. |
| **Accessibility** | ✅ | Keyboard shortcuts, focus visible, skip-to-content, ARIA where relevant. |

---

## Differentiators (better / more user-friendly)

| Feature | Description |
|--------|-------------|
| **Conversational AI** | Chat with the AI naturally; it suggests routes and actions. Not just “command only” — full conversation. |
| **Confirm-then-execute** | AI can propose an action (e.g. “Execute mission” or “Apply this route”); user confirms or cancels; action runs only after approval. |
| **Voice control** | Web Speech API: speak from headset or built-in mic. Commands go to the AI; confirm in chat to run. Hands-free friendly. |
| **Voice reply (TTS)** | AI replies and confirmation prompts can be read aloud (Speech Synthesis) for headphone-only use. |
| **Unified theme & colors** | Consistent DJI-style dark theme and palette across all pages; focus and contrast tuned for readability. |
| **One place for plan / chat / manual / autonomy** | Civilian dashboard: plan, AI chat, manual control, autonomy, monitoring, and advanced (voice, gesture, VR) in one flow with tabs. |
| **Industry modes** | Cattle, hunting, people, filming, fishing, mining with tailored operations and AI behaviour. |
| **Explainable AI** | ExplainableAIDashboard for decision transparency where applicable. |

---

## APIs and integrations

See **APIS_AND_INTEGRATIONS.md** for the full list of required and optional APIs (Anthropic, Google Maps, backend URL, WebSocket, Cesium, ngrok, FlytBase, DJI, etc.) and the backend contract for `proposed_action` (confirm-then-execute).
