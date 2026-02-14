"""
Size and Weight Estimation Module - Estimates animal size and weight from detections
"""
import numpy as np
from typing import Dict, Any, Optional, Tuple
from loguru import logger


class SizeEstimator:
    """Estimates size and weight of detected animals"""
    
    # Reference sizes (in meters) for calibration
    REFERENCE_SIZES = {
        "cow": {"length": 2.0, "height": 1.5, "weight_range": (400, 800)},
        "horse": {"length": 2.5, "height": 1.6, "weight_range": (300, 700)},
        "deer": {"length": 1.8, "height": 1.2, "weight_range": (40, 130)},
        "elk": {"length": 2.5, "height": 1.5, "weight_range": (200, 400)},
        "sheep": {"length": 1.2, "height": 0.8, "weight_range": (30, 120)},
        "pig": {"length": 1.5, "height": 0.8, "weight_range": (60, 150)},
    }
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.camera_height = config.get("camera_height", 10.0)  # meters above ground
        self.focal_length = config.get("focal_length", 50.0)  # mm
        self.sensor_width = config.get("sensor_width", 36.0)  # mm
        self.image_width = config.get("image_width", 1920)  # pixels
        self.image_height = config.get("image_height", 1080)  # pixels
    
    def estimate_from_bbox(
        self,
        bbox: Tuple[float, float, float, float],
        animal_type: str,
        distance: Optional[float] = None
    ) -> Dict[str, Any]:
        """Estimate size and weight from bounding box"""
        x1, y1, x2, y2 = bbox
        width_pixels = x2 - x1
        height_pixels = y2 - y1
        
        # Get reference size for animal type
        ref_size = self.REFERENCE_SIZES.get(animal_type.lower(), self.REFERENCE_SIZES["cow"])
        
        # Estimate distance if not provided (using size of bounding box)
        if distance is None:
            distance = self._estimate_distance(width_pixels, height_pixels, ref_size)
        
        # Estimate actual size
        estimated_length = self._estimate_length(width_pixels, distance)
        estimated_height = self._estimate_height(height_pixels, distance)
        
        # Estimate weight using length and height
        estimated_weight = self._estimate_weight(estimated_length, estimated_height, animal_type)
        
        return {
            "estimated_length": f"{estimated_length:.2f}m",
            "estimated_height": f"{estimated_height:.2f}m",
            "estimated_weight": estimated_weight,
            "distance": f"{distance:.1f}m",
            "confidence": self._calculate_confidence(width_pixels, height_pixels, distance),
        }
    
    def _estimate_distance(
        self,
        width_pixels: float,
        height_pixels: float,
        ref_size: Dict[str, Any]
    ) -> float:
        """Estimate distance to object using known reference size"""
        # Use height for distance estimation (more reliable)
        ref_height = ref_size["height"]
        
        # Convert pixels to meters using camera parameters
        # Simplified: distance = (focal_length * real_height) / (pixel_height * sensor_height / image_height)
        pixel_height_mm = (height_pixels / self.image_height) * (self.sensor_width * 9 / 16)
        if pixel_height_mm > 0:
            distance = (self.focal_length * ref_height) / (pixel_height_mm / 1000)
        else:
            distance = 50.0  # Default fallback
        
        return max(10.0, min(distance, 500.0))  # Clamp between 10m and 500m
    
    def _estimate_length(self, width_pixels: float, distance: float) -> float:
        """Estimate length of object"""
        # Convert pixel width to real-world length
        pixel_width_mm = (width_pixels / self.image_width) * self.sensor_width
        length = (pixel_width_mm / 1000) * distance / (self.focal_length / 1000)
        return length
    
    def _estimate_height(self, height_pixels: float, distance: float) -> float:
        """Estimate height of object"""
        # Convert pixel height to real-world height
        pixel_height_mm = (height_pixels / self.image_height) * (self.sensor_width * 9 / 16)
        height = (pixel_height_mm / 1000) * distance / (self.focal_length / 1000)
        return height
    
    def _estimate_weight(
        self,
        length: float,
        height: float,
        animal_type: str
    ) -> str:
        """Estimate weight from length and height"""
        ref_size = self.REFERENCE_SIZES.get(animal_type.lower(), self.REFERENCE_SIZES["cow"])
        weight_min, weight_max = ref_size["weight_range"]
        
        # Use volume approximation: weight ~ length * height^2 * density_factor
        ref_length = ref_size["length"]
        ref_height = ref_size["height"]
        
        # Scale factor
        length_scale = length / ref_length
        height_scale = height / ref_height
        volume_scale = length_scale * (height_scale ** 2)
        
        # Estimate weight
        weight_estimate = (weight_min + weight_max) / 2 * volume_scale
        
        # Clamp to reasonable range
        weight_estimate = max(weight_min * 0.5, min(weight_estimate, weight_max * 1.5))
        
        # Create range
        weight_range = weight_estimate * 0.8
        weight_max_est = weight_estimate * 1.2
        
        return f"{int(weight_range)}-{int(weight_max_est)} kg"
    
    def _calculate_confidence(
        self,
        width_pixels: float,
        height_pixels: float,
        distance: float
    ) -> float:
        """Calculate confidence in estimation"""
        # Confidence based on bounding box size and distance
        area = width_pixels * height_pixels
        
        # Larger bounding boxes = higher confidence
        if area > 50000:
            area_confidence = 0.9
        elif area > 20000:
            area_confidence = 0.7
        elif area > 10000:
            area_confidence = 0.5
        else:
            area_confidence = 0.3
        
        # Closer objects = higher confidence
        if distance < 50:
            distance_confidence = 0.9
        elif distance < 100:
            distance_confidence = 0.7
        elif distance < 200:
            distance_confidence = 0.5
        else:
            distance_confidence = 0.3
        
        return (area_confidence + distance_confidence) / 2
