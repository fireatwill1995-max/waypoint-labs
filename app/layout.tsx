import './globals.css'
import { ErrorBoundary } from './components/ErrorBoundary'
import Navigation from './components/Navigation'
import Breadcrumbs from './components/Breadcrumbs'
import ScrollToTop from './components/ScrollToTop'
import BackButton from './components/BackButton'
import SkipToContent from './components/SkipToContent'
import ConsoleErrorLogger from './components/ConsoleErrorLogger'

export const metadata = {
  title: 'Waypoint Labs | Drone Flight Control — Automated Missions, More Drones',
  description: 'Fully automated missions, semi-automated workflows, and manual flight tools. Web, iOS, Android. 30+ drone protocols: DJI, Autel, PX4, ArduPilot, Parrot, Skydio, and more.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Waypoint Labs',
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
