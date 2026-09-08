import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { Clock, ListChecks, Shield } from 'lucide-react'
import { listQuestionTypes, listTemplates, type TemplateSummary } from '../api/examService'
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

/**
 * Templates for one test type (question_types.code, from the URL). Reuses
 * the same GET /exam/templates the old single-page Tests tab used, just
 * filtered client-side by mode -- the list is small enough that a
 * dedicated filtered endpoint isn't worth it yet. Shows an empty state
 * rather than nothing when a type has no templates: TestsPage now lists
 * every type that exists, so landing here with zero templates is an
 * expected, real state (a type an admin just added, before creating its
 * first template), not an error.
 */
export function TestTypePage() {
  const { mode } = useParams<{ mode: string }>()
  const t = useT()

  const { data: types } = useQuery({
    queryKey: ['exam', 'question-types'],
    queryFn: listQuestionTypes,
    staleTime: STALE_TIME.feed,
  })
  const { data: templates, isPending, isError } = useQuery({
    queryKey: ['exam', 'templates'],
    queryFn: listTemplates,
    staleTime: STALE_TIME.feed,
  })

  const typeName = types?.find((qt) => qt.code === mode)?.name ?? ''
  const matching = templates?.filter((tpl) => tpl.mode === mode) ?? []

  return (
    <div className="relative flex flex-col h-full bg-background">
      <PageHeader title={typeName} />
      <div className="flex-1 overflow-y-auto px-4 pb-6" style={{ paddingTop: 'calc(var(--safe-top) + 54px)' }}>
        {isError && (
          <div className="rounded-2xl border border-border bg-card p-5 mb-4">
            <p className="text-[13px] text-muted-foreground leading-relaxed">{t('tests.loadFailed')}</p>
          </div>
        )}

        {isPending ? (
          <div className="flex flex-col gap-2.5">
            {[0, 1].map((i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-2.5">
                <Skeleton className="h-4 w-3/4 rounded-full" />
                <Skeleton className="h-3 w-1/2 rounded-full" />
                <Skeleton className="h-3 w-1/3 rounded-full" />
              </div>
            ))}
          </div>
        ) : matching.length === 0 ? (
          !isError && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-[13px] text-muted-foreground leading-relaxed">{t('tests.emptySection')}</p>
            </div>
          )
        ) : (
          <div className="flex flex-col gap-2.5">
            {matching.map((tpl) => <TemplateCard key={tpl.id} template={tpl} />)}
          </div>
        )}
      </div>
    </div>
  )
}
