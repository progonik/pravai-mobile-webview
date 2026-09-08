import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, PlayCircle, X } from 'lucide-react'
import { getHomeSummary, type WeakTopic } from '../api/examService'
import { Skeleton } from '../components/Skeleton'
import { getNotifications } from '../api/engagementService'
import { DesignIcon, type DesignIconName } from '../components/DesignIcon'
import { useAuth } from '../context/AuthContext'
import { useT, useLocale, type Translate } from '../context/LocaleContext'

function weekdayLabel(date: string, lang: string) {
  const value = new Date(`${date}T12:00:00Z`)
  if (lang === 'uz') return ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'][value.getUTCDay()]
  return new Intl.DateTimeFormat(lang, { weekday: 'short', timeZone: 'UTC' }).format(value)
}

function templateHref(id: string, mode: string) {
  return mode === 'practice' ? `/quiz/${id}` : `/quiz/${id}/intro`
}

function ReadinessRing({ percent }: { percent: number }) {
  const value = Math.min(100, Math.max(0, percent))
  return <div className="readiness-ring">
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <defs><linearGradient id="readiness-gradient"><stop stopColor="#00dca0" /><stop offset="1" stopColor="#38ebbc" /></linearGradient></defs>
      <circle cx="50" cy="50" r="43" fill="none" stroke="var(--input-background)" strokeWidth="10" />
      <circle cx="50" cy="50" r="43" fill="none" stroke="url(#readiness-gradient)" strokeWidth="10" strokeLinecap="round" strokeDasharray="270.18" strokeDashoffset={270.18 * (1 - value / 100)} transform="rotate(-90 50 50)" />
    </svg><strong>{value}%</strong>
  </div>
}

function WeakTopicRow({ topic, t, index, onClick }: { topic: WeakTopic; t: Translate; index: number; onClick: () => void }) {
  const accuracy = topic.answered_count > 0 ? Math.max(0, Math.min(100, Math.round((topic.answered_count - topic.mistake_count) / topic.answered_count * 100))) : 0
  const tone = accuracy < 60 ? 'attention' : accuracy < 80 ? 'practice' : 'good'
  const icons: DesignIconName[] = ['turn', 'crossroad', 'warning', 'speed']
  return <button className="weak-topic-row" onClick={onClick}>
    <DesignIcon name={icons[index % icons.length]} />
    <span className="weak-topic-name">{topic.topic_name}</span>
    <span className={`topic-meter ${tone}`}><span style={{ width: `${accuracy}%` }} /></span>
    <span className="topic-percent">{accuracy}%</span>
    <span className={`topic-status ${tone}`}>{t(`home.status.${tone}`)}</span>
    <ChevronRight size={17} />
  </button>
}

export function HomePage() {
  const navigate = useNavigate()
  const { session } = useAuth()
    const t = useT()
  const { lang } = useLocale()
  const [tipDismissed, setTipDismissed] = useState(false)
  const [allTopics, setAllTopics] = useState(false)
  const { data: home, isPending, isError, refetch } = useQuery({ queryKey: ['exam', 'home'], queryFn: getHomeSummary })
  const { data: inbox } = useQuery({ queryKey: ['notifications', 1], queryFn: () => getNotifications(1), refetchInterval: 30000 })
  const worstTopic = home?.weak_topics[0]
  const name = session?.user.fullName?.split(' ')[0] || session?.user.phone || ''
  const openTutor = (topic: string) => navigate('/chat', { state: { prompt: t('home.tutorPrompt', { topic }) } })
  const tiles: { icon: DesignIconName; title: Parameters<Translate>[0]; subtitle: Parameters<Translate>[0]; tone: string; action: () => void }[] = [
    { icon: 'target', title: 'home.tileExamSim', subtitle: 'home.examSubtitle', tone: 'blue', action: () => navigate('/tests/exam') },
    { icon: 'pin', title: 'home.tileMistakes', subtitle: 'home.mistakesSubtitle', tone: 'purple', action: () => document.getElementById('weak-topics')?.scrollIntoView({ behavior: 'smooth', block: 'center' }) },
    { icon: 'star', title: 'home.tileRating', subtitle: 'home.ratingSubtitle', tone: 'gold', action: () => (document.getElementById('rating-dialog') as HTMLDialogElement | null)?.showModal() },
    { icon: 'book', title: 'home.tileRules', subtitle: 'home.rulesSubtitle', tone: 'teal', action: () => openTutor(t('home.tileRules')) },
  ]

  return <div className="home-page flex-1 overflow-y-auto"><div className="home-content">
    <header className="home-header">
      <div className="home-brand"><DesignIcon name="car" size={54} /><div><div className="brand-word">Prav<span>AI</span></div><p>{t('home.brandTagline')}</p></div></div>
      <div className="home-header-actions">
        <button className="notification-button" aria-label={t('home.notifications')} onClick={() => navigate('/notifications')}><DesignIcon name="bell" size={32} />{!!inbox?.unread_count && <span className="notification-count">{inbox.unread_count > 99 ? '99+' : inbox.unread_count}</span>}</button>
        <button className="home-avatar" aria-label={t('tab.profile')} onClick={() => navigate('/profile')}>{name.slice(0, 1).toUpperCase()}</button>
      </div>
    </header>
    <section className="home-hero"><div className="hero-copy"><p className="hero-greeting">{t('home.greeting')},</p><h1>{name} <span className="hero-wave">👋</span></h1><p className="hero-subtitle">{t('home.subtitle')} 🚘</p></div></section>
    <div className="home-overview">
      <button className="design-card readiness-card" onClick={() => navigate('/tests')}>
        {isPending ? <Skeleton className="w-20 h-20 rounded-full" /> : <ReadinessRing percent={home?.readiness?.percent ?? 0} />}
        <div className="readiness-copy"><h2>{t('home.readiness')}</h2><p>{home?.readiness ? t('home.questionsFraction', { answered: home.readiness.answered_count, total: home.readiness.total_count }) : t('home.startLearning')}</p><div className="readiness-meter"><span style={{ width: `${Math.min(100, Math.max(0, home?.readiness?.percent ?? 0))}%` }} /></div></div><ChevronRight className="readiness-chevron" size={23} />
      </button>
      <div className="quick-links">{([
        ['tests', 'home.tileTests', 'home.testsSubtitle', '/tests'],
        ['book', 'home.tileTopics', 'home.topicsSubtitle', '/tests/practice'],
        ['brain', 'home.tileAiTutor', 'home.tutorSubtitle', '/chat'],
      ] as const).map(([icon, title, subtitle, path]) => <button key={icon} className="design-card quick-link" onClick={() => navigate(path)}><span className="icon-medallion teal"><DesignIcon name={icon} /></span><h2>{t(title)}</h2><p>{t(subtitle)}</p></button>)}</div>
    </div>
    {isError && <div className="design-card home-empty" role="alert"><p>{t('home.loadError')}</p><button className="home-start" onClick={() => void refetch()}>{t('home.retry')}</button></div>}
    {isPending && <Skeleton className="h-40 rounded-2xl mb-4" />}
    {home?.resume_attempt && <button className="design-card resume-card" onClick={() => navigate(templateHref(home.resume_attempt!.template_id, home.resume_attempt!.mode))}><PlayCircle size={32} /><div><small>{t('home.continue')}</small><h2>{home.resume_attempt.template_title}</h2><p>{t('home.answeredCount', { count: home.resume_attempt.answered_count })}</p></div><ChevronRight /></button>}
    {home?.daily_challenge && <section className="design-card daily-card">
      <div className="daily-copy"><div className="daily-eyebrow"><span className="small-medallion"><DesignIcon name="flame" size={25} /></span>{t('home.dailyChallenge')}</div><h2>{home.daily_challenge.title}</h2><p>{t('tests.questionsCount', { count: home.daily_challenge.questions_per_attempt })}{home.daily_challenge.topic_name && ` • ${home.daily_challenge.topic_name}`}</p><button className="home-start" onClick={() => navigate(templateHref(home.daily_challenge!.id, home.daily_challenge!.mode))}>{t('home.start')}<ChevronRight size={20} /></button></div>
      {home.daily_streak && <div className="daily-streak"><div className="streak-reward"><span className="small-medallion"><DesignIcon name="gift" size={32} /></span><div><p>{t('home.streakDays', { count: home.daily_streak.current_days })}</p><strong>{t('home.streakPoints', { count: home.daily_streak.points })}</strong></div></div><div className="streak-calendar">{home.daily_streak.days.map(day => <div key={day.date} className={`streak-day ${day.is_today ? 'today' : ''}`}><span>{day.is_today ? t('home.today') : weekdayLabel(day.date, lang)}</span>{day.completed ? <DesignIcon name="check" size={25} /> : <strong>{Number(day.date.slice(-2))}</strong>}</div>)}</div></div>}
    </section>}
    <div className="feature-grid">{tiles.map(tile => <button key={tile.icon} className="design-card feature-card" onClick={tile.action}><span className={`icon-medallion ${tile.tone}`}><DesignIcon name={tile.icon} /></span><h2>{t(tile.title)}</h2><p>{t(tile.subtitle)}</p></button>)}</div>
    <section className="design-card weak-topics" id="weak-topics">
      <div className="weak-heading"><span className="icon-medallion teal"><DesignIcon name="chart" /></span><div><h2>{t('home.weakTopics')}</h2><p>{t('home.weakTopicsSubtitle')}</p></div>{!!home?.weak_topics.length && <button onClick={() => setAllTopics(!allTopics)}>{t(allTopics ? 'home.showLess' : 'home.viewAll')}<ChevronRight size={17} /></button>}</div>
      {home?.weak_topics.length ? home.weak_topics.slice(0, allTopics ? undefined : 4).map((topic, index) => <WeakTopicRow key={topic.topic_id} topic={topic} t={t} index={index} onClick={() => openTutor(topic.topic_name)} />) : <p className="weak-empty">{isPending ? t('home.loading') : t('home.placeholderBody')}</p>}
    </section>
    {!tipDismissed && <aside className="tutor-banner"><DesignIcon name="tutor" size={96} /><div className="tutor-copy"><h2>{t('home.tutorRecommendation')}</h2><p>{worstTopic ? t('home.aiTip', { topic: worstTopic.topic_name }) : t('home.tutorWelcome')}</p></div><button className="tutor-open" onClick={() => worstTopic ? openTutor(worstTopic.topic_name) : navigate('/chat')}>{t('home.openTutor')}<ChevronRight size={20} /></button><button className="tutor-dismiss" onClick={() => setTipDismissed(true)} aria-label={t('home.dismiss')}><X size={14} /></button></aside>}
    <dialog id="rating-dialog" className="rating-dialog" aria-labelledby="rating-title" onClick={event => { if (event.target === event.currentTarget) event.currentTarget.close() }}>
      <div className="rating-dialog-content"><span className="icon-medallion gold"><DesignIcon name="star" /></span><h2 id="rating-title">{t('home.tileRating')}</h2><strong className="rating-score">{home?.daily_streak?.points ?? 0}</strong><p>{t('home.pointsExplanation')}</p><p>{t('home.streakDays', { count: home?.daily_streak?.current_days ?? 0 })}</p><form method="dialog"><button className="home-start">{t('home.dismiss')}</button></form></div>
    </dialog>
  </div></div>
}
