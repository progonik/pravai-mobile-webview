// Uzbek phone helpers. National number is 9 digits after the +998 code,
// displayed as "90 123 45 67" (groups of 2-3-2-2).

export const UZ_CODE = '+998'

/** Keep at most 9 digits from arbitrary user input. */
export const sanitizeUzDigits = (input: string): string => input.replace(/\D/g, '').slice(0, 9)

/** Format 9 national digits as "90 123 45 67" (partial input is formatted too). */
export const formatUzPhone = (digits: string): string => {
  const d = sanitizeUzDigits(digits)
  const parts = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean)
  return parts.join(' ')
}

/** Build the E.164 number the backend expects, e.g. "+998901234567". */
export const toE164 = (digits: string): string => `${UZ_CODE}${sanitizeUzDigits(digits)}`

/**
 * An E.164 number as a human reads it back: "+998901234567" → "+998 90 123 45 67".
 * Used where we echo the number to the user (the OTP screen), where an
 * unbroken run of twelve digits is hard to check against their own phone.
 * Anything that is not a Uzbek E.164 number is returned untouched.
 */
export const formatE164 = (e164: string): string => {
  const digits = e164.replace(/\D/g, '')
  if (!digits.startsWith('998') || digits.length !== 12) return e164
  return `${UZ_CODE} ${formatUzPhone(digits.slice(3))}`
}

/**
 * Mobile operator codes issued in Uzbekistan. A nine-digit number starting with
 * anything else can't receive an SMS: the gateway hands it to the SMS provider,
 * which rejects it with a bare 400. Checking here keeps that round trip — and
 * its untranslatable error — off the screen. Extend when a new code is issued.
 */
const UZ_OPERATOR_CODES = [
  '20', '33', '50', '55', '77', '88', '90', '91', '93', '94', '95', '97', '98', '99',
]

/** True once all nine national digits are present, valid prefix or not. */
export const isCompleteUzPhone = (digits: string): boolean => sanitizeUzDigits(digits).length === 9

/** True when the number is complete *and* starts with a real operator code. */
export const isValidUzPhone = (digits: string): boolean => {
  const d = sanitizeUzDigits(digits)
  return d.length === 9 && UZ_OPERATOR_CODES.includes(d.slice(0, 2))
}

/** Convert a "DD.MM.YYYY" masked input to ISO "YYYY-MM-DD", or undefined if incomplete. */
export const dobToISO = (masked: string): string | undefined => {
  const m = masked.match(/^(\d{2})\.(\d{2})\.(\d{4})$/)
  if (!m) return undefined
  const [, dd, mm, yyyy] = m
  return `${yyyy}-${mm}-${dd}`
}
