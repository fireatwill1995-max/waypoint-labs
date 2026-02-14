/**
 * SDK-ready API helpers for drone commands and waypoints.
 * Wire these to your real drone SDK (MAVLink/DroneKit) in production.
 */

export type SDKCommand =
  | 'takeoff'
  | 'land'
  | 'rtl'
  | 'arm'
  | 'disarm'
  | 'goto'
  | 'pause'
  | 'resume'
  | 'set_speed'
  | 'set_altitude'

export interface SDKCommandParams {
  lat?: number
  lon?: number
  alt?: number
  speed?: number
  [key: string]: unknown
}

export interface Waypoint {
  lat: number
  lon: number
  alt: number
}

export interface SDKTelemetry {
  position: { lat: number; lon: number; alt: number }
  heading: number
  speed: number
  battery: number
  mode: string
  armed: boolean
  timestamp: string
}

/**
 * Send a command to the drone (SDK-ready; backend wires to MAVLink/DroneKit).
 */
export async function sendSDKCommand(
  command: SDKCommand | string,
  params?: SDKCommandParams,
  fetchWithAuth?: (url: string, options?: { body?: object }) => Promise<unknown>
): Promise<{ success: boolean; command: string; message?: string }> {
  const url = '/api/sdk/command'
  const body = { command: command.toLowerCase(), params: params ?? {} }
  const fetcher = fetchWithAuth ?? ((u: string, o?: { body?: object }) =>
    fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: o?.body ? JSON.stringify(o.body) : undefined }).then(r => r.json()))
  const res = await fetcher(url, { body }) as { success?: boolean; command?: string; message?: string }
  return { success: res.success ?? false, command: res.command ?? command, message: res.message }
}

/**
 * Upload waypoints for mission (SDK-ready).
 */
export async function uploadWaypoints(
  waypoints: Waypoint[],
  fetchWithAuth?: (url: string, options?: { body?: object }) => Promise<unknown>
): Promise<{ success: boolean; count: number; message?: string }> {
  const url = '/api/sdk/waypoints'
  const body = { waypoints }
  const fetcher = fetchWithAuth ?? ((u: string, o?: { body?: object }) =>
    fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: o?.body ? JSON.stringify(o.body) : undefined }).then(r => r.json()))
  const res = await fetcher(url, { body }) as { success?: boolean; count?: number; message?: string }
  return { success: res.success ?? false, count: res.count ?? 0, message: res.message }
}

/**
 * Fetch current telemetry (SDK-ready).
 */
export async function getSDKTelemetry(
  fetchWithAuth?: (url: string) => Promise<unknown>
): Promise<SDKTelemetry | null> {
  const url = '/api/sdk/telemetry'
  const fetcher = fetchWithAuth ?? ((u: string) => fetch(u).then(r => r.json()))
  try {
    const res = await fetcher(url) as SDKTelemetry
    return res
  } catch {
    return null
  }
}
