import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, LogOut, Settings2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLocale, useT } from '../context/LocaleContext'
import { LANGUAGES } from '../i18n/languages'
import { SmoothImage } from '../components/SmoothImage'
import { DesignIcon } from '../components/DesignIcon'
import { getAwards } from '../api/engagementService'
import { getHomeSummary } from '../api/examService'
import { learningAccuracy, useLearningInsights } from '../api/learningService'
import { resultPrompt, mistakePrompt } from '../lib/learningRecommendations'
import { getThemePref, setThemePref } from '../lib/theme'

export function ProfilePage() {
  const navigate = useNavigate()
  const { profile, logout } = useAuth()
  const { lang, setLang } = useLocale()
  const t = useT()
  const [theme, setTheme] = useState(getThemePref)
  const [showAll, setShowAll] = useState(false)
  const { data: insights, isPending, isError, refetch } = useLearningInsights()
  const { data: home } = useQuery({ queryKey: ['exam', 'home'], queryFn: getHomeSummary })
  const stats = insights?.stats
  const streak = home?.daily_streak
  const ask = (prompt: string) => navigate('/chat/new', { state: { prompt } })
  const awardsQuery = useQuery({ queryKey: ['awards'], queryFn: getAwards })
  const badges = awardsQuery.data ?? []

  return <div className="learning-page flex-1 overflow-y-auto"><div className="learning-content">
    <header className="learning-page-heading"><div><span className="learning-eyebrow">PRAVAI / {t('tab.profile')}</span><h1>{t('learn.yourJourney')}</h1><p>{t('learn.profileIntro')}</p></div><Settings2 size={25} className="text-primary" /></header>
    <button className="profile-identity design-card" onClick={() => navigate('/profile/info')}>
      <div className="profile-portrait">{profile?.avatarUrl ? <SmoothImage src={profile.avatarUrl} className="w-full h-full object-cover" /> : <span>{(profile?.fullName || 'P').slice(0, 1).toUpperCase()}</span>}</div>
      <div><h2>{profile?.fullName || t('profile.noName')}</h2><p>{profile?.phone}</p><span className="profile-edit">{t('profile.myInfo')} <ChevronRight size={13} /></span></div><ChevronRight size={21} />
    </button>
    <div className="learning-stats">
      <div><DesignIcon name="tests" size={27} /><strong>{stats?.completed_count ?? '—'}</strong><span>{t('learn.completed')}</span></div>
      <div><DesignIcon name="target" size={27} /><strong>{stats ? learningAccuracy(stats) + '%' : '—'}</strong><span>{t('learn.accuracy')}</span></div>
      <div><DesignIcon name="flame" size={27} /><strong>{streak?.current_days ?? '—'}</strong><span>{t('learn.streak')}</span></div>
      <div><DesignIcon name="star" size={27} /><strong>{streak?.points ?? '—'}</strong><span>{t('learn.points')}</span></div>
    </div>
    <button className="profile-coach design-card" onClick={() => ask(t('learn.planPrompt'))}><DesignIcon name="tutor" size={74} /><div><span className="learning-eyebrow">{t('learn.personalized')}</span><h2>{t('learn.planTitle')}</h2><p>{t('learn.tutorSubtitle')}</p></div><ChevronRight size={21} /></button>
    {isError && <div className="learning-notice" role="alert"><p>{t('learn.learningUnavailable')}</p><button onClick={() => void refetch()}>{t('home.retry')}</button></div>}
    <section className="learning-section"><div className="learning-section-heading"><h2>{t('learn.achievements')}</h2><span>{badges.filter(b => b.earned).length} / {badges.length}</span></div>{awardsQuery.isError && <p className="learning-notice">{t('home.loadError')}</p>}{awardsQuery.isPending && <p>{t('home.loading')}</p>}<div className="achievement-grid">{badges.map(badge => <div key={badge.id} className={`achievement-card design-card ${badge.earned ? 'earned' : 'locked'}`}><span className={`icon-medallion ${badge.icon === 'target' ? 'blue' : badge.icon === 'flame' ? 'gold' : 'teal'}`}><DesignIcon name={badge.icon} /></span><h3>{badge.title}</h3><p>{badge.description}</p>{badge.earned && <small>{t('learn.earned')}</small>}</div>)}</div></section>
    <section className="learning-section"><div className="learning-section-heading"><h2>{t('learn.recentResults')}</h2>{(insights?.recent_results.length ?? 0) > 4 && <button onClick={() => setShowAll(!showAll)}>{t(showAll ? 'home.showLess' : 'home.viewAll')}</button>}</div><div className="design-card result-history">
      {insights?.recent_results.length ? insights.recent_results.slice(0, showAll ? undefined : 4).map(result => <button key={result.id} className="history-row" onClick={() => ask(resultPrompt(result, t))}><span className={`history-symbol ${result.passed === false ? 'failed' : ''}`}><DesignIcon name={result.passed === false ? 'pin' : 'checklist'} size={26} /></span><span className="history-title"><strong>{result.title}</strong><small>{new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short', timeZone: 'Asia/Tashkent' }).format(new Date(result.finished_at))} · {t('learn.correctOutOf', { correct: result.correct_count, total: result.correct_count + result.mistake_count })}</small></span><span className={`history-status ${result.passed === false ? 'failed' : ''}`}>{t(result.passed === true ? 'learn.passed' : result.passed === false ? 'learn.failed' : 'learn.finished')}</span><ChevronRight size={15} /></button>) : <p className="learning-empty">{t(isPending ? 'home.loading' : 'learn.noResults')}</p>}
    </div></section>
    {!!insights?.recent_mistakes.length && <section className="learning-section"><div className="learning-section-heading"><h2>{t('learn.recentMistakes')}</h2><DesignIcon name="pin" size={24} /></div><div className="mistake-list">{insights.recent_mistakes.slice(0, 3).map(mistake => <details className="design-card mistake-detail" key={mistake.id}><summary><span>{mistake.topic}</span><strong>{mistake.question}</strong></summary><p><span>{t('learn.yourAnswer')}</span>{mistake.selected_answer || t('learn.skipped')}</p><p className="correct-answer"><span>{t('learn.correctAnswer')}</span>{mistake.correct_answer || t('learn.skipped')}</p>{mistake.explanation && <p>{mistake.explanation}</p>}<button onClick={() => ask(mistakePrompt(mistake, t))}>{t('learn.askTutor')}<ChevronRight size={17} /></button></details>)}</div></section>}
    <section className="learning-section"><div className="learning-section-heading"><h2>{t('learn.settings')}</h2></div><div className="design-card profile-settings">
      <label><span>{t('profile.language')}</span><select value={lang} onChange={event => setLang(event.target.value as typeof lang)}>{LANGUAGES.map(language => <option key={language.code} value={language.code}>{language.native}</option>)}</select></label>
      <div><span>{t('learn.appearance')}</span><div className="theme-options">{(['dark', 'light'] as const).map(value => <button key={value} aria-pressed={theme === value} onClick={() => { setTheme(value); setThemePref(value) }}>{t(`learn.${value}`)}</button>)}</div></div>
    </div></section>
    <button className="profile-signout" onClick={() => (document.getElementById('logout-dialog') as HTMLDialogElement | null)?.showModal()}><LogOut size={17} />{t('profile.logout')}</button>
    <dialog id="logout-dialog" className="rating-dialog" aria-labelledby="logout-title"><h2 id="logout-title">{t('learn.logoutConfirm')}</h2><div className="logout-actions"><form method="dialog"><button>{t('learn.cancel')}</button></form><button className="text-destructive" onClick={() => void logout()}>{t('profile.logout')}</button></div></dialog>
  </div></div>
}
