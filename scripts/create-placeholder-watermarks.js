/**
 * Creates minimal placeholder PNGs in public/watermarks so background-image URLs don't 404.
 * Replace these with real images: run split-watermarks.js after placing the source images.
 */
const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const OUT = path.join(__dirname, '..', 'public', 'watermarks')
const names = ['control-center', 'mustering', 'hunting', 'fishing', 'coastal-surveillance']

async function main() {
  fs.mkdirSync(OUT, { recursive: true })
  const buffer = await sharp({
    create: { width: 4, height: 4, channels: 4, background: { r: 15, g: 23, b: 42, alpha: 0.6 } }
  })
    .png()
    .toBuffer()
  for (const name of names) {
    fs.writeFileSync(path.join(OUT, `${name}.png`), buffer)
    console.log('Created', name + '.png')
  }
  console.log('Placeholders done. Add real images and run split-watermarks.js to replace.')
}

main().catch((e) => { console.error(e); process.exit(1) })
