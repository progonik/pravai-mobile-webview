import type { Lang, UserProfile } from '../types'
import { STORAGE_KEYS, clearUserScopedStorage } from '../lib/storage'

const PERSIST_KEY = STORAGE_KEYS.session
export const AUTH_TOKEN_KEY = STORAGE_KEYS.accessToken
export const REFRESH_TOKEN_KEY = STORAGE_KEYS.refreshToken

export interface AuthSession {
  isAuth: boolean
  token: string
  refreshToken: string | null
  user: UserProfile
}

// ─── Raw backend shapes ───────────────────────────────────────────────────

/** POST /api/v1/auth/otp/verify and POST /api/v1/auth/refresh both return
 *  a bare {access_token, refresh_token} pair (refresh omits `user`). */
export interface TokenPair {
  access_token: string
  refresh_token: string
}

/** The `user` object embedded in the verify-OTP/register response. */
export interface BackendUser {
  id: string
  phone: string
  full_name: string | null
  date_of_birth: string | null
}

export interface VerifyOtpResult extends TokenPair {
  user: BackendUser
  is_new_user: boolean
}

/** The 404 body POST /auth/otp/verify returns for a phone with no account --
 *  the registration_ticket is what POST /auth/register needs in place of a
 *  re-entered OTP. */
export interface UserNotFoundBody {
  error: string
  code: 'user_not_found'
  registration_ticket: string
}

/** GET /api/v1/users/me's full shape (a superset of BackendUser). */
export interface MeResponse {
  id: string
  phone: string
  full_name: string | null
  date_of_birth: string | null
  avatar_url: string | null
  app_language: Lang
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

/** Map a raw backend user (verify-OTP's minimal shape) into the app's UserProfile. */
export const toUserProfile = (u: BackendUser): UserProfile => ({
  id: u.id,
  phone: u.phone,
  fullName: u.full_name,
  dateOfBirth: u.date_of_birth,
  avatarUrl: null,
  appLanguage: 'uz',
})

/** Map GET /users/me's fuller shape into UserProfile. */
export const toUserProfileFromMe = (u: MeResponse): UserProfile => ({
  id: u.id,
  phone: u.phone,
  fullName: u.full_name,
  dateOfBirth: u.date_of_birth,
  avatarUrl: u.avatar_url,
  appLanguage: u.app_language,
})

export const persistSession = (token: TokenPair, user: UserProfile): AuthSession => {
  const session: AuthSession = {
    isAuth: true,
    token: token.access_token,
    refreshToken: token.refresh_token,
    user,
  }

  localStorage.setItem(PERSIST_KEY, JSON.stringify(session))
  localStorage.setItem(AUTH_TOKEN_KEY, token.access_token)
  localStorage.setItem(REFRESH_TOKEN_KEY, token.refresh_token)

  return session
}

/** Called after a silent refresh — updates the tokens, keeps the stored user. */
export const updateSessionTokens = (token: TokenPair): string | null => {
  if (!token.access_token) return null

  localStorage.setItem(AUTH_TOKEN_KEY, token.access_token)
  localStorage.setItem(REFRESH_TOKEN_KEY, token.refresh_token)

  const raw = localStorage.getItem(PERSIST_KEY)
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw)
      if (isRecord(parsed)) {
        const nextSession: AuthSession = {
          isAuth: true,
          token: token.access_token,
          refreshToken: token.refresh_token,
          user: isRecord(parsed.user) ? (parsed.user as unknown as UserProfile) : ({} as UserProfile),
        }
        localStorage.setItem(PERSIST_KEY, JSON.stringify(nextSession))
      }
    } catch {
      localStorage.removeItem(PERSIST_KEY)
    }
  }

  return token.access_token
}

export const loadSession = (): AuthSession | null => {
  const raw = localStorage.getItem(PERSIST_KEY)
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw)
      if (isRecord(parsed) && typeof parsed.token === 'string' && parsed.token.length > 0) {
        return {
          isAuth: true,
          token: parsed.token,
          refreshToken: typeof parsed.refreshToken === 'string' ? parsed.refreshToken : null,
          user: isRecord(parsed.user) ? (parsed.user as unknown as UserProfile) : ({} as UserProfile),
        }
      }
    } catch {
      localStorage.removeItem(PERSIST_KEY)
    }
  }
  return null
}

/** Drop the session and everything else the account owns on this device. */
export const clearSession = (): void => {
  clearUserScopedStorage()
}
