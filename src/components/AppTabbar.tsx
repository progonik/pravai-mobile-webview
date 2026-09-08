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
 * Bottom nav, iMe/Telegram's convention: a floating rounded-full pill inset
 * from the screen edges -- not a bar flush with them -- so the black canvas
 * shows on all four sides and the blur reads as a chrome "island" rather than
 * painted-on chrome. Absolutely positioned (see AppShell): content scrolls
 * full-bleed underneath it, which is what makes the blur visible at all.
 *
 * The active tab additionally gets its own small pill behind the icon
 * (GitHub-app style), rather than just a color/weight tint -- it needs to
 * read at a glance, not just on close inspection.
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
      className="glass absolute left-3.5 right-3.5 z-30 flex items-center justify-around rounded-full bg-chrome border border-chrome-border shadow-chrome px-1"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 14px)', height: 62 }}
    >
      {tabs.map(({ path, labelKey, Icon }) => {
        const isActive = pathname === path || (pathname === '/' && path === '/home')

        return (
          <button
            key={path}
            onClick={() => openTab(path, isActive)}
            aria-current={isActive ? 'page' : undefined}
            className="press-tab flex-1 h-full flex flex-col items-center justify-center gap-0.5"
          >
            <span
              className={`flex items-center justify-center rounded-full transition-colors ${
                isActive ? 'bg-primary/15 px-3 py-1' : 'px-3 py-1'
              }`}
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.2 : 1.8}
                className={isActive ? 'text-primary' : 'text-chrome-foreground/55'}
              />
            </span>
            <span
              className={`text-[10px] leading-none font-semibold ${
                isActive ? 'text-primary' : 'text-chrome-foreground/55'
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
