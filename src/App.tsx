import { useCallback, useState } from 'react'
import type { ChangeEvent } from 'react'

import { GameBoard } from './components/GameBoard'
import { levels } from './data/levels'
import { createBoard, revealCell, toggleFlag } from './logic/board'
import type { Level } from './logic/board'
import './styles/app.scss'

type InteractionMode = 'reveal' | 'flag'

const defaultLevel = levels[0]

if (defaultLevel === undefined) {
  throw new Error('At least one level is required')
}

export function App() {
  const [selectedLevel, setSelectedLevel] = useState<Level>(defaultLevel)
  const [board, setBoard] = useState(() => createBoard(defaultLevel))
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('reveal')

  const revealBoardCell = useCallback((index: number) => {
    setBoard((current) => revealCell(current, index))
  }, [])

  const flagBoardCell = useCallback((index: number) => {
    setBoard((current) => toggleFlag(current, index))
  }, [])

  const flagModeActive = interactionMode === 'flag'
  const activateBoardCell = flagModeActive ? flagBoardCell : revealBoardCell

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

  const toggleInteractionMode = () => {
    setInteractionMode((current) => current === 'flag' ? 'reveal' : 'flag')
  }

  return (
    <main className="app">
      <header className="app__header">
        <div>
          <p className="app__eyebrow">Pole kontrolne / 01</p>
          <h1 className="app__title">Saper</h1>
        </div>
      </header>

      <section className="control-panel" aria-label="Ustawienia gry">
        <label className="level-select">
          <span className="level-select__label">Poziom</span>
          <span className="level-select__field">
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
          </span>
        </label>

        <button
          aria-pressed={flagModeActive}
          className="flag-mode-button"
          type="button"
          onClick={toggleInteractionMode}
        >
          <span aria-hidden="true" className="flag-mode-button__icon">⚑</span>
          <span>Tryb flag</span>
          <span className="flag-mode-button__state">
            {flagModeActive ? 'Włączony' : 'Wyłączony'}
          </span>
        </button>

        <button className="restart-button" type="button" onClick={restartGame}>
          <span aria-hidden="true" className="restart-button__icon">↻</span>
          Uruchom planszę ponownie
        </button>
      </section>

      <GameBoard
        board={board}
        onActivate={activateBoardCell}
        onFlag={flagBoardCell}
      />

      <footer className="app__instructions">
        <p><kbd>LPM</kbd> odkrywa pole</p>
        <p><kbd>PPM</kbd> ustawia flagę</p>
        <p>Najedź na pole i naciśnij <kbd>F</kbd></p>
        <p>Włącz „Tryb flag”, aby używać <kbd>LPM</kbd> lub dotyku</p>
        <p>Wybierz odkrytą liczbę, aby odsłonić sąsiadów</p>
      </footer>
    </main>
  )
}
