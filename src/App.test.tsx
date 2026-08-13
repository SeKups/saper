import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { App } from './App'
import { GameBoard } from './components/GameBoard'
import { createBoard, toggleFlag } from './logic/board'
import type { Level } from './logic/board'

const compactLevel: Level = {
  id: 'compact',
  name: 'Compact',
  width: 2,
  height: 2,
  mineCount: 7,
  mines: [[0, 0], [0, 0], [3, 3]],
}

describe('App', () => {
  it('renders all levels and the complete default board', () => {
    const markup = renderToStaticMarkup(<App />)

    expect(markup.match(/<option/g)).toHaveLength(7)
    expect(markup.match(/class="game-cell/g)).toHaveLength(81)
    expect(markup).toContain('Rozgrzewka')
    expect(markup).toContain('Pozostało min:')
    expect(markup).toContain('>10<')
  })

  it('provides controls and live status descriptions', () => {
    const markup = renderToStaticMarkup(<App />)

    expect(markup).toContain('aria-label="Wybierz poziom"')
    expect(markup).toContain('Uruchom planszę ponownie')
    expect(markup).toContain('aria-live="polite"')
    expect(markup).toContain('Pierwszy ruch jest bezpieczny')
  })
})

describe('GameBoard', () => {
  it('uses effective mines and flags for the counter', () => {
    const board = toggleFlag(createBoard(compactLevel), 1)
    const markup = renderToStaticMarkup(
      <GameBoard board={board} onReveal={() => undefined} onFlag={() => undefined} />,
    )

    expect(markup).toContain('role="group"')
    expect(markup).toContain('--board-columns:2')
    expect(markup).toContain('Flaga, pole 2')
    expect(markup).toContain('>0</strong>')
    expect(markup.match(/class="game-cell/g)).toHaveLength(4)
  })
})
