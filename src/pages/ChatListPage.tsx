import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MessageCircle, Plus } from 'lucide-react'
import { listConversations } from '../api/aiChatService'
import { Skeleton } from '../components/Skeleton'
import { useT, type Translate } from '../context/LocaleContext'

/** Short relative time for a list row -- falls back to a plain date once
 *  a conversation is old enough that "N hours ago" stops being useful. */
function formatWhen(iso: string, t: Translate): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (minutes < 1) return t('chat.justNow')
  if (minutes < 60) return t('chat.minutesAgo', { n: String(minutes) })
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return t('chat.hoursAgo', { n: String(hours) })
  return new Date(iso).toLocaleDateString()
}

/**
 * The AI Chat tab root -- a ChatGPT-style conversation list rather than
 * dropping straight into a composer. Tapping a row resumes that
 * conversation (/chat/:id, which loads its history); the "+" starts a
 * fresh one (/chat/new). Sorted by updated_at server-side already (most
 * recently active first), so no client-side sort needed here.
 */
export function ChatListPage() {
  const t = useT()
  const navigate = useNavigate()

  const { data: conversations, isPending, isError } = useQuery({
    queryKey: ['aichat', 'conversations'],
    queryFn: listConversations,
  })

  return (
    <div className="flex-1 overflow-y-auto flex flex-col top-inset px-4 pb-28">
      <div className="flex items-center justify-between pt-2 pb-4">
        <p className="font-display text-[20px] font-bold text-foreground">{t('tab.chat')}</p>
        <button
          onClick={() => navigate('/chat/new')}
          className="press w-9 h-9 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-brand"
        >
          <Plus size={18} />
        </button>
      </div>

      {isError && (
        <div className="rounded-2xl border border-border bg-card p-5 mb-4">
          <p className="text-[13px] text-muted-foreground leading-relaxed">{t('chat.loadFailed')}</p>
        </div>
      )}

      {isPending ? (
        <div className="flex flex-col gap-2.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <Skeleton className="h-3.5 w-2/3 rounded-full" />
                <Skeleton className="h-3 w-1/3 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : !conversations || conversations.length === 0 ? (
        !isError && (
          <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-2">
            <p className="text-[15px] font-bold text-foreground">{t('chat.placeholderTitle')}</p>
            <p className="text-[13px] text-muted-foreground leading-relaxed">{t('chat.placeholderBody')}</p>
          </div>
        )
      ) : (
        <div className="flex flex-col gap-2.5">
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => navigate(`/chat/${c.id}`)}
              className="press-row w-full rounded-2xl border border-border bg-card p-4 flex items-center gap-3 text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-input-background flex items-center justify-center text-muted-foreground shrink-0">
                <MessageCircle size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-foreground truncate">{c.title || t('chat.untitled')}</p>
                <p className="text-[12px] text-muted-foreground">{formatWhen(c.updated_at, t)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
