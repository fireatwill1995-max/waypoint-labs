"""
FastAPI Backend Server for JARVIS AI Civilian Drone App
"""
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
import json
import asyncio
from datetime import datetime

# Import civilian modules
import sys
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from modules.civilian.civilian_ai_advisor import CivilianAIAdvisor, OperationType
from modules.civilian.civilian_route_planner import CivilianRoutePlanner, RouteType
from modules.civilian.claude_integration import ClaudeIntegration

app = FastAPI(
    title="JARVIS AI Civilian Drone API",
    description="Backend API for civilian drone operations",
    version="1.0.0"
)

# CORS - allow localhost, 3001, and CORS_ORIGINS (e.g. ngrok URL). Set CORS_ALLOW_ALL=1 to allow any origin (dev/ngrok).
_cors_origins = [
    "http://localhost:3000", "http://127.0.0.1:3000",
    "http://localhost:3001", "http://127.0.0.1:3001",
    "http://localhost:3002", "http://127.0.0.1:3002",
]
_extra = (os.getenv("CORS_ORIGINS") or "").strip()
if _extra:
    _cors_origins = _cors_origins + [s.strip() for s in _extra.split(",") if s.strip()]
if os.getenv("CORS_ALLOW_ALL") == "1":
    _cors_origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=_cors_origins != ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize modules with default config
default_config = {
    "ai": {
        "enabled": True,
        "model": "default"
    },
    "route_planning": {
        "enabled": True,
        "optimization": "standard"
    }
}

# Initialize Claude integration
claude_integration = None
try:
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")
    if anthropic_key:
        claude_integration = ClaudeIntegration(api_key=anthropic_key)
        print("[OK] Claude Integration initialized")
    else:
        print("[WARN] Claude Integration not available: No ANTHROPIC_API_KEY found")
except Exception as e:
    print(f"[WARN] Could not initialize Claude Integration: {e}")

# Initialize AI Advisor with Claude integration
try:
    ai_advisor = CivilianAIAdvisor(config=default_config, claude_integration=claude_integration)
    if claude_integration:
        print("[OK] AI Advisor initialized with Claude integration")
    else:
        print("[OK] AI Advisor initialized (without Claude integration)")
except Exception as e:
    print(f"[WARN] Could not initialize AI Advisor: {e}")
    ai_advisor = None

# Initialize Route Planner
try:
    route_planner = CivilianRoutePlanner(config=default_config, ai_advisor=ai_advisor)
    print("[OK] Route Planner initialized")
except Exception as e:
    print(f"[WARN] Could not initialize Route Planner: {e}")
    route_planner = None

# WebSocket connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        try:
            self.active_connections.remove(websocket)
        except ValueError:
            # WebSocket already removed, ignore
            pass

    async def send_personal_message(self, message: str, websocket: WebSocket):
        try:
            await websocket.send_text(message)
        except Exception as e:
            # Log error but don't raise - connection may be closed
            print(f"[WARN] Failed to send WebSocket message: {e}")

    async def broadcast(self, message: dict):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                # Mark for removal if connection is closed
                print(f"[WARN] Failed to broadcast to WebSocket: {e}")
                disconnected.append(connection)
        
        # Remove disconnected connections
        for conn in disconnected:
            try:
                self.active_connections.remove(conn)
            except ValueError:
                pass

manager = ConnectionManager()

# Pydantic models
class StatusResponse(BaseModel):
    running: bool
    authenticated: bool = True
    user_id: Optional[str] = None
    drones_online: Optional[int] = 0
    connections: Optional[int] = 0
    version: Optional[str] = "1.0.0"
    timestamp: Optional[str] = None

class DetectionRequest(BaseModel):
    image_url: Optional[str] = None
    mode: Optional[str] = None

class DetectionResponse(BaseModel):
    detections: List[Dict[str, Any]]
    confidence: float

class RoutePlanRequest(BaseModel):
    operation: str
    mode: str
    location: Optional[Dict[str, float]] = None
    destination: Optional[Dict[str, float]] = None

class AIChatRequest(BaseModel):
    message: str
    mode: str
    conversation_history: Optional[List[Dict[str, str]]] = None

class AIChatResponse(BaseModel):
    response: str
    route: Optional[Dict[str, Any]] = None
    advice: Optional[str] = None

# Health check - shape matches frontend ApiStatus
@app.get("/api/status")
async def get_status():
    """Health check endpoint - SDK-ready API"""
    return {
        "running": True,
        "authenticated": True,
        "user_id": None,
        "drones_online": 0,
        "connections": len(manager.active_connections),
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
    }

# Admin endpoints
@app.get("/api/admin/metrics")
async def get_system_metrics():
    """Get system metrics for admin dashboard"""
    try:
        import psutil
        import time
        
        # Get system metrics
        cpu_usage = psutil.cpu_percent(interval=0.1)
        memory = psutil.virtual_memory()
        memory_usage = memory.percent
        
        # Calculate system uptime (simplified - in production, track actual start time)
        system_uptime = int(time.time()) % 86400  # Mock uptime
        
        return {
            "system_status": "operational",
            "active_drones": 0,  # TODO: Track actual active drones
            "total_detections": 0,  # TODO: Track actual detections
            "active_tracks": 0,  # TODO: Track actual tracks
            "system_uptime": system_uptime,
            "cpu_usage": round(cpu_usage, 2),
            "memory_usage": round(memory_usage, 2),
            "network_latency": 0.0,  # TODO: Measure actual latency
            "error_rate": 0.0,  # TODO: Track actual error rate
            "active_users": len(manager.active_connections),  # WebSocket connections as proxy
            "api_requests_per_minute": 0  # TODO: Track actual request rate
        }
    except ImportError:
        # Fallback if psutil is not available
        return {
            "system_status": "operational",
            "active_drones": 0,
            "total_detections": 0,
            "active_tracks": 0,
            "system_uptime": 0,
            "cpu_usage": 0.0,
            "memory_usage": 0.0,
            "network_latency": 0.0,
            "error_rate": 0.0,
            "active_users": len(manager.active_connections),
            "api_requests_per_minute": 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/performance")
async def get_performance_data():
    """Get performance monitoring data"""
    try:
        import psutil
        return {
            "data": [
                {
                    "timestamp": datetime.now().isoformat(),
                    "cpu": psutil.cpu_percent(interval=0.1),
                    "memory": psutil.virtual_memory().percent,
                    "network": 0.0,  # TODO: Track network usage
                    "disk": psutil.disk_usage('/').percent if os.name != 'nt' else 0.0,
                    "requests_per_second": 0.0,
                    "response_time": 0.0,
                    "error_rate": 0.0
                }
            ]
        }
    except ImportError:
        return {"data": []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/security")
async def get_security_settings():
    """Get security settings"""
    return {
        "two_factor_enabled": False,
        "session_timeout": 3600,
        "password_policy": {
            "min_length": 8,
            "require_uppercase": True,
            "require_lowercase": True,
            "require_numbers": True,
            "require_special": True
        },
        "ip_whitelist": [],
        "audit_logging": True
    }

@app.post("/api/admin/security")
async def update_security_settings(settings: Dict[str, Any]):
    """Update security settings"""
    return {"success": True, "message": "Security settings updated"}

@app.get("/api/admin/config")
async def get_system_config():
    """Get system configuration"""
    return {
        "sections": [
            {
                "id": "general",
                "name": "General Settings",
                "settings": [
                    {"key": "app_name", "value": "JARVIS AI Drone", "type": "string"},
                    {"key": "debug_mode", "value": False, "type": "boolean"}
                ]
            }
        ]
    }

@app.post("/api/admin/config")
async def update_system_config(config: Dict[str, Any]):
    """Update system configuration"""
    return {"success": True, "message": "Configuration updated"}

@app.get("/api/admin/audit-logs")
async def get_audit_logs(skip: int = 0, limit: int = 50):
    """Get audit logs"""
    return {
        "logs": [],
        "total": 0
    }

@app.get("/api/admin/users")
async def get_users():
    """Get all users"""
    return {
        "users": []
    }

@app.post("/api/admin/users/role")
async def update_user_role(request: Dict[str, Any]):
    """Update user role"""
    return {"success": True, "message": "User role updated"}

@app.post("/api/admin/users/status")
async def update_user_status(request: Dict[str, Any]):
    """Update user status"""
    return {"success": True, "message": "User status updated"}

@app.delete("/api/admin/users/{user_id}")
async def delete_user(user_id: str):
    """Delete a user"""
    return {"success": True, "message": "User deleted"}

# Fleet management endpoints
@app.get("/api/fleet/drones")
async def get_fleet_drones(status: Optional[str] = None):
    """Get fleet drones"""
    return {
        "drones": []
    }

@app.get("/api/fleet/health")
async def get_fleet_health():
    """Get fleet health metrics"""
    return {
        "health": {
            "total": 0,
            "idle": 0,
            "in_mission": 0,
            "maintenance": 0,
            "error": 0,
            "average_battery": 0.0,
            "average_health_score": 0.0,
            "total_flight_hours": 0.0
        }
    }

# Advanced features endpoints
@app.get("/api/advanced/features/summary")
async def get_advanced_features_summary():
    """Get advanced features summary"""
    return {
        "enabled": False,
        "features": {
            "anti_jamming": False,
            "anti_tracking": False,
            "auto_evade": False,
            "track_correction": False,
            "multi_drone": False,
            "ai_engine": False
        }
    }

@app.get("/api/advanced/anti-jamming/status")
async def get_anti_jamming_status():
    """Get anti-jamming status"""
    return {
        "enabled": False,
        "status": "inactive",
        "detections": 0
    }

@app.get("/api/advanced/anti-tracking/status")
async def get_anti_tracking_status():
    """Get anti-tracking status"""
    return {
        "enabled": False,
        "status": "inactive",
        "threats_detected": 0
    }

@app.get("/api/advanced/auto-evade/status")
async def get_auto_evade_status():
    """Get auto-evade status"""
    return {
        "enabled": False,
        "status": "inactive",
        "evasions_performed": 0
    }

@app.get("/api/advanced/track-correction/status")
async def get_track_correction_status():
    """Get track correction status"""
    return {
        "enabled": False,
        "status": "inactive",
        "corrections_applied": 0
    }

@app.get("/api/advanced/multi-drone/status")
async def get_multi_drone_status():
    """Get multi-drone coordination status"""
    return {
        "enabled": False,
        "status": "inactive",
        "active_coordinations": 0
    }

@app.get("/api/advanced/ai-engine/status")
async def get_ai_engine_status():
    """Get AI engine status"""
    return {
        "enabled": ai_advisor is not None,
        "status": "active" if ai_advisor else "inactive",
        "model": "default"
    }

# Civilian detection endpoints
@app.post("/api/civilian/detect")
async def detect_objects(request: DetectionRequest):
    """Detect objects in images"""
    try:
        # Mock detection for now - replace with actual detection logic
        return DetectionResponse(
            detections=[
                {"type": "animal", "confidence": 0.85, "bbox": [100, 100, 200, 200]},
            ],
            confidence=0.85
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/civilian/camera/add")
async def add_camera(camera_data: Dict[str, Any]):
    """Add a camera source"""
    try:
        return {"success": True, "camera_id": "camera_1"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/civilian/analyze")
async def analyze_image(analysis_data: Dict[str, Any]):
    """Analyze image for civilian operations"""
    try:
        return {"analysis": "completed", "results": {}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# AI advice endpoints
@app.post("/api/civilian/ai/filming-advice")
async def get_filming_advice(request: Dict[str, Any]):
    """Get AI advice for filming operations"""
    try:
        if not ai_advisor:
            return {"advice": "AI advisor not available", "recommendations": []}
        operation_type = OperationType(request.get("operation_type", "filming_wedding"))
        advice = await ai_advisor.get_filming_advice(
            operation_type=operation_type,
            location=request.get("location", {}),
            subject_info=request.get("subject"),
            weather=request.get("conditions", {})
        )
        return {
            "advice": f"Recommended altitude: {advice.recommended_altitude}m, Speed: {advice.recommended_speed}m/s",
            "recommendations": advice.framing_tips
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/civilian/ai/mustering-advice")
async def get_mustering_advice(request: Dict[str, Any]):
    """Get AI advice for mustering operations"""
    try:
        if not ai_advisor:
            return {"advice": "AI advisor not available", "recommendations": []}
        advice = await ai_advisor.get_mustering_advice(
            herd_size=request.get("herd_size", 0),
            terrain=request.get("terrain", {}),
            weather=request.get("weather", {})
        )
        return {
            "advice": f"Recommended altitude: {advice.recommended_altitude}m, Speed: {advice.recommended_speed}m/s",
            "recommendations": advice.optimization_tips
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/civilian/ai/hunting-advice")
async def get_hunting_advice(request: Dict[str, Any]):
    """Get AI advice for hunting operations"""
    try:
        if not ai_advisor:
            return {"advice": "AI advisor not available", "recommendations": []}
        target_location = request.get("location", {}) or request.get("target_location", {}) or {"lat": 0.0, "lon": 0.0}
        animal_type = request.get("target_species") or request.get("animal_type", "deer")
        advice = await ai_advisor.get_hunting_advice(
            target_location=target_location,
            animal_type=animal_type,
            terrain=request.get("terrain", {}),
            weather=request.get("weather", {})
        )
        return {
            "advice": f"Recommended altitude: {advice.recommended_altitude}m, Speed: {advice.recommended_speed}m/s",
            "recommendations": advice.safety_considerations
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/civilian/ai/general-advice")
async def get_general_advice(request: Dict[str, Any]):
    """Get general AI advice"""
    try:
        if not ai_advisor:
            return {"advice": "AI advisor not available", "recommendations": []}
        operation_type_str = request.get("operation_type", "surveying")
        try:
            operation_type = OperationType(operation_type_str)
        except ValueError:
            # Default to surveying if invalid operation type
            operation_type = OperationType.SURVEYING
        
        context = request.get("context", {})
        advice = await ai_advisor.get_general_advice(
            operation_type=operation_type,
            context=context
        )
        return {
            "advice": advice.advice if hasattr(advice, 'advice') else str(advice),
            "recommendations": advice.recommendations if hasattr(advice, 'recommendations') else []
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/civilian/ai/chat")
async def ai_chat(request: AIChatRequest):
    """AI chat endpoint for conversational assistance"""
    try:
        if not ai_advisor:
            return AIChatResponse(
                response="AI advisor not available. Please configure Claude API key.",
                advice="AI advisor not available"
            )
        
        # Use Claude integration if available, otherwise return default response
        if claude_integration and claude_integration.running:
            context = {
                "mode": request.mode,
                "conversation_history": request.conversation_history or []
            }
            system_prompt = f"You are JARVIS AI, an expert assistant for civilian drone operations in {request.mode} mode. Provide helpful, concise advice."
            response_text = await claude_integration.generate_expert_advice(
                question=request.message,
                context=context,
                system_prompt=system_prompt
            )
        else:
            # Default response when Claude is not available
            response_text = f"I understand you want help with: \"{request.message}\" in {request.mode} mode. I can assist with route planning, operation advice, and mission coordination."
        
        return AIChatResponse(
            response=response_text,
            advice=response_text
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Route planning endpoints
@app.post("/api/civilian/route/plan-filming")
async def plan_filming_route(request: RoutePlanRequest):
    """Plan a filming route"""
    try:
        if not route_planner:
            return {"route": {"waypoints": [], "distance": 0, "estimated_time": 0}}
        start_pos = request.location or {"lat": 0.0, "lon": 0.0}
        subject_positions = [request.destination] if request.destination else [start_pos]
        route = await route_planner.plan_filming_route(
            start_pos=start_pos,
            subject_positions=subject_positions,
            operation_type=request.operation or "wedding"
        )
        return {
            "route": {
                "waypoints": [{"lat": wp.lat, "lon": wp.lon, "alt": wp.altitude} for wp in route.waypoints],
                "distance": route.total_distance,
                "estimated_time": route.estimated_duration
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/civilian/route/plan-mustering")
async def plan_mustering_route(request: RoutePlanRequest):
    """Plan a mustering route"""
    try:
        if not route_planner:
            return {"route": {"waypoints": [], "distance": 0, "estimated_time": 0}}
        herd_location = request.location or {"lat": 0.0, "lon": 0.0}
        destination = request.destination or {"lat": 0.0, "lon": 0.0}
        herd_size = int(request.operation) if request.operation and request.operation.isdigit() else 0
        route = await route_planner.plan_mustering_route(
            herd_location=herd_location,
            destination=destination,
            herd_size=herd_size
        )
        return {
            "route": {
                "waypoints": [{"lat": wp.lat, "lon": wp.lon, "alt": wp.altitude} for wp in route.waypoints],
                "distance": route.total_distance,
                "estimated_time": route.estimated_duration
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/civilian/route/plan-hunting")
async def plan_hunting_route(request: RoutePlanRequest):
    """Plan a hunting route"""
    try:
        if not route_planner:
            return {"route": {"waypoints": [], "distance": 0, "estimated_time": 0}}
        start_pos = request.location or {"lat": 0.0, "lon": 0.0}
        target_location = request.destination or {"lat": 0.0, "lon": 0.0}
        route = await route_planner.plan_hunting_route(
            start_pos=start_pos,
            target_location=target_location,
            animal_type=request.operation or "deer"
        )
        return {
            "route": {
                "waypoints": [{"lat": wp.lat, "lon": wp.lon, "alt": wp.altitude} for wp in route.waypoints],
                "distance": route.total_distance,
                "estimated_time": route.estimated_duration
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/civilian/route/plan-fishing")
async def plan_fishing_route(request: RoutePlanRequest):
    """Plan a fishing route"""
    try:
        if not route_planner:
            return {"route": {"waypoints": [], "distance": 0, "estimated_time": 0}}
        # Use general route planning for fishing (no specific fishing route function exists)
        start_pos = request.location or {"lat": 0.0, "lon": 0.0}
        end_pos = request.destination or {"lat": 0.0, "lon": 0.0}
        route = await route_planner.plan_general_route(
            start_pos=start_pos,
            end_pos=end_pos
        )
        return {
            "route": {
                "waypoints": [{"lat": wp.lat, "lon": wp.lon, "alt": wp.altitude} for wp in route.waypoints],
                "distance": route.total_distance,
                "estimated_time": route.estimated_duration
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/civilian/route/plan")
async def plan_general_route(request: RoutePlanRequest):
    """Plan a general route"""
    try:
        if not route_planner:
            return {"route": {"waypoints": [], "distance": 0, "estimated_time": 0}}
        start_pos = request.location or {"lat": 0.0, "lon": 0.0}
        end_pos = request.destination or {"lat": 0.0, "lon": 0.0}
        route = await route_planner.plan_general_route(
            start_pos=start_pos,
            end_pos=end_pos
        )
        return {
            "route": {
                "waypoints": [{"lat": wp.lat, "lon": wp.lon, "alt": wp.altitude} for wp in route.waypoints],
                "distance": route.total_distance,
                "estimated_time": route.estimated_duration
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/civilian/route/execute")
async def execute_route(request: Dict[str, Any]):
    """Execute a route plan"""
    try:
        return {"success": True, "status": "executing", "message": "Route execution started"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/civilian/route/execute-ai")
async def execute_ai_route(request: Dict[str, Any]):
    """Execute an AI-generated route"""
    try:
        return {"success": True, "status": "executing", "reason": "AI route execution started"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/civilian/route/recommend")
async def recommend_route(request: Dict[str, Any]):
    """Get AI route recommendation"""
    try:
        return {
            "route": {
                "waypoints": [],
                "reason": "AI recommendation based on current conditions"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/civilian/route/cleanup")
async def cleanup_route(request: Dict[str, Any]):
    """Cleanup route planning"""
    try:
        return {"route": None, "reason": "Route cleanup completed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Fishing endpoints
@app.post("/api/civilian/fishing/start-scout")
async def start_fishing_scout(request: Dict[str, Any]):
    """Start fishing scout operation"""
    try:
        return {"success": True, "scout_id": "scout_1"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/civilian/fishing/detect-fish")
async def detect_fish(request: Dict[str, Any]):
    """Detect fish in images"""
    try:
        return {"detections": [], "confidence": 0.0}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Tracking endpoints
@app.get("/api/civilian/tracking/status")
async def get_tracking_status():
    """Get tracking status"""
    try:
        return {"status": "active", "tracking_count": 0}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/civilian/tracking/advice")
async def get_tracking_advice(request: Dict[str, Any]):
    """Get tracking advice"""
    try:
        return {"advice": "Tracking advice based on current conditions"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Drone command endpoints
@app.post("/api/civilian/drone/ai-command")
async def ai_drone_command(request: Dict[str, Any]):
    """Process AI drone command"""
    try:
        return {
            "command": {
                "action": request.get("command", ""),
                "safety_approved": True,
                "confidence": 0.9
            },
            "safety_warnings": []
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/civilian/drone/command")
async def drone_command(request: Dict[str, Any]):
    """Send drone command"""
    try:
        return {"success": True, "command_id": "cmd_1"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/civilian/drone/execute-coordination")
async def execute_coordination(request: Dict[str, Any]):
    """Execute multi-drone coordination"""
    try:
        return {"success": True, "coordination_id": "coord_1"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Mining (Australia) endpoints ---
@app.get("/api/mining/compliance/status")
async def get_mining_compliance_status():
    """Australian compliance: CASA Part 101, Remote ID, airspace, blast zone"""
    return {
        "casa_part101": True,
        "remote_id": True,
        "airspace_clear": True,
        "blast_zone_active": False,
        "last_updated": datetime.now().isoformat(),
    }


def _generate_survey_grid(
    center_lat: float, center_lon: float,
    rows: int, cols: int, spacing_m: float, alt: float = 50.0
) -> List[Dict[str, Any]]:
    """Generate survey grid waypoints (lat/lon in degrees, spacing in meters)."""
    import math
    waypoints = []
    # Approx meters per degree at this latitude
    m_per_deg_lat = 111000.0
    m_per_deg_lon = 111000.0 * max(0.01, math.cos(math.radians(center_lat)))
    half_r = (rows - 1) / 2.0 if rows > 1 else 0
    half_c = (cols - 1) / 2.0 if cols > 1 else 0
    for r in range(rows):
        for c in range(cols):
            dlat = (r - half_r) * spacing_m / m_per_deg_lat
            dlon = (c - half_c) * spacing_m / m_per_deg_lon
            wp = {
                "id": f"mining_wp_{r}_{c}",
                "lat": center_lat + dlat,
                "lon": center_lon + dlon,
                "alt": alt,
                "name": f"Survey {r * cols + c + 1}",
            }
            waypoints.append(wp)
    return waypoints


@app.post("/api/mining/survey/grid")
async def plan_mining_survey_grid(request: Dict[str, Any]):
    """Plan pit/stockpile survey grid; returns waypoints and route."""
    try:
        loc = request.get("location") or {}
        lat = float(loc.get("lat", 0.0))
        lon = float(loc.get("lon", 0.0))
        rows = int(request.get("rows", 5))
        cols = int(request.get("cols", 5))
        spacing_m = float(request.get("spacing_m", 20.0))
        rows = max(2, min(20, rows))
        cols = max(2, min(20, cols))
        spacing_m = max(5.0, min(100.0, spacing_m))
        waypoints = _generate_survey_grid(lat, lon, rows, cols, spacing_m)
        route = {
            "waypoints": waypoints,
            "distance_km": (len(waypoints) - 1) * spacing_m / 1000.0 if waypoints else 0,
            "estimated_time_minutes": len(waypoints) * 0.5,
        }
        return {"route": route, "waypoints": waypoints}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/mining/inspection/templates")
async def get_mining_inspection_templates():
    """Inspection templates: conveyor, highwall, stockpile, etc."""
    return {
        "templates": [
            {"id": "conveyor", "name": "Conveyor Run", "waypoint_count": 8},
            {"id": "highwall", "name": "Highwall Survey", "waypoint_count": 12},
            {"id": "stockpile", "name": "Stockpile Perimeter", "waypoint_count": 6},
            {"id": "tailings", "name": "Tailings Dam", "waypoint_count": 10},
            {"id": "haul-road", "name": "Haul Road", "waypoint_count": 5},
        ]
    }


@app.post("/api/mining/route/plan")
async def plan_mining_route(request: Dict[str, Any]):
    """Plan general mining route (inspection, incident, etc.)."""
    try:
        start = request.get("location") or {"lat": 0.0, "lon": 0.0}
        end = request.get("destination") or start
        if route_planner:
            route = await route_planner.plan_general_route(
                start_pos={"lat": float(start.get("lat", 0)), "lon": float(start.get("lon", 0))},
                end_pos={"lat": float(end.get("lat", 0)), "lon": float(end.get("lon", 0))},
            )
            return {
                "route": {
                    "waypoints": [{"id": f"wp_{i}", "lat": wp.lat, "lon": wp.lon, "alt": wp.altitude, "name": wp.description} for i, wp in enumerate(route.waypoints)],
                    "distance_km": route.total_distance / 1000.0,
                    "estimated_time_minutes": route.estimated_duration / 60.0,
                }
            }
        waypoints = [
            {"id": "wp_0", "lat": float(start.get("lat", 0)), "lon": float(start.get("lon", 0)), "alt": 50, "name": "Start"},
            {"id": "wp_1", "lat": float(end.get("lat", 0)), "lon": float(end.get("lon", 0)), "alt": 50, "name": "End"},
        ]
        return {"route": {"waypoints": waypoints, "distance_km": 0, "estimated_time_minutes": 0}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/mining/volume/estimate")
async def estimate_mining_volume(request: Dict[str, Any]):
    """Estimate stockpile/pit volume from survey data (placeholder)."""
    waypoints = request.get("waypoints") or []
    if not waypoints:
        return {"volume_m3": 0, "area_m2": 0, "message": "No waypoints provided"}
    return {"volume_m3": 0, "area_m2": 0, "message": "Wire to photogrammetry/volumetric module"}

# --- SDK-ready endpoints (wire to MAVLink/DroneKit/real drone later) ---
class SDKCommandRequest(BaseModel):
    command: str  # takeoff, land, goto, rtl, arm, disarm, etc.
    params: Optional[Dict[str, Any]] = None  # e.g. {"lat": 0, "lon": 0, "alt": 100}

class SDKWaypointRequest(BaseModel):
    waypoints: List[Dict[str, float]]  # [{"lat", "lon", "alt"}, ...]

@app.post("/api/sdk/command")
async def sdk_command(request: SDKCommandRequest):
    """SDK-ready: send command to drone (wire to MAVLink/DroneKit in production)."""
    cmd = (request.command or "").strip().lower()
    if not cmd:
        raise HTTPException(status_code=400, detail="command required")
    # Accepted commands for SDK integration
    allowed = ("takeoff", "land", "rtl", "arm", "disarm", "goto", "pause", "resume", "set_speed", "set_altitude")
    if cmd not in allowed and not cmd.startswith("custom_"):
        raise HTTPException(status_code=400, detail=f"unknown command: {cmd}")
    return {
        "success": True,
        "command": cmd,
        "params": request.params,
        "message": f"Command '{cmd}' accepted (SDK-ready)",
        "timestamp": datetime.now().isoformat(),
    }

@app.post("/api/sdk/waypoints")
async def sdk_waypoints(request: SDKWaypointRequest):
    """SDK-ready: upload waypoint mission (wire to drone SDK in production)."""
    wps = request.waypoints or []
    if not wps:
        raise HTTPException(status_code=400, detail="waypoints required")
    return {
        "success": True,
        "count": len(wps),
        "waypoints": wps,
        "message": "Waypoints accepted (SDK-ready)",
        "timestamp": datetime.now().isoformat(),
    }

@app.get("/api/sdk/telemetry")
async def sdk_telemetry():
    """SDK-ready: get current telemetry (wire to drone in production)."""
    return {
        "position": {"lat": 0.0, "lon": 0.0, "alt": 0.0},
        "heading": 0.0,
        "speed": 0.0,
        "battery": 100,
        "mode": "STABILIZE",
        "armed": False,
        "timestamp": datetime.now().isoformat(),
    }

@app.get("/api/sdk/drones")
async def sdk_drones():
    """SDK-ready: list connected drones (wire to GCS/drone manager)."""
    return {"drones": [], "count": 0}

# WebSocket endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates"""
    await manager.connect(websocket)
    try:
        while True:
            try:
                data = await websocket.receive_text()
                # Echo back or process message
                await manager.send_personal_message(f"Echo: {data}", websocket)
            except WebSocketDisconnect:
                break
            except Exception as e:
                print(f"[WARN] WebSocket error: {e}")
                break
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(websocket)

if __name__ == "__main__":
    import os
    # Change to project root directory
    os.chdir(os.path.join(os.path.dirname(__file__), '..', '..'))
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info"
    )
