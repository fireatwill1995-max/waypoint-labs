/**
 * Splits the 4-way drone image into 4 quadrant PNGs and copies the control-center image.
 *
 * Usage:
 *   node scripts/split-watermarks.js <pathTo4way.png> <pathToControlCenter.png>
 *
 * Example (after copying your images into the project):
 *   node scripts/split-watermarks.js public/watermarks/source/4way.png public/watermarks/source/control-center.png
 *
 * Output: public/watermarks/mustering.png, hunting.png, fishing.png, coastal-surveillance.png, control-center.png
 */

const fs = require('fs')
const path = require('path')

const OUT_DIR = path.join(__dirname, '..', 'public', 'watermarks')

async function main() {
  const path4way = process.argv[2]
  const pathControl = process.argv[3]

  if (!path4way || !pathControl) {
    console.error('Usage: node scripts/split-watermarks.js <pathTo4way.png> <pathToControlCenter.png>')
    process.exit(1)
  }

  if (!fs.existsSync(path4way)) {
    console.error('4-way image not found:', path4way)
    process.exit(1)
  }
  if (!fs.existsSync(pathControl)) {
    console.error('Control-center image not found:', pathControl)
    process.exit(1)
  }

  fs.mkdirSync(OUT_DIR, { recursive: true })

  const sharp = require('sharp')

  const meta = await sharp(path4way).metadata()
  const w = meta.width || 0
  const h = meta.height || 0
  const halfW = Math.floor(w / 2)
  const halfH = Math.floor(h / 2)

  const quadrants = [
    { name: 'mustering', left: 0, top: 0, width: halfW, height: halfH },
    { name: 'hunting', left: halfW, top: 0, width: w - halfW, height: halfH },
    { name: 'fishing', left: 0, top: halfH, width: halfW, height: h - halfH },
    { name: 'coastal-surveillance', left: halfW, top: halfH, width: w - halfW, height: h - halfH },
  ]

  for (const q of quadrants) {
    await sharp(path4way)
      .extract({ left: q.left, top: q.top, width: q.width, height: q.height })
      .png()
      .toFile(path.join(OUT_DIR, `${q.name}.png`))
    console.log('Written', q.name + '.png')
  }

  fs.copyFileSync(pathControl, path.join(OUT_DIR, 'control-center.png'))
  console.log('Written control-center.png')
  console.log('Done. Output dir:', OUT_DIR)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
