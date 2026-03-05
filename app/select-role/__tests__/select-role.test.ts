/**
 * Basic validation for select-role page role configuration.
 */
const ROLES = [
  { id: 'civilian', title: 'Civilian', href: '/civilian' },
  { id: 'military', title: 'Military', href: '/military' },
  { id: 'admin', title: 'Admin', href: '/admin' },
  { id: 'pilot', title: 'Pilot', href: '/pilot' },
] as const

describe('Select Role page', () => {
  it('defines exactly 4 roles', () => {
    expect(ROLES).toHaveLength(4)
  })

  it('each role has id, title, and href', () => {
    ROLES.forEach((role) => {
      expect(role.id).toBeDefined()
      expect(typeof role.id).toBe('string')
      expect(role.title).toBeDefined()
      expect(role.href).toMatch(/^\/[a-z-]+$/)
    })
  })

  it('hrefs match expected routes', () => {
    expect(ROLES.map((r) => r.href)).toEqual(['/civilian', '/military', '/admin', '/pilot'])
  })
})
