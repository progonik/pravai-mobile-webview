import type { LearningInsights, LearningResult, LearningMistake } from '../api/learningService'
import type { Translate } from '../context/LocaleContext'
import type { DesignIconName } from '../components/DesignIcon'

export interface TutorRecommendation { id: string; title: string; detail: string; prompt: string; icon: DesignIconName }

export function resultPrompt(result: LearningResult, t: Translate) {
  return t('learn.resultPrompt', { title: result.title, correct: result.correct_count, mistakes: result.mistake_count })
}
export function mistakePrompt(mistake: LearningMistake, t: Translate) {
  return t('learn.mistakePrompt', { question: mistake.question, selected: mistake.selected_answer || t('learn.skipped'), correct: mistake.correct_answer || t('learn.skipped') })
}

// Deterministic evidence-based drafts: browsing suggestions never sends a
// message or spends model quota. Server-side context is refreshed on send.
export function buildRecommendations(data: LearningInsights | undefined, t: Translate): TutorRecommendation[] {
  const out: TutorRecommendation[] = []
  const weak = data?.weak_topics.find(topic => topic.mistake_count > 0 && topic.answered_count > 0)
  if (weak) out.push({
    id: 'weak', icon: 'brain', title: t('learn.weakTitle'),
    detail: t('learn.topicEvidence', { answered: weak.answered_count, mistakes: weak.mistake_count }),
    prompt: t('learn.weakPrompt', { topic: weak.topic_name, answered: weak.answered_count, mistakes: weak.mistake_count }),
  })
  const recent = data?.recent_results[0]
  if (recent) out.push({ id: 'result', icon: 'chart', title: t('learn.resultTitle'), detail: recent.title, prompt: resultPrompt(recent, t) })
  const mistake = data?.recent_mistakes[0]
  if (mistake) out.push({ id: 'mistake', icon: 'pin', title: t('learn.mistakeTitle'), detail: mistake.topic, prompt: mistakePrompt(mistake, t) })
  if (!out.length) out.push({ id: 'starter', icon: 'warning', title: t('learn.starterTitle'), detail: t('home.topicsSubtitle'), prompt: t('learn.starterPrompt') })
  out.push({ id: 'plan', icon: 'target', title: t('learn.planTitle'), detail: t('learn.testsSubtitle'), prompt: t('learn.planPrompt') })
  return out
}
