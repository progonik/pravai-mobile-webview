import { STORAGE_KEYS } from './storage'

/**
 * A stable per-device id the backend requires on OTP verify and token
 * refresh (it scopes sessions per device, letting a user stay signed in on
 * several phones/tablets independently). Generated once and persisted
 * outside the user-scoped keys — it must survive sign-out, since the same
 * device signing in again should still look like the same device.
 */
export function getDeviceId(): string {
  let id = localStorage.getItem(STORAGE_KEYS.deviceId)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(STORAGE_KEYS.deviceId, id)
  }
  return id
}
