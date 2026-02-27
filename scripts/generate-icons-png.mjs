/**
 * Genera icone PNG reali da SVG usando sharp.
 * 
 * Prerequisiti:
 *   npm install -D sharp
 * 
 * Esegui con:
 *   node scripts/generate-icons-png.mjs
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const ICONS_DIR = join(ROOT, "public", "icons");

// Verifica che sharp sia installato
let sharp;
try {
  sharp = (await import("sharp")).default;
} catch {
  console.error("❌ sharp non è installato. Esegui: npm install -D sharp");
  process.exit(1);
}

if (!existsSync(ICONS_DIR)) {
  mkdirSync(ICONS_DIR, { recursive: true });
}

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// SVG sorgente per l'icona (512x512, verrà ridimensionata)
const SOURCE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="113" fill="#795548"/>
  <circle cx="256" cy="256" r="195" fill="#FFC107" opacity="0.18"/>
  <circle cx="256" cy="256" r="170" fill="#8D6E63" opacity="0.3"/>
  <!-- Biscotto stilizzato (cerchio ambrato) -->
  <circle cx="256" cy="256" r="145" fill="#FFC107"/>
  <circle cx="256" cy="256" r="145" fill="#E65100" opacity="0.25"/>
  <!-- Decorazioni biscotto -->
  <circle cx="200" cy="200" r="18" fill="#795548" opacity="0.6"/>
  <circle cx="256" cy="185" r="14" fill="#795548" opacity="0.5"/>
  <circle cx="312" cy="210" r="16" fill="#795548" opacity="0.6"/>
  <circle cx="185" cy="265" r="15" fill="#795548" opacity="0.5"/>
  <circle cx="245" cy="260" r="20" fill="#795548" opacity="0.6"/>
  <circle cx="310" cy="270" r="17" fill="#795548" opacity="0.5"/>
  <circle cx="200" cy="320" r="16" fill="#795548" opacity="0.6"/>
  <circle cx="270" cy="325" r="14" fill="#795548" opacity="0.5"/>
  <circle cx="325" cy="320" r="15" fill="#795548" opacity="0.6"/>
  <!-- Contorno biscotto -->
  <circle cx="256" cy="256" r="145" fill="none" stroke="#E65100" stroke-width="4" opacity="0.4"/>
</svg>`;

console.log("🎨 Generazione icone PNG in corso...\n");

for (const size of SIZES) {
  try {
    const outputPath = join(ICONS_DIR, `icon-${size}.png`);
    await sharp(Buffer.from(SOURCE_SVG))
      .resize(size, size)
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(outputPath);
    console.log(`✅ icon-${size}.png (${size}×${size}px)`);
  } catch (err) {
    console.error(`❌ Errore icon-${size}: ${err.message}`);
  }
}

// Apple touch icon 180x180
try {
  const applePath = join(ROOT, "public", "apple-touch-icon.png");
  await sharp(Buffer.from(SOURCE_SVG))
    .resize(180, 180)
    .png({ quality: 100 })
    .toFile(applePath);
  console.log("✅ apple-touch-icon.png (180×180px)");
} catch (err) {
  console.error(`❌ apple-touch-icon: ${err.message}`);
}

// Favicon 32x32
try {
  const faviconPath = join(ROOT, "public", "favicon.png");
  await sharp(Buffer.from(SOURCE_SVG))
    .resize(32, 32)
    .png()
    .toFile(faviconPath);
  console.log("✅ favicon.png (32×32px)");
} catch (err) {
  console.error(`❌ favicon: ${err.message}`);
}

console.log("\n🎉 Tutte le icone PNG generate con successo!");
console.log(`📁 Cartella: ${ICONS_DIR}`);
console.log("\n📋 Prossimi step:");
console.log("   1. npm run build");
console.log("   2. Carica la cartella dist/ su GitHub Pages / Netlify");
console.log("   3. Vai su https://www.pwabuilder.com");
console.log("   4. Incolla l'URL del tuo sito → genera APK");
