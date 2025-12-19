import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { BOARD_COLS, BOARD_ROWS, GEM_TYPES, MAX_TURNS } from '../gameConfig';
import type { CellPosition, ComboDetail, ElementType, Translation } from '../types';

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

const findMatches = (board: ElementType[][]) => {
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
  const groups: { cells: CellPosition[]; type: ElementType }[] = [];

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

const resolveBoard = (board: ElementType[][]) => {
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

  const finalBoard: ElementType[][] = working.map(row => row.map(cell => cell ?? randomOrb()));

  return { board: finalBoard, combos, scoreGain };
};

const createEmptyDragSession = () => ({
  active: false,
  pointerId: null as number | null,
  origin: null as CellPosition | null,
  lastCell: null as CellPosition | null,
  snapshot: null as ElementType[][] | null,
  latestBoard: null as ElementType[][] | null,
  moved: false
});

export const useGameEngine = (t: Translation, turnLimit: number | null) => {
  const [board, setBoard] = useState<ElementType[][]>(() => createInitialBoard());
  const boardStateRef = useRef(board);
  const [selected, setSelected] = useState<CellPosition | null>(null);
  const [score, setScore] = useState(0);
  const [turns, setTurns] = useState<number>(turnLimit ?? MAX_TURNS);
  const turnsRef = useRef(turns);
  const [totalCombos, setTotalCombos] = useState(0);
  const [lastCombos, setLastCombos] = useState<ComboDetail[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    boardStateRef.current = board;
  }, [board]);

  useEffect(() => {
    turnsRef.current = turns;
  }, [turns]);

  useEffect(() => {
    setMessage(t.messageReady);
  }, [t]);

  const dragSessionRef = useRef(createEmptyDragSession());
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

  useEffect(
    () => () => {
      cleanupGlobalListeners();
    },
    []
  );

  const handleReset = useCallback(() => {
    cleanupGlobalListeners();
    resetDragSession();
    const freshBoard = createInitialBoard();
    setBoard(freshBoard);
    boardStateRef.current = freshBoard;
    setSelected(null);
    setScore(0);
    const startingTurns = turnLimit ?? MAX_TURNS;
    setTurns(startingTurns);
    turnsRef.current = startingTurns;
    setTotalCombos(0);
    setLastCombos([]);
    setMessage(t.messageReady);
  }, [t, turnLimit]);

  const handlePointerDown = useCallback((
    event: ReactPointerEvent<HTMLButtonElement>,
    row: number,
    col: number
  ) => {
    if (turnLimit !== null && turnsRef.current <= 0) {
      setMessage(t.outOfTurns);
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);

    cleanupGlobalListeners();
    resetDragSession();

    dragSessionRef.current = {
      active: true,
      pointerId: event.pointerId,
      origin: { row, col },
      lastCell: { row, col },
      snapshot: boardStateRef.current.map(r => [...r]),
      latestBoard: boardStateRef.current.map(r => [...r]),
      moved: false
    };

    setSelected({ row, col });

    const handleMove = (moveEvent: PointerEvent) => {
      const session = dragSessionRef.current;
      if (!session.active || session.pointerId !== moveEvent.pointerId || !session.snapshot) {
        return;
      }

      const target = moveEvent.target as HTMLElement | null;
      const rowAttr = target?.getAttribute('data-row');
      const colAttr = target?.getAttribute('data-col');
      if (rowAttr == null || colAttr == null) {
        return;
      }

      const newRow = Number.parseInt(rowAttr, 10);
      const newCol = Number.parseInt(colAttr, 10);
      if (
        !Number.isInteger(newRow) ||
        !Number.isInteger(newCol) ||
        (newRow === session.lastCell?.row && newCol === session.lastCell?.col)
      ) {
        return;
      }

      const rowDelta = Math.abs(newRow - session.lastCell!.row);
      const colDelta = Math.abs(newCol - session.lastCell!.col);
      if (rowDelta + colDelta !== 1) {
        return;
      }

      session.moved = true;
      session.latestBoard = swapCells(
        session.latestBoard ?? boardStateRef.current,
        session.lastCell!,
        {
          row: newRow,
          col: newCol
        }
      );
      session.lastCell = { row: newRow, col: newCol };
      setBoard(session.latestBoard);
      setSelected({ row: newRow, col: newCol });
    };

    const handleUp = (upEvent: PointerEvent) => {
      const session = dragSessionRef.current;
      cleanupGlobalListeners();
      if (!session.active || session.pointerId !== upEvent.pointerId || !session.snapshot) {
        resetDragSession();
        return;
      }

      const origin = session.origin;
      const lastCell = session.lastCell;
      const snapshot = session.snapshot;
      const latestBoard = session.latestBoard;
      resetDragSession();

      if (!origin || !lastCell || !latestBoard) {
        return;
      }

      if (!session.moved) {
        setSelected(origin);
        return;
      }

      const { board: resolvedBoard, combos, scoreGain } = resolveBoard(latestBoard);
      const comboCount = combos.length;
      if (comboCount === 0) {
        setBoard(snapshot);
        setSelected(origin);
        setMessage(t.messageInvalidSwap);
      } else {
        setBoard(resolvedBoard);
        setSelected(null);
        setScore(prev => prev + scoreGain);
        setTotalCombos(prev => prev + comboCount);
        setLastCombos(combos);
        setMessage(t.messageCombo(comboCount));
        if (turnLimit !== null) {
          setTurns(prev => Math.max(0, prev - 1));
        }
      }
    };

    const handleCancel = () => {
      cleanupGlobalListeners();
      resetDragSession();
      setBoard(boardStateRef.current);
      setSelected(null);
    };

    moveListenerRef.current = handleMove;
    upListenerRef.current = handleUp;
    cancelListenerRef.current = handleCancel;

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleCancel);
  }, [handleReset, setMessage, turnLimit, t.messageCombo, t.messageInvalidSwap, t.outOfTurns]);

  return {
    board,
    selected,
    score,
    turns,
    totalCombos,
    lastCombos,
    message,
    setMessage,
    handleReset,
    handlePointerDown
  };
};
