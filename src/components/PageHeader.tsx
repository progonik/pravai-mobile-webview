import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

/** Standard sub-page header with a back button. */
export function PageHeader({ title, subtitle, right, onBack }: {
  title: string
  subtitle?: string
  right?: ReactNode
  onBack?: () => void
}) {
  const navigate = useNavigate()
  return (
    <div className="top-inset flex items-center gap-3 px-4 pb-3 bg-card border-b border-border shrink-0">
      <button
        onClick={onBack ?? (() => navigate(-1))}
        className="press w-9 h-9 rounded-xl bg-input-background flex items-center justify-center text-muted-foreground"
      >
        <ChevronLeft size={20} />
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-[17px] font-bold text-foreground leading-tight truncate">{title}</p>
        {subtitle && <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>}
      </div>
      {right}
    </div>
  )
}
