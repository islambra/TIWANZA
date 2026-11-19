import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Eye,
  EyeOff,
  Globe2,
  Link2,
  Mail,
  MapPin,
  Monitor,
  Palette,
  Phone,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Upload,
  Users,
  Wallet,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useI18n } from '../../i18n/I18nContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { useTiwanzaStore } from '../../data/store.js'
import {
  getCoursePaymentOptions,
  getPlan,
  getPlanUsage,
  getPlans,
  getSchool,
  getSchoolCourses,
  getSubscriptionPaymentOptions,
  getTrainerProfile,
  getTrainerSubscription,
  isSubscriptionActive,
} from '../../data/selectors.js'
import {
  COURSE_MANUAL_METHODS,
  COURSE_ONLINE_METHODS,
  defaultSchoolPaymentSettings,
  displayPaymentMethod,
  paymentMethodDescriptionKey,
  paymentMethodLabelKey,
} from '../../data/paymentMethods.js'
import {
  cancelSubscription,
  checkSubdomainAvailability,
  renewSubscription,
  submitSubscriptionManual,
  submitSubscriptionOnline,
  testChargerlyConnection,
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
  FieldError,
  Input,
  Label,
  Modal,
  PageHeader,
  ProgressBar,
  Select,
  StatCard,
  Switch,
  Table,
  Tabs,
  Textarea,
} from '../../components/ui.jsx'
import PlanComparison from '../../components/PlanComparison.jsx'
import { getPlanDescription, getPlanName } from '../../data/plans.js'
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

function slugReason(reason, t) {
  if (reason === 'reserved') return t('errors.slugReserved')
  if (reason === 'taken') return t('trainerSchool.slugTaken')
  if (reason === 'too-short' || reason === 'too-long' || reason === 'invalid') return t('errors.slugInvalid')
  return t('errors.required')
}

export function TrainerSchool() {
  const { state, school } = useTrainerSchool()
  const { t, time } = useI18n()
  const { success, error: toastError } = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState(() => schoolForm(school))
  const [baseline, setBaseline] = useState(() => JSON.stringify(schoolForm(school)))
  const [slugStatus, setSlugStatus] = useState(null)
  const [slugSuggestions, setSlugSuggestions] = useState([])
  const [touched, setTouched] = useState({})
  const [saving, setSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState(null)
  const [activeTab, setActiveTab] = useState('identity')
  const [previewMode, setPreviewMode] = useState('desktop')
  const [copied, setCopied] = useState(false)
  const [published, setPublished] = useState(() => school?.published !== false)
  const [discardOpen, setDiscardOpen] = useState(false)

  const dirty = JSON.stringify(form) !== baseline

  useEffect(() => {
    if (!dirty || typeof window === 'undefined') return undefined
    const warn = (event) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  if (!school) return <EmptyState icon={Building2} title={t('trainerSchool.title')} description={t('trainerSchool.subtitle')} />

  const usage = getPlanUsage(state, school.id)
  const paymentCount = getCoursePaymentOptions(state, school).length
  const siteCourses = getSchoolCourses(state, school.id, { includeUnpublished: false }).slice(0, 3)
  const sitePath = `/s/${school.slug}`
  const siteUrl = typeof window !== 'undefined' ? `${window.location.origin}${sitePath}` : sitePath
  const categories = [...new Set(state.schools.map((item) => item.category).concat(form.category).filter(Boolean))]
  const checks = [
    Boolean(form.name.trim()),
    Boolean(form.slug.trim()),
    Boolean(form.description.trim()),
    Boolean(form.logo),
    Boolean(form.contactEmail.trim() || form.contactPhone.trim() || form.city.trim()),
    Boolean(form.metaTitle.trim() && form.metaDescription.trim()),
  ]
  const completedChecks = checks.filter(Boolean).length
  const completeness = Math.round((completedChecks / checks.length) * 100)
  const nameError = !form.name.trim() ? t('errors.required') : ''
  const slugError = slugStatus && slugStatus !== 'available'
    ? slugReason(slugStatus, t)
    : touched.slug && !form.slug.trim() ? t('errors.required') : ''
  const descriptionError = form.description.length > 300 ? `${t('common.max')} 300 ${t('common.characters')}` : ''
  const emailError = form.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail) ? t('errors.email') : ''

  function set(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
    if (key === 'slug') setCopied(false)
  }

  function touch(key) { setTouched((current) => ({ ...current, [key]: true })) }

  function checkSlug() {
    touch('slug')
    if (!form.slug || form.slug === school.slug) {
      setSlugStatus(null)
      setSlugSuggestions([])
      return
    }
    const result = checkSubdomainAvailability(form.slug, school.id)
    setSlugStatus(result.available ? 'available' : result.reason || 'taken')
    setSlugSuggestions(result.available ? [] : result.suggestions || [])
  }

  function save() {
    if (!form.name.trim() || !form.slug.trim()) {
      touch('name')
      touch('slug')
      return toastError(t('errors.requiredFields'))
    }
    setSaving(true)
    let result
    try {
      result = updateSchool(school.id, {
        name: form.name.trim(),
        slug: form.slug.trim(),
        subdomain: `${form.slug.trim()}.tiwanza.com`,
        description: form.description.trim(),
        category: form.category.trim(),
        contactEmail: form.contactEmail.trim(),
        contactPhone: form.contactPhone.trim(),
        city: form.city.trim(),
        language: form.language,
        brandAccent: form.brandAccent,
        logo: form.logo,
        metaTitle: form.metaTitle.trim(),
        metaDescription: form.metaDescription.trim(),
      })
    } finally {
      setSaving(false)
    }
    if (!result.ok) return toastError(t('trainerSchool.slugTaken'))
    success(t('trainerSchool.saved'))
    setSlugStatus(null)
    setSlugSuggestions([])
    setBaseline(JSON.stringify(form))
    setLastSavedAt(new Date().toISOString())
    setTouched({})
  }

  function pickLogo(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) return toastError(t('errors.fileTooLarge'))
    const reader = new FileReader()
    reader.onload = () => set('logo', reader.result)
    reader.readAsDataURL(file)
  }

  function copyLink() {
    if (!navigator.clipboard?.writeText) return toastError(t('errors.generic'))
    navigator.clipboard.writeText(siteUrl).then(
      () => { setCopied(true); success(t('trainerSchool.linkCopied')) },
      () => toastError(t('errors.generic')),
    )
  }

  function openSite() {
    window.open(sitePath, '_blank')
  }

  function toggleSite() {
    const next = !published
    const result = updateSchool(school.id, { published: next })
    if (!result.ok) return toastError(t('errors.generic'))
    setPublished(next)
    success(t('trainerSchool.saved'))
  }

  function go(path) {
    if (dirty && !window.confirm(t('courseEditor.unsavedChangesDesc'))) return
    navigate(path)
  }

  function discard() {
    const initial = schoolForm(school)
    setForm(initial)
    setBaseline(JSON.stringify(initial))
    setSlugStatus(null)
    setSlugSuggestions([])
    setTouched({})
    setCopied(false)
    setDiscardOpen(false)
  }

  function focusPreview() {
    document.getElementById('school-preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={t('nav.trainer')}
        title={t('trainerSchool.title')}
        description={t('trainerSchool.subtitle')}
        actions={
          <>
            <Button variant="ghost" icon={RotateCcw} disabled={!dirty} onClick={() => setDiscardOpen(true)}>{t('common.reset')}</Button>
            <Button variant="secondary" icon={ExternalLink} onClick={openSite}>{t('trainerSchool.viewSite')}</Button>
            <Button icon={CheckCircle2} loading={saving} onClick={save}>{t('trainerSchool.save')}</Button>
          </>
        }
      />

      <Card className="overflow-hidden border-brand/20 shadow-sm">
        <div className="relative overflow-hidden px-5 pb-6 pt-5 sm:px-7" style={{ background: `linear-gradient(135deg, ${form.brandAccent || '#0D7A6A'} 0%, #0B3D3A 100%)` }}>
          <div className="pointer-events-none absolute -end-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-24 start-1/3 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-white/90 backdrop-blur">
              <Globe2 size={12} /> {t('trainerSchool.publicSite')}
            </span>
            <Badge tone={published ? 'success' : 'warning'} dot className="border-white/20 bg-white/15 text-white">{published ? t('trainerSchool.published') : t('common.draft')}</Badge>
          </div>
          <div className="relative mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white/15 text-white ring-1 ring-white/30 backdrop-blur">
                {form.logo ? <img src={form.logo} alt={form.name || school.name} className="h-full w-full object-cover" /> : <Building2 size={28} />}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xl font-bold text-white sm:text-2xl">{form.name || school.name}</p>
                <p className="mt-1 line-clamp-2 max-w-xl text-xs leading-relaxed text-white/80">{form.description || t('trainerSchool.descriptionPlaceholder')}</p>
                <code className="mt-2 inline-block max-w-full truncate rounded-md bg-white/10 px-2 py-0.5 text-[11px] text-white/90 ring-1 ring-white/20" dir="ltr">{form.slug || school.slug}.tiwanza.com</code>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" icon={Link2} onClick={copyLink} aria-label={t('trainerSchool.copyLink')}>{copied ? t('common.copied') : t('trainerSchool.copyLink')}</Button>
              <Button variant="soft" size="sm" icon={published ? EyeOff : Eye} onClick={toggleSite}>{published ? t('trainerCourses.unpublish') : t('trainerCourses.publish')}</Button>
              <Button variant="soft" size="sm" icon={ExternalLink} onClick={openSite}>{t('trainerSchool.viewSite')}</Button>
            </div>
          </div>
          <div className="relative mt-5 flex flex-wrap items-center gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-white/80">{t('onboarding.progress')}</span>
            <div className="w-full max-w-xs"><ProgressBar value={completeness} size="sm" tone={completeness === 100 ? 'success' : 'brand'} showLabel /></div>
            <Badge className="border-white/20 bg-white/15 text-white">{completedChecks}/{checks.length} {t('onboarding.completed')}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-line bg-surface px-5 py-3 sm:px-7">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted"><Globe2 size={12} /> {t('trainerSchool.slug')}</span>
          <code className="min-w-0 flex-1 truncate rounded-lg bg-white px-2.5 py-1 text-xs text-ink ring-1 ring-line" dir="ltr">{siteUrl}</code>
          <Badge tone="neutral">{form.language === 'ar' ? t('common.arabic') : form.language === 'en' ? t('common.english') : t('common.french')}</Badge>
          {dirty ? <Badge tone="warning" dot>{t('courseEditor.unsavedChanges')}</Badge> : null}
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line px-5 py-3 text-[11px] text-muted sm:px-7">
          {form.contactEmail ? <span className="inline-flex items-center gap-1.5"><Mail size={13} />{form.contactEmail}</span> : null}
          {form.contactPhone ? <span className="inline-flex items-center gap-1.5" dir="ltr"><Phone size={13} />{form.contactPhone}</span> : null}
          {form.city ? <span className="inline-flex items-center gap-1.5"><MapPin size={13} />{form.city}</span> : null}
          <span className="ms-auto inline-flex items-center gap-1.5"><Sparkles size={13} className="text-brand" />{t('app.demoBadge')}</span>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('subscription.usageCourses')} value={usage.courses} hint={t('common.courses')} icon={BookOpen} tone="brand" />
        <StatCard label={t('common.published')} value={usage.published} hint={t('trainerSchool.publicSite')} icon={CheckCircle2} tone="success" />
        <StatCard label={t('subscription.usageLearners')} value={usage.learners} hint={t('common.students')} icon={Users} tone="blue" />
        <StatCard label={t('trainerPaymentSettings.paymentMethods')} value={paymentCount} hint={t('trainerPaymentSettings.title')} icon={CreditCard} tone="amber" />
      </div>

      <Card id="school-preview" className="overflow-hidden">
        <CardHeader
          title={t('onboarding.schoolPreview')}
          description={t('trainerSchool.publicSiteDesc')}
          action={
            <Tabs
              variant="pills"
              value={previewMode}
              onChange={setPreviewMode}
              items={[
                { value: 'desktop', label: t('common.web'), icon: Monitor },
                { value: 'mobile', label: t('common.phone'), icon: Smartphone },
              ]}
            />
          }
        />
        <div className="bg-surface/60 p-4 sm:p-6">
          <div className={cn('mx-auto overflow-hidden rounded-xl border border-line bg-white shadow-sm transition-all', previewMode === 'desktop' ? 'w-full' : 'w-full max-w-[340px]')}>
            <div className="flex items-center gap-2 border-b border-line bg-surface px-3 py-2">
              <span className="flex shrink-0 gap-1.5" aria-hidden="true">
                <span className="h-2 w-2 rounded-full bg-danger/60" />
                <span className="h-2 w-2 rounded-full bg-warning/60" />
                <span className="h-2 w-2 rounded-full bg-success/60" />
              </span>
              <div className="ms-2 flex min-w-0 flex-1 items-center gap-1.5 rounded-md border border-line bg-white px-2 py-1 text-[10px] text-muted">
                <Globe2 size={11} className="shrink-0" />
                <span className="truncate" dir="ltr">{form.slug || school.slug}.tiwanza.com</span>
              </div>
            </div>
            <div className="relative">
              <div className="px-4 py-6 sm:px-6" style={{ background: `linear-gradient(135deg, ${form.brandAccent || '#0D7A6A'} 0%, #0B3D3A 100%)` }}>
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-white/15 text-white ring-1 ring-white/25">
                    {form.logo ? <img src={form.logo} alt="" className="h-full w-full object-cover" /> : <Building2 size={18} />}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">{form.name || school.name}</p>
                    <p className="truncate text-[10px] text-white/75">{form.category || t('trainerSchool.category')}</p>
                  </div>
                </div>
                <p className="mt-3 line-clamp-2 text-[11px] leading-relaxed text-white/85">{form.description || t('trainerSchool.descriptionPlaceholder')}</p>
              </div>
              <div className="p-4 sm:p-5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-ink">{t('common.courses')}</p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand">{t('common.viewAll')} <ArrowRight size={11} className="rtl:rotate-180" /></span>
                </div>
                <div className={cn('mt-3 grid gap-2', previewMode === 'desktop' ? 'sm:grid-cols-3' : 'grid-cols-1')}>
                  {siteCourses.length ? siteCourses.map((course) => (
                    <div key={course.id} className="rounded-lg border border-line bg-white p-2.5">
                      <span className="block h-8 rounded-md" style={{ background: form.brandAccent || '#0D7A6A', opacity: 0.18 }} />
                      <p className="mt-2 line-clamp-2 text-[10px] font-semibold text-ink">{course.title}</p>
                      <p className="mt-1 text-[9px] text-muted">{course.isFree ? t('common.free') : `${course.priceDA} DA`}</p>
                    </div>
                  )) : <div className="col-span-full rounded-lg border border-dashed border-line p-4 text-center text-[10px] text-muted">{t('common.empty')}</div>}
                </div>
              </div>
              {!published ? <div className="absolute inset-0 grid place-items-center bg-white/70 backdrop-blur-[1px]"><Badge tone="warning" dot>{t('common.draft')}</Badge></div> : null}
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <Tabs
          value={activeTab}
          onChange={setActiveTab}
          items={[
            { value: 'identity', label: t('trainerSchool.general'), icon: Building2 },
            { value: 'contact', label: t('trainerSchool.seo'), icon: Globe2 },
            { value: 'actions', label: t('trainerSchool.publicSite'), icon: Sparkles },
          ]}
        />

        {activeTab === 'identity' ? (
          <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
            <Card>
              <CardHeader title={t('trainerSchool.general')} description={t('onboarding.schoolSubtitle')} />
              <datalist id="school-categories">
                {categories.map((category) => <option key={category} value={category} />)}
              </datalist>
              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="school-name" required>{t('trainerSchool.name')}</Label>
                  <Input id="school-name" aria-label={t('trainerSchool.name')} value={form.name} error={Boolean(touched.name && nameError)} onChange={(event) => set('name', event.target.value)} onBlur={() => touch('name')} />
                  <FieldError>{touched.name ? nameError : ''}</FieldError>
                </div>
                <div>
                  <Label htmlFor="school-slug" required hint={t('trainerSchool.slugHint')}>{t('trainerSchool.slug')}</Label>
                  <div className="relative">
                    <Input id="school-slug" aria-label={t('trainerSchool.slug')} value={form.slug} error={Boolean(slugError)} onChange={(event) => { set('slug', event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')); setSlugStatus(null); setSlugSuggestions([]) }} onBlur={checkSlug} className="pe-20" dir="ltr" />
                    <span className="absolute end-3 top-1/2 -translate-y-1/2 text-[10px] text-muted">.tiwanza.com</span>
                  </div>
                  <FieldError>{slugError}</FieldError>
                  {slugStatus === 'available' ? <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-success"><CheckCircle2 size={12} />{t('trainerSchool.slugAvailable')}</p> : null}
                  {slugSuggestions.length ? (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] text-muted">{t('common.example')}</span>
                      {slugSuggestions.map((suggestion) => (
                        <button key={suggestion} type="button" dir="ltr" aria-label={`${t('common.select')} ${suggestion}`} onClick={() => { set('slug', suggestion); setSlugStatus(null); setSlugSuggestions([]) }} className="rounded-full border border-line bg-surface px-2 py-0.5 text-[10px] font-medium text-ink transition hover:border-brand hover:text-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20">{suggestion}</button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div>
                  <Label htmlFor="school-category">{t('trainerSchool.category')}</Label>
                  <Input id="school-category" list="school-categories" aria-label={t('trainerSchool.category')} value={form.category} onChange={(event) => set('category', event.target.value)} placeholder={t('common.select')} />
                </div>
                <div>
                  <Label htmlFor="school-language">{t('trainerSchool.language')}</Label>
                  <Select id="school-language" aria-label={t('trainerSchool.language')} value={form.language} onChange={(event) => set('language', event.target.value)}>
                    <option value="fr">{t('common.french')}</option>
                    <option value="en">{t('common.english')}</option>
                    <option value="ar">{t('common.arabic')}</option>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="school-description">{t('trainerSchool.description')}</Label>
                  <Textarea id="school-description" aria-label={t('trainerSchool.description')} rows={4} value={form.description} error={Boolean(touched.description && descriptionError)} onChange={(event) => set('description', event.target.value)} onBlur={() => touch('description')} placeholder={t('trainerSchool.descriptionPlaceholder')} maxLength={320} />
                  <FieldError>{touched.description ? descriptionError : ''}</FieldError>
                  <p className="mt-1 text-[10px] text-muted">{form.description.length} / 300 {t('common.characters')}</p>
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="school-accent">{t('trainerSchool.primaryColor')}</Label>
                  <div className="flex items-center gap-2">
                    <input id="school-accent" type="color" aria-label={t('trainerSchool.primaryColor')} value={form.brandAccent} onChange={(event) => set('brandAccent', event.target.value)} className="h-10 w-12 cursor-pointer rounded-lg border border-line bg-white p-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20" />
                    <Input aria-label={t('trainerSchool.primaryColor')} value={form.brandAccent} onChange={(event) => set('brandAccent', event.target.value)} className="flex-1" dir="ltr" />
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader title={t('trainerSchool.branding')} description={t('trainerSchool.logoHint')} />
              <div className="space-y-4 p-5">
                <div className="flex items-center gap-4">
                  <Avatar name={form.name || school.name} src={form.logo} size="xl" />
                  <div className="min-w-0 flex-1">
                    <Label>{t('trainerSchool.logo')}</Label>
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-line px-3 py-2 text-xs font-medium text-muted transition hover:border-brand hover:text-brand focus-within:border-brand focus-within:text-brand focus-within:ring-4 focus-within:ring-brand/20">
                      <Upload size={14} />{t('common.upload')}
                      <input id="school-logo" type="file" accept="image/png,image/jpeg,image/svg+xml" className="sr-only" aria-label={t('trainerSchool.logo')} onChange={pickLogo} />
                    </label>
                    {form.logo ? <button type="button" onClick={() => set('logo', null)} className="mt-2 text-[10px] font-medium text-danger transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/30">{t('trainerSchool.removeLogo')}</button> : null}
                  </div>
                </div>
                <div className="rounded-xl border border-line bg-surface p-3">
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted"><Palette size={12} />{t('trainerSchool.preview')}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white" style={{ background: form.brandAccent }}><Building2 size={16} /></span>
                    <div className="min-w-0"><p className="truncate text-xs font-semibold text-ink">{form.name || school.name}</p><p className="truncate text-[10px] text-muted" dir="ltr">{form.slug || school.slug}.tiwanza.com</p></div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ) : null}

        {activeTab === 'contact' ? (
          <Card>
            <CardHeader title={t('trainerSchool.seo')} description={t('trainerSchool.metaDescriptionHint')} />
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="school-meta-title">{t('trainerSchool.metaTitle')}</Label>
                <Input id="school-meta-title" aria-label={t('trainerSchool.metaTitle')} value={form.metaTitle} onChange={(event) => set('metaTitle', event.target.value)} maxLength={70} />
                <p className="mt-1 text-[10px] text-muted">{form.metaTitle.length} / 70 {t('common.characters')}</p>
              </div>
              <div>
                <Label htmlFor="school-meta-description">{t('trainerSchool.metaDescription')}</Label>
                <Textarea id="school-meta-description" aria-label={t('trainerSchool.metaDescription')} rows={2} value={form.metaDescription} onChange={(event) => set('metaDescription', event.target.value)} maxLength={160} />
                <p className="mt-1 text-[10px] text-muted">{form.metaDescription.length} / 160 {t('common.characters')}</p>
              </div>
              <div>
                <Label htmlFor="school-email">{t('trainerSchool.email')}</Label>
                <Input id="school-email" type="email" aria-label={t('trainerSchool.email')} value={form.contactEmail} error={Boolean(emailError)} onChange={(event) => set('contactEmail', event.target.value)} dir="ltr" />
                <FieldError>{emailError}</FieldError>
              </div>
              <div>
                <Label htmlFor="school-phone">{t('trainerSchool.phone')}</Label>
                <Input id="school-phone" aria-label={t('trainerSchool.phone')} value={form.contactPhone} onChange={(event) => set('contactPhone', event.target.value)} dir="ltr" />
              </div>
              <div>
                <Label htmlFor="school-city">{t('trainerSchool.city')}</Label>
                <Input id="school-city" aria-label={t('trainerSchool.city')} value={form.city} onChange={(event) => set('city', event.target.value)} />
              </div>
            </div>
          </Card>
        ) : null}

        {activeTab === 'actions' ? (
          <Card>
            <CardHeader title={t('trainerSchool.publicSite')} description={t('trainerSchool.publicSiteDesc')} action={<Badge tone={published ? 'success' : 'warning'} dot>{published ? t('trainerSchool.published') : t('common.draft')}</Badge>} />
            <div className="space-y-4 p-5">
              <button type="button" onClick={copyLink} aria-label={t('trainerSchool.copyLink')} className="flex w-full items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2.5 text-start text-xs text-muted transition hover:border-brand hover:text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20">
                <Link2 size={15} className="shrink-0 text-brand" />
                <span className="min-w-0 flex-1 truncate" dir="ltr">{sitePath}</span>
                <span className="shrink-0 font-semibold text-brand">{copied ? t('common.copied') : t('trainerSchool.copyLink')}</span>
              </button>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button variant="secondary" size="sm" icon={Eye} onClick={focusPreview}>{t('common.preview')}</Button>
                <Button variant="secondary" size="sm" icon={ExternalLink} onClick={openSite}>{t('trainerSchool.viewSite')}</Button>
                <Button variant={published ? 'soft' : 'secondary'} size="sm" icon={published ? EyeOff : Eye} onClick={toggleSite}>{published ? t('trainerCourses.unpublish') : t('trainerCourses.publish')}</Button>
                <Button variant="secondary" size="sm" icon={CreditCard} onClick={() => go('/trainer/payment-settings')}>{t('trainerPaymentSettings.title')}</Button>
                <Button variant="secondary" size="sm" icon={ShieldCheck} onClick={() => go('/trainer/subscription')}>{t('subscription.title')}</Button>
                <Button variant="secondary" size="sm" icon={BookOpen} onClick={() => go('/trainer/courses')}>{t('common.courses')}</Button>
              </div>
            </div>
          </Card>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-muted">
          {dirty ? <Badge tone="warning" dot>{t('courseEditor.unsavedChanges')}</Badge> : lastSavedAt ? <Badge tone="success" dot>{t('courseEditor.lastSaved', { time: time(lastSavedAt) })}</Badge> : <Badge tone="neutral">{t('courseEditor.notSavedYet')}</Badge>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" icon={RotateCcw} disabled={!dirty} onClick={() => setDiscardOpen(true)}>{t('common.reset')}</Button>
          <Button size="sm" icon={CheckCircle2} loading={saving} onClick={save}>{t('trainerSchool.save')}</Button>
        </div>
      </div>

      <ConfirmDialog
        open={discardOpen}
        onClose={() => setDiscardOpen(false)}
        onConfirm={discard}
        title={t('courseEditor.unsavedChanges')}
        description={t('courseEditor.unsavedChangesDesc')}
        confirmLabel={t('common.reset')}
        cancelLabel={t('common.cancel')}
      />
    </div>
  )
}

function schoolForm(school) {
  if (!school) return { name: '', slug: '', description: '', category: '', contactEmail: '', contactPhone: '', city: '', language: 'fr', brandAccent: '#0D7A6A', logo: null, metaTitle: '', metaDescription: '' }
  return {
    name: school.name || '',
    slug: school.slug || '',
    description: school.description || '',
    category: school.category || '',
    contactEmail: school.contactEmail || '',
    contactPhone: school.contactPhone || '',
    city: school.city || '',
    language: school.language || 'fr',
    brandAccent: school.brandAccent || '#0D7A6A',
    logo: school.logo || null,
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

  function setChargerly(key, value) { setForm((current) => ({ ...current, chargerly: { ...current.chargerly, [key]: value } })) }
  function setManual(key, value) { setForm((current) => ({ ...current, manual: { ...current.manual, [key]: value } })) }
  function setManualMethod(method, value) { setForm((current) => ({ ...current, manual: { ...current.manual, methods: { ...current.manual.methods, [method]: value } } })) }
  function setBank(key, value) { setForm((current) => ({ ...current, manual: { ...current.manual, bank: { ...current.manual.bank, [key]: value } } })) }

  function manualMethodValid(method) {
    const manual = form.manual
    if (method === 'ccp') return Boolean(manual.ccp.trim())
    if (method === 'baridimob') return Boolean(manual.baridimob.trim())
    if (method === 'bankTransfer') return Boolean(manual.bank.rib.trim() || manual.bank.name.trim())
    if (method === 'cash') return Boolean(manual.cashInstructionsFr.trim() || manual.cashInstructionsAr.trim())
    if (method === 'inPerson') return Boolean(manual.inPersonInstructionsFr.trim() || manual.inPersonInstructionsAr.trim())
    return false
  }

  function save() {
    if (!form.chargerly.enabled && !form.manual.enabled) return toastError(t('trainerPaymentSettings.enableAtLeastOne'))
    if (form.chargerly.enabled) {
      if (!form.chargerly.edahabia && !form.chargerly.cib) return toastError(t('trainerPaymentSettings.selectOnlineCard'))
      if (!form.chargerly.accountName.trim()) return toastError(t('trainerPaymentSettings.accountNameRequired'))
    }
    if (form.manual.enabled) {
      const activeMethods = COURSE_MANUAL_METHODS.filter((method) => form.manual.methods[method])
      if (!activeMethods.length) return toastError(t('trainerPaymentSettings.selectManualMethod'))
      const missing = activeMethods.find((method) => !manualMethodValid(method))
      if (missing) return toastError(t('trainerPaymentSettings.methodDetailsRequired', { method: t(paymentMethodLabelKey(missing)) }))
    }
    const { enabled, ...chargerly } = form.chargerly
    updateSchoolPaymentSettings(school.id, {
      chargerly: {
        ...chargerly,
        status: enabled && chargerly.accountName ? 'connected' : 'disconnected',
        accountName: chargerly.accountName,
        mode: chargerly.mode,
        edahabia: chargerly.edahabia,
        cib: chargerly.cib,
      },
      manual: {
        ...form.manual,
        enabled: form.manual.enabled,
        ccp: form.manual.ccp.trim(),
        baridimob: form.manual.baridimob.trim(),
        beneficiary: form.manual.beneficiary.trim(),
        bank: {
          name: form.manual.bank.name.trim(),
          agency: form.manual.bank.agency.trim(),
          rib: form.manual.bank.rib.trim(),
        },
        instructionsFr: form.manual.instructionsFr.trim(),
        instructionsAr: form.manual.instructionsAr.trim(),
        cashInstructionsFr: form.manual.cashInstructionsFr.trim(),
        cashInstructionsAr: form.manual.cashInstructionsAr.trim(),
        inPersonInstructionsFr: form.manual.inPersonInstructionsFr.trim(),
        inPersonInstructionsAr: form.manual.inPersonInstructionsAr.trim(),
        delay: form.manual.delay.trim(),
        methods: { ...form.manual.methods },
      },
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
      <PageHeader eyebrow={t('nav.trainer')} title={t('trainerPaymentSettings.title')} description={t('trainerPaymentSettings.subtitle')} actions={<Button icon={CheckCircle2} onClick={save}>{t('trainerPaymentSettings.save')}</Button>} />
      <Alert tone="info" title={t('trainerPaymentSettings.paymentNotice')}>{t('trainerPaymentSettings.paymentNotice')}</Alert>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title={t('trainerPaymentSettings.onlinePayments')} description={t('trainerPaymentSettings.onlinePaymentsDesc')} action={<Badge tone={form.chargerly.enabled ? 'success' : 'neutral'} dot>{form.chargerly.enabled ? t('common.active') : t('common.inactive')}</Badge>} />
          <div className={cn('space-y-4 p-5', !form.chargerly.enabled && 'pointer-events-none opacity-50')}>
            <div className="rounded-xl border border-line bg-white p-3">
              <Switch checked={form.chargerly.enabled} onChange={(event) => setChargerly('enabled', event.target.checked)} label={t('common.active')} description={t('trainerPaymentSettings.onlinePaymentsDesc')} />
            </div>
            <div>
              <Label>{t('trainerPaymentSettings.cardTypes')}</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {COURSE_ONLINE_METHODS.map((method) => (
                  <div key={method} className={cn('rounded-xl border p-3', form.chargerly[method] ? 'border-brand/30 bg-brand-soft/30' : 'border-line bg-surface')}>
                    <Switch checked={Boolean(form.chargerly[method])} onChange={(event) => setChargerly(method, event.target.checked)} label={t(paymentMethodLabelKey(method))} description={t(paymentMethodDescriptionKey(method))} />
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><Label htmlFor="chargerly-account">{t('common.account')}</Label><Input id="chargerly-account" aria-label={t('common.account')} value={form.chargerly.accountName} onChange={(event) => setChargerly('accountName', event.target.value)} placeholder={school.name} /></div>
              <div><Label htmlFor="chargerly-mode">{t('common.mode')}</Label><Select id="chargerly-mode" aria-label={t('common.mode')} value={form.chargerly.mode} onChange={(event) => setChargerly('mode', event.target.value)}><option value="test">Test</option><option value="live">Production</option></Select></div>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-surface p-3">
              <div className="min-w-0"><p className="text-xs font-semibold text-ink">{t('common.status')}</p><p className="truncate text-[10px] text-muted">{form.chargerly.accountName || t('trainerPaymentSettings.configure')}</p></div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge tone={form.chargerly.status === 'connected' ? 'success' : 'neutral'}>{form.chargerly.status === 'connected' ? t('common.connected') : t('common.disconnected')}</Badge>
                <Button variant="soft" size="xs" loading={testing} onClick={testConnection}>{t('common.test')}</Button>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title={t('trainerPaymentSettings.manualPayments')} description={t('trainerPaymentSettings.manualPaymentsDesc')} action={<Badge tone={form.manual.enabled ? 'success' : 'neutral'} dot>{form.manual.enabled ? t('common.active') : t('common.inactive')}</Badge>} />
          <div className={cn('space-y-4 p-5', !form.manual.enabled && 'pointer-events-none opacity-50')}>
            <div className="rounded-xl border border-line bg-white p-3">
              <Switch checked={form.manual.enabled} onChange={(event) => setManual('enabled', event.target.checked)} label={t('common.active')} description={t('trainerPaymentSettings.manualPaymentsDesc')} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><Label htmlFor="manual-beneficiary">{t('trainerPaymentSettings.accountName')}</Label><Input id="manual-beneficiary" aria-label={t('trainerPaymentSettings.accountName')} value={form.manual.beneficiary} onChange={(event) => setManual('beneficiary', event.target.value)} /></div>
              <div><Label htmlFor="manual-currency">{t('trainerPaymentSettings.currency')}</Label><Select id="manual-currency" aria-label={t('trainerPaymentSettings.currency')} value="DA" disabled><option value="DA">{t('trainerPaymentSettings.currencyDA')}</option></Select></div>
            </div>
            <div className="space-y-3">
              {COURSE_MANUAL_METHODS.map((method) => (
                <div key={method} className={cn('rounded-xl border p-4', form.manual.methods[method] ? 'border-brand/30 bg-brand-soft/20' : 'border-line bg-surface/50')}>
                  <Switch checked={Boolean(form.manual.methods[method])} onChange={(event) => setManualMethod(method, event.target.checked)} label={t(paymentMethodLabelKey(method))} description={t(paymentMethodDescriptionKey(method))} />
                  {form.manual.methods[method] ? (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                       {method === 'ccp' ? <div className="sm:col-span-2"><Label htmlFor="manual-ccp">{t('payments.ccp')}</Label><Input id="manual-ccp" aria-label={t('payments.ccp')} value={form.manual.ccp} onChange={(event) => setManual('ccp', event.target.value)} dir="ltr" /></div> : null}
                       {method === 'baridimob' ? <div className="sm:col-span-2"><Label htmlFor="manual-baridimob">{t('payments.baridimob')}</Label><Input id="manual-baridimob" aria-label={t('payments.baridimob')} value={form.manual.baridimob} onChange={(event) => setManual('baridimob', event.target.value)} dir="ltr" /></div> : null}
                      {method === 'bankTransfer' ? (
                        <>
                           <div><Label htmlFor="bank-name">{t('trainerPaymentSettings.bankName')}</Label><Input id="bank-name" aria-label={t('trainerPaymentSettings.bankName')} value={form.manual.bank.name} onChange={(event) => setBank('name', event.target.value)} /></div>
                           <div><Label htmlFor="bank-agency">{t('common.agency')}</Label><Input id="bank-agency" aria-label={t('common.agency')} value={form.manual.bank.agency} onChange={(event) => setBank('agency', event.target.value)} /></div>
                           <div className="sm:col-span-2"><Label htmlFor="bank-rib">{t('trainerPaymentSettings.rib')}</Label><Input id="bank-rib" aria-label={t('trainerPaymentSettings.rib')} value={form.manual.bank.rib} onChange={(event) => setBank('rib', event.target.value)} dir="ltr" /></div>
                          <div className="sm:col-span-2"><Label>{t('trainerPaymentSettings.manualInstructions')} (FR)</Label><Textarea rows={2} value={form.manual.instructionsFr} onChange={(event) => setManual('instructionsFr', event.target.value)} placeholder={t('trainerPaymentSettings.manualInstructionsPlaceholder')} /></div>
                          <div className="sm:col-span-2"><Label>{t('trainerPaymentSettings.manualInstructions')} (AR)</Label><Textarea rows={2} value={form.manual.instructionsAr} onChange={(event) => setManual('instructionsAr', event.target.value)} dir="rtl" /></div>
                        </>
                      ) : null}
                      {method === 'cash' ? (
                        <>
                          <div className="sm:col-span-2"><Label>{t('trainerPaymentSettings.manualInstructions')} (FR)</Label><Textarea rows={2} value={form.manual.cashInstructionsFr} onChange={(event) => setManual('cashInstructionsFr', event.target.value)} placeholder={t('checkout.cashLocation')} /></div>
                          <div className="sm:col-span-2"><Label>{t('trainerPaymentSettings.manualInstructions')} (AR)</Label><Textarea rows={2} value={form.manual.cashInstructionsAr} onChange={(event) => setManual('cashInstructionsAr', event.target.value)} dir="rtl" /></div>
                        </>
                      ) : null}
                      {method === 'inPerson' ? (
                        <>
                          <div className="sm:col-span-2"><Label>{t('trainerPaymentSettings.manualInstructions')} (FR)</Label><Textarea rows={2} value={form.manual.inPersonInstructionsFr} onChange={(event) => setManual('inPersonInstructionsFr', event.target.value)} placeholder={t('checkout.inPersonLocation')} /></div>
                          <div className="sm:col-span-2"><Label>{t('trainerPaymentSettings.manualInstructions')} (AR)</Label><Textarea rows={2} value={form.manual.inPersonInstructionsAr} onChange={(event) => setManual('inPersonInstructionsAr', event.target.value)} dir="rtl" /></div>
                        </>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
            <div><Label htmlFor="manual-delay">{t('common.delay')}</Label><Input id="manual-delay" aria-label={t('common.delay')} value={form.manual.delay} onChange={(event) => setManual('delay', event.target.value)} placeholder={t('common.businessDaysExample')} /></div>
          </div>
        </Card>
      </div>
    </div>
  )
}

function paymentForm(school) {
  const defaults = defaultSchoolPaymentSettings()
  const chargerly = school?.paymentSettings?.chargerly || {}
  const manual = school?.paymentSettings?.manual || {}
  return {
    chargerly: {
      ...defaults.chargerly,
      ...chargerly,
      enabled: chargerly.status === 'connected',
      status: chargerly.status || defaults.chargerly.status,
      mode: chargerly.mode || defaults.chargerly.mode,
      accountName: chargerly.accountName || '',
      edahabia: chargerly.edahabia !== false,
      cib: chargerly.cib !== false,
    },
    manual: {
      ...defaults.manual,
      ...manual,
      bank: { ...defaults.manual.bank, ...(manual.bank || {}) },
      methods: { ...defaults.manual.methods, ...(manual.methods || {}) },
      ccp: manual.ccp || '',
      baridimob: manual.baridimob || '',
      beneficiary: manual.beneficiary || school?.name || '',
      delay: manual.delay || defaults.manual.delay,
      instructionsFr: manual.instructionsFr || '',
      instructionsAr: manual.instructionsAr || '',
      cashInstructionsFr: manual.cashInstructionsFr || '',
      cashInstructionsAr: manual.cashInstructionsAr || '',
      inPersonInstructionsFr: manual.inPersonInstructionsFr || '',
      inPersonInstructionsAr: manual.inPersonInstructionsAr || '',
    },
  }
}

export function TrainerSubscription() {
  const { user, state, school, profile, subscription } = useTrainerSchool()
  const { t, language, money, date } = useI18n()
  const { success, error: toastError } = useToast()
  const [checkout, setCheckout] = useState(null)
  const [selectedMethod, setSelectedMethod] = useState('')
  const [reference, setReference] = useState('')
  const [proofName, setProofName] = useState('')
  const [proofData, setProofData] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)

  if (!school || !profile) return <EmptyState icon={ShieldCheck} title={t('subscription.noSubscription')} description={t('subscription.noSubscriptionDesc')} />

  const plans = getPlans(state)
  const currentPlan = getPlan(state, profile.planId) || getPlan(state, subscription?.planId)
  const usage = getPlanUsage(state, school.id)
  const active = isSubscriptionActive(subscription)
  const pending = state.subscriptionPayments.find((payment) => payment.trainerId === user.id && payment.status === 'pending')
  const history = state.subscriptionPayments.filter((payment) => payment.trainerId === user.id).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
  const remaining = subscription?.endsAt ? Math.max(0, Math.ceil((new Date(subscription.endsAt) - Date.now()) / 86400000)) : null
  const paymentOptions = getSubscriptionPaymentOptions(state)
  const onlineOptions = paymentOptions.filter((option) => option.group === 'online')
  const manualOptions = paymentOptions.filter((option) => option.group === 'manual')
  const selectedOption = paymentOptions.find((option) => option.id === selectedMethod)
  const needsReference = !['cash', 'inPerson'].includes(selectedMethod)
  const planName = (plan) => getPlanName(plan, language)
  const planDescription = (plan) => getPlanDescription(plan, language)

  function renew() {
    const result = renewSubscription(user.id, 1)
    if (!result.ok) return toastError(t('errors.generic'))
    success(t('subscription.renew'))
  }

  function openCheckout(plan) {
    if (!paymentOptions.length) return toastError(t('checkout.noPaymentMethods'))
    setSelectedMethod(paymentOptions[0].id)
    setReference('')
    setProofName('')
    setProofData(null)
    setCheckout(plan)
  }

  function closeCheckout() {
    setCheckout(null)
    setProcessing(false)
  }

  function payOnline() {
    setProcessing(true)
    const result = submitSubscriptionOnline({ userId: user.id, planId: checkout.id, provider: selectedMethod, outcome: 'success' })
    setProcessing(false)
    if (!result.ok) return toastError(t('subscription.paymentFailed'))
    success(t('subscription.paymentSuccess'))
    closeCheckout()
  }

  function submitManual() {
    if (needsReference && !reference.trim()) return toastError(t('checkout.referenceRequired'))
    if (!proofName) return toastError(t('subscription.receiptRequired'))
    const result = submitSubscriptionManual({
      userId: user.id,
      planId: checkout.id,
      method: selectedMethod,
      reference: reference.trim(),
      proofName,
      proofDataUrl: proofData,
    })
    if (!result.ok) return toastError(t('subscription.paymentFailed'))
    success(t('subscription.manualSuccess'))
    closeCheckout()
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
    { label: t('subscription.usageTrainers'), used: 1, limit: usage.limits.trainers },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={t('nav.trainer')}
        title={t('subscription.title')}
        description={t('subscription.subtitle')}
        actions={
          <>
            {['expired', 'cancelled', 'suspended'].includes(subscription?.status) ? (
              <Button variant="secondary" icon={RotateCcw} onClick={renew}>{t('subscription.renew')}</Button>
            ) : null}
            {subscription?.status === 'active' ? <Button variant="dangerSoft" onClick={() => setCancelOpen(true)}>{t('subscription.cancelPlan')}</Button> : null}
          </>
        }
      />
      {!active ? <Alert tone="danger" title={t(`subscription.${subscription?.status || 'noSubscription'}`)}>{pending ? t('subscription.pendingReviewDesc') : t('subscription.expiredNotice')}</Alert> : null}
      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader title={t('subscription.currentPlan')} description={t('trainer.planUsageDesc')} action={<StatusPill status={active ? 'active' : subscription?.status || 'pending'} t={t} />} />
          <div className="p-5">
            <div className="flex items-center gap-4 rounded-xl bg-surface p-4"><span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-soft text-brand"><ShieldCheck size={24} /></span><div className="min-w-0 flex-1"><p className="text-base font-bold text-ink">{planName(currentPlan) || '—'}</p><p className="text-xs text-muted">{planDescription(currentPlan) || t('subscription.paymentRequired')}</p></div><div className="text-end"><p className="text-lg font-bold text-ink">{money(currentPlan?.priceDA || 0)}</p><p className="text-[10px] text-muted">{t('subscription.perMonth')}</p></div></div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3"><InfoCell label={t('subscription.startDate')} value={subscription?.startedAt ? date(subscription.startedAt) : '—'} /><InfoCell label={active ? t('subscription.renewsOn') : t('subscription.endDate')} value={subscription?.endsAt ? date(subscription.endsAt) : '—'} /><InfoCell label={t('subscription.status')} value={remaining !== null ? t('subscription.daysRemaining', { count: remaining }) : t(`subscription.${subscription?.status || 'none'}`)} /></div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">{usageRows.map((row) => <InfoCell key={row.label} label={row.label} value={row.limit === -1 || row.limit === null || row.limit === undefined ? `${row.used} / ${t('common.unlimited')}` : `${row.used} / ${row.limit}`} />)}</div>
          </div>
        </Card>

        <div className="space-y-3">
          <div className="px-1">
            <h3 className="text-sm font-semibold text-ink">{t('subscription.planComparison')}</h3>
            <p className="mt-0.5 text-xs text-muted">{t('subscription.upgradeNotice')}</p>
          </div>
          <PlanComparison
            plans={plans}
            currentPlanId={active ? currentPlan?.id : null}
            pending={subscription?.status === 'pending'}
            renderAction={(plan, meta) => {
              if (meta.current) return <Badge tone="success" dot>{t('plans.current')}</Badge>
              if (meta.pending) return <Button size="sm" fullWidth disabled>{t('subscription.pendingActivation')}</Button>
              return (
                <Button size="sm" fullWidth icon={CreditCard} onClick={() => openCheckout(plan)}>
                  {plan.recommended ? t('subscription.changePlan') : t('subscription.choosePlan')}
                </Button>
              )
            }}
          />
        </div>
      </div>

      <Card>
        <CardHeader title={t('subscription.history')} description={t('subscription.historyEmptyDesc')} />
        {history.length ? <Table><thead><tr><th>{t('subscription.invoice')}</th><th>{t('subscription.plan')}</th><th>{t('subscription.amount')}</th><th className="hidden sm:table-cell">{t('subscription.method')}</th><th className="hidden sm:table-cell">{t('subscription.date')}</th><th>{t('subscription.status')}</th></tr></thead><tbody>{history.map((payment) => <tr key={payment.id}><td className="text-xs font-medium text-ink">{payment.reference}</td><td className="text-xs text-muted">{planName(getPlan(state, payment.planId)) || '—'}</td><td className="text-xs font-semibold text-ink">{money(payment.amount)}</td><td className="hidden sm:table-cell"><Badge tone={payment.method === 'manual' ? 'amber' : 'blue'}>{t(paymentMethodLabelKey(displayPaymentMethod(payment)))}</Badge></td><td className="hidden sm:table-cell text-[11px] text-muted">{date(payment.submittedAt)}</td><td><StatusPill status={payment.status} t={t} /></td></tr>)}</tbody></Table> : <EmptyState icon={Wallet} title={t('subscription.historyEmpty')} description={t('subscription.historyEmptyDesc')} compact />}
      </Card>

      <Modal
        open={Boolean(checkout)}
        onClose={closeCheckout}
        size="lg"
        title={t('subscription.paymentTitle')}
        description={t('subscription.paymentSubtitle')}
        footer={
          <>
            <Button variant="secondary" onClick={closeCheckout}>{t('common.cancel')}</Button>
            <Button loading={processing} disabled={!selectedOption} icon={selectedOption?.group === 'online' ? CreditCard : Wallet} onClick={selectedOption?.group === 'online' ? payOnline : submitManual}>
              {selectedOption?.group === 'online' ? t('subscription.payNow') : t('checkout.submitReceipt')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 rounded-xl bg-surface p-3">
            <div className="min-w-0"><p className="truncate text-xs font-semibold text-ink">{planName(checkout)}</p><p className="text-[10px] text-muted">{t('subscription.perMonth')}</p></div>
            <p className="shrink-0 text-lg font-bold text-brand">{money(checkout?.priceDA || 0)}</p>
          </div>
          {paymentOptions.length ? (
            <>
              <div>
                <Label>{t('checkout.chooseMethod')}</Label>
                <div className="space-y-3">
                  {onlineOptions.length ? (
                    <div>
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted">{t('checkout.onlineGroup')} · {t('payments.chargily')}</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {onlineOptions.map((option) => <MethodOption key={option.id} option={option} selected={selectedMethod === option.id} onSelect={() => setSelectedMethod(option.id)} t={t} />)}
                      </div>
                    </div>
                  ) : null}
                  {manualOptions.length ? (
                    <div>
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted">{t('checkout.manualGroup')}</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {manualOptions.map((option) => <MethodOption key={option.id} option={option} selected={selectedMethod === option.id} onSelect={() => setSelectedMethod(option.id)} t={t} />)}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
              {selectedOption?.group === 'online' ? <Alert tone="info" icon={CreditCard} title={t('checkout.chargilyCheckout')}>{t('checkout.chargilyNotice')}</Alert> : null}
              {selectedOption?.group === 'manual' ? (
                <div className="space-y-3">
                  <Alert tone="info">{t('subscription.manualInstructions')}</Alert>
                  <div className="grid gap-3 sm:grid-cols-2">
                     <div>
                       <Label htmlFor="checkout-reference" required={needsReference}>{t('checkout.reference')}{needsReference ? '' : ` (${t('common.optional')})`}</Label>
                       <Input id="checkout-reference" aria-label={t('checkout.reference')} value={reference} onChange={(event) => setReference(event.target.value)} placeholder="REF-..." dir="ltr" />
                     </div>
                     <div>
                       <Label required>{t('checkout.uploadReceipt')}</Label>
                       <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-line px-3 py-2.5 text-xs text-muted transition hover:border-brand hover:text-brand focus-within:border-brand focus-within:text-brand focus-within:ring-4 focus-within:ring-brand/20">
                         <Upload size={14} />
                         <span className="min-w-0 flex-1 truncate">{proofName || t('checkout.uploadReceipt')}</span>
                         <input type="file" accept="image/*,application/pdf" className="sr-only" aria-label={t('checkout.uploadReceipt')} onChange={pickProof} />
                       </label>
                     </div>
                  </div>
                </div>
              ) : null}
            </>
          ) : <Alert tone="warning" title={t('checkout.noPaymentMethods')}>{t('checkout.noPaymentMethodsDesc')}</Alert>}
        </div>
      </Modal>

      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={cancel}
        title={t('subscription.cancelPlan')}
        description={t('subscription.cancelPlanDesc')}
        confirmLabel={t('subscription.cancelPlan')}
      />
    </div>
  )
}

function MethodOption({ option, selected, onSelect, t }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn('flex items-center gap-2.5 rounded-xl border p-3 text-start transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20', selected ? 'border-brand bg-brand-soft/40' : 'border-line hover:border-brand/40')}
    >
      <span className={cn('grid h-4 w-4 shrink-0 place-items-center rounded-full border', selected ? 'border-brand bg-brand text-white' : 'border-line')}>
        {selected ? <CheckCircle2 size={12} /> : null}
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-semibold text-ink">{t(paymentMethodLabelKey(option.id))}</span>
        <span className="block text-[10px] text-muted">{t(paymentMethodDescriptionKey(option.id))}</span>
      </span>
    </button>
  )
}

function InfoCell({ label, value }) {
  return <div className="rounded-lg bg-surface p-2.5"><p className="text-[9px] uppercase tracking-wide text-muted">{label}</p><p className="mt-0.5 truncate text-[11px] font-semibold text-ink">{value}</p></div>
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
          <CardHeader title={t('common.profile')} description={t('onboarding.helpText')} />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3 sm:col-span-2">
              <Avatar name={user.name} size="lg" />
              <div className="min-w-0"><p className="truncate text-sm font-semibold text-ink">{user.name}</p><p className="truncate text-xs text-muted">{user.email}</p><Badge tone="brand" className="mt-1">{t('roles.trainer')}</Badge></div>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="profile-name">{t('learner.fullName')}</Label>
              <Input id="profile-name" aria-label={t('learner.fullName')} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="profile-email" hint={t('learner.emailNotEditable')}>{t('learner.email')}</Label>
              <Input id="profile-email" aria-label={t('learner.email')} value={user.email} disabled dir="ltr" />
            </div>
            <div>
              <Label htmlFor="profile-phone">{t('learner.phone')}</Label>
              <Input id="profile-phone" aria-label={t('learner.phone')} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} dir="ltr" />
            </div>
            <div>
              <Label htmlFor="profile-language">{t('learner.language')}</Label>
              <Select id="profile-language" aria-label={t('learner.language')} value={form.language} onChange={(event) => setForm({ ...form, language: event.target.value })}>
                <option value="fr">{t('common.french')}</option>
                <option value="en">{t('common.english')}</option>
                <option value="ar">{t('common.arabic')}</option>
              </Select>
            </div>
            <div className="sm:col-span-2"><Button icon={CheckCircle2} onClick={saveProfile}>{t('learner.saveProfile')}</Button></div>
          </div>
        </Card>
        <Card>
          <CardHeader title={t('learner.changePassword')} description={t('common.password')} />
          <div className="space-y-3 p-5">
            <div>
              <Label htmlFor="password-current">{t('learner.currentPassword')}</Label>
              <Input id="password-current" type="password" aria-label={t('learner.currentPassword')} value={passwords.current} onChange={(event) => setPasswords({ ...passwords, current: event.target.value })} />
            </div>
            <div>
              <Label htmlFor="password-next">{t('learner.newPassword')}</Label>
              <Input id="password-next" type="password" aria-label={t('learner.newPassword')} value={passwords.next} onChange={(event) => setPasswords({ ...passwords, next: event.target.value })} />
            </div>
            <div>
              <Label htmlFor="password-confirm">{t('learner.confirmPassword')}</Label>
              <Input id="password-confirm" type="password" aria-label={t('learner.confirmPassword')} value={passwords.confirm} onChange={(event) => setPasswords({ ...passwords, confirm: event.target.value })} />
            </div>
            <Button icon={CheckCircle2} onClick={savePassword}>{t('learner.updatePassword')}</Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
