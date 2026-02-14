"""
Custom exception classes for the Autonomous Target Acquisition System
Provides specific error types for better error handling and debugging
"""


class ATAException(Exception):
    """Base exception for all ATA system errors"""
    pass


class ConfigurationError(ATAException):
    """Raised when there's an error in system configuration"""
    pass


class SensorError(ATAException):
    """Raised when there's an error with sensor operations"""
    pass


class DetectionError(ATAException):
    """Raised when there's an error in object detection"""
    pass


class TrackingError(ATAException):
    """Raised when there's an error in object tracking"""
    pass


class CommunicationError(ATAException):
    """Raised when there's an error in communication systems"""
    pass


class ProtocolError(ATAException):
    """Raised when there's an error in drone protocol communication"""
    pass


class AuthenticationError(ATAException):
    """Raised when authentication fails"""
    pass


class AuthorizationError(ATAException):
    """Raised when authorization fails"""
    pass


class SafetyViolationError(ATAException):
    """Raised when a safety requirement is violated"""
    pass


class EmergencyError(ATAException):
    """Raised during emergency situations"""
    pass


class DroneConnectionError(ATAException):
    """Raised when there's an error connecting to or communicating with a drone"""
    pass


class ModelLoadError(ATAException):
    """Raised when there's an error loading ML models"""
    pass


class ProcessingError(ATAException):
    """Raised when there's an error processing data"""
    pass


class ValidationError(ATAException):
    """Raised when input validation fails"""
    pass


class ResourceError(ATAException):
    """Raised when there's an error accessing system resources"""
    pass


class ATATimeoutError(ATAException):
    """Raised when an operation times out. Named ATATimeoutError to avoid shadowing built-in TimeoutError."""
    pass
