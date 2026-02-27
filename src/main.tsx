import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

// ── Monta React ──────────────────────────────────────────────
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// ── Registra Service Worker (generato da vite-plugin-pwa) ────
// Il SW viene iniettato automaticamente da VitePWA nel build.
// In sviluppo (npm run dev) il SW non è attivo.
if ("serviceWorker" in navigator) {
  // Il registerSW viene chiamato automaticamente da vite-plugin-pwa
  // con registerType: 'autoUpdate'. Non serve registrazione manuale.
  // Questo blocco è solo per logging di debug in produzione.
  window.addEventListener("load", () => {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      if (regs.length > 0) {
        console.log("✅ Service Worker attivo:", regs[0].scope);
      }
    });
  });
}

// ── Gestione installazione PWA ───────────────────────────────
// Salva l'evento beforeinstallprompt per mostrare il bottone
// "Installa App" nell'UI quando appropriato.
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault(); // Blocca il prompt automatico del browser
  // Salva l'evento per usarlo dopo
  (window as Window & { deferredInstallPrompt?: Event }).deferredInstallPrompt = e;
  // Emetti evento custom per notificare i componenti React
  window.dispatchEvent(new CustomEvent("pwa-installable"));
  console.log("📱 PWA installabile — prompt salvato");
});

// Quando la PWA viene installata
window.addEventListener("appinstalled", () => {
  console.log("🎉 PWA installata con successo!");
  (window as Window & { deferredInstallPrompt?: Event }).deferredInstallPrompt = undefined;
  window.dispatchEvent(new CustomEvent("pwa-installed"));
});
