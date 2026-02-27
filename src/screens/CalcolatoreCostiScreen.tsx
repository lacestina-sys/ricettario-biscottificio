import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRicettarioStore, usePrezziStore, usePreferenzeStore, calcolaKgEquivalente } from '../providers/store';
import {
  Calculator, TrendingUp, Package, Save, Download,
  AlertTriangle, ChevronRight, Info, DollarSign,
} from 'lucide-react';
import { COLORS } from '../config/constants';

// ── Tipi interni ──────────────────────────────────────────────────────────
interface IngredienteAggregato {
  nome: string;
  unita: string; // unità più comune
  usatoIn: string[]; // nomi ricette
}

interface RigaCosto {
  id: string;
  nome: string;
  costoTotale: number | null;
  costoPezzo: number | null;
  ingredientiMancanti: number;
}

// ── Helper arrotondamento display ─────────────────────────────────────────
function fmtEuro(n: number): string {
  return n < 0.01 ? `€${n.toFixed(4)}` : `€${n.toFixed(2)}`;
}

// ── Componente ────────────────────────────────────────────────────────────
export const CalcolatoreCostiScreen: React.FC = () => {
  const navigate = useNavigate();
  const ricette = useRicettarioStore(s => s.ricette);
  const { prezzi, salvaTuttiIPrezzi, caricaPrezzi } = usePrezziStore();
  const { preferenze, setPreferenza } = usePreferenzeStore();
  const [prezziLocali, setPrezziLocali] = useState<Record<string, string>>(() =>
    Object.fromEntries(Object.entries(prezzi).map(([k, v]) => [k, String(v)]))
  );
  const [saved, setSaved] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [margine, setMargine] = useState(preferenze.margineDefault);
  const prezziSectionRef = useRef<HTMLDivElement>(null);

  // ── Ingredienti aggregati (no duplicati) ───────────────────────────────
  const ingredientiAggregati = useMemo<IngredienteAggregato[]>(() => {
    const mappa = new Map<string, IngredienteAggregato>();
    ricette.forEach(r => {
      r.ingredienti.forEach(ing => {
        const key = ing.nome.trim().toLowerCase();
        const nome = ing.nome.trim();
        if (!mappa.has(key)) {
          mappa.set(key, { nome, unita: ing.unitaMisura, usatoIn: [r.nome] });
        } else {
          const ex = mappa.get(key)!;
          if (!ex.usatoIn.includes(r.nome)) ex.usatoIn.push(r.nome);
        }
      });
    });
    return Array.from(mappa.values()).sort((a, b) => a.nome.localeCompare(b.nome, 'it'));
  }, [ricette]);

  // ── Calcolo costi per ogni ricetta ─────────────────────────────────────
  const rigeCosti = useMemo<RigaCosto[]>(() => {
    return ricette
      .map(r => {
        let costoTot = 0;
        let mancanti = 0;
        r.ingredienti.forEach(ing => {
          const key = ing.nome.trim().toLowerCase();
          // Priorità: prezziStore > costoAlKg nella ricetta
          const prezzoKg = prezzi[key] ?? prezzi[ing.nome] ?? ing.costoAlKg;
          const kg = calcolaKgEquivalente(ing.quantita, ing.unitaMisura);
          if (prezzoKg && kg > 0) {
            costoTot += kg * prezzoKg;
          } else if (!prezzoKg) {
            mancanti++;
          }
        });
        const haAlmenoUnPrezzo = r.ingredienti.some(ing => {
          const key = ing.nome.trim().toLowerCase();
          return !!(prezzi[key] ?? prezzi[ing.nome] ?? ing.costoAlKg);
        });
        return {
          id: r.id,
          nome: r.nome,
          costoTotale: haAlmenoUnPrezzo ? costoTot : null,
          costoPezzo: (haAlmenoUnPrezzo && r.resa > 0) ? costoTot / r.resa : null,
          ingredientiMancanti: mancanti,
        };
      })
      .sort((a, b) => (b.costoTotale ?? -1) - (a.costoTotale ?? -1));
  }, [ricette, prezzi]);

  const haAlmenoUnPrezzo = Object.keys(prezzi).length > 0 ||
    ricette.some(r => r.ingredienti.some(i => i.costoAlKg));

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleCambioPrezzo = useCallback((nome: string, val: string) => {
    setPrezziLocali(p => ({ ...p, [nome.toLowerCase()]: val }));
    setSaved(false);
  }, []);

  const salvaPrezzi = useCallback(() => {
    const nuovi: Record<string, number> = {};
    Object.entries(prezziLocali).forEach(([k, v]) => {
      const n = parseFloat(v.replace(',', '.'));
      if (!isNaN(n) && n > 0) nuovi[k] = n;
    });
    salvaTuttiIPrezzi(nuovi);
    caricaPrezzi();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }, [prezziLocali, salvaTuttiIPrezzi, caricaPrezzi]);

  const esportaCSV = useCallback(() => {
    setExporting(true);
    const righe = [
      ['Nome Ricetta', 'Costo Totale (€)', 'Costo per Pezzo (€)', `Prezzo Vendita (€) @ ${margine}% margine`],
      ...rigeCosti.map(r => {
        const prezzoVendita = r.costoPezzo
          ? r.costoPezzo * (1 + margine / 100)
          : null;
        return [
          r.nome,
          r.costoTotale?.toFixed(2) ?? 'N/D',
          r.costoPezzo?.toFixed(4) ?? 'N/D',
          prezzoVendita?.toFixed(3) ?? 'N/D',
        ];
      }),
    ];
    const csv = righe.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const oggi = new Date().toLocaleDateString('it-IT').replace(/\//g, '-');
    a.download = `costi_${oggi}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setTimeout(() => setExporting(false), 800);
  }, [rigeCosti, margine]);

  // ── Esempio margine real-time ───────────────────────────────────────────
  const esempioMargine = useMemo(() => {
    const costoBase = 0.10;
    const prezzoVendita = costoBase * (1 + margine / 100);
    return { costoBase, prezzoVendita };
  }, [margine]);

  return (
    <div style={{ minHeight: '100%', background: COLORS.background }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #795548 0%, #a1887f 100%)',
        padding: '24px 20px 32px',
        color: '#FFF',
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <Calculator size={28} />
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Calcolatore Costi</h1>
          </div>
          <p style={{ fontSize: 14, color: '#FFECB3', margin: 0 }}>
            Gestisci i prezzi degli ingredienti e analizza la redditività delle ricette
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 16px 100px' }}>

        {/* ── SEZIONE PREZZI INGREDIENTI ───────────────────────────────── */}
        <div ref={prezziSectionRef} style={{
          background: '#FFF', borderRadius: 20, marginTop: -16,
          boxShadow: '0 4px 20px rgba(121,85,72,0.12)', overflow: 'hidden', marginBottom: 20,
        }}>
          {/* Header card */}
          <div style={{
            background: 'linear-gradient(135deg, #FFF8E1, #FFECB3)',
            padding: '16px 20px',
            borderBottom: '1px solid #D7CCC8',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Package size={18} color={COLORS.primary} />
              <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.onBackground }}>
                Prezzi Ingredienti
              </span>
              <span style={{
                background: COLORS.primary, color: '#FFF',
                borderRadius: 999, fontSize: 11, fontWeight: 700,
                padding: '2px 8px',
              }}>
                {ingredientiAggregati.length}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: COLORS.textSecondary }}>
              <Info size={13} />
              <span>Valori in €/kg o €/l</span>
            </div>
          </div>

          {/* Lista ingredienti */}
          {ingredientiAggregati.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: COLORS.textSecondary }}>
              <Package size={40} color="#D7CCC8" style={{ marginBottom: 12 }} />
              <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Nessun ingrediente trovato</p>
              <p style={{ margin: '6px 0 0', fontSize: 13 }}>Crea prima alcune ricette con ingredienti</p>
            </div>
          ) : (
            <div>
              {ingredientiAggregati.map((ing, i) => {
                const key = ing.nome.toLowerCase();
                const val = prezziLocali[key] ?? '';
                const calcolabile = ['g', 'kg', 'ml', 'l'].includes(ing.unita);
                return (
                  <div key={ing.nome} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 20px',
                    borderBottom: i < ingredientiAggregati.length - 1 ? '1px solid #EFEBE9' : 'none',
                    background: i % 2 === 0 ? '#FFF' : '#FAFAFA',
                  }}>
                    {/* Nome e info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.onBackground }}>
                        {ing.nome}
                      </div>
                      <div style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 1 }}>
                        Usato in: {ing.usatoIn.slice(0, 2).join(', ')}
                        {ing.usatoIn.length > 2 && ` +${ing.usatoIn.length - 2}`}
                      </div>
                    </div>

                    {/* Campo prezzo */}
                    {calcolabile ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{
                          display: 'flex', alignItems: 'center',
                          border: `2px solid ${val ? COLORS.primary : '#D7CCC8'}`,
                          borderRadius: 10, overflow: 'hidden',
                          background: '#FFF',
                          transition: 'border-color 0.2s',
                        }}>
                          <span style={{
                            padding: '8px 10px', fontSize: 14, fontWeight: 700,
                            color: COLORS.primary, background: '#FFF8E1',
                            borderRight: '1px solid #D7CCC8',
                          }}>€</span>
                          <input
                            type="number"
                            inputMode="decimal"
                            placeholder="0.00"
                            value={val}
                            onChange={e => handleCambioPrezzo(ing.nome, e.target.value)}
                            style={{
                              width: 72, padding: '8px 10px', border: 'none', outline: 'none',
                              fontSize: 15, fontWeight: 700, color: COLORS.onBackground,
                              fontFamily: 'inherit', background: 'transparent',
                            }}
                          />
                        </div>
                        <span style={{ fontSize: 11, color: COLORS.textSecondary, whiteSpace: 'nowrap' }}>
                          /{['g', 'ml'].includes(ing.unita) ? 'kg' : ing.unita === 'l' ? 'l' : 'kg'}
                        </span>
                      </div>
                    ) : (
                      <div style={{
                        padding: '8px 12px', borderRadius: 8,
                        background: '#FFF8E1', border: '1px dashed #D7CCC8',
                        fontSize: 12, color: COLORS.textSecondary, fontStyle: 'italic',
                      }}>
                        Non pesabile
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── PULSANTE SALVA PREZZI sticky ─────────────────────────────── */}
        <div style={{
          position: 'sticky', bottom: 80, zIndex: 50,
          display: 'flex', gap: 12, marginBottom: 20,
        }}>
          <button
            onClick={salvaPrezzi}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '16px', borderRadius: 14, border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 15, fontWeight: 700,
              background: saved
                ? 'linear-gradient(135deg, #4CAF50, #66BB6A)'
                : 'linear-gradient(135deg, #795548, #a1887f)',
              color: '#FFF',
              boxShadow: '0 4px 16px rgba(121,85,72,0.35)',
              transition: 'background 0.3s',
              minHeight: 54,
            }}
          >
            <Save size={18} />
            {saved ? '✅ Prezzi salvati!' : 'Salva prezzi'}
          </button>
        </div>

        {/* ── MARGINE PREDEFINITO ───────────────────────────────────────── */}
        <div style={{
          background: '#FFF', borderRadius: 20,
          boxShadow: '0 2px 12px rgba(121,85,72,0.10)',
          padding: 20, marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <TrendingUp size={18} color={COLORS.primary} />
            <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.onBackground }}>
              Margine Predefinito
            </span>
          </div>

          {/* Slider */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 14, color: COLORS.textSecondary }}>Margine di guadagno</span>
              <span style={{
                background: COLORS.accent, color: '#3E2723',
                borderRadius: 999, padding: '3px 12px',
                fontSize: 14, fontWeight: 800,
              }}>{margine}%</span>
            </div>
            <input
              type="range" min={0} max={200} step={5}
              value={margine}
              onChange={e => {
                const v = Number(e.target.value);
                setMargine(v);
                setPreferenza('margineDefault', v);
              }}
              style={{ width: '100%', accentColor: COLORS.primary, height: 6, cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#a1887f', marginTop: 4 }}>
              <span>0%</span><span>50%</span><span>100%</span><span>150%</span><span>200%</span>
            </div>
          </div>

          {/* Esempio in tempo reale */}
          <div style={{
            background: 'linear-gradient(135deg, #FFF8E1, #FFF3CD)',
            borderRadius: 12, padding: '14px 16px',
            border: '1px solid #FFD54F',
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textSecondary, marginBottom: 6 }}>
              📊 Esempio in tempo reale
            </div>
            <div style={{ fontSize: 14, color: COLORS.onBackground, fontWeight: 500 }}>
              Con margine <strong>{margine}%</strong>: un biscotto che costa{' '}
              <strong>{fmtEuro(esempioMargine.costoBase)}</strong>{' '}
              → vendi a{' '}
              <strong style={{ color: COLORS.primary, fontSize: 16 }}>
                {fmtEuro(esempioMargine.prezzoVendita)}
              </strong>
            </div>
          </div>
        </div>

        {/* ── ANALISI RICETTE ───────────────────────────────────────────── */}
        <div style={{
          background: '#FFF', borderRadius: 20,
          boxShadow: '0 2px 12px rgba(121,85,72,0.10)',
          overflow: 'hidden', marginBottom: 20,
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #FFF8E1, #FFECB3)',
            padding: '16px 20px',
            borderBottom: '1px solid #D7CCC8',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={18} color={COLORS.primary} />
              <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.onBackground }}>
                Analisi Ricette
              </span>
            </div>
            <button
              onClick={esportaCSV}
              disabled={exporting || ricette.length === 0}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: exporting ? '#EFEBE9' : 'linear-gradient(135deg, #795548, #a1887f)',
                color: exporting ? '#a1887f' : '#FFF',
                border: 'none', borderRadius: 10, padding: '8px 14px',
                fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
                minHeight: 38, transition: 'all 0.2s',
              }}
            >
              <Download size={14} />
              {exporting ? 'Esportando…' : 'CSV'}
            </button>
          </div>

          {/* Avviso nessun prezzo */}
          {!haAlmenoUnPrezzo && (
            <div style={{
              margin: 16, padding: '12px 16px',
              background: '#FFF8E1', border: '2px solid #FFC107',
              borderRadius: 12, display: 'flex', alignItems: 'flex-start', gap: 10,
            }}>
              <AlertTriangle size={18} color="#FF8F00" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, fontSize: 13, color: COLORS.textSecondary, fontWeight: 600 }}>
                Inserisci i prezzi degli ingredienti per vedere i costi calcolati
              </p>
            </div>
          )}

          {/* Header tabella */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 90px 90px 90px 28px',
            gap: 8, padding: '10px 20px',
            background: '#EFEBE9',
            fontSize: 11, fontWeight: 700, color: COLORS.textSecondary,
          }}>
            <span>RICETTA</span>
            <span style={{ textAlign: 'right' }}>COSTO TOT</span>
            <span style={{ textAlign: 'right' }}>COSTO/PZ</span>
            <span style={{ textAlign: 'right' }}>VENDITA/PZ</span>
            <span />
          </div>

          {/* Righe */}
          {rigeCosti.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: COLORS.textSecondary }}>
              <Calculator size={40} color="#D7CCC8" style={{ marginBottom: 12 }} />
              <p style={{ margin: 0, fontWeight: 600 }}>Nessuna ricetta trovata</p>
            </div>
          ) : (
            rigeCosti.map((riga, i) => {
              const prezzoVendita = riga.costoPezzo ? riga.costoPezzo * (1 + margine / 100) : null;
              const ricetta = ricette.find(r => r.id === riga.id);
              return (
                <div
                  key={riga.id}
                  onClick={() => navigate(`/ricetta/${riga.id}?tab=costi`)}
                  style={{
                    display: 'grid', gridTemplateColumns: '1fr 90px 90px 90px 28px',
                    gap: 8, padding: '14px 20px',
                    borderBottom: i < rigeCosti.length - 1 ? '1px solid #EFEBE9' : 'none',
                    background: i % 2 === 0 ? '#FFF' : '#FAFAFA',
                    cursor: 'pointer', transition: 'background 0.15s',
                    alignItems: 'center',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#FFF8E1')}
                  onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? '#FFF' : '#FAFAFA')}
                >
                  {/* Nome */}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.onBackground }}>
                      {riga.nome}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      {riga.ingredientiMancanti > 0 && (
                        <span style={{
                          display: 'flex', alignItems: 'center', gap: 3,
                          fontSize: 10, color: '#FF8F00', fontWeight: 600,
                        }}>
                          <AlertTriangle size={10} />
                          {riga.ingredientiMancanti} senza prezzo
                        </span>
                      )}
                      {ricetta && (
                        <span style={{ fontSize: 10, color: '#a1887f' }}>
                          {ricetta.resa} pz
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Costo totale */}
                  <div style={{ textAlign: 'right' }}>
                    {riga.costoTotale !== null ? (
                      <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.onBackground }}>
                        {fmtEuro(riga.costoTotale)}
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, color: '#a1887f' }}>N/D</span>
                    )}
                  </div>

                  {/* Costo per pezzo */}
                  <div style={{ textAlign: 'right' }}>
                    {riga.costoPezzo !== null ? (
                      <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.textSecondary }}>
                        {riga.costoPezzo < 0.01
                          ? `€${riga.costoPezzo.toFixed(4)}`
                          : `€${riga.costoPezzo.toFixed(3)}`}
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, color: '#a1887f' }}>N/D</span>
                    )}
                  </div>

                  {/* Prezzo vendita */}
                  <div style={{ textAlign: 'right' }}>
                    {prezzoVendita !== null ? (
                      <span style={{
                        fontSize: 13, fontWeight: 800, color: COLORS.primary,
                      }}>
                        {prezzoVendita < 0.01
                          ? `€${prezzoVendita.toFixed(4)}`
                          : `€${prezzoVendita.toFixed(3)}`}
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, color: '#a1887f' }}>N/D</span>
                    )}
                  </div>

                  <ChevronRight size={16} color="#D7CCC8" />
                </div>
              );
            })
          )}

          {/* Footer totali */}
          {haAlmenoUnPrezzo && rigeCosti.some(r => r.costoTotale !== null) && (
            <div style={{
              padding: '16px 20px',
              background: 'linear-gradient(135deg, #795548, #6D4C41)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#FFECB3' }}>
                <DollarSign size={14} style={{ verticalAlign: 'middle' }} /> Totale materie prime (tutte le ricette)
              </span>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#FFF' }}>
                {fmtEuro(rigeCosti.reduce((s, r) => s + (r.costoTotale ?? 0), 0))}
              </span>
            </div>
          )}
        </div>

        {/* ── LEGENDA ───────────────────────────────────────────────────── */}
        <div style={{
          background: '#FFF', borderRadius: 16, padding: '14px 18px',
          boxShadow: '0 2px 8px rgba(121,85,72,0.08)',
          display: 'flex', flexWrap: 'wrap', gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS.primary }} />
            <span style={{ fontSize: 12, color: COLORS.textSecondary }}>Prezzo vendita suggerito con margine {margine}%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={10} color="#FF8F00" />
            <span style={{ fontSize: 12, color: COLORS.textSecondary }}>Ingredienti senza prezzo (calcolo parziale)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: COLORS.textSecondary }}>Tap su una ricetta → apre il tab Costi nel dettaglio</span>
          </div>
        </div>
      </div>
    </div>
  );
};
