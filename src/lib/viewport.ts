/**
 * Shrinks the app to the visible area while the on-screen keyboard is open.
 *
 * `100svh` (and `100dvh`) is resolved against the layout viewport, which does
 * not shrink for the keyboard. In a webview that leaves the bottom of a
 * full-height screen — inputs, submit buttons — sitting underneath it, with no
 * way to scroll there because the app roots are `overflow-hidden`. So while the
 * keyboard is up we override the height with the visual viewport's, via the
 * `--app-height` variable that the `.h-app` utility in index.css reads.
 *
 * Deliberately does nothing the rest of the time: `visualViewport.height` also
 * moves during ordinary scrolling (collapsing toolbars, rubber-band overscroll)
 * and following it there detaches the app from the real viewport. With no
 * keyboard, `--app-height` is left unset and `.h-app` falls back to `100svh`.
 *
 * Installed once from main.tsx, before React mounts.
 */

/**
 * Minimum shrink, in px, that counts as a keyboard. Collapsing browser chrome
 * and overscroll account for a few dozen pixels at most; every phone keyboard
 * is far taller than this.
 */
const KEYBOARD_MIN_INSET = 120

export function installViewportHeight() {
  // Revealing the focused field is installed unconditionally, because it is
  // needed under *both* keyboard behaviours — see keepFocusedFieldVisible().
  // A host that resizes the whole webview shrinks the layout viewport, which
  // fires `resize` on window and nothing on visualViewport.
  window.addEventListener('resize', keepFocusedFieldVisible)
  // A field focused while the keyboard is already up gets no resize at all.
  window.addEventListener('focusin', keepFocusedFieldVisible)

  const vv = window.visualViewport
  // Without the API there is nothing better to measure than the layout
  // viewport, which is what `.h-app` already falls back to.
  if (!vv) return

  const root = document.documentElement
  let keyboardOpen = false

  const apply = () => {
    const open = window.innerHeight - vv.height > KEYBOARD_MIN_INSET

    if (open) root.style.setProperty('--app-height', `${Math.round(vv.height)}px`)
    else root.style.removeProperty('--app-height')

    if (open !== keyboardOpen) {
      keyboardOpen = open
      // iOS scrolls the *layout* viewport to reveal the focused field before it
      // reports the visual viewport change. Once the app is sized to fit, that
      // offset is just dead space above the header. Only done on the open/close
      // transition — doing it continuously fights in-progress scroll gestures.
      if (window.scrollY !== 0) window.scrollTo(0, 0)
    }
    // Every resize, not just the transition: the keyboard animates in over
    // several events, and only the last one reports its full height. Revealing
    // once, against an interim height, leaves the field short of the mark.
    keepFocusedFieldVisible()
  }

  // Only `resize` — `scroll` fires throughout every swipe, and reacting to it
  // is what makes the page feel stuck.
  vv.addEventListener('resize', apply)
  apply()
}

let revealFrame = 0

/**
 * Re-reveal the focused field once the keyboard has taken its space.
 *
 * Browsers scroll a field into view when it is focused, but do not repeat that
 * after the space it lives in shrinks underneath it — and the login screen
 * focuses its input on mount, i.e. before the keyboard has finished animating
 * in. The app roots are `overflow-hidden`, so a field left below the fold of an
 * inner scroller cannot be reached by dragging the page either.
 *
 * Which of the two shrinks happen is the host's choice: some webviews resize
 * only the visual viewport (`--app-height` above compensates), others resize
 * the webview itself and `100svh` follows. Both end with the field off-screen
 * and neither re-runs the browser's own reveal, so this listens for both.
 */
function keepFocusedFieldVisible() {
  const el = document.activeElement
  if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return
  // Coalesce the burst of events the keyboard animation produces by keeping
  // only the newest — a plain "already pending" flag would stay stuck if the
  // frame never came (a backgrounded page never paints).
  cancelAnimationFrame(revealFrame)
  // Let the new height lay out before measuring against it.
  revealFrame = requestAnimationFrame(() => {
    // Instant, not smooth: consecutive resizes during the keyboard animation
    // would each restart a smooth scroll and none would finish.
    if (document.activeElement === el) el.scrollIntoView({ block: 'center', behavior: 'auto' })
  })
}
