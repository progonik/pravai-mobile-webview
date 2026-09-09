import { useEffect, useLayoutEffect, useRef } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useOverlay } from '../context/OverlayContext'
import { AppTabbar } from './AppTabbar'
import { WelcomeScreen } from './WelcomeScreen'
import { HomePage } from '../pages/HomePage'
import { NotificationsPage } from '../pages/NotificationsPage'
import { MistakesPage } from '../pages/MistakesPage'
import { TestsPage } from '../pages/TestsPage'
import { TestTypePage } from '../pages/TestTypePage'
import { QuizIntroPage } from '../pages/QuizIntroPage'
import { QuizPage } from '../pages/QuizPage'
import { ResultPage } from '../pages/ResultPage'
import { ChatPage } from '../pages/ChatPage'
import { ProfilePage } from '../pages/ProfilePage'
import { MyInfoPage } from '../pages/MyInfoPage'

/** Routes where the bottom tabbar stays visible */
const TAB_ROUTES = ['/home', '/tests', '/chat', '/profile']

/** The chat tab is a composer with a drawer, not a list-then-detail push --
 *  every /chat/:id is still "the chat tab", not a pushed sub-screen. */
function isTabScreen(pathname: string): boolean {
  return TAB_ROUTES.includes(pathname) || pathname === '/' || pathname.startsWith('/chat/')
}

/**
 * Scroll position per route, so returning to a tab lands where the user left
 * off rather than at the top — the way a native tab bar or stack navigator
 * behaves.
 *
 * Every page owns its own scroll container, and the old one is gone from the
 * DOM by the time the route has changed — so positions are recorded live from
 * a capture-phase scroll listener rather than read at navigation time, and
 * only restored once the next page has mounted. A page that paints from the
 * query cache restores exactly; one that is still loading clamps to the top,
 * which is where it would have started anyway.
 */
function ScrollMemory() {
  const { pathname } = useLocation()
  const positions = useRef(new Map<string, number>())

  useEffect(() => {
    const onScroll = (e: Event) => {
      const t = e.target
      if (t instanceof HTMLElement && t.classList.contains('overflow-y-auto'))
        positions.current.set(pathname, t.scrollTop)
    }
    document.addEventListener('scroll', onScroll, { capture: true, passive: true })
    return () => document.removeEventListener('scroll', onScroll, { capture: true })
  }, [pathname])

  useLayoutEffect(() => {
    const saved = positions.current.get(pathname)
    if (!saved) return
    document.querySelector<HTMLElement>('.overflow-y-auto')?.scrollTo({ top: saved })
  }, [pathname])

  return null
}

export function AppShell() {
  const { isAuthorized, justSignedIn } = useAuth()
  const { pathname } = useLocation()
  const { hasOverlay } = useOverlay()

  if (!isAuthorized) return <Navigate to="/login" replace />

  // Dropped while a bottom sheet is up — the sheet's backdrop covers only the
  // routed content, so the tabs would otherwise sit lit on top of it.
  const showTabbar = isTabScreen(pathname) && !hasOverlay

  return (
    <div className="flex flex-col h-app bg-background relative overflow-hidden">
      {/* Ambient surface: dot grid + brand light from the top. Sits under
          everything; pages with opaque backgrounds simply cover it. */}
      <div className="bg-decor" aria-hidden="true" />

      {/* Keyed by pathname so every navigation replays the entry animation:
          tab switches cross-fade, pushed sub-screens slide in from the right
          (see .screen-tab / .screen-stack in index.css). */}
      <div
        key={pathname}
        className={`relative flex-1 min-h-0 overflow-hidden flex flex-col ${
          isTabScreen(pathname) ? 'screen-tab' : 'screen-stack'
        }`}
      >
        <Routes>
          <Route index element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/mistakes" element={<MistakesPage />} />
          <Route path="/mistakes/:topicId" element={<MistakesPage />} />
          <Route path="/mistakes/:topicId/quiz" element={<QuizPage />} />
          <Route path="/tests" element={<TestsPage />} />
          <Route path="/tests/:mode" element={<TestTypePage />} />
          <Route path="/quiz/:templateId/intro" element={<QuizIntroPage />} />
          <Route path="/quiz/:templateId" element={<QuizPage />} />
          <Route path="/result" element={<ResultPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/chat/:conversationId" element={<ChatPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/info" element={<MyInfoPage />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </div>

      {/* After the routes: its restore effect must run once the incoming
          page's scroller is in the DOM. */}
      <ScrollMemory />

      {showTabbar && <AppTabbar />}

      {/* Held over the app for a couple of seconds after a fresh sign-in —
          which also gives home's first queries time to land. */}
      {justSignedIn && <WelcomeScreen />}
    </div>
  )
}
