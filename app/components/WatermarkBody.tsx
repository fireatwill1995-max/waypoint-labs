'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

const SECTION_CLASSES = [
  'watermark-mustering',
  'watermark-hunting',
  'watermark-fishing',
  'watermark-coastal',
] as const

const PATH_TO_WATERMARK: Record<string, (typeof SECTION_CLASSES)[number]> = {
  '/civilian': 'watermark-mustering',
  '/admin': 'watermark-hunting',
  '/supported-drones': 'watermark-fishing',
  '/pilot': 'watermark-coastal',
  '/military': 'watermark-coastal',
}

export default function WatermarkBody() {
  const pathname = usePathname()

  useEffect(() => {
    const body = typeof document !== 'undefined' ? document.body : null
    if (!body) return

    const add = PATH_TO_WATERMARK[pathname ?? '']
    SECTION_CLASSES.forEach((c) => body.classList.remove(c))
    if (add) body.classList.add(add)
  }, [pathname])

  return null
}
