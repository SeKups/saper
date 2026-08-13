import { useState } from 'react'
import type { ChangeEvent } from 'react'

import { GameBoard } from './components/GameBoard'
import { levels } from './data/levels'
import { createBoard, revealCell, toggleFlag } from './logic/board'
import type { Level } from './logic/board'
import './styles/app.scss'

const defaultLevel = levels[0]

if (defaultLevel === undefined) {
  throw new Error('At least one level is required')
}

export function App() {
  const [selectedLevel, setSelectedLevel] = useState<Level>(defaultLevel)
  const [board, setBoard] = useState(() => createBoard(defaultLevel))

  const handleLevelChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextLevel = levels.find((level) => level.id === event.target.value)

    if (nextLevel === undefined) {
      return
    }

    setSelectedLevel(nextLevel)
    setBoard(createBoard(nextLevel))
  }

  const restartGame = () => {
    setBoard(createBoard(selectedLevel))
  }

  return (
    <main className="app">
      <header className="app__header">
        <div>
          <p className="app__eyebrow">Pole kontrolne / 01</p>
          <h1 className="app__title">Saper</h1>
        </div>
        <p className="app__intro">
          Oczyść planszę. Każdy ruch pozostaje przewidywalny — nawet ten pierwszy.
        </p>
      </header>

      <section className="control-panel" aria-label="Ustawienia gry">
        <label className="level-select">
          <span className="level-select__label">Poziom</span>
          <select
            aria-label="Wybierz poziom"
            className="level-select__control"
            value={selectedLevel.id}
            onChange={handleLevelChange}
          >
            {levels.map((level) => (
              <option value={level.id} key={level.id}>{level.name}</option>
            ))}
          </select>
        </label>

        <button className="restart-button" type="button" onClick={restartGame}>
          <span aria-hidden="true" className="restart-button__icon">↻</span>
          Uruchom planszę ponownie
        </button>
      </section>

      <GameBoard
        board={board}
        onFlag={(index) => setBoard((current) => toggleFlag(current, index))}
        onReveal={(index) => setBoard((current) => revealCell(current, index))}
      />

      <footer className="app__instructions">
        <p><kbd>LPM</kbd> odkrywa pole</p>
        <p><kbd>PPM</kbd> lub <kbd>F</kbd> ustawia flagę</p>
        <p>Wybierz odkrytą liczbę, aby odsłonić sąsiadów</p>
      </footer>
    </main>
  )
}
