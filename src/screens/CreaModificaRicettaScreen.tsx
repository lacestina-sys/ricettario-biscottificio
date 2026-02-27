/**
 * CreaModificaRicettaScreen – Form completo per creare e modificare ricette.
 * Funzionalità:
 *  - Salvataggio bozza automatico ogni 30s in localStorage
 *  - Dialog conferma uscita con modifiche non salvate
 *  - Sezione foto con preview + bottom sheet selezione
 *  - Info base (nome, categoria, descrizione, resa, tempi, difficoltà)
 *  - Ingredienti drag & drop con autocomplete e costo opzionale
 *  - Steps riordinabili con campi opzionali (durata, temperatura)
 *  - Tags predefiniti + personalizzati
 *  - Note con contatore caratteri
 *  - Validazione real-time
 *  - SnackBar successo
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, GripVertical, Camera,
  ChevronDown, ChevronUp, X, Check, AlertCircle, Euro,
  EyeOff, Tag, FileText,
} from 'lucide-react';
import { useRicettarioStore } from '../providers/store';
import type {
  Ingrediente, StepPreparazione, Difficolta, UnitaMisura,
} from '../models/types';
import { COLORS } from '../config/constants';

// ─────────────────────────────────────────────────────────────────────────────
// Tipi locali
// ─────────────────────────────────────────────────────────────────────────────

interface IngredienteForm extends Ingrediente {
  _id: string;
  _showCosto: boolean;
}

interface StepForm extends StepPreparazione {
  _id: string;
  _showOpzionali: boolean;
}

const DRAFT_KEY = 'ricettario_bozza';
const UNITA_LIST: UnitaMisura[] = ['g', 'kg', 'ml', 'l', 'unità', 'cucchiai', 'pizzico', 'bustina'];

const TAGS_PREDEFINITI = [
  'senza glutine', 'senza lattosio', 'vegano', 'vegetariano',
  'biologico', 'natale', 'pasqua', 'estate', 'tradizionale',
  'con frutta secca', 'cioccolato', 'limone', 'arancia',
];

const DIFFICOLTA_OPTIONS: { value: Difficolta; label: string; icon: string }[] = [
  { value: 'facile', label: 'Facile', icon: '⭐' },
  { value: 'media', label: 'Media', icon: '⭐⭐' },
  { value: 'difficile', label: 'Difficile', icon: '⭐⭐⭐' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 9);

const newIngrediente = (): IngredienteForm => ({
  _id: uid(), _showCosto: false,
  nome: '', quantita: 0, unitaMisura: 'g', costoAlKg: undefined,
});

const newStep = (n: number): StepForm => ({
  _id: uid(), _showOpzionali: false,
  numero: n, descrizione: '', durataMinuti: undefined, temperaturaC: undefined,
});

// ─────────────────────────────────────────────────────────────────────────────
// Stili condivisi
// ─────────────────────────────────────────────────────────────────────────────

const s = {
  input: {
    width: '100%', boxSizing: 'border-box' as const,
    padding: '13px 14px', border: `2px solid ${COLORS.divider}`,
    borderRadius: 12, fontSize: 15, fontFamily: 'inherit',
    background: '#FFF', color: COLORS.onSurface, outline: 'none',
    transition: 'border-color 0.2s',
  },
  inputFocus: { borderColor: COLORS.primary },
  inputError: { borderColor: COLORS.error },
  label: {
    fontSize: 12, fontWeight: 700, color: COLORS.textSecondary,
    display: 'block', marginBottom: 6, textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  sectionCard: {
    background: '#FFF', borderRadius: 16, padding: '20px 18px',
    marginBottom: 16, boxShadow: '0 2px 10px rgba(121,85,72,0.09)',
  },
  sectionTitle: {
    fontSize: 16, fontWeight: 800, color: COLORS.onSurface,
    margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8,
  },
  btn: {
    border: 'none', borderRadius: 12, cursor: 'pointer',
    fontFamily: 'inherit', fontWeight: 700, display: 'flex',
    alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 48,
    transition: 'transform 0.15s, box-shadow 0.15s',
  },
  errorMsg: {
    fontSize: 11, color: COLORS.error, marginTop: 4,
    display: 'flex', alignItems: 'center', gap: 4,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componenti puri (dichiarati fuori dal componente principale per evitare
// re-montaggio ad ogni render)
// ─────────────────────────────────────────────────────────────────────────────

const FocusInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & {
  hasError?: boolean;
}> = ({ hasError, style, ...props }) => {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      onFocus={e => { setFocused(true); props.onFocus?.(e); }}
      onBlur={e => { setFocused(false); props.onBlur?.(e); }}
      style={{
        ...s.input, ...style,
        ...(focused ? s.inputFocus : {}),
        ...(hasError ? s.inputError : {}),
      }}
    />
  );
};

const FocusTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  hasError?: boolean;
}> = ({ hasError, style, ...props }) => {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      {...props}
      onFocus={e => { setFocused(true); props.onFocus?.(e); }}
      onBlur={e => { setFocused(false); props.onBlur?.(e); }}
      style={{
        ...s.input, resize: 'vertical', ...style,
        ...(focused ? s.inputFocus : {}),
        ...(hasError ? s.inputError : {}),
      }}
    />
  );
};

const FocusSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & {
  hasError?: boolean;
}> = ({ hasError, style, children, ...props }) => {
  const [focused, setFocused] = useState(false);
  return (
    <select
      {...props}
      onFocus={e => { setFocused(true); props.onFocus?.(e); }}
      onBlur={e => { setFocused(false); props.onBlur?.(e); }}
      style={{
        ...s.input, ...style,
        ...(focused ? s.inputFocus : {}),
        ...(hasError ? s.inputError : {}),
      }}
    >
      {children}
    </select>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SnackBar
// ─────────────────────────────────────────────────────────────────────────────

const SnackBar: React.FC<{ msg: string; visible: boolean }> = ({ msg, visible }) => (
  <div style={{
    position: 'fixed', bottom: 90, left: '50%',
    transform: `translateX(-50%) translateY(${visible ? 0 : 20}px)`,
    opacity: visible ? 1 : 0, transition: 'all 0.3s cubic-bezier(.17,.67,.35,1.2)',
    background: '#2e7d32', color: '#FFF', padding: '14px 22px',
    borderRadius: 14, fontWeight: 700, fontSize: 14, zIndex: 9999,
    boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
    display: 'flex', alignItems: 'center', gap: 8,
    pointerEvents: visible ? 'auto' : 'none',
  }}>
    <Check size={18} /> {msg}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Dialog conferma uscita
// ─────────────────────────────────────────────────────────────────────────────

const ExitDialog: React.FC<{
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ visible, onConfirm, onCancel }) => {
  if (!visible) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(62,39,35,0.55)',
      backdropFilter: 'blur(4px)', zIndex: 10000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }} onClick={onCancel}>
      <div style={{
        background: '#FFF', borderRadius: 20, padding: '28px 24px', maxWidth: 360,
        width: '100%', boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
        animation: 'popIn 0.25s ease',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 12 }}>⚠️</div>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: COLORS.onSurface, margin: '0 0 10px', textAlign: 'center' }}>
          Uscire senza salvare?
        </h3>
        <p style={{ fontSize: 14, color: COLORS.textSecondary, margin: '0 0 22px', textAlign: 'center', lineHeight: 1.5 }}>
          Hai modifiche non salvate. Se esci ora perderai tutto il lavoro svolto.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{
            ...s.btn, flex: 1, background: COLORS.surfaceVariant, color: COLORS.onSurface,
            fontSize: 14, padding: '14px 0',
          }}>
            Continua a modificare
          </button>
          <button onClick={onConfirm} style={{
            ...s.btn, flex: 1, background: COLORS.error, color: '#FFF',
            fontSize: 14, padding: '14px 0',
          }}>
            <X size={16} /> Esci
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// FotoBottomSheet
// ─────────────────────────────────────────────────────────────────────────────

const FotoBottomSheet: React.FC<{
  visible: boolean;
  onClose: () => void;
  onScegli: (tipo: 'camera' | 'gallery') => void;
}> = ({ visible, onClose, onScegli }) => (
  <>
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      zIndex: 8000, opacity: visible ? 1 : 0,
      pointerEvents: visible ? 'auto' : 'none',
      transition: 'opacity 0.25s',
    }} onClick={onClose} />
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: '#FFF', borderRadius: '24px 24px 0 0',
      padding: '8px 20px 40px', zIndex: 8001,
      transform: visible ? 'translateY(0)' : 'translateY(100%)',
      transition: 'transform 0.3s cubic-bezier(.25,.8,.25,1)',
      boxShadow: '0 -8px 32px rgba(0,0,0,0.15)',
    }}>
      <div style={{
        width: 40, height: 4, background: '#D7CCC8', borderRadius: 99,
        margin: '12px auto 20px',
      }} />
      <h4 style={{ fontSize: 16, fontWeight: 800, color: COLORS.onSurface, margin: '0 0 16px' }}>
        Aggiungi foto
      </h4>
      {[
        { tipo: 'camera' as const, icon: '📷', label: 'Fotocamera', sub: 'Scatta una nuova foto' },
        { tipo: 'gallery' as const, icon: '🖼️', label: 'Galleria', sub: 'Scegli dalla galleria' },
      ].map(({ tipo, icon, label, sub }) => (
        <button key={tipo} onClick={() => { onScegli(tipo); onClose(); }} style={{
          ...s.btn, width: '100%', justifyContent: 'flex-start',
          background: '#FAFAFA', padding: '16px 18px', marginBottom: 10,
          border: `1.5px solid ${COLORS.divider}`, fontSize: 15, color: COLORS.onSurface,
        }}>
          <span style={{ fontSize: 26, marginRight: 4 }}>{icon}</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 800 }}>{label}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary }}>{sub}</div>
          </div>
        </button>
      ))}
      <button onClick={onClose} style={{
        ...s.btn, width: '100%', background: COLORS.surfaceVariant,
        color: COLORS.textSecondary, fontSize: 14, padding: '14px 0', marginTop: 4,
      }}>
        Annulla
      </button>
    </div>
  </>
);

// ─────────────────────────────────────────────────────────────────────────────
// NuovaCategoriaModal
// ─────────────────────────────────────────────────────────────────────────────

const NuovaCategoriaModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onCrea: (nome: string) => void;
}> = ({ visible, onClose, onCrea }) => {
  const [nome, setNome] = useState('');
  if (!visible) return null;
  const submit = () => {
    if (nome.trim()) { onCrea(nome.trim()); setNome(''); onClose(); }
  };
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(62,39,35,0.55)',
      backdropFilter: 'blur(4px)', zIndex: 10000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: '#FFF', borderRadius: 20, padding: '28px 24px', maxWidth: 360,
        width: '100%', boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
        animation: 'popIn 0.25s ease',
      }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 16px' }}>➕ Nuova Categoria</h3>
        <input
          autoFocus value={nome} onChange={e => setNome(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Es. Baci di dama"
          style={{ ...s.input, marginBottom: 16 }}
        />
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{
            ...s.btn, flex: 1, background: COLORS.surfaceVariant, color: COLORS.onSurface,
            fontSize: 14, padding: '13px 0',
          }}>Annulla</button>
          <button onClick={submit} disabled={!nome.trim()} style={{
            ...s.btn, flex: 1,
            background: nome.trim() ? 'linear-gradient(135deg,#795548,#a1887f)' : COLORS.divider,
            color: '#FFF', fontSize: 14, padding: '13px 0',
          }}>Crea</button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// FotoIngranditaModal
// ─────────────────────────────────────────────────────────────────────────────

const FotoIngranditaModal: React.FC<{
  src: string | null;
  onClose: () => void;
}> = ({ src, onClose }) => {
  if (!src) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      zIndex: 11000, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <img src={src} alt="" style={{
        maxWidth: '95vw', maxHeight: '90vh', borderRadius: 12,
        boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
        objectFit: 'contain',
      }} />
      <button onClick={onClose} style={{
        position: 'absolute', top: 16, right: 16,
        background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
        width: 44, height: 44, cursor: 'pointer', display: 'flex',
        alignItems: 'center', justifyContent: 'center', color: '#FFF',
      }}>
        <X size={22} />
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// IngredienteRow
// ─────────────────────────────────────────────────────────────────────────────

const IngredienteRow: React.FC<{
  ing: IngredienteForm;
  index: number;
  suggerimenti: string[];
  errNome: boolean;
  errQta: boolean;
  onChange: (field: keyof IngredienteForm, value: unknown) => void;
  onRemove: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  isDragging?: boolean;
}> = ({ ing, index, suggerimenti, errNome, errQta, onChange, onRemove, dragHandleProps, isDragging }) => {
  const [showSugg, setShowSugg] = useState(false);
  const filteredSugg = useMemo(
    () => suggerimenti.filter(s => s.toLowerCase().includes(ing.nome.toLowerCase()) && s !== ing.nome),
    [suggerimenti, ing.nome],
  );

  return (
    <div style={{
      background: isDragging ? '#FFF8E1' : '#FAFAFA',
      borderRadius: 14, padding: '14px 14px 12px',
      marginBottom: 10, border: `1.5px solid ${isDragging ? COLORS.accent : COLORS.divider}`,
      boxShadow: isDragging ? '0 6px 20px rgba(121,85,72,0.18)' : 'none',
      transition: 'box-shadow 0.2s',
    }}>
      {/* Header riga */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        {/* Drag handle */}
        <div {...dragHandleProps} style={{
          cursor: 'grab', color: '#BCAAA4', padding: '4px 2px',
          display: 'flex', alignItems: 'center', touchAction: 'none',
        }}>
          <GripVertical size={18} />
        </div>
        {/* Numero */}
        <div style={{
          width: 26, height: 26, borderRadius: '50%',
          background: 'linear-gradient(135deg,#795548,#a1887f)',
          color: '#FFF', fontWeight: 800, fontSize: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>{index + 1}</div>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: COLORS.textSecondary }}>
          Ingrediente {index + 1}
        </span>
        {/* Toggle costo */}
        <button onClick={() => onChange('_showCosto', !ing._showCosto)} title="Mostra/nascondi costo" style={{
          background: ing._showCosto ? '#FFF8E1' : 'transparent',
          border: `1.5px solid ${ing._showCosto ? COLORS.accent : COLORS.divider}`,
          borderRadius: 8, padding: '5px 8px', cursor: 'pointer', color: COLORS.textSecondary,
          display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700,
        }}>
          {ing._showCosto ? <EyeOff size={13} /> : <Euro size={13} />}
          {ing._showCosto ? 'Nascondi' : 'Costo'}
        </button>
        {/* Elimina */}
        <button onClick={onRemove} style={{
          background: '#FFEBEE', border: 'none', borderRadius: 8,
          padding: '8px 10px', cursor: 'pointer', color: '#c62828',
          display: 'flex', alignItems: 'center', minHeight: 36,
        }}>
          <Trash2 size={15} />
        </button>
      </div>

      {/* Nome con autocomplete */}
      <div style={{ position: 'relative', marginBottom: errNome ? 2 : 10 }}>
        <FocusInput
          value={ing.nome}
          hasError={errNome}
          onChange={e => onChange('nome', e.target.value)}
          onFocus={() => setShowSugg(true)}
          onBlur={() => setTimeout(() => setShowSugg(false), 150)}
          placeholder="Nome ingrediente *"
        />
        {showSugg && filteredSugg.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
            background: '#FFF', borderRadius: '0 0 12px 12px',
            border: `2px solid ${COLORS.primary}`, borderTop: 'none',
            maxHeight: 160, overflowY: 'auto',
            boxShadow: '0 8px 20px rgba(121,85,72,0.15)',
          }}>
            {filteredSugg.slice(0, 6).map(sg => (
              <button key={sg} onMouseDown={() => { onChange('nome', sg); setShowSugg(false); }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  background: 'transparent', border: 'none', padding: '10px 14px',
                  fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
                  color: COLORS.onSurface, fontWeight: 600,
                  borderBottom: `1px solid ${COLORS.divider}`,
                }}>
                🔍 {sg}
              </button>
            ))}
          </div>
        )}
        {errNome && (
          <div style={s.errorMsg}><AlertCircle size={12} /> Nome obbligatorio</div>
        )}
      </div>

      {/* Quantità + Unità */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: ing._showCosto ? '1fr 1fr 1fr' : '1fr 1fr',
        gap: 8,
      }}>
        <div>
          <FocusInput
            type="number" min={0} step={0.1}
            hasError={errQta}
            value={ing.quantita || ''}
            onChange={e => onChange('quantita', Number(e.target.value))}
            placeholder="Quantità *"
          />
          {errQta && <div style={s.errorMsg}><AlertCircle size={12} /> Obbligatoria</div>}
        </div>
        <FocusSelect
          value={ing.unitaMisura}
          onChange={e => onChange('unitaMisura', e.target.value as UnitaMisura)}
        >
          {UNITA_LIST.map(u => <option key={u} value={u}>{u}</option>)}
        </FocusSelect>
        {ing._showCosto && (
          <FocusInput
            type="number" min={0} step={0.01}
            value={ing.costoAlKg ?? ''}
            onChange={e => onChange('costoAlKg', e.target.value ? Number(e.target.value) : undefined)}
            placeholder="€/kg"
          />
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// StepRow
// ─────────────────────────────────────────────────────────────────────────────

const StepRow: React.FC<{
  step: StepForm;
  index: number;
  errDesc: boolean;
  onChange: (field: keyof StepForm, value: unknown) => void;
  onRemove: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  isDragging?: boolean;
}> = ({ step, index, errDesc, onChange, onRemove, dragHandleProps, isDragging }) => (
  <div style={{
    background: isDragging ? '#FFF8E1' : '#FAFAFA',
    borderRadius: 14, padding: '14px 14px 12px', marginBottom: 10,
    border: `1.5px solid ${isDragging ? COLORS.accent : COLORS.divider}`,
    boxShadow: isDragging ? '0 6px 20px rgba(121,85,72,0.18)' : 'none',
    transition: 'box-shadow 0.2s',
  }}>
    {/* Header step */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <div {...dragHandleProps} style={{
        cursor: 'grab', color: '#BCAAA4', padding: '4px 2px',
        display: 'flex', alignItems: 'center', touchAction: 'none',
      }}>
        <GripVertical size={18} />
      </div>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: 'linear-gradient(135deg,#795548,#a1887f)',
        color: '#FFF', fontWeight: 800, fontSize: 15,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>{index + 1}</div>
      <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: COLORS.textSecondary }}>
        Passaggio {index + 1}
      </span>
      {/* Toggle opzionali */}
      <button onClick={() => onChange('_showOpzionali', !step._showOpzionali)} style={{
        background: step._showOpzionali ? '#FFF8E1' : 'transparent',
        border: `1.5px solid ${step._showOpzionali ? COLORS.accent : COLORS.divider}`,
        borderRadius: 8, padding: '5px 8px', cursor: 'pointer',
        fontSize: 11, fontWeight: 700, color: COLORS.textSecondary,
        display: 'flex', alignItems: 'center', gap: 4,
      }}>
        {step._showOpzionali ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        ⏱ &amp; 🌡
      </button>
      <button onClick={onRemove} style={{
        background: '#FFEBEE', border: 'none', borderRadius: 8,
        padding: '8px 10px', cursor: 'pointer', color: '#c62828',
        display: 'flex', alignItems: 'center', minHeight: 36,
      }}>
        <Trash2 size={15} />
      </button>
    </div>

    <FocusTextarea
      value={step.descrizione}
      hasError={errDesc}
      onChange={e => onChange('descrizione', e.target.value)}
      placeholder={`Descrivi il passaggio ${index + 1}...`}
      rows={2}
    />
    {errDesc && <div style={s.errorMsg}><AlertCircle size={12} /> Descrizione obbligatoria</div>}

    {/* Opzionali */}
    {step._showOpzionali && (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
        <div>
          <label style={s.label}>⏱ Durata (min)</label>
          <FocusInput
            type="number" min={0}
            value={step.durataMinuti ?? ''}
            onChange={e => onChange('durataMinuti', e.target.value ? Number(e.target.value) : undefined)}
            placeholder="Opzionale"
          />
        </div>
        <div>
          <label style={s.label}>🌡 Temperatura (°C)</label>
          <FocusInput
            type="number" min={0}
            value={step.temperaturaC ?? ''}
            onChange={e => onChange('temperaturaC', e.target.value ? Number(e.target.value) : undefined)}
            placeholder="Opzionale"
          />
        </div>
      </div>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPALE
// ─────────────────────────────────────────────────────────────────────────────

export const CreaModificaRicettaScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  useLocation(); // necessario per react-router-dom
  const isModifica = Boolean(id);

  const ricette = useRicettarioStore(s => s.ricette);
  const categorie = useRicettarioStore(s => s.categorie);
  const aggiungiRicetta = useRicettarioStore(s => s.aggiungiRicetta);
  const aggiornaRicetta = useRicettarioStore(s => s.aggiornaRicetta);
  const aggiungiCategoria = useRicettarioStore(s => s.aggiungiCategoria);

  const ricettaEsistente = useMemo(
    () => (isModifica ? ricette.find(r => r.id === id) : undefined),
    [isModifica, id, ricette],
  );

  // ── State form ──────────────────────────────────────────────────────────
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('');
  const [descrizione, setDescrizione] = useState('');
  const [resa, setResa] = useState<number | ''>(60);
  const [tempoPrepMinuti, setTempoPrepMinuti] = useState<number | ''>(20);
  const [tempoCotturaMinuti, setTempoCotturaMinuti] = useState<number | ''>(12);
  const [temperaturaForno, setTemperaturaForno] = useState<number | ''>(180);
  const [difficolta, setDifficolta] = useState<Difficolta>('facile');
  const [note, setNote] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [ingredienti, setIngredienti] = useState<IngredienteForm[]>([newIngrediente()]);
  const [steps, setSteps] = useState<StepForm[]>([newStep(1)]);
  const [foto, setFoto] = useState<string[]>([]);
  const [fotoIngrandita, setFotoIngrandita] = useState<string | null>(null);

  // ── UI state ─────────────────────────────────────────────────────────────
  const [dirty, setDirty] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showFotoSheet, setShowFotoSheet] = useState(false);
  const [showNuovaCategoria, setShowNuovaCategoria] = useState(false);
  const [snackVisible, setSnackVisible] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errori, setErrori] = useState<Record<string, string>>({});
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDirtyRef = useRef(false);
  const navigatePendingRef = useRef<string | null>(null);

  // ── Autocomplete ingredienti ─────────────────────────────────────────────
  const suggerimentiIngredienti = useMemo(() => {
    const set = new Set<string>();
    ricette.forEach(r => r.ingredienti.forEach(i => { if (i.nome) set.add(i.nome); }));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'it'));
  }, [ricette]);

  // ── Popola form se modifica ──────────────────────────────────────────────
  useEffect(() => {
    if (ricettaEsistente) {
      setNome(ricettaEsistente.nome);
      setCategoria(ricettaEsistente.categoria);
      setDescrizione(ricettaEsistente.descrizione);
      setResa(ricettaEsistente.resa);
      setTempoPrepMinuti(ricettaEsistente.tempoPrepMinuti);
      setTempoCotturaMinuti(ricettaEsistente.tempoCotturaMinuti);
      setTemperaturaForno(ricettaEsistente.temperaturaForno);
      setDifficolta(ricettaEsistente.difficolta);
      setNote(ricettaEsistente.note);
      setTags([...ricettaEsistente.tags]);
      setFoto([...ricettaEsistente.foto]);
      setIngredienti(ricettaEsistente.ingredienti.map(i => ({
        ...i, _id: uid(), _showCosto: Boolean(i.costoAlKg),
      })));
      setSteps(ricettaEsistente.steps.map(s => ({
        ...s, _id: uid(), _showOpzionali: Boolean(s.durataMinuti || s.temperaturaC),
      })));
    } else if (categorie.length > 0 && !categoria) {
      setCategoria(categorie[0].id);
      // Prova a caricare bozza
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          setNome(parsed.nome || '');
          if (parsed.categoria) setCategoria(parsed.categoria);
          setDescrizione(parsed.descrizione || '');
          if (parsed.resa) setResa(parsed.resa);
        } catch { /* ignora */ }
      }
    }
  }, [ricettaEsistente, categorie]);

  // ── Track dirty ──────────────────────────────────────────────────────────
  useEffect(() => {
    setDirty(true);
    isDirtyRef.current = true;
  }, [nome, categoria, descrizione, resa, tempoPrepMinuti, tempoCotturaMinuti,
    temperaturaForno, difficolta, note, tags, ingredienti, steps, foto]);

  // ── Autosave bozza ogni 30s ──────────────────────────────────────────────
  useEffect(() => {
    if (isModifica) return;
    const timer = setInterval(() => {
      if (!isDirtyRef.current) return;
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        nome, categoria, descrizione, resa, tempoPrepMinuti,
        tempoCotturaMinuti, temperaturaForno, difficolta,
      }));
      setDraftSavedAt(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, [isModifica, nome, categoria, descrizione, resa, tempoPrepMinuti,
    tempoCotturaMinuti, temperaturaForno, difficolta]);

  // ── Navigazione con conferma ─────────────────────────────────────────────
  // In modalità modifica usiamo sempre replace:true per non sporcare la history:
  // /ricetta/:id → /modifica/:id → (back) → /ricetta/:id   ✅
  // senza replace: /ricetta/:id → /modifica/:id → /ricetta/:id → (back) → /modifica/:id ❌
  const tryNavigate = useCallback((path: string) => {
    if (isDirtyRef.current && !snackVisible) {
      navigatePendingRef.current = path;
      setShowExitDialog(true);
    } else {
      navigate(path, { replace: isModifica });
    }
  }, [navigate, snackVisible, isModifica]);

  // ── Validazione ──────────────────────────────────────────────────────────
  const valida = useCallback((): boolean => {
    const err: Record<string, string> = {};
    if (!nome.trim()) err.nome = 'Il nome è obbligatorio';
    if (nome.trim().length > 100) err.nome = 'Max 100 caratteri';
    if (!categoria) err.categoria = 'Seleziona una categoria';
    if (ingredienti.length === 0) err.ingredienti = 'Almeno 1 ingrediente richiesto';
    if (steps.length === 0) err.steps = 'Almeno 1 passaggio richiesto';
    ingredienti.forEach((ing, i) => {
      if (!ing.nome.trim()) err[`ing_nome_${i}`] = 'Nome obbligatorio';
      if (!ing.quantita || ing.quantita <= 0) err[`ing_qta_${i}`] = 'Quantità obbligatoria';
    });
    steps.forEach((st, i) => {
      if (!st.descrizione.trim()) err[`step_${i}`] = 'Descrizione obbligatoria';
    });
    setErrori(err);
    return Object.keys(err).length === 0;
  }, [nome, categoria, ingredienti, steps]);

  // Validazione real-time dopo primo submit
  useEffect(() => {
    if (submitted) valida();
  }, [submitted, nome, categoria, ingredienti, steps, valida]);

  // ── Salvataggio ──────────────────────────────────────────────────────────
  const salva = () => {
    setSubmitted(true);
    if (!valida()) {
      // Scroll all'errore
      const el = document.getElementById('form-errori');
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const dati = {
      nome: nome.trim(),
      categoria,
      descrizione: descrizione.trim(),
      foto,
      ingredienti: ingredienti.map(({ _id, _showCosto, ...rest }) => ({
        ...rest,
        costoAlKg: rest.costoAlKg || undefined,
      })),
      steps: steps.map(({ _id, _showOpzionali, ...rest }, idx) => ({
        ...rest,
        numero: idx + 1,
        durataMinuti: rest.durataMinuti || undefined,
        temperaturaC: rest.temperaturaC || undefined,
      })),
      resa: Number(resa) || 0,
      tempoPrepMinuti: Number(tempoPrepMinuti) || 0,
      tempoCotturaMinuti: Number(tempoCotturaMinuti) || 0,
      temperaturaForno: Number(temperaturaForno) || 0,
      difficolta,
      note: note.trim(),
      preferita: false,
      tags,
    };

    isDirtyRef.current = false;
    localStorage.removeItem(DRAFT_KEY);

    let targetId = id;
    if (isModifica && id) {
      aggiornaRicetta(id, dati);
    } else {
      const nuova = aggiungiRicetta(dati);
      targetId = nuova.id;
    }

    setSnackVisible(true);
    setTimeout(() => {
      setSnackVisible(false);
      // replace: true rimuove /modifica/:id (o /crea) dalla history,
      // così il back button torna alla schermata precedente e non rientra nel form
      navigate(`/ricetta/${targetId}`, { replace: true });
    }, 1500);
  };

  // ── Foto handlers ────────────────────────────────────────────────────────
  const handleFotoScelta = (tipo: 'camera' | 'gallery') => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = 'image/*';
      fileInputRef.current.capture = tipo === 'camera' ? 'environment' : '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (foto.length + files.length > 5) {
      alert('Massimo 5 foto per ricetta');
      return;
    }
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFoto(prev => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  // ── Ingredienti helpers ──────────────────────────────────────────────────
  const addIngrediente = () => setIngredienti(prev => [...prev, newIngrediente()]);
  const removeIngrediente = (i: number) =>
    setIngredienti(prev => prev.filter((_, idx) => idx !== i));
  const updateIngrediente = (i: number, field: keyof IngredienteForm, value: unknown) =>
    setIngredienti(prev => prev.map((ing, idx) =>
      idx === i ? { ...ing, [field]: value } : ing));

  // Drag & drop ingredienti (semplice mouse/touch)
  const dragIngIdx = useRef<number | null>(null);
  const onIngDragStart = (i: number) => { dragIngIdx.current = i; };
  const onIngDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragIngIdx.current === null || dragIngIdx.current === i) return;
    const arr = [...ingredienti];
    const [item] = arr.splice(dragIngIdx.current, 1);
    arr.splice(i, 0, item);
    dragIngIdx.current = i;
    setIngredienti(arr);
  };
  const onIngDragEnd = () => { dragIngIdx.current = null; };

  // ── Steps helpers ────────────────────────────────────────────────────────
  const addStep = () => setSteps(prev => [...prev, newStep(prev.length + 1)]);
  const removeStep = (i: number) =>
    setSteps(prev => prev.filter((_, idx) => idx !== i)
      .map((s, idx) => ({ ...s, numero: idx + 1 })));
  const updateStep = (i: number, field: keyof StepForm, value: unknown) =>
    setSteps(prev => prev.map((s, idx) =>
      idx === i ? { ...s, [field]: value } : s));

  const dragStepIdx = useRef<number | null>(null);
  const onStepDragStart = (i: number) => { dragStepIdx.current = i; };
  const onStepDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragStepIdx.current === null || dragStepIdx.current === i) return;
    const arr = [...steps];
    const [item] = arr.splice(dragStepIdx.current, 1);
    arr.splice(i, 0, item);
    dragStepIdx.current = i;
    setSteps(arr.map((s, idx) => ({ ...s, numero: idx + 1 })));
  };
  const onStepDragEnd = () => { dragStepIdx.current = null; };

  // ── Tags helpers ─────────────────────────────────────────────────────────
  const toggleTag = (t: string) =>
    setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  const addTagCustom = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput('');
  };

  // ── Nuova categoria ──────────────────────────────────────────────────────
  const handleNuovaCategoria = (nomeCateg: string) => {
    const nuova = aggiungiCategoria({
      nome: nomeCateg, icona: 'cookie', ordine: categorie.length,
    });
    setCategoria(nuova.id);
  };

  // ── Contatori errori ─────────────────────────────────────────────────────
  const erroriCount = Object.keys(errori).length;

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @keyframes popIn {
          0% { transform: scale(0.85); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .ing-row-drag { cursor: grab; }
        .form-section { animation: slideUp 0.3s ease both; }
      `}</style>

      {/* Input file nascosto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Modali */}
      <ExitDialog
        visible={showExitDialog}
        onCancel={() => { setShowExitDialog(false); navigatePendingRef.current = null; }}
        onConfirm={() => {
          setShowExitDialog(false);
          isDirtyRef.current = false;
          const target = navigatePendingRef.current;
          if (target) {
            // replace:true in modalità modifica per non lasciare /modifica/:id nella history
            navigate(target, { replace: isModifica });
          } else {
            navigate(-1 as never);
          }
        }}
      />
      <FotoBottomSheet
        visible={showFotoSheet}
        onClose={() => setShowFotoSheet(false)}
        onScegli={handleFotoScelta}
      />
      <NuovaCategoriaModal
        visible={showNuovaCategoria}
        onClose={() => setShowNuovaCategoria(false)}
        onCrea={handleNuovaCategoria}
      />
      <FotoIngranditaModal src={fotoIngrandita} onClose={() => setFotoIngrandita(null)} />
      <SnackBar msg="✅ Ricetta salvata con successo!" visible={snackVisible} />

      <div style={{ maxWidth: 760, margin: '0 auto', paddingBottom: 120 }}>

        {/* ── AppBar ──────────────────────────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, #4b2c20 0%, #795548 100%)',
          padding: '0 16px', position: 'sticky', top: 0, zIndex: 500,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 64 }}>
            <button onClick={() => tryNavigate(isModifica ? `/ricetta/${id}` : '/')} style={{
              background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 12,
              padding: '10px 14px', color: '#FFF', cursor: 'pointer',
              display: 'flex', alignItems: 'center', minHeight: 48,
            }}>
              <ArrowLeft size={20} />
            </button>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 18, fontWeight: 800, color: '#FFF', margin: 0, lineHeight: 1.2 }}>
                {isModifica
                  ? `✏️ Modifica: ${ricettaEsistente?.nome || '...'}`
                  : '✨ Nuova Ricetta'}
              </h1>
              {draftSavedAt && !isModifica && (
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', margin: 0 }}>
                  Bozza salvata alle {draftSavedAt.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
            {/* Indicatore dirty */}
            {dirty && (
              <div style={{
                background: 'rgba(255,193,7,0.2)', border: '1.5px solid rgba(255,193,7,0.5)',
                borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700,
                color: '#FFC107',
              }}>
                Non salvato
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: '16px 12px 0' }}>

          {/* ── Errori globali ─────────────────────────────────────────────── */}
          {submitted && erroriCount > 0 && (
            <div id="form-errori" style={{
              background: '#FFEBEE', border: `2px solid ${COLORS.error}`,
              borderRadius: 14, padding: '14px 16px', marginBottom: 16,
              animation: 'popIn 0.3s ease',
            }}>
              <div style={{ fontWeight: 800, color: COLORS.error, fontSize: 14, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertCircle size={16} />
                {erroriCount} {erroriCount === 1 ? 'errore' : 'errori'} da correggere
              </div>
              {errori.nome && <p style={{ margin: '2px 0', fontSize: 13, color: COLORS.error }}>• {errori.nome}</p>}
              {errori.categoria && <p style={{ margin: '2px 0', fontSize: 13, color: COLORS.error }}>• {errori.categoria}</p>}
              {errori.ingredienti && <p style={{ margin: '2px 0', fontSize: 13, color: COLORS.error }}>• {errori.ingredienti}</p>}
              {errori.steps && <p style={{ margin: '2px 0', fontSize: 13, color: COLORS.error }}>• {errori.steps}</p>}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* SEZIONE FOTO                                                   */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <div style={{ ...s.sectionCard }} className="form-section">
            <h3 style={s.sectionTitle}><Camera size={18} /> Foto</h3>

            {/* Area aggiungi */}
            {foto.length < 5 && (
              <button onClick={() => setShowFotoSheet(true)} style={{
                width: '100%', background: 'linear-gradient(135deg,#EFEBE9,#FFF8E1)',
                border: `2px dashed ${COLORS.primary}`, borderRadius: 14,
                padding: '28px 20px', cursor: 'pointer', color: COLORS.primary,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 10, marginBottom: foto.length ? 14 : 0,
                transition: 'background 0.2s',
              }}>
                <Camera size={36} strokeWidth={1.5} />
                <span style={{ fontWeight: 700, fontSize: 15 }}>Aggiungi foto</span>
                <span style={{ fontSize: 12, color: COLORS.textSecondary }}>
                  {foto.length}/5 foto — Tocca per aggiungere
                </span>
              </button>
            )}

            {/* Preview scroll orizzontale */}
            {foto.length > 0 && (
              <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
                {foto.map((src, i) => (
                  <div key={i} style={{
                    position: 'relative', flexShrink: 0,
                    width: 110, height: 110, borderRadius: 12, overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    border: `2px solid ${COLORS.divider}`,
                  }}>
                    <img
                      src={src}
                      alt={`Foto ${i + 1}`}
                      onClick={() => setFotoIngrandita(src)}
                      style={{
                        width: '100%', height: '100%', objectFit: 'cover',
                        cursor: 'zoom-in',
                      }}
                    />
                    {/* Badge numero */}
                    <div style={{
                      position: 'absolute', bottom: 4, left: 4,
                      background: 'rgba(0,0,0,0.55)', color: '#FFF',
                      fontSize: 10, fontWeight: 700, borderRadius: 6, padding: '2px 6px',
                    }}>{i + 1}</div>
                    {/* Bottone elimina */}
                    <button onClick={() => setFoto(prev => prev.filter((_, idx) => idx !== i))} style={{
                      position: 'absolute', top: 4, right: 4,
                      background: 'rgba(198,40,40,0.85)', border: 'none',
                      borderRadius: '50%', width: 26, height: 26, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF',
                    }}>
                      <X size={13} />
                    </button>
                  </div>
                ))}
                {/* Bottone + piccolo per aggiungere ancora */}
                {foto.length < 5 && (
                  <button onClick={() => setShowFotoSheet(true)} style={{
                    flexShrink: 0, width: 110, height: 110, borderRadius: 12,
                    background: '#EFEBE9', border: `2px dashed ${COLORS.primary}`,
                    cursor: 'pointer', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 4,
                    color: COLORS.primary,
                  }}>
                    <Plus size={22} />
                    <span style={{ fontSize: 11, fontWeight: 700 }}>Aggiungi</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* SEZIONE INFO BASE                                              */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <div style={s.sectionCard} className="form-section">
            <h3 style={s.sectionTitle}>📌 Informazioni Base</h3>

            {/* Nome */}
            <div style={{ marginBottom: 14 }}>
              <label style={s.label}>Nome ricetta *</label>
              <FocusInput
                value={nome}
                hasError={Boolean(errori.nome)}
                onChange={e => setNome(e.target.value)}
                placeholder="Es. Frollini al burro classici"
                maxLength={100}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                {errori.nome
                  ? <div style={s.errorMsg}><AlertCircle size={12} /> {errori.nome}</div>
                  : <span />}
                <span style={{ fontSize: 11, color: COLORS.textSecondary }}>{nome.length}/100</span>
              </div>
            </div>

            {/* Categoria */}
            <div style={{ marginBottom: 14 }}>
              <label style={s.label}>Categoria *</label>
              <FocusSelect
                value={categoria}
                hasError={Boolean(errori.categoria)}
                onChange={e => {
                  if (e.target.value === '__nuova__') {
                    setShowNuovaCategoria(true);
                  } else {
                    setCategoria(e.target.value);
                  }
                }}
              >
                {categorie.map(c => (
                  <option key={c.id} value={c.id}>{c.icona} {c.nome}</option>
                ))}
                <option value="__nuova__">➕ Nuova categoria...</option>
              </FocusSelect>
              {errori.categoria && (
                <div style={s.errorMsg}><AlertCircle size={12} /> {errori.categoria}</div>
              )}
            </div>

            {/* Descrizione */}
            <div style={{ marginBottom: 14 }}>
              <label style={s.label}>Descrizione</label>
              <FocusTextarea
                value={descrizione}
                onChange={e => setDescrizione(e.target.value)}
                placeholder="Breve descrizione della ricetta (opzionale)..."
                rows={3}
                maxLength={300}
              />
              <div style={{ textAlign: 'right', fontSize: 11, color: COLORS.textSecondary, marginTop: 3 }}>
                {descrizione.length}/300
              </div>
            </div>

            {/* Resa + Difficoltà */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={s.label}>🍪 Resa (pezzi)</label>
                <FocusInput
                  type="number" min={0}
                  value={resa}
                  onChange={e => setResa(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Es. 60"
                />
              </div>
              <div>
                <label style={s.label}>Difficoltà</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {DIFFICOLTA_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => setDifficolta(opt.value)} style={{
                      flex: 1, minHeight: 48, border: `2px solid ${difficolta === opt.value ? COLORS.primary : COLORS.divider}`,
                      borderRadius: 10, background: difficolta === opt.value ? '#FFF8E1' : '#FFF',
                      cursor: 'pointer', fontSize: 11, fontWeight: 800,
                      color: difficolta === opt.value ? COLORS.primary : COLORS.textSecondary,
                      fontFamily: 'inherit', transition: 'all 0.15s',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                      padding: '6px 4px',
                    }}>
                      <span style={{ fontSize: 9 }}>{opt.icon}</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tempi + Temperatura */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div>
                <label style={s.label}>⏱ Prep (min)</label>
                <FocusInput
                  type="number" min={0}
                  value={tempoPrepMinuti}
                  onChange={e => setTempoPrepMinuti(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="20"
                />
              </div>
              <div>
                <label style={s.label}>🔥 Cottura (min)</label>
                <FocusInput
                  type="number" min={0}
                  value={tempoCotturaMinuti}
                  onChange={e => setTempoCotturaMinuti(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="12"
                />
              </div>
              <div>
                <label style={s.label}>🌡 Forno (°C)</label>
                <FocusInput
                  type="number" min={0}
                  value={temperaturaForno}
                  onChange={e => setTemperaturaForno(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="180"
                />
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* SEZIONE INGREDIENTI                                            */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <div style={s.sectionCard} className="form-section">
            <h3 style={s.sectionTitle}>
              🧂 Ingredienti
              <span style={{
                marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: COLORS.textSecondary,
                background: COLORS.surfaceVariant, borderRadius: 99, padding: '3px 10px',
              }}>
                {ingredienti.length} {ingredienti.length === 1 ? 'ingrediente' : 'ingredienti'}
              </span>
            </h3>

            {errori.ingredienti && (
              <div style={{ ...s.errorMsg, marginBottom: 12, fontSize: 13 }}>
                <AlertCircle size={14} /> {errori.ingredienti}
              </div>
            )}

            <div style={{ fontSize: 11, color: COLORS.textSecondary, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
              <GripVertical size={12} /> Trascina le righe per riordinare
            </div>

            {/* Lista ingredienti */}
            {ingredienti.map((ing, i) => (
              <div
                key={ing._id}
                draggable
                onDragStart={() => onIngDragStart(i)}
                onDragOver={e => onIngDragOver(e, i)}
                onDragEnd={onIngDragEnd}
              >
                <IngredienteRow
                  ing={ing}
                  index={i}
                  suggerimenti={suggerimentiIngredienti}
                  errNome={Boolean(errori[`ing_nome_${i}`])}
                  errQta={Boolean(errori[`ing_qta_${i}`])}
                  onChange={(field, value) => updateIngrediente(i, field, value)}
                  onRemove={() => removeIngrediente(i)}
                />
              </div>
            ))}

            <button onClick={addIngrediente} style={{
              ...s.btn,
              width: '100%', background: '#EFEBE9',
              border: `2px dashed ${COLORS.divider}`,
              borderRadius: 12, padding: '13px', color: COLORS.primary,
              fontSize: 14, fontWeight: 700,
            }}>
              <Plus size={16} /> Aggiungi ingrediente
            </button>
          </div>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* SEZIONE PREPARAZIONE                                           */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <div style={s.sectionCard} className="form-section">
            <h3 style={s.sectionTitle}>
              👨‍🍳 Preparazione
              <span style={{
                marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: COLORS.textSecondary,
                background: COLORS.surfaceVariant, borderRadius: 99, padding: '3px 10px',
              }}>
                {steps.length} {steps.length === 1 ? 'passaggio' : 'passaggi'}
              </span>
            </h3>

            {errori.steps && (
              <div style={{ ...s.errorMsg, marginBottom: 12, fontSize: 13 }}>
                <AlertCircle size={14} /> {errori.steps}
              </div>
            )}

            <div style={{ fontSize: 11, color: COLORS.textSecondary, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
              <GripVertical size={12} /> Trascina per riordinare — i numeri si aggiornano automaticamente
            </div>

            {steps.map((step, i) => (
              <div
                key={step._id}
                draggable
                onDragStart={() => onStepDragStart(i)}
                onDragOver={e => onStepDragOver(e, i)}
                onDragEnd={onStepDragEnd}
              >
                <StepRow
                  step={step}
                  index={i}
                  errDesc={Boolean(errori[`step_${i}`])}
                  onChange={(field, value) => updateStep(i, field, value)}
                  onRemove={() => removeStep(i)}
                />
              </div>
            ))}

            <button onClick={addStep} style={{
              ...s.btn,
              width: '100%', background: '#EFEBE9',
              border: `2px dashed ${COLORS.divider}`,
              borderRadius: 12, padding: '13px', color: COLORS.primary,
              fontSize: 14, fontWeight: 700,
            }}>
              <Plus size={16} /> Aggiungi passaggio
            </button>
          </div>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* SEZIONE TAGS                                                   */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <div style={s.sectionCard} className="form-section">
            <h3 style={s.sectionTitle}><Tag size={17} /> Tags</h3>

            {/* Tags predefiniti */}
            <p style={{ fontSize: 12, color: COLORS.textSecondary, margin: '0 0 10px', fontWeight: 600 }}>
              Tocca per selezionare:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {TAGS_PREDEFINITI.map(t => {
                const sel = tags.includes(t);
                return (
                  <button key={t} onClick={() => toggleTag(t)} style={{
                    border: `2px solid ${sel ? COLORS.primary : COLORS.divider}`,
                    borderRadius: 99, padding: '7px 14px',
                    background: sel ? COLORS.primary : '#FFF',
                    color: sel ? '#FFF' : COLORS.textSecondary,
                    fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    fontFamily: 'inherit', minHeight: 40,
                    display: 'flex', alignItems: 'center', gap: 5,
                    transition: 'all 0.15s',
                  }}>
                    {sel && <Check size={12} />} {t}
                  </button>
                );
              })}
            </div>

            {/* Tag personalizzato */}
            <p style={{ fontSize: 12, color: COLORS.textSecondary, margin: '0 0 8px', fontWeight: 600 }}>
              Aggiungi tag personalizzato:
            </p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <FocusInput
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTagCustom())}
                placeholder="Es. mandorle siciliane"
                style={{ flex: 1 }}
              />
              <button onClick={addTagCustom} disabled={!tagInput.trim()} style={{
                ...s.btn, minWidth: 48, padding: '0 14px',
                background: tagInput.trim() ? COLORS.primary : COLORS.divider,
                color: '#FFF', borderRadius: 12, border: 'none',
              }}>
                <Plus size={18} />
              </button>
            </div>

            {/* Tags selezionati */}
            {tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {tags.map(t => (
                  <div key={t} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: COLORS.primary, color: '#FFF',
                    borderRadius: 99, padding: '6px 12px 6px 14px',
                    fontSize: 13, fontWeight: 700,
                  }}>
                    {t}
                    <button onClick={() => toggleTag(t)} style={{
                      background: 'rgba(255,255,255,0.25)', border: 'none',
                      borderRadius: '50%', width: 18, height: 18, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#FFF', padding: 0,
                    }}>
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* SEZIONE NOTE                                                   */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <div style={s.sectionCard} className="form-section">
            <h3 style={s.sectionTitle}><FileText size={17} /> Note</h3>
            <FocusTextarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Trucchi del mestiere, avvertenze, varianti, consigli di conservazione..."
              rows={4}
              maxLength={1000}
            />
            <div style={{ textAlign: 'right', fontSize: 11, color: COLORS.textSecondary, marginTop: 4 }}>
              {note.length}/1000 caratteri
            </div>
          </div>

        </div>{/* fine padding div */}

        {/* ── BARRA SALVA STICKY ─────────────────────────────────────────── */}
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'rgba(255,248,225,0.95)',
          backdropFilter: 'blur(10px)',
          borderTop: `2px solid ${COLORS.divider}`,
          padding: '12px 16px max(12px, env(safe-area-inset-bottom))',
          zIndex: 600, boxShadow: '0 -4px 20px rgba(121,85,72,0.12)',
        }}>
          <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', gap: 10 }}>
            <button onClick={() => tryNavigate(isModifica ? `/ricetta/${id}` : '/')} style={{
              ...s.btn, flex: 1, background: COLORS.surfaceVariant, color: COLORS.textSecondary,
              fontSize: 14, padding: '15px 0', border: 'none',
            }}>
              Annulla
            </button>
            <button onClick={salva} style={{
              ...s.btn, flex: 3,
              background: 'linear-gradient(135deg, #4b2c20 0%, #795548 50%, #a1887f 100%)',
              color: '#FFF', fontSize: 16, fontWeight: 800, padding: '15px 0', border: 'none',
              boxShadow: '0 4px 16px rgba(121,85,72,0.4)',
              letterSpacing: 0.3,
            }}>
              {isModifica ? '💾 Salva Modifiche' : '✨ Crea Ricetta'}
            </button>
          </div>
        </div>

      </div>
    </>
  );
};

export default CreaModificaRicettaScreen;
