/**
 * Unit tests for civilian dashboard constants.
 */
import { MODE_DETECTION_LABELS, CIVILIAN_TABS } from '../constants'

describe('MODE_DETECTION_LABELS', () => {
  it('has labels for all expected modes', () => {
    const modes = ['cattle', 'hunting', 'filming', 'fishing', 'mining', 'people']
    modes.forEach((mode) => {
      expect(MODE_DETECTION_LABELS[mode]).toBeDefined()
      expect(typeof MODE_DETECTION_LABELS[mode]).toBe('string')
      expect(MODE_DETECTION_LABELS[mode].length).toBeGreaterThan(0)
    })
  })

  it('returns fallback-friendly value for people', () => {
    expect(MODE_DETECTION_LABELS['people']).toBe('👥 People')
  })
})

describe('CIVILIAN_TABS', () => {
  it('has exactly 6 tabs', () => {
    expect(CIVILIAN_TABS).toHaveLength(6)
  })

  it('each tab has id, label, shortcut, description', () => {
    const ids = new Set<string>()
    CIVILIAN_TABS.forEach((tab) => {
      expect(tab.id).toBeDefined()
      expect(tab.label).toBeDefined()
      expect(tab.shortcut).toBeDefined()
      expect(tab.description).toBeDefined()
      expect(ids.has(tab.id)).toBe(false)
      ids.add(tab.id)
    })
  })

  it('shortcuts are 1-6', () => {
    const shortcuts = CIVILIAN_TABS.map((t) => t.shortcut)
    expect(shortcuts).toEqual(['1', '2', '3', '4', '5', '6'])
  })
})
