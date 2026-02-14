# API Keys Configuration

## Configured API Keys

### Claude API (Anthropic)
- **Key**: Set via environment variable `ANTHROPIC_API_KEY`
- **Location**: Backend server (`src/ground_control_station/server.py`)
- **Usage**: AI-powered advice for filming, mustering, hunting operations

### Google Maps API
- **Key**: Set via `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in `.env.local`
- **Location**: Frontend (`next.config.js` and `.env.local`)
- **Usage**: Map displays and location services

## Environment Variables

### For Backend (Python/FastAPI)
Set these environment variables before starting the backend server:

**Windows PowerShell:**
```powershell
$env:ANTHROPIC_API_KEY="<your-anthropic-api-key>"
```

**Linux/Mac:**
```bash
export ANTHROPIC_API_KEY="<your-anthropic-api-key>"
```

**Or create a `.env` file in the project root:**
```
ANTHROPIC_API_KEY=<your-anthropic-api-key>
```

### For Frontend (Next.js)
Create a `.env.local` file in the project root:

```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<your-google-maps-api-key>
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

## Starting Servers

### Backend Server
```bash
# Set ANTHROPIC_API_KEY in env, then:
python -m uvicorn src.ground_control_station.server:app --host 127.0.0.1 --port 8000 --reload

# Or use the batch file
start_server.bat
```

### Frontend Server
```bash
npm run dev
```

## Verification

1. **Backend API**: http://127.0.0.1:8000/api/status
2. **Frontend**: http://localhost:3000/civilian
3. **AI Chat**: Test the AI chat in the civilian dashboard
4. Get keys from Anthropic and Google Cloud consoles; never commit real keys to git.
