/**
 * Live app URL — used for canonical links, OG tags, and manifest.
 * Set NEXT_PUBLIC_APP_URL in Vercel (or .env) to your production URL.
 * On Vercel, VERCEL_URL is set automatically; we use NEXT_PUBLIC_APP_URL when set for custom domains.
 */
function getBaseUrl(): string {
  if (typeof process.env.NEXT_PUBLIC_APP_URL === 'string' && process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
  }
  if (typeof process.env.VERCEL_URL === 'string' && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  return 'https://waypoint-labs.vercel.app'
}

export const siteConfig = {
  /** Full origin (e.g. https://waypoint-labs.vercel.app) — no trailing slash */
  baseUrl: getBaseUrl(),
  name: 'Waypoint Labs',
  shortName: 'Waypoint Labs',
}
