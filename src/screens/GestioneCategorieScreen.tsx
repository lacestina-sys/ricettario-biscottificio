import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRicettarioStore } from '../providers/store';
import {
  ArrowLeft, Plus, Edit2, Trash2, GripVertical,
  AlertCircle, Check, X,
} from 'lucide-react';
import { COLORS } from '../config/constants';
import type { Categoria } from '../models/types';

// ── Icone disponibili ─────────────────────────────────────────────────────
const ICONE_DISPONIBILI = [
  { nome: 'cookie', emoji: '🍪' },
  { nome: 'cake', emoji: '🎂' },
  { nome: 'bread', emoji: '🍞' },
  { nome: 'chocolate', emoji: '🍫' },
  { nome: 'almond', emoji: '🌰' },
  { nome: 'cloud', emoji: '☁️' },
  { nome: 'star', emoji: '⭐' },
  { nome: 'heart', emoji: '❤️' },
  { nome: 'gift', emoji: '🎁' },
  { nome: 'leaf', emoji: '🌿' },
  { nome: 'lemon', emoji: '🍋' },
  { nome: 'cherry', emoji: '🍒' },
  { nome: 'grain', emoji: '🌾' },
  { nome: 'layers', emoji: '📚' },
  { nome: 'more', emoji: '➕' },
  { nome: 'sparkles', emoji: '✨' },
  { nome: 'wafer', emoji: '🧇' },
  { nome: 'pretzel', emoji: '🥨' },
  { nome: 'donut', emoji: '🍩' },
  { nome: 'muffin', emoji: '🧁' },
];

function getEmoji(nome: string): string {
  return ICONE_DISPONIBILI.find(i => i.nome === nome)?.emoji ?? '🍪';
}

// ── Dialog nuova/modifica categoria ──────────────────────────────────────
interface DialogCategoriaProps {
  categoria?: Categoria;
  onSalva: (nome: string, icona: string) => void;
  onChiudi: () => void;
}

const DialogCategoria: React.FC<DialogCategoriaProps> = ({ categoria, onSalva, onChiudi }) => {
  const [nome, setNome] = useState(categoria?.nome ?? '');
  const [icona, setIcona] = useState(categoria?.icona ?? 'cookie');
  const [errore, setErrore] = useState('');

  const handleSalva = () => {
    if (!nome.trim()) { setErrore('Il nome è obbligatorio'); return; }
    if (nome.trim().length > 50) { setErrore('Max 50 caratteri'); return; }
    onSalva(nome.trim(), icona);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 20,
      animation: 'fadeIn 0.15s ease',
    }}>
      <style>{`@keyframes fadeIn { from { opacity:0; transform:scale(0.95) } to { opacity:1; transform:scale(1) } }`}</style>
      <div style={{
        background: '#FFF', borderRadius: 24, width: '100%', maxWidth: 400,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #795548, #a1887f)',
          padding: '18px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: '#FFF', margin: 0 }}>
            {categoria ? 'Modifica Categoria' : '✨ Nuova Categoria'}
          </h3>
          <button onClick={onChiudi} style={{
            background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%',
            width: 32, height: 32, cursor: 'pointer', color: '#FFF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: 20 }}>
          {/* Anteprima */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            background: '#FFF8E1', borderRadius: 14, padding: '12px 16px',
            marginBottom: 20, border: '2px solid #FFD54F',
          }}>
            <span style={{ fontSize: 36 }}>{getEmoji(icona)}</span>
            <div>
              <div style={{ fontSize: 11, color: '#a1887f', fontWeight: 600 }}>ANTEPRIMA</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.onBackground }}>
                {nome || 'Nome categoria'}
              </div>
            </div>
          </div>

          {/* Campo nome */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: COLORS.textSecondary, display: 'block', marginBottom: 6 }}>
              Nome categoria *
            </label>
            <input
              type="text"
              value={nome}
              onChange={e => { setNome(e.target.value); setErrore(''); }}
              placeholder="es. Biscotti di Natale"
              maxLength={50}
              autoFocus
              style={{
                width: '100%', padding: '13px 14px', border: `2px solid ${errore ? COLORS.error : '#D7CCC8'}`,
                borderRadius: 12, fontSize: 15, fontFamily: 'inherit', outline: 'none',
                color: COLORS.onBackground, boxSizing: 'border-box',
              }}
            />
            {errore && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, color: COLORS.error }}>
                <AlertCircle size={13} />
                <span style={{ fontSize: 12, fontWeight: 600 }}>{errore}</span>
              </div>
            )}
            <div style={{ fontSize: 11, color: '#a1887f', textAlign: 'right', marginTop: 3 }}>
              {nome.length}/50
            </div>
          </div>

          {/* Selezione icona */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: COLORS.textSecondary, display: 'block', marginBottom: 10 }}>
              Icona
            </label>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8,
              maxHeight: 200, overflowY: 'auto',
            }}>
              {ICONE_DISPONIBILI.map(ic => (
                <button
                  key={ic.nome}
                  onClick={() => setIcona(ic.nome)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    padding: '10px 6px', border: '2px solid',
                    borderColor: icona === ic.nome ? COLORS.primary : '#EFEBE9',
                    borderRadius: 12, background: icona === ic.nome ? '#FFF8E1' : '#FAFAFA',
                    cursor: 'pointer', transition: 'all 0.15s',
                    position: 'relative',
                  }}
                >
                  <span style={{ fontSize: 22 }}>{ic.emoji}</span>
                  {icona === ic.nome && (
                    <div style={{
                      position: 'absolute', top: 4, right: 4,
                      background: COLORS.primary, borderRadius: '50%', width: 14, height: 14,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Check size={9} color="#FFF" strokeWidth={3} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Bottoni */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onChiudi} style={{
              flex: 1, padding: '14px', border: 'none', borderRadius: 12,
              background: '#EFEBE9', color: COLORS.textSecondary,
              fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
            }}>
              Annulla
            </button>
            <button onClick={handleSalva} style={{
              flex: 2, padding: '14px', border: 'none', borderRadius: 12,
              background: 'linear-gradient(135deg, #795548, #a1887f)', color: '#FFF',
              fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
            }}>
              {categoria ? '💾 Salva' : '✨ Crea categoria'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Screen principale ─────────────────────────────────────────────────────
export const GestioneCategorieScreen: React.FC = () => {
  const navigate = useNavigate();
  const { categorie, ricette, aggiungiCategoria, aggiornaCategoria, eliminaCategoria, riordinaCategorie } = useRicettarioStore();
  const [dialogAperto, setDialogAperto] = useState(false);
  const [categoriaModifica, setCategoriaModifica] = useState<Categoria | undefined>();
  const [erroreElimina, setErroreElimina] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [listaOrd, setListaOrd] = useState<Categoria[]>(
    [...categorie].sort((a, b) => a.ordine - b.ordine)
  );

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const ricettePerCategoria = useCallback((catId: string) =>
    ricette.filter(r => r.categoria === catId).length,
    [ricette]
  );

  // ── Drag & Drop ───────────────────────────────────────────────────────
  const handleDragStart = (i: number) => setDragIdx(i);
  const handleDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    setDragOverIdx(i);
  };
  const handleDrop = (targetIdx: number) => {
    if (dragIdx === null || dragIdx === targetIdx) return;
    const nuova = [...listaOrd];
    const [spostata] = nuova.splice(dragIdx, 1);
    nuova.splice(targetIdx, 0, spostata);
    const aggiornate = nuova.map((c, i) => ({ ...c, ordine: i }));
    setListaOrd(aggiornate);
    riordinaCategorie(aggiornate);
    setDragIdx(null);
    setDragOverIdx(null);
    showToast('📋 Ordine salvato');
  };
  const handleDragEnd = () => { setDragIdx(null); setDragOverIdx(null); };

  // ── CRUD ──────────────────────────────────────────────────────────────
  const handleSalva = (nome: string, icona: string) => {
    if (categoriaModifica) {
      aggiornaCategoria(categoriaModifica.id, { nome, icona });
      setListaOrd(prev => prev.map(c => c.id === categoriaModifica.id ? { ...c, nome, icona } : c));
      showToast('✅ Categoria aggiornata');
    } else {
      const nuova = aggiungiCategoria({ nome, icona, ordine: listaOrd.length });
      setListaOrd(prev => [...prev, nuova]);
      showToast('✨ Categoria creata');
    }
    setDialogAperto(false);
    setCategoriaModifica(undefined);
  };

  const handleElimina = (cat: Categoria) => {
    const n = ricettePerCategoria(cat.id);
    if (n > 0) {
      setErroreElimina(`"${cat.nome}" contiene ${n} ricett${n === 1 ? 'a' : 'e'}. Sposta prima le ricette in un'altra categoria.`);
      setTimeout(() => setErroreElimina(null), 4000);
      return;
    }
    eliminaCategoria(cat.id);
    setListaOrd(prev => prev.filter(c => c.id !== cat.id));
    showToast('🗑 Categoria eliminata');
  };

  return (
    <div style={{ minHeight: '100vh', background: COLORS.background, fontFamily: 'Nunito, sans-serif' }}>
      {/* AppBar */}
      <div style={{
        background: 'linear-gradient(135deg, #795548, #a1887f)',
        padding: '0 16px',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{
          maxWidth: 700, margin: '0 auto',
          display: 'flex', alignItems: 'center', gap: 12,
          height: 60,
        }}>
          <button onClick={() => navigate(-1)} style={{
            background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
            width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#FFF', flexShrink: 0,
          }}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: '#FFF', margin: 0, flex: 1 }}>
            Gestione Categorie
          </h1>
          <span style={{
            background: 'rgba(255,255,255,0.2)', color: '#FFF',
            borderRadius: 999, padding: '4px 12px', fontSize: 13, fontWeight: 700,
          }}>
            {listaOrd.length}
          </span>
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '16px 16px 100px' }}>

        {/* Info drag */}
        <div style={{
          background: '#FFF8E1', border: '1px solid #FFD54F', borderRadius: 12,
          padding: '10px 14px', marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 13, color: COLORS.textSecondary, fontWeight: 600,
        }}>
          <GripVertical size={16} color="#FF8F00" />
          Trascina le righe per riordinare le categorie
        </div>

        {/* Errore elimina */}
        {erroreElimina && (
          <div style={{
            background: '#FFEBEE', border: '2px solid #EF5350', borderRadius: 12,
            padding: '12px 16px', marginBottom: 16,
            display: 'flex', alignItems: 'flex-start', gap: 8,
            animation: 'fadeIn 0.2s ease',
          }}>
            <AlertCircle size={16} color="#c62828" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ margin: 0, fontSize: 13, color: '#c62828', fontWeight: 600 }}>{erroreElimina}</p>
          </div>
        )}

        {/* Lista categorie */}
        <div style={{
          background: '#FFF', borderRadius: 20,
          boxShadow: '0 2px 12px rgba(121,85,72,0.10)',
          overflow: 'hidden', marginBottom: 20,
        }}>
          {listaOrd.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: COLORS.textSecondary }}>
              <span style={{ fontSize: 48 }}>📂</span>
              <p style={{ fontSize: 16, fontWeight: 600, margin: '12px 0 0' }}>Nessuna categoria</p>
              <p style={{ fontSize: 13, margin: '6px 0 0' }}>Crea la prima categoria con il pulsante +</p>
            </div>
          ) : listaOrd.map((cat, i) => {
            const nRicette = ricettePerCategoria(cat.id);
            const isDragging = dragIdx === i;
            const isDragOver = dragOverIdx === i;
            return (
              <div
                key={cat.id}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragOver={e => handleDragOver(e, i)}
                onDrop={() => handleDrop(i)}
                onDragEnd={handleDragEnd}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 16px',
                  borderBottom: i < listaOrd.length - 1 ? '1px solid #EFEBE9' : 'none',
                  background: isDragging ? '#FFF8E1' : isDragOver ? '#EFEBE9' : '#FFF',
                  opacity: isDragging ? 0.6 : 1,
                  transition: 'background 0.15s, opacity 0.15s',
                  borderLeft: isDragOver ? `3px solid ${COLORS.primary}` : '3px solid transparent',
                  cursor: 'grab',
                }}
              >
                {/* Drag handle */}
                <GripVertical size={18} color="#D7CCC8" style={{ flexShrink: 0 }} />

                {/* Emoji */}
                <span style={{ fontSize: 26, flexShrink: 0 }}>
                  {getEmoji(cat.icona)}
                </span>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.onBackground }}>
                    {cat.nome}
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 1 }}>
                    {nRicette === 0
                      ? 'Nessuna ricetta'
                      : `${nRicette} ricett${nRicette === 1 ? 'a' : 'e'}`}
                  </div>
                </div>

                {/* Bottoni azione */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={e => { e.stopPropagation(); setCategoriaModifica(cat); setDialogAperto(true); }}
                    style={{
                      background: '#EEF2FF', border: 'none', borderRadius: 10,
                      width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: '#3949AB',
                    }}
                    title="Modifica"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); handleElimina(cat); }}
                    disabled={nRicette > 0}
                    style={{
                      background: nRicette > 0 ? '#F5F5F5' : '#FFEBEE',
                      border: 'none', borderRadius: 10,
                      width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: nRicette > 0 ? 'not-allowed' : 'pointer',
                      color: nRicette > 0 ? '#BDBDBD' : '#c62828',
                      opacity: nRicette > 0 ? 0.6 : 1,
                    }}
                    title={nRicette > 0 ? `Ha ${nRicette} ricette` : 'Elimina'}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => { setCategoriaModifica(undefined); setDialogAperto(true); }}
        style={{
          position: 'fixed', bottom: 24, right: 24,
          width: 60, height: 60, borderRadius: '50%',
          background: 'linear-gradient(135deg, #FFC107, #FF8F00)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 6px 20px rgba(255,193,7,0.45)',
          color: '#3E2723', zIndex: 200,
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        title="Nuova categoria"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      {/* Dialog */}
      {dialogAperto && (
        <DialogCategoria
          categoria={categoriaModifica}
          onSalva={handleSalva}
          onChiudi={() => { setDialogAperto(false); setCategoriaModifica(undefined); }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
          background: '#3E2723', color: '#FFF', padding: '13px 22px', borderRadius: 12,
          fontSize: 14, fontWeight: 600, zIndex: 2000,
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)', whiteSpace: 'nowrap',
          animation: 'fadeIn 0.2s ease',
        }}>
          {toast}
        </div>
      )}
    </div>
  );
};
