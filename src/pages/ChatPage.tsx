import { useEffect, useRef, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Send } from 'lucide-react'
import Markdown from 'react-markdown'
import { listMessages, streamChat } from '../api/aiChatService'
import { PageHeader } from '../components/PageHeader'
import { useT, type Translate } from '../context/LocaleContext'

interface UIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

/** Passed via navigate('/chat/new', { state: { explain } }) -- see
 *  QuizPage's "Nega?" button on a wrong practice answer. */
interface ExplainPayload {
  questionBody: string
  imageUrl: string | null
  userAnswerText: string
  correctAnswerText: string
}

function isExplainState(value: unknown): value is { explain: ExplainPayload } {
  return typeof value === 'object' && value !== null && 'explain' in value
}

/** Composes the auto-sent first message for the "why was this wrong"
 *  flow -- spells out both answers as their actual text, never as an
 *  A/B/C letter the user never saw, and tells the model to do the same. */
function buildExplainPrompt(e: ExplainPayload, t: Translate): string {
  return [
    t('chat.explainIntro'),
    t('chat.explainQuestion', { question: e.questionBody }),
    t('chat.explainMyAnswer', { answer: e.userAnswerText }),
    t('chat.explainCorrectAnswer', { answer: e.correctAnswerText }),
    t('chat.explainInstruction'),
  ].join('\n')
}

/** Assistant replies come back as markdown (Gemini writes **bold**,
 *  lists, etc. -- rendering it raw showed the literal asterisks). These
 *  overrides just keep every element on the bubble's own compact scale
 *  instead of react-markdown's default browser spacing. */
const markdownComponents = {
  p: ({ children }: { children?: React.ReactNode }) => <p className="mb-2 last:mb-0">{children}</p>,
  strong: ({ children }: { children?: React.ReactNode }) => <strong className="font-bold text-foreground">{children}</strong>,
  ul: ({ children }: { children?: React.ReactNode }) => <ul className="list-disc pl-4 mb-2 last:mb-0 flex flex-col gap-1">{children}</ul>,
  ol: ({ children }: { children?: React.ReactNode }) => <ol className="list-decimal pl-4 mb-2 last:mb-0 flex flex-col gap-1">{children}</ol>,
  li: ({ children }: { children?: React.ReactNode }) => <li>{children}</li>,
  h1: ({ children }: { children?: React.ReactNode }) => <p className="text-[15px] font-bold text-foreground mb-1">{children}</p>,
  h2: ({ children }: { children?: React.ReactNode }) => <p className="text-[15px] font-bold text-foreground mb-1">{children}</p>,
  h3: ({ children }: { children?: React.ReactNode }) => <p className="text-[14px] font-bold text-foreground mb-1">{children}</p>,
  a: ({ children, href }: { children?: React.ReactNode; href?: string }) => (
    <a href={href} target="_blank" rel="noreferrer" className="underline text-primary-hover">{children}</a>
  ),
  code: ({ children }: { children?: React.ReactNode }) => (
    <code className="bg-input-background rounded px-1 py-0.5 text-[13px]">{children}</code>
  ),
}

/**
 * One conversation -- either resuming an existing one (/chat/:conversationId,
 * history loaded on mount) or starting a fresh one (/chat/new, optionally
 * auto-sending QuizPage's "why was this wrong" prompt). Always has a back
 * button (PageHeader's default navigate(-1)): wherever it was opened from --
 * the chat list, or a quiz question -- that's exactly where "back" should
 * return to.
 */
export function ChatPage() {
  const t = useT()
  const location = useLocation()
  const { conversationId: routeId } = useParams<{ conversationId: string }>()
  const isNew = !routeId || routeId === 'new'
  const queryClient = useQueryClient()

  const [messages, setMessages] = useState<UIMessage[]>([])
  const [conversationId, setConversationId] = useState<string | undefined>(isNew ? undefined : routeId)
  const [loadingHistory, setLoadingHistory] = useState(!isNew)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const autoSentRef = useRef(false)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  // Resuming an existing conversation: load its history once on mount.
  useEffect(() => {
    if (isNew || !routeId) return
    let cancelled = false
    listMessages(routeId)
      .then((history) => {
        if (cancelled) return
        setMessages(history.map((m) => ({ id: m.id, role: m.role, content: m.content })))
        setLoadingHistory(false)
      })
      .catch(() => {
        if (cancelled) return
        setError(t('chat.loadFailed'))
        setLoadingHistory(false)
      })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId, isNew])

  // hideUserBubble: the "why was this wrong" prompt is composed from raw
  // question/answer text for the model's benefit, not something a human
  // would type -- it's still the real message sent (and the one Gemini
  // sees and the one persisted for conversation context), just not
  // rendered as if the user had typed that wall of text themselves.
  const send = async (text: string, imageUrl?: string, hideUserBubble = false) => {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setSending(true)
    setError('')
    const assistantId = `assistant-${crypto.randomUUID()}`
    setMessages((prev) => [
      ...prev,
      ...(hideUserBubble ? [] : [{ id: `user-${crypto.randomUUID()}`, role: 'user' as const, content: trimmed }]),
      { id: assistantId, role: 'assistant', content: '' },
    ])
    setInput('')
    try {
      const result = await streamChat({ conversationId, message: trimmed, imageUrl }, (delta) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + delta } : m)),
        )
      })
      setConversationId(result.conversationId)
      // The list screen's cache is now stale (new/updated title,
      // updated_at) -- refetch next time it's shown rather than eagerly,
      // since the user might send several messages before going back.
      void queryClient.invalidateQueries({ queryKey: ['aichat', 'conversations'] })
    } catch {
      setError(t('chat.sendFailed'))
    } finally {
      setSending(false)
    }
  }

  // AppShell remounts this page on every route change, so this effect
  // only ever runs once per mount -- the ref guard is just insurance
  // against React invoking effects twice in dev, which would otherwise
  // fire the same explain prompt as two separate messages.
  useEffect(() => {
    if (autoSentRef.current) return
    autoSentRef.current = true
    if (isNew && isExplainState(location.state)) {
      const e = location.state.explain
      // Deferred a tick so `send`'s setSending(true) isn't called
      // synchronously from within the effect body itself.
      queueMicrotask(() => { void send(buildExplainPrompt(e, t), e.imageUrl ?? undefined, true) })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void send(input)
  }

  return (
    <div className="relative flex flex-col h-full bg-background">
      <PageHeader title={t('tab.chat')} />

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4" style={{ paddingTop: 'calc(var(--safe-top) + 54px)' }}>
        {loadingHistory ? (
          <p className="text-[13px] text-muted-foreground text-center pt-6">{t('chat.loading')}</p>
        ) : messages.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-2">
            <p className="text-[15px] font-bold text-foreground">{t('chat.placeholderTitle')}</p>
            <p className="text-[13px] text-muted-foreground leading-relaxed">{t('chat.placeholderBody')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pb-4">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-md whitespace-pre-wrap'
                      : 'bg-card border border-border text-foreground rounded-bl-md'
                  }`}
                >
                  {m.role === 'assistant' ? (
                    m.content ? (
                      <Markdown components={markdownComponents}>{m.content}</Markdown>
                    ) : sending ? (
                      '···'
                    ) : (
                      ''
                    )
                  ) : (
                    m.content
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-[12px] text-destructive text-center pb-3">{error}</p>}
      </div>

      <form
        onSubmit={handleSubmit}
        className="shrink-0 flex items-center gap-2 px-4 pt-3"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 22px)' }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('chat.inputPlaceholder')}
          disabled={sending}
          className="flex-1 min-w-0 rounded-full bg-input-background border border-border px-4 py-3 text-[14px] text-foreground placeholder:text-muted-foreground outline-none"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="press w-11 h-11 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  )
}
