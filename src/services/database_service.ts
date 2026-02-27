import { v4 as uuidv4 } from 'uuid';
import type { Ricetta, Categoria } from '../models/types';
import { DB_KEY_RICETTE, DB_KEY_CATEGORIE, DB_KEY_INIZIALIZZATO } from '../config/constants';

// ── Categorie predefinite ──────────────────────────────────────────────────
const CATEGORIE_DEFAULT: Categoria[] = [
  { id: uuidv4(), nome: 'Frollini', icona: 'cookie', ordine: 0 },
  { id: uuidv4(), nome: 'Biscotti al Cioccolato', icona: 'cookie_bite', ordine: 1 },
  { id: uuidv4(), nome: 'Cantucci', icona: 'grain', ordine: 2 },
  { id: uuidv4(), nome: 'Paste di Mandorla', icona: 'spa', ordine: 3 },
  { id: uuidv4(), nome: 'Meringhe', icona: 'cloud', ordine: 4 },
  { id: uuidv4(), nome: 'Amaretti', icona: 'star', ordine: 5 },
  { id: uuidv4(), nome: 'Biscotti Ripieni', icona: 'layers', ordine: 6 },
  { id: uuidv4(), nome: 'Wafer', icona: 'view_agenda', ordine: 7 },
  { id: uuidv4(), nome: 'Altro', icona: 'more_horiz', ordine: 8 },
];

// ── Ricette di esempio ─────────────────────────────────────────────────────
function buildRicetteDefault(categorie: Categoria[]): Ricetta[] {
  const catMap = Object.fromEntries(categorie.map(c => [c.nome, c.id]));
  const now = new Date().toISOString();

  return [
    {
      id: uuidv4(),
      nome: 'Frollini al Burro Classici',
      categoria: catMap['Frollini'] ?? categorie[0].id,
      descrizione: 'I classici frollini al burro, croccanti e profumati, ideali per ogni occasione.',
      foto: [],
      ingredienti: [
        { nome: 'Farina 00', quantita: 500, unitaMisura: 'g', costoAlKg: 1.2 },
        { nome: 'Burro', quantita: 250, unitaMisura: 'g', costoAlKg: 8.5 },
        { nome: 'Zucchero', quantita: 200, unitaMisura: 'g', costoAlKg: 1.4 },
        { nome: 'Uova', quantita: 2, unitaMisura: 'unità', costoAlKg: 3.0 },
        { nome: 'Vanillina', quantita: 1, unitaMisura: 'bustina', costoAlKg: 50 },
        { nome: 'Sale', quantita: 1, unitaMisura: 'pizzico' },
      ],
      steps: [
        { numero: 1, descrizione: 'Mescola burro morbido e zucchero fino ad ottenere un composto cremoso.', durataMinuti: 5 },
        { numero: 2, descrizione: 'Aggiungi le uova una alla volta, mescolando bene dopo ogni aggiunta.', durataMinuti: 3 },
        { numero: 3, descrizione: 'Incorpora la farina setacciata, la vanillina e il sale. Lavora brevemente l\'impasto.', durataMinuti: 5 },
        { numero: 4, descrizione: 'Stendi l\'impasto a 5mm e taglia con gli stampini desiderati. Disponi su teglia.', durataMinuti: 7 },
        { numero: 5, descrizione: 'Cuoci in forno preriscaldato fino a doratura.', durataMinuti: 12, temperaturaC: 180 },
      ],
      resa: 60,
      tempoPrepMinuti: 20,
      tempoCotturaMinuti: 12,
      temperaturaForno: 180,
      difficolta: 'facile',
      note: 'Conservare in scatola di latta fino a 2 settimane.',
      preferita: true,
      tags: ['classico', 'burro', 'frollino'],
      dataCreazione: now,
      dataModifica: now,
    },
    {
      id: uuidv4(),
      nome: 'Cantucci alle Mandorle',
      categoria: catMap['Cantucci'] ?? categorie[0].id,
      descrizione: 'Autentici cantucci toscani con mandorle intere, perfetti da inzuppare nel Vin Santo.',
      foto: [],
      ingredienti: [
        { nome: 'Farina 00', quantita: 500, unitaMisura: 'g', costoAlKg: 1.2 },
        { nome: 'Zucchero', quantita: 300, unitaMisura: 'g', costoAlKg: 1.4 },
        { nome: 'Uova', quantita: 4, unitaMisura: 'unità', costoAlKg: 3.0 },
        { nome: 'Mandorle', quantita: 250, unitaMisura: 'g', costoAlKg: 12.0 },
        { nome: 'Lievito', quantita: 1, unitaMisura: 'bustina', costoAlKg: 20 },
        { nome: 'Scorza di limone', quantita: 1, unitaMisura: 'scorza' },
      ],
      steps: [
        { numero: 1, descrizione: 'Mescola farina, zucchero, lievito e la scorza di limone grattugiata. Aggiungi le uova e lavora fino ad ottenere un impasto omogeneo.', durataMinuti: 8 },
        { numero: 2, descrizione: 'Unisci le mandorle intere all\'impasto. Forma due filoni di circa 4cm di larghezza su teglia rivestita.', durataMinuti: 5 },
        { numero: 3, descrizione: 'Prima cottura dei filoni.', durataMinuti: 25, temperaturaC: 170 },
        { numero: 4, descrizione: 'Sforna, lascia intiepidire 10 minuti e taglia i filoni in fette diagonali di circa 1.5cm.', durataMinuti: 10 },
        { numero: 5, descrizione: 'Seconda cottura per asciugare i cantucci.', durataMinuti: 10, temperaturaC: 170 },
      ],
      resa: 80,
      tempoPrepMinuti: 30,
      tempoCotturaMinuti: 35,
      temperaturaForno: 170,
      difficolta: 'media',
      note: 'Si conservano a lungo in scatola ermetica. Ottimi con Vin Santo.',
      preferita: false,
      tags: ['toscano', 'mandorle', 'tradizionale'],
      dataCreazione: now,
      dataModifica: now,
    },
    {
      id: uuidv4(),
      nome: 'Amaretti Morbidi',
      categoria: catMap['Amaretti'] ?? categorie[0].id,
      descrizione: 'Amaretti dalla consistenza morbida e cuore umido, con intenso aroma di mandorla.',
      foto: [],
      ingredienti: [
        { nome: 'Farina di mandorle', quantita: 300, unitaMisura: 'g', costoAlKg: 14.0 },
        { nome: 'Zucchero', quantita: 250, unitaMisura: 'g', costoAlKg: 1.4 },
        { nome: 'Albumi', quantita: 3, unitaMisura: 'unità', costoAlKg: 2.0 },
        { nome: 'Liquore Amaretto', quantita: 20, unitaMisura: 'ml', costoAlKg: 15.0 },
        { nome: 'Zucchero a velo', quantita: 1, unitaMisura: 'pizzico' },
      ],
      steps: [
        { numero: 1, descrizione: 'Monta gli albumi a neve ferma con un pizzico di sale.', durataMinuti: 5 },
        { numero: 2, descrizione: 'Incorpora delicatamente la farina di mandorle e lo zucchero agli albumi montati, con movimenti dal basso verso l\'alto.', durataMinuti: 5 },
        { numero: 3, descrizione: 'Aggiungi il liquore Amaretto e mescola delicatamente.', durataMinuti: 2 },
        { numero: 4, descrizione: 'Forma palline da circa 20g, rotolale nello zucchero a velo e disponi su teglia con carta forno.', durataMinuti: 13 },
        { numero: 5, descrizione: 'Cuoci in forno ventilato.', durataMinuti: 18, temperaturaC: 160 },
      ],
      resa: 40,
      tempoPrepMinuti: 25,
      tempoCotturaMinuti: 18,
      temperaturaForno: 160,
      difficolta: 'media',
      note: 'Senza glutine. Conservare in scatola di latta, migliorano il giorno dopo.',
      preferita: false,
      tags: ['senza glutine', 'mandorle', 'morbidi'],
      dataCreazione: now,
      dataModifica: now,
    },
  ];
}

// ── CRUD helpers ───────────────────────────────────────────────────────────

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// ── Database Service ───────────────────────────────────────────────────────

export const DatabaseService = {
  inizializza(): void {
    const inizializzato = localStorage.getItem(DB_KEY_INIZIALIZZATO);
    if (inizializzato) return;

    const categorie = CATEGORIE_DEFAULT;
    const ricette = buildRicetteDefault(categorie);

    saveJSON(DB_KEY_CATEGORIE, categorie);
    saveJSON(DB_KEY_RICETTE, ricette);
    localStorage.setItem(DB_KEY_INIZIALIZZATO, 'true');
  },

  // ── Categorie ────────────────────────────────────────────────────────────
  getCategorie(): Categoria[] {
    return loadJSON<Categoria[]>(DB_KEY_CATEGORIE, []);
  },

  salvaCategorie(categorie: Categoria[]): void {
    saveJSON(DB_KEY_CATEGORIE, categorie);
  },

  aggiungiCategoria(categoria: Omit<Categoria, 'id'>): Categoria {
    const nuova: Categoria = { ...categoria, id: uuidv4() };
    const esistenti = this.getCategorie();
    saveJSON(DB_KEY_CATEGORIE, [...esistenti, nuova]);
    return nuova;
  },

  // ── Ricette ──────────────────────────────────────────────────────────────
  getRicette(): Ricetta[] {
    return loadJSON<Ricetta[]>(DB_KEY_RICETTE, []);
  },

  getRicettaById(id: string): Ricetta | undefined {
    return this.getRicette().find(r => r.id === id);
  },

  salvaRicetta(ricetta: Omit<Ricetta, 'id' | 'dataCreazione' | 'dataModifica'>): Ricetta {
    const now = new Date().toISOString();
    const nuova: Ricetta = { ...ricetta, id: uuidv4(), dataCreazione: now, dataModifica: now };
    const esistenti = this.getRicette();
    saveJSON(DB_KEY_RICETTE, [...esistenti, nuova]);
    return nuova;
  },

  aggiornaRicetta(id: string, dati: Partial<Omit<Ricetta, 'id' | 'dataCreazione'>>): Ricetta | null {
    const ricette = this.getRicette();
    const idx = ricette.findIndex(r => r.id === id);
    if (idx === -1) return null;
    const aggiornata: Ricetta = { ...ricette[idx], ...dati, dataModifica: new Date().toISOString() };
    ricette[idx] = aggiornata;
    saveJSON(DB_KEY_RICETTE, ricette);
    return aggiornata;
  },

  eliminaRicetta(id: string): void {
    const ricette = this.getRicette().filter(r => r.id !== id);
    saveJSON(DB_KEY_RICETTE, ricette);
  },

  togglePreferita(id: string): void {
    const ricette = this.getRicette();
    const idx = ricette.findIndex(r => r.id === id);
    if (idx === -1) return;
    ricette[idx].preferita = !ricette[idx].preferita;
    saveJSON(DB_KEY_RICETTE, ricette);
  },
};
