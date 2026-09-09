import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Search, Play } from 'lucide-react'
import { getHomeSummary, listQuestionTypes, listTemplates } from '../api/examService'
import { STALE_TIME } from '../api/queryClient'
import { Skeleton } from '../components/Skeleton'
import { DesignIcon, type DesignIconName } from '../components/DesignIcon'
import { useT } from '../context/LocaleContext'
import { useMistakeTopics } from '../api/mistakeService'

export function TestsPage() {
  const t = useT()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const types = useQuery({ queryKey: ['exam', 'question-types'], queryFn: listQuestionTypes, staleTime: STALE_TIME.feed })
  const catalog = useQuery({ queryKey: ['exam', 'templates'], queryFn: listTemplates, staleTime: STALE_TIME.feed })
  const { data: home } = useQuery({ queryKey: ['exam', 'home'], queryFn: getHomeSummary })
  const { data: reviews } = useMistakeTopics()
  const weak = reviews?.find(topic => topic.remaining_count > 0)
  const openType = (code: string) => {
    if (code !== 'practice') {
      const matching = catalog.data?.filter(template => template.mode === code) ?? []
      if (matching.length === 1) { navigate(`/quiz/${matching[0].id}/intro`); return }
    }
    navigate(`/tests/${code}`)
  }
  const icons: Record<string, { icon: DesignIconName; tone: string; subtitle: 'home.examSubtitle' | 'home.topicsSubtitle' | 'home.dailyChallenge' | 'home.testsSubtitle' }> = {
    exam: { icon: 'target', tone: 'blue', subtitle: 'home.examSubtitle' },
    practice: { icon: 'book', tone: 'teal', subtitle: 'home.topicsSubtitle' },
    'daily-challenge': { icon: 'flame', tone: 'gold', subtitle: 'home.dailyChallenge' },
  }
  const filtered = types.data?.filter(type => type.name.toLocaleLowerCase().includes(search.toLocaleLowerCase().trim()))
  return <div className="learning-page flex-1 overflow-y-auto"><div className="learning-content">
    <header className="learning-page-heading"><div><span className="learning-eyebrow">PRAVAI / {t('tab.tests')}</span><h1>{t('learn.testsIntro')}</h1><p>{t('learn.testsSubtitle')}</p></div><DesignIcon name="tests" size={45} /></header>
    <section className="test-focus design-card"><div><span className="learning-eyebrow">{t('learn.recommended')}</span><h2>{weak ? t('learn.focusTopic', { topic: weak.topic_name }) : t('home.tileExamSim')}</h2><p>{weak ? t('review.count', { count: weak.remaining_count }) : t('home.examSubtitle')}</p><button className="home-start" onClick={() => weak ? navigate(`/mistakes/${weak.topic_id}`) : openType('exam')}>{t('learn.practiceNow')}<ChevronRight size={18} /></button></div><span className="test-focus-art"><DesignIcon name="target" size={106} /></span></section>
    <button className="test-resume design-card" onClick={() => navigate('/mistakes')}><DesignIcon name="pin" /><span><strong>{t('review.title')}</strong><small>{t('review.explainer')}</small></span><ChevronRight size={19} /></button>
    {home?.resume_attempt && <button className="test-resume design-card" onClick={() => navigate(home.resume_attempt!.mode === 'practice' ? `/quiz/${home.resume_attempt!.template_id}` : `/quiz/${home.resume_attempt!.template_id}/intro`)}><Play size={21} /><span><small>{t('home.continue')}</small><strong>{home.resume_attempt.template_title}</strong></span><ChevronRight size={19} /></button>}
    <div className="learning-section-heading"><h2>{t('learn.browseTests')}</h2><span>{types.data?.length ?? '—'}</span></div>
    <label className="test-search"><Search size={19} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder={t('learn.searchTests')} aria-label={t('learn.searchTests')} type="search" /></label>
    {(types.isError || catalog.isError) && <div className="learning-notice" role="alert"><p>{t('tests.loadFailed')}</p><button onClick={() => { void types.refetch(); void catalog.refetch() }}>{t('home.retry')}</button></div>}
    <div className="test-type-grid">{types.isPending ? [0,1,2].map(i => <Skeleton key={i} className="h-44 rounded-2xl" />) : filtered?.map(type => {
      const style = icons[type.code] ?? { icon: 'tests', tone: 'teal', subtitle: 'home.testsSubtitle' }
      const count = catalog.data?.filter(template => template.mode === type.code).length
      return <button key={type.id} className="test-type-card design-card" onClick={() => openType(type.code)}><div><span className={`icon-medallion ${style.tone}`}><DesignIcon name={style.icon} /></span><ChevronRight size={20} /></div><h2>{type.name}</h2><p>{t(style.subtitle)}</p><small>{count === undefined ? '—' : t('learn.templateCount', { count })}</small></button>
    })}</div>
    {!types.isPending && !types.isError && !filtered?.length && <p className="learning-empty">{t('learn.noMatches')}</p>}
    <button className="test-tutor-link" onClick={() => navigate('/chat/new', { state: { prompt: t('learn.planPrompt') } })}><DesignIcon name="tutor" size={57} /><span><strong>{t('learn.planTitle')}</strong><small>{t('learn.tutorSubtitle')}</small></span><ChevronRight size={19} /></button>
  </div></div>
}
