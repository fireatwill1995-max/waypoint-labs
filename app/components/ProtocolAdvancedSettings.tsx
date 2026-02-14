'use client'

import { useState } from 'react'

interface ProtocolSettings {
  mavlink: {
    version: number
    packet_signing: boolean
    encryption_key?: string
    heartbeat_interval: number
  }
  dji: {
    sdk_type: 'osdk' | 'psdk' | 'tello'
    encryption_enabled: boolean
    session_key?: string
  }
  parrot: {
    sdk_version: string
    video_codec: 'h264' | 'h265'
    streaming_quality: 'low' | 'medium' | 'high'
  }
  skydio: {
    api_key?: string
    streaming_resolution: '720p' | '1080p' | '4k'
    obstacle_avoidance: boolean
  }
  yuneec: {
    controller_type: 'st16' | 'st16s' | 'st10'
    encryption_enabled: boolean
  }
  autel: {
    sdk_version: string
    video_quality: 'low' | 'medium' | 'high'
  }
  ros: {
    ros_version: '1' | '2'
    namespace?: string
    topic_prefix?: string
  }
  webrtc: {
    ice_servers?: string
    video_codec: 'vp8' | 'vp9' | 'h264'
    audio_enabled: boolean
  }
  stanag: {
    interoperability_level: number
    encryption_enabled: boolean
    secure_handshake: boolean
  }
  military: {
    frequency_hopping: boolean
    anti_jamming: boolean
    encryption_key?: string
    frequency_band: 'c' | 'ku' | 'los'
  }
}

type ProtocolSettingsType = 
  | ProtocolSettings['mavlink']
  | ProtocolSettings['dji']
  | ProtocolSettings['stanag']
  | ProtocolSettings['military']
  | Record<string, unknown>

interface ProtocolAdvancedSettingsProps {
  protocol: string
  settings: ProtocolSettingsType
  onSave: (settings: ProtocolSettingsType) => void
}

export default function ProtocolAdvancedSettings({
  protocol,
  settings,
  onSave,
}: ProtocolAdvancedSettingsProps) {
  const [localSettings, setLocalSettings] = useState(settings || {})

  const handleSave = () => {
    onSave(localSettings)
  }

  const renderMAVLinkSettings = () => {
    const mavlinkSettings = localSettings as ProtocolSettings['mavlink']
    return (
    <div className="space-y-4">
      <div>
        <label className="block text-slate-300 text-sm font-medium mb-2">
          MAVLink Version
        </label>
        <select
          value={mavlinkSettings.version || 2}
          onChange={(e) =>
            setLocalSettings({ ...mavlinkSettings, version: parseInt(e.target.value) } as ProtocolSettingsType)
          }
          className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
        >
          <option value={1}>MAVLink 1.0</option>
          <option value={2}>MAVLink 2.0</option>
        </select>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="packet_signing"
          checked={mavlinkSettings.packet_signing !== false}
          onChange={(e) =>
            setLocalSettings({ ...mavlinkSettings, packet_signing: e.target.checked } as ProtocolSettingsType)
          }
          className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-blue-500"
        />
        <label htmlFor="packet_signing" className="text-slate-200 cursor-pointer">
          Enable Packet Signing (MAVLink 2.0)
        </label>
      </div>

      <div>
        <label className="block text-slate-300 text-sm font-medium mb-2">
          Encryption Key (optional)
        </label>
        <input
          type="password"
          value={mavlinkSettings.encryption_key || ''}
          onChange={(e) =>
            setLocalSettings({ ...mavlinkSettings, encryption_key: e.target.value } as ProtocolSettingsType)
          }
          className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
          placeholder="Leave empty for default"
        />
      </div>

      <div>
        <label className="block text-slate-300 text-sm font-medium mb-2">
          Heartbeat Interval (ms)
        </label>
        <input
          type="number"
          value={mavlinkSettings.heartbeat_interval || 1000}
          onChange={(e) => {
            const parsed = parseInt(e.target.value)
            const safeInterval = !isNaN(parsed) && parsed >= 100 && parsed <= 60000
              ? parsed
              : 1000
            setLocalSettings({
              ...mavlinkSettings,
              heartbeat_interval: safeInterval,
            } as ProtocolSettingsType)
          }}
          className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
        />
      </div>
    </div>
    )
  }

  const renderDJISettings = () => {
    const djiSettings = localSettings as ProtocolSettings['dji']
    return (
    <div className="space-y-4">
      <div>
        <label className="block text-slate-300 text-sm font-medium mb-2">
          SDK Type
        </label>
        <select
          value={djiSettings.sdk_type || 'osdk'}
          onChange={(e) =>
            setLocalSettings({ ...djiSettings, sdk_type: e.target.value as 'osdk' | 'psdk' | 'tello' } as ProtocolSettingsType)
          }
          className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
        >
          <option value="osdk">OSDK (Onboard SDK)</option>
          <option value="psdk">PSDK (Payload SDK)</option>
          <option value="tello">Tello SDK</option>
        </select>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="dji_encryption"
          checked={djiSettings.encryption_enabled !== false}
          onChange={(e) =>
            setLocalSettings({ ...djiSettings, encryption_enabled: e.target.checked } as ProtocolSettingsType)
          }
          className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-blue-500"
        />
        <label htmlFor="dji_encryption" className="text-slate-200 cursor-pointer">
          Enable OcuSync Encryption
        </label>
      </div>

      <div>
        <label className="block text-slate-300 text-sm font-medium mb-2">
          Session Key (optional)
        </label>
        <input
          type="password"
          value={djiSettings.session_key || ''}
          onChange={(e) =>
            setLocalSettings({ ...djiSettings, session_key: e.target.value } as ProtocolSettingsType)
          }
          className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
          placeholder="Auto-generated if empty"
        />
      </div>
    </div>
    )
  }

  const renderSTANAGSettings = () => {
    const stanagSettings = localSettings as ProtocolSettings['stanag']
    return (
    <div className="space-y-4">
      <div>
        <label className="block text-slate-300 text-sm font-medium mb-2">
          Interoperability Level
        </label>
        <select
          value={stanagSettings.interoperability_level || 3}
          onChange={(e) =>
            setLocalSettings({
              ...stanagSettings,
              interoperability_level: parseInt(e.target.value),
            } as ProtocolSettingsType)
          }
          className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
        >
          <option value={1}>Level 1 - Telemetry</option>
          <option value={2}>Level 2 - Control</option>
          <option value={3}>Level 3 - Mission</option>
          <option value={4}>Level 4 - Payload</option>
          <option value={5}>Level 5 - Full</option>
        </select>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="stanag_encryption"
          checked={stanagSettings.encryption_enabled !== false}
          onChange={(e) =>
            setLocalSettings({ ...stanagSettings, encryption_enabled: e.target.checked } as ProtocolSettingsType)
          }
          className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-blue-500"
        />
        <label htmlFor="stanag_encryption" className="text-slate-200 cursor-pointer">
          Enable AES-256 Encryption
        </label>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="secure_handshake"
          checked={stanagSettings.secure_handshake !== false}
          onChange={(e) =>
            setLocalSettings({ ...stanagSettings, secure_handshake: e.target.checked } as ProtocolSettingsType)
          }
          className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-blue-500"
        />
        <label htmlFor="secure_handshake" className="text-slate-200 cursor-pointer">
          Secure Handshake Protocol
        </label>
      </div>
    </div>
    )
  }

  const renderMilitarySettings = () => {
    const militarySettings = localSettings as ProtocolSettings['military']
    return (
    <div className="space-y-4">
      <div>
        <label className="block text-slate-300 text-sm font-medium mb-2">
          Frequency Band
        </label>
        <select
          value={militarySettings.frequency_band || 'ku'}
          onChange={(e) =>
            setLocalSettings({ ...militarySettings, frequency_band: e.target.value as 'c' | 'ku' | 'los' } as ProtocolSettingsType)
          }
          className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
        >
          <option value="c">C-Band (LOS)</option>
          <option value="ku">Ku-Band (SATCOM)</option>
          <option value="los">Line of Sight</option>
        </select>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="frequency_hopping"
          checked={militarySettings.frequency_hopping !== false}
          onChange={(e) =>
            setLocalSettings({ ...militarySettings, frequency_hopping: e.target.checked } as ProtocolSettingsType)
          }
          className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-blue-500"
        />
        <label htmlFor="frequency_hopping" className="text-slate-200 cursor-pointer">
          Frequency Hopping Spread Spectrum (FHSS)
        </label>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="anti_jamming"
          checked={militarySettings.anti_jamming !== false}
          onChange={(e) =>
            setLocalSettings({ ...militarySettings, anti_jamming: e.target.checked } as ProtocolSettingsType)
          }
          className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-blue-500"
        />
        <label htmlFor="anti_jamming" className="text-slate-200 cursor-pointer">
          Anti-Jamming Protection
        </label>
      </div>

      <div>
        <label className="block text-slate-300 text-sm font-medium mb-2">
          Encryption Key (optional)
        </label>
        <input
          type="password"
          value={militarySettings.encryption_key || ''}
          onChange={(e) =>
            setLocalSettings({ ...militarySettings, encryption_key: e.target.value } as ProtocolSettingsType)
          }
          className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
          placeholder="Military-grade encryption key"
        />
      </div>
    </div>
    )
  }

  const renderParrotSettings = () => {
    const parrotSettings = localSettings as ProtocolSettings['parrot']
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-2">
            SDK Version
          </label>
          <select
            value={parrotSettings.sdk_version || '3.14'}
            onChange={(e) =>
              setLocalSettings({ ...parrotSettings, sdk_version: e.target.value } as ProtocolSettingsType)
            }
            className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
          >
            <option value="3.14">ARSDK 3.14</option>
            <option value="3.15">ARSDK 3.15</option>
            <option value="4.0">ARSDK 4.0</option>
          </select>
        </div>
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-2">
            Video Codec
          </label>
          <select
            value={parrotSettings.video_codec || 'h264'}
            onChange={(e) =>
              setLocalSettings({ ...parrotSettings, video_codec: e.target.value as 'h264' | 'h265' } as ProtocolSettingsType)
            }
            className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
          >
            <option value="h264">H.264</option>
            <option value="h265">H.265</option>
          </select>
        </div>
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-2">
            Streaming Quality
          </label>
          <select
            value={parrotSettings.streaming_quality || 'high'}
            onChange={(e) =>
              setLocalSettings({ ...parrotSettings, streaming_quality: e.target.value as 'low' | 'medium' | 'high' } as ProtocolSettingsType)
            }
            className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>
    )
  }

  const renderSkydioSettings = () => {
    const skydioSettings = localSettings as ProtocolSettings['skydio']
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-2">
            API Key
          </label>
          <input
            type="password"
            value={skydioSettings.api_key || ''}
            onChange={(e) =>
              setLocalSettings({ ...skydioSettings, api_key: e.target.value } as ProtocolSettingsType)
            }
            className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
            placeholder="Enter Skydio API key"
          />
        </div>
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-2">
            Streaming Resolution
          </label>
          <select
            value={skydioSettings.streaming_resolution || '1080p'}
            onChange={(e) =>
              setLocalSettings({ ...skydioSettings, streaming_resolution: e.target.value as '720p' | '1080p' | '4k' } as ProtocolSettingsType)
            }
            className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
          >
            <option value="720p">720p</option>
            <option value="1080p">1080p</option>
            <option value="4k">4K</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="obstacle_avoidance"
            checked={skydioSettings.obstacle_avoidance !== false}
            onChange={(e) =>
              setLocalSettings({ ...skydioSettings, obstacle_avoidance: e.target.checked } as ProtocolSettingsType)
            }
            className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-blue-500"
          />
          <label htmlFor="obstacle_avoidance" className="text-slate-200 cursor-pointer">
            Enable Obstacle Avoidance
          </label>
        </div>
      </div>
    )
  }

  const renderYuneecSettings = () => {
    const yuneecSettings = localSettings as ProtocolSettings['yuneec']
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-2">
            Controller Type
          </label>
          <select
            value={yuneecSettings.controller_type || 'st16'}
            onChange={(e) =>
              setLocalSettings({ ...yuneecSettings, controller_type: e.target.value as 'st16' | 'st16s' | 'st10' } as ProtocolSettingsType)
            }
            className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
          >
            <option value="st16">ST16</option>
            <option value="st16s">ST16S</option>
            <option value="st10">ST10</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="yuneec_encryption"
            checked={yuneecSettings.encryption_enabled !== false}
            onChange={(e) =>
              setLocalSettings({ ...yuneecSettings, encryption_enabled: e.target.checked } as ProtocolSettingsType)
            }
            className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-blue-500"
          />
          <label htmlFor="yuneec_encryption" className="text-slate-200 cursor-pointer">
            Enable Encryption
          </label>
        </div>
      </div>
    )
  }

  const renderAutelSettings = () => {
    const autelSettings = localSettings as ProtocolSettings['autel']
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-2">
            SDK Version
          </label>
          <input
            type="text"
            value={autelSettings.sdk_version || '1.0'}
            onChange={(e) =>
              setLocalSettings({ ...autelSettings, sdk_version: e.target.value } as ProtocolSettingsType)
            }
            className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
            placeholder="1.0"
          />
        </div>
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-2">
            Video Quality
          </label>
          <select
            value={autelSettings.video_quality || 'high'}
            onChange={(e) =>
              setLocalSettings({ ...autelSettings, video_quality: e.target.value as 'low' | 'medium' | 'high' } as ProtocolSettingsType)
            }
            className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>
    )
  }

  const renderROSSettings = () => {
    const rosSettings = localSettings as ProtocolSettings['ros']
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-2">
            ROS Version
          </label>
          <select
            value={rosSettings.ros_version || '2'}
            onChange={(e) =>
              setLocalSettings({ ...rosSettings, ros_version: e.target.value as '1' | '2' } as ProtocolSettingsType)
            }
            className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
          >
            <option value="1">ROS 1 (Noetic)</option>
            <option value="2">ROS 2 (Humble/Iron)</option>
          </select>
        </div>
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-2">
            Namespace (optional)
          </label>
          <input
            type="text"
            value={rosSettings.namespace || ''}
            onChange={(e) =>
              setLocalSettings({ ...rosSettings, namespace: e.target.value } as ProtocolSettingsType)
            }
            className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
            placeholder="/drone1"
          />
        </div>
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-2">
            Topic Prefix (optional)
          </label>
          <input
            type="text"
            value={rosSettings.topic_prefix || ''}
            onChange={(e) =>
              setLocalSettings({ ...rosSettings, topic_prefix: e.target.value } as ProtocolSettingsType)
            }
            className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
            placeholder="mavros"
          />
        </div>
      </div>
    )
  }

  const renderWebRTCSettings = () => {
    const webrtcSettings = localSettings as ProtocolSettings['webrtc']
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-2">
            ICE Servers (optional)
          </label>
          <input
            type="text"
            value={webrtcSettings.ice_servers || ''}
            onChange={(e) =>
              setLocalSettings({ ...webrtcSettings, ice_servers: e.target.value } as ProtocolSettingsType)
            }
            className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
            placeholder="stun:stun.l.google.com:19302"
          />
        </div>
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-2">
            Video Codec
          </label>
          <select
            value={webrtcSettings.video_codec || 'vp8'}
            onChange={(e) =>
              setLocalSettings({ ...webrtcSettings, video_codec: e.target.value as 'vp8' | 'vp9' | 'h264' } as ProtocolSettingsType)
            }
            className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
          >
            <option value="vp8">VP8</option>
            <option value="vp9">VP9</option>
            <option value="h264">H.264</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="audio_enabled"
            checked={webrtcSettings.audio_enabled !== false}
            onChange={(e) =>
              setLocalSettings({ ...webrtcSettings, audio_enabled: e.target.checked } as ProtocolSettingsType)
            }
            className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-blue-500"
          />
          <label htmlFor="audio_enabled" className="text-slate-200 cursor-pointer">
            Enable Audio
          </label>
        </div>
      </div>
    )
  }

  const renderSettings = () => {
    const protocolLower = protocol.toLowerCase()
    switch (protocolLower) {
      case 'mavlink':
      case 'px4':
      case 'ardupilot':
      case 'betaflight':
      case 'inav':
        return renderMAVLinkSettings()
      case 'dji':
      case 'dji_tello':
      case 'dji_mini':
      case 'dji_air':
      case 'dji_fpv':
      case 'osdk':
      case 'psdk':
        return renderDJISettings()
      case 'parrot':
        return renderParrotSettings()
      case 'skydio':
        return renderSkydioSettings()
      case 'yuneec':
        return renderYuneecSettings()
      case 'autel':
        return renderAutelSettings()
      case 'ros':
      case 'ros2':
        return renderROSSettings()
      case 'webrtc':
        return renderWebRTCSettings()
      case 'stanag':
      case 'stanag_4586':
      case 'nato':
        return renderSTANAGSettings()
      case 'bayraktar':
      case 'mq9_reaper':
      case 'heron_tp':
      case 'military':
        return renderMilitarySettings()
      case 'holy_stone':
      case 'potensic':
      case 'walkera':
      case 'hubsan':
      case 'eachine':
      case 'fimi':
      case 'power_vision':
      case 'zerotech':
      case '3dr':
        // These typically use MAVLink or similar protocols
        return renderMAVLinkSettings()
      case 'lora':
      case '4g_5g':
      case 'satellite':
      case 'mesh':
        // Network protocol settings
        return (
          <div className="space-y-4">
            <div className="text-slate-400 text-sm">
              Network protocol settings are configured through connection parameters.
              Advanced settings may be available depending on the specific implementation.
            </div>
          </div>
        )
      default:
        return (
          <div className="text-slate-400 text-sm">
            No advanced settings available for this protocol
          </div>
        )
    }
  }

  return (
    <div className="card-glass p-6 space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-2">
          Advanced Settings - {protocol.toUpperCase()}
        </h3>
        <p className="text-slate-400 text-sm">
          Configure protocol-specific options and encryption
        </p>
      </div>

      {renderSettings()}

      <div className="flex gap-3 pt-4 border-t border-slate-700">
        <button
          onClick={handleSave}
          className="flex-1 btn-primary py-2 font-semibold"
        >
          Save Settings
        </button>
        <button
          onClick={() => setLocalSettings(settings || {})}
          className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  )
}

