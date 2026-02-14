'use client'

import { useState, useEffect } from 'react'
import { useApi } from '../lib/api'
import { useToast } from '../hooks/useToast'
import { logger } from '../lib/logger'
import ProtocolAdvancedSettings from './ProtocolAdvancedSettings'
import ConnectionPresets from './ConnectionPresets'

interface DroneConnection {
  id: string
  protocol: string
  status: 'connected' | 'disconnected' | 'connecting' | 'error'
  telemetry?: {
    battery: number
    position: { lat: number; lon: number; alt: number }
    mode: string
  }
}

interface ProtocolOption {
  value: string
  label: string
  description: string
}

const PROTOCOL_OPTIONS: ProtocolOption[] = [
  // Open Source / DIY Autopilots
  { value: 'mavlink', label: 'MAVLink', description: 'PX4, ArduPilot, open-source autopilots' },
  { value: 'px4', label: 'PX4', description: 'PX4 autopilot (MAVLink-based)' },
  { value: 'ardupilot', label: 'ArduPilot', description: 'ArduCopter, ArduPlane, ArduRover' },
  { value: 'betaflight', label: 'Betaflight', description: 'Racing drones, FPV quads' },
  { value: 'inav', label: 'iNav', description: 'Fixed-wing and multirotor autopilot' },
  { value: 'auterion', label: 'AuterionOS', description: 'AuterionOS drones' },
  
  // DJI Drones
  { value: 'dji', label: 'DJI SDK', description: 'DJI Matrice, Mavic, Phantom series' },
  { value: 'dji_tello', label: 'DJI Tello', description: 'Ryze Tello, Tello EDU' },
  { value: 'dji_mini', label: 'DJI Mini', description: 'DJI Mini 2, Mini 3, Mini 4 series' },
  { value: 'dji_air', label: 'DJI Air', description: 'DJI Air 2S, Air 3 series' },
  { value: 'dji_fpv', label: 'DJI FPV', description: 'DJI FPV, Avata series' },
  
  // Commercial Drones
  { value: 'parrot', label: 'Parrot', description: 'Anafi, Bebop 2, Disco (ARSDK)' },
  { value: 'skydio', label: 'Skydio', description: 'Skydio 2, X2, X10' },
  { value: 'yuneec', label: 'Yuneec', description: 'Typhoon, Mantis, Breeze' },
  { value: 'autel', label: 'Autel', description: 'EVO Lite, EVO II, EVO Nano series' },
  { value: '3dr', label: '3DR Solo', description: '3DR Solo (MAVLink-based)' },
  { value: 'holy_stone', label: 'Holy Stone', description: 'HS series, GPS drones (MAVLink-compatible)' },
  { value: 'potensic', label: 'Potensic', description: 'Potensic D80, D88, Atom series' },
  { value: 'walkera', label: 'Walkera', description: 'Walkera drones, QR series' },
  { value: 'hubsan', label: 'Hubsan', description: 'Hubsan Zino, X4 series' },
  { value: 'eachine', label: 'Eachine', description: 'Eachine E520S, EX5 series' },
  { value: 'fimi', label: 'Fimi', description: 'Fimi X8, X8SE series' },
  { value: 'power_vision', label: 'PowerVision', description: 'PowerEgg X, PowerEye' },
  { value: 'zerotech', label: 'ZeroTech', description: 'ZeroTech Dobby, Mantis Q' },
  
  // Military / Government
  { value: 'stanag_4586', label: 'STANAG 4586', description: 'NATO-compliant UAVs' },
  { value: 'bayraktar', label: 'Bayraktar', description: 'TB2, TB2S, TB3 military drones' },
  { value: 'mq9_reaper', label: 'MQ-9 Reaper', description: 'MQ-9 Reaper military drone' },
  { value: 'heron_tp', label: 'Heron TP', description: 'Heron TP military drone' },
  { value: 'shield_ai', label: 'Shield AI', description: 'Shield AI V-BAT (Hivemind)' },
  
  // Protocols & Standards
  { value: 'ros', label: 'ROS/ROS2', description: 'Robot Operating System' },
  { value: 'ros2', label: 'ROS2', description: 'Robot Operating System 2' },
  { value: 'webrtc', label: 'WebRTC', description: 'WebRTC-based drone control' },
  { value: 'opendroneid', label: 'OpenDroneID', description: 'Remote ID standard' },
  { value: 'astm_f3411', label: 'ASTM F3411', description: 'Remote ID standard (ASTM)' },
  { value: 'lora', label: 'LoRa', description: 'Long-range radio communication' },
  { value: '4g_5g', label: '4G/5G', description: 'Cellular network connection' },
  { value: 'satellite', label: 'Satellite', description: 'Satellite communication (Iridium, etc.)' },
  { value: 'mesh', label: 'Mesh Network', description: 'Mesh networking protocol' },
  
  // Video Streaming
  { value: 'rtsp', label: 'RTSP', description: 'RTSP video streaming protocol' },
  { value: 'rtmp', label: 'RTMP', description: 'RTMP video streaming protocol' },
]

export default function DroneConnectionPanel() {
  const [connections, setConnections] = useState<DroneConnection[]>([])
  const [selectedProtocol, setSelectedProtocol] = useState<string>('mavlink')
  const [connectionType, setConnectionType] = useState<'serial' | 'udp' | 'tcp' | 'usb' | 'wifi' | 'bluetooth' | 'webrtc' | 'rtsp' | 'rtmp'>('serial')
  const [connectionParams, setConnectionParams] = useState({
    port: '/dev/ttyUSB0',
    baudrate: 57600,
    host: '127.0.0.1',
    portNum: 14550,
  })
  const [autoDetect, setAutoDetect] = useState(true)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [advancedSettings, setAdvancedSettings] = useState<Record<string, unknown>>({})
  const { fetchWithAuth } = useApi()
  const { error: showError, success: showSuccess } = useToast()

  useEffect(() => {
    let mounted = true
    
    const loadConnectionsSafe = async () => {
      if (!mounted) return
      await loadConnections()
    }
    
    loadConnectionsSafe()
    
    return () => {
      mounted = false
    }
    // Run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchWithAuth])

  const loadConnections = async () => {
    try {
      const response = await fetchWithAuth('/api/drones/connections')
      if (response && Array.isArray(response)) {
        // Validate response structure
        const validConnections = response.filter((conn): conn is DroneConnection => {
          return (
            typeof conn === 'object' &&
            conn !== null &&
            'id' in conn &&
            'protocol' in conn &&
            'status' in conn &&
            typeof (conn as DroneConnection).id === 'string' &&
            typeof (conn as DroneConnection).protocol === 'string' &&
            typeof (conn as DroneConnection).status === 'string'
          )
        })
        setConnections(validConnections)
      } else {
        // Invalid response - set empty array
        setConnections([])
      }
    } catch (error) {
      logger.error('Failed to load connections:', error)
      // Set empty array on error to prevent UI issues
      setConnections([])
    }
  }

  const handleConnect = async () => {
    try {
      // Validate and sanitize connection parameters
      const sanitizedConfig = {
        protocol: String(autoDetect ? 'auto' : selectedProtocol || 'auto').slice(0, 50),
        connection: {
          type: String(connectionType || 'serial').slice(0, 50),
          ...(connectionType === 'serial' || connectionType === 'usb'
            ? { 
                port: String(connectionParams.port || '').slice(0, 100),
                baudrate: typeof connectionParams.baudrate === 'number' 
                  ? Math.max(0, Math.min(connectionParams.baudrate, 1000000))
                  : 57600
              }
            : connectionType === 'webrtc' || connectionType === 'rtsp' || connectionType === 'rtmp'
            ? { url: String(connectionParams.host || '').slice(0, 500) }
            : { 
                host: String(connectionParams.host || '').slice(0, 255),
                port: typeof connectionParams.portNum === 'number'
                  ? Math.max(1, Math.min(connectionParams.portNum, 65535))
                  : undefined
              }),
        },
        auto_detect: Boolean(autoDetect),
        advancedSettings: Object.keys(advancedSettings).length > 0 ? advancedSettings : undefined,
      }

      const response = await fetchWithAuth('/api/drones/connect', {
        method: 'POST',
        body: JSON.stringify(sanitizedConfig),
      }) as { success?: boolean; protocol?: string; error?: string } | null

      if (response && response.success) {
        const protocol = String(response.protocol || selectedProtocol || 'auto').slice(0, 50)
        showSuccess(`Connected to drone via ${protocol}`)
        await loadConnections()
      } else {
        const errorMsg = response?.error ? String(response.error).slice(0, 500) : 'Failed to connect to drone'
        showError(errorMsg)
      }
    } catch (error) {
      showError('Failed to connect to drone')
      logger.error('Connection error:', error)
    }
  }

  const handleDisconnect = async (droneId: string) => {
    try {
      const response = await fetchWithAuth(`/api/drones/${droneId}/disconnect`, {
        method: 'POST',
      }) as { success?: boolean } | null

      if (response && response.success) {
        showSuccess('Disconnected from drone')
        await loadConnections()
      } else {
        showError('Failed to disconnect from drone')
      }
    } catch (error) {
      showError('Failed to disconnect from drone')
      logger.error('Disconnect error:', error)
    }
  }

  return (
    <div className="card-dji p-6 space-y-6 border-2 border-dji-500/20 rounded-xl">
      <div>
        <h3 className="text-2xl font-bold text-white mb-2">Drone Connection</h3>
        <p className="text-slate-400 text-sm">
          Connect to any drone using auto-detection or manual protocol selection
        </p>
      </div>

      {/* Auto-detect toggle */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="auto-detect"
          checked={autoDetect}
          onChange={(e) => setAutoDetect(e.target.checked)}
          className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-2 focus:ring-blue-500"
        />
        <label htmlFor="auto-detect" className="text-slate-200 cursor-pointer">
          Auto-detect protocol
        </label>
      </div>

      {!autoDetect && (
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-2">
            Protocol
          </label>
          <select
            value={selectedProtocol}
            onChange={(e) => setSelectedProtocol(e.target.value)}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {PROTOCOL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} - {option.description}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Connection type */}
      <div>
        <label className="block text-slate-300 text-sm font-medium mb-2">
          Connection Type
        </label>
        <div className="flex flex-wrap gap-2">
          {(['serial', 'udp', 'tcp', 'usb', 'wifi', 'bluetooth', 'webrtc', 'rtsp', 'rtmp'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setConnectionType(type)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                connectionType === type
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {type.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Connection parameters */}
      {connectionType === 'serial' || connectionType === 'usb' ? (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="serial-port" className="block text-slate-300 text-sm font-medium mb-2">
              {connectionType === 'usb' ? 'USB Device' : 'Port'}
            </label>
            <input
              id="serial-port"
              type="text"
              value={connectionParams.port}
              onChange={(e) =>
                setConnectionParams({ ...connectionParams, port: e.target.value })
              }
              className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              placeholder={connectionType === 'usb' ? '/dev/ttyACM0' : '/dev/ttyUSB0'}
              aria-label={connectionType === 'usb' ? 'USB device path' : 'Serial port path'}
            />
          </div>
          <div>
            <label htmlFor="serial-baudrate" className="block text-slate-300 text-sm font-medium mb-2">
              Baudrate
            </label>
            <input
              id="serial-baudrate"
              type="number"
              value={connectionParams.baudrate}
              onChange={(e) =>
                setConnectionParams({
                  ...connectionParams,
                  baudrate: (() => {
                    const parsed = parseInt(e.target.value, 10)
                    return (!isNaN(parsed) && parsed > 0 && parsed <= 1000000) ? parsed : 57600
                  })(),
                })
              }
              className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              aria-label="Serial baudrate"
            />
          </div>
        </div>
      ) : connectionType === 'wifi' || connectionType === 'bluetooth' ? (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="wifi-address" className="block text-slate-300 text-sm font-medium mb-2">
              {connectionType === 'wifi' ? 'IP Address / SSID' : 'Device Address'}
            </label>
            <input
              id="wifi-address"
              type="text"
              value={connectionParams.host}
              onChange={(e) =>
                setConnectionParams({ ...connectionParams, host: e.target.value })
              }
              className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              placeholder={connectionType === 'wifi' ? '192.168.1.1 or SSID' : 'MAC Address'}
              aria-label={connectionType === 'wifi' ? 'WiFi address or SSID' : 'Bluetooth device address'}
            />
          </div>
          <div>
            <label htmlFor="wifi-port" className="block text-slate-300 text-sm font-medium mb-2">
              Port
            </label>
            <input
              id="wifi-port"
              type="number"
              value={connectionParams.portNum}
              onChange={(e) =>
                setConnectionParams({
                  ...connectionParams,
                  portNum: (() => {
                    const parsed = parseInt(e.target.value, 10)
                    if (!isNaN(parsed) && parsed >= 1 && parsed <= 65535) {
                      return parsed
                    }
                    return connectionType === 'wifi' ? 8888 : 1
                  })(),
                })
              }
              className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              aria-label="Port number"
            />
          </div>
        </div>
      ) : connectionType === 'webrtc' ? (
        <div className="space-y-4">
          <div>
            <label htmlFor="webrtc-url" className="block text-slate-300 text-sm font-medium mb-2">
              WebRTC Signaling URL
            </label>
            <input
              id="webrtc-url"
              type="text"
              value={connectionParams.host}
              onChange={(e) =>
                setConnectionParams({ ...connectionParams, host: e.target.value })
              }
              className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              placeholder="wss://signaling.example.com"
              aria-label="WebRTC signaling URL"
            />
          </div>
        </div>
      ) : connectionType === 'rtsp' || connectionType === 'rtmp' ? (
        <div className="space-y-4">
          <div>
            <label htmlFor="stream-url" className="block text-slate-300 text-sm font-medium mb-2">
              Stream URL
            </label>
            <input
              id="stream-url"
              type="text"
              value={connectionParams.host}
              onChange={(e) =>
                setConnectionParams({ ...connectionParams, host: e.target.value })
              }
              className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              placeholder={connectionType === 'rtsp' ? 'rtsp://192.168.1.1:554/stream' : 'rtmp://192.168.1.1:1935/live'}
              aria-label="Stream URL"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="network-host" className="block text-slate-300 text-sm font-medium mb-2">
              Host
            </label>
            <input
              id="network-host"
              type="text"
              value={connectionParams.host}
              onChange={(e) =>
                setConnectionParams({ ...connectionParams, host: e.target.value })
              }
              className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              placeholder="127.0.0.1"
              aria-label="Network host address"
            />
          </div>
          <div>
            <label htmlFor="network-port" className="block text-slate-300 text-sm font-medium mb-2">
              Port
            </label>
            <input
              id="network-port"
              type="number"
              value={connectionParams.portNum}
              onChange={(e) =>
                setConnectionParams({
                  ...connectionParams,
                  portNum: parseInt(e.target.value) || 14550,
                })
              }
              className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              aria-label="Network port number"
            />
          </div>
        </div>
      )}

      {/* Advanced Settings Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
        aria-label={showAdvanced ? "Hide advanced settings" : "Show advanced settings"}
        aria-expanded={showAdvanced}
      >
        <span>{showAdvanced ? 'Hide' : 'Show'} Advanced Settings</span>
        <svg
          className={`w-5 h-5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showAdvanced && !autoDetect && (
        <ProtocolAdvancedSettings
          protocol={selectedProtocol}
          settings={advancedSettings}
          onSave={(settings) => {
            setAdvancedSettings(settings)
            showSuccess('Advanced settings saved')
          }}
        />
      )}

      {/* Connection Presets */}
      <ConnectionPresets
        currentConfig={{
          protocol: autoDetect ? 'auto' : selectedProtocol,
          connectionType,
          connectionParams,
          advancedSettings,
        }}
        onLoadPreset={(preset) => {
          setSelectedProtocol(preset.protocol)
          setConnectionType(preset.connectionType)
          setConnectionParams({
            port: preset.connectionParams.port || '/dev/ttyUSB0',
            baudrate: preset.connectionParams.baudrate || 57600,
            host: preset.connectionParams.host || '127.0.0.1',
            portNum: preset.connectionParams.portNum || 14550,
          })
          if (preset.advancedSettings) {
            setAdvancedSettings(preset.advancedSettings)
          }
          setAutoDetect(preset.protocol === 'auto')
          showSuccess(`Loaded preset: ${preset.name}`)
        }}
      />

      {/* Connect button */}
      <button
        onClick={handleConnect}
        className="w-full btn-dji py-3 text-lg font-semibold font-futuristic rounded-xl min-h-[48px]"
        aria-label="Connect to drone using selected protocol and connection settings"
      >
        Connect to Drone
      </button>

      {/* Active connections */}
      {connections.length > 0 && (
        <div className="mt-6 pt-6 border-t border-slate-700">
          <h4 className="text-lg font-semibold text-white mb-4">Active Connections</h4>
          <div className="space-y-3">
            {connections.map((conn) => (
              <div
                key={conn.id}
                className="flex items-center justify-between p-4 bg-slate-800 rounded-lg border border-slate-700"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-white font-medium">{conn.id}</span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        conn.status === 'connected'
                          ? 'bg-green-500/20 text-green-400'
                          : conn.status === 'connecting'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {conn.status.toUpperCase()}
                    </span>
                    <span className="text-slate-400 text-sm">{conn.protocol}</span>
                  </div>
                  {conn.telemetry && (
                    <div className="text-xs text-slate-400 space-y-1">
                      {conn.telemetry.battery && typeof conn.telemetry.battery === 'number' && (
                        <div>Battery: {conn.telemetry?.battery && typeof conn.telemetry.battery === 'number' && !isNaN(conn.telemetry.battery)
                          ? (conn.telemetry.battery * 100).toFixed(0)
                          : '0'}%
                        </div>
                      )}
                      {conn.telemetry.position && 
                       typeof conn.telemetry.position.lat === 'number' && 
                       typeof conn.telemetry.position.lon === 'number' && (
                        <div>
                          Position: {conn.telemetry?.position?.lat && typeof conn.telemetry.position.lat === 'number' && !isNaN(conn.telemetry.position.lat)
                            ? conn.telemetry.position.lat.toFixed(6)
                            : '0.000000'},{' '}
                          {conn.telemetry?.position?.lon && typeof conn.telemetry.position.lon === 'number' && !isNaN(conn.telemetry.position.lon)
                            ? conn.telemetry.position.lon.toFixed(6)
                            : '0.000000'}
                        </div>
                      )}
                      {conn.telemetry.mode && (
                        <div>Mode: {String(conn.telemetry.mode)}</div>
                      )}
                    </div>
                  )}
                </div>
                {conn.status === 'connected' && (
                  <button
                    onClick={() => handleDisconnect(conn.id)}
                    className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm font-medium"
                    aria-label={`Disconnect ${conn.id}`}
                  >
                    Disconnect
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

