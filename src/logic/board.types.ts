export type Level = {
  id: string
  name: string
  width: number
  height: number
  mineCount: number
  mines: [number, number][]
}

export type Cell = {
  mine: boolean
  revealed: boolean
  flagged: boolean
  adjacent: number
}

export type Board = {
  width: number
  height: number
  cells: Cell[]
  state: 'idle' | 'playing' | 'won' | 'lost'
}
