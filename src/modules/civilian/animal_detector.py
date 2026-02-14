"""
Animal Detection Module for Civilian Mode - Uses YOLO for animal detection
"""
import cv2
import numpy as np
from typing import List, Dict, Any, Optional
from pathlib import Path
import time
from loguru import logger

try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False
    logger.warning("Ultralytics YOLO not available")

try:
    import face_recognition
    FACE_RECOGNITION_AVAILABLE = True
except ImportError:
    FACE_RECOGNITION_AVAILABLE = False
    logger.warning("face_recognition library not available")


class AnimalDetector:
    """Detects animals using YOLO models"""
    
    # Animal classes in COCO dataset (YOLO default)
    ANIMAL_CLASSES = {
        0: "person",  # For people detection
        14: "bird",
        15: "cat",
        16: "dog",
        17: "horse",
        18: "sheep",
        19: "cow",
        20: "elephant",
        21: "bear",
        22: "zebra",
        23: "giraffe",
    }
    
    # Hunting-specific animals
    HUNTING_ANIMALS = {
        "deer": ["deer", "elk", "moose"],
        "boar": ["pig", "boar"],
        "bird": ["bird", "duck", "goose"],
        "rabbit": ["rabbit", "hare"],
    }
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.model: Optional[Any] = None
        self.face_model = None
        self.known_faces = {}  # For face recognition
        self.load_model()
    
    def load_model(self):
        """Load YOLO model"""
        if not YOLO_AVAILABLE:
            logger.warning("YOLO not available - using fallback detection")
            return
        
        try:
            model_path = self.config.get("model_path", "yolov8n.pt")
            if not Path(model_path).exists():
                logger.warning(f"Model {model_path} not found, downloading default YOLOv8n")
                model_path = "yolov8n.pt"
            
            self.model = YOLO(model_path)
            logger.info(f"✓ YOLO model loaded: {model_path}")
        except Exception as e:
            logger.error(f"Failed to load YOLO model: {e}")
            self.model = None
    
    def load_face_encodings(self, faces_dir: str):
        """Load known face encodings for recognition"""
        if not FACE_RECOGNITION_AVAILABLE:
            return
        
        faces_path = Path(faces_dir)
        if not faces_path.exists():
            logger.warning(f"Faces directory not found: {faces_dir}")
            return
        
        for face_file in faces_path.glob("*.jpg"):
            try:
                image = face_recognition.load_image_file(face_file)
                encodings = face_recognition.face_encodings(image)
                if encodings:
                    name = face_file.stem
                    self.known_faces[name] = encodings[0]
                    logger.info(f"Loaded face encoding for: {name}")
            except Exception as e:
                logger.error(f"Error loading face {face_file}: {e}")
    
    def detect(self, frame: np.ndarray, mode: str = "cattle") -> List[Dict[str, Any]]:
        """Detect objects in frame"""
        detections = []
        
        if mode == "people":
            detections = self._detect_people(frame)
        elif mode == "cattle":
            detections = self._detect_cattle(frame)
        elif mode == "hunting":
            detections = self._detect_hunting_animals(frame)
        else:
            detections = self._detect_general(frame)
        
        return detections
    
    def _detect_general(self, frame: np.ndarray) -> List[Dict[str, Any]]:
        """General detection using YOLO"""
        if self.model is None:
            return []
        
        try:
            results = self.model(frame, verbose=False)
            detections = []
            
            for result in results:
                boxes = result.boxes
                for box in boxes:
                    cls = int(box.cls[0])
                    conf = float(box.conf[0])
                    xyxy = box.xyxy[0].cpu().numpy()
                    
                    # Filter for animals
                    if cls in self.ANIMAL_CLASSES:
                        label = self.ANIMAL_CLASSES[cls]
                        detections.append({
                            "label": label,
                            "confidence": conf,
                            "bbox": xyxy.tolist(),
                            "class_id": cls,
                        })
            
            return detections
        except Exception as e:
            logger.error(f"Error in general detection: {e}")
            return []
    
    def _detect_cattle(self, frame: np.ndarray) -> List[Dict[str, Any]]:
        """Detect cattle and livestock"""
        detections = self._detect_general(frame)
        
        # Filter for cattle-related animals
        cattle_detections = []
        for det in detections:
            label = det["label"].lower()
            if label in ["cow", "sheep", "horse"]:
                # Estimate size and weight
                bbox = det["bbox"]
                width = bbox[2] - bbox[0]
                height = bbox[3] - bbox[1]
                
                # Rough size estimation (would need calibration in real use)
                estimated_size = self._estimate_size(width, height, label)
                estimated_weight = self._estimate_weight(estimated_size, label)
                
                cattle_detections.append({
                    **det,
                    "count": 1,  # Would need tracking for actual count
                    "size": estimated_size,
                    "estimated_weight": estimated_weight,
                    "breed_estimate": self._estimate_breed(label, width, height),
                    "health_status": "Good",  # Would need health analysis
                })
        
        return cattle_detections
    
    def _detect_hunting_animals(self, frame: np.ndarray) -> List[Dict[str, Any]]:
        """Detect animals for hunting"""
        detections = self._detect_general(frame)
        
        hunting_detections = []
        for det in detections:
            label = det["label"].lower()
            
            # Check if it's a huntable animal
            is_huntable = False
            animal_type = None
            for hunt_type, animals in self.HUNTING_ANIMALS.items():
                if any(a in label for a in animals):
                    is_huntable = True
                    animal_type = hunt_type
                    break
            
            if is_huntable or label in ["deer", "elk", "boar", "bird"]:
                bbox = det["bbox"]
                width = bbox[2] - bbox[0]
                height = bbox[3] - bbox[1]
                
                estimated_size = self._estimate_size(width, height, label)
                estimated_weight = self._estimate_weight(estimated_size, label)
                age_estimate = self._estimate_age(label, width, height)
                antler_points = self._estimate_antlers(label, width, height) if "deer" in label or "elk" in label else None
                
                hunting_detections.append({
                    **det,
                    "size": estimated_size,
                    "estimated_weight": estimated_weight,
                    "age_estimate": age_estimate,
                    "antler_points": antler_points,
                    "recommendation": self._get_hunting_recommendation(label, estimated_size, estimated_weight),
                })
        
        return hunting_detections
    
    def _detect_people(self, frame: np.ndarray) -> List[Dict[str, Any]]:
        """Detect and recognize people"""
        detections = []
        
        # First detect people with YOLO
        if self.model:
            results = self.model(frame, classes=[0], verbose=False)  # Class 0 is person
            for result in results:
                boxes = result.boxes
                for box in boxes:
                    conf = float(box.conf[0])
                    xyxy = box.xyxy[0].cpu().numpy()
                    
                    x1, y1, x2, y2 = map(int, xyxy)
                    face_region = frame[y1:y2, x1:x2]
                    
                    # Try face recognition
                    identity = "Unknown"
                    face_recognized = False
                    
                    if FACE_RECOGNITION_AVAILABLE and len(self.known_faces) > 0:
                        try:
                            face_encodings = face_recognition.face_encodings(face_region)
                            if face_encodings:
                                matches = face_recognition.compare_faces(
                                    list(self.known_faces.values()),
                                    face_encodings[0]
                                )
                                if True in matches:
                                    match_index = matches.index(True)
                                    identity = list(self.known_faces.keys())[match_index] + " (Authorized)"
                                    face_recognized = True
                        except Exception as e:
                            logger.debug(f"Face recognition error: {e}")
                    
                    detections.append({
                        "label": "Person",
                        "confidence": conf,
                        "bbox": xyxy.tolist(),
                        "face_recognized": face_recognized,
                        "identity": identity if face_recognized else "Unknown - Requires verification",
                        "status": "Verified" if face_recognized else "Unverified",
                    })
        
        return detections
    
    def _estimate_size(self, width: float, height: float, animal_type: str) -> str:
        """Estimate animal size from bounding box"""
        # This is a simplified estimation - real implementation would need calibration
        area = width * height
        
        if animal_type in ["cow", "horse"]:
            if area > 50000:
                return "Large"
            elif area > 30000:
                return "Medium to Large"
            else:
                return "Medium"
        elif animal_type in ["deer", "elk"]:
            if area > 40000:
                return "Large"
            elif area > 25000:
                return "Medium"
            else:
                return "Small to Medium"
        elif animal_type in ["sheep", "pig"]:
            if area > 30000:
                return "Large"
            elif area > 15000:
                return "Medium"
            else:
                return "Small"
        else:
            return "Medium"
    
    def _estimate_weight(self, size: str, animal_type: str) -> str:
        """Estimate weight based on size and animal type"""
        weight_ranges = {
            "cow": {
                "Large": "600-800 kg",
                "Medium to Large": "450-650 kg",
                "Medium": "300-450 kg",
            },
            "horse": {
                "Large": "500-700 kg",
                "Medium to Large": "400-550 kg",
                "Medium": "300-400 kg",
            },
            "deer": {
                "Large": "90-130 kg",
                "Medium": "60-90 kg",
                "Small to Medium": "40-60 kg",
            },
            "elk": {
                "Large": "300-400 kg",
                "Medium": "200-300 kg",
            },
            "sheep": {
                "Large": "80-120 kg",
                "Medium": "50-80 kg",
                "Small": "30-50 kg",
            },
            "pig": {
                "Large": "100-150 kg",
                "Medium": "60-100 kg",
            },
        }
        
        return weight_ranges.get(animal_type, {}).get(size, "Unknown")
    
    def _estimate_breed(self, animal_type: str, width: float, height: float) -> str:
        """Estimate breed based on characteristics"""
        if animal_type == "cow":
            # Simple heuristic based on size
            if width > 200:
                return "Charolais/Angus"
            else:
                return "Angus/Hereford mix"
        return "Unknown"
    
    def _estimate_age(self, animal_type: str, width: float, height: float) -> str:
        """Estimate age"""
        area = width * height
        if animal_type in ["deer", "elk"]:
            if area > 40000:
                return "4-6 years"
            elif area > 25000:
                return "2-4 years"
            else:
                return "1-2 years"
        return "Adult"
    
    def _estimate_antlers(self, animal_type: str, width: float, height: float) -> Optional[int]:
        """Estimate antler points (simplified)"""
        if "deer" in animal_type or "elk" in animal_type:
            # Very simplified - would need actual antler detection
            area = width * height
            if area > 40000:
                return 8  # Large buck
            elif area > 30000:
                return 6
            else:
                return 4
        return None
    
    def _get_hunting_recommendation(self, animal_type: str, size: str, weight: str) -> str:
        """Get hunting recommendation"""
        if "deer" in animal_type or "elk" in animal_type:
            if "Large" in size:
                return "Legal to harvest - meets size requirements"
            else:
                return "Check local regulations - may be too small"
        elif "boar" in animal_type or "pig" in animal_type:
            return "Legal to harvest - invasive species"
        else:
            return "Check local hunting regulations"
