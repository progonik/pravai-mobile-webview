/**
 * Every localStorage key the app owns, in one place.
 *
 * The split below is the point of this module: everything persisted here
 * belongs to the signed-in account, and all of it has to disappear together
 * when that account goes away. Leaving one key behind is how the next person
 * to sign in ends up looking at someone else's session.
 */
export const STORAGE_KEYS = {
  /** The persisted session envelope (token + user). */
  session: 'pravai-auth',
  accessToken: 'pravai_access_token',
  refreshToken: 'pravai_refresh_token',
  /** Per-device id sent on OTP verify/refresh so the backend can track sessions. */
  deviceId: 'pravai_device_id',
  /** Device preferences — survive sign-out on purpose. */
  theme: 'pravai-theme',
} as const

/** Keys tied to the signed-in account. Everything else is device-level. */
const USER_SCOPED_KEYS: string[] = [
  STORAGE_KEYS.session,
  STORAGE_KEYS.accessToken,
  STORAGE_KEYS.refreshToken,
]

/**
 * Wipe everything belonging to the current account. Called on sign-out and on
 * a forced logout after a 401 — device-level prefs (deviceId, theme) stay.
 */
export const clearUserScopedStorage = (): void => {
  for (const key of USER_SCOPED_KEYS) {
    try {
      localStorage.removeItem(key)
    } catch {
      // Private mode: nothing was stored, so nothing needs removing.
    }
  }
}
