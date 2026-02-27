/**
 * Script prebuild: genera icone PNG usando sharp
 * node scripts/prebuild.mjs
 */

import { createRequire } from "module";
import { mkdirSync, existsSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const iconsDir = join(rootDir, "public", "icons");

// Crea cartella icons se non esiste
if (!existsSync(iconsDir)) {
  mkdirSync(iconsDir, { recursive: true });
  console.log("📁 Creata cartella public/icons/");
}

// SVG sorgente
const svgSource = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="113" fill="#795548"/>
  <circle cx="256" cy="256" r="195" fill="#FFC107" opacity="0.18"/>
  <circle cx="256" cy="256" r="155" fill="#FFC107"/>
  <circle cx="256" cy="256" r="155" fill="#BF360C" opacity="0.22"/>
  <circle cx="200" cy="200" r="19" fill="#4E342E" opacity="0.75"/>
  <circle cx="258" cy="183" r="15" fill="#4E342E" opacity="0.65"/>
  <circle cx="315" cy="208" r="17" fill="#4E342E" opacity="0.75"/>
  <circle cx="183" cy="263" r="16" fill="#4E342E" opacity="0.65"/>
  <circle cx="247" cy="258" r="21" fill="#4E342E" opacity="0.75"/>
  <circle cx="313" cy="272" r="18" fill="#4E342E" opacity="0.65"/>
  <circle cx="198" cy="322" r="17" fill="#4E342E" opacity="0.75"/>
  <circle cx="272" cy="328" r="15" fill="#4E342E" opacity="0.65"/>
  <circle cx="328" cy="318" r="16" fill="#4E342E" opacity="0.75"/>
  <circle cx="256" cy="256" r="155" fill="none" stroke="#BF360C" stroke-width="5" opacity="0.35"/>
  <ellipse cx="210" cy="195" rx="45" ry="28" fill="white" opacity="0.12" transform="rotate(-30 210 195)"/>
</svg>`;

const svgBuffer = Buffer.from(svgSource);

// Import dinamico di sharp
let sharp;
try {
  const mod = await import("sharp");
  sharp = mod.default;
} catch (e) {
  console.error("❌ sharp non trovato. Esegui: npm install -D sharp");
  process.exit(1);
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

console.log("🍪 Generazione icone PNG...\n");

for (const size of sizes) {
  const outputPath = join(iconsDir, `icon-${size}.png`);
  try {
    await sharp(svgBuffer)
      .resize(size, size)
      .png({ compressionLevel: 9 })
      .toFile(outputPath);
    console.log(`  ✅ public/icons/icon-${size}.png`);
  } catch (err) {
    console.error(`  ❌ Errore icon-${size}.png:`, err.message);
    process.exit(1);
  }
}

// apple-touch-icon 180x180
try {
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(join(rootDir, "public", "apple-touch-icon.png"));
  console.log(`  ✅ public/apple-touch-icon.png`);
} catch (err) {
  console.error(`  ❌ apple-touch-icon:`, err.message);
}

// favicon.png 32x32
try {
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(join(rootDir, "public", "favicon.png"));
  console.log(`  ✅ public/favicon.png`);
} catch (err) {
  console.error(`  ❌ favicon.png:`, err.message);
}

console.log("\n✅ Icone generate! Ora esegui: npm run build\n");
