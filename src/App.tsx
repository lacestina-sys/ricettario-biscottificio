import React, { useEffect, useState, useRef } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/600.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
import { Home, BookOpen, Calculator, Settings } from 'lucide-react';

import { DatabaseService } from './services/database_service';
import { useRicettarioStore, usePreferenzeStore } from './providers/store';
import type { Preferenze } from './providers/store';

import { HomeScreen } from './screens/HomeScreen';
import { ListaRicetteScreen } from './screens/ListaRicetteScreen';
import { DettaglioRicettaScreen } from './screens/DettaglioRicettaScreen';
import { CreaModificaRicettaScreen } from './screens/CreaModificaRicettaScreen';
import { CalcolatoreCostiScreen } from './screens/CalcolatoreCostiScreen';
import { ImpostazioniScreen } from './screens/ImpostazioniScreen';
import { GestioneCategorieScreen } from './screens/GestioneCategorieScreen';
import { OnboardingScreen, isOnboardingDone } from './screens/OnboardingScreen';
import { ShimmerHome } from './widgets/ShimmerLoader';

// ── Voci navigazione ────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { path: '/',             label: 'Home',         icon: Home      },
  { path: '/ricette',      label: 'Ricette',       icon: BookOpen  },
  { path: '/costi',        label: 'Costi',         icon: Calculator},
  { path: '/impostazioni', label: 'Impostazioni',  icon: Settings  },
] as const;

// ── Calcola font-size base da preferenze ─────────────────────────────────
function getFontScale(dim: Preferenze['dimensioneTesto']): number {
  switch (dim) {
    case 'grande': return 1.15;
    case 'extra':  return 1.30;
    default:       return 1.00;
  }
}

// ── Calcola palette colori dal tema ──────────────────────────────────────
function getThemeColors(tema: Preferenze['tema']) {
  const prefersDark =
    tema === 'scuro' ||
    (tema === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return {
    bg:         prefersDark ? '#1C1008' : '#FFF8E1',
    surface:    prefersDark ? '#2A1A0E' : '#FFFFFF',
    navBg:      prefersDark ? '#2A1A0E' : '#FFFFFF',
    navBorder:  prefersDark ? '#4b2c20' : '#D7CCC8',
    navText:    prefersDark ? '#D7CCC8' : '#a1887f',
    navActive:  prefersDark ? '#4b2c20' : '#FFF8E1',
    navActiveText: '#795548',
    text:       prefersDark ? '#EFEBE9' : '#3E2723',
  };
}

// ── Page Transition Wrapper ──────────────────────────────────────────────
const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [stage, setStage] = useState<'idle' | 'exit' | 'enter'>('idle');
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    if (location.pathname === prevPath.current) return;
    prevPath.current = location.pathname;

    setStage('exit');
    const t1 = setTimeout(() => {
      setDisplayLocation(location);
      setStage('enter');
    }, 160);
    const t2 = setTimeout(() => setStage('idle'), 320);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [location]);

  const style: React.CSSProperties = {
    transition: 'opacity 0.16s ease, transform 0.16s ease',
    opacity: stage === 'exit' ? 0 : 1,
    transform: stage === 'exit'
      ? 'translateY(8px)'
      : stage === 'enter'
        ? 'translateY(-4px)'
        : 'translateY(0)',
    height: '100%',
  };

  return (
    <div style={style} key={displayLocation.pathname}>
      {children}
    </div>
  );
};

// ── AppShell ─────────────────────────────────────────────────────────────
const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { preferenze } = usePreferenzeStore();

  const hideNav =
    location.pathname.startsWith('/ricetta/') ||
    location.pathname === '/crea' ||
    location.pathname.startsWith('/modifica/') ||
    location.pathname === '/categorie';

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const colors = getThemeColors(preferenze.tema);
  const fontScale = getFontScale(preferenze.dimensioneTesto);

  return (
    <div style={{
      display: 'flex',
      height: '100dvh',
      background: colors.bg,
      fontFamily: '"Nunito", sans-serif',
      fontSize: `${fontScale}rem`,
      overflow: 'hidden',
    }}>
      {/* Navigation Rail (tablet ≥ 600px) */}
      {!hideNav && (
        <nav className="nav-rail" style={{
          width: 80,
          background: colors.navBg,
          borderRight: `1px solid ${colors.navBorder}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 20,
          paddingBottom: 20,
          gap: 4,
          flexShrink: 0,
          boxShadow: '2px 0 8px rgba(121,85,72,0.08)',
        }}>
          {/* Logo animato */}
          <div style={{
            fontSize: 28,
            marginBottom: 20,
            animation: 'cookieSpin 8s linear infinite',
            cursor: 'default',
          }} title="Il Mio Ricettario">
            🍪
          </div>
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              title={label}
              style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 4, width: 64, minHeight: 56, borderRadius: 16, border: 'none',
                cursor: 'pointer', fontFamily: 'inherit',
                background: isActive(path) ? colors.navActive : 'transparent',
                color: isActive(path) ? colors.navActiveText : colors.navText,
                transition: 'background 0.2s, color 0.2s',
                padding: '8px 4px',
              }}
            >
              <Icon size={22} strokeWidth={isActive(path) ? 2.5 : 1.8} />
              <span style={{ fontSize: 10, fontWeight: isActive(path) ? 800 : 600 }}>
                {label}
              </span>
            </button>
          ))}
        </nav>
      )}

      {/* Main content */}
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingBottom: hideNav ? 0 : 80,
          background: colors.bg,
        }}
        className="main-content"
      >
        <PageTransition>
          {children}
        </PageTransition>
      </main>

      {/* Bottom Navigation Bar (phone < 600px) */}
      {!hideNav && (
        <nav className="nav-bottom" style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: colors.navBg,
          borderTop: `1px solid ${colors.navBorder}`,
          display: 'flex',
          justifyContent: 'space-around',
          padding: 'env(safe-area-inset-bottom, 8px)',
          paddingTop: 8,
          paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
          boxShadow: '0 -2px 8px rgba(121,85,72,0.10)',
          zIndex: 100,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}>
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 3, flex: 1, minHeight: 56, border: 'none',
                background: 'transparent', cursor: 'pointer', fontFamily: 'inherit',
                color: isActive(path) ? '#795548' : colors.navText,
                transition: 'color 0.2s',
                position: 'relative',
              }}
            >
              {/* Active indicator dot */}
              {isActive(path) && (
                <div style={{
                  position: 'absolute',
                  top: 6,
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: '#FFC107',
                }} />
              )}
              <Icon size={22} strokeWidth={isActive(path) ? 2.5 : 1.8} />
              <span style={{ fontSize: 11, fontWeight: isActive(path) ? 800 : 600 }}>
                {label}
              </span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
};

// ── AppInitializer con shimmer ────────────────────────────────────────────
const AppInitializer: React.FC<{ onReady: () => void }> = ({ onReady }) => {
  const caricaRicette   = useRicettarioStore(s => s.caricaRicette);
  const caricaCategorie = useRicettarioStore(s => s.caricaCategorie);

  useEffect(() => {
    // Simula init asincrono (es. Hive in Flutter)
    const init = async () => {
      DatabaseService.inizializza();
      caricaRicette();
      caricaCategorie();
      // Piccolo ritardo per mostrare lo shimmer e permettere al DOM di aggiornarsi
      await new Promise(r => setTimeout(r, 400));
      onReady();
    };
    init();
  }, []);

  return null;
};

// ── Stili globali ─────────────────────────────────────────────────────────
const GlobalStyles: React.FC<{ tema: Preferenze['tema'] }> = ({ tema }) => {
  const colors = getThemeColors(tema);
  return (
    <style>{`
      * { box-sizing: border-box; }

      body {
        margin: 0;
        font-family: 'Nunito', 'Segoe UI', sans-serif;
        background: ${colors.bg};
        -webkit-font-smoothing: antialiased;
        -webkit-tap-highlight-color: transparent;
        overflow: hidden;
      }

      input, textarea, select, button {
        font-family: 'Nunito', 'Segoe UI', sans-serif;
      }

      /* Scrollbar personalizzata */
      ::-webkit-scrollbar { width: 5px; height: 5px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: #D7CCC8; border-radius: 999px; }
      ::-webkit-scrollbar-thumb:hover { background: #a1887f; }

      /* Animazioni globali */
      @keyframes cookieSpin {
        0%   { transform: rotate(0deg); }
        10%  { transform: rotate(20deg); }
        20%  { transform: rotate(-10deg); }
        30%  { transform: rotate(0deg); }
        100% { transform: rotate(0deg); }
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
      @keyframes slideUp {
        from { opacity: 0; transform: translateY(20px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes slideDown {
        from { opacity: 0; transform: translateY(-20px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes popIn {
        0%   { opacity: 0; transform: scale(0.85); }
        70%  { opacity: 1; transform: scale(1.04); }
        100% { opacity: 1; transform: scale(1); }
      }
      @keyframes shimmer {
        0%   { background-position: -600px 0; }
        100% { background-position: 600px 0; }
      }
      @keyframes heartBeat {
        0%   { transform: scale(1); }
        15%  { transform: scale(1.35); }
        30%  { transform: scale(1); }
        45%  { transform: scale(1.2); }
        60%  { transform: scale(1); }
      }
      @keyframes spin {
        from { transform: rotate(0deg); }
        to   { transform: rotate(360deg); }
      }
      @keyframes checkMark {
        0%   { stroke-dashoffset: 30; }
        100% { stroke-dashoffset: 0; }
      }

      /* Tablet: mostra rail, nascondi bottom bar */
      @media (min-width: 600px) {
        .nav-bottom { display: none !important; }
        .nav-rail   { display: flex !important; }
        .main-content { padding-bottom: 0 !important; }
      }

      /* Phone: nascondi rail, mostra bottom bar */
      @media (max-width: 599px) {
        .nav-rail   { display: none !important; }
        .nav-bottom { display: flex !important; }
      }

      /* Focus outline accesibile */
      *:focus-visible {
        outline: 2px solid #FFC107;
        outline-offset: 2px;
      }

      /* Input autofill */
      input:-webkit-autofill,
      input:-webkit-autofill:hover,
      input:-webkit-autofill:focus {
        -webkit-box-shadow: 0 0 0 1000px #FFF8E1 inset;
        -webkit-text-fill-color: #3E2723;
      }

      /* Transizioni smooth per tema */
      .theme-transition {
        transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
      }
    `}</style>
  );
};

// ── App Root ─────────────────────────────────────────────────────────────
const App: React.FC = () => {
  const [dbReady, setDbReady]                     = useState(false);
  const [showOnboarding, setShowOnboarding]       = useState(false);
  const [onboardingDone, setOnboardingDone]       = useState(false);
  const { preferenze }                            = usePreferenzeStore();

  // Determina se mostrare onboarding DOPO che il db è pronto
  useEffect(() => {
    if (dbReady) {
      const done = isOnboardingDone();
      setShowOnboarding(!done);
      setOnboardingDone(done);
    }
  }, [dbReady]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setOnboardingDone(true);
  };

  const showApp = dbReady && (onboardingDone || !showOnboarding);

  return (
    <>
      <GlobalStyles tema={preferenze.tema} />

      {/* DB Initializer (invisibile) */}
      <AppInitializer onReady={() => setDbReady(true)} />

      {/* Shimmer di caricamento mentre il DB si inizializza */}
      {!dbReady && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 8000,
          background: '#FFF8E1',
          animation: 'fadeIn 0.3s ease',
        }}>
          <ShimmerHome />
        </div>
      )}

      {/* Onboarding */}
      {dbReady && showOnboarding && (
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      )}

      {/* App vera e propria */}
      {showApp && (
        <BrowserRouter>
          <AppShell>
            <Routes>
              <Route path="/"              element={<HomeScreen />} />
              <Route path="/ricette"       element={<ListaRicetteScreen />} />
              <Route path="/ricetta/:id"   element={<DettaglioRicettaScreen />} />
              <Route path="/crea"          element={<CreaModificaRicettaScreen />} />
              <Route path="/modifica/:id"  element={<CreaModificaRicettaScreen />} />
              <Route path="/costi"         element={<CalcolatoreCostiScreen />} />
              <Route path="/impostazioni"  element={<ImpostazioniScreen />} />
              <Route path="/categorie"     element={<GestioneCategorieScreen />} />
            </Routes>
          </AppShell>
        </BrowserRouter>
      )}
    </>
  );
};

export default App;
