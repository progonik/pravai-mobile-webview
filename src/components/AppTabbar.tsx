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
 * Bottom nav, matching design/pravai.html's `.tab` / `.tab.active`: each
 * button is its own surface, and the active one flips to a solid accent
 * block with the poster's edge border and a small pop shadow -- a state
 * readable from a single frame, not a highlight sliding in from off-screen.
 */
export function AppTabbar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const t = useT()

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
      <div className="flex items-center gap-1.5 px-2 py-2 rounded-[26px] bg-card border-2 border-edge">
        {tabs.map(({ path, labelKey, Icon }) => {
          const isActive = pathname === path || (pathname === '/' && path === '/home')

          return (
            <button
              key={path}
              onClick={() => openTab(path, isActive)}
              aria-current={isActive ? 'page' : undefined}
              className={`press-tab flex-1 h-[52px] flex flex-col items-center justify-center gap-1 rounded-2xl border-2 transition-colors duration-150 ${
                isActive
                  ? 'bg-primary border-edge shadow-pop-sm text-primary-foreground'
                  : 'border-transparent text-muted-foreground'
              }`}
            >
              <Icon size={21} strokeWidth={isActive ? 2.4 : 1.8} />
              <span className="text-[10px] leading-none font-extrabold uppercase tracking-wide">
                {t(labelKey)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
