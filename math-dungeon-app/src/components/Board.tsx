import { ORB_EMOJI } from '../gameConfig';
import type { CellPosition, ElementType, Translation } from '../types';

interface Props {
  board: ElementType[][];
  selected: CellPosition | null;
  onPointerDown: (
    event: React.PointerEvent<HTMLButtonElement>,
    row: number,
    col: number
  ) => void;
  t: Translation;
  onReset: () => void;
  message: string;
  isOutOfTurns: boolean;
}

export const Board = ({
  board,
  selected,
  onPointerDown,
  t,
  onReset,
  message,
  isOutOfTurns
}: Props) => (
  <div className="board-area">
    <div className="board" role="grid" aria-label="Puzzle board">
      {board.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          const isSelected = selected?.row === rowIndex && selected?.col === colIndex;
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
              onPointerDown={event => onPointerDown(event, rowIndex, colIndex)}
              onContextMenu={event => event.preventDefault()}
              aria-label={`${t.elementNames[cell]} orb`}
              disabled={isOutOfTurns}
            >
              <span className="orb-emoji">{ORB_EMOJI[cell]}</span>
            </button>
          );
        })
      )}
    </div>

    <div className="legend">
      {Object.entries(ORB_EMOJI).map(([type, emoji]) => (
        <span key={type} className={`legend-pill ${type}`}>
          <span className="legend-emoji">{emoji}</span>
          <span className="legend-text">{t.elementNames[type as ElementType]}</span>
        </span>
      ))}
    </div>

    <p className="status-message">{message}</p>

    <button className="reset-button" type="button" onClick={onReset}>
      {t.resetButton}
    </button>
  </div>
);
