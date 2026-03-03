/** Labels for detection modes used in civilian dashboard. */
export const MODE_DETECTION_LABELS: Record<string, string> = {
  cattle: '🐄 Cattle',
  hunting: '🦌 Wildlife',
  filming: '🎬 Filming',
  fishing: '🐟 Fishing',
  mining: '⛏️ Mining',
  people: '👥 People',
}

export type CivilianMainTabId = 'plan' | 'chat' | 'manual' | 'autonomous' | 'monitoring' | 'advanced'
export type CivilianRightColumnTabId = 'video' | 'analytics' | 'detections'

export const CIVILIAN_TABS: { id: CivilianMainTabId; label: string; shortcut: string; description: string }[] = [
  { id: 'plan', label: 'Operation Planning', shortcut: '1', description: 'Plan routes and operations' },
  { id: 'chat', label: 'AI Chat', shortcut: '2', description: 'Chat with AI assistant' },
  { id: 'manual', label: 'Manual Control', shortcut: '3', description: 'Manual drone control' },
  { id: 'autonomous', label: 'Autonomy', shortcut: '4', description: 'Autonomous operations' },
  { id: 'monitoring', label: 'Monitoring', shortcut: '5', description: 'Video feeds, analytics, and detections' },
  { id: 'advanced', label: 'Advanced', shortcut: '6', description: 'Voice, gesture, VR, and multi-screen controls' },
]
