"""
Civilian Route Planner - AI-powered route planning for civilian operations
Supports filming routes, mustering routes, hunting routes, and general navigation
"""
import asyncio
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from loguru import logger
from enum import Enum
import time


class RouteType(Enum):
    """Types of civilian routes"""
    FILMING = "filming"
    MUSTERING = "mustering"
    HUNTING = "hunting"
    SURVEYING = "surveying"
    INSPECTION = "inspection"
    GENERAL = "general"


@dataclass
class CivilianWaypoint:
    """Waypoint for civilian operations"""
    lat: float
    lon: float
    altitude: float
    heading: float
    speed: float
    description: str
    shot_type: Optional[str] = None  # For filming operations
    camera_angle: Optional[str] = None  # For filming operations
    duration: Optional[float] = None  # For filming operations


@dataclass
class RoutePlan:
    """Complete route plan for civilian operations"""
    route_id: str
    route_type: RouteType
    waypoints: List[CivilianWaypoint]
    total_distance: float  # meters
    estimated_duration: float  # seconds
    safety_score: float  # 0.0 to 1.0
    optimization_tips: List[str]
    weather_considerations: str
    terrain_notes: List[str]


class CivilianRoutePlanner:
    """
    AI-powered route planner for civilian drone operations
    Optimizes routes for filming, mustering, hunting, and other civilian uses
    """
    
    def __init__(self, config: Dict[str, Any], ai_advisor=None):
        self.config = config
        self.ai_advisor = ai_advisor
        
        # Planning parameters
        planning_config = config.get("planning", {})
        self.max_altitude = planning_config.get("max_altitude", 120)  # meters (legal limit)
        self.min_altitude = planning_config.get("min_altitude", 5)   # meters
        self.cruise_speed = planning_config.get("cruise_speed", 5)   # m/s
        self.filming_speed = planning_config.get("filming_speed", 2)  # m/s (slower for smooth footage)
        
        # Route history
        self.generated_routes: List[RoutePlan] = []
        
        logger.info("Civilian Route Planner initialized")
    
    async def plan_filming_route(
        self,
        start_pos: Dict[str, float],
        subject_positions: List[Dict[str, float]],
        operation_type: str = "wedding",
        filming_advice: Optional[Dict[str, Any]] = None
    ) -> RoutePlan:
        """
        Plan a route for filming operations
        
        Args:
            start_pos: Starting position {lat, lon}
            subject_positions: List of subject positions to film
            operation_type: Type of filming (wedding, advertisement, event)
            filming_advice: AI-generated filming advice
        """
        logger.info(f"Planning filming route for {operation_type}")
        
        waypoints = []
        
        # Starting waypoint
        waypoints.append(CivilianWaypoint(
            lat=start_pos["lat"],
            lon=start_pos["lon"],
            altitude=filming_advice.get("recommended_altitude", 30.0) if filming_advice else 30.0,
            heading=0.0,
            speed=filming_advice.get("recommended_speed", 2.0) if filming_advice else 2.0,
            description="Starting position - prepare for filming",
            shot_type="establishing" if filming_advice else None,
            camera_angle="overhead" if filming_advice else None,
            duration=5.0
        ))
        
        # Plan route to each subject position
        for i, subject_pos in enumerate(subject_positions):
            # Approach waypoint
            approach_lat = subject_pos["lat"] - 0.0001
            approach_lon = subject_pos["lon"]
            
            waypoints.append(CivilianWaypoint(
                lat=approach_lat,
                lon=approach_lon,
                altitude=filming_advice.get("recommended_altitude", 30.0) if filming_advice else 30.0,
                heading=self._calculate_heading(
                    {"lat": waypoints[-1].lat, "lon": waypoints[-1].lon},
                    subject_pos
                ),
                speed=filming_advice.get("recommended_speed", 2.0) if filming_advice else 2.0,
                description=f"Approach subject {i+1}",
                shot_type="approach" if filming_advice else None,
                camera_angle="side" if filming_advice else None,
                duration=3.0
            ))
            
            # Subject position waypoint
            shot_sequence = filming_advice.get("shot_sequence", []) if filming_advice else []
            shot_info = shot_sequence[i % len(shot_sequence)] if shot_sequence else {}
            
            waypoints.append(CivilianWaypoint(
                lat=subject_pos["lat"],
                lon=subject_pos["lon"],
                altitude=filming_advice.get("recommended_altitude", 30.0) if filming_advice else 30.0,
                heading=0.0,
                speed=filming_advice.get("recommended_speed", 2.0) if filming_advice else 2.0,
                description=f"Film subject {i+1}",
                shot_type=shot_info.get("shot_type", "following") if shot_info else "following",
                camera_angle=filming_advice.get("camera_angles", ["overhead"])[i % len(filming_advice.get("camera_angles", ["overhead"]))] if filming_advice else "overhead",
                duration=shot_info.get("duration", 10.0) if shot_info else 10.0
            ))
            
            # Orbit waypoint (if multiple subjects or for dynamic shots)
            if len(subject_positions) > 1 or operation_type == "advertisement":
                orbit_lat = subject_pos["lat"] + 0.0001
                orbit_lon = subject_pos["lon"] + 0.0001
                
                waypoints.append(CivilianWaypoint(
                    lat=orbit_lat,
                    lon=orbit_lon,
                    altitude=filming_advice.get("recommended_altitude", 30.0) if filming_advice else 30.0,
                    heading=self._calculate_heading(subject_pos, {"lat": orbit_lat, "lon": orbit_lon}),
                    speed=filming_advice.get("recommended_speed", 2.0) if filming_advice else 2.0,
                    description=f"Orbit around subject {i+1}",
                    shot_type="orbit" if filming_advice else None,
                    camera_angle="orbit" if filming_advice else None,
                    duration=8.0
                ))
        
        # Calculate route metrics
        total_distance = self._calculate_total_distance(waypoints)
        estimated_duration = sum(wp.duration or 10.0 for wp in waypoints)
        
        route_plan = RoutePlan(
            route_id=f"filming_{int(time.time())}",
            route_type=RouteType.FILMING,
            waypoints=waypoints,
            total_distance=total_distance,
            estimated_duration=estimated_duration,
            safety_score=0.9,  # High safety for civilian operations
            optimization_tips=filming_advice.get("framing_tips", []) if filming_advice else [
                "Maintain smooth camera movements",
                "Keep subjects in frame",
                "Use rule of thirds for composition"
            ],
            weather_considerations=filming_advice.get("weather_considerations", "Check weather before flight") if filming_advice else "Check weather conditions",
            terrain_notes=["Ensure clear line of sight", "Avoid obstacles"]
        )
        
        self.generated_routes.append(route_plan)
        logger.info(f"Filming route planned: {len(waypoints)} waypoints, {total_distance:.1f}m total distance")
        
        return route_plan
    
    async def plan_mustering_route(
        self,
        herd_location: Dict[str, float],
        destination: Dict[str, float],
        herd_size: Optional[int] = None,
        terrain: Optional[Dict[str, Any]] = None
    ) -> RoutePlan:
        """
        Plan a route for mustering operations
        
        Args:
            herd_location: Current location of the herd {lat, lon}
            destination: Destination for the herd {lat, lon}
            herd_size: Estimated size of the herd
            terrain: Terrain information
        """
        logger.info("Planning mustering route")
        
        waypoints = []
        
        # Approach waypoint - wide arc to gather herd
        approach_lat = herd_location["lat"] - 0.0002
        approach_lon = herd_location["lon"] - 0.0002
        
        waypoints.append(CivilianWaypoint(
            lat=approach_lat,
            lon=approach_lon,
            altitude=25.0,  # Safe altitude for mustering
            heading=self._calculate_heading(herd_location, destination),
            speed=3.0,  # Moderate speed
            description="Approach herd from side - begin gathering"
        ))
        
        # Herd position waypoint
        waypoints.append(CivilianWaypoint(
            lat=herd_location["lat"],
            lon=herd_location["lon"],
            altitude=25.0,
            heading=self._calculate_heading(herd_location, destination),
            speed=2.0,  # Slower when near animals
            description="Herd location - maintain safe distance"
        ))
        
        # Midpoint waypoint - guide direction
        mid_lat = (herd_location["lat"] + destination["lat"]) / 2
        mid_lon = (herd_location["lon"] + destination["lon"]) / 2
        
        waypoints.append(CivilianWaypoint(
            lat=mid_lat,
            lon=mid_lon,
            altitude=30.0,  # Slightly higher for better visibility
            heading=self._calculate_heading(herd_location, destination),
            speed=3.0,
            description="Midpoint - guide herd direction"
        ))
        
        # Destination approach
        dest_approach_lat = destination["lat"] - 0.0001
        dest_approach_lon = destination["lon"]
        
        waypoints.append(CivilianWaypoint(
            lat=dest_approach_lat,
            lon=dest_approach_lon,
            altitude=25.0,
            heading=self._calculate_heading({"lat": mid_lat, "lon": mid_lon}, destination),
            speed=2.0,
            description="Approach destination - final guidance"
        ))
        
        # Destination waypoint
        waypoints.append(CivilianWaypoint(
            lat=destination["lat"],
            lon=destination["lon"],
            altitude=25.0,
            heading=0.0,
            speed=1.0,  # Very slow at destination
            description="Destination - herd arrival point"
        ))
        
        # Calculate route metrics
        total_distance = self._calculate_total_distance(waypoints)
        estimated_duration = total_distance / 3.0  # Average speed 3 m/s
        
        route_plan = RoutePlan(
            route_id=f"mustering_{int(time.time())}",
            route_type=RouteType.MUSTERING,
            waypoints=waypoints,
            total_distance=total_distance,
            estimated_duration=estimated_duration,
            safety_score=0.85,
            optimization_tips=[
                "Use wide arcs to avoid stressing animals",
                "Maintain consistent altitude (20-30m)",
                "Work with ground crew if available",
                "Monitor animal behavior and adjust approach"
            ],
            weather_considerations="Early morning or late afternoon when animals are most active. Avoid extreme heat.",
            terrain_notes=[
                "Avoid obstacles (fences, water, steep slopes)",
                "Use natural terrain features to guide movement",
                "Plan route to minimize animal stress"
            ]
        )
        
        self.generated_routes.append(route_plan)
        logger.info(f"Mustering route planned: {len(waypoints)} waypoints, {total_distance:.1f}m total distance")
        
        return route_plan
    
    async def plan_hunting_route(
        self,
        start_pos: Dict[str, float],
        target_location: Dict[str, float],
        animal_type: str = "deer",
        terrain: Optional[Dict[str, Any]] = None,
        wind_direction: Optional[float] = None
    ) -> RoutePlan:
        """
        Plan a route for hunting operations
        
        Args:
            start_pos: Starting position {lat, lon}
            target_location: Target location {lat, lon}
            animal_type: Type of animal being hunted
            terrain: Terrain information
            wind_direction: Wind direction in degrees
        """
        logger.info(f"Planning hunting route for {animal_type}")
        
        waypoints = []
        
        # Starting waypoint
        waypoints.append(CivilianWaypoint(
            lat=start_pos["lat"],
            lon=start_pos["lon"],
            altitude=50.0,  # Higher altitude for scouting
            heading=0.0,
            speed=4.0,  # Faster for scouting
            description="Starting position - begin scouting"
        ))
        
        # Approach waypoint - downwind side
        # Calculate downwind position based on wind direction
        if wind_direction is not None:
            # Position downwind (opposite of wind direction)
            wind_rad = np.radians(wind_direction + 180)
            offset_lat = 0.0002 * np.cos(wind_rad)
            offset_lon = 0.0002 * np.sin(wind_rad)
            
            approach_lat = target_location["lat"] + offset_lat
            approach_lon = target_location["lon"] + offset_lon
        else:
            # Default approach from side
            approach_lat = target_location["lat"] - 0.0002
            approach_lon = target_location["lon"]
        
        waypoints.append(CivilianWaypoint(
            lat=approach_lat,
            lon=approach_lon,
            altitude=40.0,  # Lower altitude for approach
            heading=self._calculate_heading(start_pos, target_location),
            speed=3.0,
            description="Approach point - downwind side for stealth"
        ))
        
        # Target location waypoint
        waypoints.append(CivilianWaypoint(
            lat=target_location["lat"],
            lon=target_location["lon"],
            altitude=35.0,  # Low altitude for observation
            heading=0.0,
            speed=1.0,  # Very slow for observation
            description=f"Target location - observe {animal_type}"
        ))
        
        # Calculate route metrics
        total_distance = self._calculate_total_distance(waypoints)
        estimated_duration = total_distance / 3.0  # Average speed
        
        route_plan = RoutePlan(
            route_id=f"hunting_{int(time.time())}",
            route_type=RouteType.HUNTING,
            waypoints=waypoints,
            total_distance=total_distance,
            estimated_duration=estimated_duration,
            safety_score=0.8,
            optimization_tips=[
                "Approach from downwind to avoid detection",
                "Use terrain for cover when possible",
                "Maintain legal altitude limits",
                "Plan escape routes",
                "Monitor wind direction and adjust approach"
            ],
            weather_considerations="Early morning or late afternoon when animals are most active. Consider wind direction for approach.",
            terrain_notes=[
                "Use terrain features (ridges, valleys) for cover",
                "Avoid open areas when possible",
                "Plan approach to minimize noise and visual disturbance"
            ]
        )
        
        self.generated_routes.append(route_plan)
        logger.info(f"Hunting route planned: {len(waypoints)} waypoints, {total_distance:.1f}m total distance")
        
        return route_plan
    
    async def plan_general_route(
        self,
        start_pos: Dict[str, float],
        end_pos: Dict[str, float],
        waypoint_count: int = 5
    ) -> RoutePlan:
        """Plan a general navigation route"""
        logger.info("Planning general route")
        
        waypoints = []
        
        # Starting waypoint
        waypoints.append(CivilianWaypoint(
            lat=start_pos["lat"],
            lon=start_pos["lon"],
            altitude=50.0,
            heading=0.0,
            speed=self.cruise_speed,
            description="Starting position"
        ))
        
        # Intermediate waypoints
        for i in range(1, waypoint_count):
            t = i / waypoint_count
            lat = start_pos["lat"] + t * (end_pos["lat"] - start_pos["lat"])
            lon = start_pos["lon"] + t * (end_pos["lon"] - start_pos["lon"])
            
            waypoints.append(CivilianWaypoint(
                lat=lat,
                lon=lon,
                altitude=50.0,
                heading=self._calculate_heading(
                    {"lat": waypoints[-1].lat, "lon": waypoints[-1].lon},
                    end_pos
                ),
                speed=self.cruise_speed,
                description=f"Waypoint {i}"
            ))
        
        # End waypoint
        waypoints.append(CivilianWaypoint(
            lat=end_pos["lat"],
            lon=end_pos["lon"],
            altitude=50.0,
            heading=0.0,
            speed=self.approach_speed,
            description="Destination"
        ))
        
        # Calculate route metrics
        total_distance = self._calculate_total_distance(waypoints)
        estimated_duration = total_distance / self.cruise_speed
        
        route_plan = RoutePlan(
            route_id=f"general_{int(time.time())}",
            route_type=RouteType.GENERAL,
            waypoints=waypoints,
            total_distance=total_distance,
            estimated_duration=estimated_duration,
            safety_score=0.9,
            optimization_tips=[
                "Maintain safe altitude",
                "Follow local regulations",
                "Monitor weather conditions"
            ],
            weather_considerations="Check weather before flight",
            terrain_notes=["Ensure clear line of sight"]
        )
        
        self.generated_routes.append(route_plan)
        return route_plan
    
    def _calculate_heading(
        self,
        start: Dict[str, float],
        end: Dict[str, float]
    ) -> float:
        """Calculate heading angle in degrees"""
        lat1 = np.radians(start["lat"])
        lat2 = np.radians(end["lat"])
        dlon = np.radians(end["lon"] - start["lon"])
        
        y = np.sin(dlon) * np.cos(lat2)
        x = np.cos(lat1) * np.sin(lat2) - np.sin(lat1) * np.cos(lat2) * np.cos(dlon)
        
        heading = np.degrees(np.arctan2(y, x))
        return (heading + 360) % 360  # Normalize to 0-360
    
    def _calculate_total_distance(self, waypoints: List[CivilianWaypoint]) -> float:
        """Calculate total distance of route in meters"""
        if len(waypoints) < 2:
            return 0.0
        
        total = 0.0
        for i in range(len(waypoints) - 1):
            wp1 = waypoints[i]
            wp2 = waypoints[i + 1]
            
            # Haversine formula for distance
            lat1 = np.radians(wp1.lat)
            lat2 = np.radians(wp2.lat)
            dlat = lat2 - lat1
            dlon = np.radians(wp2.lon - wp1.lon)
            
            a = np.sin(dlat/2)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon/2)**2
            c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1-a))
            
            # Earth radius in meters
            R = 6371000
            distance = R * c
            total += distance
        
        return total
    
    def get_route_history(self) -> List[Dict[str, Any]]:
        """Get history of generated routes"""
        return [
            {
                "route_id": route.route_id,
                "route_type": route.route_type.value,
                "waypoint_count": len(route.waypoints),
                "total_distance": route.total_distance,
                "estimated_duration": route.estimated_duration,
                "safety_score": route.safety_score
            }
            for route in self.generated_routes
        ]

