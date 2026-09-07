import { useEffect, useRef, useState, type RefObject } from 'react'
import { ArrowDown, Loader2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { hapticTick } from '../lib/haptics'

/** Drag past this and releasing refreshes. */
const THRESHOLD_PX = 72
/** The indicator stops descending here — a rubber stop, not a hard wall. */
const MAX_PULL_PX = 110
/** Minimum spinner time, so a cached refetch does not blink. */
const MIN_SPIN_MS = 500

/**
 * Native pull-to-refresh for a page's scroll container: dragging down from
 * the very top shows a floating disc, releasing past the threshold
 * invalidates every cached query. The content itself never moves — only the
 * indicator — so the gesture cannot fight the scroll.
 *
 * The gesture arms only when the container is already at scrollTop 0 and the
 * drag is clearly vertical; a horizontal pull (category rail, banner swipe)
 * is left to the element that owns it.
 *
 * Render it inside a `relative` ancestor that spans the page — the indicator
 * positions against that box, dropping from just under the pinned header.
 *
 * `onRefresh` is for state the query cache does not own — the cart is held in
 * context, so invalidating queries alone would spin the indicator and change
 * nothing. It runs alongside the invalidation and the spinner waits for both.
 */
export function PullToRefresh({
  scrollRef,
  onRefresh,
}: {
  scrollRef: RefObject<HTMLElement | null>
  onRefresh?: () => Promise<unknown>
}) {
  const qc = useQueryClient()
  const [pull, setPull] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  // Mirrors drag.armed for render: transitions are off while the finger leads
  // the indicator, on when it snaps home or to the spinner seat.
  const [dragging, setDragging] = useState(false)
  const drag = useRef({ startY: 0, startX: 0, armed: false, fired: false })

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const onStart = (e: TouchEvent) => {
      const t = e.touches[0]
      drag.current =
        el.scrollTop <= 0
          ? { startY: t.clientY, startX: t.clientX, armed: true, fired: false }
          : { startY: 0, startX: 0, armed: false, fired: false }
    }

    const onMove = (e: TouchEvent) => {
      const d = drag.current
      if (!d.armed || refreshing) return
      const t = e.touches[0]
      const dy = t.clientY - d.startY
      const dx = Math.abs(t.clientX - d.startX)
      // A horizontal pull is a carousel or rail, not this gesture.
      if (dy <= 0 || dx > Math.abs(dy) * 1.2) {
        if (dy < -8) d.armed = false
        setPull(0)
        return
      }
      if (!d.fired && dy > THRESHOLD_PX) {
        d.fired = true
        hapticTick()
      }
      if (d.fired && dy <= THRESHOLD_PX) d.fired = false
      // Rubber-banding: past the threshold the pull advances at half speed.
      const eased = dy < THRESHOLD_PX ? dy : THRESHOLD_PX + (dy - THRESHOLD_PX) / 2
      setDragging(true)
      setPull(Math.min(eased, MAX_PULL_PX))
    }

    const onEnd = () => {
      const d = drag.current
      drag.current = { startY: 0, startX: 0, armed: false, fired: false }
      setDragging(false)
      if (!d.armed || refreshing) return
      if (!d.fired) {
        setPull(0)
        return
      }
      setRefreshing(true)
      setPull(THRESHOLD_PX)
      const started = Date.now()
      Promise.allSettled([qc.invalidateQueries(), onRefresh?.()]).then(() => {
        const wait = Math.max(0, MIN_SPIN_MS - (Date.now() - started))
        setTimeout(() => {
          setRefreshing(false)
          setPull(0)
        }, wait)
      })
    }

    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: true })
    el.addEventListener('touchend', onEnd, { passive: true })
    el.addEventListener('touchcancel', onEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
      el.removeEventListener('touchcancel', onEnd)
    }
  }, [qc, refreshing, scrollRef, onRefresh])

  const visible = pull > 4 || refreshing
  const ready = pull >= THRESHOLD_PX

  return (
    <div
      className="ptr"
      aria-hidden={!visible}
      style={{
        transform: `translateX(-50%) translateY(${visible ? pull * 0.7 : -48}px)`,
        opacity: visible ? 1 : 0,
        transition: dragging ? 'none' : 'transform 0.25s ease, opacity 0.2s ease',
      }}
    >
      {refreshing ? (
        <Loader2 size={18} strokeWidth={2.4} className="animate-spin" />
      ) : (
        <ArrowDown
          size={18}
          strokeWidth={2.4}
          style={{
            transform: `rotate(${ready ? 180 : 0}deg)`,
            transition: 'transform 0.2s ease',
            opacity: 0.4 + Math.min(pull / THRESHOLD_PX, 1) * 0.6,
          }}
        />
      )}
    </div>
  )
}
