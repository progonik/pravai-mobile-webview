import { useQuery } from '@tanstack/react-query'
import { Clock, ListChecks, Shield } from 'lucide-react'
import { listTemplates, type TemplateSummary } from '../api/examService'
import { STALE_TIME } from '../api/queryClient'
import { Skeleton } from '../components/Skeleton'
import { useT, type Translate } from '../context/LocaleContext'

/** mm:ss for a template's time limit, or the "no limit" copy. */
function formatTimeLimit(seconds: number | null, t: Translate): string {
  if (seconds == null) return t('tests.noTimeLimit')
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function TemplateCard({ template }: { template: TemplateSummary }) {
  const t = useT()
  return (
    <div className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-2.5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[15px] font-bold text-foreground leading-tight">{template.title}</p>
        {template.is_official_ticket && (
          <span className="shrink-0 flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 rounded-full px-2 py-1">
            <Shield size={11} />
            {t('tests.officialTicket')}
          </span>
        )}
      </div>
      {template.topic_name && (
        <p className="text-[12px] text-muted-foreground">{template.topic_name}</p>
      )}
      <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <ListChecks size={13} />
          {t('tests.questionsCount', { count: String(template.questions_per_attempt) })}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={13} />
          {formatTimeLimit(template.time_limit_seconds, t)}
        </span>
      </div>
    </div>
  )
}

function TemplateSection({ title, templates }: { title: string; templates: TemplateSummary[] }) {
  const t = useT()
  return (
    <div className="flex flex-col gap-2.5">
      <p className="font-display text-[15px] font-bold text-foreground">{title}</p>
      {templates.length === 0 ? (
        <p className="text-[13px] text-muted-foreground">{t('tests.emptySection')}</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {templates.map((tpl) => <TemplateCard key={tpl.id} template={tpl} />)}
        </div>
      )}
    </div>
  )
}

function TemplateSectionSkeleton() {
  return (
    <div className="flex flex-col gap-2.5">
      <Skeleton className="h-4 w-24 rounded-full" />
      {[0, 1].map((i) => (
        <div key={i} className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-2.5">
          <Skeleton className="h-4 w-3/4 rounded-full" />
          <Skeleton className="h-3 w-1/2 rounded-full" />
          <Skeleton className="h-3 w-1/3 rounded-full" />
        </div>
      ))}
    </div>
  )
}

/**
 * Real test-content listing -- grouped by `mode` (practice / exam), which is
 * what actually distinguishes them on the backend (TestTemplate.Mode), not
 * the separate admin-managed question_types reference table. Quiz-taking
 * itself (tapping a card to start an attempt) isn't wired yet -- see
 * QuizPage's own placeholder note -- so cards are display-only for now.
 */
export function TestsPage() {
  const t = useT()

  const { data, isPending, isError } = useQuery({
    queryKey: ['exam', 'templates'],
    queryFn: listTemplates,
    staleTime: STALE_TIME.feed,
  })

  const practice = data?.filter((tpl) => tpl.mode === 'practice') ?? []
  const exam = data?.filter((tpl) => tpl.mode === 'exam') ?? []

  return (
    <div className="flex-1 overflow-y-auto flex flex-col top-inset px-4 pb-28">
      <p className="font-display text-[20px] font-bold text-foreground pt-2 pb-4">{t('tab.tests')}</p>

      {isError && (
        <div className="rounded-2xl border border-border bg-card p-5 mb-4">
          <p className="text-[13px] text-muted-foreground leading-relaxed">{t('tests.loadFailed')}</p>
        </div>
      )}

      {isPending ? (
        <div className="flex flex-col gap-6">
          <TemplateSectionSkeleton />
          <TemplateSectionSkeleton />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <TemplateSection title={t('tests.practiceSection')} templates={practice} />
          <TemplateSection title={t('tests.examSection')} templates={exam} />
        </div>
      )}
    </div>
  )
}
