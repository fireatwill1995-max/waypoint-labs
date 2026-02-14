'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface BreadcrumbItem {
  label: string
  href: string
}

export default function Breadcrumbs() {
  const pathname = usePathname()

  if (!pathname) return null

  // Don't show breadcrumbs on certain pages
  const hideBreadcrumbs = ['/', '/sign-in', '/sign-up', '/select-role']
  if (hideBreadcrumbs.includes(pathname)) {
    return null
  }

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const paths = pathname.split('/').filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = [{ label: 'Home', href: '/' }]

    let currentPath = ''
    paths.forEach((path) => {
      currentPath += `/${path}`
      const label = path
        .split('-')
        .map(word => {
          const safeWord = String(word || '')
          return safeWord.length > 0 ? safeWord.charAt(0).toUpperCase() + safeWord.slice(1) : ''
        })
        .filter(word => word.length > 0)
        .join(' ')
      
      breadcrumbs.push({
        label,
        href: currentPath,
      })
    })

    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs()

  if (breadcrumbs.length <= 1) return null

  return (
    <nav className="px-4 sm:px-6 lg:px-8 py-2 sm:py-3 bg-slate-900/30 border-b border-dji-500/10" aria-label="Breadcrumb">
      <ol className="flex items-center flex-wrap gap-x-2 text-sm font-futuristic">
        {breadcrumbs.map((crumb, index) => (
          <li key={crumb.href} className="flex items-center">
            {index > 0 && (
              <svg className="w-4 h-4 text-slate-500 mx-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
            {index === breadcrumbs.length - 1 ? (
              <span className="text-slate-200 font-medium" aria-current="page">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className="text-slate-400 hover:text-dji-300 transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
