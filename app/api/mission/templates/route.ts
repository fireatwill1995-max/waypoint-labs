import { NextRequest, NextResponse } from 'next/server'

/** Stub mission templates when backend is unavailable or returns 500. */
const STUB_TEMPLATES = [
  { id: 'stub-1', name: 'Grid Survey', description: 'Rectangular grid pattern for area coverage', category: 'mapping', pattern_type: 'grid', tags: ['survey', 'mapping'] },
  { id: 'stub-2', name: 'Linear Transect', description: 'Straight-line transect for linear features', category: 'mapping', pattern_type: 'linear', tags: ['transect', 'linear'] },
  { id: 'stub-3', name: 'Orbit', description: 'Circular orbit around a point of interest', category: 'inspection', pattern_type: 'orbit', tags: ['orbit', 'inspection'] },
]

export async function GET(request: NextRequest) {
  try {
    const category = request.nextUrl.searchParams.get('category')?.trim()
    let templates = STUB_TEMPLATES
    if (category) {
      templates = STUB_TEMPLATES.filter(
        (t) => t.category.toLowerCase() === category.toLowerCase()
      )
    }
    return NextResponse.json({ templates })
  } catch {
    return NextResponse.json({ templates: [] })
  }
}
