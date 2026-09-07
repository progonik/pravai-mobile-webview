import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useT } from '../context/LocaleContext'

/** How long the welcome holds before it dissolves into the app. */
const HOLD_MS = 2200
/** Length of the fade-out — matches `.welcome-out` in index.css. */
const FADE_MS = 420

/**
 * The moment right after signing in: a full-bleed brand screen that confirms
 * the account is open, then dissolves into the app.
 *
 * It is not just decoration — it buys the home screen the second it needs to
 * fetch the profile, banners and first page of products, so the app appears
 * populated rather than as a grid of skeletons.
 *
 * Rendered above everything by AppShell and driven by `justSignedIn`, which is
 * set only by a fresh sign-in; a restored session goes straight to the app.
 */
export function WelcomeScreen() {
  const { profile, clearJustSignedIn } = useAuth()
  const t = useT()
  const [leaving, setLeaving] = useState(false)

  const firstName = (profile?.fullName ?? '').trim().split(/\s+/)[0]

  // `clearJustSignedIn` is stable (useCallback in AuthProvider), so these
  // timers are set once. An unstable callback here would restart them on every
  // provider render, and the screen would fade out but never unmount.
  useEffect(() => {
    const hold = setTimeout(() => setLeaving(true), HOLD_MS)
    const done = setTimeout(clearJustSignedIn, HOLD_MS + FADE_MS)
    return () => {
      clearTimeout(hold)
      clearTimeout(done)
    }
  }, [clearJustSignedIn])

  return (
    <div
      className={`absolute inset-0 z-[100] flex flex-col items-center justify-center px-8 bg-primary text-primary-foreground ${
        leaving ? 'welcome-out' : ''
      }`}
      role="status"
    >
      {/* A soft bloom rather than a printed texture — glass reads through
          light and blur, not ink on paper. */}
      <div
        className="absolute -top-24 -right-16 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 70%)' }}
      />

      <div className="relative flex flex-col items-center">
        {/* Two rings expanding out of the tick, so the confirmation reads as an
            event rather than a static icon. */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          <span className="welcome-ring absolute inset-0 rounded-full border-2 border-white/50" />
          <span className="welcome-ring absolute inset-0 rounded-full border-2 border-white/30" style={{ animationDelay: '0.35s' }} />
          <div className="glass w-24 h-24 rounded-full bg-white/90 flex items-center justify-center animate-pop-in" style={{ boxShadow: 'var(--shadow-float)' }}>
            <Check size={46} className="text-primary" strokeWidth={3} />
          </div>
        </div>

        <p className="font-display text-[24px] font-bold text-center leading-tight mt-7 animate-fade-in-up">
          {firstName ? t('welcome.titleNamed', { name: firstName }) : t('welcome.title')}
        </p>
        <p
          className="text-[14px] text-primary-foreground/70 text-center leading-relaxed mt-2.5 animate-fade-in-up"
          style={{ animationDelay: '0.12s' }}
        >
          {t('welcome.body')}
        </p>
      </div>
    </div>
  )
}
