import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Play, Pause, RotateCcw, Plus } from 'lucide-react';

interface TimerBottomSheetProps {
  durataMinuti: number;
  nomeStep: string;
  onClose: () => void;
}

type TimerState = 'idle' | 'running' | 'paused' | 'finished';

export const TimerBottomSheet: React.FC<TimerBottomSheetProps> = ({
  durataMinuti,
  nomeStep,
  onClose,
}) => {
  const totalSecondi = durataMinuti * 60;
  const [secondiRimanenti, setSecondiRimanenti] = useState(totalSecondi);
  const [stato, setStato] = useState<TimerState>('idle');
  const [visible, setVisible] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<AudioContext | null>(null);

  // Animazione entrata
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const suonaAllarme = useCallback(() => {
    try {
      const ctx = new AudioContext();
      audioRef.current = ctx;
      // Genera tre bip
      [0, 0.4, 0.8].forEach(offset => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0, ctx.currentTime + offset);
        gain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + offset + 0.05);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + offset + 0.35);
        osc.start(ctx.currentTime + offset);
        osc.stop(ctx.currentTime + offset + 0.4);
      });
    } catch {
      // AudioContext non disponibile
    }
    // Vibrazione (solo mobile)
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 400]);
    }
  }, []);

  useEffect(() => {
    if (stato === 'running') {
      intervalRef.current = setInterval(() => {
        setSecondiRimanenti(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setStato('finished');
            suonaAllarme();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [stato, suonaAllarme]);

  const handleStartPausa = () => {
    if (stato === 'idle' || stato === 'paused') setStato('running');
    else if (stato === 'running') setStato('paused');
    else if (stato === 'finished') {
      setSecondiRimanenti(totalSecondi);
      setStato('running');
    }
  };

  const handleReset = () => {
    setStato('idle');
    setSecondiRimanenti(totalSecondi);
  };

  const aggiungiTempo = (minuti: number) => {
    setSecondiRimanenti(p => p + minuti * 60);
    if (stato === 'finished') setStato('paused');
  };

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const mm = Math.floor(secondiRimanenti / 60).toString().padStart(2, '0');
  const ss = (secondiRimanenti % 60).toString().padStart(2, '0');

  const progressPercent = totalSecondi > 0
    ? ((totalSecondi - secondiRimanenti) / totalSecondi) * 100
    : 0;

  const coloreTimer =
    stato === 'finished' ? '#c62828'
    : secondiRimanenti <= 30 ? '#FF5722'
    : stato === 'running' ? '#795548'
    : '#a1887f';

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0,
        background: visible ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0)',
        zIndex: 2000,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        transition: 'background 0.3s',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#FFF',
          borderRadius: '24px 24px 0 0',
          padding: '0 0 32px',
          width: '100%',
          maxWidth: 480,
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.2)',
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 40, height: 4, background: '#D7CCC8', borderRadius: 999 }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 20px 0',
        }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: '#a1887f', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              ⏱ Timer
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 14, color: '#3E2723', fontWeight: 700 }}>
              {nomeStep}
            </p>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: '#EFEBE9', border: 'none', borderRadius: '50%',
              width: 40, height: 40, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={18} color="#6D4C41" />
          </button>
        </div>

        {/* Progress ring area */}
        <div style={{ padding: '32px 20px 24px', textAlign: 'center' }}>
          {/* Circular progress */}
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 8 }}>
            <svg width={200} height={200} style={{ transform: 'rotate(-90deg)' }}>
              {/* Background circle */}
              <circle
                cx={100} cy={100} r={88}
                fill="none"
                stroke="#EFEBE9"
                strokeWidth={10}
              />
              {/* Progress circle */}
              <circle
                cx={100} cy={100} r={88}
                fill="none"
                stroke={coloreTimer}
                strokeWidth={10}
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 88}`}
                strokeDashoffset={`${2 * Math.PI * 88 * (1 - progressPercent / 100)}`}
                style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s' }}
              />
            </svg>
            {/* Testo centrale */}
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{
                fontSize: 52, fontWeight: 800,
                color: coloreTimer,
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: -2,
                lineHeight: 1,
                transition: 'color 0.3s',
              }}>
                {mm}:{ss}
              </span>
              <span style={{ fontSize: 13, color: '#a1887f', fontWeight: 600, marginTop: 4 }}>
                {stato === 'finished' ? '🔔 Tempo scaduto!' :
                 stato === 'running' ? 'in corso' :
                 stato === 'paused' ? 'in pausa' : 'pronto'}
              </span>
            </div>
          </div>

          {/* Pulsanti +tempo */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 28 }}>
            <button
              onClick={() => aggiungiTempo(1)}
              style={addTimeBtn}
            >
              <Plus size={14} /> +1 min
            </button>
            <button
              onClick={() => aggiungiTempo(5)}
              style={addTimeBtn}
            >
              <Plus size={14} /> +5 min
            </button>
          </div>

          {/* Controlli principali */}
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'center' }}>
            {/* Reset */}
            <button
              onClick={handleReset}
              style={{
                background: '#EFEBE9', border: 'none', borderRadius: '50%',
                width: 56, height: 56, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <RotateCcw size={22} color="#6D4C41" />
            </button>

            {/* Start / Pausa */}
            <button
              onClick={handleStartPausa}
              style={{
                background: stato === 'finished' ? '#c62828' :
                            stato === 'running' ? '#FFC107' : '#795548',
                border: 'none', borderRadius: '50%',
                width: 80, height: 80, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(121,85,72,0.35)',
                transition: 'background 0.3s, transform 0.15s',
              }}
            >
              {stato === 'running'
                ? <Pause size={32} color="#3E2723" fill="#3E2723" />
                : <Play size={32} color="#FFF" fill="#FFF" style={{ marginLeft: 4 }} />
              }
            </button>

            {/* Placeholder spazio */}
            <div style={{ width: 56, height: 56 }} />
          </div>
        </div>
      </div>
    </div>
  );
};

const addTimeBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 4,
  background: '#FFF8E1', border: '1.5px solid #FFC107',
  borderRadius: 999, padding: '6px 14px',
  fontSize: 13, fontWeight: 700, color: '#795548',
  cursor: 'pointer', fontFamily: 'inherit',
};
