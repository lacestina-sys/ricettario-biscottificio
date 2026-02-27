# 🍪 Il Mio Ricettario

App web progressiva (PWA) per la gestione ricette di un biscottificio artigianale.
Funziona completamente **offline**, nessun server, nessun cloud.

---

## 📱 Come installare su Android (3 metodi)

### Metodo 1 — PWABuilder → APK (Consigliato)

PWABuilder è uno strumento gratuito di Microsoft che converte una PWA in APK Android.

#### Prerequisiti
- Un account GitHub gratuito
- La web app pubblicata online (GitHub Pages è gratuito)

#### Step 1 — Pubblica su GitHub Pages

```bash
# Installa il tool di deploy
npm install -D gh-pages

# Aggiungi al package.json → scripts:
# "deploy": "gh-pages -d dist"

# Build + deploy
npm run build
npm run deploy
```

L'app sarà disponibile su:
`https://[tuo-username].github.io/[nome-repo]/`

#### Step 2 — Genera le icone PNG (necessarie per PWABuilder)

```bash
# Installa sharp per generare PNG da SVG
npm install -D sharp

# Genera tutte le icone
node scripts/generate-icons-png.mjs

# Rebuild con le icone PNG
npm run build
npm run deploy
```

#### Step 3 — Usa PWABuilder

1. Vai su **https://www.pwabuilder.com**
2. Incolla l'URL della tua app (es. `https://tuousername.github.io/ricettario/`)
3. Clicca **"Start"** — PWABuilder analizza il manifest e il SW
4. Il punteggio deve essere **verde** su tutte le voci
5. Clicca **"Package for stores"**
6. Seleziona **"Android"** → **"Generate Package"**
7. Scegli **"Android App Bundle (.aab)"** per il Play Store
   oppure **"APK"** per installazione diretta
8. Scarica il file `.apk` o `.aab`

#### Step 4 — Installa l'APK sul dispositivo

```bash
# Con cavo USB (ADB)
adb install app-release.apk

# Oppure: copia sul telefono e apri dal file manager
# Impostazioni → App → Installa app sconosciute → Attiva
```

---

### Metodo 2 — PWA diretta da Chrome (più semplice, nessun APK)

```bash
# Avvia server locale
npm run build
npx serve -s dist -l 3000

# Sul telefono Android (stesso WiFi):
# Chrome → http://[IP-PC]:3000
# Tre puntini → "Aggiungi a schermata Home"
```

✅ Funziona offline, fullscreen, sembra un'app nativa.

---

### Metodo 3 — Netlify Drop (deploy in 30 secondi)

1. `npm run build`
2. Vai su **https://app.netlify.com/drop**
3. Trascina la cartella `dist/` nella pagina
4. Copia l'URL generato (es. `https://random-name.netlify.app`)
5. Usa quell'URL su PWABuilder

---

## 🛠 Sviluppo locale

```bash
# Installa dipendenze
npm install

# Avvia dev server
npm run dev

# Build produzione
npm run build

# Preview build locale
npm run preview

# Genera icone SVG
node scripts/generate-icons.mjs

# Genera icone PNG (richiede: npm install -D sharp)
node scripts/generate-icons-png.mjs
```

---

## 📋 Stack tecnico

| Componente | Tecnologia | Equivalente Flutter |
|---|---|---|
| Framework UI | React 19 + TypeScript | Flutter + Dart |
| Build tool | Vite 7 | flutter build |
| Stile | Tailwind CSS 4 | Material 3 |
| State management | Zustand | Riverpod |
| Database | localStorage (JSON) | Hive |
| Routing | React Router 7 | GoRouter |
| PWA / Offline | vite-plugin-pwa + Workbox | — |
| Icone | Lucide React | Material Icons |
| Font | Nunito (Google Fonts) | Google Fonts |

---

## 📁 Struttura cartelle

```
src/
├── main.tsx              # Entry point + SW registration
├── App.tsx               # Shell responsive + tema + routing
├── index.css             # Stili globali
├── config/
│   ├── constants.ts      # Costanti app (categorie, tags, ecc.)
│   └── theme.ts          # Palette colori
├── models/
│   └── types.ts          # TypeScript types (Ricetta, Ingrediente, ecc.)
├── providers/
│   └── store.ts          # Zustand store (ricette, categorie, prezzi, impostazioni)
├── services/
│   └── database_service.ts  # CRUD localStorage + dati di esempio
├── screens/
│   ├── HomeScreen.tsx
│   ├── ListaRicetteScreen.tsx
│   ├── DettaglioRicettaScreen.tsx
│   ├── CreaModificaRicettaScreen.tsx
│   ├── CalcolatoreCostiScreen.tsx
│   ├── ImpostazioniScreen.tsx
│   ├── GestioneCategorieScreen.tsx
│   └── OnboardingScreen.tsx
├── widgets/
│   ├── RicettaCard.tsx
│   ├── FiltriBottomSheet.tsx
│   ├── TimerBottomSheet.tsx
│   ├── CondividiModal.tsx
│   └── ShimmerLoader.tsx
public/
├── favicon.svg
├── apple-touch-icon.png
├── icons/                # Icone PWA (72, 96, 128, 144, 152, 192, 384, 512)
└── screenshots/          # Screenshot per PWABuilder
scripts/
├── generate-icons.mjs    # Genera SVG placeholder
└── generate-icons-png.mjs  # Genera PNG reali (richiede sharp)
```

---

## ✅ Checklist PWABuilder

Prima di usare PWABuilder, verifica:

- [ ] App pubblicata su HTTPS
- [ ] `/manifest.webmanifest` raggiungibile e valido
- [ ] Service Worker registrato e funzionante
- [ ] Icone PNG presenti in tutte le dimensioni richieste (almeno 512×512)
- [ ] `start_url` nel manifest corrisponde all'URL dell'app
- [ ] App funziona offline (ricarica senza internet)

Verifica con: **Chrome DevTools → Application → Manifest / Service Workers**

---

## 🔧 Configurazione PWABuilder avanzata

Dopo aver generato il package Android con PWABuilder, puoi personalizzare:

**Nel file `assetlinks.json`** (per Android App Links):
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.biscottificio.ricettario",
    "sha256_cert_fingerprints": ["..."]
  }
}]
```

**Pubblica su:** `https://tuodominio.com/.well-known/assetlinks.json`

---

## 📦 Funzionalità

- ✅ Gestione ricette (CRUD completo)
- ✅ Scale dosi proporzionale intelligente
- ✅ Calcolo costi ingredienti
- ✅ Timer integrato con vibrazione
- ✅ Filtri e ricerca avanzata
- ✅ Categorie personalizzabili
- ✅ Tema chiaro/scuro/automatico
- ✅ Modalità laboratorio (testo più grande)
- ✅ Esporta backup JSON
- ✅ Importa backup JSON
- ✅ Esporta CSV costi
- ✅ Condividi ricetta (formato WhatsApp)
- ✅ Funzionamento completamente offline
- ✅ Installabile come app (PWA)

---

## 📄 Licenza

Uso privato — Biscottificio Artigianale
