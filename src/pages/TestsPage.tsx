import { useT } from '../context/LocaleContext'

/**
 * Placeholder tests list -- scaffold-phase only. Needs the backend's
 * mobile-facing test-template listing endpoint (topics/license-category
 * filters, question-pool size) before it can show anything real; see
 * CLAUDE.md's backend-gap note.
 */
export function TestsPage() {
  const t = useT()

  return (
    <div className="flex-1 overflow-y-auto flex flex-col top-inset px-4 pb-6">
      <p className="font-display text-[20px] font-bold text-foreground pt-2 pb-4">{t('tab.tests')}</p>
      <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-2">
        <p className="text-[15px] font-bold text-foreground">{t('tests.placeholderTitle')}</p>
        <p className="text-[13px] text-muted-foreground leading-relaxed">{t('tests.placeholderBody')}</p>
      </div>
    </div>
  )
}
