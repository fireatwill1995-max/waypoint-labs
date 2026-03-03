import { NextRequest, NextResponse } from 'next/server'

/** GET /api/civilian/detect?mode=... — stub when backend only supports POST or returns 500. */
export async function GET(_request: NextRequest): Promise<NextResponse<{ detections: [] }>> {
  try {
    return NextResponse.json({ detections: [] })
  } catch {
    return NextResponse.json({ detections: [] })
  }
}
