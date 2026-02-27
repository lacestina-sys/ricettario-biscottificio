/**
 * Genera tutte le icone PWA necessarie per PWABuilder.
 * Usa solo canvas API nativa di Node (non serve installare nulla).
 * 
 * Esegui con: node scripts/generate-icons.mjs
 * 
 * Se non hai canvas nativo, installa: npm install -D canvas
 * e decommentare le righe canvas.
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const ICONS_DIR = join(ROOT, "public", "icons");

// Crea la cartella icons se non esiste
if (!existsSync(ICONS_DIR)) {
  mkdirSync(ICONS_DIR, { recursive: true });
}

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// ──────────────────────────────────────────────
// Genera icone SVG per ogni dimensione
// (PWABuilder accetta anche SVG come fallback,
//  ma genera PNG automaticamente dall'SVG source)
// ──────────────────────────────────────────────
function generateSVGIcon(size) {
  const radius = Math.round(size * 0.22);
  const fontSize = Math.round(size * 0.62);
  const x = Math.round(size * 0.08);
  const y = Math.round(size * 0.78);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <!-- Sfondo marrone caldo -->
  <rect width="${size}" height="${size}" rx="${radius}" fill="#795548"/>
  <!-- Alone ambrato -->
  <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.38}" fill="#FFC107" opacity="0.15"/>
  <!-- Emoji biscotto -->
  <text y="${y}" x="${x}" font-size="${fontSize}" font-family="Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji, sans-serif">🍪</text>
</svg>`;
}

// Genera SVG per ogni size
SIZES.forEach((size) => {
  const svg = generateSVGIcon(size);
  const svgPath = join(ICONS_DIR, `icon-${size}.svg`);
  writeFileSync(svgPath, svg, "utf8");
  console.log(`✅ Generata icona SVG ${size}x${size}: ${svgPath}`);
});

// ──────────────────────────────────────────────
// Genera anche apple-touch-icon (180x180)
// ──────────────────────────────────────────────
const appleSVG = generateSVGIcon(180);
writeFileSync(join(ROOT, "public", "apple-touch-icon.svg"), appleSVG, "utf8");
console.log("✅ Generata apple-touch-icon.svg");

// ──────────────────────────────────────────────
// Genera screenshot placeholder
// ──────────────────────────────────────────────
const screenshotsDir = join(ROOT, "public", "screenshots");
if (!existsSync(screenshotsDir)) {
  mkdirSync(screenshotsDir, { recursive: true });
}

// SVG placeholder screenshot 390x844
const screenshotSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 390 844" width="390" height="844">
  <rect width="390" height="844" fill="#FFF8E1"/>
  <rect x="0" y="0" width="390" height="120" fill="#795548"/>
  <text x="195" y="50" text-anchor="middle" font-family="sans-serif" font-size="20" fill="white" font-weight="bold">Il Mio Ricettario 🍪</text>
  <text x="195" y="80" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#D7CCC8">Biscottificio Artigianale</text>
  <rect x="20" y="140" width="350" height="80" rx="12" fill="#fff" stroke="#D7CCC8" stroke-width="1"/>
  <text x="40" y="188" font-family="sans-serif" font-size="16" fill="#795548" font-weight="bold">Frollini al Burro Classici</text>
  <text x="40" y="208" font-family="sans-serif" font-size="13" fill="#A1887F">Frollini • 60 pezzi • 32 min</text>
  <rect x="20" y="240" width="350" height="80" rx="12" fill="#fff" stroke="#D7CCC8" stroke-width="1"/>
  <text x="40" y="288" font-family="sans-serif" font-size="16" fill="#795548" font-weight="bold">Cantucci alle Mandorle</text>
  <text x="40" y="308" font-family="sans-serif" font-size="13" fill="#A1887F">Cantucci • 80 pezzi • 65 min</text>
  <rect x="20" y="340" width="350" height="80" rx="12" fill="#fff" stroke="#D7CCC8" stroke-width="1"/>
  <text x="40" y="388" font-family="sans-serif" font-size="16" fill="#795548" font-weight="bold">Amaretti Morbidi</text>
  <text x="40" y="408" font-family="sans-serif" font-size="13" fill="#A1887F">Amaretti • 40 pezzi • 43 min</text>
</svg>`;

writeFileSync(join(screenshotsDir, "screen1.svg"), screenshotSVG, "utf8");
console.log("✅ Generato screenshot placeholder");

console.log("\n📦 Tutte le icone generate in public/icons/");
console.log("💡 Nota: per icone PNG vere, esegui:");
console.log('   npm install -D sharp');
console.log('   node scripts/generate-icons-png.mjs');
