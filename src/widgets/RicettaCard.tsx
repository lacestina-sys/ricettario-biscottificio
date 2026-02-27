import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Clock, ChefHat, Flame, Star, Trash2, AlertTriangle } from 'lucide-react';
import type { Ricetta, Categoria } from '../models/types';
import { useRicettarioStore } from '../providers/store';
import { DIFFICOLTA_LABELS, DIFFICOLTA_COLORS, COLORS } from '../config/constants';

// ── Stelle difficoltà ──────────────────────────────────────────────────────
const DifficoltaStars: React.FC<{ d: Ricetta['difficolta'] }> = ({ d }) => {
  const n = d === 'facile' ? 1 : d === 'media' ? 2 : 3;
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {[1, 2, 3].map(i => (
        <Star
          key={i}
          size={12}
          fill={i <= n ? DIFFICOLTA_COLORS[d] : 'transparent'}
          color={i <= n ? DIFFICOLTA_COLORS[d] : '#D7CCC8'}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
};

// ── Dialog conferma eliminazione ───────────────────────────────────────────
const DeleteDialog: React.FC<{
  nome: string;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ nome, onConfirm, onCancel }) => (
  <>
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 500,
        backdropFilter: 'blur(2px)',
      }}
    />
    <div style={{
      position: 'fixed',
      top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      background: '#FFF8E1',
      borderRadius: 20,
      padding: '28px 24px',
      zIndex: 501,
      width: 'min(340px, 90vw)',
      boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
      animation: 'popIn 0.2s ease-out',
    }}>
      <style>{`
        @keyframes popIn {
          from { transform: translate(-50%, -50%) scale(0.85); opacity: 0; }
          to   { transform: translate(-50%, -50%) scale(1);    opacity: 1; }
        }
      `}</style>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{
          width: 60, height: 60, borderRadius: '50%',
          background: '#FFEBEE',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <AlertTriangle size={28} color="#F44336" />
        </div>
        <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: '#3E2723' }}>
          Elimina ricetta
        </h3>
        <p style={{ margin: 0, fontSize: 14, color: '#6D4C41', lineHeight: 1.5 }}>
          Sei sicuro di voler eliminare <strong>"{nome}"</strong>?
          <br />L'operazione non è reversibile.
        </p>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={onCancel}
          style={{
            flex: 1, padding: '13px', border: '2px solid #D7CCC8',
            borderRadius: 12, background: 'transparent', color: '#6D4C41',
            fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
            minHeight: 50,
          }}
        >
          Annulla
        </button>
        <button
          onClick={onConfirm}
          style={{
            flex: 1, padding: '13px', border: 'none',
            borderRadius: 12, background: '#F44336', color: '#FFFFFF',
            fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
            minHeight: 50,
            boxShadow: '0 4px 12px rgba(244,67,54,0.35)',
          }}
        >
          Elimina
        </button>
      </div>
    </div>
  </>
);

// ── Placeholder immagine biscotto ─────────────────────────────────────────
const BiscottoPlaceholder: React.FC<{ size?: number }> = ({ size = 60 }) => (
  <div style={{
    width: '100%', height: '100%',
    background: 'linear-gradient(135deg, #EFEBE9 0%, #D7CCC8 100%)',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: 4,
  }}>
    <span style={{ fontSize: size, lineHeight: 1 }}>🍪</span>
  </div>
);

// ── InfoChip ─────────────────────────────────────────────────────────────
const InfoChip: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <span style={{
    display: 'flex', alignItems: 'center', gap: 3,
    fontSize: 12, color: '#6D4C41', fontWeight: 600,
  }}>
    {icon}{label}
  </span>
);

// ═══════════════════════════════════════════════════════════════════════════
// CARD ORIZZONTALE (lista su telefono)
// ═══════════════════════════════════════════════════════════════════════════

interface CardProps {
  ricetta: Ricetta;
  categorie: Categoria[];
  compact?: boolean;   // Card piccola per scroll orizzontale (home)
  vertical?: boolean;  // Variante verticale (griglia tablet)
}

export const RicettaCard: React.FC<CardProps> = ({
  ricetta,
  categorie,
  compact = false,
  vertical = false,
}) => {
  if (vertical) return <RicettaCardVerticale ricetta={ricetta} categorie={categorie} />;
  if (compact)  return <RicettaCardCompact   ricetta={ricetta} categorie={categorie} />;
  return              <RicettaCardOrizzontale ricetta={ricetta} categorie={categorie} />;
};

// ── Card Orizzontale completa (lista telefono) ────────────────────────────
const RicettaCardOrizzontale: React.FC<{ ricetta: Ricetta; categorie: Categoria[] }> = ({
  ricetta, categorie,
}) => {
  const navigate = useNavigate();
  const togglePreferita = useRicettarioStore(s => s.togglePreferita);
  const eliminaRicetta  = useRicettarioStore(s => s.eliminaRicetta);
  const cat = categorie.find(c => c.id === ricetta.categoria);

  // Swipe
  const touchStartX = useRef<number>(0);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [showDelete, setShowDelete] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  const SWIPE_THRESHOLD = 80;

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartX.current;
    if (dx < 0) setSwipeOffset(Math.max(dx, -120));
  };
  const onTouchEnd = () => {
    if (swipeOffset < -SWIPE_THRESHOLD) {
      setSwipeOffset(-80);
      setShowDelete(true);
    } else {
      setSwipeOffset(0);
      setShowDelete(false);
    }
  };
  const resetSwipe = () => { setSwipeOffset(0); setShowDelete(false); };

  return (
    <>
      {showDialog && (
        <DeleteDialog
          nome={ricetta.nome}
          onConfirm={() => { setShowDialog(false); eliminaRicetta(ricetta.id); }}
          onCancel={() => { setShowDialog(false); resetSwipe(); }}
        />
      )}

      {/* Contenitore swipe */}
      <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden' }}>

        {/* Sfondo rosso "Elimina" */}
        <div style={{
          position: 'absolute', right: 0, top: 0, bottom: 0,
          width: 80,
          background: '#F44336',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: '0 16px 16px 0',
          opacity: showDelete ? 1 : 0,
          transition: 'opacity 0.15s',
        }}>
          <button
            onClick={() => setShowDialog(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FFF', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
          >
            <Trash2 size={22} />
            <span style={{ fontSize: 11, fontWeight: 700 }}>Elimina</span>
          </button>
        </div>

        {/* Card principale */}
        <div
          onClick={() => { if (swipeOffset === 0) navigate(`/ricetta/${ricetta.id}`); else resetSwipe(); }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{
            background: '#FFFFFF',
            borderRadius: 16,
            boxShadow: '0 2px 10px rgba(121,85,72,0.12)',
            cursor: 'pointer',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'row',
            transform: `translateX(${swipeOffset}px)`,
            transition: swipeOffset === 0 || swipeOffset === -80 ? 'transform 0.2s ease' : 'none',
            minHeight: 110,
          }}
          onMouseEnter={e => { if (swipeOffset === 0) (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 20px rgba(121,85,72,0.20)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 10px rgba(121,85,72,0.12)'; }}
        >
          {/* Immagine/placeholder */}
          <div style={{ width: 100, flexShrink: 0, overflow: 'hidden', position: 'relative' }}>
            {ricetta.foto.length > 0 ? (
              <img
                src={ricetta.foto[0]}
                alt={ricetta.nome}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <BiscottoPlaceholder size={40} />
            )}
            {/* Badge categoria */}
            <div style={{
              position: 'absolute', bottom: 6, left: 6,
              background: COLORS.primary,
              borderRadius: 999,
              padding: '2px 7px',
              fontSize: 9,
              fontWeight: 700,
              color: '#FFF',
              letterSpacing: 0.3,
            }}>
              {cat?.nome ?? 'Altro'}
            </div>
          </div>

          {/* Contenuto */}
          <div style={{ flex: 1, padding: '12px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#3E2723', lineHeight: 1.3 }}>
                {ricetta.nome}
              </h3>
              <button
                onClick={e => { e.stopPropagation(); togglePreferita(ricetta.id); }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '2px', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  minWidth: 32, minHeight: 32,
                }}
              >
                <Heart
                  size={18}
                  fill={ricetta.preferita ? '#FFC107' : 'transparent'}
                  color={ricetta.preferita ? '#FFC107' : '#D7CCC8'}
                />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <InfoChip icon={<Clock size={12} />} label={`${ricetta.tempoPrepMinuti + ricetta.tempoCotturaMinuti} min`} />
              <InfoChip icon={<Flame size={12} />} label={`${ricetta.temperaturaForno}°C`} />
              <InfoChip icon={<ChefHat size={12} />} label={`${ricetta.resa} pz`} />
              <DifficoltaStars d={ricetta.difficolta} />
            </div>

            {ricetta.tags.length > 0 && (
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {ricetta.tags.slice(0, 3).map(t => (
                  <span key={t} style={{
                    fontSize: 10, background: '#EFEBE9', color: '#795548',
                    padding: '2px 7px', borderRadius: 999, fontWeight: 700,
                  }}>#{t}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// ── Card Verticale (griglia tablet 2 colonne) ─────────────────────────────
const RicettaCardVerticale: React.FC<{ ricetta: Ricetta; categorie: Categoria[] }> = ({
  ricetta, categorie,
}) => {
  const navigate = useNavigate();
  const togglePreferita = useRicettarioStore(s => s.togglePreferita);
  const eliminaRicetta  = useRicettarioStore(s => s.eliminaRicetta);
  const cat = categorie.find(c => c.id === ricetta.categoria);
  const [showDialog, setShowDialog] = useState(false);
  const [hover, setHover] = useState(false);

  return (
    <>
      {showDialog && (
        <DeleteDialog
          nome={ricetta.nome}
          onConfirm={() => { setShowDialog(false); eliminaRicetta(ricetta.id); }}
          onCancel={() => setShowDialog(false)}
        />
      )}

      <div
        onClick={() => navigate(`/ricetta/${ricetta.id}`)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          background: '#FFFFFF',
          borderRadius: 20,
          boxShadow: hover ? '0 8px 28px rgba(121,85,72,0.22)' : '0 2px 10px rgba(121,85,72,0.12)',
          cursor: 'pointer',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          transform: hover ? 'translateY(-3px)' : 'translateY(0)',
          transition: 'box-shadow 0.2s, transform 0.2s',
        }}
      >
        {/* Immagine */}
        <div style={{ height: 160, position: 'relative', overflow: 'hidden' }}>
          {ricetta.foto.length > 0 ? (
            <img
              src={ricetta.foto[0]}
              alt={ricetta.nome}
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: hover ? 'scale(1.05)' : 'scale(1)', transition: 'transform 0.3s' }}
            />
          ) : (
            <BiscottoPlaceholder size={56} />
          )}
          {/* Overlay top: cuore + elimina */}
          <div style={{
            position: 'absolute', top: 10, left: 10, right: 10,
            display: 'flex', justifyContent: 'space-between',
          }}>
            <span style={{
              background: COLORS.primary,
              color: '#FFF',
              fontSize: 10,
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 999,
              letterSpacing: 0.3,
            }}>
              {cat?.nome ?? 'Altro'}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <IconBtn
                onClick={e => { e.stopPropagation(); togglePreferita(ricetta.id); }}
                active={ricetta.preferita}
                color={ricetta.preferita ? '#FFC107' : undefined}
              >
                <Heart size={16} fill={ricetta.preferita ? '#FFC107' : 'transparent'} color={ricetta.preferita ? '#FFC107' : '#6D4C41'} />
              </IconBtn>
              <IconBtn onClick={e => { e.stopPropagation(); setShowDialog(true); }}>
                <Trash2 size={14} color="#F44336" />
              </IconBtn>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#3E2723', lineHeight: 1.3 }}>
            {ricetta.nome}
          </h3>
          {ricetta.descrizione && (
            <p style={{
              margin: 0, fontSize: 12, color: '#6D4C41', lineHeight: 1.5,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {ricetta.descrizione}
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <InfoChip icon={<Clock size={12} />} label={`${ricetta.tempoPrepMinuti + ricetta.tempoCotturaMinuti} min`} />
            <InfoChip icon={<Flame size={12} />} label={`${ricetta.temperaturaForno}°C`} />
            <InfoChip icon={<ChefHat size={12} />} label={`${ricetta.resa} pz`} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <DifficoltaStars d={ricetta.difficolta} />
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: DIFFICOLTA_COLORS[ricetta.difficolta],
              background: `${DIFFICOLTA_COLORS[ricetta.difficolta]}18`,
              padding: '3px 9px', borderRadius: 999,
            }}>
              {DIFFICOLTA_LABELS[ricetta.difficolta]}
            </span>
          </div>
          {ricetta.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {ricetta.tags.slice(0, 3).map(t => (
                <span key={t} style={{
                  fontSize: 10, background: '#EFEBE9', color: '#795548',
                  padding: '2px 8px', borderRadius: 999, fontWeight: 700,
                }}>#{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// ── Card Compact (scroll orizzontale home) ────────────────────────────────
const RicettaCardCompact: React.FC<{ ricetta: Ricetta; categorie: Categoria[] }> = ({
  ricetta, categorie,
}) => {
  const navigate = useNavigate();
  const togglePreferita = useRicettarioStore(s => s.togglePreferita);
  const cat = categorie.find(c => c.id === ricetta.categoria);
  const [hover, setHover] = useState(false);

  return (
    <div
      onClick={() => navigate(`/ricetta/${ricetta.id}`)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: '#FFFFFF',
        borderRadius: 16,
        boxShadow: hover ? '0 6px 20px rgba(121,85,72,0.20)' : '0 2px 8px rgba(121,85,72,0.12)',
        cursor: 'pointer',
        overflow: 'hidden',
        width: 160,
        flexShrink: 0,
        transform: hover ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'all 0.18s',
      }}
    >
      {/* Immagine */}
      <div style={{ height: 100, position: 'relative', overflow: 'hidden' }}>
        {ricetta.foto.length > 0 ? (
          <img src={ricetta.foto[0]} alt={ricetta.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <BiscottoPlaceholder size={36} />
        )}
        <button
          onClick={e => { e.stopPropagation(); togglePreferita(ricetta.id); }}
          style={{
            position: 'absolute', top: 6, right: 6,
            background: 'rgba(255,255,255,0.85)',
            border: 'none', borderRadius: '50%',
            width: 30, height: 30,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', backdropFilter: 'blur(4px)',
          }}
        >
          <Heart size={14} fill={ricetta.preferita ? '#FFC107' : 'transparent'} color={ricetta.preferita ? '#FFC107' : '#6D4C41'} />
        </button>
      </div>
      {/* Info */}
      <div style={{ padding: '10px 10px 12px' }}>
        <p style={{
          margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: COLORS.primary,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {cat?.nome ?? 'Altro'}
        </p>
        <h4 style={{
          margin: '0 0 6px', fontSize: 13, fontWeight: 700, color: '#3E2723',
          lineHeight: 1.3,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {ricetta.nome}
        </h4>
        <InfoChip icon={<Clock size={11} />} label={`${ricetta.tempoPrepMinuti + ricetta.tempoCotturaMinuti} min`} />
      </div>
    </div>
  );
};

// ── Bottone icona (per card verticale) ───────────────────────────────────
const IconBtn: React.FC<{
  onClick: (e: React.MouseEvent) => void;
  active?: boolean;
  color?: string;
  children: React.ReactNode;
}> = ({ onClick, children }) => (
  <button
    onClick={onClick}
    style={{
      background: 'rgba(255,255,255,0.88)',
      border: 'none', borderRadius: '50%',
      width: 32, height: 32,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', backdropFilter: 'blur(4px)',
    }}
  >
    {children}
  </button>
);
