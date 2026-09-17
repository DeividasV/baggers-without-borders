const sharp = require("sharp");
const fs = require("fs").promises;
const path = require("path");

async function generateIcons() {
  const publicDir = path.join(__dirname, "..", "public");
  const baseSvg = path.join(publicDir, "icon-base.svg");
  const simpleSvg = path.join(publicDir, "icon-simple.svg");

  // Icon sizes to generate
  const iconSizes = [
    // Favicons
    { size: 16, name: "favicon-16x16.png", source: simpleSvg },
    { size: 32, name: "favicon-32x32.png", source: simpleSvg },
    { size: 48, name: "favicon-48x48.png", source: baseSvg },

    // Apple Touch Icons
    { size: 152, name: "apple-touch-icon-152x152.png", source: baseSvg },
    { size: 180, name: "apple-touch-icon-180x180.png", source: baseSvg },
    { size: 167, name: "apple-touch-icon-167x167.png", source: baseSvg },
    { size: 120, name: "apple-touch-icon-120x120.png", source: baseSvg },
    { size: 180, name: "apple-touch-icon.png", source: baseSvg }, // default

    // Android/Chrome
    { size: 192, name: "android-chrome-192x192.png", source: baseSvg },
    { size: 512, name: "android-chrome-512x512.png", source: baseSvg },

    // PWA
    { size: 144, name: "icon-144x144.png", source: baseSvg },
    { size: 192, name: "icon-192x192.png", source: baseSvg },
    { size: 256, name: "icon-256x256.png", source: baseSvg },
    { size: 384, name: "icon-384x384.png", source: baseSvg },
    { size: 512, name: "icon-512x512.png", source: baseSvg },

    // Windows
    { size: 144, name: "mstile-144x144.png", source: baseSvg },

    // Next.js app directory
    { size: 32, name: "icon.png", source: baseSvg },
  ];

  console.log("🎨 Generating icon set...");

  for (const icon of iconSizes) {
    try {
      const outputPath = path.join(publicDir, icon.name);

      await sharp(icon.source)
        .resize(icon.size, icon.size, {
          fit: "contain",
          background: { r: 30, g: 32, b: 20, alpha: 1 }, // olive green dark background (#1e2014)
        })
        .png({
          quality: 100,
          progressive: false,
          compressionLevel: 9,
        })
        .toFile(outputPath);

      console.log(`✅ Generated ${icon.name} (${icon.size}x${icon.size})`);
    } catch (error) {
      console.error(`❌ Failed to generate ${icon.name}:`, error);
    }
  }

  // Generate ICO file (favicon.ico)
  try {
    const icoPath = path.join(publicDir, "favicon.ico");

    // Create favicon.ico with multiple sizes
    await sharp(simpleSvg)
      .resize(32, 32)
      .png()
      .toFile(icoPath.replace(".ico", "-temp.png"));

    // For now, just copy the 32px PNG as ICO (browsers support PNG in ICO)
    const tempPng = await fs.readFile(icoPath.replace(".ico", "-temp.png"));
    await fs.writeFile(icoPath, tempPng);
    await fs.unlink(icoPath.replace(".ico", "-temp.png"));

    console.log("✅ Generated favicon.ico");
  } catch (error) {
    console.error("❌ Failed to generate favicon.ico:", error);
  }

  console.log("🎉 Icon generation complete!");
}

generateIcons().catch(console.error);
