'use client'

import Image from 'next/image'

interface WaypointLogoProps {
  className?: string
  size?: number
}

export default function WaypointLogo({ className = '', size = 40 }: WaypointLogoProps) {
  return (
    <div
      className={`flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Image
        src="/logo.svg"
        alt=""
        width={size}
        height={size}
        className="object-contain"
      />
    </div>
  )
}
