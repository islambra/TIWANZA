import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { CheckCircle2, AlertTriangle, Info, X, XCircle } from 'lucide-react'
import { cn } from '../lib/utils.js'

const ToastContext = createContext(null)

const toneStyles = {
  success: 'border-success/25 bg-success-soft text-success',
  error: 'border-danger/25 bg-danger-soft text-danger',
  warning: 'border-warning/25 bg-warning-soft text-warning',
  info: 'border-brand/20 bg-brand-soft text-brand-dark',
}

const toneIcons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  const dismiss = useCallback((id) => {
    setToasts((items) => items.filter((item) => item.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      window.clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const push = useCallback(
    (toast) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      const item = { id, tone: 'success', duration: 4200, ...toast }
      setToasts((items) => [...items.slice(-3), item])
      if (item.duration > 0) {
        const timer = window.setTimeout(() => dismiss(id), item.duration)
        timers.current.set(id, timer)
      }
      return id
    },
    [dismiss],
  )

  const value = useMemo(
    () => ({
      toasts,
      dismiss,
      toast: push,
      success: (title, description) => push({ title, description, tone: 'success' }),
      error: (title, description) => push({ title, description, tone: 'error' }),
      warning: (title, description) => push({ title, description, tone: 'warning' }),
      info: (title, description) => push({ title, description, tone: 'info' }),
    }),
    [push, dismiss, toasts],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-3 bottom-3 z-[100] flex flex-col items-end gap-2 sm:inset-x-auto sm:end-4 sm:bottom-4 sm:w-[380px]">
        {toasts.map((item) => {
          const Icon = toneIcons[item.tone] || Info
          return (
            <div
              key={item.id}
              className={cn(
                'pointer-events-auto flex w-full animate-slide-up items-start gap-3 rounded-xl border bg-white p-3.5 shadow-lg shadow-black/5',
                toneStyles[item.tone],
              )}
              role="status"
            >
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/70">
                <Icon size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{item.title}</p>
                {item.description ? <p className="mt-0.5 text-xs leading-relaxed text-muted">{item.description}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                className="rounded-md p-1 text-muted transition hover:bg-black/5 hover:text-ink"
                aria-label="Fermer"
              >
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside ToastProvider')
  return context
}
