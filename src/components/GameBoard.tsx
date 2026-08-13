import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'

import type { Board } from '../logic/board'
import { GameCell } from './GameCell'

type GameBoardProps = {
  board: Board
  onActivate: (index: number) => void
  onFlag: (index: number) => void
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

export function GameBoard({ board, onActivate, onFlag }: GameBoardProps) {
  const hoveredCell = useRef<number | null>(null)
  const flagHandler = useRef(onFlag)

  // Keep the window listener stable while React supplies the latest callback.
  flagHandler.current = onFlag

  useEffect(() => {
    const flagHoveredCell = (event: KeyboardEvent) => {
      const index = hoveredCell.current
      const modified = event.altKey || event.ctrlKey || event.metaKey

      if (
        index === null
        || event.repeat
        || modified
        || event.key.toLowerCase() !== 'f'
      ) {
        return
      }

      event.preventDefault()
      flagHandler.current(index)
    }

    window.addEventListener('keydown', flagHoveredCell)
    return () => window.removeEventListener('keydown', flagHoveredCell)
  }, [])

  const setHoveredCell = (index: number) => {
    hoveredCell.current = index
  }

  const clearHoveredCell = (index: number) => {
    if (hoveredCell.current === index) {
      hoveredCell.current = null
    }
  }

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
                    onActivate={onActivate}
                    onFlag={onFlag}
                    onPointerEnter={setHoveredCell}
                    onPointerLeave={clearHoveredCell}
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
