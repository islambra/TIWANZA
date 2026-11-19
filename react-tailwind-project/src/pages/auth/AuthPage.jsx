import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  School,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
} from 'lucide-react'
import { useAuth, roleHome } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { useI18n } from '../../i18n/I18nContext.jsx'
import { useTiwanzaStore } from '../../data/store.js'
import { getLearnerEnrollments, getPlan, getSchoolBySlug } from '../../data/selectors.js'
import { savePlanSelection } from '../../data/services.js'
import { Alert, Badge, Button, Divider, Input, Label } from '../../components/ui.jsx'
import { cn } from '../../lib/utils.js'

const ArrowRightRtl = (props) => <ArrowRight {...props} className="rtl:rotate-180" />

const teamDemoAccounts = [
  { id: 'u-admin', role: 'admin', name: 'Yasmine Tiwanza', email: 'admin@tiwanza.dz', icon: ShieldCheck, tone: 'bg-brand-soft text-brand border-brand/20' },
  { id: 'u-t1', role: 'trainer', name: 'Yacine Belkacem', email: 'yacine@nour-academy.dz', icon: GraduationCap, tone: 'bg-blue-50 text-blue-700 border-blue-200' },
]

function pickDemoLearner(state, schoolId) {
  return state.users
    .filter((user) => user.role === 'learner' && user.schoolId === schoolId && user.status !== 'suspended')
    .map((user) => {
      const courses = getLearnerEnrollments(state, user.id).filter((enrollment) => enrollment.status === 'active')
      const courseIds = new Set(courses.map((enrollment) => enrollment.courseId))
      const lessons = (state.lessons || []).filter((lesson) => courseIds.has(lesson.courseId))
      const completed = (state.lessonProgress || []).filter((item) => item.learnerId === user.id && item.completed).length
      const quizCount = (state.quizAttempts || []).filter((item) => item.learnerId === user.id).length
      const progress = lessons.length ? Math.min(100, Math.round((completed / lessons.length) * 100)) : 0
      return { user, courses: courses.length, progress, score: courses.length * 4 + completed + quizCount * 2 }
    })
    .sort((first, second) => second.score - first.score)[0] || null
}

function learnerDemoAccount(user, courses = 0, progress = 0, path = null) {
  return { id: user.id, role: 'learner', schoolId: user.schoolId, name: user.name, email: user.email, icon: BookOpen, tone: 'bg-amber-50 text-amber-700 border-amber-200', courses, progress, path }
}

function safeRedirect(value, slug, schoolScoped) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return null
  if (schoolScoped && !value.startsWith(`/s/${slug}/`)) return null
  return value
}

export default function AuthPage({ mode = 'login', schoolScoped = false }) {
  const { t } = useI18n()
  const { login, demoLogin, registerLearner, registerTrainer, isAuthenticated, home } = useAuth()
  const { success, error: toastError, info } = useToast()
  const { slug } = useParams()
  const state = useTiwanzaStore()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const school = schoolScoped ? getSchoolBySlug(state, slug) : null
  const authOptions = schoolScoped
    ? { roles: ['learner'], schoolId: school?.id }
    : { roles: ['trainer', 'admin'] }

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [terms, setTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)

  useEffect(() => {
    setError('')
    setNotice('')
  }, [params])

  const visibleDemoAccounts = useMemo(() => {
    if (!schoolScoped) {
      const featuredSchool = state.schools.find((item) => item.slug === 'nour-academy') || state.schools[0]
      const picked = featuredSchool ? pickDemoLearner(state, featuredSchool.id) : null
      return [...teamDemoAccounts, ...(picked ? [learnerDemoAccount(picked.user, picked.courses, picked.progress, `/s/${featuredSchool.slug}/login`)] : [])]
    }
    const picked = pickDemoLearner(state, school?.id)
    return picked ? [learnerDemoAccount(picked.user, picked.courses, picked.progress)] : []
  }, [school?.id, schoolScoped, state])

  const passwordStrength = useMemo(() => {
    const value = password || ''
    if (!value) return { score: 0, key: 'auth.passwordWeak' }
    let score = 0
    if (value.length >= 8) score += 1
    if (value.length >= 12) score += 1
    if (/[A-Za-z]/.test(value) && /\d/.test(value)) score += 1
    if (/[^A-Za-z0-9]/.test(value)) score += 1
    if (score <= 1) return { score: 1, key: 'auth.passwordWeak' }
    if (score === 2) return { score: 2, key: 'auth.passwordFair' }
    if (score === 3) return { score: 3, key: 'auth.passwordGood' }
    return { score: 4, key: 'auth.passwordStrong' }
  }, [password])

  if (schoolScoped && !school) return <Navigate to="/" replace />

  function redirectAfterAuth(user) {
    const profile = state.trainerProfiles.find((item) => item.userId === user.id)
    if (user.role === 'trainer' && (!user.schoolId || !profile?.onboardingComplete)) {
      navigate('/onboarding')
      return
    }
    const redirect = safeRedirect(params.get('redirect'), slug, schoolScoped)
    if (redirect) {
      navigate(redirect)
      return
    }
    if (user.role === 'learner') {
      const learnerSchool = state.schools.find((item) => item.id === user.schoolId)
      navigate(learnerSchool ? `/s/${learnerSchool.slug}/learn` : '/')
      return
    }
    navigate(roleHome[user.role] || '/')
  }

  function authModePath(mode) {
    if (!schoolScoped) return mode === 'login' ? '/login' : '/register'
    const redirect = safeRedirect(params.get('redirect'), slug, schoolScoped)
    return `/s/${school.slug}/${mode}${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`
  }

  function authErrorMessage(code) {
    if (code === 'suspended') return t('auth.accountSuspended')
    if (code === 'role-not-allowed') return schoolScoped ? t('auth.studentOnlyHere') : t('auth.teamOnlyHere')
    if (code === 'school-not-allowed') return t('auth.schoolMismatch')
    if (code === 'school-not-found') return t('publicSite.schoolUnavailable')
    if (code === 'invalid-input') return t('errors.required')
    return t('errors.invalidCredentials')
  }

  function handleLogin(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    if (!email.trim()) return setError(t('errors.emailRequired'))
    if (!password) return setError(t('errors.passwordRequired'))
    setLoading(true)
    window.setTimeout(() => {
      const result = login(email, password, authOptions)
      setLoading(false)
      if (!result.ok) {
        setError(authErrorMessage(result.error))
        return
      }
      success(t('auth.welcomeBack', { name: result.user.name.split(' ')[0] }), t('auth.loginSuccess'))
      setNotice(t('auth.loginSuccess'))
      redirectAfterAuth(result.user)
    }, 420)
  }

  function handleRegister(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    if (!name.trim()) return setError(t('errors.required'))
    if (!email.trim()) return setError(t('errors.emailRequired'))
    if (password.length < 8) return setError(t('errors.passwordLength'))
    if (password !== confirmPassword) return setError(t('errors.passwordMismatch'))
    if (!terms) return setError(t('auth.termsRequired'))
    setLoading(true)
    window.setTimeout(() => {
      const result = schoolScoped
        ? registerLearner({ name, email, password, schoolId: school.id, schoolSlug: school.slug, language: useI18nLanguage() })
        : registerTrainer({ name, email, password, language: useI18nLanguage() })
      setLoading(false)
      if (!result.ok) {
        setError(result.error === 'email-taken' ? t('auth.emailTaken') : authErrorMessage(result.error))
        return
      }
      const selectedPlanId = params.get('plan')
      if (!schoolScoped && selectedPlanId && getPlan(state, selectedPlanId)?.enabled) {
        savePlanSelection(result.user.id, selectedPlanId)
      }
      success(t('auth.accountCreated'), schoolScoped ? t('auth.registerSuccess') : t('onboarding.subtitle'))
      setNotice(schoolScoped ? t('auth.registerSuccess') : t('auth.accountCreated'))
      const redirect = safeRedirect(params.get('redirect'), slug, schoolScoped)
      if (schoolScoped) navigate(redirect || `/s/${school.slug}/learn`)
      else navigate('/onboarding')
    }, 500)
  }

  function useI18nLanguage() {
    return document.documentElement.lang === 'ar' ? 'ar' : 'fr'
  }

  function handleDemo(account) {
    if (account.path) return navigate(account.path)
    setDemoLoading(account.id)
    window.setTimeout(() => {
      const result = demoLogin(account.id, authOptions)
      setDemoLoading(null)
      if (!result.ok) {
        toastError(authErrorMessage(result.error))
        return
      }
      info(t('auth.demoNotice'))
      redirectAfterAuth(result.user)
    }, 350)
  }

  function handleForgot(event) {
    event.preventDefault()
    if (!forgotEmail.trim()) return
    setForgotSent(true)
  }

  const isLogin = mode === 'login'
  const title = schoolScoped
    ? t(isLogin ? 'auth.schoolLoginTitle' : 'auth.schoolRegisterTitle')
    : t(isLogin ? 'auth.loginTitle' : 'auth.trainerRegisterTitle')
  const subtitle = schoolScoped
    ? t(isLogin ? 'auth.schoolLoginSubtitle' : 'auth.schoolRegisterSubtitle', { school: school.name })
    : t(isLogin ? 'auth.loginSubtitle' : 'auth.trainerRegisterSubtitle')

  if (isAuthenticated && !schoolScoped) {
    return (
      <div className="grid min-h-screen place-items-center bg-surface p-4">
        <div className="w-full max-w-sm animate-slide-up rounded-2xl border border-line bg-white p-7 text-center shadow-lg">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success-soft text-success"><BadgeCheck size={26} /></span>
          <h1 className="brand-font mt-4 text-xl font-bold text-ink">{t('auth.alreadyLoggedIn')}</h1>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">{t('auth.alreadyLoggedInDesc')}</p>
          <Button fullWidth className="mt-6" onClick={() => navigate(home || '/')} iconRight={ArrowRightRtl}>
            {t('auth.home')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[1.02fr_1fr]">
      <div
        className="relative hidden overflow-hidden bg-ink p-10 text-white lg:flex lg:flex-col lg:justify-between"
        style={{
          backgroundImage: `radial-gradient(circle at 82% 12%, ${school?.brandAccent || '#0D7A6A'}66, transparent 38%), radial-gradient(circle at 8% 92%, #E8A33D22, transparent 32%), linear-gradient(135deg, #0B2523, #123B38)`,
        }}
      >
        <div className="pointer-events-none absolute -end-24 -top-24 h-[420px] w-[420px] rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -start-20 h-[360px] w-[360px] rounded-full bg-amber-400/10 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />
        <div className="relative">
          <Link to={schoolScoped ? `/s/${school.slug}` : '/'} className="inline-flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-2xl text-white shadow-lg ring-1 ring-white/15" style={{ background: school?.brandAccent || '#0D7A6A' }}>
              {schoolScoped && school.logo ? <img src={school.logo} alt="" className="h-full w-full object-cover" /> : <GraduationCap size={21} />}
            </span>
            <span className="min-w-0">
              <span className="brand-font block truncate text-xl font-bold">{schoolScoped ? school.name : 'Tiwanza'}</span>
              {schoolScoped ? <span className="block truncate text-[10px] text-white/50" dir="ltr">{school.subdomain}</span> : null}
            </span>
          </Link>
          <div className="mt-16 max-w-md">
            <Badge className="border-white/15 bg-white/10 text-white/80">
              <Sparkles size={12} /> {schoolScoped ? t('publicSite.heroBadge') : t('app.demoBadge')}
            </Badge>
            <h2 className="brand-font mt-5 text-4xl font-bold leading-[1.1]">
              {schoolScoped ? t('auth.schoolWelcomeTitle', { school: school.name }) : <>{t('landing.heroTitle')} <span className="text-amber-300">{t('landing.heroTitleAccent')}</span></>}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/65">{schoolScoped ? school.description : t('landing.heroSubtitle')}</p>
          </div>

          <div className="mt-10 grid gap-3">
            {[
              [School, t('landing.featureSchoolTitle')],
              [BookOpen, t('landing.featureCoursesTitle')],
              [Users, t('landing.featureLearnersTitle')],
            ].map(([Icon, text]) => (
              <div key={text} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white/80 backdrop-blur">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/10"><Icon size={15} /></span>
                {text}
              </div>
            ))}
          </div>
        </div>

        <div className="relative mt-10 max-w-sm rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">{t('auth.secureAccess')}</p>
          <p className="mt-2 text-sm leading-relaxed text-white/75">{schoolScoped ? t('auth.roleContextLearner') : t('auth.roleContextTrainer')}</p>
          {schoolScoped && school.city ? <p className="mt-3 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] text-white/70">{school.city}</p> : null}
        </div>
      </div>

      <div className="flex flex-col">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-4 sm:gap-3 sm:px-5 lg:border-0">
          <Link to={schoolScoped ? `/s/${school.slug}` : '/'} className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-muted transition hover:text-ink">
            <ArrowLeft size={16} className="rtl:rotate-180" /> {t('common.back')}
          </Link>
          <Link to={schoolScoped ? `/s/${school.slug}` : '/'} className="flex shrink-0 items-center gap-2 lg:hidden">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-white" style={{ background: school?.brandAccent || '#0D7A6A' }}>
              {schoolScoped && school.logo ? <img src={school.logo} alt="" className="h-full w-full rounded-xl object-cover" /> : <GraduationCap size={15} />}
            </span>
            <span className="hidden max-w-[140px] truncate text-xs font-bold text-ink sm:block">{schoolScoped ? school.name : 'Tiwanza'}</span>
          </Link>
          <button
            type="button"
            onClick={() => navigate(authModePath(isLogin ? 'register' : 'login'))}
            className="shrink-0 rounded-lg bg-surface px-3 py-1.5 text-[11px] font-semibold text-brand transition hover:bg-brand-soft"
          >
            {isLogin ? t('auth.signupLink') : t('auth.loginLink')}
          </button>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-8">
          <div className="w-full max-w-md animate-fade-in">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand">{schoolScoped ? t('auth.roleLearner') : t('auth.roleTrainer')}</p>
            <h1 className="brand-font mt-2 break-words text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h1>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{subtitle}</p>

            {schoolScoped ? (
              <div className="mt-5 flex items-center gap-3 rounded-2xl border border-brand/15 bg-brand-soft/40 p-3.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white" style={{ background: school.brandAccent || '#0D7A6A' }}><School size={18} /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-ink">{school.name}</p>
                  <p className="truncate text-[10px] text-muted" dir="ltr">{school.subdomain}</p>
                </div>
                <Badge tone="brand">{t('auth.roleLearner')}</Badge>
              </div>
            ) : (
              <div className="mt-5 flex items-center gap-3 rounded-2xl border border-line bg-surface/60 p-3.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand text-white"><ShieldCheck size={18} /></span>
                <div className="min-w-0"><p className="text-xs font-bold text-ink">{t('auth.secureAccess')}</p><p className="text-[10px] leading-relaxed text-muted">{t('auth.roleContextTrainer')}</p></div>
              </div>
            )}

            {notice ? <Alert className="mt-4" tone="success" icon={Check}>{notice}</Alert> : null}

            {!isLogin ? (
              <form onSubmit={handleRegister} className="mt-5 space-y-3.5">
                <div>
                  <Label htmlFor="name" required>{t('auth.fullName')}</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('auth.fullNamePlaceholder')} icon={UserRound} autoComplete="name" />
                </div>
                <div>
                  <Label htmlFor="email" required>{t('auth.email')}</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('auth.emailPlaceholder')} icon={Mail} autoComplete="email" dir="ltr" />
                </div>
                <div className="grid gap-3.5 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="password" required>{t('auth.password')}</Label>
                    <div className="relative">
                      <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" icon={Lock} autoComplete="new-password" className="pe-10" />
                      <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink">
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="confirm" required>{t('auth.confirmPassword')}</Label>
                    <Input id="confirm" type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" icon={Lock} autoComplete="new-password" />
                  </div>
                </div>
                <div className="rounded-xl border border-line bg-surface/60 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-muted">{t('auth.passwordStrength')}</span>
                    <span className={cn('text-[10px] font-bold', passwordStrength.score >= 3 ? 'text-success' : passwordStrength.score === 2 ? 'text-warning' : 'text-danger')}>{t(passwordStrength.key)}</span>
                  </div>
                  <div className="mt-2 flex gap-1.5">
                    {[1, 2, 3, 4].map((step) => <span key={step} className={cn('h-1.5 flex-1 rounded-full transition-colors', step <= passwordStrength.score ? (passwordStrength.score >= 3 ? 'bg-success' : passwordStrength.score === 2 ? 'bg-warning' : 'bg-danger') : 'bg-line')} />)}
                  </div>
                </div>
                <label className="flex cursor-pointer items-start gap-2.5 rounded-lg bg-surface/70 p-2.5">
                  <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-line text-brand accent-[#0D7A6A]" />
                  <span className="text-[11px] leading-relaxed text-muted">
                    {t('auth.terms')}
                  </span>
                </label>
                {error ? <Alert tone="danger" icon={ShieldCheck}>{error}</Alert> : null}
                <Button type="submit" fullWidth size="lg" loading={loading}>
                  {loading ? t('auth.creatingAccount') : schoolScoped ? t('auth.createLearner') : t('auth.createTrainer')}
                </Button>
                <p className="text-center text-xs text-muted">
                  {t('auth.hasAccount')}{' '}
                  <Link to={authModePath('login')} className="font-semibold text-brand hover:underline">{t('auth.loginLink')}</Link>
                </p>
              </form>
            ) : (
              <>
                <form onSubmit={handleLogin} className="mt-6 space-y-4">
                  <div>
                    <Label htmlFor="login-email" required>{t('auth.email')}</Label>
                    <Input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('auth.emailPlaceholder')} icon={Mail} autoComplete="email" dir="ltr" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password" required>{t('auth.password')}</Label>
                      <button type="button" onClick={() => setForgotOpen(true)} className="mb-1.5 text-[11px] font-medium text-brand hover:underline">{t('auth.forgotPassword')}</button>
                    </div>
                    <div className="relative">
                      <Input id="login-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('auth.passwordPlaceholder')} icon={Lock} autoComplete="current-password" className="pe-10" />
                      <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink">
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                  {error ? <Alert tone="danger" icon={ShieldCheck}>{error}</Alert> : null}
                  <Button type="submit" fullWidth size="lg" loading={loading}>
                    {loading ? t('auth.loggingIn') : t('auth.login')}
                  </Button>
                </form>

                <Divider label={t('auth.or')} className="my-6" />

                <details className="group rounded-2xl border border-line bg-surface/40 [&::-webkit-details-marker]:hidden" open={schoolScoped}>
                  <summary className="flex cursor-pointer list-none items-center gap-3 p-3.5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-line bg-white text-muted"><KeyRound size={16} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-bold text-ink">{t('auth.demoHint')}</span>
                      <span className="block truncate text-[10px] text-muted">{t('auth.demoNotice')}</span>
                    </span>
                    <Badge tone="brand">{t('app.demoBadge')}</Badge>
                    <ChevronDown size={15} className="shrink-0 text-muted transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="space-y-2 border-t border-line p-3">
                    {visibleDemoAccounts.map((account) => (
                      <button
                        key={account.id}
                        type="button"
                        onClick={() => handleDemo(account)}
                        disabled={Boolean(demoLoading)}
                        className="flex w-full items-center gap-3 rounded-xl border border-line bg-white p-2.5 text-start transition hover:border-brand/30 hover:bg-surface disabled:opacity-70"
                      >
                        <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-lg border', account.tone)}>
                          <account.icon size={16} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-semibold text-ink">{t(`auth.demo${account.role.charAt(0).toUpperCase()}${account.role.slice(1)}`)}</span>
                          <span className="block truncate text-[10px] text-muted">{account.name} · {account.email}</span>
                          {account.courses !== undefined ? <span className="mt-0.5 block text-[10px] font-semibold text-brand">{t('auth.demoLearnerCourses', { count: account.courses, progress: account.progress })}</span> : null}
                        </span>
                        {demoLoading === account.id ? <Loader2 size={15} className="animate-spin text-brand" /> : <ArrowRight size={15} className="text-muted rtl:rotate-180" />}
                      </button>
                    ))}
                    <p className="inline-flex max-w-full flex-wrap items-center gap-1.5 px-1 pt-1 text-[10px] text-muted">
                      <KeyRound size={11} /> {t('auth.demoPasswordHint', { password: 'demo1234' })}
                    </p>
                    {!schoolScoped ? (
                      <p className="rounded-lg bg-surface p-2.5 text-[11px] leading-relaxed text-muted">
                        {t('auth.studentAccessHint')}
                      </p>
                    ) : null}
                  </div>
                </details>
              </>
            )}
          </div>
        </div>

        <div className="border-t border-line px-5 py-4 text-center text-[10px] leading-relaxed text-muted lg:border-0">
          <ShieldCheck size={12} className="mx-auto mb-1.5 text-brand" />
          {t('auth.demoNotice')}
        </div>
      </div>

      {forgotOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-4 backdrop-blur-sm">
          <div className="thin-scroll max-h-[92vh] w-full max-w-sm animate-slide-up overflow-y-auto rounded-2xl border border-line bg-white shadow-2xl">
            <div className="h-1 w-full" style={{ background: school?.brandAccent || '#0D7A6A' }} />
            <div className="p-5">
            <div className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand"><KeyRound size={17} /></span>
              <h2 className="brand-font text-base font-bold text-ink">{t('auth.forgotTitle')}</h2>
            </div>
            {forgotSent ? (
              <>
                <div className="mt-4"><Alert tone="success" icon={Check}>{t('auth.forgotSent')}</Alert></div>
                <Button fullWidth className="mt-4" onClick={() => { setForgotOpen(false); setForgotSent(false) }}>{t('common.close')}</Button>
              </>
            ) : (
              <form onSubmit={handleForgot}>
                <p className="mt-2 text-xs leading-relaxed text-muted">{t('auth.forgotSubtitle')}</p>
                <div className="mt-3">
                  <Label htmlFor="forgot-email">{t('auth.email')}</Label>
                  <Input id="forgot-email" type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder={t('auth.emailPlaceholder')} dir="ltr" />
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setForgotOpen(false)}>{t('common.cancel')}</Button>
                  <Button type="submit" size="sm">{t('auth.sendReset')}</Button>
                </div>
              </form>
            )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
