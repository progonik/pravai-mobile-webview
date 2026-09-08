import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, ListChecks } from 'lucide-react'
import { listQuestionTypes } from '../api/examService'
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
 */
export function TestsPage() {
  const t = useT()
  const navigate = useNavigate()

  const { data, isPending, isError } = useQuery({
    queryKey: ['exam', 'question-types'],
    queryFn: listQuestionTypes,
    staleTime: STALE_TIME.feed,
  })

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
              onClick={() => navigate(`/tests/${qt.code}`)}
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
