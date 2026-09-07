import { useLayoutEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Home, ListChecks, MessageCircle, User } from 'lucide-react'
import { useT } from '../context/LocaleContext'

// `labelKey` rather than a literal: the labels follow the selected language, and
// they double as the accessible name.
const tabs = [
  { path: '/home', labelKey: 'tab.home', Icon: Home },
  { path: '/tests', labelKey: 'tab.tests', Icon: ListChecks },
  { path: '/chat', labelKey: 'tab.chat', Icon: MessageCircle },
  { path: '/profile', labelKey: 'tab.profile', Icon: User },
] as const

/**
 * Floating dock. Held off the screen edges so it reads as an island above
 * the app rather than a bar glued to the bottom -- with the sliding
 * highlight, it is the one piece of chrome that is visibly *this* app's. It
 * stays on the app's own light palette so the bottom of every screen ends
 * in the same material the cards are made of.
 */
export function AppTabbar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const t = useT()

  const rowRef = useRef<HTMLDivElement>(null)
  // The sliding highlight under the active tab: one absolute element moved by
  // transform/width transitions (see .tab-pill in index.css), measured from
  // the active button rather than computed from indices, so it survives any
  // label length in any language.
  const [pill, setPill] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  // The first placement happens on mount and must not slide in from x=0.
  const [animated, setAnimated] = useState(false)

  useLayoutEffect(() => {
    const row = rowRef.current
    if (!row) return

    const measure = () => {
      const btn = row.querySelector<HTMLElement>('[aria-current="page"]')
      if (!btn) {
        setPill(null)
        return
      }
      const rowBox = row.getBoundingClientRect()
      const box = btn.getBoundingClientRect()
      setPill({
        x: box.left - rowBox.left + 4,
        y: box.top - rowBox.top,
        w: box.width - 8,
        h: box.height,
      })
    }

    measure()
    const raf = requestAnimationFrame(() => setAnimated(true))
    window.addEventListener('resize', measure)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', measure)
    }
  }, [pathname])

  const openTab = (path: string, active: boolean) => {
    // Re-tapping the active tab scrolls its page back to the top — the
    // standard native tab-bar gesture. Only one page is mounted, so the first
    // vertical scroller in the document is that page's.
    if (active) {
      document.querySelector('.overflow-y-auto')?.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    // `replace` — as in native tab bars, "back" does not page through
    // previously visited tabs; it leaves the app (or pops the real stack).
    navigate(path, { replace: true })
  }

  return (
    <div
      className="shrink-0 px-3 pt-1.5"
      // The dock hovers above the home indicator rather than merging with it.
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}
    >
      <div
        ref={rowRef}
        className="relative flex items-center px-2 py-1.5 rounded-[26px] bg-card border border-border shadow-float"
      >
        {pill && (
          <span
            className="tab-pill"
            aria-hidden="true"
            style={{
              transform: `translateX(${pill.x}px)`,
              top: pill.y,
              width: pill.w,
              height: pill.h,
              transition: animated ? undefined : 'none',
            }}
          />
        )}

        {tabs.map(({ path, labelKey, Icon }) => {
          const isActive = pathname === path || (pathname === '/' && path === '/home')

          return (
            <button
              key={path}
              onClick={() => openTab(path, isActive)}
              aria-current={isActive ? 'page' : undefined}
              className="press-tab relative flex-1 h-[52px] flex flex-col items-center justify-center gap-1 rounded-2xl"
            >
              <div className={`relative transition-colors duration-200 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                <Icon size={22} strokeWidth={isActive ? 2.3 : 1.8} />
              </div>
              {/* The label is what makes a tab bar readable at a glance; the
                  colour change carries the selection so the row never reflows. */}
              <span
                className={`text-[10px] leading-none font-semibold transition-colors duration-200 ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {t(labelKey)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
