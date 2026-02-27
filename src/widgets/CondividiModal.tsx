import React, { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import type { Ricetta } from '../models/types';

interface CondividiModalProps {
  ricetta: Ricetta;
  categoriaNome: string;
  onClose: () => void;
}

function formattaRicettaTestoWhatsApp(r: Ricetta, catNome: string): string {
  const lines: string[] = [];
  lines.push(`🍪 *${r.nome.toUpperCase()}*`);
  lines.push(`📂 ${catNome}`);
  if (r.descrizione) lines.push(`_${r.descrizione}_`);
  lines.push('');
  lines.push(`🍽 Resa: *${r.resa} pezzi*  |  🌡 Forno: *${r.temperaturaForno}°C*`);
  lines.push(`⏱ Prep: *${r.tempoPrepMinuti} min*  |  🔥 Cottura: *${r.tempoCotturaMinuti} min*`);
  lines.push('');
  lines.push('*INGREDIENTI:*');
  r.ingredienti.forEach(ing => {
    lines.push(`• ${ing.nome} — ${ing.quantita} ${ing.unitaMisura}`);
  });
  lines.push('');
  lines.push('*PREPARAZIONE:*');
  r.steps.forEach(s => {
    let stepLine = `${s.numero}. ${s.descrizione}`;
    const extra: string[] = [];
    if (s.durataMinuti) extra.push(`⏱ ${s.durataMinuti} min`);
    if (s.temperaturaC) extra.push(`🌡 ${s.temperaturaC}°C`);
    if (extra.length) stepLine += ` _(${extra.join(', ')})_`;
    lines.push(stepLine);
  });
  if (r.note) {
    lines.push('');
    lines.push(`📝 *Note:* ${r.note}`);
  }
  if (r.tags.length > 0) {
    lines.push('');
    lines.push(r.tags.map(t => `#${t}`).join(' '));
  }
  return lines.join('\n');
}

export const CondividiModal: React.FC<CondividiModalProps> = ({ ricetta, categoriaNome, onClose }) => {
  const testo = formattaRicettaTestoWhatsApp(ricetta, categoriaNome);
  const [copiato, setCopiato] = useState(false);
  const [visible] = useState(true);

  const handleCopia = async () => {
    try {
      await navigator.clipboard.writeText(testo);
      setCopiato(true);
      setTimeout(() => setCopiato(false), 2500);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = testo;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiato(true);
      setTimeout(() => setCopiato(false), 2500);
    }
  };

  const handleWhatsApp = () => {
    const encoded = encodeURIComponent(testo);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.55)',
        zIndex: 2000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#FFF',
          borderRadius: 20,
          width: '100%',
          maxWidth: 520,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          transform: visible ? 'scale(1)' : 'scale(0.9)',
          transition: 'transform 0.2s',
          boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 20px 16px',
          borderBottom: '1px solid #EFEBE9',
          flexShrink: 0,
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#3E2723' }}>
              📤 Condividi ricetta
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#a1887f' }}>
              Formato pronto per WhatsApp
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#EFEBE9', border: 'none', borderRadius: '50%',
              width: 40, height: 40, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={18} color="#6D4C41" />
          </button>
        </div>

        {/* Testo anteprima */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
          <div style={{
            background: '#E8F5E9',
            borderRadius: 12,
            padding: '14px 16px',
            fontFamily: 'monospace',
            fontSize: 13,
            color: '#1B5E20',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.6,
            border: '1px solid #C8E6C9',
          }}>
            {testo}
          </div>
        </div>

        {/* Azioni */}
        <div style={{
          padding: '16px 20px 20px',
          borderTop: '1px solid #EFEBE9',
          display: 'flex', gap: 12,
          flexShrink: 0,
        }}>
          <button
            onClick={handleCopia}
            style={{
              flex: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: copiato ? '#4CAF50' : '#EFEBE9',
              color: copiato ? '#FFF' : '#3E2723',
              border: 'none', borderRadius: 12,
              padding: '14px', fontSize: 15, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
              transition: 'background 0.3s, color 0.3s',
              minHeight: 48,
            }}
          >
            {copiato ? <Check size={18} /> : <Copy size={18} />}
            {copiato ? 'Copiato!' : 'Copia testo'}
          </button>
          <button
            onClick={handleWhatsApp}
            style={{
              flex: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: '#25D366',
              color: '#FFF',
              border: 'none', borderRadius: 12,
              padding: '14px', fontSize: 15, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
              minHeight: 48,
            }}
          >
            <span style={{ fontSize: 18 }}>💬</span>
            WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};
