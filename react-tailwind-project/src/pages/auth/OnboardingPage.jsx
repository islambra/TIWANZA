import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Building2,
  Check,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Globe2,
  GraduationCap,
  ImagePlus,
  Info,
  Landmark,
  Loader2,
  Lock,
  Rocket,
  School,
  ShieldCheck,
  Sparkles,
  UploadCloud,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { useI18n } from '../../i18n/I18nContext.jsx'
import { useTiwanzaStore } from '../../data/store.js'
import {
  activateFreePlan,
  checkSubdomainAvailability,
  completeOnboarding,
  createSchoolForTrainer,
  saveOnboardingDraft,
  submitSubscriptionManual,
  submitSubscriptionOnline,
} from '../../data/services.js'
import { getPlan, getTrainerSubscription } from '../../data/selectors.js'
import { slugify } from '../../lib/utils.js'
import { Alert, Badge, Button, Card, Checkbox, Input, Label, Modal, ProgressBar, Select, Textarea } from '../../components/ui.jsx'
import { cn } from '../../lib/utils.js'

const steps = ['account', 'school', 'plan', 'done']

export default function OnboardingPage() {
  const { user, profile } = useAuth()
  const { t, language, money } = useI18n()
  const { success, error: toastError, info } = useToast()
  const state = useTiwanzaStore()
  const navigate = useNavigate()

  const school = user?.schoolId ? state.schools.find((item) => item.id === user.schoolId) : null
  const subscription = user ? getTrainerSubscription(state, user.id) : null
  const draft = state.onboardingDrafts?.[user?.id] || {}
  const plans = state.plans.filter((plan) => plan.enabled).sort((a, b) => a.order - b.order)

  const [step, setStep] = useState(school?.id ? 2 : 1)
  const [name, setName] = useState(school?.name || '')
  const [slug, setSlug] = useState(school?.slug || '')
  const [slugTouched, setSlugTouched] = useState(Boolean(school?.slug))
  const [description, setDescription] = useState(school?.description || '')
  const [email, setEmail] = useState(school?.contactEmail || user?.email || '')
  const [phone, setPhone] = useState(school?.contactPhone || '')
  const [city, setCity] = useState(school?.city || '')
  const [schoolLanguage, setSchoolLanguage] = useState(school?.language || language)
  const [slugCheck, setSlugCheck] = useState(null)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')
  const [savingSchool, setSavingSchool] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(subscription?.planId || draft.selectedPlanId || 'plan-pro')
  const [payOpen, setPayOpen] = useState(false)
  const [payMethod, setPayMethod] = useState('online')
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242')
  const [cardName, setCardName] = useState(user?.name || '')
  const [cardExpiry, setCardExpiry] = useState('12/28')
  const [cardCvv, setCardCvv] = useState('123')
  const [reference, setReference] = useState(`TIW-${String(Date.now()).slice(-6)}`)
  const [proofName, setProofName] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [planLoading, setPlanLoading] = useState(false)

  useEffect(() => {
    if (!user) navigate('/login', { replace: true })
    else if (user.role !== 'trainer') navigate('/login', { replace: true })
  }, [user, navigate])

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name))
  }, [name, slugTouched])

  useEffect(() => {
    if (!slug) {
      setSlugCheck(null)
      return undefined
    }
    setChecking(true)
    const timer = window.setTimeout(() => {
      setSlugCheck(checkSubdomainAvailability(slug, school?.id || null))
      setChecking(false)
    }, 320)
    return () => window.clearTimeout(timer)
  }, [slug, school?.id])

  useEffect(() => {
    if (step === 4) completeOnboarding(user.id)
  }, [step, user.id])

  const selectedPlanData = getPlan(state, selectedPlan)
  const planFeatures = selectedPlanData
    ? language === 'ar'
      ? selectedPlanData.featuresAr
      : selectedPlanData.featuresFr
    : []

  const subscriptionStatus = subscription?.status
  const pendingManual = subscriptionStatus === 'pending'
  const isActive = subscriptionStatus === 'active'

  function goNext() {
    setError('')
    if (step === 1) {
      setStep(2)
      return
    }
    if (step === 2) handleSaveSchool()
  }

  function handleSaveSchool() {
    setError('')
    if (!name.trim()) return setError(t('errors.required'))
    if (!slug || !slugCheck?.available) return setError(slugCheck?.reason === 'taken' ? t('errors.slugTaken') : t('errors.slugInvalid'))
    if (!description.trim()) return setError(t('onboarding.requiredInfo'))
    setSavingSchool(true)
    window.setTimeout(() => {
      const result = createSchoolForTrainer(user.id, {
        name: name.trim(),
        slug: slugCheck.normalized,
        description: description.trim(),
        contactEmail: email.trim(),
        contactPhone: phone.trim(),
        city: city.trim(),
        language: schoolLanguage,
        logo: null,
        headline: '',
        bio: '',
      })
      setSavingSchool(false)
      if (!result.ok) {
        toastError(t('errors.generic'))
        return
      }
      saveOnboardingDraft(user.id, { step: 3 })
      success(t('onboarding.schoolCreated'))
      setStep(3)
    }, 500)
  }

  function handleFreePlan() {
    setError('')
    setPlanLoading(true)
    window.setTimeout(() => {
      const result = submitSubscriptionManual({ userId: user.id, planId: 'plan-pro', reference: '', proofName: '' })
      setPlanLoading(false)
      if (!result.ok) {
        toastError(t('errors.generic'))
        return
      }
      success(t('onboarding.planActivated'))
      setStep(4)
    }, 450)
  }

  function handleProceedPlan() {
    if (!selectedPlanData) return
    setPayOpen(true)
    setAccepted(false)
  }

  function handlePayOnline() {
    setProcessing(true)
    window.setTimeout(() => {
      const result = submitSubscriptionOnline({
        userId: user.id,
        planId: selectedPlanData.id,
        provider: 'chargerly',
        outcome: cardNumber.replace(/\s/g, '').startsWith('4242') && cardCvv.length >= 3 ? 'success' : 'failed',
      })
      setProcessing(false)
      if (!result.ok) {
        toastError(t('subscription.paymentFailed'))
        return
      }
      success(t('subscription.paymentSuccess'))
      setPayOpen(false)
      setStep(4)
    }, 1200)
  }

  function handlePayManual() {
    if (!proofName) {
      toastError(t('subscription.receiptRequired'))
      return
    }
    setProcessing(true)
    window.setTimeout(() => {
      submitSubscriptionManual({
        userId: user.id,
        planId: selectedPlanData.id,
        reference,
        proofName,
        proofDataUrl: null,
      })
      setProcessing(false)
      setPayOpen(false)
      info(t('subscription.manualSuccess'))
      setStep(4)
    }, 900)
  }

  function finishLater() {
    completeOnboarding(user.id)
    success(t('onboarding.completed'))
    navigate('/trainer')
  }

  const stepIndex = step
  const percent = Math.round((stepIndex / 4) * 100)

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <button type="button" onClick={() => navigate('/')} className="flex items-center gap-2.5">
            <span className="brand-gradient grid h-9 w-9 place-items-center rounded-xl text-white"><GraduationCap size={19} /></span>
            <span className="brand-font text-lg font-bold text-ink">Tiwanza</span>
          </button>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted sm:block">{user?.email}</span>
            <Badge tone="brand">{t('onboarding.stepOf', { current: step, total: 4 })}</Badge>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="brand-font text-2xl font-bold tracking-tight text-ink sm:text-3xl">{t('onboarding.title')}</h1>
          <p className="mt-1.5 text-sm text-muted">{t('onboarding.subtitle')}</p>
        </div>

        <div className="mx-auto mt-6 max-w-3xl">
          <div className="flex items-center justify-between gap-1">
            {steps.map((item, index) => {
              const number = index + 1
              const done = step > number
              const current = step === number
              return (
                <div key={item} className="flex flex-1 items-center gap-1 last:flex-none">
                  <div className={cn('flex shrink-0 items-center gap-2', number > 1 && 'ms-1')}>
                    <span className={cn(
                      'grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold transition',
                      done ? 'bg-brand text-white' : current ? 'bg-brand-soft text-brand ring-2 ring-brand/20' : 'bg-white text-muted ring-1 ring-line',
                    )}>
                      {done ? <Check size={13} strokeWidth={3} /> : number}
                    </span>
                    <span className={cn('hidden text-[11px] font-semibold sm:block', current ? 'text-brand' : done ? 'text-ink' : 'text-muted')}>
                      {t(`onboarding.step${item.charAt(0).toUpperCase()}${item.slice(1)}`)}
                    </span>
                  </div>
                  {index < steps.length - 1 ? <span className={cn('mx-1 h-px flex-1', step > number ? 'bg-brand' : 'bg-line')} /> : null}
                </div>
              )
            })}
          </div>
          <ProgressBar value={percent} className="mt-4" size="sm" />
        </div>

        <div className="mx-auto mt-7 max-w-5xl">
          {step === 1 ? (
            <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
              <Card className="p-5 sm:p-6">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-success-soft text-success"><BadgeCheck size={24} /></span>
                <h2 className="brand-font mt-4 text-xl font-bold text-ink">{t('onboarding.welcomeTitle', { name: user?.name?.split(' ')[0] || '' })}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">{t('onboarding.welcomeDesc')}</p>
                <div className="mt-5 space-y-3">
                  {[
                    [t('onboarding.accountDone'), user?.email, CheckCircle2],
                    [t('onboarding.stepSchool'), t('onboarding.schoolSubtitle'), Building2],
                    [t('onboarding.stepPlan'), t('onboarding.planSubtitle'), CreditCard],
                  ].map(([title, desc, Icon]) => (
                    <div key={title} className="flex items-start gap-3 rounded-xl border border-line bg-surface/50 p-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-brand shadow-sm"><Icon size={15} /></span>
                      <div>
                        <p className="text-xs font-semibold text-ink">{title}</p>
                        <p className="mt-0.5 text-[11px] text-muted">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button fullWidth size="lg" className="mt-5" onClick={goNext} iconRight={ArrowRight}>
                  {t('common.continue')}
                </Button>
              </Card>
              <Card className="brand-gradient relative overflow-hidden p-6 text-white">
                <div className="pointer-events-none absolute -end-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
                <Sparkles size={22} className="text-amber-300" />
                <h3 className="brand-font mt-4 text-xl font-bold">{t('onboarding.tipsTitle')}</h3>
                <div className="mt-4 space-y-3">
                  {[t('onboarding.tip1'), t('onboarding.tip2'), t('onboarding.tip3'), t('onboarding.tip4')].map((tip) => (
                    <div key={tip} className="flex items-start gap-2 text-xs leading-relaxed text-white/80">
                      <Check size={14} className="mt-0.5 shrink-0 text-amber-300" /> {tip}
                    </div>
                  ))}
                </div>
                <div className="mt-8 rounded-xl border border-white/15 bg-white/5 p-3">
                  <p className="text-[11px] font-semibold text-white/70">{t('onboarding.progress')}</p>
                  <p className="mt-1 text-2xl font-bold">25 %</p>
                  <ProgressBar value={25} className="mt-2" />
                </div>
              </Card>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
              <Card className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="brand-font text-xl font-bold text-ink">{t('onboarding.schoolTitle')}</h2>
                    <p className="mt-1 text-xs text-muted">{t('onboarding.schoolSubtitle')}</p>
                  </div>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand"><School size={19} /></span>
                </div>

                <div className="mt-5 space-y-4">
                  <div>
                    <Label htmlFor="school-name" required>{t('onboarding.schoolName')}</Label>
                    <Input id="school-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('onboarding.schoolNamePlaceholder')} icon={Building2} />
                  </div>

                  <div>
                    <Label htmlFor="school-slug" required>{t('onboarding.schoolSlug')}</Label>
                    <div className="flex overflow-hidden rounded-xl border border-line bg-white focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10">
                      <input
                        id="school-slug"
                        value={slug}
                        onChange={(e) => { setSlugTouched(true); setSlug(slugify(e.target.value)) }}
                        placeholder="mon-ecole"
                        dir="ltr"
                        className="min-w-0 flex-1 border-0 bg-transparent px-3.5 py-2.5 text-sm text-ink focus:outline-none"
                      />
                      <span className="flex items-center border-s border-line bg-surface px-2.5 text-[11px] font-medium text-muted" dir="ltr">.tiwanza.com</span>
                    </div>
                    <p className="mt-1 text-[10px] text-muted">{t('onboarding.schoolSlugHint')}</p>
                    {slug ? (
                      <div className="mt-1.5">
                        {checking ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted"><Loader2 size={11} className="animate-spin" /> {t('onboarding.slugChecking')}</span>
                        ) : slugCheck?.available ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-success"><CheckCircle2 size={11} /> {t('onboarding.slugAvailable')}</span>
                        ) : (
                          <div>
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-danger"><Info size={11} /> {slugCheck?.reason === 'reserved' ? t('onboarding.slugReserved') : slugCheck?.reason === 'taken' ? t('onboarding.slugTaken') : t('errors.slugInvalid')}</span>
                            {slugCheck?.suggestions?.length ? (
                              <div className="mt-1.5 flex flex-wrap gap-1.5">
                                {slugCheck.suggestions.slice(0, 3).map((suggestion) => (
                                  <button key={suggestion} type="button" onClick={() => { setSlugTouched(true); setSlug(suggestion) }} className="rounded-md bg-brand-soft px-2 py-0.5 text-[10px] font-medium text-brand-dark hover:bg-brand-soft/70">
                                    {suggestion}
                                  </button>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>

                  <div>
                    <Label htmlFor="school-description" required>{t('onboarding.schoolDescription')}</Label>
                    <Textarea id="school-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('onboarding.schoolDescriptionPlaceholder')} rows={3} maxLength={280} />
                    <p className="mt-1 text-end text-[10px] text-muted">{description.length}/280</p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="school-email">{t('common.email')}</Label>
                      <Input id="school-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" />
                    </div>
                    <div>
                      <Label htmlFor="school-phone">{t('common.phone')}</Label>
                      <Input id="school-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+213 ..." dir="ltr" />
                    </div>
                    <div>
                      <Label htmlFor="school-city">{t('onboarding.schoolCity')}</Label>
                      <Input id="school-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder={t('onboarding.schoolCityPlaceholder')} />
                    </div>
                    <div>
                      <Label htmlFor="school-language">{t('onboarding.schoolLanguage')}</Label>
                      <Select id="school-language" value={schoolLanguage} onChange={(e) => setSchoolLanguage(e.target.value)}>
                        <option value="fr">{t('common.french')}</option>
                        <option value="ar">{t('common.arabic')}</option>
                        <option value="en">English</option>
                      </Select>
                    </div>
                  </div>

                  <div className="rounded-xl border border-dashed border-line bg-surface/50 p-3">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-9 w-9 place-items-center rounded-lg bg-white text-brand"><ImagePlus size={16} /></span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-ink">{t('onboarding.schoolLogo')}</p>
                        <p className="text-[10px] text-muted">{t('onboarding.logoHint')}</p>
                      </div>
                      <Button variant="secondary" size="xs" onClick={() => info(t('common.simulated'))}>{t('common.upload')}</Button>
                    </div>
                  </div>

                  {error ? <Alert tone="danger">{error}</Alert> : null}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <Button variant="ghost" onClick={() => setStep(1)} icon={ArrowLeft}>{t('common.back')}</Button>
                    <Button onClick={goNext} loading={savingSchool} iconRight={ArrowRight}>{t('common.continue')}</Button>
                  </div>
                </div>
              </Card>

              <div className="space-y-4">
                <Card className="overflow-hidden">
                  <div className="flex items-center justify-between border-b border-line bg-surface/60 px-4 py-2.5">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted"><Globe2 size={12} /> {t('onboarding.schoolPreview')}</span>
                    <span className="rounded bg-white px-2 py-0.5 text-[9px] text-muted" dir="ltr">{slug || 'mon-ecole'}.tiwanza.com</span>
                  </div>
                  <div className="brand-gradient p-5 text-white">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 text-lg font-bold backdrop-blur">{name ? name.slice(0, 1).toUpperCase() : 'A'}</span>
                    <h3 className="brand-font mt-3 text-lg font-bold">{name || t('onboarding.schoolNamePlaceholder')}</h3>
                    <p className="mt-1 line-clamp-3 text-[11px] leading-relaxed text-white/70">{description || t('onboarding.schoolDescriptionPlaceholder')}</p>
                    <div className="mt-4 flex gap-2">
                      <span className="rounded-md bg-white/15 px-2 py-1 text-[9px]">{t('publicSite.courses')}</span>
                      <span className="rounded-md bg-white/15 px-2 py-1 text-[9px]">{t('publicSite.about')}</span>
                      <span className="rounded-md bg-white/15 px-2 py-1 text-[9px]">{t('publicSite.contact')}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 p-3">
                    {[1, 2].map((item) => (
                      <div key={item} className="rounded-lg border border-line p-2">
                        <div className="h-12 rounded bg-surface" />
                        <div className="mt-2 h-1.5 w-4/5 rounded bg-line" />
                        <div className="mt-1 h-1.5 w-1/2 rounded bg-line/70" />
                      </div>
                    ))}
                  </div>
                </Card>
                <Alert tone="info" icon={Info}>{t('onboarding.helpText')}</Alert>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div>
              <div className="mx-auto max-w-2xl text-center">
                <h2 className="brand-font text-2xl font-bold text-ink">{t('onboarding.planTitle')}</h2>
                <p className="mt-1 text-sm text-muted">{t('onboarding.planSubtitle')}</p>
              </div>
              {isActive ? (
                <Alert tone="success" className="mx-auto mt-5 max-w-xl" icon={BadgeCheck}>{t('onboarding.planActivated')} — {t('subscription.currentPlan')}: {selectedPlanData?.nameFr}.</Alert>
              ) : null}
              <div className="mx-auto mt-6 grid max-w-3xl gap-4 md:grid-cols-2">
                {plans.map((plan) => {
                  const isPro = plan.code === 'pro' || plan.id === 'plan-pro'
                  const active = selectedPlan === plan.id
                  const features = language === 'ar' ? plan.featuresAr : plan.featuresFr
                  return (
                    <button key={plan.id} type="button" onClick={() => setSelectedPlan(plan.id)} className="text-start">
                      <Card className={cn('relative h-full p-5 transition', active ? 'border-brand ring-2 ring-brand/15' : 'hover:border-brand/30')}>
                        {isPro ? <span className="absolute -top-2.5 start-5 rounded-full bg-brand px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">{t('subscription.recommended')}</span> : null}
                        <div className="flex items-center justify-between">
                          <p className="text-base font-bold text-ink">{language === 'ar' ? plan.nameAr : plan.nameFr}</p>
                          <span className={cn('grid h-5 w-5 place-items-center rounded-full border', active ? 'border-brand bg-brand text-white' : 'border-line')}>
                            {active ? <Check size={12} strokeWidth={3} /> : null}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-muted">{language === 'ar' ? plan.descAr : plan.descFr}</p>
                        <div className="mt-3 flex items-end gap-1">
                          <span className="brand-font text-2xl font-bold text-ink">{money(plan.priceDA)}</span>
                          <span className="pb-0.5 text-[11px] text-muted">{plan.priceDA === 0 ? t('subscription.freeForever') : t('common.perMonth')}</span>
                        </div>
                        <ul className="mt-4 space-y-2">
                          {features.map((feature) => (
                            <li key={feature} className="flex items-start gap-2 text-[11px] text-muted">
                              <Check size={12} className="mt-0.5 shrink-0 text-brand" /> {feature}
                            </li>
                          ))}
                        </ul>
                      </Card>
                    </button>
                  )
                })}
              </div>
              {error ? <Alert tone="danger" className="mx-auto mt-4 max-w-3xl">{error}</Alert> : null}
              <div className="mx-auto mt-6 flex max-w-3xl flex-wrap items-center justify-between gap-3">
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setStep(2)} icon={ArrowLeft}>{t('common.back')}</Button>
                  <Button variant="ghost" onClick={finishLater}>{t('onboarding.chooseLater')}</Button>
                </div>
                <Button onClick={handleProceedPlan} loading={planLoading} icon={selectedPlanData?.code === 'pro' ? CreditCard : Rocket} size="lg">
                  {t('onboarding.continueWithPro')}
                </Button>
              </div>
<p className="mx-auto mt-3 max-w-3xl text-center text-[11px] text-muted">{t('onboarding.proPlanNotice')}</p>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="mx-auto max-w-3xl">
              <Card className="overflow-hidden">
                <div className="brand-gradient px-6 py-8 text-center text-white">
                  <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white/15 backdrop-blur">
                    {pendingManual ? <Loader2 size={30} className="animate-spin text-amber-300" /> : <CheckCircle2 size={30} className="text-amber-300" />}
                  </span>
                  <h2 className="brand-font mt-4 text-2xl font-bold">
                    {pendingManual ? t('subscription.pendingReview') : isActive ? t('onboarding.readyTitle') : t('onboarding.title')}
                  </h2>
                  <p className="mx-auto mt-2 max-w-md text-sm text-white/70">
                    {pendingManual ? t('subscription.pendingReviewDesc') : isActive ? t('onboarding.readySubtitle') : t('onboarding.chooseLater')}
                  </p>
                </div>
                <div className="p-5 sm:p-6">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-line p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{t('onboarding.readySchool')}</p>
                      <p className="mt-1 truncate text-sm font-semibold text-ink">{school?.name || name}</p>
                      <p className="truncate text-[10px] text-muted" dir="ltr">{school?.subdomain || `${slug}.tiwanza.com`}</p>
                    </div>
                    <div className="rounded-xl border border-line p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{t('onboarding.readyPlan')}</p>
                      <p className="mt-1 text-sm font-semibold text-ink">{selectedPlanData ? (language === 'ar' ? selectedPlanData.nameAr : selectedPlanData.nameFr) : '—'}</p>
                      <p className="text-[10px] text-muted">{pendingManual ? t('common.pending') : isActive ? t('common.active') : t('common.active')}</p>
                    </div>
                    <div className="rounded-xl border border-line p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{t('onboarding.readySite')}</p>
                      <p className="mt-1 truncate text-sm font-semibold text-brand">{school?.subdomain || `${slug}.tiwanza.com`}</p>
                      <p className="flex items-center gap-1 text-[10px] text-muted"><Lock size={9} /> HTTPS</p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-2 sm:grid-cols-2">
                    <Button onClick={() => navigate('/trainer/courses/new')} icon={BookOpen} size="lg">
                      {t('onboarding.createFirstCourse')}
                    </Button>
                    <Button variant="secondary" onClick={() => navigate('/trainer')} icon={LayoutDashboardIcon} size="lg">
                      {t('onboarding.goDashboard')}
                    </Button>
                  </div>
                  <div className="mt-3 flex flex-wrap justify-center gap-3">
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/s/${school?.slug || slug}`)} icon={ExternalLink}>
                      {t('onboarding.viewSite')}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/trainer/subscription')} icon={CreditCard}>
                      {t('subscription.title')}
                    </Button>
                  </div>
                </div>
              </Card>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {[t('onboarding.tip1'), t('onboarding.tip2')].map((tip) => (
                  <div key={tip} className="flex items-start gap-2 rounded-xl border border-line bg-white p-3 text-[11px] text-muted">
                    <Sparkles size={13} className="mt-0.5 shrink-0 text-brand" /> {tip}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <Modal
        open={payOpen}
        onClose={() => !processing && setPayOpen(false)}
        title={t('subscription.paymentTitle')}
        description={t('subscription.paymentSubtitle')}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPayOpen(false)} disabled={processing}>{t('common.cancel')}</Button>
            <Button onClick={payMethod === 'online' ? handlePayOnline : handlePayManual} loading={processing} icon={Lock}>
              {payMethod === 'online' ? money(selectedPlanData?.priceDA || 0) : t('subscription.submitManual')}
            </Button>
          </>
        }
      >
        <div className="grid gap-1 rounded-xl bg-surface p-1 sm:grid-cols-2">
          <button type="button" onClick={() => setPayMethod('online')} className={cn('flex items-center gap-2 rounded-lg px-3 py-2.5 text-start text-xs font-semibold transition', payMethod === 'online' ? 'bg-white text-ink shadow-sm' : 'text-muted')}>
            <CreditCard size={15} /> {t('subscription.payOnline')}
          </button>
          <button type="button" onClick={() => setPayMethod('manual')} className={cn('flex items-center gap-2 rounded-lg px-3 py-2.5 text-start text-xs font-semibold transition', payMethod === 'manual' ? 'bg-white text-ink shadow-sm' : 'text-muted')}>
            <Landmark size={15} /> {t('subscription.payManual')}
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-line p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">{t('subscription.planLabel', { plan: selectedPlanData?.nameFr || '' })}</span>
            <span className="font-semibold text-ink">{money(selectedPlanData?.priceDA || 0)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-line pt-2 text-sm">
            <span className="font-semibold text-ink">{t('subscription.totalDue')}</span>
            <span className="brand-font font-bold text-brand">{money(selectedPlanData?.priceDA || 0)}</span>
          </div>
        </div>

        {payMethod === 'online' ? (
          <div className="mt-4">
            <Alert tone="info" icon={ShieldCheck}>{t('subscription.cardDemoHint')}</Alert>
            <div className="mt-3 space-y-3">
              <div>
                <Label>{t('subscription.cardNumber')}</Label>
                <Input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} dir="ltr" />
              </div>
              <div>
                <Label>{t('subscription.cardName')}</Label>
                <Input value={cardName} onChange={(e) => setCardName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{t('subscription.cardExpiry')}</Label>
                  <Input value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} dir="ltr" />
                </div>
                <div>
                  <Label>{t('subscription.cardCvv')}</Label>
                  <Input value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} dir="ltr" maxLength={4} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <Alert tone="info" icon={Info}>{t('subscription.manualInstructions')}</Alert>
            <div className="rounded-xl border border-line bg-surface/60 p-3 text-[11px]">
              <p className="font-semibold text-ink">{t('subscription.bankDetails')}</p>
              <p className="mt-1 text-muted">BNA · Tiwanza SARL</p>
              <p className="text-muted" dir="ltr">RIB: 001 234 567 890 123 456 78</p>
            </div>
            <div>
              <Label>{t('subscription.reference')}</Label>
              <Input value={reference} onChange={(e) => setReference(e.target.value)} dir="ltr" />
            </div>
            <div>
              <Label>{t('subscription.uploadReceipt')}</Label>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-line bg-surface/40 p-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-white text-brand"><UploadCloud size={17} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium text-ink">{proofName || t('common.upload')}</span>
                  <span className="block text-[10px] text-muted">{t('subscription.receiptHint')}</span>
                </span>
                <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setProofName(e.target.files?.[0]?.name || '')} />
              </label>
            </div>
            <Checkbox checked={accepted} onChange={(e) => setAccepted(e.target.checked)} label={t('subscription.secure')} />
          </div>
        )}
      </Modal>
    </div>
  )
}

function LayoutDashboardIcon(props) {
  return <School {...props} />
}
