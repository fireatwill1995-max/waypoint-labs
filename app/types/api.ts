// API Response Types
export interface ApiStatus {
  running: boolean
  authenticated: boolean
  user_id?: string
  drones_online?: number
  connections?: number
}

export interface AdvancedFeaturesStatus {
  anti_jamming: { enabled: boolean; status: string }
  anti_tracking: { enabled: boolean; status: string }
  auto_evade: { enabled: boolean; status: string }
  track_correction: { enabled: boolean; status: string }
  multi_drone: { enabled: boolean; status: string; active_drones: number }
  ai_engine: { enabled: boolean; status: string; model: string }
}

export interface AntiJammingStatus {
  frequency_hopping: {
    enabled: boolean
    current_frequency: number
    hop_rate: number
  }
  jamming_detected: boolean
  communication_quality: number
  mitigation_success_rate: number
}

export interface AntiTrackingStatus {
  stealth_mode: boolean
  radar_cross_section_reduction: number
  thermal_signature_reduction: number
  tracking_events_detected: number
  evasion_success_rate: number
}

export interface AutoEvadeStatus {
  threat_detection_enabled: boolean
  active_threats: number
  evasion_success_rate: number
  last_evasion: string | null
  threat_types: {
    missile: boolean
    aircraft: boolean
    anti_aircraft: boolean
  }
}

export interface TrackCorrectionStatus {
  tracking_quality: number
  corrections_applied: number
  interference_detected: boolean
  prediction_algorithm: string
  min_confidence: number
}

export interface DroneInfo {
  id: string
  name: string
  status: string
  battery: number
  type: string
}

export interface MultiDroneStatus {
  enabled: boolean
  active_drones: number
  max_drones: number
  coordination_enabled: boolean
  drones: DroneInfo[]
}

export interface AIEngineStatus {
  model_type: string
  confidence_threshold: number
  decisions_made: number
  learning_enabled: boolean
  risk_tolerance: number
  aggressiveness: number
}

export interface Detection {
  label?: string
  confidence?: number
  distance?: string
  bbox?: [number, number, number, number]
  id?: string
  // Fish-specific detection fields
  species?: string
  estimated_size_cm?: number
  estimated_weight_kg?: number
  location_from_boat?: {
    bearing_degrees?: number
    distance_meters?: number
    depth_meters?: number
  }
  water_conditions?: {
    temperature_c?: number
    clarity?: string
    depth_m?: number
    ph?: number
    oxygen_level_mg_l?: number
    turbidity_ntu?: number
    salinity_ppt?: number
  }
  timestamp?: string
  // Sonar detection data
  sonar_data?: {
    signal_strength?: number
    depth_profile?: number[]
    bottom_type?: string
    structure_detected?: boolean
  }
  // Swarm coordination data
  swarm_info?: {
    drone_id?: string
    role?: 'scout' | 'bait-deploy' | 'monitor' | 'mapping'
    coverage_area_m2?: number
  }
}

export interface RoutePlan {
  waypoints: Waypoint[]
  distance_km?: number
  estimated_time_minutes?: number
  fuel_consumption?: number
}

export interface Waypoint {
  id: string
  lat: number
  lon: number
  alt: number
  name?: string
}

export interface OperationOption {
  id: string
  title: string
  description: string
  icon: string
  requiresLocation?: boolean
  requiresDestination?: boolean
}

export interface ApiError {
  message: string
  code?: string
  details?: unknown
}

// Multi-Drone Management Types
export interface DroneInstance {
  id: string
  name: string
  cameraId: string
  status: 'idle' | 'ready' | 'mission' | 'surveillance' | 'tracking' | 'returning' | 'error'
  position?: { lat: number; lon: number; alt: number }
  heading?: number
  speed?: number
  battery?: number
  videoSettings?: VideoSettings
}

export interface VideoSettings {
  brightness: number
  contrast: number
  saturation: number
  zoom: number
  rotation: number
  flipHorizontal: boolean
  flipVertical: boolean
}

export interface DroneCommand {
  droneId: string
  command: 'move' | 'hover' | 'follow' | 'orbit' | 'patrol' | 'return' | 'land' | 'takeoff'
  parameters?: {
    target?: { lat: number; lon: number; alt: number }
    speed?: number
    radius?: number
    altitude?: number
    duration?: number
    waypoints?: Waypoint[]
  }
}

export interface AIDroneCommand {
  command: string
  mode: 'cattle' | 'hunting' | 'people' | 'filming' | 'fishing' | 'mining'
  drones?: string[]
  parameters?: {
    target?: { lat: number; lon: number; alt: number }
    formation?: 'line' | 'v' | 'circle' | 'grid' | 'follow'
    radius?: number
    altitude?: number
    speed?: number
  }
}

export interface DroneFormation {
  type: 'line' | 'v' | 'circle' | 'grid' | 'follow' | 'mustering' | 'hunting' | 'filming' | 'mining'
  drones: string[]
  leader?: string
  spacing?: number
  altitude?: number
  speed?: number
}

export interface CoordinationPattern {
  name: string
  description: string
  mode: 'cattle' | 'hunting' | 'people' | 'filming' | 'fishing' | 'mining'
  drones: {
    role: 'pusher' | 'monitor' | 'flanker' | 'overwatch' | 'camera' | 'tracker'
    droneId: string
    behavior: string
    parameters: Record<string, unknown>
  }[]
}
