#!/usr/bin/env node

/**
 * Generate the first-party placeholder image used by the landing page.
 *
 * `public/images/welcome-climbing.jpg` previously had unknown provenance, which
 * made it impossible to redistribute. This script regenerates it as an
 * original gradient in the project palette, so the asset is unambiguously
 * first-party and covered by the project's own license.
 *
 * Run with: node scripts/dev/generate-placeholder-image.js
 */

const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

const OUTPUT = path.join(process.cwd(), "public", "images", "welcome-climbing.jpg");

const WIDTH = 800;
const HEIGHT = 600;

// Project palette: dark background -> khaki green accent.
const TOP = { r: 0x1a, g: 0x1a, b: 0x1a };
const BOTTOM = { r: 0x65, g: 0x6d, b: 0x40 };

async function main() {
  const channels = 3;
  const buffer = Buffer.alloc(WIDTH * HEIGHT * channels);

  for (let y = 0; y < HEIGHT; y++) {
    // Ease the gradient so the transition is not linear-flat.
    const t = Math.pow(y / (HEIGHT - 1), 0.85);
    const r = Math.round(TOP.r + (BOTTOM.r - TOP.r) * t);
    const g = Math.round(TOP.g + (BOTTOM.g - TOP.g) * t);
    const b = Math.round(TOP.b + (BOTTOM.b - TOP.b) * t);

    for (let x = 0; x < WIDTH; x++) {
      const i = (y * WIDTH + x) * channels;
      buffer[i] = r;
      buffer[i + 1] = g;
      buffer[i + 2] = b;
    }
  }

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });

  await sharp(buffer, { raw: { width: WIDTH, height: HEIGHT, channels } })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(OUTPUT);

  const { size } = fs.statSync(OUTPUT);
  console.log(`✓ Generated ${path.relative(process.cwd(), OUTPUT)}`);
  console.log(`  ${WIDTH}x${HEIGHT}, ${(size / 1024).toFixed(1)} KB`);
  console.log("  First-party asset: an original gradient, no third-party content.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
