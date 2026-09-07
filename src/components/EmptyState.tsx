import type { ReactNode } from 'react'
import { EmptyIllustration } from './EmptyIllustration'

/**
 * The one way an empty list is shown: illustration, title, optional hint, and
 * an optional action underneath.
 *
 * Every screen used to compose its own — eight variants across the app, with
 * three different title sizes, three vertical alignments, and a few that
 * dropped the illustration entirely. Emptiness is the same state everywhere,
 * so it gets one component.
 *
 * Centred against the full height of whatever holds it, so it lands in the
 * middle of the screen rather than at the top. Two mechanisms, because both
 * container shapes occur: `flex-1` fills a flex column, and `min-h-full`
 * resolves against a scroll container's height — a fixed pixel floor cannot do
 * the second, it just centres the block inside its own small box near the top.
 */
export function EmptyState({ title, hint, action }: {
  title: string
  hint?: string
  action?: ReactNode
}) {
  return (
    <div className="flex-1 min-h-full flex flex-col items-center justify-center text-center gap-4 px-8 py-10">
      <EmptyIllustration />
      <div>
        <p className="text-[16px] font-bold text-foreground">{title}</p>
        {hint && <p className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed">{hint}</p>}
      </div>
      {action}
    </div>
  )
}
