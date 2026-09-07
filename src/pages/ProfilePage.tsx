import { useNavigate } from 'react-router-dom'
import { ChevronRight, LogOut, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLocale, useT } from '../context/LocaleContext'
import { LANGUAGES } from '../i18n/languages'
import { SmoothImage } from '../components/SmoothImage'

function MenuRow({ icon, label, value, onClick }: {
  icon: React.ReactNode
  label: string
  value?: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="press-row w-full flex items-center gap-3 px-4 py-3.5 text-left border-b border-hairline last:border-0"
    >
      <div className="w-9 h-9 rounded-xl bg-input-background flex items-center justify-center text-muted-foreground shrink-0">
        {icon}
      </div>
      <span className="flex-1 text-[14px] font-medium text-foreground">{label}</span>
      {value && <span className="text-[13px] text-muted-foreground">{value}</span>}
      <ChevronRight size={16} className="text-muted-foreground shrink-0" />
    </button>
  )
}

export function ProfilePage() {
  const navigate = useNavigate()
  const { profile, logout } = useAuth()
  const { lang } = useLocale()
  const t = useT()
  const currentLangLabel = LANGUAGES.find((l) => l.code === lang)?.native ?? lang

  return (
    <div className="flex-1 overflow-y-auto flex flex-col top-inset px-4 pb-8">
      {/* Header */}
      <button
        onClick={() => navigate('/profile/info')}
        className="press w-full flex items-center gap-3.5 py-4 text-left"
      >
        <div className="w-14 h-14 rounded-full bg-input-background flex items-center justify-center overflow-hidden shrink-0 relative">
          {profile?.avatarUrl ? (
            <SmoothImage src={profile.avatarUrl} className="w-full h-full object-cover" />
          ) : (
            <User size={26} className="text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display text-[16px] font-bold text-foreground truncate">
            {profile?.fullName || t('profile.noName')}
          </p>
          <p className="text-[13px] text-muted-foreground numeric">{profile?.phone}</p>
        </div>
        <ChevronRight size={18} className="text-muted-foreground shrink-0" />
      </button>

      {/* Menu */}
      <div className="mt-3 rounded-2xl border border-border bg-card overflow-hidden">
        <MenuRow
          icon={<User size={17} />}
          label={t('profile.myInfo')}
          onClick={() => navigate('/profile/info')}
        />
        <MenuRow
          icon={<span className="text-[15px] leading-none">🌐</span>}
          label={t('profile.language')}
          value={currentLangLabel}
          onClick={() => navigate('/profile/info')}
        />
      </div>

      <button
        onClick={logout}
        className="press mt-5 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-destructive/10 text-destructive font-semibold text-[14px]"
      >
        <LogOut size={17} />
        {t('profile.logout')}
      </button>
    </div>
  )
}
