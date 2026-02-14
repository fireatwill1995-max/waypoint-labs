import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/civilian/detect?mode=...
 * Stub when backend only supports POST or returns 500.
 * Returns empty detections so the UI does not break.
 */
export async function GET(_request: NextRequest) {
  try {
    return NextResponse.json({ detections: [] })
  } catch {
    return NextResponse.json({ detections: [] })
  }
}
