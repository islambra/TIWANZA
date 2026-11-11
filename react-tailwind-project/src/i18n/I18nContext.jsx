import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { formatDA, formatDate, formatDateTime, formatNumber, formatTime } from '../lib/utils.js'
import { translations } from './translations.js'

const I18nContext = createContext(null)
const STORAGE_KEY = 'tiwanza_language'

function resolve(dictionary, key) {
  return key.split('.').reduce((value, part) => (value && value[part] !== undefined ? value[part] : undefined), dictionary)
}

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    if (typeof window === 'undefined') return 'fr'
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'ar' || stored === 'en') return stored
    return 'fr'
  })

  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
    try {
      window.localStorage.setItem(STORAGE_KEY, language)
    } catch (error) {
      console.warn('Tiwanza language preference could not be persisted.', error)
    }
  }, [language])

  const value = useMemo(() => {
    const dictionary = translations[language] || translations.fr
    const t = (key, vars) => {
      const raw = resolve(dictionary, key) ?? resolve(translations.fr, key) ?? key
      if (typeof raw !== 'string') return key
      if (!vars) return raw
      return raw.replace(/\{(\w+)\}/g, (match, name) => (vars[name] !== undefined ? String(vars[name]) : match))
    }
    return {
      language,
      dir: language === 'ar' ? 'rtl' : 'ltr',
      isRtl: language === 'ar',
setLanguage: (next) => {
    const normalized = next === 'ar' ? 'ar' : next === 'en' ? 'en' : 'fr'
    setLanguageState(normalized)
  },
  toggleLanguage: () => setLanguageState((current) => {
    if (current === 'ar') return 'en'
    if (current === 'en') return 'fr'
    return 'ar'
  }),
      t,
      money: (amount) => formatDA(amount, language),
      number: (value) => formatNumber(value, language),
      date: (input, options) => formatDate(input, language, options),
      dateTime: (input) => formatDateTime(input, language),
      time: (input) => formatTime(input, language),
    }
  }, [language])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useI18n must be used inside I18nProvider')
  return context
}
