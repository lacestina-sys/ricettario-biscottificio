export type Difficolta = 'facile' | 'media' | 'difficile';
export type UnitaMisura = 'g' | 'kg' | 'ml' | 'l' | 'unità' | 'cucchiai' | 'pizzico' | 'bustina' | 'scorza';

export interface Ingrediente {
  nome: string;
  quantita: number;
  unitaMisura: UnitaMisura;
  costoAlKg?: number;
}

export interface StepPreparazione {
  numero: number;
  descrizione: string;
  durataMinuti?: number;
  temperaturaC?: number;
}

export interface Categoria {
  id: string;
  nome: string;
  icona: string;
  ordine: number;
}

export interface Ricetta {
  id: string;
  nome: string;
  categoria: string;
  descrizione: string;
  foto: string[];
  ingredienti: Ingrediente[];
  steps: StepPreparazione[];
  resa: number;
  tempoPrepMinuti: number;
  tempoCotturaMinuti: number;
  temperaturaForno: number;
  difficolta: Difficolta;
  note: string;
  preferita: boolean;
  tags: string[];
  dataCreazione: string;
  dataModifica: string;
}
