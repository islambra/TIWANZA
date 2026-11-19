import { BookOpen, Check, Sparkles, X } from 'lucide-react'
import { useI18n } from '../i18n/I18nContext.jsx'
import { Badge, Card } from './ui.jsx'
import { getPlanDescription, getPlanName, hasPlanFeature } from '../data/plans.js'
import { isUnlimited } from '../data/selectors.js'
import { cn } from '../lib/utils.js'

const LIMIT_KEYS = ['publishedCourses', 'learners', 'storageGb']
const FEATURE_KEYS = ['liveSessions', 'calendar', 'prioritySupport']

function limitText(value, limitKey, t) {
  if (isUnlimited(value)) return t('plans.unlimited')
  if (limitKey === 'storageGb') return `${value} ${t('plans.storageUnit')}`
  return String(value ?? '—')
}

function MiniStat({ label, value }) {
  return (
    <div className="min-w-0 text-center">
      <p className="truncate text-[9px] font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-0.5 truncate text-xs font-bold text-ink">{value}</p>
    </div>
  )
}

function FeatureRow({ label, included, t }) {
  return (
    <div className={cn('flex items-center gap-2 text-[11px]', included ? 'text-ink' : 'text-muted/70')}>
      <span className={cn('grid h-4 w-4 shrink-0 place-items-center rounded-full', included ? 'bg-brand-soft text-brand' : 'bg-surface text-muted/60')}>
        {included ? <Check size={10} strokeWidth={3} /> : <X size={10} />}
      </span>
      <span className="truncate">{label}</span>
      <span className="sr-only">{included ? t('plans.included') : t('plans.notIncluded')}</span>
    </div>
  )
}

export default function PlanComparison({
  plans,
  currentPlanId = null,
  pending = false,
  renderAction = null,
  className = '',
}) {
  const { t, language, money } = useI18n()
  if (!plans?.length) return null

  return (
    <div className={cn('grid gap-4 md:grid-cols-2', className)}>
      {plans.map((plan) => {
        const current = currentPlanId === plan.id
        const Icon = plan.recommended ? Sparkles : BookOpen
        return (
          <Card
            key={plan.id}
            className={cn(
              'relative flex h-full flex-col overflow-hidden rounded-2xl p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-raised',
              current && 'border-brand ring-2 ring-brand/10 shadow-raised',
              plan.recommended && !current && 'border-brand/40',
            )}
          >
            <div className={cn('absolute inset-x-0 top-0 h-1', plan.recommended ? 'brand-gradient' : 'bg-brand/15')} />
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', plan.recommended ? 'bg-brand text-white' : 'bg-brand-soft text-brand')}>
                  <Icon size={18} />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-bold text-ink">{getPlanName(plan, language)}</h3>
                    {current ? <Badge tone="success" className="px-2 py-0 text-[10px]">{t('plans.current')}</Badge> : null}
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted">{getPlanDescription(plan, language)}</p>
                </div>
              </div>
              {plan.recommended ? <Badge tone="brand" className="shrink-0">{t('plans.recommended')}</Badge> : null}
            </div>

            <div className="mt-4 flex items-end gap-1.5">
              <span className="brand-font text-[28px] font-bold leading-none tracking-tight text-ink">{money(plan.priceDA)}</span>
              <span className="pb-0.5 text-[11px] text-muted">{t('plans.perMonth')}</span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl border border-line/70 bg-surface/70 p-2.5">
              {LIMIT_KEYS.map((key) => (
                <MiniStat
                  key={key}
                  label={t(`plans.limits.${key}`)}
                  value={limitText(plan.limits?.[key], key, t)}
                />
              ))}
            </div>

            <div className="mt-3 space-y-1.5">
              {FEATURE_KEYS.map((key) => (
                <FeatureRow
                  key={key}
                  label={t(`plans.features.${key}`)}
                  included={hasPlanFeature(plan, key)}
                  t={t}
                />
              ))}
            </div>

            <div className="mt-auto pt-4">
              <div className="border-t border-dashed border-line pt-3">
                {renderAction ? renderAction(plan, { pending, current }) : null}
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
