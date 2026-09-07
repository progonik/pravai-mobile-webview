import { getActiveLang } from '../i18n/activeLang'
import { monthNames } from './months'

/**
 * Dates for display, in the active language.
 *
 * Hand-assembled rather than `Intl`-formatted for the reason given in
 * `months.ts` — the webview's ICU data renders Uzbek dates as "2026 M08 04".
 * Each language gets the order it actually uses: "Aug 04, 2026",
 * "04 авг. 2026", "4-avg, 2026".
 *
 * These are display only. Anything that sorts, groups or filters must work off
 * the ISO timestamp, never off a formatted string.
 */
export function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const month = monthNames('short')[d.getMonth()]
  const day = d.getDate()
  const year = d.getFullYear()
  switch (getActiveLang()) {
    case 'ru':
      return `${String(day).padStart(2, '0')} ${month} ${year}`
    case 'uz':
      return `${day}-${month}, ${year}`
    default:
      return `${month} ${String(day).padStart(2, '0')}, ${year}`
  }
}

/** As `formatDate`, with the clock time appended — "Aug 03, 2026 · 17:59". */
export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return `${formatDate(iso)} · ${time}`
}

/** "August 2026" — the heading a month's transactions are grouped under. */
export function formatMonthYear(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${monthNames('long')[d.getMonth()]} ${d.getFullYear()}`
}
