import type { ElementType, Locale } from './types';

export const BOARD_ROWS = 5;
export const BOARD_COLS = 6;
export const MAX_TURNS = 20;

export const GEM_TYPES: ElementType[] = ['fire', 'water', 'wood', 'light', 'dark', 'heart'];

export const ORB_EMOJI: Record<ElementType, string> = {
  fire: '🔥',
  water: '💧',
  wood: '🌿',
  light: '✨',
  dark: '🌙',
  heart: '💖'
};

export const NUMBER_LOCALES: Record<Locale, string> = {
  ja: 'ja-JP',
  en: 'en-US',
  es: 'es-ES'
};
