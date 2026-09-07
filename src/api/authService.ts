import request from './request'
import { getDeviceId } from '../lib/deviceId'
import type { Lang } from '../types'
import type { MeResponse, TokenPair, VerifyOtpResult } from '../auth/session'

/**
 * Auth flow (phone → OTP → session). PravAI's backend is OTP-only: there is
 * no separate register step and no profile-completion gate -- verifying the
 * code either logs an existing user in or silently creates one (indicated by
 * `is_new_user`), and either way the session is ready to persist immediately.
 *
 *   POST /auth/otp/send    { phone }                          → { message }
 *   POST /auth/otp/verify  { phone, code, device_id }         → VerifyOtpResult
 *   POST /auth/refresh     { refresh_token, device_id }        → TokenPair
 *   POST /auth/logout      { refresh_token }                   → { message }
 *   GET  /users/me                                             → MeResponse
 *   PATCH /users/me        { full_name }                       → MeResponse
 *   PATCH /users/me/language { language }                      → 204
 */

export async function sendOtp(phone: string): Promise<void> {
  await request.post('/api/v1/auth/otp/send', { phone })
}

export async function verifyOtp(phone: string, code: string): Promise<VerifyOtpResult> {
  return request.post('/api/v1/auth/otp/verify', {
    phone,
    code,
    device_id: getDeviceId(),
  })
}

export async function logout(refreshToken: string): Promise<void> {
  await request.post('/api/v1/auth/logout', { refresh_token: refreshToken })
}

export async function getMe(): Promise<MeResponse> {
  return request.get('/api/v1/users/me')
}

export async function updateFullName(fullName: string): Promise<MeResponse> {
  return request.patch('/api/v1/users/me', { full_name: fullName })
}

export async function updateAppLanguage(language: Lang): Promise<void> {
  await request.patch('/api/v1/users/me/language', { language })
}

/** POST /users/me/avatar, multipart field "avatar" -> the updated profile. */
export async function uploadAvatar(file: File): Promise<MeResponse> {
  const form = new FormData()
  form.append('avatar', file)
  // Content-Type (with multipart boundary) is set by the browser from FormData.
  return request.post('/api/v1/users/me/avatar', form)
}

export type { TokenPair }
