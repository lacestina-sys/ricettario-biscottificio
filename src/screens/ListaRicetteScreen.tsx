import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search, Plus, SlidersHorizontal, X,
  ArrowUpDown, ChevronDown,
} from 'lucide-react';
import { useRicettarioStore } from '../providers/store';
import type { OrdineRicette } from '../providers/store';
import { RicettaCard } from '../widgets/RicettaCard';
import { FiltriBottomSheet } from '../widgets/FiltriBottomSheet';
import { COLORS } from '../config/constants';

// ── Label ordinamento ─────────────────────────────────────────────────────
const ORDINI_LABEL: Record<OrdineRicette, string> = {
  recenti:    'Più recenti',
  vecchie:    'Più vecchie',
  modificate: 'Modificate di recente',
  nome_az:    'Nome A → Z',
  nome_za:    'Nome Z → A',
};

// ─────────────────────────────────────────────────────────────────────────
export const ListaRicetteScreen: React.FC = () => {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();

  const ricette       = useRicettarioStore(s => s.ricette);
  const categorie     = useRicettarioStore(s => s.categorie);
  const filtri        = useRicettarioStore(s => s.filtri);
  const ordinamento   = useRicettarioStore(s => s.ordinamento);
  const ricetteFiltrate = useRicettarioStore(s => s.ricetteFiltrate);
  const allTags       = useRicettarioStore(s => s.allTags);
  const setSearch     = useRicettarioStore(s => s.setSearch);
  const setFiltri     = useRicettarioStore(s => s.setFiltri);
  const resetFiltri   = useRicettarioStore(s => s.resetFiltri);
  const setOrdinamento = useRicettarioStore(s => s.setOrdinamento);

  // Ricerca locale con debounce 300ms
  const [searchLocal, setSearchLocal]   = useState(filtri.search);
  const [showFiltri, setShowFiltri]     = useState(false);
  const [showOrdine, setShowOrdine]     = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ordineRef   = useRef<HTMLDivElement>(null);

  // Risultati calcolati
  const risultati = ricetteFiltrate();

  // Se arriva da home con ?q= applica subito ricerca
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) { setSearchLocal(q); setSearch(q); }
  }, []);

  // Debounce ricerca
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFiltri({ search: searchLocal });
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchLocal]);

  // Chiudi dropdown ordinamento cliccando fuori
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ordineRef.current && !ordineRef.current.contains(e.target as Node)) {
        setShowOrdine(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const haFiltriAttivi =
    filtri.categorie.length > 0 ||
    filtri.difficolta.length > 0 ||
    filtri.soloPreferite ||
    filtri.tags.length > 0;

  // Contatore filtri attivi
  const nFiltri =
    filtri.categorie.length +
    filtri.difficolta.length +
    (filtri.soloPreferite ? 1 : 0) +
    filtri.tags.length;

  // Rilevamento tablet (>= 600px) tramite hook
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 600);
  useEffect(() => {
    const handler = () => setIsTablet(window.innerWidth >= 600);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return (
    <div style={{ minHeight: '100%', background: COLORS.background }}>
      {/* ── AppBar ──────────────────────────────────────────────────────── */}
      <div style={{
        background: '#FFFFFF',
        padding: '16px 16px 0',
        boxShadow: '0 2px 8px rgba(121,85,72,0.08)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        {/* Riga titolo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#3E2723' }}>
            📋 Ricette
          </h1>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Dropdown ordinamento */}
            <div ref={ordineRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowOrdine(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: '#EFEBE9', border: 'none',
                  borderRadius: 10, padding: '10px 12px',
                  fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
                  cursor: 'pointer', color: COLORS.primary,
                  minHeight: 40, whiteSpace: 'nowrap',
                }}
              >
                <ArrowUpDown size={14} />
                <span className="hide-xs">{ORDINI_LABEL[ordinamento]}</span>
                <ChevronDown size={12} style={{ transform: showOrdine ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
              {showOrdine && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  background: '#FFFFFF',
                  borderRadius: 14,
                  boxShadow: '0 8px 28px rgba(121,85,72,0.20)',
                  zIndex: 100,
                  overflow: 'hidden',
                  minWidth: 220,
                  border: '1px solid #EFEBE9',
                }}>
                  {(Object.keys(ORDINI_LABEL) as OrdineRicette[]).map(o => (
                    <button
                      key={o}
                      onClick={() => { setOrdinamento(o); setShowOrdine(false); }}
                      style={{
                        display: 'block', width: '100%', padding: '13px 16px',
                        textAlign: 'left', border: 'none',
                        background: ordinamento === o ? '#FFF8E1' : 'transparent',
                        color: ordinamento === o ? COLORS.primary : '#3E2723',
                        fontWeight: ordinamento === o ? 800 : 600,
                        fontSize: 14, fontFamily: 'inherit', cursor: 'pointer',
                        borderLeft: ordinamento === o ? `3px solid ${COLORS.primary}` : '3px solid transparent',
                      }}
                    >
                      {ORDINI_LABEL[o]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Bottone nuova ricetta */}
            <button
              onClick={() => navigate('/crea')}
              style={{
                background: COLORS.primary, color: '#FFF', border: 'none',
                borderRadius: 10, padding: '10px 14px',
                fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                minHeight: 40,
              }}
            >
              <Plus size={16} />
              <span className="hide-xs">Nuova</span>
            </button>
          </div>
        </div>

        {/* Riga ricerca + filtri */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={17} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#a1887f', pointerEvents: 'none' }} />
            <input
              value={searchLocal}
              onChange={e => setSearchLocal(e.target.value)}
              placeholder="Cerca per nome, ingrediente, tag…"
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '13px 40px 13px 42px',
                border: '2px solid #EFEBE9',
                borderRadius: 12, fontSize: 14, fontFamily: 'inherit',
                background: '#F9F5F0', color: '#3E2723', outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => (e.target.style.borderColor = COLORS.primary)}
              onBlur={e => (e.target.style.borderColor = '#EFEBE9')}
            />
            {searchLocal && (
              <button
                onClick={() => { setSearchLocal(''); setFiltri({ search: '' }); }}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#a1887f',
                  display: 'flex', alignItems: 'center', padding: 4,
                }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Bottone filtri */}
          <button
            onClick={() => setShowFiltri(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: haFiltriAttivi ? COLORS.primary : '#EFEBE9',
              color: haFiltriAttivi ? '#FFF' : COLORS.primary,
              border: 'none', borderRadius: 12,
              padding: '13px 14px',
              fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
              cursor: 'pointer', whiteSpace: 'nowrap',
              minHeight: 48, position: 'relative',
            }}
          >
            <SlidersHorizontal size={16} />
            {nFiltri > 0 && (
              <span style={{
                background: COLORS.accent, color: '#3E2723',
                borderRadius: '50%', width: 18, height: 18,
                fontSize: 10, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'absolute', top: -4, right: -4,
              }}>
                {nFiltri}
              </span>
            )}
          </button>
        </div>

        {/* Chips filtri attivi */}
        {haFiltriAttivi && (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, scrollbarWidth: 'none' }}>
            {filtri.soloPreferite && (
              <FiltroChipAttivo label="⭐ Preferite" onRemove={() => setFiltri({ soloPreferite: false })} />
            )}
            {filtri.difficolta.map(d => (
              <FiltroChipAttivo key={d} label={d.charAt(0).toUpperCase() + d.slice(1)} onRemove={() => setFiltri({ difficolta: filtri.difficolta.filter(x => x !== d) })} />
            ))}
            {filtri.categorie.map(cId => {
              const cat = categorie.find(c => c.id === cId);
              return cat ? <FiltroChipAttivo key={cId} label={cat.nome} onRemove={() => setFiltri({ categorie: filtri.categorie.filter(x => x !== cId) })} /> : null;
            })}
            {filtri.tags.map(t => (
              <FiltroChipAttivo key={t} label={`#${t}`} onRemove={() => setFiltri({ tags: filtri.tags.filter(x => x !== t) })} />
            ))}
            <button
              onClick={resetFiltri}
              style={{
                background: 'none', border: `1px solid ${COLORS.primary}`, borderRadius: 999,
                padding: '4px 10px', fontSize: 12, fontWeight: 700, color: COLORS.primary,
                fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              Reset tutto
            </button>
          </div>
        )}
      </div>

      {/* ── Contatore risultati ───────────────────────────────────────────── */}
      <div style={{ padding: '12px 16px 4px' }}>
        <p style={{ margin: 0, fontSize: 13, color: '#6D4C41', fontWeight: 600 }}>
          {risultati.length === 0
            ? 'Nessuna ricetta trovata'
            : `Trovate ${risultati.length} ricett${risultati.length === 1 ? 'a' : 'e'}`}
          {ricette.length > 0 && risultati.length < ricette.length
            ? ` su ${ricette.length} totali`
            : ''}
        </p>
      </div>

      {/* ── Lista / Griglia ───────────────────────────────────────────────── */}
      <div style={{ padding: '8px 16px 100px' }}>
        {risultati.length === 0 ? (
          <StatoVuoto
            hasRicette={ricette.length > 0}
            hasFiltri={haFiltriAttivi || !!filtri.search}
            onReset={() => { resetFiltri(); setSearchLocal(''); }}
            onCrea={() => navigate('/crea')}
          />
        ) : isTablet ? (
          /* Griglia 2 colonne tablet */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 16,
          }}>
            {risultati.map(r => (
              <RicettaCard key={r.id} ricetta={r} categorie={categorie} vertical />
            ))}
          </div>
        ) : (
          /* Lista verticale telefono */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {risultati.map(r => (
              <RicettaCard key={r.id} ricetta={r} categorie={categorie} />
            ))}
          </div>
        )}
      </div>

      {/* ── Bottom Sheet Filtri ───────────────────────────────────────────── */}
      <FiltriBottomSheet
        open={showFiltri}
        onClose={() => setShowFiltri(false)}
        filtri={filtri}
        ordinamento={ordinamento}
        categorie={categorie}
        allTags={allTags()}
        onApplica={(nuoviFiltri, nuovoOrd) => {
          // Conserva la ricerca testuale locale
          setFiltri({ ...nuoviFiltri, search: filtri.search });
          setOrdinamento(nuovoOrd);
        }}
        onReset={() => {
          resetFiltri();
          // Mantieni ricerca testuale
          if (searchLocal) setFiltri({ search: searchLocal });
        }}
      />

      {/* FAB */}
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
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
        }}
      >
        <Plus size={28} color="#3E2723" strokeWidth={2.5} />
      </button>

      {/* Media query FAB */}
      <style>{`
        @media (min-width: 600px) {
          .hide-xs { display: inline !important; }
        }
        @media (max-width: 599px) {
          .hide-xs { display: none; }
        }
      `}</style>
    </div>
  );
};

// ── Sub-componenti ─────────────────────────────────────────────────────────

const FiltroChipAttivo: React.FC<{ label: string; onRemove: () => void }> = ({ label, onRemove }) => (
  <span style={{
    display: 'flex', alignItems: 'center', gap: 5,
    background: `${COLORS.primary}18`,
    border: `1px solid ${COLORS.primary}40`,
    borderRadius: 999,
    padding: '4px 10px 4px 12px',
    fontSize: 12, fontWeight: 700, color: COLORS.primary,
    whiteSpace: 'nowrap', flexShrink: 0,
  }}>
    {label}
    <button
      onClick={onRemove}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.primary, padding: 0, display: 'flex', alignItems: 'center' }}
    >
      <X size={12} />
    </button>
  </span>
);

const StatoVuoto: React.FC<{
  hasRicette: boolean;
  hasFiltri: boolean;
  onReset: () => void;
  onCrea: () => void;
}> = ({ hasRicette, hasFiltri, onReset, onCrea }) => (
  <div style={{
    background: '#FFFFFF',
    borderRadius: 20,
    padding: '48px 24px',
    textAlign: 'center',
    boxShadow: '0 2px 10px rgba(121,85,72,0.10)',
    marginTop: 12,
  }}>
    <div style={{ fontSize: 64, marginBottom: 16 }}>
      {hasFiltri ? '🔍' : '📋'}
    </div>
    <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800, color: '#3E2723' }}>
      {hasFiltri ? 'Nessuna ricetta trovata' : 'Nessuna ricetta ancora'}
    </h2>
    <p style={{ margin: '0 0 28px', color: '#6D4C41', fontSize: 14, lineHeight: 1.6 }}>
      {hasFiltri
        ? hasRicette
          ? 'Prova a modificare i filtri di ricerca o resetta per vedere tutte le ricette.'
          : 'Non hai ancora aggiunto ricette. Inizia creandone una!'
        : 'Il tuo ricettario è vuoto. Aggiungi la prima ricetta del laboratorio!'}
    </p>
    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
      {hasFiltri && (
        <button
          onClick={onReset}
          style={{
            padding: '13px 24px', border: `2px solid ${COLORS.primary}`,
            borderRadius: 14, background: 'transparent',
            color: COLORS.primary, fontSize: 15, fontWeight: 700,
            fontFamily: 'inherit', cursor: 'pointer', minHeight: 52,
          }}
        >
          Resetta Filtri
        </button>
      )}
      <button
        onClick={onCrea}
        style={{
          padding: '13px 24px', border: 'none',
          borderRadius: 14,
          background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryLight})`,
          color: '#FFF', fontSize: 15, fontWeight: 700,
          fontFamily: 'inherit', cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(121,85,72,0.30)',
          minHeight: 52,
        }}
      >
        + Crea Ricetta
      </button>
    </div>
  </div>
);
