/**
 * Live app URL — used for canonical links, OG tags, and manifest.
 * Frontend: Cloudflare Pages. Backend: Fly.io.
 * Set NEXT_PUBLIC_APP_URL in Cloudflare Pages env (or .env) to your frontend URL.
 */
function getBaseUrl(): string {
  if (typeof process.env.NEXT_PUBLIC_APP_URL === 'string' && process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
  }
  return 'https://waypoint-labs.pages.dev'
}

export const siteConfig = {
  /** Full origin (e.g. https://waypoint-labs.pages.dev) — no trailing slash */
  baseUrl: getBaseUrl(),
  name: 'Waypoint Labs',
  shortName: 'Waypoint Labs',
}
