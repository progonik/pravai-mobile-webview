import { API_BASE_URL } from './config'
import { getDeviceId } from '../lib/deviceId'
import {
  AUTH_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  updateSessionTokens,
  type TokenPair,
} from '../auth/session'

let refreshInFlight: Promise<string | null> | null = null

/**
 * Refresh tokens are single-use: the moment one is redeemed, the server
 * replaces it and the old value is dead. If this device is open in two
 * tabs/contexts, both can have an expired access token at once, both read
 * the *same* refresh token before either has rotated it, and one of them
 * necessarily loses the server-side race (see the backend's RotateSession
 * compare-and-swap). Without this check, the loser would call
 * handleUnauthorized() and wipe localStorage -- destroying the winner's
 * just-written, perfectly valid session along with it. Polling briefly
 * for localStorage to change gives the winner's write (a few ms away, not
 * seconds) time to land before this context gives up and forces a logout
 * that shouldn't happen.
 */
async function waitForRotatedToken(staleToken: string): Promise<boolean> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const current = localStorage.getItem(REFRESH_TOKEN_KEY)
    if (current && current !== staleToken) return true
    await new Promise((resolve) => setTimeout(resolve, 150))
  }
  return false
}

async function performRefresh(): Promise<string | null> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
  if (!refreshToken) return null

  const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken, device_id: getDeviceId() }),
  })
  if (!response.ok) {
    // Only a genuine failure (this token was rejected and nothing else
    // rotated it out from under us) should bubble up as null and trigger a
    // logout -- see waitForRotatedToken's comment.
    if (await waitForRotatedToken(refreshToken)) {
      return localStorage.getItem(AUTH_TOKEN_KEY)
    }
    return null
  }

  const body: unknown = await response.json().catch(() => null)
  if (
    !body ||
    typeof body !== 'object' ||
    typeof (body as Partial<TokenPair>).access_token !== 'string' ||
    typeof (body as Partial<TokenPair>).refresh_token !== 'string'
  ) {
    return null
  }

  return updateSessionTokens(body as TokenPair)
}

/** Single-flights concurrent 401s into one refresh call. */
export function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = performRefresh().finally(() => {
      refreshInFlight = null
    })
  }
  return refreshInFlight
}
