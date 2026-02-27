import React from 'react';

// ── Shimmer base ───────────────────────────────────────────────────────────
const shimmerKeyframes = `
@keyframes shimmer {
  0%   { background-position: -600px 0; }
  100% { background-position: 600px 0; }
}
`;

interface ShimmerBoxProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: number | string;
  style?: React.CSSProperties;
}

export const ShimmerBox: React.FC<ShimmerBoxProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}) => (
  <>
    <style>{shimmerKeyframes}</style>
    <div style={{
      width,
      height,
      borderRadius,
      background: 'linear-gradient(90deg, #EDE0D4 25%, #F5EBE0 50%, #EDE0D4 75%)',
      backgroundSize: '600px 100%',
      animation: 'shimmer 1.4s ease-in-out infinite',
      flexShrink: 0,
      ...style,
    }} />
  </>
);

// ── Shimmer card per lista ricette ─────────────────────────────────────────
export const ShimmerRicettaCard: React.FC = () => (
  <div style={{
    background: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    display: 'flex',
    gap: 16,
    alignItems: 'flex-start',
    boxShadow: '0 2px 8px rgba(121,85,72,0.08)',
    marginBottom: 12,
  }}>
    <ShimmerBox width={90} height={90} borderRadius={12} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <ShimmerBox width="70%" height={20} />
      <ShimmerBox width="40%" height={14} />
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <ShimmerBox width={60} height={12} borderRadius={99} />
        <ShimmerBox width={60} height={12} borderRadius={99} />
        <ShimmerBox width={60} height={12} borderRadius={99} />
      </div>
    </div>
  </div>
);

// ── Shimmer lista completa ─────────────────────────────────────────────────
export const ShimmerListaRicette: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div style={{ padding: '16px 16px 0' }}>
    {/* Barra ricerca */}
    <ShimmerBox height={52} borderRadius={16} style={{ marginBottom: 16 }} />
    {/* Cards */}
    {Array.from({ length: count }).map((_, i) => (
      <ShimmerRicettaCard key={i} />
    ))}
  </div>
);

// ── Shimmer home ───────────────────────────────────────────────────────────
export const ShimmerHome: React.FC = () => (
  <div style={{ padding: 0 }}>
    {/* Header hero */}
    <ShimmerBox height={200} borderRadius={0} style={{ marginBottom: 24 }} />

    <div style={{ padding: '0 16px' }}>
      {/* Sezione preferite */}
      <ShimmerBox width={140} height={20} style={{ marginBottom: 12 }} />
      <div style={{ display: 'flex', gap: 12, marginBottom: 28, overflowX: 'hidden' }}>
        {[1,2,3].map(i => <ShimmerBox key={i} width={160} height={120} borderRadius={16} style={{ flexShrink: 0 }} />)}
      </div>

      {/* Sezione categorie */}
      <ShimmerBox width={120} height={20} style={{ marginBottom: 12 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {[1,2,3,4].map(i => <ShimmerBox key={i} height={80} borderRadius={16} />)}
      </div>
    </div>
  </div>
);

// ── Shimmer dettaglio ──────────────────────────────────────────────────────
export const ShimmerDettaglio: React.FC = () => (
  <div>
    <ShimmerBox height={300} borderRadius={0} />
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ShimmerBox width="80%" height={28} />
      <div style={{ display: 'flex', gap: 8 }}>
        {[1,2,3,4].map(i => <ShimmerBox key={i} width={80} height={36} borderRadius={99} />)}
      </div>
      <ShimmerBox height={120} borderRadius={16} />
              {[1,2,3,4,5].map(i => (
          <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <ShimmerBox width={40} height={40} borderRadius={99} />
            <ShimmerBox width="100%" height={16} />
          </div>
        ))}
    </div>
  </div>
);
