// ─── Domain models ────────────────────────────────────────────────────────
// These types are the API contract for the backend. Every service in
// `src/api/*` documents the endpoint it expects and the shape it returns.

export type Lang = 'uz' | 'en' | 'ru'

export interface UserProfile {
  id: string
  phone: string
  fullName: string | null
  /** "YYYY-MM-DD", or null for an account created before this field existed. */
  dateOfBirth: string | null
  avatarUrl: string | null
  appLanguage: Lang
}
