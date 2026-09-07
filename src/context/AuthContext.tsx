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
  sendOtp as apiSendOtp,
  updateAppLanguage as apiUpdateAppLanguage,
  updateFullName as apiUpdateFullName,
  uploadAvatar as apiUploadAvatar,
  verifyOtp as apiVerifyOtp,
} from '../api/authService'
import { resetQueryCache } from '../api/queryClient'
import { setUnauthorizedHandler } from '../api/unauthorizedHandler'
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

/** Backend phrasing → what the user should actually read. */
const FRIENDLY_MESSAGES: { match: RegExp; message: string }[] = [
  { match: /otp not found or expired/i, message: 'That code is incorrect or has expired. Request a new one.' },
  { match: /invalid otp code/i, message: 'That code is incorrect. Please check it and try again.' },
  { match: /too many attempts/i, message: 'Too many attempts. Request a new code.' },
  { match: /please wait before requesting/i, message: 'Please wait a moment before requesting another code.' },
  { match: /invalid phone number/i, message: 'Please enter a valid phone number.' },
  { match: /user is inactive/i, message: 'This account has been deactivated.' },
]

/** The shape the backend returns alongside a 4xx/5xx: {"error": "..."}. */
interface ApiErrorBody {
  error?: string
}

function getAuthErrorMessage(error: unknown): string {
  const raw = (error as AxiosError<ApiErrorBody> | null)?.response?.data?.error
    ?? (error instanceof Error && !AXIOS_STATUS_MESSAGE.test(error.message) ? error.message : undefined)

  if (typeof raw === 'string' && raw.trim()) {
    const friendly = FRIENDLY_MESSAGES.find((f) => f.match.test(raw))
    if (friendly) return friendly.message
    return raw
  }
  return 'Something went wrong. Please try again.'
}

interface AuthContextValue {
  session: AuthSession | null
  profile: UserProfile | null
  isAuthorized: boolean
  /** Step 1: request an OTP. */
  sendOtp: (phone: string) => Promise<void>
  /** Step 2: verify the OTP -- persists the session on success (login or fresh registration alike). */
  verifyOtp: (phone: string, code: string) => Promise<void>
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
  verifyOtp: async () => {},
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

  const verifyOtp = (phone: string, code: string) =>
    run(async () => {
      const result = await apiVerifyOtp(phone, code)
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
