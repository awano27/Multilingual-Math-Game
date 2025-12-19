import type { Translation } from './types';

export const TRANSLATIONS: Record<'ja' | 'en' | 'es', Translation> = {
  ja: {
    languageName: '日本語',
    gameTitle: 'さんすうダンジョン大ぼうけん',
    subtitle: 'やさしい珠をならべかえて、連鎖でスコアを伸ばそう！',
    languageSelectLabel: '表示言語',
    moodLabel: 'あそびかたをえらぼう',
    adventureTitle: '今日のチャレンジ',
    adventureDescription:
      '3コンボで「きらきらバッジ」、8コンボで「たいようバッジ」をゲット！たくさんコンボをつないで冒険をすすめよう。',
    instructionsTitle: 'あそびかた',
    instructions: [
      'うごかしたい珠をタップしたまま、上下左右にスライドしよう。',
      '指が通ったマスと入れかわるよ。はなした場所で盤面がきまるよ。',
      'おなじ色が3つそろうと消えてポイントが入るよ。つづけて消えるとボーナス！'
    ],
    statsLabels: {
      turns: 'のこりターン',
      score: 'スコア',
      combos: '合計コンボ'
    },
    lastComboTitle: 'さいごのコンボ',
    noCombosYet: 'まだコンボはないよ。好きな珠を動かしてみよう！',
    resetButton: 'リセットしてもう一度',
    messageInvalidSwap: 'コンボができなかったので、もとにもどしたよ。',
    messageCombo: comboCount => `${comboCount}コンボ！よくできました！`,
    messageReady: '珠をスライドしてならべかえよう。',
    outOfTurns: 'ターンがおわったよ。リセットして続けよう！',
    elementNames: {
      fire: 'ひ',
      water: 'みず',
      wood: 'き',
      light: 'ひかり',
      dark: 'やみ',
      heart: 'ハート'
    },
    comboLineTemplate: 'コンボ{index}: {element} ×{count} (+{points}{unit}) / {cascade}',
    pointsUnit: '点',
    cascadeLabelTemplate: '{value}れんさ目',
    practiceModeLabel: 'れんしゅうモード',
    practiceModeOn: 'ずっとあそぶ (ターンむげん)',
    practiceModeOff: 'ぼうけん (20ターン)',
    questLabel: 'バッジまであと{value}コンボ',
    questComplete: 'バッジをぜんぶ集めたよ！つぎのコンボもねらおう！'
  },
  en: {
    languageName: 'English',
    gameTitle: 'Math Adventure Dungeon',
    subtitle: 'Slide friendly orbs, clear combos, and cheer for big chains!',
    languageSelectLabel: 'Language',
    moodLabel: 'Play style',
    adventureTitle: 'Today’s quest',
    adventureDescription:
      'Earn the Sparkle Badge at 3 combos and the Sun Badge at 8 combos. Keep chaining matches to climb the adventure trail!',
    instructionsTitle: 'How to play',
    instructions: [
      'Press and hold an orb, then slide across the grid in straight lines.',
      'Every tile you pass swaps automatically. Release to lock in the board.',
      'Match three or more of the same color to clear them. Chains add bonus points!'
    ],
    statsLabels: {
      turns: 'Turns left',
      score: 'Score',
      combos: 'Total combos'
    },
    lastComboTitle: 'Latest combo chain',
    noCombosYet: 'No combos yet—try sliding an orb!',
    resetButton: 'Reset and try again',
    messageInvalidSwap: 'No combo was formed, so the board was restored.',
    messageCombo: comboCount => (comboCount === 1 ? 'Nice combo!' : `${comboCount} combos!`),
    messageReady: 'Slide orbs to rearrange them.',
    outOfTurns: 'You are out of turns. Reset to keep playing!',
    elementNames: {
      fire: 'Fire',
      water: 'Water',
      wood: 'Wood',
      light: 'Light',
      dark: 'Dark',
      heart: 'Heart'
    },
    comboLineTemplate: 'Combo {index}: {element} ×{count} (+{points}{unit}) • {cascade}',
    pointsUnit: 'pts',
    cascadeLabelTemplate: 'Cascade {value}',
    practiceModeLabel: 'Practice mode',
    practiceModeOn: 'Free play (no turn limit)',
    practiceModeOff: 'Adventure (20 turns)',
    questLabel: '{value} combos to next badge',
    questComplete: 'All badges collected—keep the chain going!'
  },
  es: {
    languageName: 'Español',
    gameTitle: 'Mazmorra de Aventuras',
    subtitle: 'Desliza esferas amigas, crea combos y celebra las cadenas.',
    languageSelectLabel: 'Idioma',
    moodLabel: 'Modo de juego',
    adventureTitle: 'Misión de hoy',
    adventureDescription:
      'Gana la Insignia Brillante con 3 combos y la Insignia Sol con 8 combos. ¡Sigue encadenando para avanzar en la aventura!',
    instructionsTitle: 'Cómo jugar',
    instructions: [
      'Mantén pulsada una esfera y deslízala en línea recta por la cuadrícula.',
      'Cada casilla que atraviesas se intercambia sola. Al soltar, el tablero se fija.',
      'Une tres o más del mismo color para despejarlas. Las cadenas suman más puntos.'
    ],
    statsLabels: {
      turns: 'Turnos restantes',
      score: 'Puntuación',
      combos: 'Combos totales'
    },
    lastComboTitle: 'Cadena más reciente',
    noCombosYet: 'Aún no hay combos. ¡Desliza una esfera!',
    resetButton: 'Reiniciar y jugar otra vez',
    messageInvalidSwap: 'No hubo combo; el tablero volvió a su estado anterior.',
    messageCombo: comboCount => (comboCount === 1 ? '¡Buen combo!' : `¡${comboCount} combos!`),
    messageReady: 'Desliza las esferas para reordenarlas.',
    outOfTurns: 'No quedan turnos. ¡Reinicia para seguir!',
    elementNames: {
      fire: 'Fuego',
      water: 'Agua',
      wood: 'Bosque',
      light: 'Luz',
      dark: 'Oscuridad',
      heart: 'Corazón'
    },
    comboLineTemplate: 'Combo {index}: {element} ×{count} (+{points}{unit}) • {cascade}',
    pointsUnit: 'pts',
    cascadeLabelTemplate: 'Cadena {value}',
    practiceModeLabel: 'Modo práctica',
    practiceModeOn: 'Juego libre (sin turnos)',
    practiceModeOff: 'Aventura (20 turnos)',
    questLabel: '{value} combos hasta la próxima insignia',
    questComplete: '¡Todas las insignias conseguidas! ¡Sigue encadenando!'
  }
};
