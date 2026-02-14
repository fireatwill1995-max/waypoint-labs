"""
Camera Manager for Civilian Mode - Handles camera feeds and video streaming
"""
import cv2
import asyncio
import numpy as np
from typing import Optional, Dict, Any, Callable, List
from pathlib import Path
import threading
import time
from loguru import logger

try:
    import torch
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    logger.warning("PyTorch not available - detection will be limited")


class CameraManager:
    """Manages camera feeds for civilian applications"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.cameras: Dict[str, Any] = {}
        self.running = False
        self.frame_callbacks: List[Callable] = []
        self.detection_enabled = False
        self.detection_mode = "cattle"  # cattle, hunting, people
        
    def add_camera(self, camera_id: str, source: Any, camera_type: str = "webcam"):
        """Add a camera source"""
        try:
            if camera_type == "webcam":
                # Webcam source (0, 1, 2, etc. or video file path)
                if isinstance(source, (int, str)):
                    cap = cv2.VideoCapture(source)
                    if not cap.isOpened():
                        logger.error(f"Failed to open camera {camera_id} from source {source}")
                        return False
                    self.cameras[camera_id] = {
                        "capture": cap,
                        "type": "webcam",
                        "source": source,
                        "fps": 30,
                        "width": int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)),
                        "height": int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)),
                    }
                    logger.info(f"✓ Camera {camera_id} added (webcam: {source})")
                    return True
            elif camera_type == "ip":
                # IP camera (RTSP, HTTP, etc.)
                cap = cv2.VideoCapture(source)
                if not cap.isOpened():
                    logger.error(f"Failed to open IP camera {camera_id} from {source}")
                    return False
                self.cameras[camera_id] = {
                    "capture": cap,
                    "type": "ip",
                    "source": source,
                    "fps": 30,
                    "width": int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)),
                    "height": int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)),
                }
                logger.info(f"✓ Camera {camera_id} added (IP: {source})")
                return True
        except Exception as e:
            logger.error(f"Error adding camera {camera_id}: {e}")
            return False
    
    def remove_camera(self, camera_id: str):
        """Remove a camera"""
        if camera_id in self.cameras:
            self.cameras[camera_id]["capture"].release()
            del self.cameras[camera_id]
            logger.info(f"Camera {camera_id} removed")
    
    def add_frame_callback(self, callback: Callable):
        """Add callback for processed frames"""
        self.frame_callbacks.append(callback)
    
    def start(self):
        """Start capturing from all cameras"""
        if self.running:
            return
        
        self.running = True
        self.capture_thread = threading.Thread(target=self._capture_loop, daemon=True)
        self.capture_thread.start()
        logger.info("Camera manager started")
    
    def stop(self):
        """Stop capturing"""
        self.running = False
        if hasattr(self, 'capture_thread'):
            self.capture_thread.join(timeout=2.0)
        for camera_id, camera_info in self.cameras.items():
            camera_info["capture"].release()
        logger.info("Camera manager stopped")
    
    def _capture_loop(self):
        """Main capture loop"""
        while self.running:
            for camera_id, camera_info in self.cameras.items():
                try:
                    ret, frame = camera_info["capture"].read()
                    if ret:
                        # Process frame and call callbacks
                        processed_frame = self._process_frame(frame, camera_id)
                        for callback in self.frame_callbacks:
                            try:
                                callback(camera_id, processed_frame)
                            except Exception as e:
                                logger.error(f"Error in frame callback: {e}")
                    else:
                        logger.warning(f"Failed to read frame from {camera_id}")
                except Exception as e:
                    logger.error(f"Error capturing from {camera_id}: {e}")
            
            # Control frame rate
            time.sleep(1.0 / 30.0)  # ~30 FPS
    
    def _process_frame(self, frame: np.ndarray, camera_id: str) -> Dict[str, Any]:
        """Process a single frame"""
        result = {
            "camera_id": camera_id,
            "frame": frame,
            "timestamp": time.time(),
            "detections": [],
        }
        
        if self.detection_enabled:
            # Detection will be handled by detection engine
            pass
        
        return result
    
    def get_frame(self, camera_id: str) -> Optional[np.ndarray]:
        """Get latest frame from a camera"""
        if camera_id in self.cameras:
            ret, frame = self.cameras[camera_id]["capture"].read()
            if ret:
                return frame
        return None
    
    def set_detection_mode(self, mode: str):
        """Set detection mode (cattle, hunting, people)"""
        self.detection_mode = mode
        logger.info(f"Detection mode set to: {mode}")
