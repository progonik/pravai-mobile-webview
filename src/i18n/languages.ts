/**
 * The supported languages.
 *
 * Kept out of LocaleContext deliberately: the context imports `setActiveLang`
 * from `activeLang.ts`, which needs this type — putting it here breaks that
 * cycle, and keeps the context file exporting only components and hooks.
 */
export type Lang = 'en' | 'ru' | 'uz'

export const LANGUAGES: { code: Lang; native: string; flag: string }[] = [
  { code: 'en', native: 'English', flag: '🇬🇧' },
  { code: 'ru', native: 'Русский', flag: '🇷🇺' },
  { code: 'uz', native: "O'zbekcha", flag: '🇺🇿' },
]

export const isLang = (value: unknown): value is Lang =>
  value === 'en' || value === 'ru' || value === 'uz'
