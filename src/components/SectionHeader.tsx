import { ChevronRight } from 'lucide-react'

/**
 * The heading above a block of content. One treatment app-wide: title left,
 * optional link right. Sections are told apart by their heading, not by
 * different sizes or colours per screen, so the type is fixed here rather than
 * passed in.
 */
export function SectionHeader({ title, count, actionLabel, onAction, className = '' }: {
  title: string
  /** Shown next to the title when the total is worth knowing before scrolling. */
  count?: number
  actionLabel?: string
  onAction?: () => void
  className?: string
}) {
  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      <h2 className="text-[17px] font-bold text-foreground tracking-[-0.01em] flex items-baseline gap-2">
        {title}
        {count !== undefined && (
          <span className="text-[13px] font-semibold text-muted-foreground numeric">{count}</span>
        )}
      </h2>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="press flex items-center gap-0.5 text-[13px] font-semibold text-primary shrink-0 -mr-1 pl-2 py-1"
        >
          {actionLabel}
          <ChevronRight size={15} strokeWidth={2.4} />
        </button>
      )}
    </div>
  )
}
