"""
Alerting system for performance degradation and critical issues
"""
import time
from typing import Dict, Any, Optional, List, Callable
from dataclasses import dataclass, field
from enum import Enum
from loguru import logger

from src.utils.performance_monitor import get_performance_monitor
from src.utils.exceptions import ATAException


class AlertSeverity(Enum):
    """Alert severity levels"""
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"
    EMERGENCY = "emergency"


@dataclass
class Alert:
    """Represents a performance or system alert"""
    id: str
    severity: AlertSeverity
    message: str
    metric: Optional[str] = None
    value: Optional[float] = None
    threshold: Optional[float] = None
    timestamp: float = field(default_factory=time.time)
    resolved: bool = False
    metadata: Dict[str, Any] = field(default_factory=dict)


class AlertManager:
    """
    Manages performance alerts and notifications
    """
    
    def __init__(self):
        self.alerts: Dict[str, Alert] = {}
        self.alert_callbacks: List[Callable[[Alert], None]] = []
        self.thresholds: Dict[str, Dict[str, float]] = {
            "latency": {
                "warning": 200.0,  # ms
                "critical": 500.0,  # ms
            },
            "cpu_percent": {
                "warning": 80.0,
                "critical": 95.0,
            },
            "memory_percent": {
                "warning": 80.0,
                "critical": 95.0,
            },
            "error_rate": {
                "warning": 1.0,  # 1%
                "critical": 5.0,  # 5%
            },
        }
        self.check_interval = 5.0  # seconds
        self.last_check = time.time()
    
    def set_threshold(self, metric: str, severity: str, value: float):
        """Set alert threshold for a metric"""
        if metric not in self.thresholds:
            self.thresholds[metric] = {}
        self.thresholds[metric][severity] = value
        logger.info(f"Set {severity} threshold for {metric}: {value}")
    
    def register_callback(self, callback: Callable[[Alert], None]):
        """Register a callback for alerts"""
        self.alert_callbacks.append(callback)
    
    def check_metrics(self) -> List[Alert]:
        """Check current metrics and generate alerts"""
        alerts = []
        monitor = get_performance_monitor()
        metrics = monitor.get_all_metrics()
        
        # Check latency
        latency_stats = metrics.get("latency", {})
        if latency_stats.get("count", 0) > 0:
            p95_latency = latency_stats.get("p95", 0)
            mean_latency = latency_stats.get("mean", 0)
            
            if p95_latency > self.thresholds["latency"]["critical"]:
                alert = self._create_alert(
                    "high_latency_critical",
                    AlertSeverity.CRITICAL,
                    f"P95 latency is critically high: {p95_latency:.2f}ms",
                    "latency",
                    p95_latency,
                    self.thresholds["latency"]["critical"]
                )
                alerts.append(alert)
            elif mean_latency > self.thresholds["latency"]["warning"]:
                alert = self._create_alert(
                    "high_latency_warning",
                    AlertSeverity.WARNING,
                    f"Mean latency is high: {mean_latency:.2f}ms",
                    "latency",
                    mean_latency,
                    self.thresholds["latency"]["warning"]
                )
                alerts.append(alert)
        
        # Check system metrics
        system_metrics = metrics.get("system", {})
        cpu_percent = system_metrics.get("cpu_percent", 0)
        memory_percent = system_metrics.get("memory_percent", 0)
        
        if cpu_percent > self.thresholds["cpu_percent"]["critical"]:
            alert = self._create_alert(
                "high_cpu_critical",
                AlertSeverity.CRITICAL,
                f"CPU usage is critically high: {cpu_percent:.1f}%",
                "cpu_percent",
                cpu_percent,
                self.thresholds["cpu_percent"]["critical"]
            )
            alerts.append(alert)
        elif cpu_percent > self.thresholds["cpu_percent"]["warning"]:
            alert = self._create_alert(
                "high_cpu_warning",
                AlertSeverity.WARNING,
                f"CPU usage is high: {cpu_percent:.1f}%",
                "cpu_percent",
                cpu_percent,
                self.thresholds["cpu_percent"]["warning"]
            )
            alerts.append(alert)
        
        if memory_percent > self.thresholds["memory_percent"]["critical"]:
            alert = self._create_alert(
                "high_memory_critical",
                AlertSeverity.CRITICAL,
                f"Memory usage is critically high: {memory_percent:.1f}%",
                "memory_percent",
                memory_percent,
                self.thresholds["memory_percent"]["critical"]
            )
            alerts.append(alert)
        elif memory_percent > self.thresholds["memory_percent"]["warning"]:
            alert = self._create_alert(
                "high_memory_warning",
                AlertSeverity.WARNING,
                f"Memory usage is high: {memory_percent:.1f}%",
                "memory_percent",
                memory_percent,
                self.thresholds["memory_percent"]["warning"]
            )
            alerts.append(alert)
        
        # Process new alerts
        for alert in alerts:
            self._process_alert(alert)
        
        return alerts
    
    def _create_alert(
        self,
        alert_id: str,
        severity: AlertSeverity,
        message: str,
        metric: Optional[str] = None,
        value: Optional[float] = None,
        threshold: Optional[float] = None
    ) -> Alert:
        """Create a new alert"""
        # Check if alert already exists
        if alert_id in self.alerts and not self.alerts[alert_id].resolved:
            # Update existing alert
            existing = self.alerts[alert_id]
            existing.message = message
            existing.value = value
            existing.timestamp = time.time()
            return existing
        
        # Create new alert
        alert = Alert(
            id=alert_id,
            severity=severity,
            message=message,
            metric=metric,
            value=value,
            threshold=threshold
        )
        self.alerts[alert_id] = alert
        return alert
    
    def _process_alert(self, alert: Alert):
        """Process an alert (log and notify callbacks)"""
        severity_emoji = {
            AlertSeverity.INFO: "ℹ️",
            AlertSeverity.WARNING: "⚠️",
            AlertSeverity.CRITICAL: "🔴",
            AlertSeverity.EMERGENCY: "🚨",
        }
        
        emoji = severity_emoji.get(alert.severity, "ℹ️")
        logger.warning(f"{emoji} ALERT [{alert.severity.value.upper()}]: {alert.message}")
        
        # Notify callbacks
        for callback in self.alert_callbacks:
            try:
                callback(alert)
            except Exception as e:
                logger.error(f"Error in alert callback: {e}")
    
    def resolve_alert(self, alert_id: str):
        """Mark an alert as resolved"""
        if alert_id in self.alerts:
            self.alerts[alert_id].resolved = True
            logger.info(f"Alert resolved: {alert_id}")
    
    def get_active_alerts(self) -> List[Alert]:
        """Get all active (unresolved) alerts"""
        return [alert for alert in self.alerts.values() if not alert.resolved]
    
    def get_alerts_by_severity(self, severity: AlertSeverity) -> List[Alert]:
        """Get alerts by severity"""
        return [
            alert for alert in self.alerts.values()
            if alert.severity == severity and not alert.resolved
        ]


# Global alert manager instance
_global_alert_manager: Optional[AlertManager] = None


def get_alert_manager() -> AlertManager:
    """Get or create global alert manager instance"""
    global _global_alert_manager
    if _global_alert_manager is None:
        _global_alert_manager = AlertManager()
    return _global_alert_manager


def check_performance_alerts() -> List[Alert]:
    """Convenience function to check performance alerts"""
    return get_alert_manager().check_metrics()
