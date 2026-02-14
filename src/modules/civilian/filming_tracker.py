"""
Filming Tracker - AI-powered tracking for filming operations
Tracks subjects during filming and provides real-time advice
"""
import asyncio
import numpy as np
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from loguru import logger
import time


@dataclass
class TrackedSubject:
    """Tracked subject for filming"""
    subject_id: str
    position: Dict[str, float]  # {lat, lon, alt}
    bbox: List[float]  # [x1, y1, x2, y2]
    confidence: float
    frame_number: int
    timestamp: float
    camera_angle: str
    framing_quality: float  # 0.0 to 1.0
    tracking_status: str  # "tracking", "lost", "reacquired"


@dataclass
class FilmingAdvice:
    """Real-time filming advice"""
    advice_type: str  # "framing", "movement", "lighting", "composition"
    message: str
    priority: str  # "low", "medium", "high"
    timestamp: float


class FilmingTracker:
    """
    AI-powered tracker for filming operations
    Tracks subjects and provides real-time filming advice
    """
    
    def __init__(self, config: Dict[str, Any], ai_advisor=None):
        self.config = config
        self.ai_advisor = ai_advisor
        self.tracked_subjects: Dict[str, TrackedSubject] = {}
        self.tracking_history: List[TrackedSubject] = []
        self.advice_history: List[FilmingAdvice] = []
        self.running = False
        
        # Tracking parameters
        self.max_tracking_distance = config.get("max_tracking_distance", 50.0)  # meters
        self.framing_threshold = config.get("framing_threshold", 0.7)  # Minimum framing quality
        self.lost_timeout = config.get("lost_timeout", 2.0)  # seconds
        
        logger.info("Filming Tracker initialized")
    
    async def start(self):
        """Start the filming tracker"""
        self.running = True
        logger.info("✓ Filming Tracker started")
    
    async def shutdown(self):
        """Shutdown the filming tracker"""
        self.running = False
        logger.info("Filming Tracker shutdown")
    
    async def update_tracking(
        self,
        detections: List[Dict[str, Any]],
        frame_number: int,
        camera_position: Optional[Dict[str, float]] = None
    ) -> List[TrackedSubject]:
        """
        Update tracking with new detections
        
        Args:
            detections: List of detections from object detection
            frame_number: Current frame number
            camera_position: Current camera/drone position
        """
        if not self.running:
            return []
        
        current_time = time.time()
        updated_subjects = []
        
        # Match detections to existing tracks
        for detection in detections:
            subject_id = detection.get("subject_id") or f"subject_{len(self.tracked_subjects)}"
            
            # Calculate framing quality
            framing_quality = self._calculate_framing_quality(detection)
            
            # Determine camera angle
            camera_angle = self._determine_camera_angle(detection, camera_position)
            
            # Update or create tracked subject
            if subject_id in self.tracked_subjects:
                # Update existing track
                tracked = self.tracked_subjects[subject_id]
                tracked.bbox = detection.get("bbox", tracked.bbox)
                tracked.confidence = detection.get("confidence", tracked.confidence)
                tracked.frame_number = frame_number
                tracked.timestamp = current_time
                tracked.camera_angle = camera_angle
                tracked.framing_quality = framing_quality
                tracked.tracking_status = "tracking"
                
                # Update position if available
                if camera_position:
                    tracked.position = camera_position
            else:
                # Create new track
                tracked = TrackedSubject(
                    subject_id=subject_id,
                    position=camera_position or {"lat": 0, "lon": 0, "alt": 0},
                    bbox=detection.get("bbox", [0, 0, 0, 0]),
                    confidence=detection.get("confidence", 0.0),
                    frame_number=frame_number,
                    timestamp=current_time,
                    camera_angle=camera_angle,
                    framing_quality=framing_quality,
                    tracking_status="tracking"
                )
                self.tracked_subjects[subject_id] = tracked
            
            updated_subjects.append(tracked)
            self.tracking_history.append(tracked)
        
        # Check for lost tracks
        lost_subjects = []
        for subject_id, tracked in list(self.tracked_subjects.items()):
            if current_time - tracked.timestamp > self.lost_timeout:
                tracked.tracking_status = "lost"
                lost_subjects.append(tracked)
                # Remove from active tracking after timeout
                del self.tracked_subjects[subject_id]
        
        # Generate real-time advice
        if updated_subjects:
            advice = await self._generate_tracking_advice(updated_subjects, camera_position)
            if advice:
                self.advice_history.extend(advice)
        
        return updated_subjects
    
    def _calculate_framing_quality(self, detection: Dict[str, Any]) -> float:
        """Calculate framing quality score (0.0 to 1.0)"""
        bbox = detection.get("bbox", [0, 0, 0, 0])
        if len(bbox) < 4:
            return 0.5
        
        # Calculate bounding box center and size
        x1, y1, x2, y2 = bbox
        center_x = (x1 + x2) / 2
        center_y = (y1 + y2) / 2
        width = x2 - x1
        height = y2 - y1
        
        # Assume frame size (would be from actual frame dimensions)
        frame_width = 1920
        frame_height = 1080
        
        # Check if subject is centered (rule of thirds)
        # Ideal position: center or one of the rule-of-thirds lines
        center_score = 1.0 - abs(center_x - frame_width / 2) / (frame_width / 2)
        center_score = max(0.0, center_score)
        
        # Check if subject size is appropriate (not too small, not too large)
        size_ratio = (width * height) / (frame_width * frame_height)
        if 0.1 < size_ratio < 0.5:  # Good size range
            size_score = 1.0
        elif size_ratio < 0.05:  # Too small
            size_score = 0.3
        elif size_ratio > 0.7:  # Too large
            size_score = 0.5
        else:
            size_score = 0.7
        
        # Confidence contributes to quality
        confidence = detection.get("confidence", 0.5)
        
        # Combined quality score
        quality = (center_score * 0.4 + size_score * 0.4 + confidence * 0.2)
        return min(1.0, max(0.0, quality))
    
    def _determine_camera_angle(
        self,
        detection: Dict[str, Any],
        camera_position: Optional[Dict[str, float]]
    ) -> str:
        """Determine camera angle based on detection and camera position"""
        if not camera_position:
            return "unknown"
        
        # Simplified angle determination
        # In production, would use more sophisticated analysis
        bbox = detection.get("bbox", [0, 0, 0, 0])
        if len(bbox) < 4:
            return "unknown"
        
        # Check bounding box position in frame
        y1 = bbox[1]
        frame_height = 1080  # Assume 1080p
        
        if y1 < frame_height * 0.3:
            return "overhead"
        elif y1 < frame_height * 0.6:
            return "side"
        else:
            return "low_angle"
    
    async def _generate_tracking_advice(
        self,
        tracked_subjects: List[TrackedSubject],
        camera_position: Optional[Dict[str, float]]
    ) -> List[FilmingAdvice]:
        """Generate real-time filming advice based on tracking"""
        advice_list = []
        current_time = time.time()
        
        for tracked in tracked_subjects:
            # Framing advice
            if tracked.framing_quality < self.framing_threshold:
                advice_list.append(FilmingAdvice(
                    advice_type="framing",
                    message=f"Subject {tracked.subject_id} framing quality low ({tracked.framing_quality:.2f}). Adjust camera position to center subject.",
                    priority="medium",
                    timestamp=current_time
                ))
            
            # Movement advice
            if tracked.tracking_status == "lost":
                advice_list.append(FilmingAdvice(
                    advice_type="movement",
                    message=f"Subject {tracked.subject_id} lost. Attempting to reacquire...",
                    priority="high",
                    timestamp=current_time
                ))
            
            # Composition advice (if AI advisor available)
            if self.ai_advisor and tracked.framing_quality < 0.6:
                try:
                    ai_advice = await self.ai_advisor.get_general_advice(
                        f"How should I improve framing for subject at camera angle {tracked.camera_angle}?",
                        {
                            "framing_quality": tracked.framing_quality,
                            "camera_angle": tracked.camera_angle,
                            "bbox": tracked.bbox
                        }
                    )
                    
                    advice_list.append(FilmingAdvice(
                        advice_type="composition",
                        message=ai_advice[:200],  # Truncate long advice
                        priority="low",
                        timestamp=current_time
                    ))
                except Exception as e:
                    logger.debug(f"Error getting AI advice: {e}")
        
        return advice_list
    
    def get_tracking_status(self) -> Dict[str, Any]:
        """Get current tracking status"""
        return {
            "active_tracks": len(self.tracked_subjects),
            "total_tracked": len(self.tracking_history),
            "advice_count": len(self.advice_history),
            "subjects": [
                {
                    "subject_id": sub.subject_id,
                    "tracking_status": sub.tracking_status,
                    "framing_quality": sub.framing_quality,
                    "camera_angle": sub.camera_angle
                }
                for sub in self.tracked_subjects.values()
            ]
        }
    
    def get_recent_advice(self, count: int = 10) -> List[Dict[str, Any]]:
        """Get recent filming advice"""
        recent = self.advice_history[-count:]
        return [
            {
                "advice_type": adv.advice_type,
                "message": adv.message,
                "priority": adv.priority,
                "timestamp": adv.timestamp
            }
            for adv in recent
        ]
    
    def clear_history(self):
        """Clear tracking and advice history"""
        self.tracking_history.clear()
        self.advice_history.clear()
        self.tracked_subjects.clear()
        logger.info("Tracking history cleared")

