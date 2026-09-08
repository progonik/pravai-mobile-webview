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
