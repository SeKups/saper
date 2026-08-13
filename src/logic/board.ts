import type { Board, Cell, Level } from './board.types'

export type { Board, Cell, Level } from './board.types'

const neighbourOffsets: [number, number][] = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
]

function normalizeDimension(value: number): number {
  return Number.isSafeInteger(value) && value > 0 ? value : 0
}

function isInsideBoard(
  x: number,
  y: number,
  width: number,
  height: number,
): boolean {
  return x >= 0 && x < width && y >= 0 && y < height
}

function collectMineIndexes(
  mines: Level['mines'],
  width: number,
  height: number,
): Set<number> {
  // Invalid records stay visible in the source asset but never become phantom cells.
  return new Set(
    mines
      .filter(([x, y]) => (
        Number.isSafeInteger(x)
        && Number.isSafeInteger(y)
        && isInsideBoard(x, y, width, height)
      ))
      .map(([x, y]) => y * width + x),
  )
}

function neighbourIndexes(
  index: number,
  width: number,
  height: number,
): number[] {
  const x = index % width
  const y = Math.floor(index / width)

  return neighbourOffsets.flatMap(([offsetX, offsetY]) => {
    const neighbourX = x + offsetX
    const neighbourY = y + offsetY
    return isInsideBoard(neighbourX, neighbourY, width, height)
      ? [neighbourY * width + neighbourX]
      : []
  })
}

function calculateAdjacency(
  cells: Cell[],
  width: number,
  height: number,
): Cell[] {
  return cells.map((cell, index) => ({
    ...cell,
    adjacent: neighbourIndexes(index, width, height)
      .filter((neighbourIndex) => cells[neighbourIndex]?.mine)
      .length,
  }))
}

function isValidIndex(board: Board, index: number): boolean {
  return Number.isSafeInteger(index)
    && index >= 0
    && index < board.cells.length
}

function cloneCells(cells: Cell[]): Cell[] {
  return cells.map((cell) => ({ ...cell }))
}

function relocateFirstMine(
  cells: Cell[],
  selectedIndex: number,
  width: number,
  height: number,
): Cell[] {
  const destination = cells.findIndex((cell, index) => (
    index !== selectedIndex && !cell.mine
  ))

  if (destination < 0) {
    return cells
  }

  // The lowest free index makes first-click relocation reproducible in tests and UI.
  const relocatedCells = cells.map((cell, index) => {
    if (index === selectedIndex) {
      return { ...cell, mine: false }
    }

    return index === destination
      ? { ...cell, mine: true }
      : cell
  })

  return calculateAdjacency(relocatedCells, width, height)
}

function revealFromSeeds(
  cells: Cell[],
  seeds: number[],
  width: number,
  height: number,
): boolean {
  const worklist = [...seeds]
  const queued = new Set(worklist)
  let mineRevealed = false

  // An index cursor avoids recursive stack growth and repeated array shifting.
  for (let cursor = 0; cursor < worklist.length; cursor += 1) {
    const index = worklist[cursor]
    const cell = cells[index]

    if (cell === undefined || cell.flagged || cell.revealed) {
      continue
    }

    cells[index] = { ...cell, revealed: true }

    if (cell.mine) {
      mineRevealed = true
      continue
    }

    if (cell.adjacent !== 0) {
      continue
    }

    for (const neighbourIndex of neighbourIndexes(index, width, height)) {
      const neighbour = cells[neighbourIndex]

      if (
        neighbour !== undefined
        && !neighbour.flagged
        && !neighbour.revealed
        && !queued.has(neighbourIndex)
      ) {
        queued.add(neighbourIndex)
        worklist.push(neighbourIndex)
      }
    }
  }

  return mineRevealed
}

function resolveState(
  cells: Cell[],
  mineRevealed: boolean,
): Board['state'] {
  if (mineRevealed) {
    return 'lost'
  }

  return cells.every((cell) => cell.mine || cell.revealed)
    ? 'won'
    : 'playing'
}

function buildRevealedBoard(
  board: Board,
  cells: Cell[],
  seeds: number[],
): Board {
  const mineRevealed = revealFromSeeds(
    cells,
    seeds,
    board.width,
    board.height,
  )

  return {
    ...board,
    cells,
    state: resolveState(cells, mineRevealed),
  }
}

function revealNeighbours(board: Board, index: number): Board {
  const selectedCell = board.cells[index]

  if (selectedCell.adjacent === 0) {
    return board
  }

  const neighbours = neighbourIndexes(index, board.width, board.height)
  const flagCount = neighbours.filter(
    (neighbourIndex) => board.cells[neighbourIndex]?.flagged,
  ).length

  if (flagCount !== selectedCell.adjacent) {
    return board
  }

  const cellsToReveal = neighbours.filter((neighbourIndex) => {
    const neighbour = board.cells[neighbourIndex]
    return neighbour !== undefined && !neighbour.flagged && !neighbour.revealed
  })

  return cellsToReveal.length === 0
    ? board
    : buildRevealedBoard(board, cloneCells(board.cells), cellsToReveal)
}

function revealClosedCell(board: Board, index: number): Board {
  let cells = cloneCells(board.cells)

  if (board.state === 'idle' && cells[index].mine) {
    cells = relocateFirstMine(cells, index, board.width, board.height)
  }

  return buildRevealedBoard(board, cells, [index])
}

export function createBoard(level: Level): Board {
  const width = normalizeDimension(level.width)
  const height = normalizeDimension(level.height)
  const mineIndexes = collectMineIndexes(level.mines, width, height)
  const cells = Array.from({ length: width * height }, (_, index): Cell => ({
    mine: mineIndexes.has(index),
    revealed: false,
    flagged: false,
    adjacent: 0,
  }))

  return {
    width,
    height,
    cells: calculateAdjacency(cells, width, height),
    state: 'idle',
  }
}

export function revealCell(board: Board, index: number): Board {
  if (
    board.state === 'won'
    || board.state === 'lost'
    || !isValidIndex(board, index)
  ) {
    return board
  }

  const selectedCell = board.cells[index]

  if (selectedCell.flagged) {
    return board
  }

  return selectedCell.revealed
    ? revealNeighbours(board, index)
    : revealClosedCell(board, index)
}

export function toggleFlag(board: Board, index: number): Board {
  if (
    board.state === 'won'
    || board.state === 'lost'
    || !isValidIndex(board, index)
  ) {
    return board
  }

  const selectedCell = board.cells[index]

  if (selectedCell.revealed) {
    return board
  }

  const cells = [...board.cells]
  cells[index] = { ...selectedCell, flagged: !selectedCell.flagged }

  return { ...board, cells }
}
