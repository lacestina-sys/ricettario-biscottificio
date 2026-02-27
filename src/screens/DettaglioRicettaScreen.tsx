import React, { useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit2, Trash2, Heart,
  Users, Tag, ChevronLeft, ChevronRight, MoreVertical,
  Monitor, ZoomIn, Copy, Share2, Star,
  Check, RotateCcw, Play,
} from 'lucide-react';
import { useRicettarioStore } from '../providers/store';
import { DIFFICOLTA_LABELS } from '../config/constants';
import { TimerBottomSheet } from '../widgets/TimerBottomSheet';
import { CondividiModal } from '../widgets/CondividiModal';
import type { Ingrediente, StepPreparazione } from '../models/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formattaQuantita(q: number, unita: string): { valore: string; unita: string } {
  if (unita === 'g' || unita === 'kg') {
    const grammi = unita === 'kg' ? q * 1000 : q;
    if (grammi >= 1000) {
      const kg = grammi / 1000;
      return { valore: (kg % 1 === 0 ? kg.toString() : kg.toFixed(2).replace(/\.?0+$/, '')), unita: 'kg' };
    }
    if (grammi < 10) return { valore: grammi.toFixed(1), unita: 'g' };
    return { valore: Math.round(grammi).toString(), unita: 'g' };
  }
  if (unita === 'ml' || unita === 'l') {
    const ml = unita === 'l' ? q * 1000 : q;
    if (ml >= 1000) {
      const l = ml / 1000;
      return { valore: (l % 1 === 0 ? l.toString() : l.toFixed(2).replace(/\.?0+$/, '')), unita: 'l' };
    }
    if (ml < 10) return { valore: ml.toFixed(1), unita: 'ml' };
    return { valore: Math.round(ml).toString(), unita: 'ml' };
  }
  // Altre unità
  const v = q;
  if (v < 10) return { valore: v.toFixed(1).replace(/\.0$/, ''), unita };
  return { valore: Math.round(v).toString(), unita };
}

function formattaQuantitaScalata(ing: Ingrediente, moltiplicatore: number): string {
  const qScalata = ing.quantita * moltiplicatore;
  const { valore, unita } = formattaQuantita(qScalata, ing.unitaMisura);
  return `${valore} ${unita}`;
}

function formattaQuantitaOriginale(ing: Ingrediente): string {
  const { valore, unita } = formattaQuantita(ing.quantita, ing.unitaMisura);
  return `${valore} ${unita}`;
}

function costoIngrediente(ing: Ingrediente): number {
  if (!ing.costoAlKg) return 0;
  if (ing.unitaMisura === 'g') return (ing.quantita / 1000) * ing.costoAlKg;
  if (ing.unitaMisura === 'kg') return ing.quantita * ing.costoAlKg;
  if (ing.unitaMisura === 'ml') return (ing.quantita / 1000) * ing.costoAlKg;
  if (ing.unitaMisura === 'l') return ing.quantita * ing.costoAlKg;
  return 0;
}

// ─── Stelle difficoltà ────────────────────────────────────────────────────────
const StelleDifficolta: React.FC<{ livello: string }> = ({ livello }) => {
  const n = livello === 'facile' ? 1 : livello === 'media' ? 2 : 3;
  const col = livello === 'facile' ? '#4CAF50' : livello === 'media' ? '#FFC107' : '#F44336';
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[1, 2, 3].map(i => (
        <Star key={i} size={13} fill={i <= n ? col : 'transparent'} color={col} />
      ))}
    </span>
  );
};

// ─── Chip info rapida ─────────────────────────────────────────────────────────
const InfoChip: React.FC<{ emoji: string; label: string; sub?: string; accent?: boolean }> = ({
  emoji, label, sub, accent,
}) => (
  <div style={{
    display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
    background: accent ? '#FFF8E1' : '#EFEBE9',
    borderRadius: 12, padding: '8px 14px',
    border: accent ? '1.5px solid #FFC107' : '1.5px solid transparent',
    minWidth: 72,
  }}>
    <span style={{ fontSize: 18, lineHeight: 1 }}>{emoji}</span>
    <span style={{ fontSize: 13, fontWeight: 800, color: '#3E2723', marginTop: 2 }}>{label}</span>
    {sub && <span style={{ fontSize: 10, color: '#a1887f', fontWeight: 600 }}>{sub}</span>}
  </div>
);

// ─── Tab button ───────────────────────────────────────────────────────────────
const TabBtn: React.FC<{ active: boolean; label: string; onClick: () => void }> = ({ active, label, onClick }) => (
  <button
    onClick={onClick}
    style={{
      flex: 1, border: 'none', background: 'transparent',
      padding: '12px 4px', fontSize: 13, fontWeight: active ? 800 : 600,
      color: active ? '#795548' : '#a1887f',
      borderBottom: active ? '3px solid #795548' : '3px solid transparent',
      cursor: 'pointer', fontFamily: 'inherit',
      transition: 'all 0.2s', whiteSpace: 'nowrap',
      minHeight: 48,
    }}
  >
    {label}
  </button>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export const DettaglioRicettaScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const ricette = useRicettarioStore(s => s.ricette);
  const categorie = useRicettarioStore(s => s.categorie);
  const eliminaRicetta = useRicettarioStore(s => s.eliminaRicetta);
  const togglePreferita = useRicettarioStore(s => s.togglePreferita);
  const aggiungiRicetta = useRicettarioStore(s => s.aggiungiRicetta);

  // ── State ─────────────────────────────────────────────────────────────────
  const [fotoIdx, setFotoIdx] = useState(0);
  const [pezziTarget, setPezziTarget] = useState<number | null>(null); // null = usa resa originale
  const [tabAttiva, setTabAttiva] = useState(0);
  const [ingredientiCheckbox, setIngredientiCheckbox] = useState<boolean[]>([]);
  const [stepsCheckbox, setStepsCheckbox] = useState<boolean[]>([]);
  const [timerStep, setTimerStep] = useState<StepPreparazione | null>(null);
  const [marginePercent, setMarginePercent] = useState(60);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showCondividi, setShowCondividi] = useState(false);
  const [modalitaLaboratorio, setModalitaLaboratorio] = useState(false);
  const [wakeLock, setWakeLock] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const touchStartX = useRef<number>(0);
  const pezziInputRef = useRef<HTMLInputElement>(null);

  const ricetta = ricette.find(r => r.id === id);

  // Inizializza checkbox quando la ricetta è disponibile
  React.useEffect(() => {
    if (ricetta) {
      setIngredientiCheckbox(new Array(ricetta.ingredienti.length).fill(false));
      setStepsCheckbox(new Array(ricetta.steps.length).fill(false));
      setPezziTarget(ricetta.resa);
    }
  }, [ricetta?.id]);

  const handleWakeLock = useCallback(async () => {
    if (!wakeLock) {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
          setWakeLock(true);
        }
      } catch { setWakeLock(false); }
    } else {
      wakeLockRef.current?.release();
      wakeLockRef.current = null;
      setWakeLock(false);
    }
  }, [wakeLock]);

  if (!ricetta) {
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🍪</div>
        <p style={{ fontSize: 18, color: '#6D4C41', fontWeight: 700, marginBottom: 24 }}>
          Ricetta non trovata.
        </p>
        <button onClick={() => navigate('/ricette')} style={btnPrimary}>
          ← Torna alle ricette
        </button>
      </div>
    );
  }

  const cat = categorie.find(c => c.id === ricetta.categoria);
  const catNome = cat?.nome ?? 'Altro';
  const pezziBase = ricetta.resa;
  const pezziEffettivi = pezziTarget ?? pezziBase;
  const moltiplicatore = pezziBase > 0 ? pezziEffettivi / pezziBase : 1;
  const isScalata = Math.abs(moltiplicatore - 1) > 0.01;

  // Calcolo costi
  const ingredientiConCosto = ricetta.ingredienti.filter(i => i.costoAlKg);
  const costoTotaleBase = ricetta.ingredienti.reduce((s, i) => s + costoIngrediente(i), 0);
  const costoTotaleScalato = costoTotaleBase * moltiplicatore;
  const costoPezzoBase = pezziBase > 0 ? costoTotaleBase / pezziBase : 0;
  const prezzoVendita = costoPezzoBase * (1 + marginePercent / 100);

  // Swipe foto
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50 && ricetta.foto.length > 1) {
      if (dx < 0) setFotoIdx(i => Math.min(i + 1, ricetta.foto.length - 1));
      else setFotoIdx(i => Math.max(i - 1, 0));
    }
  };

  const handleElimina = () => {
    eliminaRicetta(ricetta.id);
    navigate('/ricette');
  };

  const handleDuplica = () => {
    const { id: _id, dataCreazione: _dc, dataModifica: _dm, ...resto } = ricetta;
    const nuova = aggiungiRicetta({ ...resto, nome: `${ricetta.nome} (copia)`, preferita: false });
    setShowMenu(false);
    navigate(`/ricetta/${nuova.id}`);
  };

  const toggleIngrediente = (i: number) => {
    setIngredientiCheckbox(prev => prev.map((v, idx) => idx === i ? !v : v));
  };

  const toggleStep = (i: number) => {
    setStepsCheckbox(prev => prev.map((v, idx) => idx === i ? !v : v));
  };

  const ingredientiPreparati = ingredientiCheckbox.filter(Boolean).length;
  const stepsCompletati = stepsCheckbox.filter(Boolean).length;
  const stepCorrenteIdx = stepsCheckbox.findIndex(v => !v);

  const fontScale = modalitaLaboratorio ? 1.3 : 1;

  // ─── Sezione foto header ────────────────────────────────────────────────
  const hasFoto = ricetta.foto.length > 0;

  return (
    <div style={{
      maxWidth: 800, margin: '0 auto', paddingBottom: 100,
      fontSize: `${fontScale}rem`,
      transition: 'font-size 0.3s',
    }}>

      {/* ── HERO HEADER ───────────────────────────────────────────────────── */}
      <div
        style={{ position: 'relative', height: hasFoto ? 300 : 200, overflow: 'hidden' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Immagine o placeholder */}
        {hasFoto ? (
          <img
            src={ricetta.foto[fotoIdx]}
            alt={ricetta.nome}
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              transition: 'opacity 0.3s',
            }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: 'linear-gradient(135deg, #4b2c20 0%, #795548 50%, #a1887f 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 80, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}>🍪</span>
          </div>
        )}

        {/* Gradiente overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(30,14,7,0.90) 0%, rgba(30,14,7,0.3) 55%, transparent 100%)',
        }} />

        {/* Navigazione foto */}
        {ricetta.foto.length > 1 && (
          <>
            <button
              onClick={() => setFotoIdx(i => Math.max(i - 1, 0))}
              style={{ ...navFotoBtn, left: 60, opacity: fotoIdx === 0 ? 0.3 : 1 }}
              disabled={fotoIdx === 0}
            >
              <ChevronLeft size={20} color="#FFF" />
            </button>
            <button
              onClick={() => setFotoIdx(i => Math.min(i + 1, ricetta.foto.length - 1))}
              style={{ ...navFotoBtn, right: 12, opacity: fotoIdx === ricetta.foto.length - 1 ? 0.3 : 1 }}
              disabled={fotoIdx === ricetta.foto.length - 1}
            >
              <ChevronRight size={20} color="#FFF" />
            </button>
            {/* Dots */}
            <div style={{
              position: 'absolute', bottom: 70, left: 0, right: 0,
              display: 'flex', justifyContent: 'center', gap: 6,
            }}>
              {ricetta.foto.map((_, i) => (
                <div
                  key={i}
                  onClick={() => setFotoIdx(i)}
                  style={{
                    width: i === fotoIdx ? 20 : 8, height: 8, borderRadius: 999,
                    background: i === fotoIdx ? '#FFC107' : 'rgba(255,255,255,0.5)',
                    cursor: 'pointer', transition: 'width 0.3s, background 0.3s',
                  }}
                />
              ))}
            </div>
          </>
        )}

        {/* AppBar row */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 12px 0',
        }}>
          <button onClick={() => navigate(-1)} style={appBarBtn}>
            <ArrowLeft size={20} color="#FFF" />
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            {/* WakeLock indicator */}
            {wakeLock && (
              <div style={{
                background: 'rgba(255,193,7,0.25)', borderRadius: '50%',
                width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Monitor size={18} color="#FFC107" />
              </div>
            )}
            {/* Cuore preferiti */}
            <button onClick={() => togglePreferita(ricetta.id)} style={appBarBtn}>
              <Heart size={20} fill={ricetta.preferita ? '#FFC107' : 'transparent'} color={ricetta.preferita ? '#FFC107' : '#FFF'} />
            </button>
            {/* Menu tre puntini */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowMenu(v => !v)} style={appBarBtn}>
                <MoreVertical size={20} color="#FFF" />
              </button>
              {showMenu && (
                <MenuDropdown
                  ricetta={ricetta}
                  wakeLock={wakeLock}
                  modalitaLab={modalitaLaboratorio}
                  onWakeLock={handleWakeLock}
                  onModalitaLab={() => { setModalitaLaboratorio(v => !v); setShowMenu(false); }}
                  onDuplica={handleDuplica}
                  onCondividi={() => { setShowCondividi(true); setShowMenu(false); }}
                  onElimina={() => { setShowDeleteConfirm(true); setShowMenu(false); }}
                  onClose={() => setShowMenu(false)}
                />
              )}
            </div>
          </div>
        </div>

        {/* Nome e categoria sovrapposti all'immagine */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 16px 16px' }}>
          <div style={{
            display: 'inline-block', fontSize: 11, color: '#FFCC80',
            fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4,
          }}>
            {catNome}
          </div>
          <h1 style={{
            fontSize: `${fontScale * 24}px`, fontWeight: 800, color: '#FFF',
            margin: 0, lineHeight: 1.2,
            textShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}>
            {ricetta.nome}
          </h1>
          {ricetta.descrizione && (
            <p style={{
              fontSize: `${fontScale * 13}px`, color: '#FFECB3',
              margin: '4px 0 0', lineHeight: 1.4,
              display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {ricetta.descrizione}
            </p>
          )}
        </div>
      </div>

      {/* ── INFO RAPIDE ───────────────────────────────────────────────────── */}
      <div style={{
        padding: '16px 16px 0',
        display: 'flex', gap: 8, flexWrap: 'wrap',
        overflowX: 'auto',
      }}>
        <InfoChip emoji="⏱" label={`${ricetta.tempoPrepMinuti} min`} sub="Prep" />
        <InfoChip emoji="🔥" label={`${ricetta.tempoCotturaMinuti} min`} sub="Cottura" />
        <InfoChip emoji="🌡" label={`${ricetta.temperaturaForno}°C`} sub="Forno" accent />
        <InfoChip emoji="🍪" label={`${ricetta.resa} pz`} sub="Resa base" />
        <div style={{
          display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
          background: '#EFEBE9', borderRadius: 12, padding: '8px 14px', minWidth: 72,
        }}>
          <StelleDifficolta livello={ricetta.difficolta} />
          <span style={{ fontSize: 13, fontWeight: 800, color: '#3E2723', marginTop: 2 }}>
            {DIFFICOLTA_LABELS[ricetta.difficolta]}
          </span>
          <span style={{ fontSize: 10, color: '#a1887f', fontWeight: 600 }}>Difficoltà</span>
        </div>
      </div>

      {/* Tags */}
      {ricetta.tags.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '12px 16px 0' }}>
          {ricetta.tags.map(t => (
            <span key={t} style={{
              fontSize: 12, background: '#EFEBE9', color: '#795548',
              padding: '4px 10px', borderRadius: 999, fontWeight: 600,
              display: 'inline-flex', alignItems: 'center', gap: 4,
            }}>
              <Tag size={11} />#{t}
            </span>
          ))}
        </div>
      )}

      {/* ── SCALA DOSI ────────────────────────────────────────────────────── */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{
          background: '#FFF', borderRadius: 20, padding: 20,
          boxShadow: '0 4px 16px rgba(121,85,72,0.12)',
          border: isScalata ? '2px solid #FFC107' : '2px solid transparent',
          transition: 'border-color 0.3s',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: `${fontScale * 16}px`, fontWeight: 700, color: '#3E2723', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Users size={18} /> Quanti pezzi vuoi produrre?
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#a1887f' }}>
                Base: <strong>{pezziBase} pezzi</strong>
              </p>
            </div>
            {isScalata && (
              <button
                onClick={() => setPezziTarget(pezziBase)}
                style={{
                  background: '#FFF8E1', border: '1.5px solid #FFC107',
                  borderRadius: 999, padding: '6px 12px',
                  fontSize: 12, fontWeight: 700, color: '#795548',
                  cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                <RotateCcw size={12} /> Reset
              </button>
            )}
          </div>

          {/* Controllo pezzi */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
            <button
              onClick={() => setPezziTarget(Math.max(1, pezziEffettivi - 10))}
              style={scalaBtnStyle}
            >
              −
            </button>
            <input
              ref={pezziInputRef}
              type="number"
              min={1}
              value={pezziEffettivi}
              onChange={e => {
                const v = parseInt(e.target.value);
                if (!isNaN(v) && v > 0) setPezziTarget(v);
              }}
              style={{
                flex: 1, textAlign: 'center',
                fontSize: `${fontScale * 32}px`, fontWeight: 800,
                color: '#795548', border: '2px solid #EFEBE9',
                borderRadius: 12, padding: '8px 4px',
                fontFamily: 'inherit', outline: 'none',
                background: '#FFF8E1',
              }}
            />
            <button
              onClick={() => setPezziTarget(pezziEffettivi + 10)}
              style={scalaBtnStyle}
            >
              +
            </button>
          </div>

          {/* Moltiplicatore */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: isScalata ? '#FFF8E1' : '#FAFAFA',
            borderRadius: 12, padding: '10px 14px',
            border: isScalata ? '1px solid #FFE082' : '1px solid #EFEBE9',
            transition: 'all 0.3s',
          }}>
            <span style={{ fontSize: 20 }}>{isScalata ? '⚡' : '📏'}</span>
            {isScalata ? (
              <span style={{ fontSize: 14, fontWeight: 700, color: '#795548' }}>
                × {moltiplicatore.toFixed(2).replace(/\.?0+$/, '')} rispetto alla ricetta base
              </span>
            ) : (
              <span style={{ fontSize: 14, fontWeight: 600, color: '#a1887f' }}>
                Dosi originali — modifica il numero per scalare
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── TABS ─────────────────────────────────────────────────────────── */}
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{
          background: '#FFF', borderRadius: '16px 16px 0 0',
          boxShadow: '0 4px 16px rgba(121,85,72,0.10)',
          overflow: 'hidden',
        }}>
          {/* Tab bar */}
          <div style={{
            display: 'flex', borderBottom: '1px solid #EFEBE9',
            overflowX: 'auto',
          }}>
            <TabBtn active={tabAttiva === 0} label="🧂 Ingredienti" onClick={() => setTabAttiva(0)} />
            <TabBtn active={tabAttiva === 1} label="👨‍🍳 Preparazione" onClick={() => setTabAttiva(1)} />
            <TabBtn active={tabAttiva === 2} label="💰 Costi" onClick={() => setTabAttiva(2)} />
            <TabBtn active={tabAttiva === 3} label="📝 Note" onClick={() => setTabAttiva(3)} />
          </div>

          {/* ── TAB 0 – INGREDIENTI ──────────────────────────────────────── */}
          {tabAttiva === 0 && (
            <div style={{ padding: 20 }}>
              {/* Barra progresso */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: '#6D4C41', fontWeight: 600 }}>
                  {ingredientiPreparati} di {ricetta.ingredienti.length} ingredienti preparati
                </span>
                <button
                  onClick={() => setIngredientiCheckbox(new Array(ricetta.ingredienti.length).fill(false))}
                  style={btnTesto}
                >
                  Deseleziona tutto
                </button>
              </div>

              {/* Progress bar */}
              <div style={{
                height: 6, background: '#EFEBE9', borderRadius: 999, marginBottom: 20, overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', borderRadius: 999,
                  background: 'linear-gradient(90deg, #795548, #FFC107)',
                  width: `${ricetta.ingredienti.length > 0 ? (ingredientiPreparati / ricetta.ingredienti.length) * 100 : 0}%`,
                  transition: 'width 0.4s ease',
                }} />
              </div>

              {/* Lista ingredienti */}
              {ricetta.ingredienti.map((ing, i) => {
                const checked = ingredientiCheckbox[i] ?? false;
                return (
                  <div
                    key={i}
                    onClick={() => toggleIngrediente(i)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 0',
                      borderBottom: i < ricetta.ingredienti.length - 1 ? '1px solid #EFEBE9' : 'none',
                      cursor: 'pointer',
                      opacity: checked ? 0.5 : 1,
                      transition: 'opacity 0.2s',
                    }}
                  >
                    {/* Checkbox custom */}
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                      background: checked ? '#795548' : '#EFEBE9',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: `2px solid ${checked ? '#795548' : '#D7CCC8'}`,
                      transition: 'all 0.2s',
                    }}>
                      {checked && <Check size={16} color="#FFF" strokeWidth={3} />}
                    </div>

                    <div style={{ flex: 1 }}>
                      <span style={{
                        fontSize: `${fontScale * 15}px`,
                        color: checked ? '#a1887f' : '#3E2723',
                        fontWeight: 600,
                        textDecoration: checked ? 'line-through' : 'none',
                        transition: 'all 0.2s',
                      }}>
                        {ing.nome}
                      </span>
                      {ing.costoAlKg && (
                        <span style={{ fontSize: 11, color: '#a1887f', marginLeft: 6 }}>
                          €{ing.costoAlKg}/kg
                        </span>
                      )}
                    </div>

                    {/* Quantità */}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontSize: `${fontScale * 17}px`, fontWeight: 800,
                        color: isScalata ? '#795548' : '#3E2723',
                      }}>
                        {formattaQuantitaScalata(ing, moltiplicatore)}
                      </div>
                      {isScalata && (
                        <div style={{ fontSize: 11, color: '#a1887f' }}>
                          base: {formattaQuantitaOriginale(ing)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── TAB 1 – PREPARAZIONE ─────────────────────────────────────── */}
          {tabAttiva === 1 && (
            <div style={{ padding: 20 }}>
              {/* Progresso steps */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: '#6D4C41', fontWeight: 600 }}>
                  {stepsCompletati} di {ricetta.steps.length} step completati
                </span>
                <button
                  onClick={() => setStepsCheckbox(new Array(ricetta.steps.length).fill(false))}
                  style={btnTesto}
                >
                  Ricomincia
                </button>
              </div>
              <div style={{ height: 6, background: '#EFEBE9', borderRadius: 999, marginBottom: 20, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 999,
                  background: 'linear-gradient(90deg, #795548, #FFC107)',
                  width: `${ricetta.steps.length > 0 ? (stepsCompletati / ricetta.steps.length) * 100 : 0}%`,
                  transition: 'width 0.4s ease',
                }} />
              </div>

              {/* Steps */}
              {ricetta.steps.map((step, i) => {
                const checked = stepsCheckbox[i] ?? false;
                const isCurrent = !checked && i === stepCorrenteIdx;
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex', gap: 16, marginBottom: 20,
                      opacity: checked ? 0.5 : 1, transition: 'opacity 0.3s',
                    }}
                  >
                    {/* Numero step */}
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                      background: checked
                        ? '#4CAF50'
                        : isCurrent
                          ? 'linear-gradient(135deg, #795548, #FFC107)'
                          : '#EFEBE9',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      boxShadow: isCurrent ? '0 4px 12px rgba(121,85,72,0.3)' : 'none',
                    }}
                      onClick={() => toggleStep(i)}
                    >
                      {checked
                        ? <Check size={20} color="#FFF" strokeWidth={3} />
                        : <span style={{
                            fontSize: 15, fontWeight: 800,
                            color: isCurrent ? '#FFF' : '#6D4C41',
                          }}>{step.numero}</span>
                      }
                    </div>

                    {/* Contenuto */}
                    <div style={{
                      flex: 1,
                      background: isCurrent ? '#FFF8E1' : 'transparent',
                      borderRadius: 14,
                      padding: isCurrent ? '14px 16px' : '8px 0',
                      border: isCurrent ? '1.5px solid #FFE082' : 'none',
                      transition: 'all 0.3s',
                    }}>
                      {isCurrent && (
                        <span style={{
                          fontSize: 11, fontWeight: 700, color: '#FFC107',
                          textTransform: 'uppercase', letterSpacing: 0.5,
                          display: 'block', marginBottom: 4,
                        }}>
                          ▶ Step corrente
                        </span>
                      )}
                      <p style={{
                        fontSize: `${fontScale * 15}px`, color: '#3E2723',
                        margin: '0 0 8px', lineHeight: 1.5, fontWeight: isCurrent ? 600 : 400,
                      }}>
                        {step.descrizione}
                      </p>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {step.durataMinuti && (
                          <>
                            <span style={{
                              fontSize: 12, color: '#795548', fontWeight: 700,
                              background: '#EFEBE9', padding: '3px 10px', borderRadius: 999,
                            }}>
                              ⏱ {step.durataMinuti} min
                            </span>
                            <button
                              onClick={() => setTimerStep(step)}
                              style={{
                                fontSize: 12, color: '#FFF', fontWeight: 700,
                                background: '#795548', padding: '3px 12px', borderRadius: 999,
                                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                minHeight: 28,
                              }}
                            >
                              <Play size={10} fill="#FFF" /> Avvia Timer
                            </button>
                          </>
                        )}
                        {step.temperaturaC && (
                          <span style={{
                            fontSize: 12, color: '#F44336', fontWeight: 700,
                            background: '#FFEBEE', padding: '3px 10px', borderRadius: 999,
                          }}>
                            🌡 {step.temperaturaC}°C
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── TAB 2 – COSTI ────────────────────────────────────────────── */}
          {tabAttiva === 2 && (
            <div style={{ padding: 20 }}>
              {costoTotaleBase === 0 && ingredientiConCosto.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>💰</div>
                  <p style={{ fontSize: 15, color: '#6D4C41', fontWeight: 600 }}>
                    Nessun costo inserito
                  </p>
                  <p style={{ fontSize: 13, color: '#a1887f' }}>
                    Modifica la ricetta per aggiungere i costi degli ingredienti.
                  </p>
                </div>
              ) : (
                <>
                  {/* Avviso ingredienti senza prezzo */}
                  {ricetta.ingredienti.length - ingredientiConCosto.length > 0 && (
                    <div style={{
                      background: '#FFF8E1', border: '1.5px solid #FFE082',
                      borderRadius: 12, padding: '10px 14px', marginBottom: 16,
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                      <span style={{ fontSize: 18 }}>⚠️</span>
                      <p style={{ margin: 0, fontSize: 13, color: '#795548', fontWeight: 600 }}>
                        {ricetta.ingredienti.length - ingredientiConCosto.length} ingredienti senza prezzo — calcolo parziale
                      </p>
                    </div>
                  )}

                  {/* Tabella ingredienti */}
                  <div style={{
                    border: '1px solid #EFEBE9', borderRadius: 12, overflow: 'hidden', marginBottom: 20,
                  }}>
                    {/* Header tabella */}
                    <div style={{
                      display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px',
                      background: '#EFEBE9', padding: '10px 14px',
                      fontSize: 11, fontWeight: 700, color: '#6D4C41', textTransform: 'uppercase',
                    }}>
                      <span>Ingrediente</span>
                      <span style={{ textAlign: 'right' }}>Qtà</span>
                      <span style={{ textAlign: 'right' }}>€/kg</span>
                      <span style={{ textAlign: 'right' }}>Totale</span>
                    </div>
                    {ricetta.ingredienti.map((ing, i) => {
                      const costo = costoIngrediente(ing) * moltiplicatore;
                      return (
                        <div key={i} style={{
                          display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px',
                          padding: '12px 14px',
                          borderTop: '1px solid #EFEBE9',
                          background: i % 2 === 0 ? '#FFF' : '#FAFAFA',
                          fontSize: `${fontScale * 13}px`,
                        }}>
                          <span style={{ color: '#3E2723', fontWeight: 600 }}>{ing.nome}</span>
                          <span style={{ textAlign: 'right', color: '#6D4C41' }}>
                            {formattaQuantitaScalata(ing, moltiplicatore)}
                          </span>
                          <span style={{ textAlign: 'right', color: '#a1887f' }}>
                            {ing.costoAlKg ? `€${ing.costoAlKg.toFixed(2)}` : '—'}
                          </span>
                          <span style={{
                            textAlign: 'right', fontWeight: 700,
                            color: costo > 0 ? '#795548' : '#D7CCC8',
                          }}>
                            {costo > 0 ? `€${costo.toFixed(2)}` : '—'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Riepilogo costi */}
                  <div style={{
                    background: '#FFF8E1', border: '2px solid #FFC107',
                    borderRadius: 16, padding: 18, marginBottom: 20,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 14, color: '#6D4C41' }}>
                        Costo materie prime ({pezziEffettivi} pz):
                      </span>
                      <span style={{ fontSize: 15, fontWeight: 800, color: '#3E2723' }}>
                        €{costoTotaleScalato.toFixed(2)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid #FFE082' }}>
                      <span style={{ fontSize: 14, color: '#6D4C41' }}>Costo per pezzo:</span>
                      <span style={{ fontSize: 16, fontWeight: 800, color: '#795548' }}>
                        €{costoPezzoBase.toFixed(3)}
                      </span>
                    </div>
                  </div>

                  {/* Slider margine */}
                  <div style={{
                    background: '#FFF', border: '1px solid #EFEBE9',
                    borderRadius: 16, padding: 18,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#3E2723' }}>
                        Margine commerciale
                      </span>
                      <span style={{
                        fontSize: 16, fontWeight: 800, color: '#FFC107',
                        background: '#3E2723', padding: '4px 12px', borderRadius: 999,
                      }}>
                        {marginePercent}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0} max={200} step={5}
                      value={marginePercent}
                      onChange={e => setMarginePercent(Number(e.target.value))}
                      style={{
                        width: '100%', height: 6, accentColor: '#795548',
                        cursor: 'pointer',
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#a1887f', marginTop: 4 }}>
                      <span>0%</span><span>50%</span><span>100%</span><span>150%</span><span>200%</span>
                    </div>

                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      marginTop: 18, paddingTop: 14, borderTop: '1px solid #EFEBE9',
                    }}>
                      <div>
                        <p style={{ margin: 0, fontSize: 13, color: '#6D4C41' }}>Prezzo vendita suggerito</p>
                        <p style={{ margin: '2px 0 0', fontSize: 11, color: '#a1887f' }}>
                          (costo {`€${costoPezzoBase.toFixed(3)}`} + {marginePercent}% margine)
                        </p>
                      </div>
                      <span style={{
                        fontSize: 22, fontWeight: 900, color: '#FFF',
                        background: 'linear-gradient(135deg, #795548, #4b2c20)',
                        padding: '8px 16px', borderRadius: 12,
                      }}>
                        €{prezzoVendita.toFixed(2)}/pz
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── TAB 3 – NOTE ─────────────────────────────────────────────── */}
          {tabAttiva === 3 && (
            <div style={{ padding: 20 }}>
              {/* Note */}
              {ricetta.note ? (
                <div style={{
                  background: '#FFF8E1', border: '1px solid #FFE082',
                  borderRadius: 14, padding: 16, marginBottom: 20,
                }}>
                  <p style={{ margin: 0, fontSize: `${fontScale * 15}px`, color: '#3E2723', lineHeight: 1.7 }}>
                    {ricetta.note}
                  </p>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 0', marginBottom: 20 }}>
                  <p style={{ fontSize: 14, color: '#a1887f' }}>Nessuna nota per questa ricetta.</p>
                </div>
              )}

              {/* Tags */}
              {ricetta.tags.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#a1887f', textTransform: 'uppercase', marginBottom: 8 }}>
                    Tags
                  </p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {ricetta.tags.map(t => (
                      <span key={t} style={{
                        background: '#795548', color: '#FFF',
                        fontSize: 13, fontWeight: 700,
                        padding: '5px 14px', borderRadius: 999,
                      }}>
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Date */}
              <div style={{
                background: '#EFEBE9', borderRadius: 12, padding: '14px 16px',
                display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: '#6D4C41' }}>📅 Data creazione</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#3E2723' }}>
                    {new Date(ricetta.dataCreazione).toLocaleDateString('it-IT', {
                      day: '2-digit', month: 'long', year: 'numeric',
                    })}
                  </span>
                </div>
                <div style={{ height: 1, background: '#D7CCC8' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: '#6D4C41' }}>✏️ Ultima modifica</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#3E2723' }}>
                    {new Date(ricetta.dataModifica).toLocaleDateString('it-IT', {
                      day: '2-digit', month: 'long', year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── FAB MODIFICA ──────────────────────────────────────────────────── */}
      <button
        onClick={() => navigate(`/modifica/${ricetta.id}`, { state: { fromDettaglio: true } })}
        style={{
          position: 'fixed', bottom: 90, right: 20,
          width: 60, height: 60, borderRadius: '50%',
          background: 'linear-gradient(135deg, #FFC107, #FF8F00)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 6px 20px rgba(255,193,7,0.5)',
          zIndex: 100,
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
        }}
      >
        <Edit2 size={24} color="#3E2723" />
      </button>

      {/* ── TIMER BOTTOM SHEET ────────────────────────────────────────────── */}
      {timerStep && (
        <TimerBottomSheet
          durataMinuti={timerStep.durataMinuti!}
          nomeStep={`Step ${timerStep.numero}: ${timerStep.descrizione.substring(0, 40)}${timerStep.descrizione.length > 40 ? '...' : ''}`}
          onClose={() => setTimerStep(null)}
        />
      )}

      {/* ── MODALE CONDIVIDI ──────────────────────────────────────────────── */}
      {showCondividi && (
        <CondividiModal
          ricetta={ricetta}
          categoriaNome={catNome}
          onClose={() => setShowCondividi(false)}
        />
      )}

      {/* ── CONFERMA ELIMINAZIONE ─────────────────────────────────────────── */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000, padding: 20,
        }}>
          <div style={{
            background: '#FFF', borderRadius: 20, padding: 28,
            maxWidth: 380, width: '100%',
            boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
            animation: 'popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            <div style={{ fontSize: 48, textAlign: 'center', marginBottom: 12 }}>🗑️</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#3E2723', margin: '0 0 10px', textAlign: 'center' }}>
              Elimina ricetta?
            </h3>
            <p style={{ fontSize: 15, color: '#6D4C41', margin: '0 0 24px', textAlign: 'center', lineHeight: 1.5 }}>
              Sei sicuro di voler eliminare<br />
              <strong>"{ricetta.nome}"</strong>?<br />
              <span style={{ fontSize: 13, color: '#a1887f' }}>L'operazione non è reversibile.</span>
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  flex: 1, background: '#EFEBE9', border: 'none', borderRadius: 12,
                  padding: '14px', fontSize: 15, fontWeight: 700,
                  fontFamily: 'inherit', cursor: 'pointer', minHeight: 48,
                }}
              >
                Annulla
              </button>
              <button
                onClick={handleElimina}
                style={{
                  flex: 1, background: '#c62828', color: '#FFF', border: 'none', borderRadius: 12,
                  padding: '14px', fontSize: 15, fontWeight: 700,
                  fontFamily: 'inherit', cursor: 'pointer', minHeight: 48,
                }}
              >
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes popIn {
          from { transform: scale(0.85); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

// ─── Menu dropdown ────────────────────────────────────────────────────────────
const MenuDropdown: React.FC<{
  ricetta: import('../models/types').Ricetta;
  wakeLock: boolean;
  modalitaLab: boolean;
  onWakeLock: () => void;
  onModalitaLab: () => void;
  onDuplica: () => void;
  onCondividi: () => void;
  onElimina: () => void;
  onClose: () => void;
}> = ({ wakeLock, modalitaLab, onWakeLock, onModalitaLab, onDuplica, onCondividi, onElimina, onClose }) => {
  const items = [
    {
      icon: <Monitor size={17} />,
      label: `Schermo sempre acceso: ${wakeLock ? 'ON ✅' : 'OFF'}`,
      onClick: () => { onWakeLock(); onClose(); },
      color: wakeLock ? '#4CAF50' : '#3E2723',
    },
    {
      icon: <ZoomIn size={17} />,
      label: `Modalità Laboratorio: ${modalitaLab ? 'ON ✅' : 'OFF'}`,
      onClick: onModalitaLab,
      color: modalitaLab ? '#FFC107' : '#3E2723',
    },
    { divider: true },
    {
      icon: <Copy size={17} />,
      label: 'Duplica ricetta',
      onClick: onDuplica,
      color: '#3E2723',
    },
    {
      icon: <Share2 size={17} />,
      label: 'Condividi ricetta',
      onClick: onCondividi,
      color: '#3E2723',
    },
    { divider: true },
    {
      icon: <Trash2 size={17} />,
      label: 'Elimina ricetta',
      onClick: () => { onElimina(); onClose(); },
      color: '#c62828',
    },
  ];

  return (
    <>
      {/* Overlay invisibile per chiudere */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 998 }}
        onClick={onClose}
      />
      <div style={{
        position: 'absolute', top: 50, right: 0,
        background: '#FFF', borderRadius: 16,
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        minWidth: 240, overflow: 'hidden',
        zIndex: 999,
        animation: 'popIn 0.2s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        {items.map((item, i) =>
          'divider' in item ? (
            <div key={i} style={{ height: 1, background: '#EFEBE9', margin: '4px 0' }} />
          ) : (
            <button
              key={i}
              onClick={item.onClick}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                width: '100%', padding: '14px 18px',
                background: 'transparent', border: 'none',
                fontSize: 14, fontWeight: 600, color: item.color,
                cursor: 'pointer', fontFamily: 'inherit',
                textAlign: 'left',
                minHeight: 48,
              }}
              onMouseEnter={e => { (e.currentTarget).style.background = '#FFF8E1'; }}
              onMouseLeave={e => { (e.currentTarget).style.background = 'transparent'; }}
            >
              <span style={{ color: item.color }}>{item.icon}</span>
              {item.label}
            </button>
          )
        )}
      </div>
    </>
  );
};

// ─── Stili base ───────────────────────────────────────────────────────────────
const appBarBtn: React.CSSProperties = {
  background: 'rgba(0,0,0,0.35)', border: 'none', borderRadius: '50%',
  width: 44, height: 44, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  backdropFilter: 'blur(8px)',
};

const navFotoBtn: React.CSSProperties = {
  position: 'absolute', top: '50%', transform: 'translateY(-50%)',
  background: 'rgba(0,0,0,0.35)', border: 'none', borderRadius: '50%',
  width: 40, height: 40, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  backdropFilter: 'blur(8px)',
};

const scalaBtnStyle: React.CSSProperties = {
  width: 56, height: 56, borderRadius: '50%',
  background: '#EFEBE9', border: '2px solid #D7CCC8',
  fontSize: 28, fontWeight: 700, color: '#795548',
  cursor: 'pointer', fontFamily: 'inherit',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0,
};

const btnTesto: React.CSSProperties = {
  background: 'transparent', border: 'none',
  fontSize: 13, fontWeight: 700, color: '#795548',
  cursor: 'pointer', fontFamily: 'inherit', padding: '4px 8px',
};

const btnPrimary: React.CSSProperties = {
  background: '#795548', color: '#FFF', border: 'none', borderRadius: 12,
  padding: '14px 28px', fontSize: 15, fontWeight: 700,
  fontFamily: 'inherit', cursor: 'pointer', marginTop: 8,
  minHeight: 48,
};
