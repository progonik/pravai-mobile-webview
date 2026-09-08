import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, ListChecks } from 'lucide-react'
import { listQuestionTypes, listTemplates } from '../api/examService'
import { STALE_TIME } from '../api/queryClient'
import { Skeleton } from '../components/Skeleton'
import { useT } from '../context/LocaleContext'

function TypeRowSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
      <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
      <Skeleton className="h-4 w-1/2 rounded-full" />
    </div>
  )
}

/**
 * Test types (question_types rows), not templates -- this is the full set
 * that exists, independent of whether a template currently uses one. Tap
 * one to drill into /tests/:code (TestTypePage), which lists that type's
 * templates or shows an empty state if none exist yet. Listing types
 * (rather than only templates already grouped by mode) means a type an
 * admin just added shows up immediately, before anyone has created a
 * template for it -- see TestTypePage's own note on the empty state.
 *
 * Tapping a type usually goes to /tests/:code (TestTypePage's list), but
 * "practice" is the only mode where that list is actually a choice worth
 * making -- each practice template is pinned to a different topic, so the
 * list *is* "pick a theme". Every other mode (exam, daily-challenge, any
 * future one) represents a whole session rather than a topic picker: if
 * it resolves to exactly one template, tapping the type skips straight to
 * that template's intro/start screen instead of making the user tap
 * through a list with only one entry in it.
 */
export function TestsPage() {
  const t = useT()
  const navigate = useNavigate()

  const { data, isPending, isError } = useQuery({
    queryKey: ['exam', 'question-types'],
    queryFn: listQuestionTypes,
    staleTime: STALE_TIME.feed,
  })
  const { data: templates } = useQuery({
    queryKey: ['exam', 'templates'],
    queryFn: listTemplates,
    staleTime: STALE_TIME.feed,
  })

  const openType = (code: string) => {
    if (code !== 'practice') {
      const matching = templates?.filter((tpl) => tpl.mode === code) ?? []
      if (matching.length === 1) {
        navigate(`/quiz/${matching[0].id}/intro`)
        return
      }
    }
    navigate(`/tests/${code}`)
  }

  return (
    <div className="flex-1 overflow-y-auto flex flex-col top-inset px-4 pb-28">
      <p className="font-display text-[20px] font-bold text-foreground pt-2 pb-4">{t('tab.tests')}</p>

      {isError && (
        <div className="rounded-2xl border border-border bg-card p-5 mb-4">
          <p className="text-[13px] text-muted-foreground leading-relaxed">{t('tests.loadFailed')}</p>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {isPending ? (
          <>
            <TypeRowSkeleton />
            <TypeRowSkeleton />
            <TypeRowSkeleton />
          </>
        ) : (
          data?.map((qt) => (
            <button
              key={qt.id}
              onClick={() => openType(qt.code)}
              className="press-row rounded-2xl border border-border bg-card p-4 flex items-center gap-3 text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-input-background flex items-center justify-center text-muted-foreground shrink-0">
                <ListChecks size={16} />
              </div>
              <span className="flex-1 text-[15px] font-bold text-foreground">{qt.name}</span>
              <ChevronRight size={18} className="text-muted-foreground shrink-0" />
            </button>
          ))
        )}
      </div>
    </div>
  )
}
