import { createContext, useCallback, useContext, useLayoutEffect, useState, type ReactNode } from 'react'

interface OverlayContextValue {
  /** True while at least one bottom sheet is on screen. */
  hasOverlay: boolean
  /** Register an overlay; call the returned function to release it. */
  retainOverlay: () => () => void
}

const OverlayContext = createContext<OverlayContextValue>({
  hasOverlay: false,
  retainOverlay: () => () => {},
})

/**
 * Tracks whether a bottom sheet is open, so the shell can drop the tabbar
 * while one is up.
 *
 * Sheets render `absolute inset-0` inside the routed content area, but the
 * tabbar is a sibling of that area rather than a child — so a sheet's backdrop
 * stops short of it and the tabs stay lit on top of the sheet. Rather than
 * restacking every sheet, the shell simply hides the tabbar while one is open.
 *
 * A count rather than a boolean: sheets can overlap (one opening as another
 * closes), and the tabbar should return only once the last is gone.
 */
export function OverlayProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0)

  const retainOverlay = useCallback(() => {
    setCount((c) => c + 1)
    let released = false
    return () => {
      if (released) return // guard against a double release
      released = true
      setCount((c) => Math.max(0, c - 1))
    }
  }, [])

  return (
    <OverlayContext.Provider value={{ hasOverlay: count > 0, retainOverlay }}>
      {children}
    </OverlayContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useOverlay() {
  return useContext(OverlayContext)
}

/**
 * Hide the tabbar while `open`. Call with a literal `true` from inside a sheet
 * that only mounts when it is shown, or pass the flag when the sheet is
 * rendered inline.
 *
 * A layout effect, not a plain one: `useEffect` runs *after* the browser
 * paints, so the frame in which the sheet starts sliding up is painted with
 * the tabbar still mounted, and it then vanishes a frame later — which reads
 * as the tabbar lagging behind the sheet. Running before paint retires it in
 * the same frame the sheet first appears.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useHidesTabbar(open: boolean) {
  const { retainOverlay } = useOverlay()

  useLayoutEffect(() => {
    if (!open) return
    return retainOverlay()
  }, [open, retainOverlay])
}
