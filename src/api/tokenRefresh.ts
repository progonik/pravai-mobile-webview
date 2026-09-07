import { API_BASE_URL } from './config'
import { getDeviceId } from '../lib/deviceId'
import {
  REFRESH_TOKEN_KEY,
  updateSessionTokens,
  type TokenPair,
} from '../auth/session'

let refreshInFlight: Promise<string | null> | null = null

async function performRefresh(): Promise<string | null> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
  if (!refreshToken) return null

  const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken, device_id: getDeviceId() }),
  })
  if (!response.ok) return null

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
