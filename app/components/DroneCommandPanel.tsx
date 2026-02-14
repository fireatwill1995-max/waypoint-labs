'use client'

import { useState } from 'react'
import { useApi } from '../lib/api'
import { useToast } from '../hooks/useToast'
import { logger } from '../lib/logger'
import type { DroneInstance, DroneCommand } from '../types/api'

interface DroneCommandPanelProps {
  drone: DroneInstance
  mode: 'cattle' | 'hunting' | 'people' | 'filming' | 'fishing' | 'mining'
}

export default function DroneCommandPanel({ drone, mode: _mode }: DroneCommandPanelProps) {
  const { fetchWithAuth } = useApi()
  const { error: showError } = useToast()
  const [command, setCommand] = useState<DroneCommand['command']>('hover')
  const [target, setTarget] = useState({ lat: '', lon: '', alt: '' })
  const [speed, setSpeed] = useState('5')
  const [radius, setRadius] = useState('50')
  const [isExecuting, setIsExecuting] = useState(false)

  const executeCommand = async () => {
    setIsExecuting(true)
    try {
      // Validate inputs
      const speedValue = parseFloat(speed)
      if (isNaN(speedValue) || speedValue < 0 || speedValue > 20) {
        throw new Error('Invalid speed value. Must be between 0 and 20 m/s')
      }

      const commandData: DroneCommand = {
        droneId: drone.id,
        command,
        parameters: {
          speed: speedValue,
          ...(target.lat && target.lon && {
            target: {
              lat: (() => {
                const parsed = parseFloat(target.lat)
                return !isNaN(parsed) && parsed >= -90 && parsed <= 90 ? parsed : 0
              })(),
              lon: (() => {
                const parsed = parseFloat(target.lon)
                return !isNaN(parsed) && parsed >= -180 && parsed <= 180 ? parsed : 0
              })(),
              alt: (() => {
                const parsed = parseFloat(target.alt)
                return !isNaN(parsed) && parsed >= -500 && parsed <= 20000 ? parsed : 100
              })(),
            },
          }),
          ...(radius && { radius: parseFloat(radius) }),
        },
      }

      await fetchWithAuth('/api/civilian/drone/command', {
        method: 'POST',
        body: JSON.stringify(commandData),
      })
    } catch (error: unknown) {
      logger.error('Failed to execute command:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to execute command'
      showError(errorMessage)
    } finally {
      setIsExecuting(false)
    }
  }

  const quickCommands = [
    { cmd: 'hover', label: 'Hover', icon: '⏸️' },
    { cmd: 'return', label: 'Return', icon: '🏠' },
    { cmd: 'land', label: 'Land', icon: '🛬' },
    { cmd: 'takeoff', label: 'Takeoff', icon: '🚁' },
  ]

  return (
    <div className="card-glass p-4 border border-blue-500/30">
      <h4 className="text-lg font-bold text-white mb-4">Command: {drone.name}</h4>
      
      {/* Quick Commands */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {quickCommands.map((qc) => (
          <button
            key={qc.cmd}
            onClick={async () => {
              try {
                setCommand(qc.cmd as DroneCommand['command'])
                await executeCommand()
              } catch (error) {
                // Error already handled in executeCommand
                // Just prevent unhandled promise rejection
              }
            }}
            disabled={isExecuting}
            className="btn-secondary text-sm py-2"
          >
            <span className="mr-1">{qc.icon}</span>
            {qc.label}
          </button>
        ))}
      </div>

      {/* Command Selection */}
      <div className="mb-4">
        <label className="text-sm text-slate-300 mb-2 block">Command Type</label>
        <select
          value={command}
          onChange={(e) => setCommand(e.target.value as DroneCommand['command'])}
          className="glass border border-white/20 rounded-lg px-3 py-2 w-full text-white"
        >
          <option value="hover">Hover</option>
          <option value="move">Move to Position</option>
          <option value="follow">Follow Target</option>
          <option value="orbit">Orbit Point</option>
          <option value="patrol">Patrol Route</option>
          <option value="return">Return to Base</option>
          <option value="land">Land</option>
          <option value="takeoff">Takeoff</option>
        </select>
      </div>

      {/* Parameters */}
      {(command === 'move' || command === 'follow' || command === 'orbit') && (
        <div className="space-y-3 mb-4">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-sm text-slate-300 mb-1 block">Latitude</label>
              <input
                type="number"
                step="any"
                value={target.lat}
                onChange={(e) => setTarget((prev) => ({ ...prev, lat: e.target.value }))}
                className="glass border border-white/20 rounded-lg px-3 py-2 w-full text-sm text-white"
                placeholder="0.0"
              />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1 block">Longitude</label>
              <input
                type="number"
                step="any"
                value={target.lon}
                onChange={(e) => setTarget((prev) => ({ ...prev, lon: e.target.value }))}
                className="glass border border-white/20 rounded-lg px-3 py-2 w-full text-sm text-white"
                placeholder="0.0"
              />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1 block">Altitude (m)</label>
              <input
                type="number"
                step="any"
                value={target.alt}
                onChange={(e) => setTarget((prev) => ({ ...prev, alt: e.target.value }))}
                className="glass border border-white/20 rounded-lg px-3 py-2 w-full text-sm text-white"
                placeholder="100"
              />
            </div>
          </div>
        </div>
      )}

      {(command === 'move' || command === 'follow' || command === 'orbit' || command === 'patrol') && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-sm text-slate-300 mb-1 block">Speed (m/s)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="20"
              value={speed}
              onChange={(e) => setSpeed(e.target.value)}
              className="glass border border-white/20 rounded-lg px-3 py-2 w-full text-sm text-white"
            />
          </div>
          {(command === 'orbit' || command === 'patrol') && (
            <div>
              <label className="text-sm text-slate-300 mb-1 block">Radius (m)</label>
              <input
                type="number"
                step="1"
                min="10"
                max="500"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                className="glass border border-white/20 rounded-lg px-3 py-2 w-full text-sm text-white"
              />
            </div>
          )}
        </div>
      )}

      {/* Execute Button */}
      <button
        onClick={executeCommand}
        disabled={isExecuting || (command !== 'hover' && command !== 'return' && command !== 'land' && command !== 'takeoff' && (!target.lat || !target.lon))}
        className="btn-primary w-full"
      >
        {isExecuting ? 'Executing...' : 'Execute Command'}
      </button>
    </div>
  )
}
