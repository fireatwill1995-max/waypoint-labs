import './globals.css'
import { ErrorBoundary } from './components/ErrorBoundary'
import Navigation from './components/Navigation'
import Breadcrumbs from './components/Breadcrumbs'
import ScrollToTop from './components/ScrollToTop'
import BackButton from './components/BackButton'
import SkipToContent from './components/SkipToContent'
import ConsoleErrorLogger from './components/ConsoleErrorLogger'
import WatermarkBody from './components/WatermarkBody'
import { siteConfig } from './config/site'

export const metadata = {
  metadataBase: new URL(siteConfig.baseUrl),
  title: 'Waypoint Labs | Drone Flight Control — Automated Missions, More Drones',
  description: 'Fully automated missions, semi-automated workflows, and manual flight tools. Web, iOS, Android. 30+ drone protocols: DJI, Autel, PX4, ArduPilot, Parrot, Skydio, and more.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Waypoint Labs',
  },
  openGraph: {
    title: 'Waypoint Labs | Drone Flight Control',
    description: 'Fully automated missions, semi-automated workflows, and manual flight tools. Web, iOS, Android.',
    url: siteConfig.baseUrl,
    siteName: siteConfig.name,
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#0971CE',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="antialiased">
        <WatermarkBody />
        <ConsoleErrorLogger />
        <ErrorBoundary>
          <SkipToContent />
          <Navigation />
          <Breadcrumbs />
          <BackButton />
          {children}
          <ScrollToTop />
        </ErrorBoundary>
      </body>
    </html>
  )
}
