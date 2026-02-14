"""
Performance monitoring utilities
Provides performance tracking and monitoring capabilities
"""
import time
import threading
from typing import Dict, Any, Optional, List
from collections import deque
from dataclasses import dataclass, field
from datetime import datetime
from loguru import logger

try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False


@dataclass
class PerformanceMetric:
    """Represents a single performance metric"""
    name: str
    value: float
    timestamp: float = field(default_factory=time.time)
    tags: Dict[str, str] = field(default_factory=dict)


class PerformanceMonitor:
    """
    Performance monitoring system for tracking system metrics
    """
    
    def __init__(self, max_history: int = 1000):
        """
        Initialize performance monitor
        
        Args:
            max_history: Maximum number of metrics to keep in history
        """
        self.max_history = max_history
        self.metrics: Dict[str, deque] = {}
        self.latency_history: deque = deque(maxlen=max_history)
        self.cpu_history: deque = deque(maxlen=max_history)
        self.memory_history: deque = deque(maxlen=max_history)
        self.lock = threading.Lock()
        self.start_time = time.time()
        
    def record_latency(self, latency_ms: float, operation: str = "default"):
        """Record operation latency"""
        with self.lock:
            if operation not in self.metrics:
                self.metrics[operation] = deque(maxlen=self.max_history)
            self.metrics[operation].append(latency_ms)
            self.latency_history.append(latency_ms)
    
    def record_metric(self, name: str, value: float, tags: Optional[Dict[str, str]] = None):
        """Record a custom metric"""
        with self.lock:
            if name not in self.metrics:
                self.metrics[name] = deque(maxlen=self.max_history)
            self.metrics[name].append(value)
    
    def get_latency_stats(self, operation: Optional[str] = None) -> Dict[str, float]:
        """Get latency statistics"""
        with self.lock:
            if operation:
                data = list(self.metrics.get(operation, []))
            else:
                data = list(self.latency_history)
            
            if not data:
                return {
                    "count": 0,
                    "min": 0.0,
                    "max": 0.0,
                    "mean": 0.0,
                    "p50": 0.0,
                    "p95": 0.0,
                    "p99": 0.0,
                }
            
            sorted_data = sorted(data)
            n = len(sorted_data)
            
            return {
                "count": n,
                "min": min(data),
                "max": max(data),
                "mean": sum(data) / n,
                "p50": sorted_data[int(n * 0.50)] if n > 0 else 0.0,
                "p95": sorted_data[int(n * 0.95)] if n > 0 else 0.0,
                "p99": sorted_data[int(n * 0.99)] if n > 0 else 0.0,
            }
    
    def get_system_metrics(self) -> Dict[str, Any]:
        """Get current system metrics"""
        metrics = {
            "uptime_seconds": time.time() - self.start_time,
        }
        
        if PSUTIL_AVAILABLE:
            try:
                cpu_percent = psutil.cpu_percent(interval=0.1)
                memory = psutil.virtual_memory()
                metrics.update({
                    "cpu_percent": cpu_percent,
                    "memory_percent": memory.percent,
                    "memory_used_mb": memory.used / (1024 * 1024),
                    "memory_available_mb": memory.available / (1024 * 1024),
                })
                
                # Record for history
                with self.lock:
                    self.cpu_history.append(cpu_percent)
                    self.memory_history.append(memory.percent)
            except Exception as e:
                # Log but don't fail if metrics collection fails
                logger.warning(f"Failed to collect system metrics: {e}")
        
        return metrics
    
    def get_all_metrics(self) -> Dict[str, Any]:
        """Get all performance metrics"""
        with self.lock:
            return {
                "latency": self.get_latency_stats(),
                "system": self.get_system_metrics(),
                "operations": {
                    op: self.get_latency_stats(op) 
                    for op in self.metrics.keys()
                },
            }
    
    def reset(self):
        """Reset all metrics"""
        with self.lock:
            self.metrics.clear()
            self.latency_history.clear()
            self.cpu_history.clear()
            self.memory_history.clear()
            self.start_time = time.time()


# Global performance monitor instance
_global_monitor: Optional[PerformanceMonitor] = None


def get_performance_monitor() -> PerformanceMonitor:
    """Get or create global performance monitor instance"""
    global _global_monitor
    if _global_monitor is None:
        _global_monitor = PerformanceMonitor()
    return _global_monitor


def record_latency(latency_ms: float, operation: str = "default"):
    """Convenience function to record latency"""
    get_performance_monitor().record_latency(latency_ms, operation)
