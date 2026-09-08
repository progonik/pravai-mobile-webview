import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Bot,
  BookOpen,
  ChevronRight,
  FileText,
  Flame,
  ListChecks,
  ListX,
  PlayCircle,
  Star,
  Target,
  X,
} from 'lucide-react'
import { getHomeSummary, type WeakTopic } from '../api/examService'
import { Skeleton } from '../components/Skeleton'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useT, type Translate } from '../context/LocaleContext'

/** Practice-mode templates resume/start straight into the quiz; everything
 *  else (exam, daily-challenge, ...) has an intro screen first -- same
 *  rule TestTypePage's templateHref uses. Resuming an attempt already
 *  under way always skips the intro regardless of mode, though: there's
 *  nothing left to introduce. */
function templateHref(templateId: string, mode: string): string {
  return mode === 'practice' ? `/quiz/${templateId}` : `/quiz/${templateId}/intro`
}

/** A ring rather than a bar: the mockup's "how much of the bank have you
 *  covered" score reads as a dial, not a linear meter. Drawn with the
 *  circle rotated -90deg (via the wrapping div) so progress starts at
 *  12 o'clock, the universal "gauge" convention. */
function ReadinessRing({ percent, size = 56, stroke = 6 }: { percent: number; size?: number; stroke?: number }) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - Math.min(100, Math.max(0, percent)) / 100)
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} fill="none" className="stroke-border" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="stroke-primary transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-mono numeric text-[13px] font-bold text-foreground">
        {percent}%
      </span>
    </div>
  )
}

/** Accuracy thresholds for a weak-topic row's status pill -- same bands
 *  the progress bar's color follows, so the pill never disagrees with
 *  the bar sitting right next to it. */
function topicStatus(accuracy: number): { labelKey: 'home.status.attention' | 'home.status.practice' | 'home.status.good'; tone: string } {
  if (accuracy < 60) return { labelKey: 'home.status.attention', tone: 'text-destructive bg-destructive/10' }
  if (accuracy < 80) return { labelKey: 'home.status.practice', tone: 'text-warning bg-warning/10' }
  return { labelKey: 'home.status.good', tone: 'text-success bg-success/10' }
}

function WeakTopicRow({ topic, t }: { topic: WeakTopic; t: Translate }) {
  const accuracy = Math.round(((topic.answered_count - topic.mistake_count) / topic.answered_count) * 100)
  const status = topicStatus(accuracy)
  const barColor = accuracy < 60 ? 'bg-destructive' : accuracy < 80 ? 'bg-warning' : 'bg-success'
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-semibold text-foreground truncate mb-1.5">{topic.topic_name}</p>
        <div className="h-1.5 rounded-full bg-input-background overflow-hidden">
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${accuracy}%` }} />
        </div>
      </div>
      <span className="font-mono numeric text-[12px] text-muted-foreground shrink-0 w-9 text-right">{accuracy}%</span>
      <span className={`text-[10.5px] font-bold px-2 py-1 rounded-full shrink-0 ${status.tone}`}>{t(status.labelKey)}</span>
    </div>
  )
}

export function HomePage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const { showToast } = useToast()
  const t = useT()
  const [tipDismissed, setTipDismissed] = useState(false)

  const { data: home, isPending } = useQuery({
    queryKey: ['exam', 'home'],
    queryFn: getHomeSummary,
  })

  const comingSoon = () => showToast(t('home.comingSoon'))
  const worstTopic = home?.weak_topics[0]

  return (
    <div className="flex-1 overflow-y-auto flex flex-col top-inset px-4 pb-28">
      <div
        className="enter-1 shrink-0 relative overflow-hidden rounded-2xl mb-4 bg-card border border-border bg-cover bg-right flex items-center"
        style={{ backgroundImage: "url('/images/hero-night-drive.webp')", minHeight: 132 }}
      >
        {/* The photo only needs to read on its right half; a left-to-right
            fade back to the card color keeps the greeting text legible
            without a flat scrim dulling the whole image. */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(90deg, var(--card) 0%, var(--card) 40%, transparent 85%)' }}
        />
        <div className="relative p-5">
          <p className="text-[13px] text-muted-foreground">{t('home.greeting')} 👋</p>
          <p className="font-display text-[22px] font-bold text-foreground mt-0.5">
            {session?.user.fullName ?? session?.user.phone}
          </p>
          <p className="text-[12.5px] text-muted-foreground mt-1.5 max-w-[65%]">{t('home.subtitle')}</p>
        </div>
      </div>

      {isPending ? (
        <div className="flex flex-col gap-3 mb-4">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
        </div>
      ) : (
        <>
          <button
            onClick={() => navigate('/tests')}
            className="press-row enter-2 mb-3 rounded-2xl border border-border bg-card p-4 flex items-center gap-4 text-left"
          >
            {home && home.readiness && <ReadinessRing percent={home.readiness.percent} />}
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-foreground">{t('home.readiness')}</p>
              {home?.readiness && (
                <p className="font-mono text-[12px] text-muted-foreground mt-0.5">
                  {t('home.questionsFraction', {
                    answered: String(home.readiness.answered_count),
                    total: String(home.readiness.total_count),
                  })}
                </p>
              )}
            </div>
            <ChevronRight size={18} className="text-muted-foreground shrink-0" />
          </button>

          <div className="grid grid-cols-3 gap-2.5 mb-3 enter-2">
            <button
              onClick={() => navigate('/tests')}
              className="press-row rounded-2xl border border-border bg-card p-3 flex flex-col items-center gap-2 text-center"
            >
              <div className="tile-accent w-10 h-10 rounded-xl bg-input-background flex items-center justify-center text-primary">
                <ListChecks size={18} />
              </div>
              <span className="text-[11.5px] font-semibold text-foreground leading-tight">{t('home.tileTests')}</span>
            </button>
            <button
              onClick={() => navigate('/tests/practice')}
              className="press-row rounded-2xl border border-border bg-card p-3 flex flex-col items-center gap-2 text-center"
            >
              <div className="tile-accent w-10 h-10 rounded-xl bg-input-background flex items-center justify-center text-primary">
                <BookOpen size={18} />
              </div>
              <span className="text-[11.5px] font-semibold text-foreground leading-tight">{t('home.tileTopics')}</span>
            </button>
            <button
              onClick={() => navigate('/chat')}
              className="press-row rounded-2xl border border-border bg-card p-3 flex flex-col items-center gap-2 text-center"
            >
              <div className="tile-accent w-10 h-10 rounded-xl bg-input-background flex items-center justify-center text-primary">
                <Bot size={18} />
              </div>
              <span className="text-[11.5px] font-semibold text-foreground leading-tight">{t('home.tileAiTutor')}</span>
            </button>
          </div>

          {home?.resume_attempt && (
            <button
              onClick={() => navigate(templateHref(home.resume_attempt!.template_id, home.resume_attempt!.mode))}
              className="press-row enter-2 mb-3 rounded-2xl p-5 flex items-center gap-4 text-left bg-primary text-primary-foreground shadow-brand"
            >
              <PlayCircle size={30} className="shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider opacity-75">{t('home.continue')}</p>
                <p className="text-[15px] font-bold truncate">{home.resume_attempt.template_title}</p>
                <p className="font-mono text-[12px] opacity-80 mt-0.5">
                  {t('home.answeredCount', { count: String(home.resume_attempt.answered_count) })}
                </p>
              </div>
            </button>
          )}

          {home?.daily_challenge && (
            <div
              className="enter-2 shrink-0 mb-3 relative overflow-hidden rounded-2xl border border-primary/25 p-4 bg-cover bg-right"
              style={{ backgroundImage: "url('/images/daily-road.webp')" }}
            >
              {/* Same left-fade trick as the hero: only the right edge needs
                  to show the scene, the left needs to stay readable. */}
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(90deg, var(--card) 0%, var(--card) 45%, transparent 95%)' }}
              />
              <div className="relative">
                <div className="flex items-center gap-2 mb-1">
                  <Flame size={15} className="text-primary" />
                  <p className="text-[11px] font-semibold text-primary uppercase tracking-wider">{t('home.dailyChallenge')}</p>
                </div>
                <p className="text-[16px] font-bold text-foreground mb-1">{home.daily_challenge.title}</p>
                <p className="font-mono text-[12px] text-muted-foreground mb-3">
                  {t('tests.questionsCount', { count: String(home.daily_challenge.questions_per_attempt) })}
                </p>
                <button
                  onClick={() => navigate(templateHref(home.daily_challenge!.id, home.daily_challenge!.mode))}
                  className="press w-full max-w-[220px] rounded-full bg-primary text-primary-foreground font-semibold text-[14px] py-2.5 flex items-center justify-center gap-1.5"
                >
                  {t('home.start')}
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5 mb-4 enter-3">
            <button
              onClick={() => navigate('/tests/exam')}
              className="press-row rounded-2xl border border-border bg-card p-4 flex flex-col items-start gap-2.5 text-left"
            >
              <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-primary">
                <Target size={17} />
              </div>
              <span className="text-[12.5px] font-semibold text-foreground leading-tight">{t('home.tileExamSim')}</span>
            </button>
            <button
              onClick={comingSoon}
              className="press-row rounded-2xl border border-border bg-card p-4 flex flex-col items-start gap-2.5 text-left"
            >
              <div className="w-9 h-9 rounded-full bg-destructive/15 flex items-center justify-center text-destructive">
                <ListX size={17} />
              </div>
              <span className="text-[12.5px] font-semibold text-foreground leading-tight">{t('home.tileMistakes')}</span>
            </button>
            <button
              onClick={comingSoon}
              className="press-row rounded-2xl border border-border bg-card p-4 flex flex-col items-start gap-2.5 text-left"
            >
              <div className="w-9 h-9 rounded-full bg-warning/15 flex items-center justify-center text-warning">
                <Star size={17} />
              </div>
              <span className="text-[12.5px] font-semibold text-foreground leading-tight">{t('home.tileRating')}</span>
            </button>
            <button
              onClick={comingSoon}
              className="press-row rounded-2xl border border-border bg-card p-4 flex flex-col items-start gap-2.5 text-left"
            >
              <div className="w-9 h-9 rounded-full bg-input-background flex items-center justify-center text-muted-foreground">
                <FileText size={17} />
              </div>
              <span className="text-[12.5px] font-semibold text-foreground leading-tight">{t('home.tileRules')}</span>
            </button>
          </div>

          {home && home.weak_topics.length > 0 && (
            <div className="enter-3 mb-4 rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3 mb-1">
                <div>
                  <p className="text-[14.5px] font-bold text-foreground">{t('home.weakTopics')}</p>
                  <p className="text-[12px] text-muted-foreground">{t('home.weakTopicsSubtitle')}</p>
                </div>
                <button onClick={comingSoon} className="press flex items-center gap-0.5 text-[12px] font-semibold text-primary shrink-0 pt-0.5">
                  {t('home.viewAll')}
                  <ChevronRight size={14} />
                </button>
              </div>
              <div className="dashed-list">
                {home.weak_topics.map((topic) => (
                  <WeakTopicRow key={topic.topic_id} topic={topic} t={t} />
                ))}
              </div>
            </div>
          )}

          {worstTopic && !tipDismissed && (
            <div className="enter-3 mb-4 rounded-2xl border border-primary/30 bg-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary shrink-0">
                <Bot size={19} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] text-foreground leading-snug">
                  {t('home.aiTip', { topic: worstTopic.topic_name })}
                </p>
              </div>
              <button
                onClick={() => setTipDismissed(true)}
                className="press w-7 h-7 rounded-full bg-input-background flex items-center justify-center text-muted-foreground shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {home && !home.resume_attempt && !home.daily_challenge && home.weak_topics.length === 0 && (
            <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-2 enter-2">
              <p className="text-[15px] font-bold text-foreground">{t('home.placeholderTitle')}</p>
              <p className="text-[13px] text-muted-foreground leading-relaxed">{t('home.placeholderBody')}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
