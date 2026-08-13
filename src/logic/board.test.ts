import { describe, expect, it } from 'vitest'

import { levels } from '../data/levels'
import * as boardModule from './board'
import { createBoard, revealCell, toggleFlag } from './board'
import type { Level } from './board'

function level(id: string): Level {
  const result = levels.find((candidate) => candidate.id === id)

  if (result === undefined) {
    throw new Error(`Missing level fixture: ${id}`)
  }

  return result
}

function effectiveMineCount(id: string): number {
  return createBoard(level(id)).cells.filter((cell) => cell.mine).length
}

function fixture(
  width: number,
  height: number,
  mines: Level['mines'],
): Level {
  return {
    id: 'fixture',
    name: 'Fixture',
    width,
    height,
    mineCount: mines.length,
    mines,
  }
}

function mineIndexes(board: ReturnType<typeof createBoard>): number[] {
  return board.cells.flatMap((cell, index) => cell.mine ? [index] : [])
}

describe('createBoard', () => {
  it('exposes only the required runtime functions', () => {
    expect(Object.keys(boardModule).sort()).toEqual([
      'createBoard',
      'revealCell',
      'toggleFlag',
    ])
  })

  it('creates rectangular cells row by row in the idle state', () => {
    const board = createBoard(level('spacer'))

    expect(board).toMatchObject({ width: 12, height: 10, state: 'idle' })
    expect(board.cells).toHaveLength(120)
    expect(board.cells.every((cell) => !cell.revealed && !cell.flagged)).toBe(true)
    expect(board.cells[11]?.mine).toBe(false)
    expect(board.cells[12]?.mine).toBe(false)
  })

  it.each([
    ['rozgrzewka', 10],
    ['spacer', 18],
    ['rachmistrz', 12],
    ['bliznieta', 7],
    ['za-plotem', 5],
    ['laka', 0],
    ['ciasno', 9],
  ])('derives the effective mine count for %s from valid unique coordinates', (id, expected) => {
    expect(effectiveMineCount(id)).toBe(expected)
  })

  it('counts a duplicated coordinate only once in adjacency', () => {
    const board = createBoard(level('bliznieta'))
    const neighbourOfDuplicatedMine = board.cells[10]

    expect(board.cells[20]?.mine).toBe(true)
    expect(neighbourOfDuplicatedMine?.adjacent).toBe(1)
  })

  it('rejects an out-of-bounds coordinate before converting it to an index', () => {
    const board = createBoard(level('za-plotem'))

    expect(board.cells[32]?.mine).toBe(false)
    expect(board.cells.filter((cell) => cell.mine)).toHaveLength(5)
  })

  it('ignores malformed coordinates without mutating the level', () => {
    const malformed: Level = {
      id: 'malformed',
      name: 'Malformed',
      width: 2,
      height: 2,
      mineCount: 99,
      mines: [[0, 0], [0, 0], [-1, 0], [2, 0], [1.5, 1]],
    }
    const snapshot = structuredClone(malformed)

    expect(createBoard(malformed).cells.filter((cell) => cell.mine)).toHaveLength(1)
    expect(malformed).toEqual(snapshot)
  })
})

describe('revealCell', () => {
  it('moves a first-clicked mine to the lowest free index and recalculates adjacency', () => {
    const board = createBoard(fixture(3, 2, [[0, 0], [2, 1]]))
    const snapshot = structuredClone(board)

    const revealed = revealCell(board, 0)

    expect(mineIndexes(revealed)).toEqual([1, 5])
    expect(revealed.cells[0]).toMatchObject({ mine: false, revealed: true, adjacent: 1 })
    expect(revealed.cells[2]?.adjacent).toBe(2)
    expect(revealed.state).toBe('playing')
    expect(board).toEqual(snapshot)
    expect(revealed).not.toBe(board)
    expect(revealed.cells.every((cell, index) => cell !== board.cells[index])).toBe(true)
  })

  it('keeps first-click relocation safe for every non-full 2x2 mine mask', () => {
    for (let mask = 1; mask < 15; mask += 1) {
      const mines = [0, 1, 2, 3]
        .filter((index) => (mask & (1 << index)) !== 0)
        .map<[number, number]>((index) => [index % 2, Math.floor(index / 2)])
      const originalMineIndexes = mines.map(([x, y]) => y * 2 + x)

      for (const selectedIndex of originalMineIndexes) {
        const board = createBoard(fixture(2, 2, mines))
        const destination = [0, 1, 2, 3]
          .find((index) => index !== selectedIndex && !originalMineIndexes.includes(index))
        const revealed = revealCell(board, selectedIndex)

        expect(destination).toBeDefined()
        expect(revealed.cells[selectedIndex]?.mine).toBe(false)
        expect(revealed.cells[selectedIndex]?.revealed).toBe(true)
        expect(revealed.cells[destination!]?.mine).toBe(true)
        expect(mineIndexes(revealed)).toHaveLength(originalMineIndexes.length)
        expect(revealed.state).not.toBe('lost')
      }
    }
  })

  it('loses on an all-mine board because relocation has no destination', () => {
    const board = createBoard(fixture(2, 1, [[0, 0], [1, 0]]))

    const revealed = revealCell(board, 0)

    expect(mineIndexes(revealed)).toEqual([0, 1])
    expect(revealed.cells[0]?.revealed).toBe(true)
    expect(revealed.state).toBe('lost')
  })

  it('reveals a zero-mine board completely and wins on the first move', () => {
    const revealed = revealCell(createBoard(level('laka')), 12)

    expect(revealed.cells.every((cell) => cell.revealed)).toBe(true)
    expect(revealed.state).toBe('won')
  })

  it('cascades through zeroes and their border without revealing flags', () => {
    const board = createBoard(fixture(3, 3, [[2, 2]]))
    const flagged = toggleFlag(board, 7)

    const revealed = revealCell(flagged, 0)

    expect(revealed.cells[7]).toMatchObject({ flagged: true, revealed: false })
    expect(revealed.cells[2]).toMatchObject({ adjacent: 0, revealed: true })
    expect(revealed.cells[4]).toMatchObject({ adjacent: 1, revealed: true })
    expect(revealed.cells[8]?.revealed).toBe(false)
    expect(revealed.state).toBe('playing')
  })

  it('wins after all safe cells are revealed, independently of mineCount', () => {
    const misleadingLevel = {
      ...fixture(2, 1, [[1, 0]]),
      mineCount: 0,
    }

    const revealed = revealCell(createBoard(misleadingLevel), 0)

    expect(revealed.state).toBe('won')
  })

  it('loses after a later mine reveal and rejects every terminal move', () => {
    const playing = revealCell(createBoard(fixture(2, 2, [[1, 1]])), 0)
    const lost = revealCell(playing, 3)

    expect(playing.state).toBe('playing')
    expect(lost.state).toBe('lost')
    expect(lost.cells[3]?.revealed).toBe(true)
    expect(revealCell(lost, 1)).toBe(lost)
    expect(toggleFlag(lost, 1)).toBe(lost)
  })

  it('performs a chord and its cascade when the flag count matches', () => {
    const playing = revealCell(createBoard(fixture(3, 3, [[0, 0]])), 4)
    const flagged = toggleFlag(playing, 0)

    const chorded = revealCell(flagged, 4)

    expect(chorded.cells[0]).toMatchObject({ mine: true, flagged: true, revealed: false })
    expect(chorded.cells.filter((cell) => !cell.mine).every((cell) => cell.revealed)).toBe(true)
    expect(chorded.state).toBe('won')
  })

  it('returns the same board when a chord has the wrong flag count', () => {
    const playing = revealCell(createBoard(fixture(3, 3, [[0, 0]])), 4)

    expect(revealCell(playing, 4)).toBe(playing)
  })

  it('loses a chord when the matching number of flags is misplaced', () => {
    const playing = revealCell(createBoard(fixture(3, 3, [[0, 0]])), 4)
    const misplacedFlag = toggleFlag(playing, 2)

    const chorded = revealCell(misplacedFlag, 4)

    expect(chorded.cells[0]?.revealed).toBe(true)
    expect(chorded.cells[2]).toMatchObject({ mine: false, flagged: true, revealed: false })
    expect(chorded.state).toBe('lost')
  })

  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, 4])(
    'returns the same board for an invalid index: %s',
    (index) => {
      const board = createBoard(fixture(2, 2, []))

      expect(revealCell(board, index)).toBe(board)
      expect(toggleFlag(board, index)).toBe(board)
    },
  )

  it('does not wrap neighbours between rows on a rectangular board', () => {
    const board = createBoard(fixture(3, 2, [[2, 0]]))

    expect(board.cells[3]?.adjacent).toBe(0)
    expect(board.cells[5]?.adjacent).toBe(1)
  })
})

describe('toggleFlag', () => {
  it('toggles an unrevealed cell immutably without starting the game', () => {
    const board = createBoard(fixture(2, 2, [[1, 1]]))
    const snapshot = structuredClone(board)

    const flagged = toggleFlag(board, 0)
    const unflagged = toggleFlag(flagged, 0)

    expect(flagged.cells[0]?.flagged).toBe(true)
    expect(flagged.state).toBe('idle')
    expect(unflagged.cells[0]?.flagged).toBe(false)
    expect(board).toEqual(snapshot)
    expect(flagged).not.toBe(board)
    expect(flagged.cells[0]).not.toBe(board.cells[0])
  })

  it('keeps flagged cells closed and refuses to flag revealed cells', () => {
    const board = createBoard(fixture(2, 2, [[1, 1]]))
    const flagged = toggleFlag(board, 0)

    expect(revealCell(flagged, 0)).toBe(flagged)

    const revealed = revealCell(board, 0)
    expect(toggleFlag(revealed, 0)).toBe(revealed)
  })
})
