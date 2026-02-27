export const APP_NAME = 'Il Mio Ricettario';
export const DB_KEY_RICETTE = 'ricettario_ricette';
export const DB_KEY_CATEGORIE = 'ricettario_categorie';
export const DB_KEY_INIZIALIZZATO = 'ricettario_init';
export const DB_KEY_PREZZI = 'ricettario_prezzi';
export const DB_KEY_PREFERENZE = 'ricettario_preferenze';

export const UNITA_MISURA = ['g', 'kg', 'ml', 'l', 'unità', 'cucchiai', 'pizzico', 'bustina', 'scorza'] as const;
export type UnitaMisura = typeof UNITA_MISURA[number];

export const DIFFICOLTA_LABELS: Record<string, string> = {
  facile: 'Facile',
  media: 'Media',
  difficile: 'Difficile',
};

export const DIFFICOLTA_COLORS: Record<string, string> = {
  facile: '#4CAF50',
  media: '#FFC107',
  difficile: '#F44336',
};

export const COLORS = {
  primary: '#795548',
  primaryLight: '#a1887f',
  primaryDark: '#4b2c20',
  accent: '#FFC107',
  accentDark: '#FF8F00',
  background: '#FFF8E1',
  backgroundDark: '#3E2723',
  surface: '#FFFFFF',
  surfaceVariant: '#EFEBE9',
  onPrimary: '#FFFFFF',
  onBackground: '#3E2723',
  onSurface: '#3E2723',
  textSecondary: '#6D4C41',
  divider: '#D7CCC8',
  error: '#B00020',
  success: '#4CAF50',
  warning: '#FF9800',
};
