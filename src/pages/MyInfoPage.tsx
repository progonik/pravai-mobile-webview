import { useState } from 'react'
import { ChevronRight, Phone, User } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { useAuth } from '../context/AuthContext'
import { useLocale, useT } from '../context/LocaleContext'
import { LANGUAGES } from '../i18n/languages'
import type { Lang } from '../i18n/languages'
import { UpdateProfilePage } from './UpdateProfilePage'

interface InfoRow {
  label: string
  value: string
  icon: React.ReactNode
}

export function MyInfoPage() {
  const { profile } = useAuth()
  const { lang, setLang } = useLocale()
  const t = useT()
  const [editing, setEditing] = useState(false)
  const [pickingLang, setPickingLang] = useState(false)

  if (editing) return <UpdateProfilePage onDone={() => setEditing(false)} />

  const rows: InfoRow[] = [
    { label: t('field.fullName'), value: profile?.fullName || '—', icon: <User size={16} /> },
    { label: t('field.phone'), value: profile?.phone ?? '', icon: <Phone size={16} /> },
  ]

  return (
    <div className="flex flex-col h-full bg-background">
      <PageHeader title={t('profile.myInfo')} />

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center gap-3 px-4 py-3.5 border-b border-hairline last:border-0">
              <div className="w-9 h-9 rounded-xl bg-input-background flex items-center justify-center text-muted-foreground shrink-0">
                {row.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-muted-foreground">{row.label}</p>
                <p className="text-[14px] font-medium text-foreground truncate">{row.value}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setPickingLang(true)}
          className="press-row mt-3 w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-border bg-card text-left"
        >
          <div className="w-9 h-9 rounded-xl bg-input-background flex items-center justify-center text-muted-foreground shrink-0">
            <span className="text-[15px] leading-none">🌐</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-muted-foreground">{t('profile.language')}</p>
            <p className="text-[14px] font-medium text-foreground">
              {LANGUAGES.find((l) => l.code === lang)?.native}
            </p>
          </div>
          <ChevronRight size={16} className="text-muted-foreground shrink-0" />
        </button>

        <button
          onClick={() => setEditing(true)}
          className="press-pop w-full mt-5 py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold uppercase tracking-wide text-[14px] border-2 border-edge shadow-pop"
        >
          {t('profile.editInfo')}
        </button>
      </div>

      {pickingLang && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 animate-backdrop-in"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={() => setPickingLang(false)}
          />
          <div
            className="relative bg-card rounded-t-3xl px-4 pt-3 animate-sheet-in"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}
          >
            <div className="w-10 h-1 rounded-full bg-border mx-auto mb-5" />
            <p className="text-[15px] font-bold text-foreground text-center mb-3">{t('lang.label')}</p>
            {LANGUAGES.map((l: { code: Lang; native: string; flag: string }) => (
              <button
                key={l.code}
                onClick={() => { setLang(l.code); setPickingLang(false) }}
                className={`press-row w-full flex items-center gap-3 px-3 py-3.5 rounded-xl ${lang === l.code ? 'bg-primary/5' : ''}`}
              >
                <span className="text-xl leading-none">{l.flag}</span>
                <span className="flex-1 text-left text-[14px] font-semibold text-foreground">{l.native}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
