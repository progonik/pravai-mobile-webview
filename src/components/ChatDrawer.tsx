import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MessageCircle, Plus, X } from 'lucide-react'
import { listConversations } from '../api/aiChatService'
import { Skeleton } from './Skeleton'
import { useHidesTabbar } from '../context/OverlayContext'
import { useT, type Translate } from '../context/LocaleContext'

function formatWhen(iso: string, t: Translate): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (minutes < 1) return t('chat.justNow')
  if (minutes < 60) return t('chat.minutesAgo', { n: String(minutes) })
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return t('chat.hoursAgo', { n: String(hours) })
  return new Date(iso).toLocaleDateString()
}

/**
 * ChatGPT-style side drawer for switching conversations -- the chat tab
 * itself is always a composer (ChatPage), and this is the only way to
 * reach the conversation list or jump back into an older one. Always
 * mounted (even closed) so the slide transition has something to animate;
 * closed state is just off-screen + non-interactive.
 */
export function ChatDrawer({ open, onClose, activeId }: {
  open: boolean
  onClose: () => void
  activeId?: string
}) {
  const t = useT()
  const navigate = useNavigate()
  useHidesTabbar(open)

  const { data: conversations, isPending, isError } = useQuery({
    queryKey: ['aichat', 'conversations'],
    queryFn: listConversations,
  })

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`fixed top-0 bottom-0 left-0 z-50 w-[82%] max-w-[320px] bg-background border-r border-border flex flex-col transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ paddingTop: 'var(--safe-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-between px-4 py-3 shrink-0">
          <p className="font-display text-[16px] font-bold text-foreground">{t('tab.chat')}</p>
          <button
            onClick={onClose}
            className="press w-8 h-8 rounded-full bg-input-background flex items-center justify-center text-muted-foreground shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        <button
          onClick={() => { navigate('/chat'); onClose() }}
          className="press-row mx-3 mb-2 rounded-2xl border border-border bg-card px-4 py-3 flex items-center gap-3 text-left shrink-0"
        >
          <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center text-primary shrink-0">
            <Plus size={16} />
          </div>
          <p className="text-[14px] font-semibold text-foreground">{t('chat.newChat')}</p>
        </button>

        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1 pt-2 pb-2">
            {t('chat.recents')}
          </p>

          {isError && <p className="text-[12px] text-muted-foreground px-1">{t('chat.loadFailed')}</p>}

          {isPending ? (
            <div className="flex flex-col gap-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-2xl px-3 py-3 flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-xl shrink-0" />
                  <Skeleton className="h-3.5 flex-1 rounded-full" />
                </div>
              ))}
            </div>
          ) : !conversations || conversations.length === 0 ? (
            !isError && <p className="text-[12px] text-muted-foreground px-1">{t('chat.placeholderBody')}</p>
          ) : (
            <div className="flex flex-col gap-1">
              {conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { navigate(`/chat/${c.id}`); onClose() }}
                  className={`press-row w-full rounded-xl px-3 py-3 flex items-center gap-3 text-left ${
                    c.id === activeId ? 'bg-primary/10' : ''
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-input-background flex items-center justify-center text-muted-foreground shrink-0">
                    <MessageCircle size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13.5px] font-medium truncate ${c.id === activeId ? 'text-primary' : 'text-foreground'}`}>
                      {c.title || t('chat.untitled')}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{formatWhen(c.updated_at, t)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
