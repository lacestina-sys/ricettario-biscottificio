import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, ChevronRight, X } from 'lucide-react';
import { useRicettarioStore } from '../providers/store';
import { RicettaCard } from '../widgets/RicettaCard';
import { COLORS } from '../config/constants';

// ── Icone categorie (emoji) ────────────────────────────────────────────────
const CATEGORIA_EMOJI: Record<string, string> = {
  cookie:        '🍪',
  cookie_bite:   '🍫',
  grain:         '🌾',
  spa:           '🌸',
  cloud:         '☁️',
  star:          '⭐',
  layers:        '🎂',
  view_agenda:   '🧇',
  more_horiz:    '✨',
};

// ── Helper data in italiano ───────────────────────────────────────────────
const GIORNI = ['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'];
const MESI = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];

function formatDataIT(d: Date): string {
  const giorno = GIORNI[d.getDay()];
  const num    = d.getDate();
  const mese   = MESI[d.getMonth()];
  const anno   = d.getFullYear();
  return `${giorno} ${num} ${mese} ${anno}`;
}

function salutoOra(): string {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return 'Buongiorno';
  if (h >= 12 && h < 18) return 'Buon pomeriggio';
  return 'Buonasera';
}

// ─────────────────────────────────────────────────────────────────────────
export const HomeScreen: React.FC = () => {
  const navigate    = useNavigate();
  const ricette     = useRicettarioStore(s => s.ricette);
  const categorie   = useRicettarioStore(s => s.categorie);
  const setSearch   = useRicettarioStore(s => s.setSearch);
  const setFiltri   = useRicettarioStore(s => s.setFiltri);

  const [searchLocal, setSearchLocal] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const oggi = useMemo(() => new Date(), []);

  // Preferite (solo le ricette con preferita=true)
  const preferite = useMemo(
    () => ricette.filter(r => r.preferita),
    [ricette],
  );

  // Ultime 5 modificate di recente
  const recenti = useMemo(
    () =>
      [...ricette]
        .sort((a, b) => new Date(b.dataModifica).getTime() - new Date(a.dataModifica).getTime())
        .slice(0, 5),
    [ricette],
  );

  // Contatore ricette per categoria
  const countPerCategoria = useMemo(() => {
    const map: Record<string, number> = {};
    ricette.forEach(r => { map[r.categoria] = (map[r.categoria] ?? 0) + 1; });
    return map;
  }, [ricette]);

  // Ricerca → naviga a /ricette con filtro applicato
  const handleSearch = (q: string) => {
    setSearchLocal(q);
  };

  const submitSearch = () => {
    if (!searchLocal.trim()) return;
    setSearch(searchLocal.trim());
    navigate('/ricette');
  };

  const handleSearchKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') submitSearch();
  };

  // Click categoria → naviga con filtro
  const handleCategoriaClick = (catId: string) => {
    setFiltri({ categorie: [catId] });
    navigate('/ricette');
  };

  return (
    <div style={{ minHeight: '100%', background: COLORS.background }}>

      {/* ── Header hero ─────────────────────────────────────────────────── */}
      <div style={{
        background: `linear-gradient(160deg, ${COLORS.primaryDark} 0%, ${COLORS.primary} 60%, #a1887f 100%)`,
        padding: '36px 20px 56px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorazioni sfondo */}
        <div style={{ position: 'absolute', right: -30, top: -30, fontSize: 120, opacity: 0.08, userSelect: 'none', pointerEvents: 'none' }}>🍪</div>
        <div style={{ position: 'absolute', left: -20, bottom: -20, fontSize: 90, opacity: 0.07, userSelect: 'none', pointerEvents: 'none' }}>🥐</div>

        <p style={{ margin: '0 0 4px', fontSize: 13, color: '#FFCC80', fontWeight: 600, letterSpacing: 0.5 }}>
          {formatDataIT(oggi)}
        </p>
        <h1 style={{ margin: '0 0 2px', fontSize: 28, fontWeight: 800, color: '#FFFFFF' }}>
          {salutoOra()}! 👋
        </h1>
        <p style={{ margin: '0 0 28px', fontSize: 15, color: '#FFCC80', fontWeight: 600 }}>
          🍪 Il Mio Ricettario &mdash; {ricette.length} ricett{ricette.length === 1 ? 'a' : 'e'}
        </p>

        {/* Barra di ricerca */}
        <div style={{ position: 'relative' }}>
          <Search
            size={18}
            style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#a1887f', pointerEvents: 'none' }}
          />
          <input
            ref={searchRef}
            value={searchLocal}
            onChange={e => handleSearch(e.target.value)}
            onKeyDown={handleSearchKey}
            placeholder="Cerca ricette, ingredienti, tag…"
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '15px 44px 15px 48px',
              border: 'none',
              borderRadius: 16,
              fontSize: 15,
              fontFamily: 'inherit',
              background: '#FFFFFF',
              color: '#3E2723',
              outline: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
            }}
          />
          {searchLocal && (
            <button
              onClick={() => setSearchLocal('')}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: '#a1887f',
                display: 'flex', alignItems: 'center', padding: 4,
              }}
            >
              <X size={16} />
            </button>
          )}
          {searchLocal && (
            <button
              onClick={submitSearch}
              style={{
                position: 'absolute', right: 44, top: '50%', transform: 'translateY(-50%)',
                background: COLORS.primary, border: 'none', cursor: 'pointer', color: '#FFF',
                borderRadius: 10, padding: '6px 12px', fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
              }}
            >
              Cerca
            </button>
          )}
        </div>
      </div>

      {/* ── Contenuto ───────────────────────────────────────────────────── */}
      <div style={{ padding: '0 16px 100px', maxWidth: 900, margin: '0 auto' }}>

        {/* ── Sezione Preferite ─────────────────────────────────────────── */}
        {preferite.length > 0 && (
          <Section
            titolo="⭐ Preferite"
            onVediTutte={() => { setFiltri({ soloPreferite: true }); navigate('/ricette'); }}
          >
            <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
              <style>{`.scroll-no-bar::-webkit-scrollbar{display:none}`}</style>
              {preferite.map(r => (
                <RicettaCard key={r.id} ricetta={r} categorie={categorie} compact />
              ))}
            </div>
          </Section>
        )}

        {/* ── Sezione Recenti ───────────────────────────────────────────── */}
        {ricette.length > 0 && (
          <Section
            titolo="🕐 Modificate di Recente"
            onVediTutte={() => navigate('/ricette')}
          >
            <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8 }}>
              {recenti.map(r => (
                <RicettaCard key={r.id} ricetta={r} categorie={categorie} compact />
              ))}
            </div>
          </Section>
        )}

        {/* ── Sezione vuota ─────────────────────────────────────────────── */}
        {ricette.length === 0 && (
          <div style={{
            background: '#FFFFFF',
            borderRadius: 20,
            padding: '40px 24px',
            textAlign: 'center',
            boxShadow: '0 2px 10px rgba(121,85,72,0.10)',
            marginTop: 24,
          }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>📋</div>
            <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800, color: '#3E2723' }}>
              Nessuna ricetta ancora
            </h2>
            <p style={{ margin: '0 0 24px', color: '#6D4C41', fontSize: 15 }}>
              Inizia aggiungendo la tua prima ricetta al laboratorio!
            </p>
            <button
              onClick={() => navigate('/crea')}
              style={{
                background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryLight})`,
                color: '#FFF', border: 'none', borderRadius: 14,
                padding: '14px 28px', fontSize: 16, fontWeight: 700, fontFamily: 'inherit',
                cursor: 'pointer', boxShadow: '0 4px 14px rgba(121,85,72,0.30)',
                minHeight: 52,
              }}
            >
              + Crea Prima Ricetta
            </button>
          </div>
        )}

        {/* ── Sezione Categorie ─────────────────────────────────────────── */}
        {categorie.length > 0 && (
          <Section titolo="📂 Categorie" onVediTutte={undefined}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 12,
            }}>
              {categorie.map(cat => {
                const count = countPerCategoria[cat.id] ?? 0;
                return (
                  <CategoriaCard
                    key={cat.id}
                    nome={cat.nome}
                    icona={CATEGORIA_EMOJI[cat.icona] ?? '🍪'}
                    count={count}
                    onClick={() => handleCategoriaClick(cat.id)}
                  />
                );
              })}
            </div>
          </Section>
        )}
      </div>

      {/* ── FAB ─────────────────────────────────────────────────────────── */}
      <button
        onClick={() => navigate('/crea')}
        title="Crea nuova ricetta"
        style={{
          position: 'fixed',
          bottom: 90,
          right: 20,
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${COLORS.accent}, #FF8F00)`,
          border: 'none',
          boxShadow: '0 6px 20px rgba(255,193,7,0.50)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 90,
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)';
          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 24px rgba(255,193,7,0.60)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(255,193,7,0.50)';
        }}
      >
        <Plus size={28} color="#3E2723" strokeWidth={2.5} />
      </button>

      {/* Nav bottom space */}
      <style>{`@media (min-width: 600px){ .fab-home{ bottom: 24px !important; right: 24px !important; } }`}</style>
    </div>
  );
};

// ── Sub-componenti ─────────────────────────────────────────────────────────

const Section: React.FC<{
  titolo: string;
  onVediTutte?: (() => void) | undefined;
  children: React.ReactNode;
}> = ({ titolo, onVediTutte, children }) => (
  <div style={{ marginTop: 28 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#3E2723' }}>{titolo}</h2>
      {onVediTutte && (
        <button
          onClick={onVediTutte}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: COLORS.primary, fontWeight: 700, fontSize: 13,
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 2,
            padding: '4px 8px',
          }}
        >
          Tutte <ChevronRight size={14} />
        </button>
      )}
    </div>
    {children}
  </div>
);

const CategoriaCard: React.FC<{
  nome: string;
  icona: string;
  count: number;
  onClick: () => void;
}> = ({ nome, icona, count, onClick }) => {
  const [hover, setHover] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? COLORS.primary : '#FFFFFF',
        border: `2px solid ${hover ? COLORS.primary : '#EFEBE9'}`,
        borderRadius: 16,
        padding: '16px 14px',
        cursor: 'pointer',
        fontFamily: 'inherit',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        textAlign: 'left',
        transition: 'all 0.18s',
        boxShadow: hover ? '0 4px 16px rgba(121,85,72,0.22)' : '0 1px 4px rgba(121,85,72,0.08)',
        transform: hover ? 'translateY(-2px)' : 'none',
        minHeight: 72,
      }}
    >
      <span style={{ fontSize: 30, lineHeight: 1, flexShrink: 0 }}>{icona}</span>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <p style={{
          margin: '0 0 2px',
          fontSize: 14, fontWeight: 700,
          color: hover ? '#FFFFFF' : '#3E2723',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {nome}
        </p>
        <p style={{ margin: 0, fontSize: 12, color: hover ? '#FFCC80' : '#6D4C41', fontWeight: 600 }}>
          {count} ricett{count === 1 ? 'a' : 'e'}
        </p>
      </div>
    </button>
  );
};
