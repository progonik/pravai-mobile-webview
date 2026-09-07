import { STORAGE_KEYS } from './storage'

/**
 * Colour scheme for the whole app, applied as a `dark` class on <html> so the
 * token block in index.css can swap the palette in one place.
 *
 * An explicit light/dark choice only — no "follow the system" mode: inside
 * the Flutter webview prefers-color-scheme is not guaranteed to reflect the
 * OS, so a system option would silently behave as light on some devices.
 */
export type ThemePref = 'light' | 'dark'

export function getThemePref(): ThemePref {
  try {
    // Anything else — unset, or a 'system' left over from an older build —
    // falls back to light.
    if (localStorage.getItem(STORAGE_KEYS.theme) === 'dark') return 'dark'
  } catch {
    // Private mode: fall through to the default.
  }
  return 'light'
}

export function setThemePref(pref: ThemePref) {
  try {
    localStorage.setItem(STORAGE_KEYS.theme, pref)
  } catch {
    // Private mode: the choice holds for this session only.
  }
  document.documentElement.classList.toggle('dark', pref === 'dark')
}

/** Call once at startup, before first paint if possible. */
export function installTheme() {
  document.documentElement.classList.toggle('dark', getThemePref() === 'dark')
}
