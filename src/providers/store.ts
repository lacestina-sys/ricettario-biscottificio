import { create } from 'zustand';
import type { Ricetta, Categoria, Difficolta } from '../models/types';
import { DatabaseService } from '../services/database_service';
import { DB_KEY_PREZZI, DB_KEY_PREFERENZE } from '../config/constants';

// ── Funzione esposta per calcolo kg equivalente ────────────────────────────
export function calcolaKgEquivalente(quantita: number, unita: string): number {
  switch (unita) {
    case 'g': return quantita / 1000;
    case 'kg': return quantita;
    case 'ml': return quantita / 1000;
    case 'l': return quantita;
    default: return 0;
  }
}

// ── Tipi preferenze ───────────────────────────────────────────────────────
export type Tema = 'chiaro' | 'scuro' | 'auto';
export type DimensioneTestoApp = 'normale' | 'grande' | 'extra';
export type PassoScalaDosi = 5 | 10 | 25 | 50;

export interface Preferenze {
  tema: Tema;
  dimensioneTesto: DimensioneTestoApp;
  unitaPredefinita: 'g' | 'kg';
  passoScalaDosi: PassoScalaDosi;
  schermoSempreAcceso: boolean;
  margineDefault: number;
}

export const PREFERENZE_DEFAULT: Preferenze = {
  tema: 'chiaro',
  dimensioneTesto: 'normale',
  unitaPredefinita: 'g',
  passoScalaDosi: 10,
  schermoSempreAcceso: false,
  margineDefault: 60,
};

// ── Helpers localStorage ──────────────────────────────────────────────────
function loadJSON<T>(key: string, fallback: T): T {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) as T : fallback; }
  catch { return fallback; }
}
function saveJSON<T>(key: string, v: T) { localStorage.setItem(key, JSON.stringify(v)); }

// ── Tipi filtri e ordinamento ─────────────────────────────────────────────
export type OrdineRicette = 'nome_az' | 'nome_za' | 'recenti' | 'vecchie' | 'modificate';

export interface FiltriRicette {
  search: string;
  categorie: string[];
  difficolta: Difficolta[];
  soloPreferite: boolean;
  tags: string[];
}

export const FILTRI_DEFAULT: FiltriRicette = {
  search: '',
  categorie: [],
  difficolta: [],
  soloPreferite: false,
  tags: [],
};

// ── Helper filtro/ordinamento ─────────────────────────────────────────────
function applicaFiltriEOrdine(
  ricette: Ricetta[],
  filtri: FiltriRicette,
  ord: OrdineRicette,
): Ricetta[] {
  const q = filtri.search.trim().toLowerCase();
  const filtrate = ricette.filter(r => {
    if (q) {
      const inNome = r.nome.toLowerCase().includes(q);
      const inIng = r.ingredienti.some(i => i.nome.toLowerCase().includes(q));
      const inTags = r.tags.some(t => t.toLowerCase().includes(q));
      if (!inNome && !inIng && !inTags) return false;
    }
    if (filtri.categorie.length > 0 && !filtri.categorie.includes(r.categoria)) return false;
    if (filtri.difficolta.length > 0 && !filtri.difficolta.includes(r.difficolta)) return false;
    if (filtri.soloPreferite && !r.preferita) return false;
    if (filtri.tags.length > 0 && !filtri.tags.some(t => r.tags.includes(t))) return false;
    return true;
  });
  return filtrate.sort((a, b) => {
    switch (ord) {
      case 'nome_az': return a.nome.localeCompare(b.nome, 'it');
      case 'nome_za': return b.nome.localeCompare(a.nome, 'it');
      case 'recenti': return new Date(b.dataCreazione).getTime() - new Date(a.dataCreazione).getTime();
      case 'vecchie': return new Date(a.dataCreazione).getTime() - new Date(b.dataCreazione).getTime();
      case 'modificate': return new Date(b.dataModifica).getTime() - new Date(a.dataModifica).getTime();
      default: return 0;
    }
  });
}

let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

// ── Store Principale ───────────────────────────────────────────────────────
export interface RicettarioState {
  ricette: Ricetta[];
  categorie: Categoria[];
  filtri: FiltriRicette;
  ordinamento: OrdineRicette;
  ricetteFiltrate: () => Ricetta[];
  allTags: () => string[];
  caricaRicette: () => void;
  caricaCategorie: () => void;
  aggiungiRicetta: (r: Omit<Ricetta, 'id' | 'dataCreazione' | 'dataModifica'>) => Ricetta;
  aggiornaRicetta: (id: string, dati: Partial<Omit<Ricetta, 'id' | 'dataCreazione'>>) => void;
  eliminaRicetta: (id: string) => void;
  togglePreferita: (id: string) => void;
  aggiungiCategoria: (c: Omit<Categoria, 'id'>) => Categoria;
  aggiornaCategoria: (id: string, dati: Partial<Omit<Categoria, 'id'>>) => void;
  eliminaCategoria: (id: string) => void;
  riordinaCategorie: (categorie: Categoria[]) => void;
  setSearch: (q: string) => void;
  setFiltri: (f: Partial<FiltriRicette>) => void;
  resetFiltri: () => void;
  setOrdinamento: (o: OrdineRicette) => void;
}

export const useRicettarioStore = create<RicettarioState>((set, get) => ({
  ricette: [],
  categorie: [],
  filtri: { ...FILTRI_DEFAULT },
  ordinamento: 'recenti',

  ricetteFiltrate: () => applicaFiltriEOrdine(get().ricette, get().filtri, get().ordinamento),
  allTags: () => {
    const s = new Set<string>();
    get().ricette.forEach(r => r.tags.forEach(t => s.add(t)));
    return Array.from(s).sort((a, b) => a.localeCompare(b, 'it'));
  },

  caricaRicette: () => set({ ricette: DatabaseService.getRicette() }),
  caricaCategorie: () => set({ categorie: DatabaseService.getCategorie() }),

  aggiungiRicetta: r => {
    const nuova = DatabaseService.salvaRicetta(r);
    set(state => ({ ricette: [...state.ricette, nuova] }));
    return nuova;
  },

  aggiornaRicetta: (id, dati) => {
    const aggiornata = DatabaseService.aggiornaRicetta(id, dati);
    if (!aggiornata) return;
    set(state => ({ ricette: state.ricette.map(r => r.id === id ? aggiornata : r) }));
  },

  eliminaRicetta: id => {
    DatabaseService.eliminaRicetta(id);
    set(state => ({ ricette: state.ricette.filter(r => r.id !== id) }));
  },

  togglePreferita: id => {
    DatabaseService.togglePreferita(id);
    set(state => ({ ricette: state.ricette.map(r => r.id === id ? { ...r, preferita: !r.preferita } : r) }));
  },

  aggiungiCategoria: c => {
    const nuova = DatabaseService.aggiungiCategoria(c);
    set(state => ({ categorie: [...state.categorie, nuova] }));
    return nuova;
  },

  aggiornaCategoria: (id, dati) => {
    const cats = DatabaseService.getCategorie().map(c => c.id === id ? { ...c, ...dati } : c);
    DatabaseService.salvaCategorie(cats);
    set({ categorie: cats });
  },

  eliminaCategoria: id => {
    const cats = DatabaseService.getCategorie().filter(c => c.id !== id);
    DatabaseService.salvaCategorie(cats);
    set({ categorie: cats });
  },

  riordinaCategorie: cats => {
    DatabaseService.salvaCategorie(cats);
    set({ categorie: cats });
  },

  setSearch: q => {
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      set(state => ({ filtri: { ...state.filtri, search: q } }));
    }, 300);
  },

  setFiltri: f => set(state => ({ filtri: { ...state.filtri, ...f } })),
  resetFiltri: () => set({ filtri: { ...FILTRI_DEFAULT } }),
  setOrdinamento: o => set({ ordinamento: o }),
}));

// ── Store Prezzi Ingredienti ───────────────────────────────────────────────
export interface PrezziState {
  prezzi: Record<string, number>; // nome_ingrediente → €/kg
  caricaPrezzi: () => void;
  setPrezzoIngrediente: (nome: string, prezzo: number) => void;
  salvaTuttiIPrezzi: (prezzi: Record<string, number>) => void;
  getPrezzoIngrediente: (nome: string) => number | undefined;
}

export const usePrezziStore = create<PrezziState>((set, get) => ({
  prezzi: loadJSON<Record<string, number>>(DB_KEY_PREZZI, {}),

  caricaPrezzi: () => {
    set({ prezzi: loadJSON<Record<string, number>>(DB_KEY_PREZZI, {}) });
  },

  setPrezzoIngrediente: (nome, prezzo) => {
    const nuovi = { ...get().prezzi, [nome]: prezzo };
    saveJSON(DB_KEY_PREZZI, nuovi);
    set({ prezzi: nuovi });
  },

  salvaTuttiIPrezzi: prezzi => {
    saveJSON(DB_KEY_PREZZI, prezzi);
    set({ prezzi });
  },

  getPrezzoIngrediente: nome => get().prezzi[nome],
}));

// ── Store Preferenze ───────────────────────────────────────────────────────
export interface PreferenzeState {
  preferenze: Preferenze;
  caricaPreferenze: () => void;
  setPreferenza: <K extends keyof Preferenze>(chiave: K, valore: Preferenze[K]) => void;
  resetPreferenze: () => void;
}

export const usePreferenzeStore = create<PreferenzeState>((set, get) => ({
  preferenze: loadJSON<Preferenze>(DB_KEY_PREFERENZE, { ...PREFERENZE_DEFAULT }),

  caricaPreferenze: () => {
    set({ preferenze: loadJSON<Preferenze>(DB_KEY_PREFERENZE, { ...PREFERENZE_DEFAULT }) });
  },

  setPreferenza: (chiave, valore) => {
    const nuove = { ...get().preferenze, [chiave]: valore };
    saveJSON(DB_KEY_PREFERENZE, nuove);
    set({ preferenze: nuove });
  },

  resetPreferenze: () => {
    saveJSON(DB_KEY_PREFERENZE, PREFERENZE_DEFAULT);
    set({ preferenze: { ...PREFERENZE_DEFAULT } });
  },
}));
