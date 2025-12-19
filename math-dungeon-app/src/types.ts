export type ElementType = 'fire' | 'water' | 'wood' | 'light' | 'dark' | 'heart';

export type CellPosition = {
  row: number;
  col: number;
};

export type ComboDetail = {
  type: ElementType;
  size: number;
  points: number;
  cascade: number;
};

export type Translation = {
  languageName: string;
  gameTitle: string;
  subtitle: string;
  languageSelectLabel: string;
  moodLabel: string;
  adventureTitle: string;
  adventureDescription: string;
  instructionsTitle: string;
  instructions: string[];
  statsLabels: {
    turns: string;
    score: string;
    combos: string;
  };
  lastComboTitle: string;
  noCombosYet: string;
  resetButton: string;
  messageInvalidSwap: string;
  messageCombo: (comboCount: number) => string;
  messageReady: string;
  outOfTurns: string;
  elementNames: Record<ElementType, string>;
  comboLineTemplate: string;
  pointsUnit: string;
  cascadeLabelTemplate: string;
  practiceModeLabel: string;
  practiceModeOn: string;
  practiceModeOff: string;
  questLabel: string;
  questComplete: string;
};

export type Locale = 'ja' | 'en' | 'es';
