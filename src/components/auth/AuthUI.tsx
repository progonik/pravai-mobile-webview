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
 * The wordmark. The tile carries the brand gradient and its own glow, the same
 * surface the balance card and the promo banners are made of — so the first
 * screen of the app already looks like the app.
 */
export function LogoMark() {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="w-10 h-10 rounded-2xl flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #3B7BFF 0%, #2563EB 48%, #1B3FA8 100%)',
          boxShadow: 'var(--elevation-brand)',
        }}
      >
        <svg width="21" height="21" viewBox="0 0 22 22" fill="none">
          <path d="M11 2L4 6.5V15.5L11 20L18 15.5V6.5L11 2Z" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M11 7L8 9.5V14.5L11 17L14 14.5V9.5L11 7Z" fill="white" />
        </svg>
      </div>
      <div>
        <div className="text-[15px] font-bold text-foreground tracking-tight leading-none">PravAI</div>
        <div className="text-[9px] font-semibold text-muted-foreground tracking-[0.14em] uppercase leading-none mt-1">Haydovchilik</div>
      </div>
    </div>
  )
}
