import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'

/**
 * iOS-style segmented control: a sunken track with a white thumb that slides
 * under the active segment. The thumb is one absolute element moved by
 * transform/width — the compositor animates it, so switching stays fluid while
 * the newly selected view renders.
 *
 * One selection control app-wide: any screen offering two or three exclusive
 * views (map/list, history/requests) uses this rather than inventing its own
 * tabs.
 */
export function SegmentedControl<K extends string>({ options, value, onChange, className = '' }: {
  options: { key: K; label: ReactNode }[]
  value: K
  onChange: (key: K) => void
  className?: string
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [thumb, setThumb] = useState<{ x: number; w: number } | null>(null)
  // First placement jumps into position; only later changes slide.
  const [animated, setAnimated] = useState(false)

  useLayoutEffect(() => {
    const track = trackRef.current
    if (!track) return

    const measure = () => {
      const btn = track.querySelector<HTMLElement>('[aria-pressed="true"]')
      if (!btn) return setThumb(null)
      setThumb({ x: btn.offsetLeft, w: btn.offsetWidth })
    }

    measure()
    const raf = requestAnimationFrame(() => setAnimated(true))
    window.addEventListener('resize', measure)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', measure)
    }
  }, [value, options.length])

  return (
    <div ref={trackRef} className={`relative flex bg-input-background rounded-2xl p-1 ${className}`}>
      {thumb && (
        <span
          aria-hidden="true"
          className="absolute top-1 bottom-1 left-0 rounded-xl bg-card shadow-card pointer-events-none"
          style={{
            transform: `translateX(${thumb.x}px)`,
            width: thumb.w,
            transition: animated
              ? 'transform 0.28s cubic-bezier(0.3, 0.72, 0.2, 1), width 0.28s cubic-bezier(0.3, 0.72, 0.2, 1)'
              : 'none',
          }}
        />
      )}
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          aria-pressed={o.key === value}
          onClick={() => onChange(o.key)}
          className={`relative flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[13px] font-semibold transition-colors duration-200 ${
            o.key === value ? 'text-foreground' : 'text-muted-foreground'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
