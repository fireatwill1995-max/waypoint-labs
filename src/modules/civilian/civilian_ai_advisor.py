"""
Civilian AI Advisor - Provides AI-powered advice for civilian drone operations
Supports filming (weddings, advertisements), mustering, hunting, and general operations
"""
import asyncio
import json
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from loguru import logger
from enum import Enum


class OperationType(Enum):
    """Types of civilian operations"""
    FILMING_WEDDING = "filming_wedding"
    FILMING_ADVERTISEMENT = "filming_advertisement"
    FILMING_EVENT = "filming_event"
    MUSTERING = "mustering"
    HUNTING = "hunting"
    SURVEYING = "surveying"
    INSPECTION = "inspection"
    SEARCH_RESCUE = "search_rescue"


@dataclass
class FilmingAdvice:
    """AI advice for filming operations"""
    recommended_altitude: float
    recommended_speed: float
    camera_angles: List[str]
    shot_sequence: List[Dict[str, Any]]
    lighting_advice: str
    weather_considerations: str
    framing_tips: List[str]
    tracking_strategy: str


@dataclass
class RouteAdvice:
    """AI advice for route planning"""
    waypoints: List[Dict[str, Any]]
    recommended_path: str
    timing_advice: str
    safety_considerations: List[str]
    optimization_tips: List[str]


class CivilianAIAdvisor:
    """
    AI Advisor for civilian drone operations
    Provides expert advice for filming, mustering, hunting, and other civilian uses
    """
    
    def __init__(self, config: Dict[str, Any], claude_integration=None):
        self.config = config
        self.claude_integration = claude_integration
        self.running = False
        
        logger.info("Civilian AI Advisor initialized")
    
    async def start(self):
        """Start the AI advisor"""
        self.running = True
        logger.info("✓ Civilian AI Advisor started")
    
    async def shutdown(self):
        """Shutdown the AI advisor"""
        self.running = False
        logger.info("Civilian AI Advisor shutdown")
    
    async def get_filming_advice(
        self,
        operation_type: OperationType,
        location: Dict[str, Any],
        subject_info: Optional[Dict[str, Any]] = None,
        weather: Optional[Dict[str, Any]] = None
    ) -> FilmingAdvice:
        """
        Get AI-powered advice for filming operations
        
        Args:
            operation_type: Type of filming operation
            location: Location information (coordinates, terrain, etc.)
            subject_info: Information about the subject being filmed
            weather: Current weather conditions
        """
        if self.claude_integration:
            return await self._get_filming_advice_from_ai(
                operation_type, location, subject_info, weather
            )
        else:
            return self._get_filming_advice_default(operation_type, location, subject_info, weather)
    
    async def _get_filming_advice_from_ai(
        self,
        operation_type: OperationType,
        location: Dict[str, Any],
        subject_info: Optional[Dict[str, Any]],
        weather: Optional[Dict[str, Any]]
    ) -> FilmingAdvice:
        """Get filming advice from Claude AI"""
        system_prompt = """You are an expert drone cinematographer and videographer with years of experience in professional filming. You specialize in:
- Wedding cinematography with drones
- Advertisement and commercial filming
- Event coverage and live streaming
- Cinematic shot composition and camera movements
- Lighting and weather optimization
- Subject tracking and framing

Provide comprehensive, actionable advice for drone filming operations. Consider:
- Optimal camera angles and movements for the scene
- Recommended altitude and speed for smooth footage
- Shot sequences that tell a compelling story
- Lighting conditions and time of day
- Weather considerations and safety
- Framing and composition tips
- Subject tracking strategies

Format your response as JSON with the following structure:
{
    "recommended_altitude": <number in meters>,
    "recommended_speed": <number in m/s>,
    "camera_angles": ["angle1", "angle2", ...],
    "shot_sequence": [
        {"shot_type": "...", "description": "...", "duration": <seconds>},
        ...
    ],
    "lighting_advice": "...",
    "weather_considerations": "...",
    "framing_tips": ["tip1", "tip2", ...],
    "tracking_strategy": "..."
}"""
        
        context = {
            "operation_type": operation_type.value,
            "location": location,
            "subject_info": subject_info or {},
            "weather": weather or {}
        }
        
        question = f"Provide expert filming advice for a {operation_type.value} operation at this location."
        
        try:
            advice_text = await self.claude_integration.generate_expert_advice(question, context)
            
            # Try to parse JSON response
            try:
                advice_json = json.loads(advice_text)
                return FilmingAdvice(
                    recommended_altitude=advice_json.get("recommended_altitude", 30.0),
                    recommended_speed=advice_json.get("recommended_speed", 3.0),
                    camera_angles=advice_json.get("camera_angles", ["overhead", "side", "follow"]),
                    shot_sequence=advice_json.get("shot_sequence", []),
                    lighting_advice=advice_json.get("lighting_advice", "Use natural lighting when possible"),
                    weather_considerations=advice_json.get("weather_considerations", "Check weather conditions before flight"),
                    framing_tips=advice_json.get("framing_tips", ["Keep subject centered", "Use rule of thirds"]),
                    tracking_strategy=advice_json.get("tracking_strategy", "Smooth tracking with gradual movements")
                )
            except json.JSONDecodeError:
                # Fallback to default if JSON parsing fails
                return self._get_filming_advice_default(operation_type, location, subject_info, weather)
        except Exception as e:
            logger.error(f"Error getting AI filming advice: {e}")
            return self._get_filming_advice_default(operation_type, location, subject_info, weather)
    
    def _get_filming_advice_default(
        self,
        operation_type: OperationType,
        location: Dict[str, Any],
        subject_info: Optional[Dict[str, Any]],
        weather: Optional[Dict[str, Any]]
    ) -> FilmingAdvice:
        """Default filming advice when AI is not available"""
        if operation_type == OperationType.FILMING_WEDDING:
            return FilmingAdvice(
                recommended_altitude=25.0,
                recommended_speed=2.0,
                camera_angles=["overhead", "side", "follow", "reveal"],
                shot_sequence=[
                    {"shot_type": "establishing", "description": "Wide shot of venue", "duration": 5},
                    {"shot_type": "following", "description": "Follow couple walking", "duration": 10},
                    {"shot_type": "overhead", "description": "Aerial view of ceremony", "duration": 15},
                    {"shot_type": "reveal", "description": "Reveal shot of venue", "duration": 8}
                ],
                lighting_advice="Golden hour (sunrise/sunset) provides best lighting. Avoid harsh midday sun.",
                weather_considerations="Clear skies preferred. Wind speeds should be below 10 m/s for stable footage.",
                framing_tips=[
                    "Keep couple centered in frame",
                    "Use rule of thirds for composition",
                    "Maintain smooth, gradual movements",
                    "Capture both wide and close-up shots"
                ],
                tracking_strategy="Use smooth follow mode with gradual altitude changes. Maintain consistent distance from subjects."
            )
        elif operation_type == OperationType.FILMING_ADVERTISEMENT:
            return FilmingAdvice(
                recommended_altitude=40.0,
                recommended_speed=4.0,
                camera_angles=["overhead", "orbit", "dolly", "crane"],
                shot_sequence=[
                    {"shot_type": "establishing", "description": "Wide establishing shot", "duration": 3},
                    {"shot_type": "orbit", "description": "Orbit around subject", "duration": 8},
                    {"shot_type": "dolly", "description": "Forward tracking shot", "duration": 5},
                    {"shot_type": "reveal", "description": "Dramatic reveal", "duration": 4}
                ],
                lighting_advice="Professional lighting setup recommended. Consider time of day for natural lighting.",
                weather_considerations="Controlled environment preferred. Check for wind and precipitation.",
                framing_tips=[
                    "Dynamic camera movements",
                    "Multiple angles for variety",
                    "Smooth transitions between shots",
                    "Focus on product/subject"
                ],
                tracking_strategy="Precise tracking with multiple waypoints. Use orbit and dolly movements for dynamic shots."
            )
        else:
            return FilmingAdvice(
                recommended_altitude=30.0,
                recommended_speed=3.0,
                camera_angles=["overhead", "side", "follow"],
                shot_sequence=[],
                lighting_advice="Use natural lighting when possible",
                weather_considerations="Check weather conditions before flight",
                framing_tips=["Keep subject centered", "Use rule of thirds"],
                tracking_strategy="Smooth tracking with gradual movements"
            )
    
    async def get_mustering_advice(
        self,
        herd_location: Dict[str, Any],
        destination: Dict[str, Any],
        herd_size: Optional[int] = None,
        terrain: Optional[Dict[str, Any]] = None
    ) -> RouteAdvice:
        """Get AI-powered advice for mustering operations"""
        if self.claude_integration:
            return await self._get_mustering_advice_from_ai(
                herd_location, destination, herd_size, terrain
            )
        else:
            return self._get_mustering_advice_default(herd_location, destination, herd_size, terrain)
    
    async def _get_mustering_advice_from_ai(
        self,
        herd_location: Dict[str, Any],
        destination: Dict[str, Any],
        herd_size: Optional[int],
        terrain: Optional[Dict[str, Any]]
    ) -> RouteAdvice:
        """Get mustering advice from Claude AI"""
        system_prompt = """You are an expert in livestock management and drone-assisted mustering. You understand:
- Livestock behavior and movement patterns
- Optimal mustering routes and techniques
- Terrain considerations for livestock movement
- Safety protocols for animals and operators
- Efficient herd management strategies

Provide comprehensive advice for drone-assisted mustering operations."""
        
        context = {
            "herd_location": herd_location,
            "destination": destination,
            "herd_size": herd_size,
            "terrain": terrain or {}
        }
        
        question = f"Provide expert mustering advice for moving a herd of {herd_size or 'unknown size'} from the current location to the destination."
        
        try:
            advice_text = await self.claude_integration.generate_expert_advice(question, context)
            
            # Parse advice (simplified - would be more sophisticated in production)
            return RouteAdvice(
                waypoints=self._generate_mustering_waypoints(herd_location, destination),
                recommended_path="Gradual approach with wide arcs",
                timing_advice="Early morning or late afternoon when animals are most active",
                safety_considerations=[
                    "Maintain safe distance from animals",
                    "Avoid sudden movements",
                    "Watch for obstacles and terrain hazards"
                ],
                optimization_tips=[
                    "Use wide arcs to guide herd",
                    "Maintain consistent altitude",
                    "Work with ground crew if available"
                ]
            )
        except Exception as e:
            logger.error(f"Error getting AI mustering advice: {e}")
            return self._get_mustering_advice_default(herd_location, destination, herd_size, terrain)
    
    def _get_mustering_advice_default(
        self,
        herd_location: Dict[str, Any],
        destination: Dict[str, Any],
        herd_size: Optional[int],
        terrain: Optional[Dict[str, Any]]
    ) -> RouteAdvice:
        """Default mustering advice"""
        return RouteAdvice(
            waypoints=self._generate_mustering_waypoints(herd_location, destination),
            recommended_path="Gradual approach with wide arcs to avoid stressing animals",
            timing_advice="Early morning (6-8 AM) or late afternoon (4-6 PM) when animals are most active and temperatures are moderate",
            safety_considerations=[
                "Maintain minimum 20m altitude to avoid spooking animals",
                "Use gradual movements - avoid sudden direction changes",
                "Watch for terrain obstacles (fences, water, steep slopes)",
                "Monitor animal stress levels - if animals scatter, increase altitude",
                "Ensure clear communication with ground crew if present"
            ],
            optimization_tips=[
                "Start with wide arcs around the herd to gather them",
                "Use side-to-side movements to guide direction",
                "Maintain consistent altitude (20-30m recommended)",
                "Work with natural terrain features (valleys, ridges)",
                "Plan route to avoid obstacles and hazards",
                "Consider wind direction - animals may move with or against wind"
            ]
        )
    
    async def get_hunting_advice(
        self,
        target_location: Dict[str, Any],
        animal_type: str,
        terrain: Optional[Dict[str, Any]] = None,
        weather: Optional[Dict[str, Any]] = None
    ) -> RouteAdvice:
        """Get AI-powered advice for hunting operations"""
        if self.claude_integration:
            return await self._get_hunting_advice_from_ai(
                target_location, animal_type, terrain, weather
            )
        else:
            return self._get_hunting_advice_default(target_location, animal_type, terrain, weather)
    
    async def _get_hunting_advice_from_ai(
        self,
        target_location: Dict[str, Any],
        animal_type: str,
        terrain: Optional[Dict[str, Any]],
        weather: Optional[Dict[str, Any]]
    ) -> RouteAdvice:
        """Get hunting advice from Claude AI"""
        system_prompt = """You are an expert in ethical hunting and wildlife management. You understand:
- Animal behavior and movement patterns
- Optimal approach routes for hunting
- Wind direction and scent management
- Terrain utilization for stealth
- Legal and ethical hunting practices
- Safety protocols

Provide comprehensive advice for drone-assisted hunting operations while emphasizing ethical practices and legal compliance."""
        
        context = {
            "target_location": target_location,
            "animal_type": animal_type,
            "terrain": terrain or {},
            "weather": weather or {}
        }
        
        question = f"Provide expert hunting advice for locating and approaching {animal_type} at the target location."
        
        try:
            advice_text = await self.claude_integration.generate_expert_advice(question, context)
            
            return RouteAdvice(
                waypoints=self._generate_hunting_waypoints(target_location, terrain),
                recommended_path="Stealth approach with wind consideration",
                timing_advice="Early morning or late afternoon when animals are most active",
                safety_considerations=[
                    "Maintain legal altitude limits",
                    "Respect wildlife and avoid harassment",
                    "Follow all local hunting regulations",
                    "Ensure safe shooting angles"
                ],
                optimization_tips=[
                    "Approach from downwind",
                    "Use terrain for cover",
                    "Minimize noise and visual disturbance",
                    "Plan escape routes"
                ]
            )
        except Exception as e:
            logger.error(f"Error getting AI hunting advice: {e}")
            return self._get_hunting_advice_default(target_location, animal_type, terrain, weather)
    
    def _get_hunting_advice_default(
        self,
        target_location: Dict[str, Any],
        animal_type: str,
        terrain: Optional[Dict[str, Any]],
        weather: Optional[Dict[str, Any]]
    ) -> RouteAdvice:
        """Default hunting advice"""
        return RouteAdvice(
            waypoints=self._generate_hunting_waypoints(target_location, terrain),
            recommended_path="Stealth approach using terrain cover, approach from downwind direction",
            timing_advice="Early morning (dawn) or late afternoon (dusk) when animals are most active. Avoid midday when animals rest.",
            safety_considerations=[
                "Maintain legal altitude (typically 120m/400ft maximum)",
                "Respect wildlife - do not harass or stress animals",
                "Follow all local hunting regulations and seasons",
                "Ensure safe shooting angles - never shoot toward populated areas",
                "Maintain visual line of sight at all times",
                "Check for other hunters in the area"
            ],
            optimization_tips=[
                "Approach from downwind to avoid detection by scent",
                "Use terrain features (ridges, valleys) for cover",
                "Plan approach route to minimize noise",
                "Consider animal behavior patterns for the species",
                "Use low altitude (30-50m) for stealth when legal",
                "Plan multiple approach angles as backup",
                "Monitor wind direction and adjust approach accordingly"
            ]
        )
    
    async def get_general_advice(
        self,
        question: str,
        context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Get general AI advice for any civilian operation"""
        if self.claude_integration:
            return await self.claude_integration.generate_expert_advice(question, context)
        else:
            return "AI advice is currently unavailable. Please consult your operation manual."
    
    def _generate_mustering_waypoints(
        self,
        start: Dict[str, Any],
        end: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate waypoints for mustering route"""
        # Simplified waypoint generation
        # In production, would use proper route planning
        return [
            {
                "position": [start.get("lat", 0), start.get("lon", 0), 25.0],
                "altitude": 25.0,
                "description": "Start position - approach herd from side"
            },
            {
                "position": [
                    (start.get("lat", 0) + end.get("lat", 0)) / 2,
                    (start.get("lon", 0) + end.get("lon", 0)) / 2,
                    30.0
                ],
                "altitude": 30.0,
                "description": "Midpoint - guide herd direction"
            },
            {
                "position": [end.get("lat", 0), end.get("lon", 0), 25.0],
                "altitude": 25.0,
                "description": "Destination - final approach"
            }
        ]
    
    def _generate_hunting_waypoints(
        self,
        target: Dict[str, Any],
        terrain: Optional[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Generate waypoints for hunting approach route"""
        # Simplified waypoint generation
        return [
            {
                "position": [target.get("lat", 0) - 0.001, target.get("lon", 0), 40.0],
                "altitude": 40.0,
                "description": "Approach point - downwind side"
            },
            {
                "position": [target.get("lat", 0), target.get("lon", 0), 35.0],
                "altitude": 35.0,
                "description": "Target location - maintain safe distance"
            }
        ]
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get advisor statistics"""
        return {
            "running": self.running,
            "ai_enabled": self.claude_integration is not None and self.claude_integration.running
        }

