import type { CSSProperties } from 'react'

import type { Board } from '../logic/board'
import { GameCell } from './GameCell'

type GameBoardProps = {
  board: Board
  onFlag: (index: number) => void
  onReveal: (index: number) => void
}

type BoardStyle = CSSProperties & {
  '--board-columns': number
}

const statusContent: Record<Board['state'], { label: string; message: string }> = {
  idle: {
    label: 'Gotowy',
    message: 'Wybierz pole, aby rozpocząć',
  },
  playing: {
    label: 'Rozbrajanie',
    message: 'Odkryj wszystkie pola bez min',
  },
  won: {
    label: 'Sukces',
    message: 'Plansza została oczyszczona',
  },
  lost: {
    label: 'Wybuch',
    message: 'Spróbuj ponownie na tej samej planszy',
  },
}

export function GameBoard({ board, onFlag, onReveal }: GameBoardProps) {
  const mineCount = board.cells.filter((cell) => cell.mine).length
  const flagCount = board.cells.filter((cell) => cell.flagged).length
  const remainingMines = mineCount - flagCount
  const status = statusContent[board.state]
  const boardStyle: BoardStyle = { '--board-columns': board.width }

  return (
    <section className="game-board" aria-label="Plansza sapera">
      <header className="game-board__status">
        <div>
          <span className="game-board__status-label">{status.label}</span>
          <p aria-live="polite" className="game-board__status-message">
            {status.message}
          </p>
        </div>

        <p className="mine-counter" aria-label={`Pozostało min: ${remainingMines}`}>
          <span className="mine-counter__label">Pozostało min:</span>
          <strong className="mine-counter__value">{remainingMines}</strong>
        </p>
      </header>

      <div className="game-board__viewport">
        <div
          aria-label="Pole minowe"
          className="game-board__grid"
          role="group"
          style={boardStyle}
        >
          {Array.from({ length: board.height }, (_, row) => (
            <div className="game-board__row" key={row}>
              {Array.from({ length: board.width }, (__, column) => {
                const index = row * board.width + column
                const cell = board.cells[index]

                if (cell === undefined) {
                  return null
                }

                return (
                  <GameCell
                    cell={cell}
                    gameState={board.state}
                    index={index}
                    key={index}
                    onFlag={onFlag}
                    onReveal={onReveal}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
