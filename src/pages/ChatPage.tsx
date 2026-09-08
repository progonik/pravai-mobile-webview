import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Send } from 'lucide-react'
import { streamChat } from '../api/aiChatService'
import { useT, type Translate } from '../context/LocaleContext'

interface UIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

/** Passed via navigate('/chat', { state: { explain } }) -- see QuizPage's
 *  "Nega?" button on a wrong practice answer. */
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

export function ChatPage() {
  const t = useT()
  const location = useLocation()

  const [messages, setMessages] = useState<UIMessage[]>([])
  const [conversationId, setConversationId] = useState<string | undefined>(undefined)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const autoSentRef = useRef(false)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

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
    if (isExplainState(location.state)) {
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
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto top-inset px-4 pt-2">
        <p className="font-display text-[20px] font-bold text-foreground pt-2 pb-4">{t('tab.chat')}</p>

        {messages.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-2">
            <p className="text-[15px] font-bold text-foreground">{t('chat.placeholderTitle')}</p>
            <p className="text-[13px] text-muted-foreground leading-relaxed">{t('chat.placeholderBody')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pb-4">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-card border border-border text-foreground rounded-bl-md'
                  }`}
                >
                  {m.content || (m.role === 'assistant' && sending ? '···' : '')}
                </div>
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-[12px] text-destructive text-center pb-3">{error}</p>}
      </div>

      <form
        onSubmit={handleSubmit}
        className="shrink-0 flex items-center gap-2 px-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 90px)' }}
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
