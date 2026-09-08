import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Flame, Gauge, PlayCircle, TriangleAlert } from 'lucide-react'
import { getHomeSummary } from '../api/examService'
import { Skeleton } from '../components/Skeleton'
import { useAuth } from '../context/AuthContext'
import { useT } from '../context/LocaleContext'

/** Practice-mode templates resume straight into the quiz; everything else
 *  (exam, daily-challenge, ...) has an intro screen -- same rule
 *  TestTypePage's templateHref uses, but resuming an attempt already
 *  under way skips the intro regardless of mode: there's nothing left to
 *  introduce. */
function resumeHref(templateId: string): string {
  return `/quiz/${templateId}`
}

function templateHref(templateId: string, mode: string): string {
  return mode === 'practice' ? `/quiz/${templateId}` : `/quiz/${templateId}/intro`
}

export function HomePage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const t = useT()

  const { data: home, isPending } = useQuery({
    queryKey: ['exam', 'home'],
    queryFn: getHomeSummary,
  })

  const hasNothingYet =
    !isPending && home && !home.resume_attempt && !home.daily_challenge && !home.weak_topic && home.readiness_percent == null

  return (
    <div className="flex-1 overflow-y-auto flex flex-col top-inset px-4 pb-28">
      <div className="pt-2 pb-4 enter-1 flex items-end justify-between gap-3">
        <div>
          <p className="text-[13px] text-muted-foreground">{t('home.greeting')}</p>
          <p className="font-display text-[20px] font-bold text-foreground">
            {session?.user.fullName ?? session?.user.phone}
          </p>
        </div>
        {home?.readiness_percent != null && (
          <div className="flex items-center gap-1.5 rounded-full bg-card border border-border px-3 py-1.5 shrink-0">
            <Gauge size={14} className="text-primary" />
            <span className="font-mono numeric text-[13px] font-bold text-primary">{home.readiness_percent}%</span>
          </div>
        )}
      </div>

      {isPending && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
      )}

      {home?.resume_attempt && (
        <button
          onClick={() => navigate(resumeHref(home.resume_attempt!.template_id))}
          className="press-row enter-2 mb-3 rounded-2xl p-5 flex items-center gap-4 text-left bg-primary text-primary-foreground shadow-brand"
        >
          <PlayCircle size={30} className="shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider opacity-75">{t('home.continue')}</p>
            <p className="text-[15px] font-bold truncate">{home.resume_attempt.template_title}</p>
            <p className="font-mono text-[12px] opacity-80 mt-0.5">
              {t('home.answeredCount', { count: String(home.resume_attempt.answered_count) })}
            </p>
          </div>
        </button>
      )}

      {home?.daily_challenge && (
        <button
          onClick={() => navigate(templateHref(home.daily_challenge!.id, home.daily_challenge!.mode))}
          className="press-row enter-2 mb-3 rounded-2xl border border-border bg-card p-4 flex items-center gap-3 text-left"
        >
          <div className="tile-accent w-10 h-10 rounded-xl bg-input-background flex items-center justify-center text-primary shrink-0">
            <Flame size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t('home.dailyChallenge')}</p>
            <p className="text-[15px] font-bold text-foreground truncate">{home.daily_challenge.title}</p>
          </div>
          <span className="font-mono text-[11px] text-muted-foreground shrink-0">
            {t('tests.questionsCount', { count: String(home.daily_challenge.questions_per_attempt) })}
          </span>
        </button>
      )}

      {home?.weak_topic && (
        <button
          onClick={() => navigate('/tests')}
          className="press-row enter-3 mb-3 rounded-2xl border border-border bg-card p-4 flex items-center gap-3 text-left"
        >
          <div
            className="tile-accent w-10 h-10 rounded-xl bg-input-background flex items-center justify-center text-warning shrink-0"
            style={{ '--tile-accent': 'var(--warning)' } as React.CSSProperties}
          >
            <TriangleAlert size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t('home.weakTopic')}</p>
            <p className="text-[15px] font-bold text-foreground truncate">{home.weak_topic.topic_name}</p>
          </div>
          <span className="font-mono text-[11px] text-warning shrink-0">
            {Math.round((home.weak_topic.mistake_count / home.weak_topic.answered_count) * 100)}%
          </span>
        </button>
      )}

      {!isPending && hasNothingYet && (
        <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-2 enter-2">
          <p className="text-[15px] font-bold text-foreground">{t('home.placeholderTitle')}</p>
          <p className="text-[13px] text-muted-foreground leading-relaxed">{t('home.placeholderBody')}</p>
        </div>
      )}
    </div>
  )
}
