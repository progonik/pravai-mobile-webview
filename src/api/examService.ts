import request from './request'

/**
 * Test-content listing. `GET /exam/templates` is the mobile-facing
 * counterpart to the admin panel's template list -- same shape, minus
 * anything a test-taker shouldn't see (no answer-key data). Title/topic_name
 * come back as a single already-resolved string (the endpoint uses the
 * caller's own saved app_language, not a ?lang= filter), unlike the admin
 * panel's trilingual object shape.
 *
 *   GET /exam/templates → TemplateSummary[]
 */
export interface TemplateSummary {
  id: string
  title: string
  /** A question_types.code value -- an open, admin-managed set (backend
   *  migration 000025), not a fixed two/three-way choice. "exam" is the
   *  one value the backend treats specially (mistake-limit scoring); every
   *  other mode groups and displays the same way, driven by mode_name. */
  mode: string
  /** Mode's display name, already resolved server-side -- group/label by
   *  this, never by hardcoding text per mode value. */
  mode_name: string
  topic_id: string | null
  topic_name: string | null
  license_category_id: string
  license_category_code: string
  is_official_ticket: boolean
  time_limit_seconds: number | null
  questions_per_attempt: number
  available_question_count: number
  created_at: string
}

export async function listTemplates(): Promise<TemplateSummary[]> {
  return request.get('/api/v1/exam/templates')
}

/** A test-type category (question_types row) -- the full set that exists,
 *  independent of whether any template currently uses one. The Tests tab
 *  lists all of these first, then drills into whichever templates match a
 *  chosen type's `code`, so a brand-new type an admin just added is visible
 *  immediately even before a template is created for it. */
export interface QuestionType {
  id: string
  code: string
  name: string
}

export async function listQuestionTypes(): Promise<QuestionType[]> {
  return request.get('/api/v1/exam/question-types')
}

// ─── Attempt-taking ─────────────────────────────────────────────────────────
//
//   POST /exam/attempts             { template_id }                     → StartAttemptResult
//   POST /exam/attempts/{id}/answer { question_id, option_id }          → SubmitAnswerResult
//
// Starting an attempt is idempotent per (user, template): calling it again
// for a template with an already-in-progress attempt resumes it (same
// attempt id, wherever the user left off) instead of creating a duplicate --
// QuizPage relies on this to "just start" on mount without tracking whether
// an attempt already exists. All of an attempt's non-mistake-penalty
// questions are drawn and frozen at start time; `attempt.total_planned` can
// still grow at runtime in exam mode (+5 per mistake, up to 2 mistakes
// before a 3rd fails the attempt) -- always read the *current* response's
// `attempt`, never the static template.questions_per_attempt, once an
// attempt is underway.

export interface AttemptState {
  id: string
  /** Mirrors TemplateSummary.mode -- "exam" is the one value with real
   *  pass/fail + mistake-limit scoring; everything else behaves like an
   *  ungraded practice set (see the backend's Attempt.SubmitAnswer). */
  mode: string
  status: 'in_progress' | 'completed' | 'abandoned'
  total_planned: number
  answered_count: number
  correct_count: number
  mistake_count: number
  extra_questions_used: number
  /** Only ever set (non-null) for mode "exam", and only once finished. */
  passed: boolean | null
}

export interface QuizOption {
  id: string
  body: string
}

export interface QuizQuestion {
  id: string
  image_urls: string[]
  body: string
  options: QuizOption[]
}

export interface StartAttemptResult {
  attempt: AttemptState
  /** Null only if the template's question pool is empty -- see
   *  ErrTemplateEmpty, surfaced as a 409 the caller should treat as "no
   *  questions available yet", not a generic failure. */
  question: QuizQuestion | null
}

export interface SubmitAnswerResult {
  is_correct: boolean
  correct_option_id: string
  explanation: string
  attempt: AttemptState
  /** Null once the attempt is finished -- the one signal that the quiz
   *  loop should stop and hand off to the result screen. */
  next_question: QuizQuestion | null
}

export async function startAttempt(templateId: string): Promise<StartAttemptResult> {
  return request.post('/api/v1/exam/attempts', { template_id: templateId })
}

export async function submitAnswer(
  attemptId: string,
  questionId: string,
  optionId: string | null,
): Promise<SubmitAnswerResult> {
  return request.post(`/api/v1/exam/attempts/${attemptId}/answer`, {
    question_id: questionId,
    option_id: optionId,
  })
}

// ─── Home ───────────────────────────────────────────────────────────────────
//
//   GET /exam/home → HomeSummary
//
// One round trip for everything the Home tab shows. resume_attempt/
// daily_challenge/readiness are null when there's nothing to show yet (no
// in-progress attempt, no daily challenge scheduled today, no active
// question bank to compute coverage against); weak_topics is simply []
// until the user has answered something -- render that section's empty
// state, not a zero-filled placeholder.

export interface ResumeAttempt {
  id: string
  template_id: string
  template_title: string
  mode: string
  answered_count: number
}

export interface WeakTopic {
  topic_id: string
  topic_name: string
  answered_count: number
  mistake_count: number
}

/** readiness is a coverage score -- distinct questions ever answered out
 *  of the whole active bank -- not a rolling accuracy score. Being ready
 *  for the exam is more about having seen the material than one
 *  session's hit rate. */
export interface Readiness {
  percent: number
  answered_count: number
  total_count: number
}

export interface HomeSummary {
  resume_attempt: ResumeAttempt | null
  daily_challenge: TemplateSummary | null
  weak_topics: WeakTopic[]
  readiness: Readiness | null
}

export async function getHomeSummary(): Promise<HomeSummary> {
  return request.get('/api/v1/exam/home')
}
