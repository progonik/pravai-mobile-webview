import type { Lang } from './languages'

/**
 * The active language, readable outside React.
 *
 * The gateway stores content per language (`name_en` / `name_ru` / `name_uz`,
 * `content_*`, `title_*`), and the service layer that picks between those fields
 * is plain modules with no access to context. `LocaleProvider` mirrors its state
 * here so those helpers can follow the user's choice.
 */
let current: Lang = 'uz'

export const setActiveLang = (lang: Lang): void => {
  current = lang
}

export const getActiveLang = (): Lang => current

/**
 * Pick the field matching the active language, falling back through the others —
 * a record with only an English name should still render for a Russian user.
 */
export const pickLocalized = (byLang: {
  en?: string | null
  ru?: string | null
  uz?: string | null
}): string => {
  const order: Lang[] = current === 'en' ? ['en', 'ru', 'uz'] : current === 'ru' ? ['ru', 'en', 'uz'] : ['uz', 'ru', 'en']
  for (const lang of order) {
    const value = byLang[lang]
    if (value) return value
  }
  return ''
}
