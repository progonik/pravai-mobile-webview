import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { Check, X } from 'lucide-react'
import {
  listTemplates, startAttempt, submitAnswer,
  type AttemptState, type QuizQuestion,
} from '../api/examService'
import { STALE_TIME } from '../api/queryClient'
import { PageHeader } from '../components/PageHeader'
import { Skeleton } from '../components/Skeleton'
import { useT } from '../context/LocaleContext'

interface Feedback {
  isCorrect: boolean
  correctOptionId: string
  selectedOptionId: string | null
  explanation: string
}

/**
 * The actual attempt-taking flow: starts (or resumes, per the backend's own
 * idempotent StartOrResumeAttempt) an attempt for `templateId`, then walks
 * question-by-question via submitAnswer until `next_question` comes back
 * null. Feedback (correct answer + explanation) is shown *before* advancing
 * -- the option list re-renders in a read-only "revealed" state and a
 * "Next" button takes over -- rather than auto-advancing, since the
 * explanation is worth reading. `attempt.total_planned` is read fresh off
 * every response rather than cached, because exam mode can grow it
 * mid-attempt (+5 questions per mistake, see QuizIntroPage's rules copy).
 */
export function QuizPage() {
  const { templateId } = useParams<{ templateId: string }>()
  const navigate = useNavigate()
  const t = useT()

  const { data: templates } = useQuery({
    queryKey: ['exam', 'templates'],
    queryFn: listTemplates,
    staleTime: STALE_TIME.feed,
  })
  const template = templates?.find((tpl) => tpl.id === templateId)

  const [attempt, setAttempt] = useState<AttemptState | null>(null)
  const [question, setQuestion] = useState<QuizQuestion | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  // Held from the answer response until "Next" is tapped, so feedback stays
  // on screen instead of auto-advancing. undefined = no pending answer yet;
  // null = that was the last question. State, not a ref, since it drives
  // the "Next" vs "Finish" button label.
  const [pendingNext, setPendingNext] = useState<QuizQuestion | null | undefined>(undefined)

  // AppShell remounts this page on every route change (keyed by pathname),
  // so this effect only ever runs once per mount with a stable templateId --
  // no reset-before-fetch is needed, the initial state values already cover
  // "loading, no error" for that one run.
  useEffect(() => {
    if (!templateId) return
    let cancelled = false
    startAttempt(templateId)
      .then((result) => {
        if (cancelled) return
        setAttempt(result.attempt)
        setQuestion(result.question)
        if (!result.question) setError(t('quiz.noQuestions'))
        setLoading(false)
      })
      .catch((err: AxiosError) => {
        if (cancelled) return
        // 409 = ErrTemplateEmpty (no questions match this template's
        // topic/license-category pool yet) -- worth telling apart from a
        // generic failure, since "try again" is bad advice for it.
        setError(err.response?.status === 409 ? t('quiz.noQuestions') : t('quiz.startFailed'))
        setLoading(false)
      })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId])

  const handleAnswer = async (optionId: string | null) => {
    if (!attempt || !question || feedback || submitting) return
    setSubmitting(true)
    try {
      const result = await submitAnswer(attempt.id, question.id, optionId)
      setAttempt(result.attempt)
      setFeedback({
        isCorrect: result.is_correct,
        correctOptionId: result.correct_option_id,
        selectedOptionId: optionId,
        explanation: result.explanation,
      })
      setPendingNext(result.next_question)
    } catch {
      setError(t('quiz.submitFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleWhy = () => {
    if (!question || !feedback) return
    const correctOption = question.options.find((o) => o.id === feedback.correctOptionId)
    const selectedOption = question.options.find((o) => o.id === feedback.selectedOptionId)
    navigate('/chat/new', {
      state: {
        explain: {
          questionBody: question.body,
          imageUrl: question.image_urls[0] ?? null,
          userAnswerText: selectedOption?.body ?? t('quiz.skippedAnswer'),
          correctAnswerText: correctOption?.body ?? '',
        },
      },
    })
  }

  const handleNext = () => {
    if (pendingNext === undefined || !attempt) return
    if (pendingNext === null) {
      navigate('/result', { state: { attempt, templateTitle: template?.title ?? '' } })
      return
    }
    setQuestion(pendingNext)
    setFeedback(null)
    setPendingNext(undefined)
  }

  return (
    <div className="relative flex flex-col h-full bg-background">
      <PageHeader
        title={template?.title ?? ''}
        right={
          attempt && (
            <span className="font-mono numeric text-[13px] font-semibold text-muted-foreground shrink-0">
              {attempt.answered_count}/{attempt.total_planned}
            </span>
          )
        }
      />

      <div className="flex-1 overflow-y-auto px-4 pb-6 flex flex-col" style={{ paddingTop: 'calc(var(--safe-top) + 54px)' }}>
        {loading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-5 w-3/4 rounded-full" />
            <Skeleton className="h-5 w-1/2 rounded-full" />
            <div className="flex flex-col gap-2.5 mt-4">
              {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-2xl" />)}
            </div>
          </div>
        ) : error && !question ? (
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-[13px] text-muted-foreground leading-relaxed">{error}</p>
          </div>
        ) : question && (
          <>
            <div className="rounded-2xl border border-primary/30 bg-primary/10 p-5 mb-4">
              <p className="text-[11px] font-bold text-primary-hover uppercase tracking-wide mb-1.5">{t('quiz.questionLabel')}</p>
              <p className="text-[17px] font-bold text-foreground leading-snug">{question.body}</p>
            </div>

            {question.image_urls.length > 0 && (
              <div className="rounded-2xl overflow-hidden border border-primary/30 mb-4">
                <img src={question.image_urls[0]} alt="" className="w-full h-auto block" />
              </div>
            )}

            <div className="flex flex-col gap-2.5">
              {question.options.map((opt) => {
                const isSelected = feedback?.selectedOptionId === opt.id
                const isCorrectOption = feedback?.correctOptionId === opt.id
                const showAsCorrect = feedback && isCorrectOption
                const showAsWrong = feedback && isSelected && !feedback.isCorrect
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleAnswer(opt.id)}
                    disabled={Boolean(feedback) || submitting}
                    className={`press w-full flex items-center gap-3 rounded-2xl border p-4 text-left transition-colors ${
                      showAsCorrect
                        ? 'border-success bg-success/10'
                        : showAsWrong
                          ? 'border-destructive bg-destructive/10'
                          : 'border-border bg-card'
                    }`}
                  >
                    <span className="flex-1 text-[14px] font-medium text-foreground">{opt.body}</span>
                    {showAsCorrect && <Check size={18} className="text-success shrink-0" />}
                    {showAsWrong && <X size={18} className="text-destructive shrink-0" />}
                  </button>
                )
              })}
            </div>

            {feedback && (
              <div className="rounded-2xl border border-border bg-card p-4 mt-4">
                <p className={`text-[13px] font-bold mb-1 ${feedback.isCorrect ? 'text-success' : 'text-destructive'}`}>
                  {feedback.isCorrect ? t('quiz.correct') : t('quiz.incorrect')}
                </p>
                <p className="text-[13px] text-muted-foreground leading-relaxed">{feedback.explanation}</p>
              </div>
            )}

            {error && (
              <p className="text-[12px] text-destructive text-center mt-3">{error}</p>
            )}

            {!feedback && (
              <button
                onClick={() => handleAnswer(null)}
                disabled={submitting}
                className="press text-[13px] text-muted-foreground font-semibold text-center mt-4"
              >
                {t('quiz.skip')}
              </button>
            )}
          </>
        )}
      </div>

      {feedback && (
        <div className="px-6 pt-3 shrink-0 flex items-center gap-3" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 22px)' }}>
          {/* Practice only: exam-mode mistakes already cost extra questions
              as their own consequence, and "why" there would just repeat
              what quiz.intro.examRules already explained. */}
          {!feedback.isCorrect && attempt?.mode === 'practice' && (
            <button
              onClick={handleWhy}
              className="press flex-1 rounded-full border border-primary/30 bg-primary/10 text-primary-hover py-4 text-[15px] font-semibold"
            >
              {t('quiz.why')}
            </button>
          )}
          <button
            onClick={handleNext}
            className="press flex-1 bg-primary text-primary-foreground rounded-full py-4 text-[15px] font-semibold shadow-brand"
          >
            {pendingNext === null ? t('quiz.finish') : t('quiz.next')}
          </button>
        </div>
      )}
    </div>
  )
}
