import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Check,
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
import { Alert, Badge, Button, Divider, FieldError, Input, Label, Select } from '../../components/ui.jsx'
import { cn } from '../../lib/utils.js'

const demoAccounts = [
  { id: 'u-admin', role: 'admin', name: 'Yasmine Tiwanza', email: 'admin@tiwanza.dz', icon: ShieldCheck, tone: 'bg-brand-soft text-brand border-brand/20' },
  { id: 'u-t1', role: 'trainer', name: 'Yacine Belkacem', email: 'yacine@nour-academy.dz', icon: GraduationCap, tone: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'u-l1', role: 'learner', name: 'Amina Cherif', email: 'amina@example.dz', icon: BookOpen, tone: 'bg-amber-50 text-amber-700 border-amber-200' },
]

export default function AuthPage({ mode = 'login' }) {
  const { t } = useI18n()
  const { login, demoLogin, registerLearner, registerTrainer, isAuthenticated } = useAuth()
  const { success, error: toastError, info } = useToast()
  const state = useTiwanzaStore()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const initialRole = params.get('role') === 'learner' ? 'learner' : 'trainer'
  const [role, setRole] = useState(initialRole)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [schoolId, setSchoolId] = useState('')
  const [terms, setTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState(null)
  const [error, setError] = useState('')
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)

  useEffect(() => {
    const nextRole = params.get('role') === 'learner' ? 'learner' : 'trainer'
    setRole(nextRole)
    setError('')
  }, [params])

  const publicSchools = useMemo(() => state.schools.slice().sort((a, b) => a.name.localeCompare(b.name)), [state.schools])

  function redirectAfterAuth(user) {
    const profile = state.trainerProfiles.find((item) => item.userId === user.id)
    if (user.role === 'trainer' && (!user.schoolId || !profile?.onboardingComplete)) {
      navigate('/onboarding')
      return
    }
    const redirect = params.get('redirect')
    if (redirect && redirect.startsWith('/')) {
      navigate(redirect)
      return
    }
    navigate(roleHome[user.role] || '/')
  }

  function handleLogin(event) {
    event.preventDefault()
    setError('')
    if (!email.trim()) return setError(t('errors.emailRequired'))
    if (!password) return setError(t('errors.passwordRequired'))
    setLoading(true)
    window.setTimeout(() => {
      const result = login(email, password)
      setLoading(false)
      if (!result.ok) {
        setError(result.error === 'suspended' ? t('auth.accountSuspended') : t('errors.invalidCredentials'))
        return
      }
      success(t('auth.welcomeBack', { name: result.user.name.split(' ')[0] }), t('auth.loginSuccess'))
      redirectAfterAuth(result.user)
    }, 420)
  }

  function handleRegister(event) {
    event.preventDefault()
    setError('')
    if (!name.trim()) return setError(t('errors.required'))
    if (!email.trim()) return setError(t('errors.emailRequired'))
    if (password.length < 8) return setError(t('errors.passwordLength'))
    if (password !== confirmPassword) return setError(t('errors.passwordMismatch'))
    if (!terms) return setError(t('auth.termsRequired'))
    if (role === 'learner' && !schoolId) return setError(t('auth.schoolRequired'))
    setLoading(true)
    window.setTimeout(() => {
      const result =
        role === 'trainer'
          ? registerTrainer({ name, email, password, language: useI18nLanguage() })
          : registerLearner({ name, email, password, schoolId, language: useI18nLanguage() })
      setLoading(false)
      if (!result.ok) {
        setError(result.error === 'email-taken' ? t('auth.emailTaken') : t('errors.generic'))
        return
      }
      success(t('auth.accountCreated'), role === 'trainer' ? t('onboarding.subtitle') : t('auth.registerSuccess'))
      const redirect = params.get('redirect')
      if (role === 'trainer') navigate('/onboarding')
      else navigate(redirect && redirect.startsWith('/') ? redirect : '/learn')
    }, 500)
  }

  function useI18nLanguage() {
    return document.documentElement.lang === 'ar' ? 'ar' : 'fr'
  }

  function handleDemo(account) {
    setDemoLoading(account.id)
    window.setTimeout(() => {
      const result = demoLogin(account.id)
      setDemoLoading(null)
      if (!result.ok) {
        toastError(t('errors.generic'))
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
  const title = isLogin
    ? t('auth.loginTitle')
    : role === 'trainer'
      ? t('auth.trainerRegisterTitle')
      : t('auth.learnerRegisterTitle')
  const subtitle = isLogin
    ? t('auth.loginSubtitle')
    : role === 'trainer'
      ? t('auth.trainerRegisterSubtitle')
      : t('auth.learnerRegisterSubtitle')

  if (isAuthenticated) {
    return (
      <div className="grid min-h-screen place-items-center bg-surface p-4">
        <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-6 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-soft text-brand"><BadgeCheck size={24} /></span>
          <h1 className="brand-font mt-3 text-xl font-bold text-ink">{t('auth.alreadyLoggedIn')}</h1>
          <p className="mt-1 text-xs text-muted">{t('auth.alreadyLoggedInDesc')}</p>
          <Button fullWidth className="mt-5" onClick={() => navigate('/')} icon={ArrowRight}>
            {t('common.continue')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[1.02fr_1fr]">
      <div className="relative hidden overflow-hidden bg-ink p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -end-24 -top-24 h-[420px] w-[420px] rounded-full bg-brand/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -start-20 h-[360px] w-[360px] rounded-full bg-amber-400/10 blur-3xl" />
        <div className="relative">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <span className="brand-gradient grid h-9 w-9 place-items-center rounded-xl text-white"><GraduationCap size={19} /></span>
            <span className="brand-font text-xl font-bold">Tiwanza</span>
          </Link>
          <div className="mt-16 max-w-md">
            <Badge className="border-white/15 bg-white/10 text-white/80">
              <Sparkles size={12} /> {t('app.demoBadge')}
            </Badge>
            <h2 className="brand-font mt-4 text-4xl font-bold leading-tight">{t('landing.heroTitle')} <span className="text-amber-300">{t('landing.heroTitleAccent')}</span></h2>
            <p className="mt-4 text-sm leading-relaxed text-white/60">{t('landing.heroSubtitle')}</p>
          </div>

          <div className="mt-10 space-y-3">
            {[
              [School, t('landing.featureSchoolTitle')],
              [BookOpen, t('landing.featureCoursesTitle')],
              [Users, t('landing.featureLearnersTitle')],
            ].map(([Icon, text]) => (
              <div key={text} className="flex items-center gap-3 text-sm text-white/80">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/10"><Icon size={15} /></span>
                {text}
              </div>
            ))}
          </div>
        </div>

        <div className="relative max-w-sm rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
          <p className="text-xs leading-relaxed text-white/70">“{t('landing.testimonial2')}”</p>
          <div className="mt-3 flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-amber-300 text-[10px] font-bold text-ink">IH</span>
            <div>
              <p className="text-xs font-semibold">{t('landing.testimonial2Author')}</p>
              <p className="text-[10px] text-white/50">{t('landing.testimonial2Role')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center justify-between border-b border-line px-5 py-4 lg:border-0">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-ink">
            <ArrowLeft size={16} className="rtl:rotate-180" /> {t('common.back')}
          </Link>
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <span className="brand-gradient grid h-7 w-7 place-items-center rounded-lg text-white"><GraduationCap size={15} /></span>
            <span className="brand-font font-bold text-ink">Tiwanza</span>
          </Link>
          <button type="button" onClick={() => navigate(isLogin ? '/register?role=trainer' : '/login')} className="text-xs font-semibold text-brand hover:underline">
            {isLogin ? t('auth.signupLink') : t('auth.loginLink')}
          </button>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-8">
          <div className="w-full max-w-md">
            <h1 className="brand-font text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h1>
            <p className="mt-1.5 text-sm text-muted">{subtitle}</p>

            {!isLogin ? (
              <div className="mt-5 grid grid-cols-2 gap-2">
                {[
                  { value: 'trainer', icon: GraduationCap, label: t('auth.roleTrainer'), desc: t('auth.roleTrainerDesc') },
                  { value: 'learner', icon: BookOpen, label: t('auth.roleLearner'), desc: t('auth.roleLearnerDesc') },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => { setRole(item.value); setError('') }}
                    className={cn(
                      'rounded-xl border p-3 text-start transition',
                      role === item.value ? 'border-brand bg-brand-soft/60 ring-2 ring-brand/15' : 'border-line bg-white hover:border-brand/30',
                    )}
                  >
                    <span className={cn('grid h-8 w-8 place-items-center rounded-lg', role === item.value ? 'bg-brand text-white' : 'bg-surface text-muted')}>
                      <item.icon size={16} />
                    </span>
                    <span className="mt-2 block text-xs font-semibold text-ink">{item.label}</span>
                    <span className="mt-0.5 block text-[10px] leading-relaxed text-muted">{item.desc}</span>
                  </button>
                ))}
              </div>
            ) : null}

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
                {role === 'learner' ? (
                  <div>
                    <Label htmlFor="school" required>{t('auth.chooseSchool')}</Label>
                    <Select id="school" value={schoolId} onChange={(e) => setSchoolId(e.target.value)}>
                      <option value="">{t('auth.chooseSchoolPlaceholder')}</option>
                      {publicSchools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}
                    </Select>
                  </div>
                ) : null}
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
                <label className="flex cursor-pointer items-start gap-2.5 rounded-lg bg-surface/70 p-2.5">
                  <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-line text-brand accent-[#0D7A6A]" />
                  <span className="text-[11px] leading-relaxed text-muted">
                    {t('auth.terms')}
                  </span>
                </label>
                {error ? <Alert tone="danger">{error}</Alert> : null}
                <Button type="submit" fullWidth size="lg" loading={loading}>
                  {role === 'trainer' ? t('auth.createTrainer') : t('auth.createLearner')}
                </Button>
                <p className="text-center text-xs text-muted">
                  {t('auth.hasAccount')}{' '}
                  <Link to="/login" className="font-semibold text-brand hover:underline">{t('auth.loginLink')}</Link>
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
                  {error ? <Alert tone="danger">{error}</Alert> : null}
                  <Button type="submit" fullWidth size="lg" loading={loading}>
                    {loading ? t('auth.loggingIn') : t('auth.login')}
                  </Button>
                </form>

                <Divider label={t('auth.or')} className="my-6" />

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold text-ink">{t('auth.demoTitle')}</p>
                    <Badge tone="brand">{t('app.demoBadge')}</Badge>
                  </div>
                  <div className="space-y-2">
                    {demoAccounts.map((account) => (
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
                        </span>
                        {demoLoading === account.id ? <Loader2 size={15} className="animate-spin text-brand" /> : <ArrowRight size={15} className="text-muted rtl:rotate-180" />}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 inline-flex items-center gap-1.5 text-[10px] text-muted">
                    <KeyRound size={11} /> {t('auth.demoPasswordHint', { password: 'demo1234' })}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="px-5 pb-5 text-center text-[10px] text-muted">
          {t('auth.demoNotice')}
        </div>
      </div>

      {forgotOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4">
          <div className="w-full max-w-sm animate-slide-up rounded-2xl border border-line bg-white p-5">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-soft text-brand"><KeyRound size={17} /></span>
              <h2 className="text-sm font-semibold text-ink">{t('auth.forgotTitle')}</h2>
            </div>
            {forgotSent ? (
              <>
                <p className="mt-3 text-xs leading-relaxed text-muted">{t('auth.forgotSent')}</p>
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
      ) : null}
    </div>
  )
}
