import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRicettarioStore, usePreferenzeStore, usePrezziStore } from '../providers/store';
import { DatabaseService } from '../services/database_service';
import {
  Palette, Type, Scale, Database, Download, Upload,
  Trash2, Info, ChevronRight, Sun, Moon, Monitor,
  AlertTriangle, Check,
} from 'lucide-react';
import { COLORS } from '../config/constants';
import type { Tema, DimensioneTestoApp, PassoScalaDosi } from '../providers/store';

// ── Componenti base ───────────────────────────────────────────────────────
const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{
    background: '#FFF', borderRadius: 20,
    boxShadow: '0 2px 12px rgba(121,85,72,0.10)',
    overflow: 'hidden', marginBottom: 16, ...style,
  }}>
    {children}
  </div>
);

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
  <div style={{
    padding: '14px 20px',
    background: 'linear-gradient(135deg, #FFF8E1, #FFECB3)',
    borderBottom: '1px solid #D7CCC8',
    display: 'flex', alignItems: 'center', gap: 10,
  }}>
    <span style={{ color: COLORS.primary }}>{icon}</span>
    <span style={{ fontSize: 15, fontWeight: 800, color: COLORS.onBackground }}>{title}</span>
  </div>
);

const Row: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{
    padding: '14px 20px', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', gap: 12, ...style,
  }}>
    {children}
  </div>
);

const Toggle: React.FC<{ value: boolean; onChange: (v: boolean) => void }> = ({ value, onChange }) => (
  <button
    onClick={() => onChange(!value)}
    style={{
      width: 52, height: 28, borderRadius: 999, border: 'none', cursor: 'pointer',
      background: value ? COLORS.primary : '#D7CCC8',
      position: 'relative', transition: 'background 0.25s', flexShrink: 0,
    }}
  >
    <div style={{
      position: 'absolute', top: 3, left: value ? 26 : 3,
      width: 22, height: 22, borderRadius: '50%', background: '#FFF',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      transition: 'left 0.25s',
    }} />
  </button>
);

// ── Chip group ─────────────────────────────────────────────────────────────
function ChipGroup<T extends string | number>({
  opzioni, valore, onChange, render,
}: {
  opzioni: T[];
  valore: T;
  onChange: (v: T) => void;
  render?: (v: T) => React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {opzioni.map(op => (
        <button
          key={String(op)}
          onClick={() => onChange(op)}
          style={{
            padding: '8px 16px', borderRadius: 999, border: '2px solid',
            borderColor: valore === op ? COLORS.primary : '#D7CCC8',
            background: valore === op ? COLORS.primary : '#FFF',
            color: valore === op ? '#FFF' : COLORS.textSecondary,
            fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
            transition: 'all 0.15s', minHeight: 40,
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          {render ? render(op) : String(op)}
          {valore === op && <Check size={12} />}
        </button>
      ))}
    </div>
  );
}

// ── Dialog Elimina con conferma testo ─────────────────────────────────────
const DialogConfermaElimina: React.FC<{
  onConferma: () => void;
  onAnnulla: () => void;
}> = ({ onConferma, onAnnulla }) => {
  const [testo, setTesto] = useState('');
  const ok = testo === 'ELIMINA';
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 20,
      animation: 'fadeIn 0.15s ease',
    }}>
      <div style={{
        background: '#FFF', borderRadius: 24, width: '100%', maxWidth: 380,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden',
      }}>
        <div style={{ background: '#FFEBEE', padding: '20px 20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <AlertTriangle size={22} color="#c62828" />
            <h3 style={{ fontSize: 17, fontWeight: 800, color: '#c62828', margin: 0 }}>
              ⚠️ Elimina tutti i dati
            </h3>
          </div>
          <p style={{ fontSize: 14, color: '#b71c1c', margin: 0 }}>
            Questa azione è <strong>irreversibile</strong>. Tutte le ricette, categorie e prezzi
            verranno eliminati permanentemente.
          </p>
        </div>

        <div style={{ padding: 20 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: COLORS.textSecondary, display: 'block', marginBottom: 8 }}>
            Scrivi <strong style={{ color: '#c62828' }}>ELIMINA</strong> per confermare:
          </label>
          <input
            type="text"
            value={testo}
            onChange={e => setTesto(e.target.value)}
            placeholder="Scrivi ELIMINA"
            autoFocus
            style={{
              width: '100%', padding: '13px 14px', boxSizing: 'border-box',
              border: `2px solid ${ok ? '#4CAF50' : '#EF5350'}`,
              borderRadius: 12, fontSize: 15, fontFamily: 'inherit', outline: 'none',
              color: COLORS.onBackground, marginBottom: 16,
              transition: 'border-color 0.2s',
            }}
          />
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onAnnulla} style={{
              flex: 1, padding: '14px', border: 'none', borderRadius: 12,
              background: '#EFEBE9', color: COLORS.textSecondary,
              fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
            }}>
              Annulla
            </button>
            <button onClick={onConferma} disabled={!ok} style={{
              flex: 2, padding: '14px', border: 'none', borderRadius: 12,
              background: ok ? '#c62828' : '#FFCDD2', color: ok ? '#FFF' : '#EF9A9A',
              fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
              cursor: ok ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
            }}>
              🗑 Elimina tutto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Progress overlay ───────────────────────────────────────────────────────
const ProgressOverlay: React.FC<{ messaggio: string }> = ({ messaggio }) => (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(62,39,35,0.85)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    zIndex: 2000, gap: 20,
  }}>
    <div style={{ fontSize: 48 }}>⏳</div>
    <p style={{ fontSize: 17, fontWeight: 700, color: '#FFF', margin: 0 }}>{messaggio}</p>
    <div style={{
      width: 200, height: 6, background: 'rgba(255,255,255,0.2)', borderRadius: 999,
      overflow: 'hidden',
    }}>
      <div style={{
        height: '100%', borderRadius: 999,
        background: 'linear-gradient(90deg, #FFC107, #FF8F00)',
        animation: 'progressAnim 1.5s ease-in-out infinite',
      }} />
    </div>
    <style>{`
      @keyframes progressAnim {
        0% { width: 0%; margin-left: 0 }
        50% { width: 80%; margin-left: 10% }
        100% { width: 100%; margin-left: 0 }
      }
      @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
    `}</style>
  </div>
);

// ── Screen principale ─────────────────────────────────────────────────────
export const ImpostazioniScreen: React.FC = () => {
  const navigate = useNavigate();
  const ricette = useRicettarioStore(s => s.ricette);
  const categorie = useRicettarioStore(s => s.categorie);
  const caricaRicette = useRicettarioStore(s => s.caricaRicette);
  const caricaCategorie = useRicettarioStore(s => s.caricaCategorie);
  const { preferenze, setPreferenza, resetPreferenze } = usePreferenzeStore();
  const { prezzi, caricaPrezzi } = usePrezziStore();
  const [showElimina, setShowElimina] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Applica tema ───────────────────────────────────────────────────────
  useEffect(() => {
    const t = preferenze.tema;
    const isDark = t === 'scuro' || (t === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.style.background = isDark ? '#3E2723' : '#FFF8E1';
  }, [preferenze.tema]);

  // ── Applica dimensione testo ───────────────────────────────────────────
  useEffect(() => {
    const scale = preferenze.dimensioneTesto === 'normale' ? 1
      : preferenze.dimensioneTesto === 'grande' ? 1.15
      : 1.3;
    document.documentElement.style.fontSize = `${16 * scale}px`;
  }, [preferenze.dimensioneTesto]);

  // ── Backup export ──────────────────────────────────────────────────────
  const esportaBackup = async () => {
    setProgress('Esportazione in corso…');
    await new Promise(r => setTimeout(r, 600));
    const backup = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      ricette,
      categorie,
      prezziIngredienti: prezzi,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const oggi = new Date().toLocaleDateString('it-IT').replace(/\//g, '-');
    a.download = `ricettario_backup_${oggi}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setProgress(null);
    showToast('📦 Backup esportato con successo!');
  };

  // ── Backup import ──────────────────────────────────────────────────────
  const importaBackup = () => importRef.current?.click();

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!window.confirm('L\'importazione sovrascriverà TUTTI i dati esistenti (ricette, categorie, prezzi). Continuare?')) return;
    setProgress('Importazione in corso…');
    await new Promise(r => setTimeout(r, 800));
    try {
      const testo = await file.text();
      const dati = JSON.parse(testo);
      if (!dati.ricette || !dati.categorie) throw new Error('Formato non valido');
      localStorage.setItem('ricettario_ricette', JSON.stringify(dati.ricette));
      localStorage.setItem('ricettario_categorie', JSON.stringify(dati.categorie));
      localStorage.setItem('ricettario_init', 'true');
      if (dati.prezziIngredienti) {
        localStorage.setItem('ricettario_prezzi', JSON.stringify(dati.prezziIngredienti));
      }
      caricaRicette();
      caricaCategorie();
      caricaPrezzi();
      setProgress(null);
      showToast(`✅ Importate ${dati.ricette.length} ricette e ${dati.categorie.length} categorie`);
    } catch {
      setProgress(null);
      showToast('❌ File non valido o danneggiato', false);
    }
    if (importRef.current) importRef.current.value = '';
  };

  // ── Reset totale ───────────────────────────────────────────────────────
  const resetTotale = async () => {
    setShowElimina(false);
    setProgress('Eliminazione in corso…');
    await new Promise(r => setTimeout(r, 800));
    localStorage.removeItem('ricettario_ricette');
    localStorage.removeItem('ricettario_categorie');
    localStorage.removeItem('ricettario_init');
    localStorage.removeItem('ricettario_prezzi');
    localStorage.removeItem('ricettario_preferenze');
    localStorage.removeItem('ricettario_bozza');
    resetPreferenze();
    DatabaseService.inizializza();
    caricaRicette();
    caricaCategorie();
    caricaPrezzi();
    setProgress(null);
    showToast('🔄 Tutti i dati eliminati e ripristinati con le ricette di esempio');
  };

  // ── Stats storage ──────────────────────────────────────────────────────
  const statsStorage = () => {
    const bytes = new TextEncoder().encode(JSON.stringify({ ricette, categorie, prezzi })).length;
    return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
  };

  // ── Anteprima dimensione testo ─────────────────────────────────────────
  const anteprimaTesto: Record<DimensioneTestoApp, { size: number; label: string }> = {
    normale: { size: 14, label: 'Testo normale — facile da leggere' },
    grande: { size: 16, label: 'Testo grande — ideale per laboratorio' },
    extra: { size: 19, label: 'Testo extra grande — massima leggibilità' },
  };

  return (
    <div style={{ minHeight: '100%', background: COLORS.background }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #795548 0%, #a1887f 100%)',
        padding: '24px 20px 32px',
      }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#FFF', margin: '0 0 4px' }}>
            ⚙️ Impostazioni
          </h1>
          <p style={{ fontSize: 14, color: '#FFECB3', margin: 0 }}>
            Personalizza l'app e gestisci i tuoi dati
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 16px 40px' }}>

        {/* ── ASPETTO ─────────────────────────────────────────────────── */}
        <div style={{ marginTop: -16, marginBottom: 16 }}>
          <Card>
            <SectionHeader icon={<Palette size={18} />} title="Aspetto" />

            {/* Tema */}
            <Row style={{ borderBottom: '1px solid #EFEBE9', flexWrap: 'wrap', gap: 14 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.onBackground }}>Tema</div>
                <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>Aspetto generale dell'app</div>
              </div>
              <ChipGroup<Tema>
                opzioni={['chiaro', 'scuro', 'auto']}
                valore={preferenze.tema}
                onChange={v => setPreferenza('tema', v)}
                render={v => (
                  <>
                    {v === 'chiaro' ? <Sun size={13} /> : v === 'scuro' ? <Moon size={13} /> : <Monitor size={13} />}
                    {v === 'chiaro' ? 'Chiaro' : v === 'scuro' ? 'Scuro' : 'Auto'}
                  </>
                )}
              />
            </Row>

            {/* Dimensione testo */}
            <div style={{ padding: '14px 20px' }}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.onBackground }}>
                  <Type size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                  Dimensione testo
                </div>
                <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>
                  Ideale per uso in laboratorio con guanti
                </div>
              </div>
              <ChipGroup<DimensioneTestoApp>
                opzioni={['normale', 'grande', 'extra']}
                valore={preferenze.dimensioneTesto}
                onChange={v => setPreferenza('dimensioneTesto', v)}
                render={v => v === 'normale' ? 'Normale' : v === 'grande' ? 'Grande' : 'Extra Grande'}
              />
              {/* Anteprima */}
              <div style={{
                marginTop: 12, padding: '12px 14px', background: '#FFF8E1',
                borderRadius: 10, border: '1px solid #FFD54F',
              }}>
                <span style={{
                  fontSize: anteprimaTesto[preferenze.dimensioneTesto].size,
                  color: COLORS.onBackground, fontWeight: 600,
                  transition: 'font-size 0.3s',
                }}>
                  {anteprimaTesto[preferenze.dimensioneTesto].label}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* ── PREFERENZE ──────────────────────────────────────────────── */}
        <Card>
          <SectionHeader icon={<Scale size={18} />} title="Preferenze" />

          {/* Unità misura */}
          <Row style={{ borderBottom: '1px solid #EFEBE9', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.onBackground }}>
                Unità misura predefinita
              </div>
              <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>
                Per i nuovi ingredienti
              </div>
            </div>
            <ChipGroup<'g' | 'kg'>
              opzioni={['g', 'kg']}
              valore={preferenze.unitaPredefinita}
              onChange={v => setPreferenza('unitaPredefinita', v)}
              render={v => v === 'g' ? 'Grammi (g)' : 'Chilogrammi (kg)'}
            />
          </Row>

          {/* Passo scala dosi */}
          <Row style={{ borderBottom: '1px solid #EFEBE9', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.onBackground }}>
                Passo scala dosi
              </div>
              <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>
                Incremento bottoni +/− nel dettaglio ricetta
              </div>
            </div>
            <ChipGroup<PassoScalaDosi>
              opzioni={[5, 10, 25, 50]}
              valore={preferenze.passoScalaDosi}
              onChange={v => setPreferenza('passoScalaDosi', v)}
              render={v => `${v} pz`}
            />
          </Row>

          {/* Schermo sempre acceso */}
          <Row>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.onBackground }}>
                Schermo sempre acceso
              </div>
              <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>
                Default all'apertura delle ricette (richiede permesso browser)
              </div>
            </div>
            <Toggle
              value={preferenze.schermoSempreAcceso}
              onChange={v => setPreferenza('schermoSempreAcceso', v)}
            />
          </Row>
        </Card>

        {/* ── GESTIONE CATEGORIE ───────────────────────────────────────── */}
        <Card>
          <SectionHeader icon={<span>📂</span>} title="Gestione Categorie" />
          <button
            onClick={() => navigate('/categorie')}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 14,
              padding: '16px 20px', background: 'transparent', border: 'none',
              cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#FFF8E1')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.onBackground }}>
                Gestisci categorie
              </div>
              <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>
                {categorie.length} categorie · Aggiungi, modifica, riordina
              </div>
            </div>
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 120, justifyContent: 'flex-end',
            }}>
              {categorie.slice(0, 4).map((_, i) => (
                <span key={i} style={{ fontSize: 16 }}>🍪</span>
              ))}
            </div>
            <ChevronRight size={18} color={COLORS.textSecondary} />
          </button>
        </Card>

        {/* ── GESTIONE DATI ─────────────────────────────────────────────── */}
        <Card>
          <SectionHeader icon={<Database size={18} />} title="Gestione Dati" />

          {/* Contatori */}
          <div style={{
            padding: '14px 20px', borderBottom: '1px solid #EFEBE9',
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10,
          }}>
            {[
              { label: 'Ricette', value: ricette.length, emoji: '📖' },
              { label: 'Categorie', value: categorie.length, emoji: '📂' },
              { label: 'Spazio usato', value: statsStorage(), emoji: '💾' },
            ].map(s => (
              <div key={s.label} style={{
                background: '#FFF8E1', borderRadius: 12,
                padding: '12px 8px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{s.emoji}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.primary }}>{s.value}</div>
                <div style={{ fontSize: 11, color: COLORS.textSecondary, fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Export */}
          <Row style={{ borderBottom: '1px solid #EFEBE9' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.onBackground }}>
                📤 Esporta Backup
              </div>
              <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>
                Salva tutte le ricette, categorie e prezzi in JSON
              </div>
            </div>
            <button onClick={esportaBackup} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'linear-gradient(135deg, #795548, #a1887f)', color: '#FFF',
              border: 'none', borderRadius: 12, padding: '10px 18px',
              fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
              minHeight: 44, flexShrink: 0,
            }}>
              <Download size={15} /> Esporta
            </button>
          </Row>

          {/* Import */}
          <Row style={{ borderBottom: '1px solid #EFEBE9' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.onBackground }}>
                📥 Importa Backup
              </div>
              <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>
                Ripristina da un file JSON precedentemente esportato
              </div>
            </div>
            <button onClick={importaBackup} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#EFEBE9', color: COLORS.textSecondary,
              border: 'none', borderRadius: 12, padding: '10px 18px',
              fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
              minHeight: 44, flexShrink: 0,
            }}>
              <Upload size={15} /> Importa
            </button>
            <input
              ref={importRef} type="file" accept=".json"
              style={{ display: 'none' }} onChange={handleFileImport}
            />
          </Row>

          {/* Avviso offline */}
          <div style={{ padding: '12px 20px', background: '#F1F8E9', borderTop: '1px solid #EFEBE9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Check size={14} color="#4CAF50" />
              <span style={{ fontSize: 12, color: '#2E7D32', fontWeight: 600 }}>
                100% offline — tutti i dati sono salvati localmente sul dispositivo
              </span>
            </div>
          </div>
        </Card>

        {/* ── ZONA PERICOLO ─────────────────────────────────────────────── */}
        <Card style={{ border: '2px solid #FFCDD2' }}>
          <div style={{
            padding: '14px 20px', background: '#FFEBEE',
            borderBottom: '1px solid #FFCDD2',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <AlertTriangle size={18} color="#c62828" />
            <span style={{ fontSize: 15, fontWeight: 800, color: '#c62828' }}>Zona Pericolosa</span>
          </div>

          <Row>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.onBackground }}>
                🗑 Resetta tutti i dati
              </div>
              <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>
                Elimina tutto e ripristina le 3 ricette di esempio
              </div>
            </div>
            <button onClick={() => setShowElimina(true)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#FFEBEE', color: '#c62828',
              border: '2px solid #EF5350', borderRadius: 12, padding: '10px 16px',
              fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
              minHeight: 44, flexShrink: 0,
            }}>
              <Trash2 size={14} /> Resetta
            </button>
          </Row>
        </Card>

        {/* ── INFO ──────────────────────────────────────────────────────── */}
        <Card>
          <SectionHeader icon={<Info size={18} />} title="Informazioni" />
          <div style={{ padding: '14px 20px' }}>
            {[
              { label: 'Applicazione', value: 'Il Mio Ricettario' },
              { label: 'Versione', value: '1.0.0' },
              { label: 'Storage', value: 'LocalStorage (offline)' },
              { label: 'Interfaccia', value: 'Italiano' },
              { label: 'Target', value: 'Laboratorio artigianale' },
              { label: 'Stack', value: 'React + Vite + TypeScript' },
            ].map((r, i, arr) => (
              <div key={r.label} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom: i < arr.length - 1 ? '1px solid #EFEBE9' : 'none',
              }}>
                <span style={{ fontSize: 14, color: COLORS.textSecondary }}>{r.label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.onBackground }}>{r.value}</span>
              </div>
            ))}
          </div>
          <div style={{
            padding: '14px 20px', background: '#FFF8E1', textAlign: 'center',
            borderTop: '1px solid #EFEBE9',
          }}>
            <p style={{ fontSize: 12, color: '#a1887f', margin: 0 }}>
              🍪 Fatto con passione per il biscottificio artigianale
            </p>
          </div>
        </Card>
      </div>

      {/* Dialog elimina */}
      {showElimina && (
        <DialogConfermaElimina
          onConferma={resetTotale}
          onAnnulla={() => setShowElimina(false)}
        />
      )}

      {/* Progress overlay */}
      {progress && <ProgressOverlay messaggio={progress} />}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
          background: toast.ok ? '#2E7D32' : '#c62828', color: '#FFF',
          padding: '13px 22px', borderRadius: 12, fontSize: 14, fontWeight: 600,
          zIndex: 2000, boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          whiteSpace: 'nowrap', maxWidth: '90vw',
          animation: 'fadeIn 0.2s ease',
        }}>
          {toast.msg}
        </div>
      )}

      <style>{`@keyframes fadeIn { from { opacity:0; transform: translateX(-50%) translateY(8px) } to { opacity:1; transform: translateX(-50%) translateY(0) } }`}</style>
    </div>
  );
};
