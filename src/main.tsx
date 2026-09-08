import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './home-design.css'
import './learning-design.css'
import './light-design.css'
import App from './App.tsx'
import { installViewportHeight } from './lib/viewport'
import { installPressHaptics } from './lib/haptics'
import { installTheme } from './lib/theme'

// Theme first: the class must be on <html> before anything paints, or the app
// flashes light for a frame on every cold start in dark mode.
installTheme()
installViewportHeight()
installPressHaptics()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
