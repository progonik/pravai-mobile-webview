import { useLocation, useNavigate } from 'react-router-dom'
import { Check, CircleX, Flag, ListChecks, X } from 'lucide-react'
import type { AttemptState } from '../api/examService'
import { useT } from '../context/LocaleContext'
import { useMistakeTopics } from '../api/mistakeService'

interface ResultState {
  attempt: AttemptState
  templateTitle: string
  reviewTopicId?: string
}

function isResultState(value: unknown): value is ResultState {
  return typeof value === 'object' && value !== null && 'attempt' in value
}

/**
 * Shows the final `attempt` object from the last submitAnswer response
 * (there's no GET-attempt-by-id endpoint yet, so this screen only exists
 * reachable via QuizPage's navigate(..., {state}) -- a direct link or a
 * page reload here has nothing to show, hence the fallback below rather
 * than a blank/broken screen.
 */
export function ResultPage() {
  const t = useT()
  const navigate = useNavigate()
  const location = useLocation()
  const state = isResultState(location.state) ? location.state : null
  const reviewTopics = useMistakeTopics(!!state?.reviewTopicId)
  const remaining = reviewTopics.data?.find(topic => topic.topic_id === state?.reviewTopicId)?.remaining_count ?? 0

  if (!state) {
    return (
      <div className="flex flex-col h-full bg-background items-center justify-center px-6 gap-4">
        <p className="text-[14px] text-muted-foreground text-center">{t('result.noData')}</p>
        <button
          onClick={() => navigate('/tests', { replace: true })}
          className="press bg-primary text-primary-foreground rounded-full px-6 py-3 text-[14px] font-semibold shadow-brand"
        >
          {t('result.backToTests')}
        </button>
      </div>
    )
  }

  const { attempt, templateTitle } = state
  // Pass/fail styling is only meaningful for exam mode -- every other mode
  // (practice, daily-challenge, any future one) is an ungraded set, so a
  // mistake there isn't a "failure" to flag red, just something to learn
  // from; those always get the same neutral "done" treatment regardless of
  // mistake_count.
  const isExam = attempt.mode === 'exam'
  const passed = isExam ? attempt.passed === true : null

  return (
    <div className="flex flex-col h-full bg-background items-center justify-center px-6 text-center">
      <div
        className={`w-20 h-20 rounded-full flex items-center justify-center mb-5 ${
          passed === false ? 'bg-destructive/15' : 'bg-primary/15'
        }`}
      >
        {passed === false ? (
          <CircleX size={36} className="text-destructive" strokeWidth={2.5} />
        ) : passed === true ? (
          <Check size={36} className="text-primary" strokeWidth={2.5} />
        ) : (
          <Flag size={32} className="text-primary" strokeWidth={2.5} />
        )}
      </div>

      <p className="font-display text-[22px] font-bold text-foreground leading-tight">
        {passed === false ? t('result.failedTitle') : passed === true ? t('result.passedTitle') : t('result.doneTitle')}
      </p>
      <p className="text-[13px] text-muted-foreground mt-1.5">{templateTitle}</p>

      <div className="flex items-center gap-6 mt-8">
        <div className="flex flex-col items-center gap-1">
          <span className="numeric text-[24px] font-bold text-success">{attempt.correct_count}</span>
          <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
            <Check size={12} />
            {t('result.correct')}
          </span>
        </div>
        <div className="w-px h-10 bg-border" />
        <div className="flex flex-col items-center gap-1">
          <span className="numeric text-[24px] font-bold text-destructive">{attempt.mistake_count}</span>
          <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
            <X size={12} />
            {t('result.mistakes')}
          </span>
        </div>
        <div className="w-px h-10 bg-border" />
        <div className="flex flex-col items-center gap-1">
          <span className="numeric text-[24px] font-bold text-foreground">{attempt.answered_count}</span>
          <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
            <ListChecks size={12} />
            {t('result.answered')}
          </span>
        </div>
      </div>

      {state.reviewTopicId && <div className="mt-6 w-full"><p>{reviewTopics.isPending ? t('home.loading') : reviewTopics.isError ? t('home.loadError') : remaining ? t('review.count', { count: remaining }) : t('review.cleared')}</p><button className="home-start" onClick={() => navigate(`/mistakes/${state.reviewTopicId}`, { replace: true })}>{t(remaining ? 'review.repeat' : 'review.back')}</button></div>}
      <button
        onClick={() => navigate('/chat/new', { state: { prompt: t('learn.resultPrompt', { title: templateTitle, correct: attempt.correct_count, mistakes: attempt.mistake_count }) } })}
        className="press w-full rounded-2xl border border-primary/30 bg-card text-primary py-4 text-[14px] font-semibold mt-8"
      >
        {t('learn.askTutor')}
      </button>
      <button
        onClick={() => navigate(state.reviewTopicId ? '/mistakes' : '/tests', { replace: true })}
        className="press w-full bg-primary text-primary-foreground rounded-full py-4 text-[15px] font-semibold shadow-brand mt-10"
      >
        {t('result.done')}
      </button>
    </div>
  )
}
