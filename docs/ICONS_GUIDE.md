# 🏔️ BWB Application Icons

This directory contains all the application icons for the BwB (Hiking & Climbing Community) platform. The icons feature a mountain shape with a dot indicator, matching the brand's olive green color palette.

## 🎨 Design

The icon design consists of:

- **Mountain shape**: Representing the hiking/climbing theme
- **Dot indicator**: Positioned at bottom-right, representing activity/status
- **Color palette**: Olive green (`#9ca56e`, `#808a52`) with dark olive background (`#1e2014`)
- **Minimal padding**: Icons use maximum space with minimal margins

## 📁 Icon Files

### Favicons (Web)

- `favicon.ico` - Traditional ICO format
- `favicon-16x16.png` - Small favicon
- `favicon-32x32.png` - Standard favicon
- `favicon-48x48.png` - Large favicon

### Apple Touch Icons

- `apple-touch-icon.png` - Default (180x180)
- `apple-touch-icon-120x120.png` - iPhone
- `apple-touch-icon-152x152.png` - iPad
- `apple-touch-icon-167x167.png` - iPad Pro
- `apple-touch-icon-180x180.png` - iPhone 6 Plus

### Android/PWA Icons

- `android-chrome-192x192.png` - Standard Android icon
- `android-chrome-512x512.png` - High-res Android icon
- `icon-144x144.png` - PWA manifest icon
- `icon-192x192.png` - PWA manifest icon
- `icon-256x256.png` - PWA manifest icon
- `icon-384x384.png` - PWA manifest icon
- `icon-512x512.png` - PWA manifest icon

### Windows/Microsoft

- `mstile-144x144.png` - Windows tile icon

### Source Files

- `icon-base.svg` - High-resolution SVG source (512x512)
- `icon-simple.svg` - Simplified SVG for small sizes (32x32)

## 🔧 Generation

Icons are generated using the Node.js script:

```bash
npm run icons:generate
```

This script:

1. Uses Sharp.js to convert SVG to PNG
2. Generates all required sizes
3. Applies proper compression and quality settings
4. Creates favicon.ico from PNG

## 🌐 Implementation

### Next.js App Router

- `app/icon.tsx` - Dynamic icon generation using Next.js ImageResponse API
- Icons are automatically referenced in `app/layout.tsx` metadata

### Web App Manifest

- `app/manifest.ts` - PWA configuration with icon references, generated at build time so the app name comes from `NEXT_PUBLIC_SITE_NAME` (`src/config/site.ts`)
- Supports installation as a Progressive Web App

### Browser Configuration

- `public/browserconfig.xml` - Windows/IE tile configuration
- Meta tags in layout.tsx for various platforms

## 🎯 Color Values

```css
--primary-dark: #1e2014 /* Background */ --primary-main: #9ca56e /* Mountain fill */
  --primary-alt: #808a52 /* Mountain stroke/dot */;
```

## 📱 Platform Support

✅ **Web Browsers**: All modern browsers via favicon  
✅ **iOS**: Safari, Home Screen shortcuts  
✅ **Android**: Chrome, Home Screen shortcuts  
✅ **PWA**: Installable Progressive Web App  
✅ **Windows**: Tile icons for pinned sites

## 🔄 Updating Icons

To update the icon design:

1. Edit `public/icon-base.svg` and `public/icon-simple.svg`
2. Update colors in `scripts/dev/generate-icons.js` if needed
3. Run `npm run icons:generate`
4. Update `app/icon.tsx` to match new design
5. Test across different platforms

---

_Icons are automatically deployed with the application and cached by browsers._
