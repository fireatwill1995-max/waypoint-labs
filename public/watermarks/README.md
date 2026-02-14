# Watermark backgrounds

- **control-center.png** — Default watermark (control center / landscape). Used on home, sign-in, sign-up, select-role, and any page without a section watermark.
- **mustering.png** — Civilian dashboard (`/civilian`).
- **hunting.png** — Admin dashboard (`/admin`).
- **fishing.png** — Supported Drones (`/supported-drones`).
- **coastal-surveillance.png** — Pilot / Military (`/pilot`, `/military`).

Source images live in `source/` (4-way image as `4way.png`, single image as `control-center.png`). To regenerate the quadrant images after updating sources, run:

```bash
npm run watermarks:split
```
