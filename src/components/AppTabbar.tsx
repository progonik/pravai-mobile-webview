import { useLocation, useNavigate } from 'react-router-dom'
import { Home, ListChecks, MessageCircle, User } from 'lucide-react'
import { useT } from '../context/LocaleContext'

// `labelKey` rather than a literal: the labels follow the selected language, and
// they double as the accessible name. Chat is deliberately not in this list --
// it gets its own detached circular button (see below), the way GitHub's tab
// bar breaks Copilot out from Home/Inbox/Explore.
const tabs = [
  { path: '/home', labelKey: 'tab.home', Icon: Home },
  { path: '/tests', labelKey: 'tab.tests', Icon: ListChecks },
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

  const openTab = (path: string, exact: boolean) => {
    // Re-tapping the tab you're already exactly on scrolls its page back to
    // the top — the standard native tab-bar gesture. Only one page is
    // mounted, so the first vertical scroller in the document is that page's.
    // Tapping Chat while inside a specific conversation (/chat/:id) isn't
    // "exact" even though the tab is highlighted — it should back out to the
    // fresh composer instead, same as tapping the chat icon in ChatGPT.
    if (exact) {
      document.querySelector('.overflow-y-auto')?.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    // `replace` — as in native tab bars, "back" does not page through
    // previously visited tabs; it leaves the app (or pops the real stack).
    navigate(path, { replace: true })
  }

  // Tapping while inside a specific conversation (/chat/:id) isn't "exact"
  // even though the button lights up -- it should back out to the fresh
  // composer instead, same as tapping the chat icon in ChatGPT.
  const isChatExact = pathname === '/chat'
  const isChatActive = isChatExact || pathname.startsWith('/chat/')

  return (
    <div
      className="absolute left-3.5 right-3.5 z-30 flex items-center gap-2.5"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 14px)', height: 62 }}
    >
      <div className="glass flex-1 h-full flex items-center justify-around rounded-full bg-chrome border border-chrome-border shadow-chrome px-1">
        {tabs.map(({ path, labelKey, Icon }) => {
          const isExact = pathname === path || (pathname === '/' && path === '/home')

          return (
            <button
              key={path}
              onClick={() => openTab(path, isExact)}
              aria-current={isExact ? 'page' : undefined}
              className="press-tab flex-1 h-full flex items-center justify-center"
            >
              <span
                className={`flex flex-col items-center justify-center gap-0.5 rounded-full py-1.5 transition-colors ${
                  isExact ? 'bg-primary/15 px-4' : 'px-1'
                }`}
              >
                <Icon
                  size={22}
                  strokeWidth={isExact ? 2.2 : 1.8}
                  className={isExact ? 'text-primary' : 'text-chrome-foreground/55'}
                />
                <span
                  className={`text-[10px] leading-none font-semibold ${
                    isExact ? 'text-primary' : 'text-chrome-foreground/55'
                  }`}
                >
                  {t(labelKey)}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {/* Chat gets its own detached circular button rather than a fourth slot
          in the pill -- it's the one destination that isn't really a "tab"
          (it's a composer you jump into, not a page you browse), so it reads
          better broken out, the way GitHub's tab bar breaks Copilot out from
          Home/Inbox/Explore. */}
      <button
        onClick={() => openTab('/chat', isChatExact)}
        aria-current={isChatActive ? 'page' : undefined}
        aria-label={t('tab.chat')}
        className={`glass press-tab shrink-0 w-[62px] h-[62px] rounded-full border shadow-chrome flex items-center justify-center transition-colors ${
          isChatActive
            ? 'bg-primary border-primary/40'
            : 'bg-chrome border-chrome-border'
        }`}
      >
        <MessageCircle
          size={24}
          strokeWidth={isChatActive ? 2.2 : 1.8}
          className={isChatActive ? 'text-primary-foreground' : 'text-chrome-foreground/55'}
        />
      </button>
    </div>
  )
}
