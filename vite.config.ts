import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "apple-touch-icon.png", "icons/*.png"],
      manifest: {
        name: "Il Mio Ricettario",
        short_name: "Ricettario",
        description:
          "Ricettario digitale per biscottificio artigianale. Gestisci ricette, scala dosi e calcola i costi. Tutto offline.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait-primary",
        background_color: "#FFF8E1",
        theme_color: "#795548",
        lang: "it",
        categories: ["food", "productivity", "utilities"],
        icons: [
          {
            src: "icons/icon-72.png",
            sizes: "72x72",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/icon-96.png",
            sizes: "96x96",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/icon-128.png",
            sizes: "128x128",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/icon-144.png",
            sizes: "144x144",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/icon-152.png",
            sizes: "152x152",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "icons/icon-384.png",
            sizes: "384x384",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
        screenshots: [
          {
            src: "screenshots/screen1.png",
            sizes: "390x844",
            type: "image/png",
            form_factor: "narrow",
            label: "Home - Il Mio Ricettario",
          },
        ],
        shortcuts: [
          {
            name: "Nuova Ricetta",
            short_name: "Crea",
            description: "Aggiungi una nuova ricetta",
            url: "/crea",
            icons: [{ src: "icons/icon-96.png", sizes: "96x96" }],
          },
          {
            name: "Lista Ricette",
            short_name: "Ricette",
            description: "Visualizza tutte le ricette",
            url: "/ricette",
            icons: [{ src: "icons/icon-96.png", sizes: "96x96" }],
          },
        ],
      },
      workbox: {
        // Cache-first per assets statici
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,woff}"],
        // Dimensione massima file da pre-cachare: 5MB
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          // Google Fonts CSS
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 anno
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Google Fonts file woff2
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Navigazione — restituisce sempre index.html (SPA)
          {
            urlPattern: /^https?:\/\/[^/]+\/(?!api).*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "pages-cache",
              expiration: { maxEntries: 50 },
              networkTimeoutSeconds: 3,
            },
          },
        ],
        // Importante per SPA: qualsiasi route non trovata serve index.html
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/(api|_)/],
        // Pulisce le cache obsolete automaticamente
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
      },
      devOptions: {
        enabled: false, // non serve in dev
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    // Assicura che i chunk siano generati correttamente
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          store: ["zustand"],
          icons: ["lucide-react"],
        },
      },
    },
  },
});
