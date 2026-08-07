export type Orientation = 'vertical' | 'horizontal';

export const CATEGORIES = [
  'naturaleza',
  'abstracto',
  'urbano',
  'personas',
  'animales',
  'frases',
  'botanico',
  'mapas',
  'infantil',
  'fotografia',
  'gastronomia',
  'musica',
  'cine',
  'superheroes',
  'deportes',
  'marino',
  'espacio',
  'arquitectura',
  'moda',
  'religioso',
  'mitologia',
  'geometrico',
] as const;

export const STYLES = [
  'minimalista',
  'acuarela',
  'line_art',
  'pop_art',
  'vintage',
  'nordico',
  'japones',
  'geometrico',
  'realista',
  'surrealista',
  'expresionista',
  'impresionista',
  'collage',
  'digital',
  'ilustracion',
  'fotografia_artistica',
  'art_deco',
  'graffiti',
  'pixel_art',
  'clasico',
] as const;

export type Category = (typeof CATEGORIES)[number];
export type Style = (typeof STYLES)[number];

export interface ProductData {
  title: string;
  description: string;
  category: Category;
  style: Style;
  orientation: Orientation;
  artImage: string;
  mockupImage: string;
  embeddingText: string;
}
