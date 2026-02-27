# 🍪 Il Mio Ricettario

App PWA per la gestione ricette di un biscottificio artigianale.
Funziona completamente **offline** dopo la prima installazione.

---

## ⚡ Build rapida (segui nell'ordine)

```bash
# 1. Installa dipendenze
npm install

# 2. Genera le icone PNG (OBBLIGATORIO per PWABuilder)
node scripts/prebuild.mjs

# 3. Build produzione
npm run build

# 4. Testa in locale
npx serve -s dist -l 3000
```

---

## 🚀 Deploy su Vercel

```bash
npm install
node scripts/prebuild.mjs
npm run build
# poi push su GitHub → Vercel fa il deploy automatico
```

> ⚠️ **Importante per Vercel**: Vercel esegue solo `npm run build`.
> Le icone devono essere generate **prima** del push, oppure
> aggiungi un Build Command personalizzato su Vercel:
> `node scripts/prebuild.mjs && npm run build`

### Configurazione Build Command su Vercel:
1. Vai su Vercel → il tuo progetto → **Settings → General**
2. **Build Command**: `node scripts/prebuild.mjs && npm run build`
3. **Output Directory**: `dist`
4. Salva e rideploya

---

## 📱 PWABuilder → APK Android

### Prerequisiti
Le icone PNG devono esistere in `public/icons/`. Verificale con:
```bash
ls public/icons/
# deve mostrare: icon-72.png, icon-96.png, ... icon-512.png
```

### Passi
1. Fai il deploy su Vercel (con icone incluse)
2. Vai su **[pwabuilder.com](https://www.pwabuilder.com)**
3. Incolla l'URL Vercel → **"Start"**
4. Tutti i punteggi devono essere verdi 🟢
5. **"Package for stores"** → **"Android"** → **"Generate Package"**
6. Scarica lo ZIP → dentro c'è `app-release.apk`

### Installa APK sul dispositivo
```bash
# Con cavo USB (ADB)
adb install app-release.apk

# Oppure: copia l'APK sul telefono e aprilo dal file manager
# Impostazioni → Sicurezza → Installa app sconosciute → Attiva
```

---

## 🛠 Stack tecnico

| Tecnologia | Uso |
|---|---|
| React 19 | UI framework |
| TypeScript | Type safety |
| Vite 7 | Build tool |
| Tailwind CSS 4 | Styling |
| Zustand | State management |
| React Router v7 | Navigazione |
| vite-plugin-pwa | Service Worker + Manifest |
| Workbox | Cache offline |
| sharp | Generazione icone PNG |
| localStorage | Persistenza dati locale |

---

## 📂 Struttura cartelle

```
src/
├── App.tsx                    # Entry point, shell responsive
├── main.tsx                   # Mount React + registra SW
├── config/
│   ├── constants.ts           # Costanti app, categorie, tag
│   └── theme.ts               # Colori e design tokens
├── models/
│   └── types.ts               # Tipi TypeScript (Ricetta, Ingrediente, ...)
├── providers/
│   └── store.ts               # Zustand store (ricette, categorie, prezzi, preferenze)
├── services/
│   └── database_service.ts    # CRUD localStorage
├── screens/
│   ├── HomeScreen.tsx
│   ├── ListaRicetteScreen.tsx
│   ├── DettaglioRicettaScreen.tsx
│   ├── CreaModificaRicettaScreen.tsx
│   ├── CalcolatoreCostiScreen.tsx
│   ├── ImpostazioniScreen.tsx
│   ├── GestioneCategorieScreen.tsx
│   └── OnboardingScreen.tsx
└── widgets/
    ├── RicettaCard.tsx
    ├── FiltriBottomSheet.tsx
    ├── TimerBottomSheet.tsx
    ├── CondividiModal.tsx
    └── ShimmerLoader.tsx

public/
├── favicon.svg
├── favicon.png                # generato da prebuild.mjs
├── apple-touch-icon.png       # generato da prebuild.mjs
└── icons/
    ├── icon-72.png            # generato da prebuild.mjs
    ├── icon-96.png
    ├── icon-128.png
    ├── icon-144.png
    ├── icon-152.png
    ├── icon-192.png           # usata come icona principale
    ├── icon-384.png
    └── icon-512.png           # usata come maskable icon

scripts/
├── prebuild.mjs               # Genera icone PNG con sharp
└── generate-icons-png.mjs     # Alias dello stesso script
```

---

## ✨ Funzionalità

- 📖 **Gestione ricette** completa (crea, modifica, elimina, duplica)
- 📊 **Scala dosi** con ricalcolo automatico ingredienti
- 💰 **Calcolatore costi** con slider margine e prezzo vendita
- ⏱ **Timer integrato** con notifica audio e vibrazione
- 🔍 **Ricerca e filtri** su nome, ingredienti, tags, categoria, difficoltà
- 📤 **Condividi** ricetta formato WhatsApp
- 🖥 **WakeLock** - schermo sempre acceso in laboratorio
- 🔍 **Modalità Laboratorio** - testo ingrandito al 130%
- 💾 **Backup/Ripristino** JSON completo
- 📥 **Esporta CSV** costi
- 🎨 **Tema chiaro/scuro/automatico**
- 📱 **PWA installabile** su Android e iOS
- 🔌 **100% offline** dopo la prima visita

---

## 🆘 Risoluzione problemi

### PWABuilder: "icons not fetchable" (404)
```bash
# Le icone non sono state generate. Esegui:
node scripts/prebuild.mjs
npm run build
# poi ripusha su GitHub
```

### Vercel non trova le icone
Imposta il Build Command su Vercel a:
```
node scripts/prebuild.mjs && npm run build
```

### npm install fallisce
```bash
npm install --legacy-peer-deps
```

### sharp non funziona
```bash
npm install -D sharp
node scripts/prebuild.mjs
```
