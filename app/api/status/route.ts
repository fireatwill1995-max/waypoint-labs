import { NextResponse } from 'next/server'

const OFFLINE_STATUS = {
  running: false,
  authenticated: false,
}

export async function GET() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const url = `${apiUrl.replace(/\/$/, '')}/api/status`

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      })
      if (!res.ok) {
        return NextResponse.json(OFFLINE_STATUS, { status: 200 })
      }
      const data = await res.json()
      return NextResponse.json(data)
    } finally {
      clearTimeout(timeout)
    }
  } catch {
    return NextResponse.json(OFFLINE_STATUS, { status: 200 })
  }
}
