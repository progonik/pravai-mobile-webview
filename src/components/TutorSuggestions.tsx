import { ChevronRight } from 'lucide-react'
import { useLearningInsights, learningAccuracy } from '../api/learningService'
import { buildRecommendations } from '../lib/learningRecommendations'
import { DesignIcon } from './DesignIcon'
import { Skeleton } from './Skeleton'
import { useT } from '../context/LocaleContext'

export function TutorSuggestions({ onSelect }: { onSelect: (prompt: string) => void }) {
  const t = useT()
  const { data, isPending, isError } = useLearningInsights()
  return <div className="tutor-welcome">
    <div className="tutor-welcome-art"><DesignIcon name="tutor" size={126} /></div>
    <span className="learning-eyebrow">PRAVAI TUTOR</span>
    <h1>{t('learn.tutorTitle')}</h1><p>{t('learn.tutorSubtitle')}</p>
    {!!data?.stats.completed_count && <span className="learning-context-chip"><DesignIcon name="chart" size={19} />{t('learn.learningSummary', { count: data.stats.completed_count, accuracy: learningAccuracy(data.stats) })}</span>}
    <div className="suggestions-heading"><h2>{t('learn.suggestions')}</h2><p>{t('learn.suggestionsHint')}</p></div>
    {isError && <p className="learning-notice" role="status">{t('learn.learningUnavailable')}</p>}
    <div className="suggestion-grid">{isPending ? [0, 1].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />) : buildRecommendations(data, t).map(item => <button key={item.id} className="suggestion-card design-card" onClick={() => onSelect(item.prompt)}><DesignIcon name={item.icon} size={33} /><span><strong>{item.title}</strong><small>{item.detail}</small></span><ChevronRight size={17} /></button>)}</div>
  </div>
}
