'use client'

import React from 'react'

interface SkeletonLoaderProps {
  className?: string
  lines?: number
  width?: string
  height?: string
}

export function SkeletonLoader({ className = '', lines = 1, width, height }: SkeletonLoaderProps) {
  if (lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-slate-700/50 rounded animate-pulse"
            style={{
              width: typeof i === 'number' && i === lines - 1 ? '60%' : '100%',
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className={`bg-slate-700/50 rounded animate-pulse ${className}`}
      style={{
        width: width || '100%',
        height: height || '1rem',
      }}
    />
  )
}

export function CardSkeleton() {
  return (
    <div className="card-glass p-6 space-y-4">
      <SkeletonLoader height="1.5rem" width="60%" />
      <SkeletonLoader lines={3} />
      <SkeletonLoader height="2rem" width="40%" />
    </div>
  )
}

export function StatusCardSkeleton() {
  return (
    <div className="card-glass p-6">
      <div className="flex items-center justify-between mb-2">
        <SkeletonLoader height="0.875rem" width="40%" />
        <SkeletonLoader height="1.5rem" width="4rem" />
      </div>
      <SkeletonLoader height="2rem" width="60%" className="mt-2" />
    </div>
  )
}
