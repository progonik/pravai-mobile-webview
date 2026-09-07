import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
  useState,
  type ReactNode,
} from 'react'
import type { AxiosError } from 'axios'
import {
  getMe as apiGetMe,
  logout as apiLogout,
  register as apiRegister,
  sendOtp as apiSendOtp,
  updateAppLanguage as apiUpdateAppLanguage,
  updateFullName as apiUpdateFullName,
  uploadAvatar as apiUploadAvatar,
  verifyOtp as apiVerifyOtp,
  UserNotFoundError,
} from '../api/authService'
import { resetQueryCache } from '../api/queryClient'
import { setUnauthorizedHandler } from '../api/unauthorizedHandler'
import { getActiveLang } from '../i18n/activeLang'
import {
  subscribeToNotifications,
  unsubscribeFromNotifications,
} from '../lib/nativeBridge'
import {
  clearSession,
  loadSession,
  persistSession,
  toUserProfile,
  toUserProfileFromMe,
  type AuthSession,
} from '../auth/session'
import type { Lang, UserProfile } from '../types'

/** Axios's own text for any non-2xx response — never fit to show a user. */
const AXIOS_STATUS_MESSAGE = /^request failed with status code \d+$/i

/** The shape the backend returns alongside a 4xx/5xx: {"error": "...", "code": "..."}.
 *  `error` is already localized server-side (send/verify/register pass
 *  `?lang=` for exactly this reason) -- no client-side translation needed. */
interface ApiErrorBody {
  error?: string
  code?: string
}

/** Only reached when there's no response body at all (a genuine network
 *  failure) -- the one auth-error string this app still translates itself,
 *  since the backend never got a chance to. */
const NETWORK_ERROR_FALLBACK: Record<Lang, string> = {
  uz: "Nimadir xato ketdi. Qaytadan urinib ko'ring.",
  ru: 'Что-то пошло не так. Попробуйте снова.',
  en: 'Something went wrong. Please try again.',
}

function getAuthErrorMessage(error: unknown): string {
  const raw = (error as AxiosError<ApiErrorBody> | null)?.response?.data?.error
    ?? (error instanceof Error && !AXIOS_STATUS_MESSAGE.test(error.message) ? error.message : undefined)

  if (typeof raw === 'string' && raw.trim()) return raw
  return NETWORK_ERROR_FALLBACK[getActiveLang()]
}

/** verifyOtp's result: either the session was persisted (a login), or the
 *  phone isn't registered yet and the caller should move to the register
 *  step with the ticket in hand. */
export type VerifyOtpOutcome =
  | { status: 'ok' }
  | { status: 'user_not_found'; registrationTicket: string }

interface AuthContextValue {
  session: AuthSession | null
  profile: UserProfile | null
  isAuthorized: boolean
  /** Step 1: request an OTP. */
  sendOtp: (phone: string) => Promise<void>
  /** Step 2: verify the OTP -- persists the session on success, or reports
   *  back that this phone needs to go through registration instead. */
  verifyOtp: (phone: string, code: string) => Promise<VerifyOtpOutcome>
  /** Step 3 (only for a phone verifyOtp didn't recognize): create the
   *  account using the ticket verifyOtp's outcome carried, then persist the
   *  session exactly like a normal login. */
  register: (phone: string, registrationTicket: string, fullName: string, dateOfBirth: string) => Promise<void>
  /** Upload a new avatar; merges the result into the persisted session. */
  uploadAvatar: (file: File) => Promise<void>
  updateFullName: (fullName: string) => Promise<void>
  updateAppLanguage: (lang: Lang) => Promise<void>
  logout: () => void
  /**
   * True from the moment a session is created until the welcome screen has
   * been shown. Lives here rather than in LoginPage because persisting the
   * session unmounts that page immediately.
   */
  justSignedIn: boolean
  clearJustSignedIn: () => void
  authError: string
  clearAuthError: () => void
  isSubmitting: boolean
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  profile: null,
  isAuthorized: false,
  sendOtp: async () => {},
  verifyOtp: async () => ({ status: 'ok' }),
  register: async () => {},
  uploadAvatar: async () => {},
  updateFullName: async () => {},
  updateAppLanguage: async () => {},
  logout: () => {},
  justSignedIn: false,
  clearJustSignedIn: () => {},
  authError: '',
  clearAuthError: () => {},
  isSubmitting: false,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => loadSession())
  const [authError, setAuthError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  // Set only by a fresh sign-in, never by a restored session: relaunching the
  // app should not replay the welcome.
  const [justSignedIn, setJustSignedIn] = useState(false)
  const clearJustSignedIn = useCallback(() => setJustSignedIn(false), [])

  const isAuthorized = Boolean(session?.token)

  // Hydrate the fuller profile (avatar, app_language) once per session load --
  // verify-OTP's response only carries id/phone/full_name.
  useEffect(() => {
    if (!session?.token) return
    let cancelled = false
    void apiGetMe().then((me) => {
      if (cancelled) return
      setSession((prev) => (prev ? persistSession({ access_token: prev.token, refresh_token: prev.refreshToken ?? '' }, toUserProfileFromMe(me)) : prev))
    }).catch(() => {})
    return () => { cancelled = true }
  }, [session?.token])

  // The id the native shell was last subscribed for. Held in a ref so both
  // logout paths can still unsubscribe once the session state is gone.
  const notifiedUserIdRef = useRef<string | null>(null)

  const stopNotifications = () => {
    const userId = notifiedUserIdRef.current
    if (userId) void unsubscribeFromNotifications(userId)
  }

  const userId = session?.user?.id || null
  useEffect(() => {
    notifiedUserIdRef.current = userId
    if (userId) void subscribeToNotifications(userId)
    // No cleanup: unmounting means the webview is going away, not a sign-out.
  }, [userId])

  // Every cached response belongs to whoever was signed in when it was
  // fetched, so the cache is emptied whenever the signed-in user changes: on
  // sign-out, on a forced logout after a 401, and on signing into another
  // account. Runs as an effect (not inside `logout`) so it lands after the
  // render that unmounted the authenticated screens.
  const cachedUserIdRef = useRef(userId)
  useEffect(() => {
    if (cachedUserIdRef.current === userId) return
    cachedUserIdRef.current = userId
    resetQueryCache()
  }, [userId])

  const run = async <T,>(fn: () => Promise<T>): Promise<T> => {
    setAuthError('')
    setIsSubmitting(true)
    try {
      return await fn()
    } catch (err: unknown) {
      setAuthError(getAuthErrorMessage(err))
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }

  const sendOtp = (phone: string) => run(() => apiSendOtp(phone))

  // A phone verifyOtp doesn't recognize is an expected branch, not a failure
  // -- caught here (inside the fn `run` wraps) rather than left to propagate,
  // so `run` never sets authError or rethrows for it; the caller reads the
  // outcome instead and decides whether to show an error or move to
  // registration.
  const verifyOtp = (phone: string, code: string): Promise<VerifyOtpOutcome> =>
    run(async () => {
      try {
        const result = await apiVerifyOtp(phone, code)
        const user = toUserProfile(result.user)
        setSession(persistSession(result, user))
        window.dispatchEvent(new Event('pravai-authenticated'))
        setJustSignedIn(true)
        return { status: 'ok' } as const
      } catch (err) {
        if (err instanceof UserNotFoundError) {
          return { status: 'user_not_found', registrationTicket: err.registrationTicket } as const
        }
        throw err
      }
    })

  const register = (phone: string, registrationTicket: string, fullName: string, dateOfBirth: string) =>
    run(async () => {
      const result = await apiRegister(phone, registrationTicket, fullName, dateOfBirth)
      const user = toUserProfile(result.user)
      setSession(persistSession(result, user))
      window.dispatchEvent(new Event('pravai-authenticated'))
      setJustSignedIn(true)
    })

  const uploadAvatar = (file: File) =>
    run(async () => {
      const me = await apiUploadAvatar(file)
      setSession((prev) => (prev ? persistSession({ access_token: prev.token, refresh_token: prev.refreshToken ?? '' }, toUserProfileFromMe(me)) : prev))
    })

  const updateFullName = (fullName: string) =>
    run(async () => {
      const me = await apiUpdateFullName(fullName)
      setSession((prev) => (prev ? persistSession({ access_token: prev.token, refresh_token: prev.refreshToken ?? '' }, toUserProfileFromMe(me)) : prev))
    })

  const updateAppLanguage = (lang: Lang) =>
    run(async () => {
      await apiUpdateAppLanguage(lang)
      setSession((prev) => (prev ? { ...prev, user: { ...prev.user, appLanguage: lang } } : prev))
    })

  const logout = () => {
    // Before the session is dropped — afterwards there is no id left to send.
    stopNotifications()
    const refreshToken = session?.refreshToken
    clearSession()
    setSession(null)
    setAuthError('')
    // Best-effort: the session is already gone client-side regardless of
    // whether the server-side revoke call succeeds.
    if (refreshToken) void apiLogout(refreshToken).catch(() => {})
  }

  // Let the authenticated request layer force a logout on any 401.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      stopNotifications()
      setSession(null)
      setAuthError('')
    })
    return () => setUnauthorizedHandler(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        session,
        profile: session?.user ?? null,
        isAuthorized,
        sendOtp,
        verifyOtp,
        register,
        uploadAvatar,
        updateFullName,
        updateAppLanguage,
        logout,
        justSignedIn,
        clearJustSignedIn,
        authError,
        clearAuthError: () => setAuthError(''),
        isSubmitting,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}
