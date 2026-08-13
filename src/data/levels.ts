import rawBoards from './saper-plansze.json'
import type { Level } from '../logic/board.types'

export const levels: Level[] = rawBoards.levels.map<Level>((level) => ({
  ...level,
  mines: level.mines.map(([x, y]) => [x, y]),
}))
