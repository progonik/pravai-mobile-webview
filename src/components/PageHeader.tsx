import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

/**
 * Sub-page header, iMe/Telegram's convention: the back button is its own
 * floating circular pill, not part of a bar spanning the width -- there is no
 * bar. Absolutely positioned so the page's own content runs full-bleed
 * underneath the safe area (the page is responsible for enough top padding
 * to clear it -- see `top-inset` plus this component's own height).
 */
export function PageHeader({ title, subtitle, right, onBack }: {
  title: string
  subtitle?: string
  right?: ReactNode
  onBack?: () => void
}) {
  const navigate = useNavigate()
  return (
    <div
      className="absolute top-0 left-0 right-0 z-30 flex items-center gap-3 px-3.5"
      style={{ paddingTop: 'calc(var(--safe-top) - 4px)' }}
    >
      <button
        onClick={onBack ?? (() => navigate(-1))}
        className="glass press w-10 h-10 rounded-full bg-chrome border border-chrome-border shadow-chrome flex items-center justify-center text-chrome-foreground shrink-0"
      >
        <ChevronLeft size={20} />
      </button>
      <div className="flex-1 min-w-0 text-center">
        <p className="font-display text-[15px] font-semibold text-foreground leading-tight truncate">{title}</p>
        {subtitle && <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>}
      </div>
      {right ?? <div className="w-10 shrink-0" />}
    </div>
  )
}
