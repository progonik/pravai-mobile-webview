import { useEffect, useRef, type ReactNode } from 'react'

/** Past this much travel the gesture has an axis, and the tap it began is off. */
const AXIS_SLOP = 6
/** Rubber band beyond the ends, so hitting a limit feels elastic, not dead. */
const OVERPULL = 0.35
/** Flick decay per frame; below MIN_V the glide stops. */
const FRICTION = 0.94
const MIN_V = 0.05

/**
 * A horizontally scrolling row that never touches the vertical gesture.
 *
 * A native scroller could not be made to do this: `overflow-x` alone leaves the
 * other axis computing to `auto`, so the row counts as a vertical scroller and
 * swallows downward drags — and neither pinning `overflow-y: hidden` nor
 * `touch-action: pan-x` got the webview to hand the gesture back. So there is
 * no scroller here at all. The track is moved by `transform`, the viewport
 * declares `touch-action: pan-y`, and the browser routes every vertical drag to
 * the page because this element has nothing to scroll.
 *
 * The axis is decided once, on the first few pixels: a gesture judged vertical
 * is dropped for the rest of its life rather than contested frame by frame.
 *
 * Offset lives in a ref and is written straight to `style.transform` — a state
 * update per touchmove would re-render the whole row sixty times a second.
 */
export function HorizontalRail({ children, className = '', gap = 10, padding = 16 }: {
  children: ReactNode
  className?: string
  /** Space between items, px. */
  gap?: number
  /** Inset at both ends, px — the first item lines up with the page margin. */
  padding?: number
}) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const offset = useRef(0)
  const drag = useRef({
    startX: 0, startY: 0, startOffset: 0,
    axis: null as null | 'x' | 'y',
    lastX: 0, lastT: 0, v: 0, moved: false,
  })

  useEffect(() => {
    const view = viewportRef.current
    const track = trackRef.current
    if (!view || !track) return

    let raf = 0

    const maxOffset = () => Math.max(0, track.scrollWidth - view.clientWidth)
    const clamp = (x: number) => Math.min(Math.max(x, 0), maxOffset())

    const apply = (x: number) => {
      offset.current = x
      track.style.transform = `translate3d(${-x}px, 0, 0)`
    }

    const glide = () => {
      const s = drag.current
      s.v *= FRICTION
      const next = offset.current + s.v
      const limited = clamp(next)
      apply(limited)
      // Stop at a limit rather than grinding against it.
      if (Math.abs(s.v) > MIN_V && limited === next) raf = requestAnimationFrame(glide)
    }

    const onStart = (e: TouchEvent) => {
      cancelAnimationFrame(raf)
      const t = e.touches[0]
      drag.current = {
        startX: t.clientX, startY: t.clientY, startOffset: offset.current,
        axis: null, lastX: t.clientX, lastT: e.timeStamp, v: 0, moved: false,
      }
    }

    const onMove = (e: TouchEvent) => {
      const s = drag.current
      const t = e.touches[0]
      const dx = t.clientX - s.startX
      const dy = t.clientY - s.startY

      if (!s.axis) {
        if (Math.abs(dx) < AXIS_SLOP && Math.abs(dy) < AXIS_SLOP) return
        s.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
      }
      // A vertical verdict is final: the page owns the rest of this gesture.
      if (s.axis === 'y') return

      s.moved = true
      // Without this the page scrolls diagonally while the row is dragged.
      if (e.cancelable) e.preventDefault()

      const max = maxOffset()
      let next = s.startOffset - dx
      if (next < 0) next *= OVERPULL
      else if (next > max) next = max + (next - max) * OVERPULL

      const dt = e.timeStamp - s.lastT
      if (dt > 0) s.v = ((s.lastX - t.clientX) / dt) * 16
      s.lastX = t.clientX
      s.lastT = e.timeStamp
      apply(next)
    }

    const onEnd = () => {
      const s = drag.current
      if (s.axis !== 'x') return
      const settled = clamp(offset.current)
      if (settled !== offset.current) {
        // Released mid-rubber-band: snap back to the end.
        track.style.transition = 'transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)'
        apply(settled)
        setTimeout(() => { track.style.transition = '' }, 300)
        s.v = 0
        return
      }
      if (Math.abs(s.v) > MIN_V) raf = requestAnimationFrame(glide)
    }

    // `passive: false` on move only: preventDefault is what stops the page from
    // scrolling mid-drag, and React's delegated handlers are passive.
    view.addEventListener('touchstart', onStart, { passive: true })
    view.addEventListener('touchmove', onMove, { passive: false })
    view.addEventListener('touchend', onEnd, { passive: true })
    view.addEventListener('touchcancel', onEnd, { passive: true })

    // Content can arrive after mount (categories load) and shrink the range.
    const ro = new ResizeObserver(() => apply(clamp(offset.current)))
    ro.observe(track)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      view.removeEventListener('touchstart', onStart)
      view.removeEventListener('touchmove', onMove)
      view.removeEventListener('touchend', onEnd)
      view.removeEventListener('touchcancel', onEnd)
    }
  }, [])

  return (
    <div
      ref={viewportRef}
      className={`overflow-hidden ${className}`}
      // Vertical panning is explicitly the page's; this element claims nothing.
      style={{ touchAction: 'pan-y' }}
      // A drag that ends on an item must not also open it.
      onClickCapture={(e) => {
        if (!drag.current.moved) return
        e.preventDefault()
        e.stopPropagation()
        drag.current.moved = false
      }}
    >
      <div
        ref={trackRef}
        className="flex w-max"
        style={{ gap, paddingLeft: padding, paddingRight: padding }}
      >
        {children}
      </div>
    </div>
  )
}
