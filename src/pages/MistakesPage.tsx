import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight } from 'lucide-react'
import { useMistakeTopics } from '../api/mistakeService'
import { listTemplates } from '../api/examService'
import { PageHeader } from '../components/PageHeader'
import { DesignIcon } from '../components/DesignIcon'
import { useT } from '../context/LocaleContext'

export function MistakesPage() {
 const { topicId } = useParams<{ topicId: string }>()
 const navigate = useNavigate()
 const t = useT()
 const topics = useMistakeTopics()
 const catalog = useQuery({ queryKey: ['exam', 'templates'], queryFn: listTemplates, enabled: !!topicId })
 const topic = topics.data?.find(item => item.topic_id === topicId)
 const regular = catalog.data?.find(item => item.topic_id === topicId && item.mode === 'practice' && item.available_question_count > 0)
 return <div className="relative flex h-full flex-col bg-background">
  <PageHeader title={t('review.title')} onBack={() => navigate(topicId ? '/mistakes' : '/home')} />
  <div className="learning-page flex-1 overflow-y-auto" style={{ paddingTop: 'calc(var(--safe-top) + 54px)' }}><div className="learning-content">
   {topics.isPending && <p>{t('home.loading')}</p>}
   {topics.isError && <div className="learning-notice" role="alert"><p>{t('home.loadError')}</p><button onClick={() => void topics.refetch()}>{t('home.retry')}</button></div>}
   {!topics.isPending && !topics.isError && (topicId ? <section className="review-overview design-card">
    <span className="icon-medallion"><DesignIcon name="book" /></span>
    <h1>{topic?.topic_name ?? t('review.title')}</h1>
    <p>{t('review.explainer')}</p>
    <strong className="review-count">{topic?.remaining_count ?? 0}</strong><p>{t('review.remaining')}</p>
    {(topic?.remaining_count ?? 0) > 0 && <p>{t('review.batch', { count: Math.min(topic?.available_count ?? 0, 50) })}</p>}
    {(topic?.remaining_count ?? 0) > (topic?.available_count ?? 0) && <p className="learning-notice">{t('review.activeTest')}</p>}
    {(topic?.available_count ?? 0) > 0 && <button className="home-start" onClick={() => navigate(`/mistakes/${topicId}/quiz`)}>{t(topic?.review_id ? 'review.resume' : 'review.start')}<ChevronRight size={18} /></button>}
    {(topic?.remaining_count ?? 0) === 0 && <><h2>{t('review.cleared')}</h2><button className="home-start" onClick={() => navigate(regular ? `/quiz/${regular.id}` : '/tests/practice')}>{t('review.regular')}</button></>}
    <button className="test-tutor-link" onClick={() => navigate('/chat/new', { state: { prompt: t('home.tutorPrompt', { topic: topic?.topic_name ?? t('review.title') }) } })}><DesignIcon name="brain" /><span>{t('learn.askTutor')}</span><ChevronRight size={18} /></button>
   </section> : <>
    <header className="learning-page-heading"><div><h1>{t('review.title')}</h1><p>{t('review.explainer')}</p></div><DesignIcon name="target" size={48} /></header>
    {!topics.data?.length && <div className="learning-empty"><h2>{t('review.cleared')}</h2><button className="home-start" onClick={() => navigate('/tests')}>{t('review.regular')}</button></div>}
    <div className="review-topic-list">{topics.data?.map(item => <button key={item.topic_id} className="review-topic design-card" onClick={() => navigate(`/mistakes/${item.topic_id}`)}><span className="icon-medallion"><DesignIcon name={item.remaining_count ? 'book' : 'check'} /></span><span><strong>{item.topic_name}</strong><small>{item.remaining_count ? t('review.count', { count: item.remaining_count }) : t('review.cleared')}</small>{item.review_id && <small>{t('review.resume')}</small>}</span><ChevronRight size={20} /></button>)}</div>
   </>)}
  </div></div>
 </div>
}
