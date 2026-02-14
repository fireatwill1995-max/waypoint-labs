'use client'

import { useEffect, useRef, useState } from 'react'
import { logger } from '../lib/logger'
import type { Waypoint, DroneInstance } from '../types/api'

interface WindowWithCesium extends Window {
  Cesium?: unknown
  CESIUM_BASE_URL?: string
}

interface CesiumMissionViewProps {
  waypoints?: Waypoint[]
  drones?: DroneInstance[]
  onWaypointAdd?: (waypoint: Waypoint) => void
  onWaypointUpdate?: (waypoint: Waypoint) => void
  onWaypointDelete?: (waypointId: string) => void
  mode?: 'cattle' | 'hunting' | 'people' | 'filming' | 'fishing' | 'mining'
}

export default function CesiumMissionView({
  waypoints = [],
  drones = [],
  onWaypointAdd,
  onWaypointUpdate: _onWaypointUpdate,
  onWaypointDelete: _onWaypointDelete,
  mode,
}: CesiumMissionViewProps) {
  const cesiumContainerRef = useRef<HTMLDivElement>(null)
  const [cesiumLoaded, setCesiumLoaded] = useState(false)
  interface CesiumEntity {
    position?: unknown
    [key: string]: unknown
  }
  
  interface CesiumViewer {
    entities: {
      add: (entity: unknown) => CesiumEntity
      removeAll: () => void
      getById: (id: string) => unknown
    }
    camera: {
      setView: (options: unknown) => void
      pickEllipsoid: (position: unknown, ellipsoid: unknown) => unknown | null
    }
    scene: {
      canvas: HTMLCanvasElement
      globe: {
        ellipsoid: unknown
      }
    }
    destroy: () => void
  }
  const [viewer, setViewer] = useState<CesiumViewer | null>(null)
  const viewerRef = useRef<CesiumViewer | null>(null)

  useEffect(() => {
    // Dynamically load Cesium
    const loadCesium = async () => {
      try {
        // Check if Cesium is already loaded
        if ((window as WindowWithCesium).Cesium) {
          initializeCesium()
          return
        }

        // Load Cesium from CDN
        const script = document.createElement('script')
        script.src = 'https://cesium.com/downloads/cesiumjs/releases/1.110/Build/Cesium/Cesium.js'
        script.onload = () => {
          // Load CSS
          const link = document.createElement('link')
          link.rel = 'stylesheet'
          link.href = 'https://cesium.com/downloads/cesiumjs/releases/1.110/Build/Cesium/Widgets/widgets.css'
          document.head.appendChild(link)
          
          ;(window as WindowWithCesium).CESIUM_BASE_URL = 'https://cesium.com/downloads/cesiumjs/releases/1.110/Build/Cesium/'
          initializeCesium()
        }
        script.onerror = () => {
          logger.error('Failed to load Cesium. Using fallback map view.')
          setCesiumLoaded(false)
        }
        document.head.appendChild(script)
      } catch (error) {
        logger.error('Error loading Cesium:', error)
        setCesiumLoaded(false)
      }
    }

    const initializeCesium = () => {
      if (!cesiumContainerRef.current) return

      try {
        const Cesium = (window as WindowWithCesium).Cesium
        if (!Cesium) {
          logger.error('Cesium not available')
          return
        }

        const token = typeof process.env.NEXT_PUBLIC_CESIUM_ION_ACCESS_TOKEN === 'string' ? process.env.NEXT_PUBLIC_CESIUM_ION_ACCESS_TOKEN : ''
        const C = Cesium as { Ion?: { defaultAccessToken?: string } }
        if (token && C.Ion) C.Ion.defaultAccessToken = token

        // Initialize viewer
        const cesiumCesium = Cesium as {
          Viewer: new (container: HTMLElement, options: unknown) => CesiumViewer
          createWorldTerrain: () => unknown
          OpenStreetMapImageryProvider: new (options: { url: string }) => unknown
          Cartesian3: {
            fromDegrees: (lon: number, lat: number, height: number) => unknown
            new: (x: number, y: number, z: number) => unknown
          }
          Cartesian2: new (x: number, y: number) => unknown
          Color: {
            YELLOW: unknown
            BLACK: unknown
            WHITE: unknown
            CYAN: unknown
          }
          HeightReference: {
            CLAMP_TO_GROUND: unknown
          }
          LabelStyle: {
            FILL_AND_OUTLINE: unknown
          }
          VerticalOrigin: {
            BOTTOM: unknown
          }
          ScreenSpaceEventType: {
            LEFT_CLICK: unknown
          }
          ScreenSpaceEventHandler: new (canvas: HTMLCanvasElement) => {
            setInputAction: (callback: (click: { position: unknown }) => void, eventType: unknown) => void
          }
          Math: {
            toDegrees: (radians: number) => number
          }
          Cartographic: {
            fromCartesian: (cartesian: unknown) => { longitude: number; latitude: number; height?: number }
          }
          CallbackProperty: new (callback: () => unknown, isConstant: boolean) => unknown
          PolylineGlowMaterialProperty: new (options: { glowPower: number; color: unknown }) => unknown
        }
        
        const cesiumViewer = new cesiumCesium.Viewer(cesiumContainerRef.current, {
          terrainProvider: cesiumCesium.createWorldTerrain(),
          imageryProvider: new cesiumCesium.OpenStreetMapImageryProvider({
            url: 'https://a.tile.openstreetmap.org/'
          }),
          baseLayerPicker: true,
          vrButton: false,
          geocoder: true,
          homeButton: true,
          infoBox: true,
          sceneModePicker: true,
          selectionIndicator: true,
          timeline: true,
          navigationHelpButton: true,
          animation: true,
          fullscreenButton: true,
        })

        // Set initial view
        cesiumViewer.camera.setView({
          destination: cesiumCesium.Cartesian3.fromDegrees(
            waypoints[0]?.lon || 0,
            waypoints[0]?.lat || 0,
            10000
          )
        })

        // Add waypoints
        if (waypoints.length > 0) {
          waypoints.forEach((wp, index) => {
            const entity = cesiumViewer.entities.add({
              position: cesiumCesium.Cartesian3.fromDegrees(wp.lon, wp.lat, wp.alt),
              point: {
                pixelSize: 10,
                color: cesiumCesium.Color.YELLOW,
                outlineColor: cesiumCesium.Color.BLACK,
                outlineWidth: 2,
                heightReference: cesiumCesium.HeightReference.CLAMP_TO_GROUND,
              },
              label: {
                text: wp.name || `Waypoint ${index + 1}`,
                font: '14pt sans-serif',
                fillColor: cesiumCesium.Color.WHITE,
                outlineColor: cesiumCesium.Color.BLACK,
                outlineWidth: 2,
                style: cesiumCesium.LabelStyle.FILL_AND_OUTLINE,
                verticalOrigin: cesiumCesium.VerticalOrigin.BOTTOM,
                pixelOffset: new cesiumCesium.Cartesian2(0, -32),
              },
              description: `
                <table>
                  <tr><td>Latitude:</td><td>${wp.lat.toFixed(6)}</td></tr>
                  <tr><td>Longitude:</td><td>${wp.lon.toFixed(6)}</td></tr>
                  <tr><td>Altitude:</td><td>${wp.alt}m</td></tr>
                </table>
              `,
            })

            // Make waypoint draggable
            entity.position = new cesiumCesium.CallbackProperty(() => {
              return cesiumCesium.Cartesian3.fromDegrees(wp.lon, wp.lat, wp.alt)
            }, false)
          })

          // Draw route line
          if (waypoints.length > 1) {
            const positions = waypoints.map(wp =>
              cesiumCesium.Cartesian3.fromDegrees(wp.lon, wp.lat, wp.alt)
            )
            
            cesiumViewer.entities.add({
              polyline: {
                positions: positions,
                width: 3,
                material: new cesiumCesium.PolylineGlowMaterialProperty({
                  glowPower: 0.2,
                  color: cesiumCesium.Color.CYAN,
                }),
                clampToGround: false,
              },
            })
          }
        }

        // Add drone entities
        drones.forEach((drone) => {
          if (drone.position) {
            cesiumViewer.entities.add({
              position: cesiumCesium.Cartesian3.fromDegrees(
                drone.position.lon,
                drone.position.lat,
                drone.position.alt
              ),
              model: {
                uri: '/models/drone.glb', // You'll need to add a drone model
                minimumPixelSize: 64,
                maximumScale: 20000,
              },
              label: {
                text: drone.name,
                font: '12pt sans-serif',
                fillColor: cesiumCesium.Color.CYAN,
                outlineColor: cesiumCesium.Color.BLACK,
                outlineWidth: 2,
                style: cesiumCesium.LabelStyle.FILL_AND_OUTLINE,
                verticalOrigin: cesiumCesium.VerticalOrigin.BOTTOM,
                pixelOffset: new cesiumCesium.Cartesian2(0, -40),
              },
              description: `
                <table>
                  <tr><td>Status:</td><td>${drone.status}</td></tr>
                  <tr><td>Battery:</td><td>${drone.battery || 'N/A'}%</td></tr>
                  <tr><td>Speed:</td><td>${drone.speed || 0}m/s</td></tr>
                </table>
              `,
            })
          }
        })

        // Enable click to add waypoints
        try {
          const handler = new cesiumCesium.ScreenSpaceEventHandler(cesiumViewer.scene.canvas)
          handler.setInputAction((click: { position: unknown }) => {
            try {
              const cartesian = cesiumViewer.camera.pickEllipsoid(
                click.position,
                cesiumViewer.scene.globe.ellipsoid
              )
              if (cartesian) {
                const cartographic = cesiumCesium.Cartographic.fromCartesian(cartesian)
                const lon = cesiumCesium.Math.toDegrees(cartographic.longitude)
                const lat = cesiumCesium.Math.toDegrees(cartographic.latitude)
                const alt = cartographic.height || 100

                if (onWaypointAdd) {
                  onWaypointAdd({
                    id: `wp_${Date.now()}`,
                    lat,
                    lon,
                    alt,
                    name: `Waypoint ${waypoints.length + 1}`,
                  })
                }
              }
            } catch (err) {
              logger.error('Error handling waypoint click:', err)
            }
          }, cesiumCesium.ScreenSpaceEventType.LEFT_CLICK)
          } catch (err) {
            logger.error('Error setting up Cesium click handler:', err)
          }

        setViewer(cesiumViewer)
        viewerRef.current = cesiumViewer
        setCesiumLoaded(true)
      } catch (error) {
        logger.error('Error initializing Cesium:', error)
        setCesiumLoaded(false)
      }
    }

    loadCesium()

    return () => {
      if (viewerRef.current) {
        try {
          viewerRef.current.destroy()
          viewerRef.current = null
        } catch (err) {
          // Ignore errors during cleanup
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

  // Update waypoints when they change
  useEffect(() => {
    if (!viewer || !cesiumLoaded) return

    interface WindowWithCesium extends Window {
      Cesium?: unknown
      CESIUM_BASE_URL?: string
    }

    const Cesium = (window as WindowWithCesium).Cesium
    if (!Cesium) {
      // Cesium not available, skip update
      return
    }

    try {
      // Clear existing entities
      viewer.entities.removeAll()

      // Re-add waypoints
      waypoints.forEach((wp, index) => {
        try {
          viewer.entities.add({
            position: (Cesium as { Cartesian3: { fromDegrees: (lon: number, lat: number, alt: number) => unknown } }).Cartesian3.fromDegrees(wp.lon, wp.lat, wp.alt),
            point: {
              pixelSize: 10,
              color: (Cesium as { Color: { YELLOW: unknown } }).Color.YELLOW,
              outlineColor: (Cesium as { Color: { BLACK: unknown } }).Color.BLACK,
              outlineWidth: 2,
            },
            label: {
              text: wp.name || `Waypoint ${index + 1}`,
              font: '14pt sans-serif',
            },
          })
        } catch (err) {
          logger.error('Error adding waypoint to Cesium:', err)
        }
      })

      // Re-add route
      if (waypoints.length > 1) {
        try {
          const positions = waypoints.map(wp =>
            (Cesium as { Cartesian3: { fromDegrees: (lon: number, lat: number, alt: number) => unknown } }).Cartesian3.fromDegrees(wp.lon, wp.lat, wp.alt)
          )
          viewer.entities.add({
            polyline: {
              positions: positions,
              width: 3,
              material: (Cesium as { Color: { CYAN: unknown } }).Color.CYAN,
            },
          })
        } catch (err) {
          logger.error('Error adding route to Cesium:', err)
        }
      }
    } catch (err) {
      logger.error('Error updating Cesium waypoints:', err)
    }
  }, [waypoints, viewer, cesiumLoaded])

  // Update drone positions
  useEffect(() => {
    if (!viewer || !cesiumLoaded) return

    drones.forEach((drone) => {
      if (drone.position) {
        interface WindowWithCesium extends Window {
          Cesium?: unknown
          CESIUM_BASE_URL?: string
        }
        const Cesium = (window as WindowWithCesium).Cesium
        if (!Cesium) {
          return // Cesium not available
        }
        
        const cesiumCesium = Cesium as {
          Cartesian3: { fromDegrees: (lon: number, lat: number, alt: number) => unknown }
          Color: { CYAN: unknown }
        }
        
        // Update or add drone entity
        try {
          const existing = viewer.entities.getById(drone.id)
          if (existing) {
            // Update existing entity position
            ;(existing as { position: unknown }).position = cesiumCesium.Cartesian3.fromDegrees(
              drone.position.lon,
              drone.position.lat,
              drone.position.alt
            )
          } else {
            // Add new drone entity
            viewer.entities.add({
              id: drone.id,
              position: cesiumCesium.Cartesian3.fromDegrees(
                drone.position.lon,
                drone.position.lat,
                drone.position.alt
              ),
              point: {
                pixelSize: 8,
                color: cesiumCesium.Color.CYAN,
              },
              label: {
                text: drone.name,
              },
            })
          }
        } catch (err) {
          logger.error('Error updating drone in Cesium:', err)
        }
      }
    })
  }, [drones, viewer, cesiumLoaded])

  if (!cesiumLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center glass border border-white/20 rounded-xl">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading 3D Mission View...</p>
          <p className="text-xs text-slate-500 mt-2">Using fallback map view</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative">
      <div ref={cesiumContainerRef} className="w-full h-full rounded-xl overflow-hidden" />
      <div className="absolute top-4 left-4 glass-strong border border-white/20 rounded-lg p-3 z-10">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
          <span className="text-sm text-white">Waypoints: {waypoints.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
          <span className="text-sm text-white">Drones: {drones.length}</span>
        </div>
        {mode && (
          <div className="mt-2 text-xs text-slate-400">
            Mode: {mode ? String(mode).charAt(0).toUpperCase() + String(mode).slice(1) : 'Unknown'}
          </div>
        )}
      </div>
    </div>
  )
}
