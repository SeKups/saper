import type { KeyboardEvent, MouseEvent } from 'react'

import type { Board, Cell } from '../logic/board'

type GameCellProps = {
  cell: Cell
  gameState: Board['state']
  index: number
  onFlag: (index: number) => void
  onReveal: (index: number) => void
}

function cellLabel(cell: Cell, index: number, gameState: Board['state']): string {
  const field = `pole ${index + 1}`

  if (gameState === 'lost' && cell.mine) {
    return `Mina, ${field}`
  }

  if (gameState === 'lost' && cell.flagged) {
    return `Błędna flaga, ${field}`
  }

  if (cell.flagged) {
    return `Flaga, ${field}`
  }

  if (!cell.revealed) {
    return `Zakryte ${field}`
  }

  return cell.adjacent === 0
    ? `Puste ${field}`
    : `Liczba ${cell.adjacent}, ${field}`
}

function cellContent(cell: Cell, gameState: Board['state']): string {
  if (cell.mine && (cell.revealed || gameState === 'lost')) {
    return '✹'
  }

  if (cell.flagged) {
    return '⚑'
  }

  return cell.revealed && cell.adjacent > 0
    ? String(cell.adjacent)
    : ''
}

export function GameCell({
  cell,
  gameState,
  index,
  onFlag,
  onReveal,
}: GameCellProps) {
  const mineVisible = cell.mine && (cell.revealed || gameState === 'lost')
  const terminal = gameState === 'won' || gameState === 'lost'
  const classes = [
    'game-cell',
    cell.revealed ? 'game-cell--revealed' : '',
    cell.flagged ? 'game-cell--flagged' : '',
    mineVisible ? 'game-cell--mine' : '',
    cell.mine && cell.revealed ? 'game-cell--exploded' : '',
    gameState === 'lost' && cell.flagged && !cell.mine ? 'game-cell--wrong-flag' : '',
    cell.revealed && !cell.mine && cell.adjacent > 0
      ? `game-cell--number-${cell.adjacent}`
      : '',
  ].filter(Boolean).join(' ')

  const handleContextMenu = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    onFlag(index)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key.toLowerCase() === 'f') {
      event.preventDefault()
      onFlag(index)
    }
  }

  return (
    <button
      aria-disabled={terminal}
      aria-label={cellLabel(cell, index, gameState)}
      aria-pressed={cell.flagged}
      className={classes}
      type="button"
      onClick={() => onReveal(index)}
      onContextMenu={handleContextMenu}
      onKeyDown={handleKeyDown}
    >
      <span aria-hidden="true">{cellContent(cell, gameState)}</span>
    </button>
  )
}
