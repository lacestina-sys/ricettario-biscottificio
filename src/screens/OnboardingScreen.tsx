import React, { useState, useRef, useCallback } from 'react';
import { ChevronRight, X } from 'lucide-react';

interface OnboardingScreenProps {
  onComplete: () => void;
}

// ── Dati slide ─────────────────────────────────────────────────────────────
const SLIDES = [
  {
    emoji: '🍪',
    titolo: 'Benvenuto nel tuo Ricettario',
    sottotitolo: 'Tutte le ricette del tuo biscottificio,\nsempre con te in laboratorio.',
    bg: 'linear-gradient(145deg, #FFF8E1 0%, #FFECB3 100%)',
    accentColor: '#FFC107',
    decorazioni: ['✨', '🧁', '🎂'],
  },
  {
    emoji: '📊',
    titolo: 'Scala le dosi in un tap',
    sottotitolo: 'Da 50 a 500 biscotti?\nRicalcola tutto in automatico, istantaneamente.',
    bg: 'linear-gradient(145deg, #FFF8E1 0%, #D7CCC8 100%)',
    accentColor: '#795548',
    decorazioni: ['⚖️', '🔢', '✅'],
  },
  {
    emoji: '📱',
    titolo: 'Tutto offline, sempre disponibile',
    sottotitolo: 'Nessun internet necessario.\nI tuoi dati restano sul dispositivo.',
    bg: 'linear-gradient(145deg, #FFF8E1 0%, #C8E6C9 100%)',
    accentColor: '#4CAF50',
    decorazioni: ['🔒', '💾', '🌟'],
  },
] as const;

const DB_KEY_ONBOARDING = 'ricettario_onboarding_done';

export function isOnboardingDone(): boolean {
  return localStorage.getItem(DB_KEY_ONBOARDING) === 'true';
}

function markOnboardingDone() {
  localStorage.setItem(DB_KEY_ONBOARDING, 'true');
}

// ── Componente ─────────────────────────────────────────────────────────────
export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [slideDir, setSlideDir] = useState<'left' | 'right'>('left');
  const [animating, setAnimating] = useState(false);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const goToSlide = useCallback((idx: number) => {
    if (animating || idx === currentIndex) return;
    setSlideDir(idx > currentIndex ? 'left' : 'right');
    setAnimating(true);
    setTimeout(() => {
      setCurrentIndex(idx);
      setAnimating(false);
    }, 300);
  }, [animating, currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < SLIDES.length - 1) {
      goToSlide(currentIndex + 1);
    } else {
      handleComplete();
    }
  }, [currentIndex, goToSlide]);

  const handleComplete = useCallback(() => {
    setIsExiting(true);
    markOnboardingDone();
    setTimeout(onComplete, 500);
  }, [onComplete]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentIndex < SLIDES.length - 1) goToSlide(currentIndex + 1);
      if (diff < 0 && currentIndex > 0) goToSlide(currentIndex - 1);
    }
  };

  const slide = SLIDES[currentIndex];
  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <>
      <style>{`
        @keyframes onboardingFadeIn {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes onboardingFadeOut {
          from { opacity: 1; transform: scale(1); }
          to   { opacity: 0; transform: scale(1.05); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(60px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(-60px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes floatEmoji {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33%  { transform: translateY(-12px) rotate(5deg); }
          66%  { transform: translateY(-6px) rotate(-3deg); }
        }
        @keyframes pulseBtn {
          0%, 100% { box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
          50%  { box-shadow: 0 8px 32px rgba(0,0,0,0.25); }
        }
        .onboarding-btn-primary {
          animation: pulseBtn 2s ease-in-out infinite;
        }
        .onboarding-btn-primary:hover {
          transform: scale(1.03) !important;
        }
        .onboarding-btn-primary:active {
          transform: scale(0.97) !important;
        }
        .onboarding-skip:hover {
          background: rgba(0,0,0,0.08) !important;
        }
        .onboarding-dot:hover {
          transform: scale(1.3);
        }
      `}</style>

      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9000,
          background: slide.bg,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'background 0.5s ease',
          animation: isExiting
            ? 'onboardingFadeOut 0.5s ease forwards'
            : 'onboardingFadeIn 0.5s ease both',
          fontFamily: '"Nunito", sans-serif',
          userSelect: 'none',
          padding: 'env(safe-area-inset-top, 0px) 0 env(safe-area-inset-bottom, 0px)',
        }}
      >

        {/* Top bar: Salta */}
        <div style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'flex-end',
          padding: '16px 20px 0',
        }}>
          {!isLast ? (
            <button
              className="onboarding-skip"
              onClick={handleComplete}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px',
                borderRadius: 99,
                border: 'none',
                background: 'rgba(0,0,0,0.06)',
                color: '#795548',
                fontFamily: 'inherit',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >
              Salta <X size={14} />
            </button>
          ) : <div style={{ height: 40 }} />}
        </div>

        {/* Area centrale: emoji + testo */}
        <div
          key={currentIndex}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 32px',
            textAlign: 'center',
            animation: animating
              ? 'none'
              : slideDir === 'left'
                ? 'slideInLeft 0.35s cubic-bezier(0.22, 1, 0.36, 1) both'
                : 'slideInRight 0.35s cubic-bezier(0.22, 1, 0.36, 1) both',
            opacity: animating ? 0 : 1,
            transition: animating ? 'opacity 0.15s ease' : 'none',
          }}
        >
          {/* Decorazioni floating */}
          <div style={{ position: 'relative', marginBottom: 32 }}>
            {slide.decorazioni.map((d, i) => (
              <span key={i} style={{
                position: 'absolute',
                fontSize: 24,
                opacity: 0.6,
                animation: `floatEmoji ${2.5 + i * 0.5}s ease-in-out infinite`,
                animationDelay: `${i * 0.4}s`,
                top: i === 0 ? -40 : i === 1 ? -20 : -50,
                left: i === 0 ? -60 : i === 1 ? 80 : 30,
              }}>{d}</span>
            ))}

            {/* Emoji principale */}
            <div style={{
              width: 140,
              height: 140,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.6)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 72,
              boxShadow: `0 20px 60px ${slide.accentColor}40`,
              border: `3px solid ${slide.accentColor}30`,
              animation: 'floatEmoji 3s ease-in-out infinite',
            }}>
              {slide.emoji}
            </div>
          </div>

          {/* Numero slide */}
          <div style={{
            fontSize: 12,
            fontWeight: 700,
            color: slide.accentColor,
            letterSpacing: 2,
            textTransform: 'uppercase',
            marginBottom: 12,
            opacity: 0.8,
          }}>
            {currentIndex + 1} di {SLIDES.length}
          </div>

          {/* Titolo */}
          <h1 style={{
            fontSize: 'clamp(22px, 6vw, 30px)',
            fontWeight: 800,
            color: '#3E2723',
            marginBottom: 16,
            lineHeight: 1.2,
            letterSpacing: -0.5,
          }}>
            {slide.titolo}
          </h1>

          {/* Sottotitolo */}
          <p style={{
            fontSize: 'clamp(15px, 4vw, 17px)',
            color: '#6D4C41',
            lineHeight: 1.6,
            maxWidth: 380,
            whiteSpace: 'pre-line',
          }}>
            {slide.sottotitolo}
          </p>

          {/* Feature pills sull'ultima slide */}
          {isLast && (
            <div style={{
              marginTop: 32,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
              justifyContent: 'center',
            }}>
              {['Ricette illimitate', 'Scala dosi', 'Calcola costi', 'Backup & Ripristino'].map(f => (
                <div key={f} style={{
                  padding: '8px 16px',
                  background: 'rgba(255,255,255,0.7)',
                  borderRadius: 99,
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#4CAF50',
                  border: '1.5px solid #4CAF5040',
                  backdropFilter: 'blur(4px)',
                }}>
                  ✓ {f}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom: dots + pulsante */}
        <div style={{
          width: '100%',
          padding: '24px 32px 40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 28,
        }}>
          {/* Dots indicator */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {SLIDES.map((_, i) => (
              <button
                key={i}
                className="onboarding-dot"
                onClick={() => goToSlide(i)}
                style={{
                  width: i === currentIndex ? 28 : 8,
                  height: 8,
                  borderRadius: 99,
                  border: 'none',
                  cursor: 'pointer',
                  background: i === currentIndex ? slide.accentColor : 'rgba(0,0,0,0.2)',
                  transition: 'all 0.35s cubic-bezier(0.22,1,0.36,1)',
                  padding: 0,
                }}
              />
            ))}
          </div>

          {/* CTA Button */}
          <button
            className="onboarding-btn-primary"
            onClick={handleNext}
            style={{
              width: '100%',
              maxWidth: 360,
              minHeight: 56,
              borderRadius: 16,
              border: 'none',
              cursor: 'pointer',
              background: isLast
                ? 'linear-gradient(135deg, #4CAF50, #45a049)'
                : `linear-gradient(135deg, ${slide.accentColor}, ${slide.accentColor}CC)`,
              color: '#FFFFFF',
              fontSize: 18,
              fontWeight: 800,
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              transition: 'transform 0.15s ease',
              letterSpacing: 0.3,
            }}
          >
            {isLast ? (
              <>🚀 Inizia!</>
            ) : (
              <>Avanti <ChevronRight size={22} /></>
            )}
          </button>
        </div>
      </div>
    </>
  );
};
