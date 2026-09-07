import { PageHeader } from '../components/PageHeader'
import { useT } from '../context/LocaleContext'

/**
 * Placeholder quiz screen -- scaffold-phase only. The real attempt flow
 * (question body/options in the user's app_language, answer submission,
 * exam-mode mistake-penalty questions) needs POST /exam/attempts and
 * POST /exam/attempts/:id/answer wired in with a proper stack UI.
 */
export function QuizPage() {
  const t = useT()

  return (
    <div className="relative flex flex-col h-full bg-background">
      <PageHeader title={t('tab.tests')} />
      <div className="flex-1 overflow-y-auto px-4 pb-4" style={{ paddingTop: 'calc(var(--safe-top) + 50px)' }}>
        <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-2">
          <p className="text-[15px] font-bold text-foreground">{t('quiz.placeholderTitle')}</p>
          <p className="text-[13px] text-muted-foreground leading-relaxed">{t('quiz.placeholderBody')}</p>
        </div>
      </div>
    </div>
  )
}
