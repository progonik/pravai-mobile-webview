/**
 * Tactile feedback — the half of a button press the screen cannot show.
 *
 * The webview has no native haptics handler on the bridge, so this rides on
 * the Vibration API: an 8ms pulse is short enough to read as a tick rather
 * than a buzz on Android. iOS webviews do not expose the API at all, and the
 * optional call makes that a silent no-op rather than a crash.
 */

/** One light tick — tab taps, key presses, threshold crossings. */
export const hapticTick = () => {
  try {
    navigator.vibrate?.(8)
  } catch {
    /* no API — silence */
  }
}

/** Movement past this many pixels means the finger is scrolling, not tapping. */
const DRAG_SLOP = 8
/** A press held longer than this is a long-press, not a tap. */
const TAP_MS = 700

/**
 * Tick on every tappable control, installed once at startup.
 *
 * One capture-phase listener instead of a call sprinkled into every component:
 * anything that presses (`.press`, `.press-row`, any button or link) ticks,
 * and nothing can forget to.
 *
 * It fires on release rather than on touch, and only when the finger has not
 * travelled: a scroll that happens to start on a product card is not a tap,
 * and buzzing through a flick down the feed made the whole app feel broken.
 * The ~100ms this costs against a press-time tick is not perceptible; a false
 * buzz very much is.
 */
export function installPressHaptics() {
  let candidate: { x: number; y: number; at: number; el: Element } | null = null

  document.addEventListener(
    'pointerdown',
    (e) => {
      if (e.pointerType !== 'touch') return
      const el = (e.target as Element | null)?.closest('button, [role="button"], a, .press, .press-row')
      candidate = el ? { x: e.clientX, y: e.clientY, at: e.timeStamp, el } : null
    },
    { capture: true, passive: true },
  )

  document.addEventListener(
    'pointermove',
    (e) => {
      if (!candidate) return
      if (Math.abs(e.clientX - candidate.x) > DRAG_SLOP || Math.abs(e.clientY - candidate.y) > DRAG_SLOP)
        candidate = null
    },
    { capture: true, passive: true },
  )

  const cancel = () => { candidate = null }
  document.addEventListener('pointercancel', cancel, { capture: true, passive: true })
  // A scroll can start without a pointermove reaching this listener.
  document.addEventListener('scroll', cancel, { capture: true, passive: true })

  document.addEventListener(
    'pointerup',
    (e) => {
      if (!candidate) return
      const stayedPut =
        Math.abs(e.clientX - candidate.x) <= DRAG_SLOP && Math.abs(e.clientY - candidate.y) <= DRAG_SLOP
      // Still over the control it started on — a finger that slid off is a
      // cancelled press, and the browser will not fire a click either.
      const sameTarget = candidate.el.contains(e.target as Node)
      if (stayedPut && sameTarget && e.timeStamp - candidate.at < TAP_MS) hapticTick()
      candidate = null
    },
    { capture: true, passive: true },
  )
}
