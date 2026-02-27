import React, { useState } from 'react';
import { X, RotateCcw, Check } from 'lucide-react';
import type { Categoria, Difficolta } from '../models/types';
import type { FiltriRicette, OrdineRicette } from '../providers/store';
import { DIFFICOLTA_LABELS, DIFFICOLTA_COLORS, COLORS } from '../config/constants';

interface Props {
  open: boolean;
  onClose: () => void;
  filtri: FiltriRicette;
  ordinamento: OrdineRicette;
  categorie: Categoria[];
  allTags: string[];
  onApplica: (filtri: FiltriRicette, ord: OrdineRicette) => void;
  onReset: () => void;
}

const ORDINI: { value: OrdineRicette; label: string }[] = [
  { value: 'recenti', label: 'Più recenti' },
  { value: 'vecchie', label: 'Più vecchie' },
  { value: 'modificate', label: 'Modificate di recente' },
  { value: 'nome_az', label: 'Nome A → Z' },
  { value: 'nome_za', label: 'Nome Z → A' },
];

const DIFFICOLTA_OPTS: Difficolta[] = ['facile', 'media', 'difficile'];

export const FiltriBottomSheet: React.FC<Props> = ({
  open,
  onClose,
  filtri,
  ordinamento,
  categorie,
  allTags,
  onApplica,
  onReset,
}) => {
  // Stato locale – applichiamo solo su "Applica"
  const [localFiltri, setLocalFiltri] = useState<FiltriRicette>({ ...filtri });
  const [localOrd, setLocalOrd] = useState<OrdineRicette>(ordinamento);

  // Sync quando si apre
  React.useEffect(() => {
    if (open) {
      setLocalFiltri({ ...filtri });
      setLocalOrd(ordinamento);
    }
  }, [open, filtri, ordinamento]);

  if (!open) return null;

  // ── Helpers toggle ────────────────────────────────────────────────────
  const toggleCategoria = (id: string) => {
    setLocalFiltri(f => ({
      ...f,
      categorie: f.categorie.includes(id)
        ? f.categorie.filter(c => c !== id)
        : [...f.categorie, id],
    }));
  };

  const toggleDifficolta = (d: Difficolta) => {
    setLocalFiltri(f => ({
      ...f,
      difficolta: f.difficolta.includes(d)
        ? f.difficolta.filter(x => x !== d)
        : [...f.difficolta, d],
    }));
  };

  const toggleTag = (t: string) => {
    setLocalFiltri(f => ({
      ...f,
      tags: f.tags.includes(t) ? f.tags.filter(x => x !== t) : [...f.tags, t],
    }));
  };

  const haFiltriAttivi =
    localFiltri.categorie.length > 0 ||
    localFiltri.difficolta.length > 0 ||
    localFiltri.soloPreferite ||
    localFiltri.tags.length > 0;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          zIndex: 200,
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Sheet */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#FFF8E1',
          borderRadius: '24px 24px 0 0',
          zIndex: 201,
          maxHeight: '88dvh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -8px 32px rgba(121,85,72,0.18)',
          animation: 'slideUp 0.25s ease-out',
        }}
      >
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(60px); opacity: 0; }
            to   { transform: translateY(0);   opacity: 1; }
          }
        `}</style>

        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12 }}>
          <div style={{ width: 40, height: 4, borderRadius: 999, background: '#D7CCC8' }} />
        </div>

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px 4px',
            borderBottom: '1px solid #EFEBE9',
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#3E2723' }}>
            Filtri e Ordinamento
          </h2>
          <button
            onClick={onClose}
            style={{
              background: '#EFEBE9',
              border: 'none',
              borderRadius: '50%',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#6D4C41',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body scrollabile */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Ordinamento */}
          <Section title="Ordina per">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ORDINI.map(o => (
                <Chip
                  key={o.value}
                  label={o.label}
                  active={localOrd === o.value}
                  onClick={() => setLocalOrd(o.value)}
                  color={COLORS.primary}
                />
              ))}
            </div>
          </Section>

          {/* Solo preferite */}
          <Section title="Tipo">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFFFFF', borderRadius: 14, padding: '14px 16px', boxShadow: '0 1px 4px rgba(121,85,72,0.08)' }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#3E2723' }}>
                ⭐ Solo preferite
              </span>
              <Toggle
                checked={localFiltri.soloPreferite}
                onChange={v => setLocalFiltri(f => ({ ...f, soloPreferite: v }))}
              />
            </div>
          </Section>

          {/* Difficoltà */}
          <Section title="Difficoltà">
            <div style={{ display: 'flex', gap: 10 }}>
              {DIFFICOLTA_OPTS.map(d => (
                <Chip
                  key={d}
                  label={DIFFICOLTA_LABELS[d]}
                  active={localFiltri.difficolta.includes(d)}
                  onClick={() => toggleDifficolta(d)}
                  color={DIFFICOLTA_COLORS[d]}
                />
              ))}
            </div>
          </Section>

          {/* Categorie */}
          <Section title="Categoria">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {categorie.map(c => (
                <Chip
                  key={c.id}
                  label={c.nome}
                  active={localFiltri.categorie.includes(c.id)}
                  onClick={() => toggleCategoria(c.id)}
                  color={COLORS.primary}
                />
              ))}
            </div>
          </Section>

          {/* Tags */}
          {allTags.length > 0 && (
            <Section title="Tags">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {allTags.map(t => (
                  <Chip
                    key={t}
                    label={`#${t}`}
                    active={localFiltri.tags.includes(t)}
                    onClick={() => toggleTag(t)}
                    color='#6D4C41'
                  />
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* Footer sticky */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid #EFEBE9',
            display: 'flex',
            gap: 12,
            background: '#FFF8E1',
            paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
          }}
        >
          <button
            onClick={() => {
              onReset();
              setLocalFiltri({ search: localFiltri.search, categorie: [], difficolta: [], soloPreferite: false, tags: [] });
              setLocalOrd('recenti');
            }}
            disabled={!haFiltriAttivi}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '14px',
              border: `2px solid ${haFiltriAttivi ? COLORS.primary : '#D7CCC8'}`,
              borderRadius: 14,
              background: 'transparent',
              color: haFiltriAttivi ? COLORS.primary : '#D7CCC8',
              fontSize: 15,
              fontWeight: 700,
              fontFamily: 'inherit',
              cursor: haFiltriAttivi ? 'pointer' : 'not-allowed',
              minHeight: 52,
            }}
          >
            <RotateCcw size={16} /> Reset
          </button>
          <button
            onClick={() => {
              onApplica(localFiltri, localOrd);
              onClose();
            }}
            style={{
              flex: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '14px',
              border: 'none',
              borderRadius: 14,
              background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryLight})`,
              color: '#FFFFFF',
              fontSize: 15,
              fontWeight: 700,
              fontFamily: 'inherit',
              cursor: 'pointer',
              minHeight: 52,
              boxShadow: '0 4px 12px rgba(121,85,72,0.30)',
            }}
          >
            <Check size={16} /> Applica filtri
          </button>
        </div>
      </div>
    </>
  );
};

// ── Sub-componenti ─────────────────────────────────────────────────────────

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#6D4C41', textTransform: 'uppercase', letterSpacing: 0.8 }}>
      {title}
    </p>
    {children}
  </div>
);

const Chip: React.FC<{ label: string; active: boolean; onClick: () => void; color: string }> = ({
  label, active, onClick, color,
}) => (
  <button
    onClick={onClick}
    style={{
      padding: '8px 16px',
      borderRadius: 999,
      border: `2px solid ${active ? color : '#D7CCC8'}`,
      background: active ? color : '#FFFFFF',
      color: active ? '#FFFFFF' : '#6D4C41',
      fontSize: 13,
      fontWeight: 700,
      fontFamily: 'inherit',
      cursor: 'pointer',
      transition: 'all 0.15s',
      minHeight: 40,
      display: 'flex',
      alignItems: 'center',
      gap: 4,
    }}
  >
    {active && <Check size={12} />}
    {label}
  </button>
);

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ checked, onChange }) => (
  <button
    onClick={() => onChange(!checked)}
    style={{
      width: 52,
      height: 30,
      borderRadius: 999,
      border: 'none',
      background: checked ? COLORS.primary : '#D7CCC8',
      cursor: 'pointer',
      position: 'relative',
      transition: 'background 0.2s',
      flexShrink: 0,
    }}
  >
    <span style={{
      position: 'absolute',
      top: 3,
      left: checked ? 24 : 3,
      width: 24,
      height: 24,
      borderRadius: '50%',
      background: '#FFFFFF',
      boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
      transition: 'left 0.2s',
      display: 'block',
    }} />
  </button>
);
