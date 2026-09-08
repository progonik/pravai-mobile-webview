import { useState } from 'react'
import { Building2, Calendar, ChevronRight, MapPin, Moon, Phone, Sun, User } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { useAuth } from '../context/AuthContext'
import { useLocale, useT } from '../context/LocaleContext'
import { LANGUAGES } from '../i18n/languages'
import type { Lang } from '../i18n/languages'
import type { TranslationKey } from '../i18n/en'
import { getThemePref, setThemePref, type ThemePref } from '../lib/theme'
import { UpdateProfilePage } from './UpdateProfilePage'

interface InfoRow {
  label: string
  value: string
  icon: React.ReactNode
}

const MODES: { pref: ThemePref; labelKey: TranslationKey; Icon: typeof Sun }[] = [
  { pref: 'dark', labelKey: 'profile.modeDark', Icon: Moon },
  { pref: 'light', labelKey: 'profile.modeLight', Icon: Sun },
]

export function MyInfoPage() {
  const { profile } = useAuth()
  const { lang, setLang } = useLocale()
  const t = useT()
  const [editing, setEditing] = useState(false)
  const [pickingLang, setPickingLang] = useState(false)
  const [pickingMode, setPickingMode] = useState(false)
  // Read once from localStorage/DOM at mount, then held in state so this row's
  // own label updates immediately on pick -- setThemePref only touches the
  // DOM class, it doesn't trigger a re-render on its own.
  const [mode, setMode] = useState<ThemePref>(() => getThemePref())

  if (editing) return <UpdateProfilePage onDone={() => setEditing(false)} />

  const rows: InfoRow[] = [
    { label: t('field.fullName'), value: profile?.fullName || '—', icon: <User size={16} /> },
    { label: t('field.phone'), value: profile?.phone ?? '', icon: <Phone size={16} /> },
    { label: t('field.dateOfBirth'), value: profile?.dateOfBirth || '—', icon: <Calendar size={16} /> },
    { label: t('field.region'), value: profile?.regionName || '—', icon: <MapPin size={16} /> },
    { label: t('field.district'), value: profile?.districtName || '—', icon: <Building2 size={16} /> },
  ]

  return (
    <div className="relative flex flex-col h-full bg-background">
      <PageHeader title={t('profile.myInfo')} />

      <div className="flex-1 overflow-y-auto px-4 pb-4" style={{ paddingTop: 'calc(var(--safe-top) + 50px)' }}>
        <div className="dashed-list rounded-2xl border border-border bg-card overflow-hidden">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center gap-3 px-4 py-3.5">
              <div className="tile-accent w-9 h-9 rounded-xl bg-input-background flex items-center justify-center text-muted-foreground shrink-0">
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
          <div className="tile-accent w-9 h-9 rounded-xl bg-input-background flex items-center justify-center text-muted-foreground shrink-0">
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
          onClick={() => setPickingMode(true)}
          className="press-row mt-2 w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-border bg-card text-left"
        >
          <div className="tile-accent w-9 h-9 rounded-xl bg-input-background flex items-center justify-center text-muted-foreground shrink-0">
            {mode === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-muted-foreground">{t('profile.mode')}</p>
            <p className="text-[14px] font-medium text-foreground">
              {t(mode === 'dark' ? 'profile.modeDark' : 'profile.modeLight')}
            </p>
          </div>
          <ChevronRight size={16} className="text-muted-foreground shrink-0" />
        </button>

        <button
          onClick={() => setEditing(true)}
          className="press w-full mt-5 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-[14px] shadow-brand"
        >
          {t('profile.editInfo')}
        </button>
      </div>

      {pickingLang && (
        <div
          className="absolute inset-0 z-50 flex flex-col justify-end px-3.5"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 14px)' }}
        >
          <div
            className="absolute inset-0 animate-backdrop-in"
            style={{ background: 'rgba(0,0,0,0.55)' }}
            onClick={() => setPickingLang(false)}
          />
          {/* Inset on all sides, fully rounded -- a floating chrome pill like
              the tab bar and header buttons, not a sheet flush with the
              screen's bottom/left/right edges. */}
          <div className="glass relative bg-chrome border border-chrome-border shadow-chrome rounded-[28px] px-4 pt-3 pb-2 animate-sheet-in">
            <div className="w-10 h-1 rounded-full bg-chrome-foreground/25 mx-auto mb-5" />
            <p className="text-[15px] font-bold text-chrome-foreground text-center mb-3">{t('lang.label')}</p>
            {LANGUAGES.map((l: { code: Lang; native: string; flag: string }) => (
              <button
                key={l.code}
                onClick={() => { setLang(l.code); setPickingLang(false) }}
                className={`press-row w-full flex items-center gap-3 px-3 py-3.5 rounded-2xl ${lang === l.code ? 'bg-primary/15' : ''}`}
              >
                <span className="text-xl leading-none">{l.flag}</span>
                <span className="flex-1 text-left text-[14px] font-semibold text-chrome-foreground">{l.native}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {pickingMode && (
        <div
          className="absolute inset-0 z-50 flex flex-col justify-end px-3.5"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 14px)' }}
        >
          <div
            className="absolute inset-0 animate-backdrop-in"
            style={{ background: 'rgba(0,0,0,0.55)' }}
            onClick={() => setPickingMode(false)}
          />
          <div className="glass relative bg-chrome border border-chrome-border shadow-chrome rounded-[28px] px-4 pt-3 pb-2 animate-sheet-in">
            <div className="w-10 h-1 rounded-full bg-chrome-foreground/25 mx-auto mb-5" />
            <p className="text-[15px] font-bold text-chrome-foreground text-center mb-3">{t('profile.mode')}</p>
            {MODES.map(({ pref, labelKey, Icon }) => (
              <button
                key={pref}
                onClick={() => { setThemePref(pref); setMode(pref); setPickingMode(false) }}
                className={`press-row w-full flex items-center gap-3 px-3 py-3.5 rounded-2xl ${mode === pref ? 'bg-primary/15' : ''}`}
              >
                <Icon size={18} className="text-chrome-foreground" />
                <span className="flex-1 text-left text-[14px] font-semibold text-chrome-foreground">{t(labelKey)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
