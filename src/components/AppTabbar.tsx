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
 * Bottom nav, Apple's own convention: a frosted glass bar with a hairline
 * top edge, and the active tab marked by tinting its icon+label in the
 * accent colour -- not a filled block or a highlight sliding underneath.
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
    <div className="glass shrink-0 flex items-center justify-around border-t border-hairline bg-card px-1 pt-1.5"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 6px)' }}
    >
      {tabs.map(({ path, labelKey, Icon }) => {
        const isActive = pathname === path || (pathname === '/' && path === '/home')

        return (
          <button
            key={path}
            onClick={() => openTab(path, isActive)}
            aria-current={isActive ? 'page' : undefined}
            className="press-tab flex-1 h-[52px] flex flex-col items-center justify-center gap-0.5"
          >
            <Icon
              size={24}
              strokeWidth={isActive ? 2.2 : 1.8}
              className={isActive ? 'text-primary' : 'text-muted-foreground'}
            />
            <span
              className={`text-[10px] leading-none font-semibold ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {t(labelKey)}
            </span>
          </button>
        )
      })}
    </div>
  )
}
