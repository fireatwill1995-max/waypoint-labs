'use client'

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
      <img
        src="/logo.svg"
        alt=""
        width={size}
        height={size}
        className="w-full h-full object-contain"
      />
    </div>
  )
}
