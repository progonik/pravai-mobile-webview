import { PageHeader } from '../components/PageHeader'
import { useT } from '../context/LocaleContext'

/** Placeholder post-attempt result screen -- scaffold-phase only. */
export function ResultPage() {
  const t = useT()

  return (
    <div className="flex flex-col h-full bg-background">
      <PageHeader title={t('result.title')} />
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-2">
          <p className="text-[15px] font-bold text-foreground">{t('result.placeholderTitle')}</p>
          <p className="text-[13px] text-muted-foreground leading-relaxed">{t('result.placeholderBody')}</p>
        </div>
      </div>
    </div>
  )
}
