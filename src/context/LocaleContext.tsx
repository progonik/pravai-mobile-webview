import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { en, type TranslationKey } from '../i18n/en'
import { ru } from '../i18n/ru'
import { uz } from '../i18n/uz'
import { setActiveLang } from '../i18n/activeLang'
import { isLang, type Lang } from '../i18n/languages'
import { getMe, updateAppLanguage } from '../api/authService'
import { AUTH_TOKEN_KEY } from '../auth/session'

const DICTIONARIES: Record<Lang, Record<TranslationKey, string>> = { en, ru, uz }

/** Survives reloads — the webview reloads on every app launch. */
const LANG_KEY = 'pravai-lang'

const readStoredLang = (): Lang => {
  try {
    const stored = localStorage.getItem(LANG_KEY)
    if (isLang(stored)) return stored
    // Fall back to the device language when there is no explicit choice yet.
    const device = navigator.language.slice(0, 2)
    return isLang(device) ? device : 'uz'
  } catch {
    return 'uz'
  }
}

export type Translate = (key: TranslationKey, params?: Record<string, string | number>) => string

interface LocaleContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: Translate
}

const LocaleContext = createContext<LocaleContextValue>({
  lang: 'uz',
  setLang: () => {},
  t: (key) => uz[key],
})

/**
 * The active language and the string lookup for it.
 *
 * A missing translation falls back to Uzbek rather than rendering the key, so
 * a partially translated screen still reads correctly — which matters while
 * the dictionaries are being filled in. Uz is the fallback (not English) to
 * match the backend's own Translations.Resolve default.
 */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const initial = readStoredLang()
    // Mirror immediately, before any service call can read it.
    setActiveLang(initial)
    return initial
  })

  const queryClient = useQueryClient()

  const applyLang = useCallback((next: Lang) => {
    setLangState(next)
    setActiveLang(next)
    queryClient.invalidateQueries()
    try {
      localStorage.setItem(LANG_KEY, next)
    } catch {
      // Private mode or a full quota — the choice just won't survive a reload.
    }
    document.documentElement.lang = next
  }, [queryClient])

  useEffect(() => {
    const syncBackendLang = () => {
      if (!localStorage.getItem(AUTH_TOKEN_KEY)) return
      void getMe().then((me) => {
        if (isLang(me.app_language)) applyLang(me.app_language)
        else void updateAppLanguage(readStoredLang()).catch(() => {})
      }).catch(() => {})
    }
    syncBackendLang()
    window.addEventListener('pravai-authenticated', syncBackendLang)
    return () => window.removeEventListener('pravai-authenticated', syncBackendLang)
  }, [applyLang])

  const setLang = useCallback((next: Lang) => {
    applyLang(next)
    if (localStorage.getItem(AUTH_TOKEN_KEY)) {
      void updateAppLanguage(next).catch(() => {})
    }
  }, [applyLang])

  const t = useCallback<Translate>(
    (key, params) => {
      const template = DICTIONARIES[lang][key] || uz[key] || key
      if (!params) return template
      return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
        name in params ? String(params[name]) : whole,
      )
    },
    [lang],
  )

  return (
    <LocaleContext.Provider value={{ lang, setLang, t }}>{children}</LocaleContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLocale() {
  return useContext(LocaleContext)
}

/** Just the lookup, for components that don't need to change the language. */
// eslint-disable-next-line react-refresh/only-export-components
export function useT(): Translate {
  return useContext(LocaleContext).t
}
