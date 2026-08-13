import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './styles/variables.scss'

const rootElement = document.getElementById('root')

if (rootElement === null) {
  throw new Error('Application root element is missing')
}

createRoot(rootElement).render(
  <StrictMode>
    <div />
  </StrictMode>,
)
