import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertCircle, Check, ChevronDown, Loader2, RotateCcw, Search, X } from 'lucide-react'
import { useI18n } from '../i18n/I18nContext.jsx'
import { cn, initials } from '../lib/utils.js'

const buttonVariants = {
  primary:
    'bg-brand text-white shadow-sm shadow-brand/20 hover:bg-brand-dark focus-visible:ring-brand/30 disabled:bg-brand/50',
  secondary:
    'bg-white text-ink border border-line hover:bg-surface focus-visible:ring-brand/20 disabled:text-muted',
  soft: 'bg-brand-soft text-brand-dark hover:bg-brand-soft/75 focus-visible:ring-brand/20',
  ghost: 'bg-transparent text-muted hover:bg-surface hover:text-ink focus-visible:ring-brand/20',
  danger: 'bg-danger text-white hover:bg-danger/90 focus-visible:ring-danger/30',
  dangerSoft: 'bg-danger-soft text-danger hover:bg-danger-soft/70 focus-visible:ring-danger/20',
  success: 'bg-success text-white hover:bg-success/90 focus-visible:ring-success/30',
}

const buttonSizes = {
  xs: 'min-h-8 gap-1.5 rounded-lg px-2.5 py-1.5 text-xs',
  sm: 'min-h-9 gap-2 rounded-lg px-3 py-2 text-sm',
  md: 'min-h-10 gap-2 rounded-xl px-4 py-2.5 text-sm',
  lg: 'min-h-12 gap-2.5 rounded-xl px-5 py-3 text-[15px]',
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  iconRight: IconRight,
  fullWidth = false,
  className,
  disabled,
  type = 'button',
  as: Component = 'button',
  ...props
}) {
  const isButton = Component === 'button'
  const isDisabled = Boolean(disabled || loading)
  return (
    <Component
      {...(isButton
        ? { type, disabled: isDisabled }
        : { 'aria-disabled': isDisabled || undefined })}
      className={cn(
        'inline-flex min-w-0 max-w-full items-center justify-center break-words whitespace-normal font-semibold transition focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed',
        buttonVariants[variant] || buttonVariants.primary,
        buttonSizes[size] || buttonSizes.md,
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 size={16} className="shrink-0 animate-spin" /> : Icon ? <Icon size={16} className="shrink-0" /> : null}
      {children}
      {IconRight ? <IconRight size={16} className="shrink-0" /> : null}
    </Component>
  )
}

export function IconButton({ children, label, variant = 'ghost', size = 'md', className, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-grid shrink-0 place-items-center rounded-lg transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20 disabled:opacity-50',
        variant === 'ghost' && 'text-muted hover:bg-surface hover:text-ink',
        variant === 'soft' && 'bg-brand-soft text-brand-dark hover:bg-brand-soft/75',
        variant === 'outline' && 'border border-line bg-white text-muted hover:text-ink',
        variant === 'danger' && 'text-danger hover:bg-danger-soft',
        size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-11 w-11' : 'h-9 w-9',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

const badgeTones = {
  neutral: 'border-line bg-surface text-muted',
  brand: 'border-brand/20 bg-brand-soft text-brand-dark',
  success: 'border-success/20 bg-success-soft text-success',
  warning: 'border-warning/20 bg-warning-soft text-warning',
  danger: 'border-danger/20 bg-danger-soft text-danger',
  blue: 'border-blue-200 bg-blue-50 text-blue-700',
  purple: 'border-purple-200 bg-purple-50 text-purple-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
}

export function Badge({ children, tone = 'neutral', dot = false, className }) {
  return (
    <span
      className={cn(
        'inline-flex min-w-0 max-w-full items-center gap-1.5 break-words rounded-full border px-2.5 py-0.5 text-[11px] font-semibold leading-normal',
        badgeTones[tone] || badgeTones.neutral,
        className,
      )}
    >
      {dot ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" /> : null}
      {children}
    </span>
  )
}

export function Card({ children, className, as: Tag = 'div', ...props }) {
  return (
    <Tag className={cn('min-w-0 max-w-full rounded-xl border border-line bg-white', className)} {...props}>
      {children}
    </Tag>
  )
}

export function CardHeader({ title, description, action, className }) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4', className)}>
      <div className="min-w-0">
        <h3 className="break-words text-sm font-semibold text-ink">{title}</h3>
        {description ? <p className="mt-0.5 break-words text-xs text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}

export function PageHeader({ title, description, actions, eyebrow, className }) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        {eyebrow ? <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand">{eyebrow}</p> : null}
        <h1 className="brand-font break-words text-2xl font-bold tracking-tight text-ink sm:text-[28px]">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl break-words text-sm text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}

export function StatCard({ label, value, hint, icon: Icon, tone = 'brand', trend, className }) {
  const tones = {
    brand: 'bg-brand-soft text-brand',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
    success: 'bg-success-soft text-success',
    danger: 'bg-danger-soft text-danger',
  }
  return (
    <Card className={cn('p-4 sm:p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted">{label}</p>
          <p className="mt-1.5 break-words text-2xl font-bold tracking-tight text-ink">{value}</p>
          {hint ? <p className="mt-1 break-words text-[11px] text-muted">{hint}</p> : null}
        </div>
        {Icon ? (
          <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', tones[tone] || tones.brand)}>
            <Icon size={18} />
          </span>
        ) : null}
      </div>
      {trend ? (
        <div className="mt-3 flex items-center gap-1.5 text-[11px]">
          <span className={cn('font-semibold', trend.positive ? 'text-success' : 'text-danger')}>{trend.value}</span>
          <span className="text-muted">{trend.label}</span>
        </div>
      ) : null}
    </Card>
  )
}

export function ProgressBar({ value = 0, tone = 'brand', size = 'md', showLabel = false, className }) {
  const safe = Math.max(0, Math.min(100, Number(value) || 0))
  const tones = {
    brand: 'bg-brand',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
    blue: 'bg-blue-600',
  }
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('w-full overflow-hidden rounded-full bg-line/70', size === 'sm' ? 'h-1.5' : 'h-2')}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', tones[tone] || tones.brand)}
          style={{ width: `${safe}%` }}
        />
      </div>
      {showLabel ? <span className="w-9 shrink-0 text-end text-[11px] font-semibold text-muted">{safe}%</span> : null}
    </div>
  )
}

export function Avatar({ name, src, size = 'md', className, tone = 'brand' }) {
  const sizes = {
    xs: 'h-7 w-7 text-[10px]',
    sm: 'h-8 w-8 text-[11px]',
    md: 'h-10 w-10 text-xs',
    lg: 'h-12 w-12 text-sm',
    xl: 'h-16 w-16 text-base',
  }
  const tones = {
    brand: 'bg-brand-soft text-brand-dark',
    amber: 'bg-amber-100 text-amber-800',
    blue: 'bg-blue-100 text-blue-800',
    purple: 'bg-purple-100 text-purple-800',
  }
  if (src) {
    return <img src={src} alt={name || ''} className={cn('shrink-0 rounded-full object-cover', sizes[size], className)} />
  }
  return (
    <span
      className={cn(
        'inline-grid shrink-0 place-items-center rounded-full font-bold',
        sizes[size],
        tones[tone] || tones.brand,
        className,
      )}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  )
}

export function Label({ children, htmlFor, required, hint, className }) {
  return (
    <label htmlFor={htmlFor} className={cn('mb-1.5 block text-xs font-semibold text-ink', className)}>
      {children}
      {required ? <span className="ms-1 text-danger">*</span> : null}
      {hint ? <span className="ms-1 font-normal text-muted">({hint})</span> : null}
    </label>
  )
}

const fieldBase =
  'w-full min-w-0 max-w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10 disabled:bg-surface disabled:text-muted'

export function Input({ className, icon: Icon, error, ...props }) {
  return (
    <div className="relative min-w-0 w-full">
      {Icon ? <Icon size={16} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted" /> : null}
      <input className={cn(fieldBase, Icon && 'ps-9', error && 'border-danger focus:border-danger focus:ring-danger/10', className)} {...props} />
    </div>
  )
}

export function Textarea({ className, error, rows = 4, ...props }) {
  return (
    <textarea
      rows={rows}
      className={cn(fieldBase, 'resize-y leading-relaxed', error && 'border-danger focus:border-danger focus:ring-danger/10', className)}
      {...props}
    />
  )
}

export function Select({ children, className, error, ...props }) {
  return (
    <div className="relative min-w-0 w-full">
      <select className={cn(fieldBase, 'appearance-none pe-9', error && 'border-danger', className)} {...props}>
        {children}
      </select>
      <ChevronDown size={15} className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-muted" />
    </div>
  )
}

export function FieldError({ children }) {
  if (!children) return null
  return (
    <p className="mt-1.5 flex items-center gap-1 break-words text-[11px] font-medium text-danger">
      <AlertCircle size={12} className="shrink-0" />
      {children}
    </p>
  )
}

export function Checkbox({ checked, onChange, label, description, className, ...props }) {
  return (
    <label className={cn('flex cursor-pointer items-start gap-2.5', className)}>
      <span className="relative mt-0.5 inline-flex">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-line bg-white transition checked:border-brand checked:bg-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20"
          {...props}
        />
        <Check size={11} strokeWidth={3} className="pointer-events-none absolute inset-0 m-auto text-white opacity-0 peer-checked:opacity-100" />
      </span>
      <span className="min-w-0">
        <span className="block break-words text-sm text-ink">{label}</span>
        {description ? <span className="mt-0.5 block break-words text-xs text-muted">{description}</span> : null}
      </span>
    </label>
  )
}

export function Switch({ checked, onChange, label, description, disabled, className }) {
  return (
    <label className={cn('flex cursor-pointer items-start justify-between gap-4', disabled && 'cursor-not-allowed opacity-60', className)}>
      <span className="min-w-0">
        <span className="block break-words text-sm font-medium text-ink">{label}</span>
        {description ? <span className="mt-0.5 block break-words text-xs text-muted">{description}</span> : null}
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="peer h-5 w-9 cursor-pointer appearance-none rounded-full bg-line transition checked:bg-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20"
        />
        <span className="pointer-events-none absolute start-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition peer-checked:translate-x-4 rtl:peer-checked:-translate-x-4" />
      </span>
    </label>
  )
}

export function Modal({ open, onClose, title, description, children, footer, size = 'md', className }) {
  const { t } = useI18n()
  const titleId = useId()
  const descriptionId = useId()
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKeyDown)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  useEffect(() => {
    if (!open) return undefined
    const previousFocus = document.activeElement
    dialogRef.current?.focus()
    return () => {
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus()
    }
  }, [open])

  if (!open) return null

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div aria-hidden="true" role="presentation" className="absolute inset-0 bg-ink/35 backdrop-blur-[2px]" onClick={onClose} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          'relative z-10 max-h-[92vh] w-full animate-slide-up overflow-hidden rounded-t-2xl border border-line bg-white shadow-2xl outline-none sm:rounded-2xl',
          sizes[size] || sizes.md,
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="break-words text-base font-semibold text-ink">{title}</h2>
            {description ? <p id={descriptionId} className="mt-0.5 break-words text-xs leading-relaxed text-muted">{description}</p> : null}
          </div>
          <IconButton label={t('common.close')} onClick={onClose} size="sm">
            <X size={16} />
          </IconButton>
        </div>
        <div className="thin-scroll min-w-0 max-h-[65vh] overflow-x-hidden overflow-y-auto break-words px-5 py-4">{children}</div>
        {footer ? <div className="flex flex-wrap justify-end gap-2 border-t border-line bg-surface/60 px-5 py-3">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  )
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel,
  tone = 'danger',
  loading,
}) {
  const { t } = useI18n()
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel ?? t('common.cancel')}
          </Button>
          <Button variant={tone} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {null}
    </Modal>
  )
}

export function Tabs({ items, value, onChange, className, variant = 'underline' }) {
  return (
    <div role="tablist" className={cn('no-scrollbar flex min-w-0 max-w-full overflow-x-auto', variant === 'underline' ? 'gap-1 border-b border-line' : 'gap-1 rounded-xl bg-surface p-1', className)}>
      {items.map((item) => {
        const active = item.value === value
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              'inline-flex shrink-0 items-center gap-2 whitespace-nowrap px-3 py-2 text-sm font-semibold transition',
              variant === 'underline'
                ? cn('-mb-px border-b-2', active ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-ink')
                : cn('rounded-lg', active ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'),
            )}
          >
            {item.icon ? <item.icon size={15} /> : null}
            {item.label}
            {item.count !== undefined ? (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                  active ? 'bg-brand-soft text-brand' : 'bg-line/70 text-muted',
                )}
              >
                {item.count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

export function Table({ children, className }) {
  return (
    <div className="table-wrap min-w-0">
      <table className={cn('table-base', className)}>{children}</table>
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, action, className, compact = false }) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 text-center', compact ? 'py-8' : 'py-14', className)}>
      <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand">
        {Icon ? <Icon size={22} /> : <AlertCircle size={22} />}
      </span>
      <h3 className="break-words text-sm font-semibold text-ink">{title}</h3>
      {description ? <p className="mt-1 max-w-sm break-words text-xs leading-relaxed text-muted">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export function Alert({ title, children, tone = 'info', icon: Icon, className, action }) {
  const tones = {
    info: 'border-brand/20 bg-brand-soft/70 text-brand-dark',
    warning: 'border-warning/20 bg-warning-soft text-warning',
    danger: 'border-danger/20 bg-danger-soft text-danger',
    success: 'border-success/20 bg-success-soft text-success',
  }
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={cn('flex flex-wrap items-start gap-3 rounded-xl border p-3.5 text-sm', tones[tone] || tones.info, className)}>
      <span className="mt-0.5 shrink-0">{Icon ? <Icon size={17} /> : <AlertCircle size={17} />}</span>
      <div className="min-w-0 flex-1 basis-0 break-words">
        {title ? <p className="font-semibold">{title}</p> : null}
        <div className={cn('break-words text-xs leading-relaxed', title && 'mt-0.5', tone === 'info' ? 'text-muted' : 'text-current/80')}>{children}</div>
      </div>
      {action ? <div className="min-w-0 max-w-full">{action}</div> : null}
    </div>
  )
}

export function SearchField({ value, onChange, placeholder, className, 'aria-label': ariaLabel, ...props }) {
  const { t } = useI18n()
  const resolvedPlaceholder = placeholder ?? t('common.searchPlaceholder')
  return (
    <div className={cn('relative min-w-0 w-full', className)}>
      <Search size={16} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={resolvedPlaceholder}
        aria-label={ariaLabel || resolvedPlaceholder}
        className={cn(fieldBase, 'ps-9')}
        {...props}
      />
    </div>
  )
}

export function ActionMenu({ items, align = 'end', label = 'Actions' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false)
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div className="relative min-w-0" ref={ref}>
      <IconButton
        label={label}
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        size="sm"
        variant="outline"
      >
        <ChevronDown size={15} />
      </IconButton>
      {open ? (
        <div
          role="menu"
          className={cn(
            'absolute top-full z-30 mt-1 w-48 max-w-[calc(100vw-24px)] animate-fade-in overflow-hidden rounded-xl border border-line bg-white py-1 shadow-xl',
            align === 'end' ? 'end-0' : 'start-0',
          )}
        >
          {items.map((item, index) =>
            item.separator ? (
              <div key={`sep-${index}`} role="separator" className="my-1 border-t border-line" />
            ) : (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false)
                  item.onClick?.()
                }}
                className={cn(
                  'flex w-full items-center gap-2 break-words px-3 py-2 text-start text-xs font-medium transition disabled:opacity-50',
                  item.tone === 'danger' ? 'text-danger hover:bg-danger-soft' : 'text-ink hover:bg-surface',
                )}
              >
                {item.icon ? <item.icon size={14} className="shrink-0" /> : null}
                {item.label}
              </button>
            ),
          )}
        </div>
      ) : null}
    </div>
  )
}

export function RatingStars({ value = 0, size = 14, className }) {
  return (
    <span role="img" className={cn('inline-flex items-center gap-0.5 text-amber-500', className)} aria-label={`${value} / 5`}>
      <span aria-hidden="true" className="inline-flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={star <= Math.round(value) ? 'text-amber-500' : 'text-line'}>
            ★
          </span>
        ))}
      </span>
    </span>
  )
}

export function Divider({ label, className }) {
  if (label) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <span className="h-px flex-1 bg-line" />
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</span>
        <span className="h-px flex-1 bg-line" />
      </div>
    )
  }
  return <div className={cn('h-px bg-line', className)} />
}

export function Skeleton({ className }) {
  return <div className={cn('skeleton rounded-lg', className)} />
}

export function LoadingState({ label, className }) {
  const { t } = useI18n()
  return (
    <div role="status" className={cn('flex items-center justify-center gap-2 py-10 text-xs text-muted', className)}>
      <Loader2 size={16} className="animate-spin" />
      {label || t('common.loading')}
    </div>
  )
}

export function ErrorState({ title, description, action, onRetry, className }) {
  const { t } = useI18n()
  return (
    <EmptyState
      icon={AlertCircle}
      title={title || t('common.error')}
      description={description || t('errors.generic')}
      action={action || (onRetry ? <Button variant="secondary" size="sm" icon={RotateCcw} onClick={onRetry}>{t('common.retry')}</Button> : null)}
      className={className}
    />
  )
}
