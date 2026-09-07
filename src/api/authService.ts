import type { AxiosError } from 'axios'
import request from './request'
import { getDeviceId } from '../lib/deviceId'
import { getActiveLang } from '../i18n/activeLang'
import type { Lang } from '../types'
import type { MeResponse, TokenPair, UserNotFoundBody, VerifyOtpResult } from '../auth/session'

/**
 * Auth flow (phone → OTP → session, with a separate registration step for a
 * phone the backend doesn't recognize). Verify no longer creates an account
 * itself: a phone with no existing user gets a 404 (code "user_not_found")
 * carrying a short-lived registration_ticket, which Register consumes in
 * place of a re-entered OTP.
 *
 *   POST /auth/otp/send    { phone }                                     → { message }
 *   POST /auth/otp/verify  { phone, code, device_id }                    → VerifyOtpResult
 *                                                                          | 404 UserNotFoundBody
 *   POST /auth/register    { phone, registration_ticket, device_id,
 *                            full_name, date_of_birth }                   → VerifyOtpResult
 *   POST /auth/refresh     { refresh_token, device_id }                   → TokenPair
 *   POST /auth/logout      { refresh_token }                              → { message }
 *   GET  /users/me                                                        → MeResponse
 *   PATCH /users/me        { full_name }                                  → MeResponse
 *   PATCH /users/me/language { language }                                 → 204
 *
 * send/verify/register happen before there's any saved app_language for the
 * backend to localize error messages against, so each one passes the UI's
 * current language explicitly via ?lang= -- the backend defaults to Uz
 * otherwise.
 */

/** Thrown by verifyOtp instead of a plain AxiosError when the backend's
 *  answer is "this phone isn't registered yet" -- callers branch on this to
 *  route into the registration step instead of just showing an error. */
export class UserNotFoundError extends Error {
  registrationTicket: string
  constructor(message: string, registrationTicket: string) {
    super(message)
    this.name = 'UserNotFoundError'
    this.registrationTicket = registrationTicket
  }
}

export async function sendOtp(phone: string): Promise<void> {
  await request.post('/api/v1/auth/otp/send', { phone }, { params: { lang: getActiveLang() } })
}

export async function verifyOtp(phone: string, code: string): Promise<VerifyOtpResult> {
  try {
    return await request.post(
      '/api/v1/auth/otp/verify',
      { phone, code, device_id: getDeviceId() },
      { params: { lang: getActiveLang() } },
    )
  } catch (err) {
    const body = (err as AxiosError<UserNotFoundBody>)?.response?.data
    if (body?.code === 'user_not_found' && body.registration_ticket) {
      throw new UserNotFoundError(body.error, body.registration_ticket)
    }
    throw err
  }
}

export async function register(
  phone: string,
  registrationTicket: string,
  fullName: string,
  dateOfBirth: string,
): Promise<VerifyOtpResult> {
  return request.post(
    '/api/v1/auth/register',
    {
      phone,
      registration_ticket: registrationTicket,
      device_id: getDeviceId(),
      full_name: fullName,
      date_of_birth: dateOfBirth,
    },
    { params: { lang: getActiveLang() } },
  )
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
