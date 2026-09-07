import { useAuth } from '../context/AuthContext'
import { useT } from '../context/LocaleContext'

/**
 * Placeholder home screen -- scaffold-phase only. The real dashboard (recent
 * attempts, progress by topic, a "continue practice" card) needs the backend's
 * mobile-facing test-template/attempt-history endpoints wired in before it can
 * show anything real; see CLAUDE.md's backend-gap note.
 */
export function HomePage() {
  const { session } = useAuth()
  const t = useT()

  return (
    <div className="flex-1 overflow-y-auto flex flex-col top-inset px-4 pb-6">
      <div className="pt-2 pb-4">
        <p className="text-[13px] text-muted-foreground">{t('home.greeting')}</p>
        <p className="text-[20px] font-bold text-foreground">
          {session?.user.fullName ?? session?.user.phone}
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-2">
        <p className="text-[15px] font-bold text-foreground">{t('home.placeholderTitle')}</p>
        <p className="text-[13px] text-muted-foreground leading-relaxed">{t('home.placeholderBody')}</p>
      </div>
    </div>
  )
}
