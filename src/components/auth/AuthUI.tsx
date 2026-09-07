import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { useLocale, useT } from '../../context/LocaleContext'
import { LANGUAGES } from '../../i18n/languages'

/**
 * Language picker for the sign-in flow — the one control a user may need
 * before they can read anything else on the screen, so it sits in the top bar
 * of every auth step.
 */
export function LanguageSelector() {
  const { lang, setLang } = useLocale()
  const t = useT()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = LANGUAGES.find((l) => l.code === lang)!

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="press flex items-center gap-1.5 pl-2.5 pr-2 py-1.5 rounded-xl bg-card border border-border shadow-card text-[13px] font-medium text-foreground"
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span className="text-[12px] font-semibold text-muted-foreground">{current.code.toUpperCase()}</span>
        <ChevronDown size={13} className={`text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-44 bg-card rounded-2xl shadow-float border border-border overflow-hidden z-50">
          <div className="px-3 pt-2.5 pb-1">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t('lang.label')}</p>
          </div>
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setOpen(false) }}
              className={`press-row w-full flex items-center gap-3 px-3 py-3 ${lang === l.code ? 'bg-primary/5' : ''}`}
            >
              <span className="text-xl leading-none">{l.flag}</span>
              <span className="flex-1 text-left text-[13px] font-semibold text-foreground">{l.native}</span>
              {lang === l.code && <Check size={14} className="text-primary shrink-0" />}
            </button>
          ))}
          <div className="h-1.5" />
        </div>
      )}
    </div>
  )
}

/**
 * The wordmark. A dark tile with a hard pop shadow and a mustard-stroke car
 * icon — design/pravai.html's `.logo-mark` -- rather than a soft gradient
 * glow, so the first screen of the app already looks like the poster the
 * rest of it is printed on.
 */
export function LogoMark() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--frame)] border-2 border-edge shadow-pop-sm">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 17h1.5l1.2-4.8A2 2 0 0 1 7.6 10.6h8.8a2 2 0 0 1 1.9 1.4L19.5 17H21" />
          <circle cx="7.5" cy="17.5" r="1.7" />
          <circle cx="16.5" cy="17.5" r="1.7" />
          <path d="M5 13.5h14" />
        </svg>
      </div>
      <div>
        <div className="font-display text-[15px] font-bold text-foreground tracking-tight leading-none">PravAI</div>
        <div className="text-[9px] font-semibold text-muted-foreground tracking-[0.14em] uppercase leading-none mt-1">Haydovchilik</div>
      </div>
    </div>
  )
}
