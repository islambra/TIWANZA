import { useMemo, useState } from 'react'
import {
  Building2,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  FileText,
  Landmark,
  Link2,
  ShieldCheck,
  Upload,
  Wallet,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useI18n } from '../../i18n/I18nContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { useTiwanzaStore } from '../../data/store.js'
import {
  getPlan,
  getPlanUsage,
  getPlans,
  getSchool,
  getTrainerProfile,
  getTrainerSubscription,
  isSubscriptionActive,
} from '../../data/selectors.js'
import {
  activateFreePlan,
  cancelSubscription,
  checkSubdomainAvailability,
  submitSubscriptionManual,
  submitSubscriptionOnline,
  testChargerlyConnection,
  updatePlan,
  updateSchool,
  updateSchoolPaymentSettings,
  updateUser,
} from '../../data/services.js'
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  ConfirmDialog,
  EmptyState,
  Input,
  Label,
  Modal,
  PageHeader,
  ProgressBar,
  Select,
  StatCard,
  Switch,
  Table,
  Textarea,
} from '../../components/ui.jsx'
import { StatusPill } from '../admin/AdminDashboard.jsx'
import { cn } from '../../lib/utils.js'

function useTrainerSchool() {
  const { user } = useAuth()
  const state = useTiwanzaStore()
  const school = getSchool(state, user?.schoolId)
  const profile = getTrainerProfile(state, user?.id)
  const subscription = getTrainerSubscription(state, user?.id)
  return { user, state, school, profile, subscription }
}

export function TrainerSchool() {
  const { user, state, school } = useTrainerSchool()
  const { t } = useI18n()
  const { success, error: toastError } = useToast()
  const [form, setForm] = useState(() => schoolForm(school))
  const [slugStatus, setSlugStatus] = useState(null)

  if (!school) return <EmptyState icon={Building2} title={t('trainerSchool.title')} description={t('trainerSchool.subtitle')} />

  function set(key, value) { setForm((current) => ({ ...current, [key]: value })) }

  function checkSlug() {
    if (!form.slug || form.slug === school.slug) return setSlugStatus(null)
    const result = checkSubdomainAvailability(form.slug, school.id)
    setSlugStatus(result.available ? 'available' : result.reason || 'taken')
  }

  function save() {
    if (!form.name.trim() || !form.slug.trim()) return toastError(t('errors.requiredFields'))
    const result = updateSchool(school.id, {
      name: form.name.trim(),
      slug: form.slug.trim(),
      subdomain: `${form.slug.trim()}.tiwanza.com`,
      description: form.description.trim(),
      contactEmail: form.contactEmail.trim(),
      contactPhone: form.contactPhone.trim(),
      city: form.city.trim(),
      language: form.language,
      brandAccent: form.brandAccent,
      logo: form.logo,
      metaTitle: form.metaTitle.trim(),
      metaDescription: form.metaDescription.trim(),
    })
    if (!result.ok) return toastError(t('trainerSchool.slugTaken'))
    success(t('trainerSchool.saved'))
    setSlugStatus(null)
  }

  function pickLogo(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) return toastError(t('errors.fileTooLarge'))
    const reader = new FileReader()
    reader.onload = () => set('logo', reader.result)
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-5">
      <PageHeader eyebrow={t('nav.trainer')} title={t('trainerSchool.title')} description={t('trainerSchool.subtitle')} actions={<><Button variant="secondary" icon={ExternalLink} onClick={() => window.open(`/s/${school.slug}`, '_blank')}>{t('trainerSchool.viewSite')}</Button><Button onClick={save}>{t('trainerSchool.save')}</Button></>} />
      <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <Card>
          <CardHeader title={t('trainerSchool.general')} description={t('trainerSchool.publicSiteDesc')} />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label required>{t('trainerSchool.name')}</Label><Input value={form.name} onChange={(event) => set('name', event.target.value)} /></div>
            <div><Label required hint={t('trainerSchool.slugHint')}>{t('trainerSchool.slug')}</Label><div className="relative"><Input value={form.slug} onChange={(event) => { set('slug', event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')); setSlugStatus(null) }} onBlur={checkSlug} className="pe-20" /><span className="absolute end-3 top-1/2 -translate-y-1/2 text-[10px] text-muted">.tiwanza.com</span></div>{slugStatus ? <p className={cn('mt-1 text-[10px]', slugStatus === 'available' ? 'text-success' : 'text-danger')}>{slugStatus === 'available' ? t('trainerSchool.slugAvailable') : t('trainerSchool.slugTaken')}</p> : null}</div>
            <div><Label>{t('trainerSchool.category')}</Label><Input value={form.category} onChange={(event) => set('category', event.target.value)} placeholder="Développement, Design, Langues..." /></div>
            <div className="sm:col-span-2"><Label>{t('trainerSchool.description')}</Label><Textarea rows={4} value={form.description} onChange={(event) => set('description', event.target.value)} placeholder={t('trainerSchool.descriptionPlaceholder')} /></div>
            <div><Label>{t('trainerSchool.language')}</Label><Select value={form.language} onChange={(event) => set('language', event.target.value)}><option value="fr">Francais</option><option value="ar">Arabic</option></Select></div>
            <div><Label>{t('trainerSchool.primaryColor')}</Label><div className="flex items-center gap-2"><input type="color" value={form.brandAccent} onChange={(event) => set('brandAccent', event.target.value)} className="h-10 w-12 cursor-pointer rounded-lg border border-line bg-white p-1" /><Input value={form.brandAccent} onChange={(event) => set('brandAccent', event.target.value)} className="flex-1" /></div></div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title={t('trainerSchool.branding')} description={t('trainerSchool.logoHint')} />
            <div className="space-y-4 p-5">
              <div className="flex items-center gap-4"><Avatar name={form.name || school.name} src={form.logo} size="xl" /><div className="flex-1"><Label>{t('trainerSchool.logo')}</Label><label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-line px-3 py-2 text-xs font-medium text-muted hover:border-brand hover:text-brand"><Upload size={14} />{t('common.upload')}<input type="file" accept="image/png,image/jpeg,image/svg+xml" className="hidden" onChange={pickLogo} /></label>{form.logo ? <button type="button" onClick={() => set('logo', null)} className="mt-1 text-[10px] text-danger">{t('trainerSchool.removeLogo')}</button> : null}</div></div>
              <div className="rounded-xl border border-line bg-surface p-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{t('trainerSchool.preview')}</p><div className="mt-2 flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg text-white" style={{ background: form.brandAccent }}><Building2 size={15} /></span><div className="min-w-0"><p className="truncate text-xs font-semibold text-ink">{form.name || school.name}</p><p className="truncate text-[10px] text-muted">{form.slug}.tiwanza.com</p></div></div></div>
            </div>
          </Card>
          <Card>
            <CardHeader title={t('trainerSchool.publicSite')} description={t('trainerSchool.publicSiteDesc')} action={<Badge tone="success" dot>{t('trainerSchool.published')}</Badge>} />
            <div className="p-5"><button type="button" onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/s/${school.slug}`).then(() => success(t('trainerSchool.linkCopied')))} className="flex w-full items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-xs text-muted hover:text-ink"><Link2 size={14} /><span className="flex-1 truncate text-start">/s/{school.slug}</span>{t('trainerSchool.copyLink')}</button></div>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader title={t('trainerSchool.seo')} description={t('trainerSchool.metaDescriptionHint')} />
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <div><Label>{t('trainerSchool.metaTitle')}</Label><Input value={form.metaTitle} onChange={(event) => set('metaTitle', event.target.value)} maxLength={70} /></div>
          <div><Label>{t('trainerSchool.metaDescription')}</Label><Textarea rows={2} value={form.metaDescription} onChange={(event) => set('metaDescription', event.target.value)} maxLength={160} /></div>
          <div><Label>{t('trainerSchool.email')}</Label><Input type="email" value={form.contactEmail} onChange={(event) => set('contactEmail', event.target.value)} /></div>
          <div><Label>{t('trainerSchool.phone')}</Label><Input value={form.contactPhone} onChange={(event) => set('contactPhone', event.target.value)} /></div>
          <div><Label>{t('trainerSchool.city')}</Label><Input value={form.city} onChange={(event) => set('city', event.target.value)} /></div>
        </div>
      </Card>
    </div>
  )
}

function schoolForm(school) {
  if (!school) return { name: '', slug: '', description: '', contactEmail: '', contactPhone: '', city: '', language: 'fr', brandAccent: '#0D7A6A', logo: null, category: '', metaTitle: '', metaDescription: '' }
  return {
    name: school.name || '',
    slug: school.slug || '',
    description: school.description || '',
    contactEmail: school.contactEmail || '',
    contactPhone: school.contactPhone || '',
    city: school.city || '',
    language: school.language || 'fr',
    brandAccent: school.brandAccent || '#0D7A6A',
    logo: school.logo || null,
    category: school.category || '',
    metaTitle: school.metaTitle || school.name || '',
    metaDescription: school.metaDescription || school.description || '',
  }
}

export function TrainerPaymentSettings() {
  const { school } = useTrainerSchool()
  const { t } = useI18n()
  const { success, error: toastError } = useToast()
  const [form, setForm] = useState(() => paymentForm(school))
  const [testing, setTesting] = useState(false)

  if (!school) return <EmptyState icon={CreditCard} title={t('trainerPaymentSettings.title')} description={t('trainerPaymentSettings.subtitle')} />

  function set(key, value) { setForm((current) => ({ ...current, [key]: value })) }
  function setManual(key, value) { setForm((current) => ({ ...current, manual: { ...current.manual, [key]: value } })) }
  function setBank(key, value) { setForm((current) => ({ ...current, manual: { ...current.manual, bank: { ...current.manual.bank, [key]: value } } })) }

  function save() {
    if (!form.chargerly.enabled && !form.manual.enabled) return toastError(t('trainerPaymentSettings.enableAtLeastOne'))
    updateSchoolPaymentSettings(school.id, {
      chargerly: { ...school.paymentSettings?.chargerly, status: form.chargerly.enabled ? (form.chargerly.status === 'connected' ? 'connected' : 'disconnected') : 'disconnected', mode: form.chargerly.mode, accountName: form.chargerly.accountName },
      manual: { ...school.paymentSettings?.manual, enabled: form.manual.enabled, ccp: form.manual.ccp, baridimob: form.manual.baridimob, beneficiary: form.manual.beneficiary, bank: form.manual.bank, instructionsFr: form.manual.instructionsFr, instructionsAr: form.manual.instructionsAr, delay: form.manual.delay },
    })
    success(t('trainerPaymentSettings.saved'))
  }

  function testConnection() {
    setTesting(true)
    const result = testChargerlyConnection(school.id)
    setTesting(false)
    if (result.ok) success(t('trainerPaymentSettings.onlinePayments') + ' ✓')
    else toastError(t('trainerPaymentSettings.configure'))
  }

  return (
    <div className="space-y-5">
      <PageHeader eyebrow={t('nav.trainer')} title={t('trainerPaymentSettings.title')} description={t('trainerPaymentSettings.subtitle')} actions={<Button onClick={save}>{t('trainerPaymentSettings.save')}</Button>} />
      <Alert tone="info" title={t('trainerPaymentSettings.paymentNotice')}>{t('trainerPaymentSettings.paymentNotice')}</Alert>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title={t('trainerPaymentSettings.onlinePayments')} description={t('trainerPaymentSettings.onlinePaymentsDesc')} action={<Switch checked={form.chargerly.enabled} onChange={(event) => set('chargerly', { ...form.chargerly, enabled: event.target.checked })} />} />
          <div className={cn('space-y-4 p-5', !form.chargerly.enabled && 'pointer-events-none opacity-50')}>
            <div><Label>{t('common.provider') || 'Prestataire'}</Label><Select value={form.chargerly.provider} onChange={(event) => set('chargerly', { ...form.chargerly, provider: event.target.value })}><option value="chargerly">Chargerly</option><option value="cib">CIB Web</option><option value="edahabia">Edahabia</option></Select></div>
            <div><Label>{t('common.account') || 'Compte marchand'}</Label><Input value={form.chargerly.accountName} onChange={(event) => set('chargerly', { ...form.chargerly, accountName: event.target.value })} placeholder={school.name} /></div>
            <div><Label>{t('common.mode') || 'Mode'}</Label><Select value={form.chargerly.mode} onChange={(event) => set('chargerly', { ...form.chargerly, mode: event.target.value })}><option value="test">Test</option><option value="live">Production</option></Select></div>
            <div className="flex items-center justify-between rounded-xl bg-surface p-3"><div><p className="text-xs font-semibold text-ink">{t('common.status')}</p><p className="text-[10px] text-muted">{form.chargerly.accountName || t('trainerPaymentSettings.configure')}</p></div><div className="flex items-center gap-2"><Badge tone={form.chargerly.status === 'connected' ? 'success' : 'neutral'}>{form.chargerly.status === 'connected' ? t('common.connected') || 'Connecté' : t('common.disconnected') || 'Non connecté'}</Badge><Button variant="soft" size="xs" loading={testing} onClick={testConnection}>{t('common.test') || 'Tester'}</Button></div></div>
          </div>
        </Card>

        <Card>
          <CardHeader title={t('trainerPaymentSettings.manualPayments')} description={t('trainerPaymentSettings.manualPaymentsDesc')} action={<Switch checked={form.manual.enabled} onChange={(event) => setManual('enabled', event.target.checked)} />} />
          <div className={cn('space-y-4 p-5', !form.manual.enabled && 'pointer-events-none opacity-50')}>
            <div className="grid gap-3 sm:grid-cols-2"><div><Label>CCP</Label><Input value={form.manual.ccp} onChange={(event) => setManual('ccp', event.target.value)} /></div><div><Label>BaridiMob</Label><Input value={form.manual.baridimob} onChange={(event) => setManual('baridimob', event.target.value)} /></div><div><Label>{t('trainerPaymentSettings.accountName')}</Label><Input value={form.manual.beneficiary} onChange={(event) => setManual('beneficiary', event.target.value)} /></div><div><Label>{t('trainerPaymentSettings.currency')}</Label><Select value="DA" disabled><option value="DA">{t('trainerPaymentSettings.currencyDA')}</option></Select></div></div>
            <div className="grid gap-3 sm:grid-cols-2"><div><Label>{t('trainerPaymentSettings.bankName')}</Label><Input value={form.manual.bank.name} onChange={(event) => setBank('name', event.target.value)} /></div><div><Label>{t('common.agency') || 'Agence'}</Label><Input value={form.manual.bank.agency} onChange={(event) => setBank('agency', event.target.value)} /></div><div className="sm:col-span-2"><Label>{t('trainerPaymentSettings.rib')}</Label><Input value={form.manual.bank.rib} onChange={(event) => setBank('rib', event.target.value)} /></div></div>
            <div><Label>{t('trainerPaymentSettings.manualInstructions')}</Label><Textarea rows={3} value={form.manual.instructionsFr} onChange={(event) => setManual('instructionsFr', event.target.value)} placeholder={t('trainerPaymentSettings.manualInstructionsPlaceholder')} /></div>
            <div><Label>{t('trainerPaymentSettings.manualInstructions')} (AR)</Label><Textarea rows={2} value={form.manual.instructionsAr} onChange={(event) => setManual('instructionsAr', event.target.value)} dir="rtl" /></div>
            <div><Label>{t('common.delay') || 'Délai de validation'}</Label><Input value={form.manual.delay} onChange={(event) => setManual('delay', event.target.value)} placeholder="24 h ouvrées" /></div>
          </div>
        </Card>
      </div>
    </div>
  )
}

function paymentForm(school) {
  const chargerly = school?.paymentSettings?.chargerly || {}
  const manual = school?.paymentSettings?.manual || {}
  return {
    chargerly: { enabled: chargerly.status === 'connected', status: chargerly.status || 'disconnected', mode: chargerly.mode || 'test', accountName: chargerly.accountName || '', provider: 'chargerly' },
    manual: { enabled: Boolean(manual.enabled), ccp: manual.ccp || '', baridimob: manual.baridimob || '', beneficiary: manual.beneficiary || school?.name || '', delay: manual.delay || '24 h ouvrées', instructionsFr: manual.instructionsFr || '', instructionsAr: manual.instructionsAr || '', bank: { name: manual.bank?.name || '', agency: manual.bank?.agency || '', rib: manual.bank?.rib || '' } },
  }
}

export function TrainerSubscription() {
  const { user, state, school, profile, subscription } = useTrainerSchool()
  const { t, money, date } = useI18n()
  const { success, error: toastError } = useToast()
  const [checkout, setCheckout] = useState(null)
  const [provider, setProvider] = useState('cib')
  const [manualOpen, setManualOpen] = useState(false)
  const [reference, setReference] = useState('')
  const [proofName, setProofName] = useState('')
  const [proofData, setProofData] = useState(null)
  const [cancelOpen, setCancelOpen] = useState(false)

  if (!school || !profile) return <EmptyState icon={ShieldCheck} title={t('subscription.noSubscription')} description={t('subscription.noSubscriptionDesc')} />

  const plans = getPlans(state)
  const currentPlan = getPlan(state, profile.planId) || getPlan(state, subscription?.planId)
  const usage = getPlanUsage(state, school.id)
  const active = isSubscriptionActive(subscription)
  const pending = state.subscriptionPayments.find((payment) => payment.trainerId === user.id && payment.status === 'pending')
  const history = state.subscriptionPayments.filter((payment) => payment.trainerId === user.id).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
  const remaining = subscription?.endsAt ? Math.max(0, Math.ceil((new Date(subscription.endsAt) - Date.now()) / 86400000)) : null

  function activateFree() {
    const result = activateFreePlan(user.id)
    if (!result.ok) return toastError(t('errors.generic'))
    success(t('account.planActivated') || t('subscription.active'))
  }

  function payOnline() {
    const result = submitSubscriptionOnline({ userId: user.id, planId: checkout.id, provider, outcome: 'success' })
    if (result.ok) success(t('subscription.paymentSuccess'))
    else toastError(t('subscription.paymentFailed'))
    setCheckout(null)
  }

  function submitManual() {
    if (!reference.trim() || !proofName) return toastError(t('subscription.receiptRequired'))
    submitSubscriptionManual({ userId: user.id, planId: checkout.id, reference: reference.trim(), proofName, proofDataUrl: proofData })
    success(t('subscription.manualSuccess'))
    setManualOpen(false)
    setCheckout(null)
    setReference('')
    setProofName('')
    setProofData(null)
  }

  function pickProof(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) return toastError(t('errors.fileTooLarge'))
    setProofName(file.name)
    const reader = new FileReader()
    reader.onload = () => setProofData(reader.result)
    reader.readAsDataURL(file)
  }

  function cancel() {
    cancelSubscription(user.id)
    success(t('subscription.cancelSuccess'))
    setCancelOpen(false)
  }

  const usageRows = [
    { label: t('subscription.usageCourses'), used: usage.published, limit: usage.limits.publishedCourses },
    { label: t('subscription.usageLearners'), used: usage.learners, limit: usage.limits.learners },
    { label: t('subscription.usageTrainers'), used: 1, limit: usage.limits.trainers || 1 },
  ]

  return (
    <div className="space-y-5">
      <PageHeader eyebrow={t('nav.trainer')} title={t('subscription.title')} description={t('subscription.subtitle')} actions={subscription?.status === 'active' ? <Button variant="dangerSoft" onClick={() => setCancelOpen(true)}>{t('subscription.cancelPlan')}</Button> : null} />
      {!active ? <Alert tone={subscription?.status === 'pending' ? 'warning' : 'danger'} title={t(`subscription.${subscription?.status || 'noSubscription'}`)}>{pending ? t('subscription.pendingReviewDesc') : t('subscription.expiredNotice')}</Alert> : null}
      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader title={t('subscription.currentPlan')} action={<StatusPill status={active ? 'active' : subscription?.status || 'pending'} t={t} />} />
          <div className="p-5">
            <div className="flex items-center gap-4 rounded-xl bg-surface p-4"><span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-soft text-brand"><ShieldCheck size={24} /></span><div className="min-w-0 flex-1"><p className="text-base font-bold text-ink">{currentPlan?.name || t('subscription.freeName')}</p><p className="text-xs text-muted">{currentPlan?.description || t('subscription.freeDesc')}</p></div><div className="text-end"><p className="text-lg font-bold text-ink">{money(currentPlan?.priceDA || 0)}</p><p className="text-[10px] text-muted">{t('subscription.perMonth')}</p></div></div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3"><InfoCell label={t('subscription.startDate')} value={subscription?.startedAt ? date(subscription.startedAt) : '—'} /><InfoCell label={active ? t('subscription.renewsOn') : t('subscription.endDate')} value={subscription?.endsAt ? date(subscription.endsAt) : '—'} /><InfoCell label={t('subscription.status')} value={remaining !== null ? t('subscription.daysRemaining', { count: remaining }) : t('subscription.freeForever')} /></div>
            <div className="mt-4 space-y-3">{usageRows.map((row) => <div key={row.label}><div className="mb-1 flex items-center justify-between text-[11px]"><span className="text-muted">{row.label}</span><span className="font-medium text-ink">{row.used} / {row.limit === -1 ? '∞' : row.limit}</span></div><ProgressBar value={row.limit === -1 ? 0 : Math.min(100, Math.round((row.used / Math.max(row.limit, 1)) * 100))} tone={row.limit !== -1 && row.used >= row.limit ? 'danger' : 'brand'} size="sm" /></div>)}</div>
          </div>
        </Card>

        <Card>
          <CardHeader title={t('subscription.planComparison')} description={t('subscription.upgradeNotice')} />
          <div className="space-y-3 p-5">
            {plans.map((plan) => {
              const current = plan.id === currentPlan?.id
              return (
                <div key={plan.id} className={cn('rounded-xl border p-4', current ? 'border-brand bg-brand-soft/40' : 'border-line')}>
                  <div className="flex items-start justify-between gap-2"><div><p className="text-sm font-bold text-ink">{plan.name}</p><p className="mt-0.5 text-[11px] text-muted">{plan.description}</p></div><div className="text-end"><p className="text-sm font-bold text-ink">{money(plan.priceDA)}</p><p className="text-[10px] text-muted">{t('subscription.perMonth')}</p></div></div>
                  <div className="mt-3 flex flex-wrap gap-1.5">{plan.features?.slice(0, 3).map((feature) => <Badge key={feature} tone="neutral">{feature}</Badge>)}</div>
                  <div className="mt-3">{current ? <Badge tone="success" dot>{t('subscription.currentPlanBadge')}</Badge> : plan.priceDA === 0 ? <Button variant="soft" size="sm" fullWidth onClick={activateFree}>{t('subscription.activateFree')}</Button> : <Button size="sm" fullWidth onClick={() => setCheckout(plan)}>{t('subscription.choosePlan')}</Button>}</div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title={t('subscription.history')} description={t('subscription.historyEmptyDesc')} />
        {history.length ? <Table><thead><tr><th>{t('subscription.invoice')}</th><th>{t('subscription.plan')}</th><th>{t('subscription.amount')}</th><th className="hidden sm:table-cell">{t('subscription.method')}</th><th className="hidden sm:table-cell">{t('subscription.date')}</th><th>{t('subscription.status')}</th></tr></thead><tbody>{history.map((payment) => <tr key={payment.id}><td className="text-xs font-medium text-ink">{payment.reference}</td><td className="text-xs text-muted">{getPlan(state, payment.planId)?.name}</td><td className="text-xs font-semibold text-ink">{money(payment.amount)}</td><td className="hidden sm:table-cell"><Badge tone={payment.method === 'manual' ? 'amber' : 'blue'}>{payment.method === 'manual' ? t('subscription.manualPayment') : t('subscription.onlinePayment')}</Badge></td><td className="hidden sm:table-cell text-[11px] text-muted">{date(payment.submittedAt)}</td><td><StatusPill status={payment.status} t={t} /></td></tr>)}</tbody></Table> : <EmptyState icon={Wallet} title={t('subscription.historyEmpty')} description={t('subscription.historyEmptyDesc')} compact />}
      </Card>

      <Modal open={Boolean(checkout)} onClose={() => setCheckout(null)} title={t('subscription.paymentTitle')} description={checkout ? t('subscription.planLabel', { plan: checkout.name }) : ''} footer={<><Button variant="secondary" onClick={() => setCheckout(null)}>{t('common.cancel')}</Button><Button icon={CreditCard} onClick={() => { setProvider('cib'); payOnline() }}>{t('subscription.payNow')}</Button></>}>
        {checkout ? <div className="space-y-4"><div className="rounded-xl bg-surface p-4"><div className="flex justify-between text-xs"><span className="text-muted">{t('subscription.plan')}</span><span className="font-semibold text-ink">{checkout.name}</span></div><div className="mt-2 flex justify-between text-xs"><span className="text-muted">{t('subscription.billingCycle')}</span><span className="text-ink">{t('subscription.monthly')}</span></div><div className="mt-3 flex justify-between border-t border-line pt-3"><span className="text-sm font-semibold text-ink">{t('subscription.totalDue')}</span><span className="text-lg font-bold text-brand">{money(checkout.priceDA)}</span></div></div><div><Label>{t('subscription.paymentMethod')}</Label><Select value={provider} onChange={(event) => setProvider(event.target.value)}><option value="cib">CIB Web</option><option value="edahabia">Edahabia</option></Select></div><Alert tone="info">{t('subscription.onlineSimulated')}</Alert><Button variant="soft" fullWidth icon={Landmark} onClick={() => setManualOpen(true)}>{t('subscription.payManual')}</Button></div> : null}
      </Modal>

      <Modal open={manualOpen} onClose={() => setManualOpen(false)} title={t('subscription.payManual')} footer={<><Button variant="secondary" onClick={() => setManualOpen(false)}>{t('common.cancel')}</Button><Button onClick={submitManual}>{t('subscription.submitManual')}</Button></>}>
        <div className="space-y-4"><Alert tone="warning">{t('subscription.manualInstructions')}</Alert><div><Label required>{t('subscription.reference')}</Label><Input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="CCP-2026-0000" /></div><div><Label required>{t('subscription.uploadReceipt')}</Label><label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-line px-3 py-5 text-xs text-muted hover:border-brand hover:text-brand"><FileText size={16} />{proofName || t('subscription.receiptHint')}<input type="file" accept="image/*,application/pdf" className="hidden" onChange={pickProof} /></label></div></div>
      </Modal>

      <ConfirmDialog open={cancelOpen} onClose={() => setCancelOpen(false)} onConfirm={cancel} title={t('subscription.cancelConfirm')} description={t('subscription.cancelPlanDesc')} confirmLabel={t('subscription.cancelPlan')} />
    </div>
  )
}

export function TrainerProfile() {
  const { user, school } = useTrainerSchool()
  const { t } = useI18n()
  const { success, error: toastError } = useToast()
  const [form, setForm] = useState({ name: user.name || '', phone: user.phone || '', language: user.language || 'fr' })
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' })

  function saveProfile() {
    if (!form.name.trim()) return toastError(t('errors.requiredFields'))
    updateUser(user.id, { name: form.name.trim(), phone: form.phone.trim(), language: form.language })
    success(t('learner.profileSaved'))
  }

  function savePassword() {
    if (passwords.current !== user.password) return toastError(t('learner.wrongPassword'))
    if (!passwords.next || passwords.next !== passwords.confirm) return toastError(t('learner.passwordMismatch'))
    updateUser(user.id, { password: passwords.next })
    success(t('learner.passwordUpdated'))
    setPasswords({ current: '', next: '', confirm: '' })
  }

  return (
    <div className="space-y-5">
      <PageHeader eyebrow={t('nav.trainer')} title={t('common.profile')} description={school?.name || t('app.tagline')} />
      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader title={t('common.profile')} />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <div className="flex items-center gap-3 sm:col-span-2">
              <Avatar name={user.name} size="lg" />
              <div><p className="text-sm font-semibold text-ink">{user.name}</p><p className="text-xs text-muted">{user.email}</p><Badge tone="brand" className="mt-1">{t('roles.trainer')}</Badge></div>
            </div>
            <div className="sm:col-span-2"><Label>{t('learner.fullName')}</Label><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
            <div className="sm:col-span-2"><Label hint={t('learner.emailNotEditable')}>{t('learner.email')}</Label><Input value={user.email} disabled /></div>
            <div><Label>{t('learner.phone')}</Label><Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></div>
            <div><Label>{t('learner.language')}</Label><Select value={form.language} onChange={(event) => setForm({ ...form, language: event.target.value })}><option value="fr">Francais</option><option value="ar">Arabic</option></Select></div>
            <div className="sm:col-span-2"><Button onClick={saveProfile}>{t('learner.saveProfile')}</Button></div>
          </div>
        </Card>
        <Card>
          <CardHeader title={t('learner.changePassword')} />
          <div className="space-y-3 p-5">
            <div><Label>{t('learner.currentPassword')}</Label><Input type="password" value={passwords.current} onChange={(event) => setPasswords({ ...passwords, current: event.target.value })} /></div>
            <div><Label>{t('learner.newPassword')}</Label><Input type="password" value={passwords.next} onChange={(event) => setPasswords({ ...passwords, next: event.target.value })} /></div>
            <div><Label>{t('learner.confirmPassword')}</Label><Input type="password" value={passwords.confirm} onChange={(event) => setPasswords({ ...passwords, confirm: event.target.value })} /></div>
            <Button onClick={savePassword}>{t('learner.updatePassword')}</Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

function InfoCell({ label, value }) {
  return <div className="rounded-lg bg-surface p-2.5"><p className="text-[9px] uppercase tracking-wide text-muted">{label}</p><p className="mt-0.5 truncate text-[11px] font-semibold text-ink">{value}</p></div>
}
