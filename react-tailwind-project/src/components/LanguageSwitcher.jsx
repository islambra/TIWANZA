import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Languages } from 'lucide-react'
import { useI18n } from '../i18n/I18nContext.jsx'
import { Badge, Button } from './ui.jsx'
import { cn } from '../lib/utils.js'

const LANGUAGES = [
  { code: 'fr', key: 'common.french', short: 'FR' },
  { code: 'ar', key: 'common.arabic', short: 'AR' },
  { code: 'en', key: 'common.english', short: 'EN' },
]

export default function LanguageSwitcher({ variant = 'ghost', icon: Icon = Languages, className, align = 'end' }) {
  const { t, language, setLanguage } = useI18n()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(language)
  const [confirmation, setConfirmation] = useState('')
  const containerRef = useRef(null)

  const current = LANGUAGES.find((item) => item.code === language) || LANGUAGES[0]
  const selectedOption = LANGUAGES.find((item) => item.code === selected) || current

  useEffect(() => {
    if (!open) return undefined
    const handleOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) setOpen(false)
    }
    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      containerRef.current?.querySelector('[data-language-trigger]')?.focus()
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  function toggleOpen() {
    setSelected(language)
    setOpen((value) => !value)
  }

  function applyLanguage() {
    setLanguage(selected)
    setConfirmation(`${t('languageSwitcher.selected')}: ${t(selectedOption.key)}`)
    setOpen(false)
  }

  const triggerProps = {
    type: 'button',
    onClick: toggleOpen,
    'data-language-trigger': true,
    'aria-expanded': open,
    'aria-haspopup': 'listbox',
    'aria-label': t('languageSwitcher.change'),
  }

  return (
    <div className="relative" ref={containerRef}>
      {variant === 'row' ? (
        <button
          {...triggerProps}
          className={cn(
            'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-xs font-medium text-ink transition hover:bg-surface',
            className,
          )}
        >
          <Icon size={14} />
          <span className="min-w-0 flex-1 truncate">{t('languageSwitcher.change')}</span>
          <span className="text-[10px] font-bold text-brand">{t(current.key)}</span>
          <ChevronDown size={13} className={cn('shrink-0 text-muted transition', open && 'rotate-180')} />
        </button>
      ) : (
        <Button
          {...triggerProps}
          variant={variant}
          size="sm"
          icon={Icon}
          className={cn('px-2.5', className)}
        >
          <span className="text-xs font-bold uppercase">{current.short}</span>
          <ChevronDown size={12} className={cn('text-muted transition', open && 'rotate-180')} />
        </Button>
      )}

      {open ? (
        <div
          className={cn(
            'absolute top-full z-40 mt-2 w-[260px] max-w-[calc(100vw-24px)] animate-slide-up overflow-hidden rounded-xl border border-line bg-white shadow-xl',
            align === 'start' ? 'start-0' : 'end-0',
          )}
        >
          <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-ink">{t('languageSwitcher.title')}</p>
              <p className="mt-0.5 truncate text-[10px] text-muted">
                {t('languageSwitcher.current')}: {t(current.key)}
              </p>
            </div>
            <Badge tone="brand">{current.short}</Badge>
          </div>
          <div className="p-1" role="listbox" aria-label={t('languageSwitcher.title')}>
            {LANGUAGES.map((option) => {
              const isCurrent = option.code === language
              const isSelected = option.code === selected
              return (
                <button
                  key={option.code}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => setSelected(option.code)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-start text-xs transition',
                    isSelected ? 'bg-brand-soft text-brand-dark' : 'text-ink hover:bg-surface',
                  )}
                >
                  <span className="grid h-4 w-4 shrink-0 place-items-center">
                    {isSelected ? <Check size={14} strokeWidth={3} className="text-brand" /> : null}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">{t(option.key)}</span>
                  {isCurrent ? (
                    <span className="shrink-0 rounded-full bg-white px-1.5 py-0.5 text-[9px] font-semibold text-muted ring-1 ring-line">
                      {t('languageSwitcher.current')}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-line bg-surface/60 px-3 py-2">
            <span className="min-w-0 truncate text-[10px] text-muted">
              {t('languageSwitcher.selected')}: {t(selectedOption.key)}
            </span>
            <Button size="xs" onClick={applyLanguage} disabled={selected === language}>
              {t('languageSwitcher.apply')}
            </Button>
          </div>
        </div>
      ) : null}
      <span className="sr-only" role="status" aria-live="polite">{confirmation}</span>
    </div>
  )
}
