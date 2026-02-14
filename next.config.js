/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Use 'export' for Cloudflare Pages static deploy (BUILD_FOR_CF=1); otherwise standalone for Fly.io
  output: process.env.BUILD_FOR_CF === '1' ? 'export' : 'standalone',
  // Allow ngrok and other tunnel hosts so _next/static chunks load (no 404)
  allowedDevOrigins: [
    'civilliandroneapp.com.ngrok.pro',
    '*.ngrok.pro',
    '*.ngrok-free.dev',
    '*.ngrok-free.app',
  ],
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  ...(process.env.BUILD_FOR_CF !== '1' && {
    async rewrites() {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      return [
        { source: '/api/mission/templates', destination: '/api/mission/templates' },
        { source: '/api/mission/templates/:path*', destination: '/api/mission/templates/:path*' },
        { source: '/api/civilian/detect', destination: '/api/civilian/detect' },
        { source: '/api/civilian/detect/:path*', destination: '/api/civilian/detect/:path*' },
        { source: '/api/:path*', destination: `${apiUrl}/api/:path*` },
      ]
    },
    async headers() {
      return [
        {
          source: '/:path((?!_next).*)',
          headers: [
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
            { key: 'X-XSS-Protection', value: '1; mode=block' },
            { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
            { key: 'Content-Security-Policy', value: "frame-ancestors 'self'; default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: https:; script-src-elem 'self' 'unsafe-inline' blob: https:; style-src 'self' 'unsafe-inline' https:; style-src-elem 'self' 'unsafe-inline' https:; img-src 'self' data: https: blob:; font-src 'self' data: https:; connect-src 'self' ws: wss: http: https:; frame-src 'self' https:; worker-src 'self' blob:;" },
          ],
        },
      ]
    },
  }),
  env: {
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    NEXT_PUBLIC_CESIUM_ION_ACCESS_TOKEN: process.env.NEXT_PUBLIC_CESIUM_ION_ACCESS_TOKEN,
  },
}

module.exports = nextConfig

