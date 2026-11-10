import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  BookOpen,
  Check,
  ChevronDown,
  Globe2,
  GraduationCap,
  Languages,
  LayoutDashboard,
  MessageSquare,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Video,
  Wallet,
} from 'lucide-react'
import { useState } from 'react'
import { useI18n } from '../../i18n/I18nContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useTiwanzaStore } from '../../data/store.js'
import { getPlatformStats, getPlans } from '../../data/selectors.js'
import { Badge, Button, Card } from '../../components/ui.jsx'

export default function LandingPage() {
  const { t, language, money, number } = useI18n()
  const { isAuthenticated, home } = useAuth()
  const state = useTiwanzaStore()
  const stats = getPlatformStats(state)
  const plans = getPlans(state).filter((plan) => plan.enabled)
  const publicSchools = state.schools.slice(0, 3)

  const features = [
    { icon: Globe2, title: t('landing.featureSchoolTitle'), desc: t('landing.featureSchoolDesc'), tone: 'bg-emerald-50 text-emerald-700' },
    { icon: BookOpen, title: t('landing.featureCoursesTitle'), desc: t('landing.featureCoursesDesc'), tone: 'bg-blue-50 text-blue-700' },
    { icon: Wallet, title: t('landing.featurePaymentsTitle'), desc: t('landing.featurePaymentsDesc'), tone: 'bg-amber-50 text-amber-700' },
    { icon: Languages, title: t('landing.featureBilingualTitle'), desc: t('landing.featureBilingualDesc'), tone: 'bg-purple-50 text-purple-700' },
    { icon: Users, title: t('landing.featureLearnersTitle'), desc: t('landing.featureLearnersDesc'), tone: 'bg-cyan-50 text-cyan-700' },
    { icon: ShieldCheck, title: t('landing.featurePlansTitle'), desc: t('landing.featurePlansDesc'), tone: 'bg-rose-50 text-rose-700' },
  ]

  const faqs = [
    [t('landing.faqQuestion1'), t('landing.faqAnswer1')],
    [t('landing.faqQuestion2'), t('landing.faqAnswer2')],
    [t('landing.faqQuestion3'), t('landing.faqAnswer3')],
    [t('landing.faqQuestion4'), t('landing.faqAnswer4')],
  ]

  const testimonials = [
    { quote: t('landing.testimonial1'), author: t('landing.testimonial1Author'), role: t('landing.testimonial1Role'), tone: 'bg-emerald-100 text-emerald-800' },
    { quote: t('landing.testimonial2'), author: t('landing.testimonial2Author'), role: t('landing.testimonial2Role'), tone: 'bg-blue-100 text-blue-800' },
    { quote: t('landing.testimonial3'), author: t('landing.testimonial3Author'), role: t('landing.testimonial3Role'), tone: 'bg-amber-100 text-amber-800' },
  ]

  const statItems = [
    { value: `${stats.schools}+`, label: t('landing.statsSchools') },
    { value: `${stats.courses}+`, label: t('landing.statsCourses') },
    { value: `${stats.learners * 24}+`, label: t('landing.statsLearners') },
    { value: '98 %', label: t('landing.statsSatisfaction') },
  ]

  return (
    <div className="overflow-hidden">
      <section className="relative border-b border-line bg-gradient-to-b from-brand-soft/55 via-white to-white">
        <div className="pointer-events-none absolute -top-24 end-[-120px] h-[360px] w-[360px] rounded-full bg-brand/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 start-[-100px] h-[280px] w-[280px] rounded-full bg-amber-200/30 blur-3xl" />
        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div>
            <Badge tone="brand" className="mb-4 px-3 py-1">
              <Sparkles size={13} />
              {t('landing.badge')}
            </Badge>
            <h1 className="brand-font text-[38px] font-extrabold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-[56px]">
              {t('landing.heroTitle')}{' '}
              <span className="relative inline-block">
                <span className="relative z-10 text-brand">{t('landing.heroTitleAccent')}</span>
                <span className="absolute inset-x-0 bottom-1 z-0 h-3 rounded-full bg-amber-300/60" />
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted sm:text-base">
              {t('landing.heroSubtitle')}
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link to={isAuthenticated ? home : '/register?role=trainer'}>
                <Button size="lg">
                  {t('landing.ctaPrimary')}
                  <ArrowRight size={17} className="rtl:rotate-180" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" size="lg" icon={PlayCircle}>
                  {t('landing.ctaSecondary')}
                </Button>
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-medium text-muted">
              <span className="inline-flex items-center gap-1.5"><Check size={13} className="text-brand" /> {t('subscription.noCardRequired')}</span>
              <span className="inline-flex items-center gap-1.5"><Check size={13} className="text-brand" /> {t('subscription.cancelAnytime')}</span>
              <span className="inline-flex items-center gap-1.5"><Check size={13} className="text-brand" /> {t('landing.statsSatisfaction')} 98 %</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[560px]">
            <div className="absolute -inset-4 -z-10 rounded-[32px] bg-gradient-to-tr from-brand/10 via-transparent to-amber-200/40 blur-xl" />
            <Card className="overflow-hidden rounded-2xl border-line/80 shadow-2xl shadow-brand/10">
              <div className="flex items-center justify-between border-b border-line bg-surface/80 px-4 py-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-400" />
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                </div>
                <span className="rounded-md bg-white px-2 py-0.5 text-[9px] font-medium text-muted">nour-academy.tiwanza.com</span>
                <ShieldCheck size={13} className="text-brand" />
              </div>
              <div className="grid grid-cols-[72px_1fr]">
                <div className="border-e border-line bg-surface/60 p-2.5">
                  <div className="brand-gradient mx-auto mb-4 grid h-8 w-8 place-items-center rounded-lg text-white"><GraduationCap size={16} /></div>
                  <div className="space-y-2">
                    {[LayoutDashboard, BookOpen, Users, Wallet, MessageSquare].map((Icon, index) => (
                      <div key={index} className={`grid h-8 place-items-center rounded-lg ${index === 0 ? 'bg-brand-soft text-brand' : 'text-muted/60'}`}>
                        <Icon size={14} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] text-muted">{t('trainer.dashboardGreeting', { name: 'Yacine' })}</p>
                      <p className="brand-font text-sm font-bold text-ink">Académie Nour</p>
                    </div>
                    <Badge tone="success" dot>{t('common.active')}</Badge>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {[
                      { label: t('trainer.totalLearners'), value: '324', icon: Users, tone: 'bg-emerald-50 text-emerald-700' },
                      { label: t('trainer.activeCourses'), value: '8', icon: BookOpen, tone: 'bg-blue-50 text-blue-700' },
                      { label: t('nav.sales'), value: '182k', icon: Banknote, tone: 'bg-amber-50 text-amber-700' },
                    ].map((item) => (
                      <div key={item.label} className="rounded-lg border border-line p-2">
                        <span className={`grid h-6 w-6 place-items-center rounded-md ${item.tone}`}><item.icon size={12} /></span>
                        <p className="mt-1.5 text-sm font-bold text-ink">{item.value}</p>
                        <p className="truncate text-[8px] text-muted">{item.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 rounded-lg border border-line p-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] font-semibold text-ink">{t('trainer.recentEnrollments')}</p>
                      <span className="text-[8px] text-brand">{t('common.viewAll')}</span>
                    </div>
                    <div className="mt-2 space-y-2">
                      {state.users.filter((u) => u.role === 'learner').slice(0, 3).map((learner, index) => (
                        <div key={learner.id} className="flex items-center gap-2">
                          <span className={`grid h-6 w-6 place-items-center rounded-full text-[8px] font-bold ${['bg-emerald-100 text-emerald-700', 'bg-blue-100 text-blue-700', 'bg-amber-100 text-amber-700'][index]}`}>
                            {learner.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[8px] font-medium text-ink">{learner.name}</p>
                            <div className="mt-1 h-1 rounded-full bg-line/70"><div className="h-full rounded-full bg-brand" style={{ width: `${[78, 45, 92][index]}%` }} /></div>
                          </div>
                          <span className="text-[7px] text-muted">{[78, 45, 92][index]} %</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <div className="absolute -bottom-5 -start-3 hidden w-44 animate-float rounded-xl border border-line bg-white p-3 shadow-xl sm:block">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-100 text-amber-700"><Video size={15} /></span>
                <div>
                  <p className="text-[9px] font-semibold text-ink">{t('trainer.liveSession')}</p>
                  <p className="text-[8px] text-muted">{t('common.today')} · 18:00</p>
                </div>
              </div>
            </div>
            <div className="absolute -top-4 -end-2 hidden rounded-xl border border-line bg-white px-3 py-2 shadow-xl sm:block">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-success-soft text-success"><BadgeCheck size={14} /></span>
                <div>
                  <p className="text-[9px] font-semibold text-ink">{t('trainerPayments.approve')}</p>
                  <p className="text-[8px] text-muted">4 900 DA · CCP</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6">
          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-line bg-white/80 p-4 backdrop-blur sm:grid-cols-4 sm:p-5">
            {statItems.map((item) => (
              <div key={item.label} className="text-center sm:text-start">
                <p className="brand-font text-2xl font-bold text-ink sm:text-3xl">{item.value}</p>
                <p className="mt-0.5 text-[11px] text-muted">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto w-full max-w-7xl scroll-mt-24 px-4 py-16 sm:px-6 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <Badge tone="brand">{t('landing.featuresTitle')}</Badge>
          <h2 className="brand-font mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">{t('landing.featuresTitle')}</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">{t('landing.featuresSubtitle')}</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="group p-5 transition hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-lg hover:shadow-brand/5">
              <span className={`grid h-11 w-11 place-items-center rounded-xl ${feature.tone}`}>
                <feature.icon size={20} />
              </span>
              <h3 className="mt-4 text-sm font-semibold text-ink">{feature.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">{feature.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="how" className="border-y border-line bg-surface/70">
        <div className="mx-auto w-full max-w-7xl scroll-mt-24 px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <Badge tone="brand">{t('landing.howItWorksTitle')}</Badge>
            <h2 className="brand-font mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">{t('landing.howItWorksTitle')}</h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              [t('landing.step1Title'), t('landing.step1Desc')],
              [t('landing.step2Title'), t('landing.step2Desc')],
              [t('landing.step3Title'), t('landing.step3Desc')],
            ].map(([title, desc], index) => (
              <Card key={title} className="relative overflow-hidden p-6">
                <span className="absolute -end-2 -top-4 text-[84px] font-black leading-none text-brand/5">{index + 1}</span>
                <span className="relative z-10 grid h-9 w-9 place-items-center rounded-full bg-brand text-sm font-bold text-white">{index + 1}</span>
                <h3 className="relative z-10 mt-4 text-sm font-semibold text-ink">{title}</h3>
                <p className="relative z-10 mt-1.5 text-xs leading-relaxed text-muted">{desc}</p>
                {index < 2 ? <ArrowRight size={18} className="absolute bottom-5 end-5 hidden text-brand/30 md:block rtl:rotate-180" /> : null}
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2">
        <div>
          <Badge tone="brand">{t('landing.showcaseTitle')}</Badge>
          <h2 className="brand-font mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">{t('landing.showcaseTitle')}</h2>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted">{t('landing.showcaseDesc')}</p>
          <div className="mt-6 space-y-3">
            {publicSchools.map((school, index) => (
              <Link key={school.id} to={`/s/${school.slug}`} className="flex items-center gap-3 rounded-xl border border-line bg-white p-3 transition hover:border-brand/30 hover:shadow-md">
                <span className={`grid h-10 w-10 place-items-center rounded-xl text-sm font-bold ${['bg-brand-soft text-brand', 'bg-blue-50 text-blue-700', 'bg-amber-50 text-amber-700'][index]}`}>
                  {school.name.slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{school.name}</p>
                  <p className="truncate text-[11px] text-muted">{school.subdomain}</p>
                </div>
                <ArrowRight size={15} className="text-muted rtl:rotate-180" />
              </Link>
            ))}
          </div>
        </div>
        <Card className="overflow-hidden p-0">
          <div className="brand-gradient p-6 text-white sm:p-8">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">{t('publicSite.heroBadge')}</span>
              <Languages size={18} className="text-white/70" />
            </div>
            <h3 className="brand-font mt-4 max-w-sm text-2xl font-bold leading-tight">
              {state.schools[0]?.name || 'Académie Nour'}
            </h3>
            <p className="mt-2 max-w-sm text-xs leading-relaxed text-white/75">
              {language === 'ar' ? state.schools[0]?.description : state.schools[0]?.description}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {state.courses.filter((course) => course.status === 'published' && course.schoolId === state.schools[0]?.id).slice(0, 3).map((course) => (
                <span key={course.id} className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-medium backdrop-blur">{course.title}</span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 divide-x divide-line rtl:divide-x-reverse">
            {[
              [state.courses.filter((c) => c.status === 'published' && c.schoolId === state.schools[0]?.id).length, t('common.courses')],
              [state.enrollments.filter((e) => e.schoolId === state.schools[0]?.id).length, t('common.students')],
              ['4.9', t('common.satisfaction')],
            ].map(([value, label]) => (
              <div key={label} className="p-4 text-center">
                <p className="brand-font text-xl font-bold text-ink">{value}</p>
                <p className="text-[10px] text-muted">{label}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section id="plans" className="border-y border-line bg-surface/70">
        <div className="mx-auto w-full max-w-7xl scroll-mt-24 px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <Badge tone="brand">{t('landing.footerPricing')}</Badge>
            <h2 className="brand-font mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">{t('landing.plansTitle')}</h2>
            <p className="mt-3 text-sm text-muted">{t('landing.plansSubtitle')}</p>
          </div>
          <div className="mx-auto mt-10 grid max-w-3xl gap-4 md:grid-cols-2">
            {plans.map((plan) => {
              const isPro = plan.code === 'pro'
              const features = language === 'ar' ? plan.featuresAr : plan.featuresFr
              return (
                <Card key={plan.id} className={isPro ? 'relative border-brand/40 p-6 shadow-lg shadow-brand/10' : 'p-6'}>
                  {isPro ? (
                    <span className="absolute -top-3 start-6 rounded-full bg-brand px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">{t('subscription.recommended')}</span>
                  ) : null}
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-ink">{language === 'ar' ? plan.nameAr : plan.nameFr}</h3>
                    {isPro ? <Sparkles size={18} className="text-brand" /> : <ShieldCheck size={18} className="text-muted" />}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{language === 'ar' ? plan.descAr : plan.descFr}</p>
                  <div className="mt-4 flex items-end gap-1">
                    <span className="brand-font text-3xl font-bold text-ink">{money(plan.priceDA)}</span>
                    <span className="pb-1 text-xs text-muted">{plan.priceDA === 0 ? t('subscription.freeForever') : t('common.perMonth')}</span>
                  </div>
                  <ul className="mt-5 space-y-2.5">
                    {features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-xs text-muted">
                        <Check size={14} className="mt-0.5 shrink-0 text-brand" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to={`/register?role=trainer&plan=${plan.id}`} className="mt-6 block">
                    <Button fullWidth variant={isPro ? 'primary' : 'secondary'}>
                      {plan.priceDA === 0 ? t('common.getStarted') : t('payments.choosePlan')}
                    </Button>
                  </Link>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      <section id="testimonials" className="mx-auto w-full max-w-7xl scroll-mt-24 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Badge tone="brand">{t('landing.testimonialTitle')}</Badge>
          <h2 className="brand-font mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">{t('landing.testimonialTitle')}</h2>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {testimonials.map((item) => (
            <Card key={item.author} className="flex flex-col p-5">
              <div className="flex gap-0.5 text-amber-500">
                {[1, 2, 3, 4, 5].map((star) => <Star key={star} size={13} fill="currentColor" />)}
              </div>
              <p className="mt-3 flex-1 text-xs leading-relaxed text-muted">“{item.quote}”</p>
              <div className="mt-4 flex items-center gap-2.5">
                <span className={`grid h-9 w-9 place-items-center rounded-full text-[11px] font-bold ${item.tone}`}>
                  {item.author.split(' ').map((part) => part[0]).slice(0, 2).join('')}
                </span>
                <div>
                  <p className="text-xs font-semibold text-ink">{item.author}</p>
                  <p className="text-[10px] text-muted">{item.role}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section id="faq" className="border-t border-line bg-surface/70">
        <div className="mx-auto grid w-full max-w-7xl scroll-mt-24 gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Badge tone="brand">FAQ</Badge>
            <h2 className="brand-font mt-3 text-3xl font-bold tracking-tight text-ink">{t('landing.faqTitle')}</h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">{t('landing.footerAbout')}</p>
            <a href="mailto:contact@tiwanza.dz" className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-brand hover:underline">
              <MessageSquare size={14} /> {t('landing.footerContact')}
            </a>
          </div>
          <div className="space-y-2">
            {faqs.map(([question, answer], index) => (
              <FaqItem key={question} question={question} answer={answer} defaultOpen={index === 0} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-ink px-6 py-10 text-white sm:px-12 sm:py-14">
          <div className="pointer-events-none absolute -end-20 -top-20 h-64 w-64 rounded-full bg-brand/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 start-1/3 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl" />
          <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2 className="brand-font text-3xl font-bold tracking-tight sm:text-4xl">{t('landing.ctaTitle')}</h2>
              <p className="mt-2 max-w-xl text-sm text-white/65">{t('landing.ctaSubtitle')}</p>
            </div>
            <Link to="/register?role=trainer" className="shrink-0">
              <Button size="lg" className="bg-white text-ink hover:bg-brand-soft">
                {t('landing.ctaButton')}
                <ArrowRight size={17} className="rtl:rotate-180" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

function FaqItem({ question, answer, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Card className="overflow-hidden">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-start">
        <span className="text-sm font-semibold text-ink">{question}</span>
        <ChevronDown size={16} className={`shrink-0 text-muted transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open ? <p className="border-t border-line px-4 py-3 text-xs leading-relaxed text-muted">{answer}</p> : null}
    </Card>
  )
}
