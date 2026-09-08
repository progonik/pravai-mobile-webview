import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, Clock, ListChecks, ShieldAlert } from 'lucide-react'
import { listTemplates } from '../api/examService'
import { STALE_TIME } from '../api/queryClient'
import { PageHeader } from '../components/PageHeader'
import { Skeleton } from '../components/Skeleton'
import { useT, type Translate } from '../context/LocaleContext'

/** mm:ss for a template's time limit, or the "no limit" copy. */
function formatTimeLimit(seconds: number | null, t: Translate): string {
  if (seconds == null) return t('tests.noTimeLimit')
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * "Explain, then start" screen for any mode other than "practice" (see
 * TestTypePage.templateHref) -- a whole test/session, not a pick-a-topic
 * list, so it gets a moment to set expectations before questions start.
 * "exam" gets an extra rules paragraph for its mistake-limit mechanic
 * (matches the backend's own Attempt.SubmitAnswer numbers: 2 mistakes
 * allowed, +5 questions each, a 3rd fails the attempt); every other mode
 * gets the plain description, so a brand-new mode needs no code change
 * here to get a reasonable intro.
 */
export function QuizIntroPage() {
  const { templateId } = useParams<{ templateId: string }>()
  const navigate = useNavigate()
  const t = useT()

  const { data: templates, isPending, isError } = useQuery({
    queryKey: ['exam', 'templates'],
    queryFn: listTemplates,
    staleTime: STALE_TIME.feed,
  })
  const template = templates?.find((tpl) => tpl.id === templateId)

  return (
    <div className="relative flex flex-col h-full bg-background">
      <PageHeader title={template?.mode_name ?? ''} />
      <div className="flex-1 overflow-y-auto px-6 pb-6 flex flex-col" style={{ paddingTop: 'calc(var(--safe-top) + 54px)' }}>
        <div className="w-full my-auto pb-[10%]">
          {isPending ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-16 w-16 rounded-2xl" />
              <Skeleton className="h-6 w-3/4 rounded-full" />
              <Skeleton className="h-4 w-1/2 rounded-full" />
            </div>
          ) : isError || !template ? (
            <p className="text-[13px] text-muted-foreground leading-relaxed">{t('tests.loadFailed')}</p>
          ) : (
            <>
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: 'linear-gradient(135deg, #FFD873 0%, #FFC531 100%)', boxShadow: 'var(--shadow-brand)' }}
              >
                <ShieldAlert size={28} className="text-primary-foreground" />
              </div>

              <h1 className="font-display text-[22px] font-bold text-foreground leading-tight tracking-tight">
                {template.title}
              </h1>

              <div className="flex items-center gap-4 mt-3 text-[13px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <ListChecks size={15} />
                  {t('tests.questionsCount', { count: String(template.questions_per_attempt) })}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={15} />
                  {formatTimeLimit(template.time_limit_seconds, t)}
                </span>
              </div>

              <p className="text-[14px] text-muted-foreground mt-5 leading-relaxed">
                {t('quiz.intro.description')}
              </p>

              {template.mode === 'exam' && (
                <div className="mt-4 rounded-2xl border border-border bg-card p-4">
                  <p className="text-[13px] font-bold text-foreground mb-1.5">{t('quiz.intro.examRulesTitle')}</p>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">{t('quiz.intro.examRules')}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {!isPending && !isError && template && (
        <div className="px-6 pt-3 shrink-0" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 22px)' }}>
          <button
            onClick={() => navigate(`/quiz/${template.id}`)}
            className="press w-full bg-primary text-primary-foreground rounded-full py-4 text-[15px] font-semibold shadow-brand flex items-center justify-center gap-2"
          >
            {t('quiz.intro.start')}
            <ArrowRight size={18} />
          </button>
        </div>
      )}
    </div>
  )
}
