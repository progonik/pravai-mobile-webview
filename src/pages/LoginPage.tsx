import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Calendar, Check, ChevronLeft, Phone, ShieldCheck, User, UserPlus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { LanguageSelector, LogoMark } from '../components/auth/AuthUI'
import { RegionDistrictPicker } from '../components/RegionDistrictPicker'
import { useT } from '../context/LocaleContext'
import {
  formatE164, formatUzPhone, isCompleteUzPhone, isValidUzPhone, sanitizeUzDigits, toE164, UZ_CODE,
} from '../utils/phone'

type Step = 'phone' | 'otp' | 'register'

const STEP_COUNT = 2

// ─── Shared chrome ────────────────────────────────────────────────────────────
function StepHeader({ step, onBack }: { step: number; onBack?: () => void }) {
  return (
    <div className="shrink-0">
      <div className="flex items-center justify-between px-5 pt-3 pb-4">
        {onBack ? (
          <button
            onClick={onBack}
            className="press w-9 h-9 rounded-xl bg-input-background flex items-center justify-center text-muted-foreground"
          >
            <ChevronLeft size={18} />
          </button>
        ) : (
          <LogoMark />
        )}
        <LanguageSelector />
      </div>
      {/* One segment per step, filled up to the current one. */}
      <div className="flex gap-1.5 px-5 pb-1">
        {Array.from({ length: STEP_COUNT }, (_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i <= step ? 'bg-primary' : 'bg-border'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Step 1: phone ────────────────────────────────────────────────────────────
function PhoneStep({ onNext }: { onNext: (e164: string) => void }) {
  const [digits, setDigits] = useState('')
  const { isSubmitting, authError, clearAuthError } = useAuth()
  const t = useT()
  const valid = isValidUzPhone(digits)
  const inputRef = useRef<HTMLInputElement>(null)

  // Only complain once all nine digits are in — nagging mid-typing is noise.
  const localError = isCompleteUzPhone(digits) && !valid ? t('auth.invalidPhone') : ''
  const error = localError || authError

  useEffect(() => { inputRef.current?.focus() }, [])

  const submit = () => { if (valid) onNext(toE164(digits)) }

  const handleChange = (value: string) => {
    // A previous attempt's error no longer describes what's in the field.
    if (authError) clearAuthError()
    setDigits(sanitizeUzDigits(value))
  }

  return (
    <div className="flex flex-col h-full">
      <StepHeader step={0} />

      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6 flex flex-col">
        {/* Auto margins centre this block, biased upward by the heavier bottom
            margin. Unlike `justify-center` they collapse when the keyboard
            leaves no room, so the heading is never clipped off the top. */}
        <div className="w-full my-auto pb-[16%] [@media(max-height:620px)]:pb-0">
        {/* The one warm gradient surface on this screen — same tile the
            wordmark uses, so sign-in is the first screen of the product itself. */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 enter-1"
          style={{ background: 'linear-gradient(135deg, #FFD873 0%, #FFC531 100%)', boxShadow: 'var(--shadow-brand)' }}
        >
          <Phone size={28} className="text-primary-foreground" />
        </div>

        <h1 className="font-display text-[26px] font-bold text-foreground leading-[1.15] tracking-tight enter-1">{t('auth.welcome')}</h1>
        <p className="text-[14px] text-muted-foreground mt-2.5 leading-relaxed enter-2">
          {t('auth.phoneIntro')}
        </p>

        <div className="mt-7 enter-3">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t('auth.phoneLabel')}</label>
          <div className={`mt-2 flex items-center gap-2.5 rounded-2xl bg-card px-3.5 py-4 border shadow-card transition-all ${
            error
              ? 'border-destructive ring-2 ring-destructive/15'
              : valid
                ? 'border-primary ring-2 ring-primary/15'
                : 'border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15'
          }`}>
            <span className="flex items-center gap-1.5 text-[15px] font-semibold text-foreground whitespace-nowrap">
              🇺🇿 {UZ_CODE}
            </span>
            <div className="w-px h-6 bg-border" />
            <input
              ref={inputRef}
              type="tel"
              inputMode="numeric"
              placeholder="90 123 45 67"
              value={formatUzPhone(digits)}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'phone-error' : undefined}
              className="flex-1 min-w-0 bg-transparent text-[16px] font-semibold text-foreground placeholder:text-muted-foreground/60 placeholder:font-normal outline-none tracking-wide"
            />
            {valid && <Check size={18} className="text-primary shrink-0" />}
          </div>
          {error && (
            <p id="phone-error" role="alert" className="text-[12px] text-destructive mt-2 ml-1">{error}</p>
          )}
        </div>
        </div>
      </div>

      <div className="px-6 pt-3 shrink-0" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 22px)' }}>
        <p className="text-[12px] text-muted-foreground text-center mb-3 leading-relaxed">
          {t('auth.agree')}
        </p>
        <button
          onClick={submit}
          disabled={!valid || isSubmitting}
          className="press w-full bg-primary text-primary-foreground rounded-full py-4 text-[15px] font-semibold shadow-brand flex items-center justify-center gap-2 disabled:opacity-40 disabled:shadow-none"
        >
          {isSubmitting ? t('auth.sending') : t('auth.sendCode')}
          {!isSubmitting && <ArrowRight size={18} />}
        </button>
      </div>
    </div>
  )
}

// ─── Step 2: OTP ──────────────────────────────────────────────────────────────
function OtpStep({ phone, onVerify, onBack, onResend }: {
  phone: string
  onVerify: (code: string) => void
  onBack: () => void
  onResend: () => void
}) {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const [seconds, setSeconds] = useState(59)
  const { isSubmitting, authError } = useAuth()
  const t = useT()
  const code = otp.join('')
  const complete = code.length === 6
  // Once the countdown runs out the code the backend issued is no longer valid,
  // so submitting it can only produce an error. Resending restarts the timer.
  const expired = seconds === 0

  useEffect(() => {
    refs.current[0]?.focus()
    const timer = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(timer)
  }, [])

  function setDigit(val: string, idx: number) {
    const digits = val.replace(/\D/g, '')
    if (!digits) {
      // Cleared the field.
      const next = [...otp]
      next[idx] = ''
      setOtp(next)
      return
    }
    // Distribute one or many digits (SMS autofill can drop the whole code in one box).
    const next = [...otp]
    let cursor = idx
    for (const d of digits) {
      if (cursor > 5) break
      next[cursor] = d
      cursor += 1
    }
    setOtp(next)
    refs.current[Math.min(cursor, 5)]?.focus()
  }

  function handleKey(e: React.KeyboardEvent, idx: number) {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) refs.current[idx - 1]?.focus()
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    const next = pasted.split('')
    setOtp([...next, ...Array(6 - next.length).fill('')])
    refs.current[Math.min(pasted.length, 5)]?.focus()
  }

  return (
    <div className="flex flex-col h-full">
      <StepHeader step={1} onBack={onBack} />

      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6 flex flex-col">
        {/* Auto margins rather than `justify-center`: they collapse when the
            keyboard shrinks the viewport, so nothing is clipped off the top. */}
        <div className="w-full my-auto pb-[16%] [@media(max-height:620px)]:pb-0">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
          style={{ background: 'linear-gradient(135deg, #FFD873 0%, #FFC531 100%)', boxShadow: 'var(--shadow-brand)' }}
        >
          <ShieldCheck size={28} className="text-primary-foreground" />
        </div>
        <h1 className="font-display text-[22px] font-bold text-foreground leading-tight tracking-tight">{t('auth.verifyTitle')}</h1>
        <p className="text-[14px] text-muted-foreground mt-2 leading-relaxed">
          {t('auth.verifyIntro', { phone: '' })}<span className="font-semibold text-foreground numeric">{formatE164(phone)}</span>
        </p>

        <div className="flex gap-2 justify-between mt-7 mb-4" onPaste={handlePaste}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { refs.current[i] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => setDigit(e.target.value, i)}
              onKeyDown={(e) => handleKey(e, i)}
              // A filled/focused slot takes a soft accent ring, like an
              // iOS text field rather than a poster-style hard-edged box.
              className={`glass w-full aspect-square max-w-[52px] text-center text-[22px] font-semibold rounded-2xl border outline-none numeric transition-all bg-card text-foreground ${
                digit ? 'border-primary ring-2 ring-primary/25' : 'border-edge'
              } focus:border-primary focus:ring-2 focus:ring-primary/25`}
            />
          ))}
        </div>

        {authError && <p className="text-[12px] text-destructive text-center mb-3">{authError}</p>}

        <div className="flex justify-center">
          {seconds > 0 ? (
            <p className="text-[13px] text-muted-foreground">
              {t('auth.resendIn', { time: '' })}<span className="text-primary font-semibold">0:{String(seconds).padStart(2, '0')}</span>
            </p>
          ) : (
            <button onClick={() => { onResend(); setSeconds(59) }} className="press text-[13px] text-primary font-semibold">
              {t('auth.resend')}
            </button>
          )}
        </div>
        </div>
      </div>

      <div className="px-6 pt-3 shrink-0" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 22px)' }}>
        <button
          onClick={() => onVerify(code)}
          disabled={!complete || isSubmitting || expired}
          className="press w-full bg-primary text-primary-foreground rounded-full py-4 text-[15px] font-semibold shadow-brand flex items-center justify-center gap-2 disabled:opacity-40 disabled:shadow-none"
        >
          {isSubmitting ? t('auth.verifying') : expired ? t('auth.codeExpired') : t('auth.verify')}
          {!isSubmitting && !expired && <ArrowRight size={18} />}
        </button>
      </div>
    </div>
  )
}

// ─── Step 3: register (only for a phone verifyOtp didn't recognize) ───────────
// Bounds mirror the backend's own check (identity.ValidateDateOfBirth):
// not in the future, not more than 120 years ago. Enforced here too via the
// date input's min/max so the picker itself won't offer an invalid value.
const DOB_MAX = new Date().toISOString().slice(0, 10)
const DOB_MIN = new Date(Date.now() - 120 * 365.25 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

function RegisterStep({ phone, onRegister, onBack }: {
  phone: string
  onRegister: (fullName: string, dateOfBirth: string, regionId: string, districtId: string) => void
  onBack: () => void
}) {
  const [fullName, setFullName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  // Optional -- not part of `valid`, registration doesn't block on these.
  const [regionId, setRegionId] = useState('')
  const [districtId, setDistrictId] = useState('')
  const { isSubmitting, authError, clearAuthError } = useAuth()
  const t = useT()
  const valid = fullName.trim().length > 0 && dateOfBirth.length > 0

  const submit = () => { if (valid) onRegister(fullName.trim(), dateOfBirth, regionId, districtId) }

  return (
    <div className="flex flex-col h-full">
      <StepHeader step={1} onBack={onBack} />

      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6 flex flex-col">
        <div className="w-full my-auto pb-[16%] [@media(max-height:620px)]:pb-0">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
          style={{ background: 'linear-gradient(135deg, #FFD873 0%, #FFC531 100%)', boxShadow: 'var(--shadow-brand)' }}
        >
          <UserPlus size={28} className="text-primary-foreground" />
        </div>
        <h1 className="font-display text-[22px] font-bold text-foreground leading-tight tracking-tight">{t('auth.registerTitle')}</h1>
        <p className="text-[14px] text-muted-foreground mt-2 leading-relaxed">
          {t('auth.registerIntro')}<span className="font-semibold text-foreground numeric">{formatE164(phone)}</span>
        </p>

        <div className="mt-6">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t('field.fullName')}</label>
          <div className="mt-2 flex items-center gap-2.5 rounded-2xl bg-card px-3.5 py-3.5 border border-border shadow-card focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 transition-all">
            <User size={17} className="text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder={t('field.fullNamePlaceholder')}
              value={fullName}
              onChange={(e) => { setFullName(e.target.value); if (authError) clearAuthError() }}
              className="flex-1 min-w-0 bg-transparent text-[15px] font-medium text-foreground placeholder:text-muted-foreground/60 placeholder:font-normal outline-none"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t('field.dateOfBirth')}</label>
          <div className="mt-2 flex items-center gap-2.5 rounded-2xl bg-card px-3.5 py-3.5 border border-border shadow-card focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 transition-all">
            <Calendar size={17} className="text-muted-foreground shrink-0" />
            <input
              type="date"
              min={DOB_MIN}
              max={DOB_MAX}
              value={dateOfBirth}
              onChange={(e) => { setDateOfBirth(e.target.value); if (authError) clearAuthError() }}
              className="flex-1 min-w-0 bg-transparent text-[15px] font-medium text-foreground outline-none"
            />
          </div>
        </div>

        <RegionDistrictPicker
          regionId={regionId}
          districtId={districtId}
          onChange={(r, d) => { setRegionId(r); setDistrictId(d); if (authError) clearAuthError() }}
        />

        {authError && <p className="text-[12px] text-destructive mt-3">{authError}</p>}
        </div>
      </div>

      <div className="px-6 pt-3 shrink-0" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 22px)' }}>
        <button
          onClick={submit}
          disabled={!valid || isSubmitting}
          className="press w-full bg-primary text-primary-foreground rounded-full py-4 text-[15px] font-semibold shadow-brand flex items-center justify-center gap-2 disabled:opacity-40 disabled:shadow-none"
        >
          {isSubmitting ? t('auth.creatingAccount') : t('auth.createAccount')}
          {!isSubmitting && <ArrowRight size={18} />}
        </button>
      </div>
    </div>
  )
}

// ─── Login flow ───────────────────────────────────────────────────────────────
export function LoginPage() {
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [registrationTicket, setRegistrationTicket] = useState('')
  const { sendOtp, verifyOtp, register } = useAuth()

  const handleSendCode = async (e164: string) => {
    setPhone(e164)
    try {
      await sendOtp(e164)
      setStep('otp')
    } catch { /* surfaced via authError */ }
  }

  const handleVerify = async (code: string) => {
    try {
      const outcome = await verifyOtp(phone, code)
      if (outcome.status === 'user_not_found') {
        setRegistrationTicket(outcome.registrationTicket)
        setStep('register')
        return
      }
      // status === 'ok': the session is persisted → AuthGate redirects to /home.
    } catch { /* surfaced via authError */ }
  }

  const handleRegister = async (fullName: string, dateOfBirth: string, regionId: string, districtId: string) => {
    try {
      await register(phone, registrationTicket, fullName, dateOfBirth, regionId, districtId)
      // On success the session is persisted → AuthGate redirects to /home.
    } catch { /* surfaced via authError */ }
  }

  // Render only the active step — a fresh mount (keyed) gives a light slide-in
  // and avoids the horizontal-overflow issues of a full-width sliding strip.
  return (
    // Same status-bar inset as AppShell — login renders outside it.
    <div
      className="h-app bg-background overflow-hidden relative"
      style={{ paddingTop: 'var(--safe-top)' }}
    >
      {/* The same ambient surface the signed-in app uses, so sign-in is the
          first screen of the product rather than a plain form in front of it. */}
      <div className="bg-decor" aria-hidden="true" />

      <div key={step} className="relative h-full animate-fade-in-up">
        {step === 'phone' && <PhoneStep onNext={handleSendCode} />}
        {step === 'otp' && (
          <OtpStep
            phone={phone}
            onVerify={handleVerify}
            onBack={() => setStep('phone')}
            onResend={() => sendOtp(phone).catch(() => {})}
          />
        )}
        {step === 'register' && (
          <RegisterStep
            phone={phone}
            onRegister={handleRegister}
            onBack={() => setStep('otp')}
          />
        )}
      </div>
    </div>
  )
}
