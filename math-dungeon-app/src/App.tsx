import { useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import './App.css';

const BOARD_ROWS = 5;
const BOARD_COLS = 6;
const MAX_TURNS = 20;

type ElementType = 'fire' | 'water' | 'wood' | 'light' | 'dark' | 'heart';

type CellPosition = {
  row: number;
  col: number;
};

type ComboDetail = {
  type: ElementType;
  size: number;
  points: number;
  cascade: number;
};

type Translation = {
  languageName: string;
  gameTitle: string;
  subtitle: string;
  languageSelectLabel: string;
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
};

const GEM_TYPES: ElementType[] = ['fire', 'water', 'wood', 'light', 'dark', 'heart'];

const ORB_EMOJI: Record<ElementType, string> = {
  fire: '🔥',
  water: '💧',
  wood: '🌿',
  light: '✨',
  dark: '🌙',
  heart: '💖'
};

const format = (template: string, params: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (match, key) => (key in params ? String(params[key]) : match));

const TRANSLATIONS: Record<'ja' | 'en' | 'es', Translation> = {
  ja: {
    languageName: '日本語',
    gameTitle: '算数パズルダンジョン',
    subtitle: '珠をなぞって入れ替え、コンボでスコアを伸ばそう！',
    languageSelectLabel: '表示言語',
    instructionsTitle: '遊び方',
    instructions: [
      '移動したい珠をタップしたまま指を離さずにスライドします。',
      '指が通ったマスと自動で入れ替わり、離した位置で盤面が確定します。',
      '同じ色を3つ以上そろえると珠が消えて得点。連鎖でボーナスアップ！'
    ],
    statsLabels: {
      turns: '残りターン',
      score: 'スコア',
      combos: '合計コンボ'
    },
    lastComboTitle: '今回のコンボ',
    noCombosYet: 'まだコンボはありません。',
    resetButton: 'リセットして再挑戦',
    messageInvalidSwap: 'コンボができなかったので元に戻しました。',
    messageCombo: comboCount => `${comboCount}コンボ！`,
    messageReady: '珠をドラッグして並べ替えてください。',
    outOfTurns: 'ターンが尽きました。リセットして続けましょう。',
    elementNames: {
      fire: '火',
      water: '水',
      wood: '木',
      light: '光',
      dark: '闇',
      heart: '回復'
    },
    comboLineTemplate: 'コンボ{index}: {element} ×{count} (+{points}{unit}) / {cascade}',
    pointsUnit: '点',
    cascadeLabelTemplate: '{value}連鎖目'
  },
  en: {
    languageName: 'English',
    gameTitle: 'Math Puzzle Dungeon',
    subtitle: 'Drag elemental orbs to new positions and rack up points!',
    languageSelectLabel: 'Language',
    instructionsTitle: 'How to Play',
    instructions: [
      'Press and hold an orb, then drag your finger across neighboring tiles.',
      'Each tile you pass over swaps automatically and locks when you release.',
      'Match three or more of the same element to clear them and earn cascading bonuses.'
    ],
    statsLabels: {
      turns: 'Turns left',
      score: 'Score',
      combos: 'Total combos'
    },
    lastComboTitle: 'Latest combo chain',
    noCombosYet: 'No combos yet—make a move!',
    resetButton: 'Start a new run',
    messageInvalidSwap: 'No combo formed—board reset.',
    messageCombo: comboCount => (comboCount === 1 ? 'Nice combo!' : `${comboCount} combos!`),
    messageReady: 'Drag across adjacent orbs to reposition them.',
    outOfTurns: 'You are out of turns. Reset to keep playing.',
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
    cascadeLabelTemplate: 'Cascade {value}'
  },
  es: {
    languageName: 'Español',
    gameTitle: 'Mazmorra de Números',
    subtitle: 'Arrastra esferas elementales para lograr combos y sumar puntos.',
    languageSelectLabel: 'Idioma',
    instructionsTitle: 'Cómo jugar',
    instructions: [
      'Mantén pulsada una esfera y arrástrala por las casillas vecinas.',
      'Cada casilla que atraviesas se intercambia automáticamente hasta soltar el dedo.',
      'Forma tres o más del mismo color para eliminarlas y consigue bonificaciones por cadena.'
    ],
    statsLabels: {
      turns: 'Turnos restantes',
      score: 'Puntuación',
      combos: 'Combos totales'
    },
    lastComboTitle: 'Combo reciente',
    noCombosYet: 'Todavía no hay combos.',
    resetButton: 'Reiniciar partida',
    messageInvalidSwap: 'No se formó ningún combo; tablero restaurado.',
    messageCombo: comboCount => (comboCount === 1 ? '¡Buen combo!' : `¡${comboCount} combos!`),
    messageReady: 'Arrastra por las esferas vecinas para reordenarlas.',
    outOfTurns: 'No quedan turnos. Reinicia para seguir jugando.',
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
    cascadeLabelTemplate: 'Cadena {value}'
  }
};

type Locale = keyof typeof TRANSLATIONS;

const NUMBER_LOCALES: Record<Locale, string> = {
  ja: 'ja-JP',
  en: 'en-US',
  es: 'es-ES'
};

type MatchGroup = {
  cells: CellPosition[];
  type: ElementType;
};

type MatchResult = {
  matchMask: boolean[][];
  groups: MatchGroup[];
};

type ResolutionResult = {
  board: ElementType[][];
  combos: ComboDetail[];
  scoreGain: number;
};

type DragSession = {
  active: boolean;
  pointerId: number | null;
  origin: CellPosition | null;
  lastCell: CellPosition | null;
  snapshot: ElementType[][] | null;
  latestBoard: ElementType[][] | null;
  moved: boolean;
};

const createEmptyDragSession = (): DragSession => ({
  active: false,
  pointerId: null,
  origin: null,
  lastCell: null,
  snapshot: null,
  latestBoard: null,
  moved: false
});

const randomOrb = (): ElementType =>
  GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)];

const sameOrb = (
  board: (ElementType | null)[][],
  row: number,
  col: number,
  orb: ElementType
) => board[row] && board[row][col] === orb;

const wouldCreateMatch = (
  board: (ElementType | null)[][],
  row: number,
  col: number,
  orb: ElementType
) => {
  if (
    (sameOrb(board, row, col - 1, orb) && sameOrb(board, row, col - 2, orb)) ||
    (sameOrb(board, row, col + 1, orb) && sameOrb(board, row, col + 2, orb)) ||
    (sameOrb(board, row, col - 1, orb) && sameOrb(board, row, col + 1, orb))
  ) {
    return true;
  }
  if (
    (sameOrb(board, row - 1, col, orb) && sameOrb(board, row - 2, col, orb)) ||
    (sameOrb(board, row + 1, col, orb) && sameOrb(board, row + 2, col, orb)) ||
    (sameOrb(board, row - 1, col, orb) && sameOrb(board, row + 1, col, orb))
  ) {
    return true;
  }
  return false;
};

const generateOrb = (
  board: (ElementType | null)[][],
  row: number,
  col: number
): ElementType => {
  let orb = randomOrb();
  let safety = 0;
  while (wouldCreateMatch(board, row, col, orb) && safety < 25) {
    orb = randomOrb();
    safety += 1;
  }
  return orb;
};

const createInitialBoard = (): ElementType[][] => {
  const template: (ElementType | null)[][] = Array.from({ length: BOARD_ROWS }, () =>
    Array<ElementType | null>(BOARD_COLS).fill(null)
  );
  for (let row = 0; row < BOARD_ROWS; row += 1) {
    for (let col = 0; col < BOARD_COLS; col += 1) {
      template[row][col] = generateOrb(template, row, col);
    }
  }
  return template.map(row => row.map(cell => cell ?? randomOrb()));
};

const swapCells = (
  board: ElementType[][],
  a: CellPosition,
  b: CellPosition
): ElementType[][] => {
  const clone = board.map(r => [...r]);
  const temp = clone[a.row][a.col];
  clone[a.row][a.col] = clone[b.row][b.col];
  clone[b.row][b.col] = temp;
  return clone;
};

const findMatches = (board: ElementType[][]): MatchResult => {
  const matchMask = Array.from({ length: BOARD_ROWS }, () =>
    Array<boolean>(BOARD_COLS).fill(false)
  );

  for (let row = 0; row < BOARD_ROWS; row += 1) {
    let col = 0;
    while (col < BOARD_COLS) {
      const orb = board[row][col];
      let runLength = 1;
      while (col + runLength < BOARD_COLS && board[row][col + runLength] === orb) {
        runLength += 1;
      }
      if (orb && runLength >= 3) {
        for (let offset = 0; offset < runLength; offset += 1) {
          matchMask[row][col + offset] = true;
        }
      }
      col += runLength;
    }
  }

  for (let col = 0; col < BOARD_COLS; col += 1) {
    let row = 0;
    while (row < BOARD_ROWS) {
      const orb = board[row][col];
      let runLength = 1;
      while (row + runLength < BOARD_ROWS && board[row + runLength][col] === orb) {
        runLength += 1;
      }
      if (orb && runLength >= 3) {
        for (let offset = 0; offset < runLength; offset += 1) {
          matchMask[row + offset][col] = true;
        }
      }
      row += runLength;
    }
  }

  const visited = Array.from({ length: BOARD_ROWS }, () =>
    Array<boolean>(BOARD_COLS).fill(false)
  );
  const groups: MatchGroup[] = [];

  for (let row = 0; row < BOARD_ROWS; row += 1) {
    for (let col = 0; col < BOARD_COLS; col += 1) {
      if (!matchMask[row][col] || visited[row][col]) {
        continue;
      }
      const target = board[row][col];
      const cells: CellPosition[] = [];
      const queue: CellPosition[] = [{ row, col }];
      visited[row][col] = true;
      let pointer = 0;

      while (pointer < queue.length) {
        const current = queue[pointer];
        pointer += 1;
        cells.push(current);

        const offsets = [
          { row: current.row - 1, col: current.col },
          { row: current.row + 1, col: current.col },
          { row: current.row, col: current.col - 1 },
          { row: current.row, col: current.col + 1 }
        ];

        for (const next of offsets) {
          if (
            next.row < 0 ||
            next.row >= BOARD_ROWS ||
            next.col < 0 ||
            next.col >= BOARD_COLS
          ) {
            continue;
          }
          if (visited[next.row][next.col]) {
            continue;
          }
          if (!matchMask[next.row][next.col]) {
            continue;
          }
          if (board[next.row][next.col] !== target) {
            continue;
          }
          visited[next.row][next.col] = true;
          queue.push(next);
        }
      }

      if (target) {
        groups.push({ cells, type: target });
      }
    }
  }

  return { matchMask, groups };
};

const resolveBoard = (board: ElementType[][]): ResolutionResult => {
  const working: (ElementType | null)[][] = board.map(row => [...row]);
  const combos: ComboDetail[] = [];
  let scoreGain = 0;
  let cascade = 0;

  while (true) {
    const { matchMask, groups } = findMatches(working as ElementType[][]);
    if (groups.length === 0) {
      break;
    }

    cascade += 1;
    const cascadeMultiplier = 1 + (cascade - 1) * 0.25;

    for (const group of groups) {
      const size = group.cells.length;
      const basePoints = 50 + size * 20;
      const points = Math.round(basePoints * cascadeMultiplier);
      scoreGain += points;
      combos.push({
        type: group.type,
        size,
        points,
        cascade
      });
    }

    for (let row = 0; row < BOARD_ROWS; row += 1) {
      for (let col = 0; col < BOARD_COLS; col += 1) {
        if (matchMask[row][col]) {
          working[row][col] = null;
        }
      }
    }

    for (let col = 0; col < BOARD_COLS; col += 1) {
      let writeRow = BOARD_ROWS - 1;
      for (let row = BOARD_ROWS - 1; row >= 0; row -= 1) {
        const cell = working[row][col];
        if (cell !== null) {
          working[writeRow][col] = cell;
          if (writeRow !== row) {
            working[row][col] = null;
          }
          writeRow -= 1;
        }
      }
      for (let fillRow = writeRow; fillRow >= 0; fillRow -= 1) {
        working[fillRow][col] = generateOrb(working, fillRow, col);
      }
    }
  }

  const finalBoard: ElementType[][] = working.map(row =>
    row.map(cell => cell ?? randomOrb())
  );

  return { board: finalBoard, combos, scoreGain };
};

const App = () => {
  const [language, setLanguage] = useState<Locale>('ja');
  const t = useMemo(() => TRANSLATIONS[language], [language]);
  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(NUMBER_LOCALES[language]),
    [language]
  );
  const [board, setBoard] = useState<ElementType[][]>(() => createInitialBoard());
  const boardStateRef = useRef(board);
  useEffect(() => {
    boardStateRef.current = board;
  }, [board]);

  const [selected, setSelected] = useState<CellPosition | null>(null);
  const [score, setScore] = useState(0);
  const [turns, setTurns] = useState(MAX_TURNS);
  const turnsRef = useRef(turns);
  useEffect(() => {
    turnsRef.current = turns;
  }, [turns]);
  const [totalCombos, setTotalCombos] = useState(0);
  const [lastCombos, setLastCombos] = useState<ComboDetail[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setMessage(t.messageReady);
  }, [t]);

  const dragSessionRef = useRef<DragSession>(createEmptyDragSession());
  const moveListenerRef = useRef<((event: PointerEvent) => void) | null>(null);
  const upListenerRef = useRef<((event: PointerEvent) => void) | null>(null);
  const cancelListenerRef = useRef<((event: PointerEvent) => void) | null>(null);

  const cleanupGlobalListeners = () => {
    if (moveListenerRef.current) {
      window.removeEventListener('pointermove', moveListenerRef.current);
      moveListenerRef.current = null;
    }
    if (upListenerRef.current) {
      window.removeEventListener('pointerup', upListenerRef.current);
      upListenerRef.current = null;
    }
    if (cancelListenerRef.current) {
      window.removeEventListener('pointercancel', cancelListenerRef.current);
      cancelListenerRef.current = null;
    }
  };

  const resetDragSession = () => {
    dragSessionRef.current = createEmptyDragSession();
  };

  useEffect(() => () => {
    cleanupGlobalListeners();
  }, []);

  const handleReset = () => {
    cleanupGlobalListeners();
    resetDragSession();
    const freshBoard = createInitialBoard();
    setBoard(freshBoard);
    boardStateRef.current = freshBoard;
    setSelected(null);
    setScore(0);
    setTurns(MAX_TURNS);
    turnsRef.current = MAX_TURNS;
    setTotalCombos(0);
    setLastCombos([]);
    setMessage(t.messageReady);
  };

  const handlePointerDown = (
    event: ReactPointerEvent<HTMLButtonElement>,
    row: number,
    col: number
  ) => {
    if (turnsRef.current <= 0) {
      setMessage(t.outOfTurns);
      setSelected(null);
      return;
    }

    event.preventDefault();
    cleanupGlobalListeners();

    const snapshot = boardStateRef.current.map(r => [...r]);

    dragSessionRef.current = {
      active: true,
      pointerId: event.pointerId,
      origin: { row, col },
      lastCell: { row, col },
      snapshot,
      latestBoard: snapshot.map(r => [...r]),
      moved: false
    };

    setSelected({ row, col });
    setMessage(t.messageReady);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const session = dragSessionRef.current;
      if (!session.active || moveEvent.pointerId !== session.pointerId) {
        return;
      }
      moveEvent.preventDefault();
      const target = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY) as
        | HTMLElement
        | null;
      if (!target) {
        return;
      }
      const rowAttr = target.getAttribute('data-row');
      const colAttr = target.getAttribute('data-col');
      if (rowAttr === null || colAttr === null) {
        return;
      }
      const nextCell = { row: Number(rowAttr), col: Number(colAttr) };
      const last = session.lastCell;
      if (!last) {
        return;
      }
      if (nextCell.row === last.row && nextCell.col === last.col) {
        return;
      }
      const distance =
        Math.abs(last.row - nextCell.row) + Math.abs(last.col - nextCell.col);
      if (distance !== 1) {
        return;
      }

      setBoard(prevBoard => {
        const nextBoard = swapCells(prevBoard, last, nextCell);
        const activeSession = dragSessionRef.current;
        activeSession.lastCell = nextCell;
        activeSession.latestBoard = nextBoard;
        activeSession.moved = true;
        boardStateRef.current = nextBoard;
        return nextBoard;
      });
      setSelected(nextCell);
    };

    const finalizeDrag = (releaseEvent: PointerEvent) => {
      const session = dragSessionRef.current;
      if (!session.active || releaseEvent.pointerId !== session.pointerId) {
        return;
      }
      releaseEvent.preventDefault();
      cleanupGlobalListeners();

      const snapshotBoard = session.snapshot ?? boardStateRef.current.map(r => [...r]);
      const boardToResolve = session.latestBoard ?? snapshotBoard;

      if (!session.moved) {
        const revertBoard = snapshotBoard.map(r => [...r]);
        setBoard(revertBoard);
        boardStateRef.current = revertBoard;
        setSelected(null);
        resetDragSession();
        setMessage(t.messageReady);
        return;
      }

      const result = resolveBoard(boardToResolve);

      if (result.combos.length === 0) {
        const revertBoard = snapshotBoard.map(r => [...r]);
        setBoard(revertBoard);
        boardStateRef.current = revertBoard;
        setSelected(null);
        setLastCombos([]);
        resetDragSession();
        setMessage(t.messageInvalidSwap);
        return;
      }

      setBoard(result.board);
      boardStateRef.current = result.board;
      setScore(prev => prev + result.scoreGain);
      setTotalCombos(prev => prev + result.combos.length);
      setLastCombos(result.combos);
      setTurns(prev => {
        const updated = Math.max(0, prev - 1);
        turnsRef.current = updated;
        setMessage(updated === 0 ? t.outOfTurns : t.messageCombo(result.combos.length));
        return updated;
      });
      setSelected(null);
      resetDragSession();
    };

    const cancelDrag = (cancelEvent: PointerEvent) => {
      const session = dragSessionRef.current;
      if (!session.active || cancelEvent.pointerId !== session.pointerId) {
        return;
      }
      cleanupGlobalListeners();
      const revertBoard = (session.snapshot ?? boardStateRef.current).map(r => [...r]);
      setBoard(revertBoard);
      boardStateRef.current = revertBoard;
      setSelected(null);
      resetDragSession();
      setMessage(t.messageReady);
    };

    moveListenerRef.current = handlePointerMove;
    upListenerRef.current = finalizeDrag;
    cancelListenerRef.current = cancelDrag;

    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', finalizeDrag);
    window.addEventListener('pointercancel', cancelDrag);
  };

  const formattedTurns = numberFormatter.format(turns);
  const formattedScore = numberFormatter.format(score);
  const formattedComboTotal = numberFormatter.format(totalCombos);

  return (
    <div className="game-shell">
      <div className="game-card">
        <header className="game-header">
          <div>
            <h1>{t.gameTitle}</h1>
            <p>{t.subtitle}</p>
          </div>
          <label className="language-select">
            <span>{t.languageSelectLabel}</span>
            <select
              value={language}
              onChange={event => setLanguage(event.target.value as Locale)}
            >
              {Object.keys(TRANSLATIONS).map(locale => (
                <option key={locale} value={locale}>
                  {TRANSLATIONS[locale as Locale].languageName}
                </option>
              ))}
            </select>
          </label>
        </header>

        <section className="scoreboard">
          <div className="stat-card">
            <span className="stat-label">{t.statsLabels.turns}</span>
            <span className="stat-value">{formattedTurns}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">{t.statsLabels.score}</span>
            <span className="stat-value">
              {formattedScore} {t.pointsUnit}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">{t.statsLabels.combos}</span>
            <span className="stat-value">{formattedComboTotal}</span>
          </div>
        </section>

        <div className="game-body">
          <div className="board-area">
            <div className="board" role="grid" aria-label="Puzzle board">
              {board.map((row, rowIndex) =>
                row.map((cell, colIndex) => {
                  const isSelected =
                    selected?.row === rowIndex && selected?.col === colIndex;
                  const classList = ['orb', cell];
                  if (isSelected) {
                    classList.push('selected');
                  }
                  return (
                    <button
                      key={`${rowIndex}-${colIndex}`}
                      type="button"
                      className={classList.join(' ')}
                      data-row={rowIndex}
                      data-col={colIndex}
                      onPointerDown={event => handlePointerDown(event, rowIndex, colIndex)}
                      onContextMenu={event => event.preventDefault()}
                      aria-label={`${t.elementNames[cell]} orb`}
                    >
                      <span className="orb-emoji">{ORB_EMOJI[cell]}</span>
                    </button>
                  );
                })
              )}
            </div>

            <div className="legend">
              {GEM_TYPES.map(type => (
                <span key={type} className={`legend-pill ${type}`}>
                  <span className="legend-emoji">{ORB_EMOJI[type]}</span>
                  <span className="legend-text">
                    {t.elementNames[type]}
                  </span>
                </span>
              ))}
            </div>

            <p className="status-message">{message}</p>

            <button className="reset-button" type="button" onClick={handleReset}>
              {t.resetButton}
            </button>
          </div>

          <aside className="sidebar">
            <section className="instructions">
              <h2>{t.instructionsTitle}</h2>
              <ol>
                {t.instructions.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </section>

            <section className="combo-log">
              <h2>{t.lastComboTitle}</h2>
              {lastCombos.length === 0 ? (
                <p className="muted">{t.noCombosYet}</p>
              ) : (
                <ul>
                  {lastCombos.map((combo, index) => {
                    const cascadeLabel = format(t.cascadeLabelTemplate, {
                      value: numberFormatter.format(combo.cascade)
                    });
                    const line = format(t.comboLineTemplate, {
                      index: index + 1,
                      element: t.elementNames[combo.type],
                      count: numberFormatter.format(combo.size),
                      points: numberFormatter.format(combo.points),
                      unit: t.pointsUnit,
                      cascade: cascadeLabel
                    });
                    return <li key={`${combo.type}-${index}`}>{line}</li>;
                  })}
                </ul>
              )}
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default App;
