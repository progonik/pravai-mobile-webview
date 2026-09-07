import { getActiveLang } from '../i18n/activeLang'
import type { Lang } from '../i18n/languages'

/**
 * Month names per language, January first.
 *
 * Spelled out rather than taken from `Intl`: the ICU data shipped in the
 * webview has no Uzbek month names and falls back to the root locale, which
 * renders August as "M08". Russian and English are correct there, but a table
 * that is right for two languages out of three is not worth the branch.
 */
const MONTHS: Record<Lang, { long: string[]; short: string[] }> = {
  en: {
    long: ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'],
    short: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  },
  ru: {
    long: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
    short: ['янв.', 'февр.', 'мар.', 'апр.', 'мая', 'июн.',
      'июл.', 'авг.', 'сент.', 'окт.', 'нояб.', 'дек.'],
  },
  uz: {
    long: ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
      'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'],
    short: ['yan', 'fev', 'mar', 'apr', 'may', 'iyn',
      'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'],
  },
}

/** Month names in the active language. Read during render — the pickers
 *  re-render on a language change because `LocaleProvider` sits above them. */
export function monthNames(style: 'long' | 'short'): string[] {
  return MONTHS[getActiveLang()][style]
}

/**
 * Weekday initials for a calendar header, Monday first — the week as it is
 * counted here, not the Sunday-first order `Intl` gives for `en`. Spelled out
 * for the same reason the months are: the webview's ICU data has no Uzbek.
 */
const WEEKDAYS: Record<Lang, string[]> = {
  en: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
  ru: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
  uz: ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'],
}

/** Weekday initials in the active language, Monday first. */
export function weekdayNames(): string[] {
  return WEEKDAYS[getActiveLang()]
}
