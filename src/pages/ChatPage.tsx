import { useT } from '../context/LocaleContext'

/**
 * Placeholder AI-tutor chat -- scaffold-phase only. Needs a chat/explanation
 * backend endpoint (none exists yet) before this can do anything real.
 */
export function ChatPage() {
  const t = useT()

  return (
    <div className="flex-1 overflow-y-auto flex flex-col top-inset px-4 pb-6">
      <p className="font-display text-[20px] font-bold text-foreground pt-2 pb-4">{t('tab.chat')}</p>
      <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-2">
        <p className="text-[15px] font-bold text-foreground">{t('chat.placeholderTitle')}</p>
        <p className="text-[13px] text-muted-foreground leading-relaxed">{t('chat.placeholderBody')}</p>
      </div>
    </div>
  )
}
