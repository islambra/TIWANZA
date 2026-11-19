import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Award,
  Banknote,
  BookOpen,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  CreditCard,
  FileText,
  Filter,
  GraduationCap,
  Globe2,
  Layers,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Menu,
  MessageSquare,
  Phone,
  PlayCircle,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Store,
  Target,
  Users,
  Video,
  Wallet,
  X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useI18n } from '../../i18n/I18nContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { useTiwanzaStore } from '../../data/store.js'
import {
  getBlocks,
  getCourse,
  getCourseDurationMinutes,
  getCourseLearnerCount,
  getCourseLessons,
  getCoursePreviewLessons,
  getCoursePaymentOptions,
  getCourseRating,
  getCourseReviews,
  getCourseStats,
  getEnrollment,
  getLessonDisplayType,
  getPublishedCourses,
  getQuizByLesson,
  getRelatedCourses,
  getSchoolBySlug,
  getSections,
  getTrainerBySchool,
  getTrainerProfile,
} from '../../data/selectors.js'
import {
  enrollFree,
  requestManualEnrollment,
  submitCourseOnlinePayment,
} from '../../data/services.js'
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  IconButton,
  Input,
  Label,
  Modal,
  ProgressBar,
  RatingStars,
  Select,
  Textarea,
} from '../../components/ui.jsx'
import { LessonBlock } from '../../components/LessonContent.jsx'
import LanguageSwitcher from '../../components/LanguageSwitcher.jsx'
import { paymentMethodDescriptionKey, paymentMethodLabelKey } from '../../data/paymentMethods.js'
import { cn } from '../../lib/utils.js'

function useSchoolPublic() {
  const { slug } = useParams()
  const state = useTiwanzaStore()
  const school = getSchoolBySlug(state, slug)
  const trainer = school ? getTrainerBySchool(state, school.id) : null
  return { state, school, trainer }
}

function levelLabel(t, difficulty) {
  if (difficulty === 'advanced') return t('publicSite.levelAdvanced')
  if (difficulty === 'intermediate') return t('publicSite.levelIntermediate')
  return t('publicSite.levelBeginner')
}

function formatDuration(minutes) {
  const total = Number(minutes) || 0
  if (total < 60) return `${total} min`
  const hours = Math.floor(total / 60)
  const rest = total % 60
  return rest ? `${hours} h ${rest} min` : `${hours} h`
}

function checkoutErrorMessage(t, code) {
  if (code === 'subscription-required') return t('checkout.errors.subscriptionRequired')
  if (code === 'learner-limit') return t('checkout.errors.learnerLimit')
  if (code === 'storage-limit') return t('checkout.errors.storageLimit')
  if (code === 'already-enrolled') return t('checkout.errors.alreadyEnrolled')
  if (code === 'already-pending') return t('checkout.errors.alreadyPending')
  if (code === 'not-published') return t('checkout.errors.notPublished')
  if (code === 'school-not-allowed') return t('checkout.errors.schoolMismatch')
  if (code === 'online-disabled') return t('checkout.errors.onlineDisabled')
  if (code === 'manual-disabled') return t('checkout.errors.manualDisabled')
  if (code === 'not-free') return t('checkout.errors.notFree')
  if (code === 'reference-required') return t('checkout.referenceRequired')
  return t('checkout.paymentFailed')
}

function coverImageFor(course, school) {
  if (course.coverImage) return course.coverImage
  const seed = `${course.id || ''}${course.title || ''}`
  let hash = 0
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0
  }
  const hue = hash % 360
  const accent = /^#[0-9a-fA-F]{3,8}$/.test(school?.brandAccent || '') ? school.brandAccent : '#0D7A6A'
  const letter = (course.title || 'T').trim().charAt(0).toUpperCase().replace(/[<>&"']/g, '')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${accent}"/><stop offset="1" stop-color="hsl(${hue}, 58%, 26%)"/></linearGradient></defs><rect width="640" height="360" fill="url(#g)"/><circle cx="530" cy="70" r="150" fill="#fff" opacity="0.08"/><circle cx="80" cy="330" r="180" fill="#fff" opacity="0.06"/><path d="M0 300 L640 210 L640 360 L0 360 Z" fill="#000" opacity="0.08"/><text x="48" y="235" font-family="Arial, sans-serif" font-size="160" font-weight="700" fill="#fff" opacity="0.18">${letter}</text></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function heroArtwork(school) {
  const accent = /^#[0-9a-fA-F]{3,8}$/.test(school?.brandAccent || '') ? school.brandAccent : '#0D7A6A'
  const initial = (school?.name || 'T').trim().charAt(0).toUpperCase().replace(/[<>&"']/g, '')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="620" viewBox="0 0 720 620"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${accent}"/><stop offset="1" stop-color="#0B2523"/></linearGradient><linearGradient id="glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0.24"/><stop offset="1" stop-color="#ffffff" stop-opacity="0.04"/></linearGradient></defs><rect width="720" height="620" rx="36" fill="url(#bg)"/><circle cx="600" cy="90" r="210" fill="#fff" opacity="0.06"/><circle cx="70" cy="560" r="190" fill="#fff" opacity="0.05"/><g stroke="#fff" stroke-opacity="0.12" fill="none"><path d="M0 150H720M0 300H720M0 450H720M160 0V620M360 0V620M560 0V620"/></g><rect x="96" y="96" width="420" height="300" rx="26" fill="url(#glass)" stroke="#fff" stroke-opacity="0.2"/><rect x="126" y="126" width="120" height="12" rx="6" fill="#fff" opacity="0.4"/><rect x="126" y="156" width="230" height="18" rx="9" fill="#fff" opacity="0.75"/><rect x="126" y="188" width="180" height="12" rx="6" fill="#fff" opacity="0.35"/><rect x="126" y="252" width="336" height="108" rx="18" fill="#fff" opacity="0.1" stroke="#fff" stroke-opacity="0.18"/><circle cx="178" cy="306" r="24" fill="#fff" opacity="0.3"/><rect x="220" y="288" width="180" height="12" rx="6" fill="#fff" opacity="0.55"/><rect x="220" y="312" width="110" height="10" rx="5" fill="#fff" opacity="0.3"/><rect x="450" y="330" width="200" height="220" rx="24" fill="#0B2523" opacity="0.55" stroke="#fff" stroke-opacity="0.22"/><circle cx="550" cy="410" r="42" fill="#fff" opacity="0.16"/><path d="M500 470h100M516 492h68" stroke="#fff" stroke-opacity="0.4" stroke-width="10" stroke-linecap="round"/><text x="96" y="560" font-family="Arial, sans-serif" font-size="150" font-weight="700" fill="#fff" opacity="0.16">${initial}</text></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function courseRibbon(course, students) {
  const created = course.createdAt ? new Date(course.createdAt).getTime() : 0
  if (students >= 10) return { key: 'publicSite.bestseller', tone: 'warning' }
  if (created && Date.now() - created < 30 * 24 * 60 * 60 * 1000) return { key: 'publicSite.newCourse', tone: 'brand' }
  return null
}

function courseInstructor(state, school, course) {
  return state.users.find((item) => item.id === course.instructorId || item.id === course.trainerId)
    || getTrainerBySchool(state, school.id)
}

function CourseCard({ course, school, state, t, money }) {
  const lessons = getCourseLessons(state, course.id)
  const students = getCourseLearnerCount(state, course.id)
  const duration = getCourseDurationMinutes(state, course.id)
  const rating = getCourseRating(state, course.id)
  const instructor = courseInstructor(state, school, course)
  const ribbon = courseRibbon(course, students)
  return (
    <Link to={`/s/${school.slug}/courses/${course.id}`} className="group flex h-full animate-fade-in flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(11,37,35,0.04)] transition duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-xl" style={{ borderTopColor: school.brandAccent || '#0D7A6A', borderTopWidth: 3 }}>
      <div className="relative h-44 overflow-hidden" style={{ background: course.cover }}>
        <img src={coverImageFor(course, school)} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent" />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          <div className="flex min-w-0 flex-wrap gap-1.5">
            <Badge className="border-white/20 bg-black/30 text-white">{course.category || t('publicSite.coursesAll')}</Badge>
            {ribbon ? <Badge tone={ribbon.tone} className="border-white/20 bg-white/90">{t(ribbon.key)}</Badge> : null}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <Badge className="border-white/20 bg-white/15 text-white">{levelLabel(t, course.difficulty)}</Badge>
            {course.isFree ? <Badge className="border-white/20 bg-white/90 text-ink">{t('publicSite.free')}</Badge> : null}
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="truncate text-[9px] font-semibold uppercase tracking-[0.18em] text-white/70">{course.coverLabel}</p>
          <h3 className="mt-1 line-clamp-2 text-base font-bold leading-snug text-white">{course.title}</h3>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="line-clamp-2 text-xs leading-relaxed text-muted">{course.shortDescription}</p>
        {instructor ? (
          <div className="mt-3 flex items-center gap-2 border-b border-line pb-3">
            <Avatar name={instructor.name} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold text-ink">{instructor.name}</p>
              <p className="truncate text-[10px] text-muted">{t('publicSite.instructorRole')}</p>
            </div>
          </div>
        ) : null}
        <div className="mt-3 flex items-center gap-1.5 text-[10px] text-muted">
          {rating.count ? <><RatingStars value={rating.average} size={12} /><span className="font-semibold text-ink">{rating.average}</span><span>({t('publicSite.reviewsCount', { count: rating.count })})</span></> : <span>{t('publicSite.noRatings')}</span>}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted">
          <span className="flex items-center gap-1"><BookOpen size={11} />{t('publicSite.lessonsCount', { count: lessons.length })}</span>
          <span className="flex items-center gap-1"><Clock size={11} />{formatDuration(duration)}</span>
          <span className="flex items-center gap-1"><Users size={11} />{t('publicSite.studentsCount', { count: students })}</span>
        </div>
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-line pt-3">
          <div className="min-w-0">
            <p className="truncate text-[9px] uppercase tracking-wide text-muted">{course.isFree ? t('publicSite.freeCourses') : t('publicSite.oneTimePayment')}</p>
            <p className="mt-0.5 text-lg font-bold text-ink">{course.isFree ? t('publicSite.free') : money(course.priceDA)}</p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-brand-soft px-2.5 py-1.5 text-[11px] font-semibold text-brand-dark transition group-hover:bg-brand group-hover:text-white">
            {t('publicSite.viewCourse')}<ArrowRight size={13} className="rtl:rotate-180" />
          </span>
        </div>
      </div>
    </Link>
  )
}

function SchoolHeader({ school }) {
  const { t } = useI18n()
  const { user, isAuthenticated, home } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [active, setActive] = useState('home')
  const location = useLocation()
  const schoolMember = isAuthenticated && user?.role === 'learner' && user.schoolId === school.id
  const navItems = [
    { id: 'home', href: `/s/${school.slug}`, label: t('publicSite.navHome'), icon: GraduationCap },
    { id: 'courses', href: `/s/${school.slug}/catalog`, label: t('publicSite.navCourses'), icon: BookOpen },
    { id: 'about', href: `/s/${school.slug}#about`, label: t('publicSite.navAbout'), icon: Building2 },
    { id: 'contact', href: `/s/${school.slug}#contact`, label: t('publicSite.navContact'), icon: Mail },
  ]

  useEffect(() => {
    setMenuOpen(false)
    const ids = navItems.slice(1).map((item) => item.id)
    function updateActive() {
      const fromHash = location.hash.replace('#', '')
      if (window.scrollY < 140) return setActive(ids.includes(fromHash) ? fromHash : 'home')
      const current = [...ids].reverse().find((id) => {
        const element = document.getElementById(id)
        return element && element.getBoundingClientRect().top <= 180
      })
      setActive(current || 'home')
    }
    updateActive()
    window.addEventListener('scroll', updateActive, { passive: true })
    window.addEventListener('resize', updateActive)
    return () => {
      window.removeEventListener('scroll', updateActive)
      window.removeEventListener('resize', updateActive)
    }
  }, [location.pathname, location.hash])

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 shadow-[0_1px_12px_rgba(11,37,35,0.04)] backdrop-blur-xl">
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${school.brandAccent || '#0D7A6A'}, transparent 72%)` }} />
      <div className="mx-auto flex h-[72px] max-w-6xl items-center gap-3 px-4">
        <Link to={`/s/${school.slug}`} className="group flex min-w-0 items-center gap-3" onClick={() => setMenuOpen(false)}>
          <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl text-white shadow-sm ring-1 ring-black/5 transition group-hover:scale-105" style={{ background: school.brandAccent || '#0D7A6A' }}>
            {school.logo ? <img src={school.logo} alt="" className="h-full w-full object-cover" /> : <GraduationCap size={22} />}
          </span>
          <span className="min-w-0">
            <span className="block truncate brand-font text-[15px] font-bold leading-tight text-ink">{school.name}</span>
            <span className="block truncate text-[10px] leading-tight text-muted" dir="ltr">{school.subdomain}</span>
          </span>
        </Link>
        <nav className="ms-auto hidden items-center gap-1 lg:flex" aria-label={t('publicSite.quickLinks')}>
          {navItems.map((item) => {
            const isActive = active === item.id
            return (
              <a
                key={item.id}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn('relative rounded-xl px-3.5 py-2 text-xs font-semibold transition', isActive ? 'text-brand-dark' : 'text-muted hover:bg-surface hover:text-ink')}
              >
                {item.label}
                {isActive ? <span className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full" style={{ background: school.brandAccent || '#0D7A6A' }} /> : null}
              </a>
            )
          })}
        </nav>
        <div className="ms-auto flex items-center gap-2 lg:ms-2">
          <LanguageSwitcher variant="outline" icon={Globe2} />
          {schoolMember ? (
            <Link to={home}><Button size="sm" icon={ArrowUpRight}>{t('publicSite.navMySpace')}</Button></Link>
          ) : (
            <div className="hidden items-center gap-1 rounded-xl border border-line bg-surface/60 p-1 sm:flex">
              <Link to={`/s/${school.slug}/login`}><Button variant="ghost" size="sm">{t('publicSite.navLogin')}</Button></Link>
              <Link to={`/s/${school.slug}/register`}><Button size="sm">{t('publicSite.navRegister')}</Button></Link>
            </div>
          )}
          <IconButton label={menuOpen ? t('common.closeMenu') : t('common.openMenu')} onClick={() => setMenuOpen((value) => !value)} className="lg:hidden" variant="outline">
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </IconButton>
        </div>
      </div>
      {menuOpen ? (
        <div className="animate-slide-up border-t border-line bg-white px-4 py-4 shadow-lg lg:hidden">
          <div className="mx-auto max-w-6xl">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{t('publicSite.quickLinks')}</p>
            <div className="mt-2 grid gap-1">
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn('flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition', active === item.id ? 'bg-brand-soft text-brand-dark' : 'text-muted hover:bg-surface hover:text-ink')}
                >
                  <span className={cn('grid h-8 w-8 place-items-center rounded-lg', active === item.id ? 'bg-white text-brand' : 'bg-surface text-muted')}><item.icon size={16} /></span>
                  {item.label}
                  <ChevronRight size={15} className="ms-auto text-muted rtl:rotate-180" />
                </a>
              ))}
            </div>
            <div className="mt-4 grid gap-2 border-t border-line pt-4">
              {schoolMember ? (
                <Link to={home} onClick={() => setMenuOpen(false)}><Button fullWidth size="sm" icon={ArrowUpRight}>{t('publicSite.navMySpace')}</Button></Link>
              ) : (
                <>
                  <Link to={`/s/${school.slug}/login`} onClick={() => setMenuOpen(false)}><Button variant="secondary" fullWidth size="sm">{t('publicSite.navLogin')}</Button></Link>
                  <Link to={`/s/${school.slug}/register`} onClick={() => setMenuOpen(false)}><Button fullWidth size="sm">{t('publicSite.navRegister')}</Button></Link>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  )
}

function SchoolFooter({ school, trainer }) {
  const { t } = useI18n()
  const { success } = useToast()
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [invalid, setInvalid] = useState(false)
  const accent = school.brandAccent || '#0D7A6A'

  function subscribe(event) {
    event.preventDefault()
    const value = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setInvalid(true)
      return
    }
    setInvalid(false)
    setSubscribed(true)
    success(t('publicSite.newsletterSuccess'), t('publicSite.newsletterSuccessDesc', { email: value }))
  }

  return (
    <footer className="mt-12 overflow-hidden bg-ink text-white/70">
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${accent}, transparent 72%)` }} />
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 border-b border-white/10 pb-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="flex items-center gap-3 text-white">
              <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-2xl" style={{ background: accent }}>
                {school.logo ? <img src={school.logo} alt="" className="h-full w-full object-cover" /> : <GraduationCap size={21} />}
              </span>
              <div className="min-w-0">
                <p className="brand-font truncate text-lg font-bold">{school.name}</p>
                <p className="truncate text-[10px] text-white/50" dir="ltr">{school.subdomain}</p>
              </div>
            </div>
            <p className="mt-4 max-w-xl text-xs leading-relaxed text-white/60">{school.description}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <p className="text-sm font-bold text-white">{t('publicSite.newsletterTitle')}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-white/60">{t('publicSite.newsletterDesc')}</p>
            {subscribed ? (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-success/30 bg-success-soft/10 p-3 text-[11px] text-success"><CheckCircle2 size={16} />{t('publicSite.newsletterSuccess')}</div>
            ) : (
              <form onSubmit={subscribe} className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Input type="email" value={email} onChange={(event) => { setEmail(event.target.value); setInvalid(false) }} placeholder={t('publicSite.newsletterPlaceholder')} icon={Mail} aria-label={t('publicSite.newsletterPlaceholder')} className="min-w-0 flex-1 border-white/15 bg-white/5 text-white placeholder:text-white/40" />
                <Button type="submit" icon={Send} className="shrink-0">{t('publicSite.newsletterSubscribe')}</Button>
              </form>
            )}
            {invalid ? <p className="mt-2 text-[10px] text-danger">{t('publicSite.newsletterInvalid')}</p> : null}
          </div>
        </div>

        <div className="grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white">{t('publicSite.quickLinks')}</p>
            <div className="mt-4 flex flex-col gap-2.5 text-[11px]">
              <a href={`/s/${school.slug}/catalog`} className="inline-flex w-fit items-center gap-1.5 transition hover:text-white"><ChevronRight size={12} className="rtl:rotate-180" />{t('publicSite.navCourses')}</a>
              <a href={`/s/${school.slug}#about`} className="inline-flex w-fit items-center gap-1.5 transition hover:text-white"><ChevronRight size={12} className="rtl:rotate-180" />{t('publicSite.navAbout')}</a>
              <a href={`/s/${school.slug}#contact`} className="inline-flex w-fit items-center gap-1.5 transition hover:text-white"><ChevronRight size={12} className="rtl:rotate-180" />{t('publicSite.navContact')}</a>
              <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="inline-flex w-fit items-center gap-1.5 transition hover:text-white"><ArrowUpRight size={12} />{t('publicSite.backToTop')}</button>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white">{t('publicSite.contactInfo')}</p>
            <div className="mt-4 space-y-2.5 text-[11px]">
              {school.contactEmail ? <a href={`mailto:${school.contactEmail}`} className="flex items-center gap-2 break-all transition hover:text-white"><Mail size={13} style={{ color: accent }} />{school.contactEmail}</a> : null}
              {school.contactPhone ? <a href={`tel:${school.contactPhone.replace(/\s/g, '')}`} className="flex items-center gap-2 transition hover:text-white" dir="ltr"><Phone size={13} style={{ color: accent }} />{school.contactPhone}</a> : null}
              {school.city ? <p className="flex items-center gap-2"><MapPin size={13} style={{ color: accent }} />{school.city}</p> : null}
              {trainer ? <p className="flex items-center gap-2"><Users size={13} style={{ color: accent }} />{trainer.name}</p> : null}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white">{t('publicSite.stayConnected')}</p>
            <p className="mt-4 text-[11px] leading-relaxed text-white/60">{t('publicSite.legalNote')}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white">{t('publicSite.schoolSince', { year: school.createdAt ? new Date(school.createdAt).getFullYear() : new Date().getFullYear() })}</p>
            <p className="mt-3 text-[11px] leading-relaxed text-white/60">{t('publicSite.poweredBy')}</p>
            <div className="mt-3 flex h-1.5 w-16 overflow-hidden rounded-full bg-white/10"><span className="h-full w-2/3 rounded-full" style={{ background: accent }} /></div>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-white/10 pt-5 text-[10px] text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>{t('publicSite.footerRights', { year: new Date().getFullYear(), school: school.name })}</p>
          <p>{t('publicSite.footerTagline')}</p>
        </div>
      </div>
    </footer>
  )
}

function SchoolCatalog({ state, school }) {
  const { t, money } = useI18n()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [level, setLevel] = useState('all')
  const [price, setPrice] = useState('all')
  const [courseLanguage, setCourseLanguage] = useState('all')
  const [sort, setSort] = useState('popular')

  const courses = getPublishedCourses(state, school.id)
  const categories = [...new Set(courses.map((course) => course.category).filter(Boolean))]
  const search = query.trim().toLowerCase()
  const rows = courses
    .filter((course) => category === 'all' || course.category === category)
    .filter((course) => level === 'all' || (course.difficulty || 'beginner') === level)
    .filter((course) => price === 'all' || (price === 'free' ? course.isFree : !course.isFree))
    .filter((course) => courseLanguage === 'all' || course.language === courseLanguage)
    .filter((course) => !search || course.title.toLowerCase().includes(search) || course.shortDescription?.toLowerCase().includes(search) || course.category?.toLowerCase().includes(search))
    .sort((a, b) => {
      if (sort === 'newest') return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
      if (sort === 'rating') return getCourseRating(state, b.id).average - getCourseRating(state, a.id).average
      if (sort === 'priceLow') return Number(a.priceDA || 0) - Number(b.priceDA || 0)
      if (sort === 'priceHigh') return Number(b.priceDA || 0) - Number(a.priceDA || 0)
      return getCourseLearnerCount(state, b.id) - getCourseLearnerCount(state, a.id)
    })
  const hasFilters = query || category !== 'all' || level !== 'all' || price !== 'all' || courseLanguage !== 'all'
  const activeChips = []
  if (query.trim()) activeChips.push({ key: 'query', label: query.trim(), clear: () => setQuery('') })
  if (category !== 'all') activeChips.push({ key: 'category', label: `${t('common.filter')}: ${category}`, clear: () => setCategory('all') })
  if (level !== 'all') activeChips.push({ key: 'level', label: `${t('common.level')}: ${levelLabel(t, level)}`, clear: () => setLevel('all') })
  if (price !== 'all') activeChips.push({ key: 'price', label: price === 'free' ? t('publicSite.freeCourses') : t('publicSite.paidCourses'), clear: () => setPrice('all') })
  if (courseLanguage !== 'all') activeChips.push({ key: 'language', label: `${t('common.language')}: ${courseLanguage === 'fr' ? t('common.french') : t('common.arabic')}`, clear: () => setCourseLanguage('all') })

  function clearFilters() {
    setQuery('')
    setCategory('all')
    setLevel('all')
    setPrice('all')
    setCourseLanguage('all')
    setSort('popular')
  }

  return (
    <section id="courses" className="scroll-mt-24 py-14 sm:py-16">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand">{t('publicSite.catalogEyebrow')}</p>
          <h2 className="mt-2 brand-font text-2xl font-bold text-ink sm:text-3xl">{t('publicSite.coursesTitle')}</h2>
          <p className="mt-1 text-sm text-muted">{t('publicSite.coursesSubtitle')}</p>
        </div>
        <Badge tone="neutral" dot>{t('publicSite.resultsCount', { count: rows.length })}</Badge>
      </div>
      <div className="mt-6 rounded-2xl border border-line bg-white p-3 shadow-sm sm:p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full xl:w-72">
            <Search size={14} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('publicSite.searchPlaceholder')} className="w-full ps-8" />
          </div>
          <div className="-mx-1 flex min-w-0 items-center gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden xl:flex-wrap xl:overflow-visible xl:pb-0">
            <span className="hidden shrink-0 items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-muted xl:inline-flex"><Filter size={12} />{t('common.filters')}</span>
            <Select value={category} onChange={(event) => setCategory(event.target.value)} className="w-auto min-w-36 shrink-0"><option value="all">{t('publicSite.allCategories')}</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</Select>
            <Select value={level} onChange={(event) => setLevel(event.target.value)} className="w-auto min-w-36 shrink-0"><option value="all">{t('publicSite.allLevels')}</option><option value="beginner">{t('publicSite.levelBeginner')}</option><option value="intermediate">{t('publicSite.levelIntermediate')}</option><option value="advanced">{t('publicSite.levelAdvanced')}</option></Select>
            <Select value={price} onChange={(event) => setPrice(event.target.value)} className="w-auto min-w-32 shrink-0"><option value="all">{t('publicSite.allPrices')}</option><option value="free">{t('publicSite.freeCourses')}</option><option value="paid">{t('publicSite.paidCourses')}</option></Select>
            <Select value={courseLanguage} onChange={(event) => setCourseLanguage(event.target.value)} className="w-auto min-w-36 shrink-0"><option value="all">{t('publicSite.allLanguages')}</option><option value="fr">Français</option><option value="ar">العربية</option></Select>
            <Select value={sort} onChange={(event) => setSort(event.target.value)} className="w-auto min-w-40 shrink-0"><option value="popular">{t('publicSite.sortPopular')}</option><option value="newest">{t('publicSite.sortNewest')}</option><option value="rating">{t('publicSite.sortRating')}</option><option value="priceLow">{t('publicSite.sortPriceLow')}</option><option value="priceHigh">{t('publicSite.sortPriceHigh')}</option></Select>
          </div>
        </div>
        {activeChips.length ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
            <span className="text-[10px] font-bold uppercase tracking-wide text-muted">{t('publicSite.activeFilters')}</span>
            {activeChips.map((chip) => (
              <button key={chip.key} type="button" onClick={chip.clear} className="inline-flex max-w-full items-center gap-1 rounded-full border border-brand/20 bg-brand-soft px-2.5 py-1 text-[11px] font-medium text-brand-dark transition hover:bg-brand-soft/70">
                <span className="max-w-40 truncate">{chip.label}</span>
                <X size={11} />
              </button>
            ))}
            <Button variant="ghost" size="xs" icon={RefreshCw} onClick={clearFilters}>{t('publicSite.clearFilters')}</Button>
          </div>
        ) : null}
      </div>
      {rows.length ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((course) => <CourseCard key={course.id} course={course} school={school} state={state} t={t} money={money} />)}
        </div>
      ) : (
        <div className="mt-6 rounded-3xl border border-dashed border-line bg-surface/40">
          <EmptyState icon={SlidersHorizontal} title={t('publicSite.noResults')} description={t('publicSite.noResultsDesc')} action={hasFilters ? <Button variant="secondary" icon={RefreshCw} onClick={clearFilters}>{t('publicSite.clearFilters')}</Button> : null} />
        </div>
      )}
    </section>
  )
}

export function PublicSchoolCourses() {
  const { state, school, trainer } = useSchoolPublic()
  const { t } = useI18n()

  if (!school) return <div className="grid min-h-screen place-items-center bg-surface p-6"><EmptyState icon={GraduationCap} title={t('publicSite.schoolUnavailable')} description={t('publicSite.schoolUnavailableDesc')} action={<Link to="/"><Button>{t('publicSite.backHome')}</Button></Link>} /></div>

  return (
    <div className="min-h-screen bg-white">
      <SchoolHeader school={school} />
      <main className="mx-auto max-w-6xl px-4">
        <div className="pt-8"><Link to={`/s/${school.slug}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition hover:text-brand"><ArrowLeft size={14} className="rtl:rotate-180" />{t('common.back')}</Link></div>
        <SchoolCatalog state={state} school={school} />
      </main>
      <SchoolFooter school={school} trainer={trainer} />
    </div>
  )
}

export function SchoolHome() {
  const { state, school, trainer } = useSchoolPublic()
  const { t, money } = useI18n()
  const { success } = useToast()
  const [contact, setContact] = useState({ name: '', email: '', subject: '', message: '' })

  if (!school) return <div className="grid min-h-screen place-items-center bg-surface p-6"><EmptyState icon={GraduationCap} title={t('publicSite.schoolUnavailable')} description={t('publicSite.schoolUnavailableDesc')} action={<Link to="/"><Button>{t('publicSite.backHome')}</Button></Link>} /></div>

  const accent = school.brandAccent || '#0D7A6A'
  const courses = getPublishedCourses(state, school.id)
  const categories = [...new Set(courses.map((course) => course.category).filter(Boolean))]
  const allLearners = new Set(state.enrollments.filter((enrollment) => enrollment.schoolId === school.id).map((enrollment) => enrollment.learnerId)).size
  const years = school.createdAt ? new Date().getFullYear() - new Date(school.createdAt).getFullYear() : 0
  const ratedCourses = courses.map((course) => getCourseRating(state, course.id)).filter((rating) => rating.count)
  const satisfaction = ratedCourses.length
    ? (ratedCourses.reduce((total, rating) => total + rating.average, 0) / ratedCourses.length).toFixed(1)
    : '—'
  const featured = [...courses].sort((a, b) => {
    const scoreA = getCourseLearnerCount(state, a.id) + getCourseRating(state, a.id).average * 10
    const scoreB = getCourseLearnerCount(state, b.id) + getCourseRating(state, b.id).average * 10
    return scoreB - scoreA
  })[0]
  const featuredRibbon = featured ? courseRibbon(featured, getCourseLearnerCount(state, featured.id)) : null

  function sendContact(event) {
    event.preventDefault()
    if (!contact.name.trim() || !contact.email.trim() || !contact.message.trim()) return
    success(t('publicSite.contactEmailSent'), t('publicSite.contactEmailSentDesc'))
    setContact({ name: '', email: '', subject: '', message: '' })
  }

  return (
    <div className="min-h-screen bg-white">
      <SchoolHeader school={school} />
      <section
        className="relative overflow-hidden px-4 py-16 text-white sm:py-24"
        style={{
          backgroundColor: '#0B2523',
          backgroundImage: `radial-gradient(circle at 85% 15%, ${school.brandAccent || '#0D7A6A'}66, transparent 38%), radial-gradient(circle at 10% 95%, #E8A33D26, transparent 34%), linear-gradient(135deg, #0B2523, #123B38)`,
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.5) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:py-20 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <div className="animate-slide-up">
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge className="border-white/20 bg-white/10 text-white" dot>{t('publicSite.heroBadge')}</Badge>
              {school.city ? <span className="inline-flex items-center gap-1 text-[11px] text-white/60"><MapPin size={12} />{school.city}</span> : null}
            </div>
            <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.24em] text-amber-300/90">{t('publicSite.heroEyebrow')}</p>
            <h1 className="mt-3 max-w-2xl brand-font text-4xl font-bold leading-[1.06] tracking-tight sm:text-5xl lg:text-[3.4rem]">{t('publicSite.heroTitle', { school: school.name })}</h1>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">{school.description}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#courses"><Button size="lg" variant="secondary" className="shadow-lg">{t('publicSite.heroCta')}<ArrowRight size={16} className="rtl:rotate-180" /></Button></a>
              <a href="#about"><Button size="lg" variant="ghost" className="border border-white/25 text-white hover:bg-white/10">{t('publicSite.heroSecondary')}<ArrowUpRight size={15} /></Button></a>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3 border-t border-white/10 pt-6 text-xs text-white/70">
              <span className="flex flex-col"><strong className="text-xl text-white">{courses.length}</strong>{t('publicSite.statsCourses')}</span>
              <span className="flex flex-col"><strong className="text-xl text-white">{allLearners}</strong>{t('publicSite.statsLearners')}</span>
              <span className="flex flex-col"><strong className="text-xl text-white">{satisfaction}</strong>{t('publicSite.satisfaction')}</span>
              <span className="flex flex-col"><strong className="text-xl text-white">{years || 1}</strong>{t('publicSite.schoolSince', { year: school.createdAt ? new Date(school.createdAt).getFullYear() : new Date().getFullYear() })}</span>
            </div>
          </div>

          <div className="relative animate-fade-in">
            <div className="relative overflow-hidden rounded-[28px] border border-white/15 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
              <img src={heroArtwork(school)} alt="" className="aspect-[4/3] w-full object-cover sm:aspect-[16/12]" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/50 to-transparent" />
              <div className="absolute inset-x-4 top-4 flex flex-wrap gap-2">
                <Badge className="border-white/20 bg-black/25 text-white"><Sparkles size={11} />{t('publicSite.heroBadge')}</Badge>
                {categories.length ? <Badge className="border-white/20 bg-black/25 text-white">{t('publicSite.resultsCount', { count: categories.length })}</Badge> : null}
              </div>
              {featured ? (
                <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/20 bg-ink/70 p-4 backdrop-blur-md">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-amber-300/90">{t('publicSite.featuredTitle')}</p>
                  <p className="mt-1 truncate text-sm font-bold text-white">{featured.title}</p>
                  <div className="mt-2 flex items-center gap-3 text-[10px] text-white/70">
                    <span className="inline-flex items-center gap-1"><BookOpen size={11} />{t('publicSite.lessonsCount', { count: getCourseLessons(state, featured.id).length })}</span>
                    <span className="inline-flex items-center gap-1"><Users size={11} />{t('publicSite.studentsCount', { count: getCourseLearnerCount(state, featured.id) })}</span>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="absolute -bottom-4 -start-4 hidden rounded-2xl border border-white/15 bg-white/10 p-3 shadow-lg backdrop-blur sm:block">
              <div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: accent }}><Award size={16} className="text-white" /></span><span><span className="block text-base font-bold leading-none text-white">{satisfaction}</span><span className="block text-[9px] text-white/60">{t('publicSite.satisfaction')}</span></span></div>
            </div>
          </div>
        </div>

        <div className="relative border-t border-white/10 bg-black/10">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 py-5 sm:grid-cols-4">
            {[
              [BookOpen, t('publicSite.statsCourses'), courses.length],
              [Users, t('publicSite.statsLearners'), allLearners],
              [Star, t('publicSite.satisfaction'), satisfaction],
              [ShieldCheck, t('publicSite.securePayment'), ''],
            ].map(([Icon, label, value], index) => (
              <div key={index} className="flex items-center gap-2.5 text-white/70">
                <Icon size={16} className="shrink-0 text-white/50" />
                <span className="min-w-0 truncate text-[10px] sm:text-[11px]">{value ? <strong className="me-1 text-white">{value}</strong> : null}{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {featured ? (
        <section className="border-b border-line bg-surface/60">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-brand"><Sparkles size={13} />{t('publicSite.heroBadge')}</p>
                <h2 className="mt-2 brand-font text-2xl font-bold text-ink sm:text-3xl">{t('publicSite.featuredTitle')}</h2>
                <p className="mt-1 text-sm text-muted">{t('publicSite.featuredSubtitle')}</p>
              </div>
              <a href="#courses" className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-brand transition hover:bg-brand-soft">
                {t('publicSite.viewAllCourses')}
                <ArrowRight size={13} className="rtl:rotate-180" />
              </a>
            </div>
            <div className="mt-6 overflow-hidden rounded-3xl border border-line bg-white shadow-[0_20px_50px_rgba(11,37,35,0.08)]">
              <div className="grid md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
                <div className="relative min-h-64 overflow-hidden">
                  <img src={coverImageFor(featured, school)} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-700 hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
                  <div className="absolute bottom-4 start-4 flex flex-wrap gap-2">
                    <Badge className="border-white/20 bg-black/30 text-white">{featured.category || t('publicSite.coursesAll')}</Badge>
                    {featuredRibbon ? <Badge tone="warning" className="bg-white/90">{t(featuredRibbon.key)}</Badge> : null}
                    {featured.isFree ? <Badge className="border-white/20 bg-white/90 text-ink">{t('publicSite.free')}</Badge> : null}
                  </div>
                </div>
                <div className="p-5 sm:p-8">
                  <div className="flex flex-wrap items-center gap-2"><Badge tone="brand" dot>{t('publicSite.featuredTitle')}</Badge><Badge tone="neutral">{levelLabel(t, featured.difficulty)}</Badge></div>
                  <h3 className="mt-4 brand-font text-2xl font-bold leading-tight text-ink">{featured.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{featured.shortDescription}</p>
                  {courseInstructor(state, school, featured) ? (
                    <div className="mt-4 flex items-center gap-2 text-[11px] text-muted"><Avatar name={courseInstructor(state, school, featured).name} size="sm" /><span className="font-semibold text-ink">{courseInstructor(state, school, featured).name}</span><span>· {t('publicSite.instructorRole')}</span></div>
                  ) : null}
                  <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-line py-4 text-[11px] text-muted">
                    <span className="flex items-center gap-1"><Users size={12} />{t('publicSite.studentsCount', { count: getCourseLearnerCount(state, featured.id) })}</span>
                    <span className="flex items-center gap-1"><BookOpen size={12} />{t('publicSite.lessonsCount', { count: getCourseLessons(state, featured.id).length })}</span>
                    <span className="flex items-center gap-1"><Clock size={12} />{formatDuration(getCourseDurationMinutes(state, featured.id))}</span>
                    {getCourseRating(state, featured.id).count ? <span className="flex items-center gap-1"><Star size={12} className="text-amber-500" />{getCourseRating(state, featured.id).average}</span> : null}
                  </div>
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                    <Link to={`/s/${school.slug}/courses/${featured.id}`}><Button icon={PlayCircle}>{t('publicSite.viewCourse')}</Button></Link>
                    <div className="text-end"><p className="text-[9px] uppercase tracking-wide text-muted">{featured.isFree ? t('publicSite.freeCourses') : t('publicSite.oneTimePayment')}</p><p className="text-xl font-bold text-ink">{featured.isFree ? t('publicSite.free') : money(featured.priceDA)}</p></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <main className="mx-auto max-w-6xl px-4">
        <SchoolCatalog state={state} school={school} />

        <section id="about" className="scroll-mt-24 grid gap-6 border-y border-line bg-surface/30 py-14 sm:py-16 md:grid-cols-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand">{t('publicSite.navAbout')}</p>
            <h2 className="mt-2 brand-font text-2xl font-bold text-ink sm:text-3xl">{t('publicSite.aboutTitle')}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">{school.description}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                [Target, t('publicSite.why1Title'), t('publicSite.why1Desc')],
                [Clock, t('publicSite.why2Title'), t('publicSite.why2Desc')],
                [Award, t('publicSite.why3Title'), t('publicSite.why3Desc')],
              ].map(([Icon, title, desc]) => (
                <div key={title} className="rounded-2xl border border-line bg-white p-4 transition hover:border-brand/30 hover:shadow-sm">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-brand"><Icon size={16} /></span>
                  <p className="mt-3 text-xs font-bold text-ink">{title}</p>
                  <p className="mt-1 text-[10px] leading-relaxed text-muted">{desc}</p>
                </div>
              ))}
            </div>
          </div>
          {trainer ? (
            <Card className="overflow-hidden">
              <div className="h-20 w-full" style={{ background: `linear-gradient(120deg, ${accent}, #0B2523)` }} />
              <div className="p-5">
                <div className="-mt-12 flex items-end justify-between gap-3">
                  <Avatar name={trainer.name} size="xl" className="ring-4 ring-white" />
                  <Badge tone="brand">{t('publicSite.instructorRole')}</Badge>
                </div>
                <p className="mt-3 brand-font text-lg font-bold text-ink">{trainer.name}</p>
                <p className="text-[11px] text-muted">{t('publicSite.teacherTitle')}</p>
                <p className="mt-3 text-xs leading-relaxed text-muted">{state.trainerProfiles.find((profile) => profile.userId === trainer.id)?.bio || t('publicSite.teacherBio')}</p>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-3 text-[10px] text-muted">
                  <Badge tone="neutral"><BookOpen size={11} />{t('publicSite.teacherCourses', { count: courses.length })}</Badge>
                  <Badge tone="neutral"><Users size={11} />{t('publicSite.teacherLearners', { count: allLearners })}</Badge>
                </div>
              </div>
            </Card>
          ) : null}
        </section>

        <section id="contact" className="scroll-mt-24 grid gap-6 py-14 sm:py-16 md:grid-cols-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand">{t('publicSite.navContact')}</p>
            <h2 className="mt-2 brand-font text-2xl font-bold text-ink sm:text-3xl">{t('publicSite.contactTitle')}</h2>
            <p className="mt-1 text-sm text-muted">{t('publicSite.contactSubtitle')}</p>
            <div className="mt-5 space-y-3 text-xs text-muted">
              {school.contactEmail ? <a href={`mailto:${school.contactEmail}`} className="flex w-fit items-center gap-2.5 rounded-xl border border-line bg-white px-3 py-2.5 transition hover:border-brand/40"><Mail size={14} className="text-brand" /><span className="break-all">{school.contactEmail}</span></a> : null}
              {school.contactPhone ? <a href={`tel:${school.contactPhone.replace(/\s/g, '')}`} className="flex w-fit items-center gap-2.5 rounded-xl border border-line bg-white px-3 py-2.5 transition hover:border-brand/40" dir="ltr"><Phone size={14} className="text-brand" />{school.contactPhone}</a> : null}
              {school.city ? <div className="flex w-fit items-center gap-2.5 rounded-xl border border-line bg-white px-3 py-2.5"><MapPin size={14} className="text-brand" />{school.city}</div> : null}
            </div>
          </div>
          <Card className="shadow-sm"><form onSubmit={sendContact} className="space-y-3.5 p-5 sm:p-6">
            <div className="grid gap-3.5 sm:grid-cols-2">
              <div><Label>{t('publicSite.contactName')}</Label><Input value={contact.name} onChange={(event) => setContact({ ...contact, name: event.target.value })} /></div>
              <div><Label>{t('publicSite.contactEmail')}</Label><Input type="email" value={contact.email} onChange={(event) => setContact({ ...contact, email: event.target.value })} /></div>
            </div>
            <div><Label>{t('publicSite.contactSubject')}</Label><Input value={contact.subject} onChange={(event) => setContact({ ...contact, subject: event.target.value })} /></div>
            <div><Label>{t('publicSite.contactMessage')}</Label><Textarea rows={3} value={contact.message} onChange={(event) => setContact({ ...contact, message: event.target.value })} /></div>
            <Button fullWidth icon={MessageSquare} type="submit">{t('publicSite.contactSend')}</Button>
          </form></Card>
        </section>
      </main>
      <SchoolFooter school={school} trainer={trainer} />
    </div>
  )
}

export function PublicCourseDetail() {
  const { courseId } = useParams()
  const { state, school, trainer } = useSchoolPublic()
  const { user, isAuthenticated } = useAuth()
  const { t, language, money, date } = useI18n()
  const { success, error: toastError } = useToast()
  const navigate = useNavigate()
  const [openSections, setOpenSections] = useState({})
  const [previewLesson, setPreviewLesson] = useState(null)
  const course = getCourse(state, courseId)
  const enrollment = user && course ? getEnrollment(state, course.id, user.id) : null

  if (!school) return <div className="grid min-h-screen place-items-center"><EmptyState icon={GraduationCap} title={t('publicSite.schoolUnavailable')} /></div>
  if (!course || course.schoolId !== school.id || course.status !== 'published') return <div className="min-h-screen bg-white"><SchoolHeader school={school} /><div className="mx-auto max-w-3xl px-4 py-20"><EmptyState icon={BookOpen} title={t('publicSite.notFoundTitle')} description={t('publicSite.notFoundDesc')} action={<Link to={`/s/${school.slug}`}><Button>{t('publicSite.browseCourses')}</Button></Link>} /></div></div>

  const accent = school.brandAccent || '#0D7A6A'
  const sections = getSections(state, course.id)
  const lessons = getCourseLessons(state, course.id)
  const duration = getCourseDurationMinutes(state, course.id)
  const students = getCourseLearnerCount(state, course.id)
  const stats = getCourseStats(state, course.id)
  const rating = getCourseRating(state, course.id)
  const reviews = getCourseReviews(state, course.id)
  const previewLessons = getCoursePreviewLessons(state, course.id)
  const relatedCourses = getRelatedCourses(state, course.id, 3)
  const objectives = (language === 'ar' ? course.objectivesAr : course.objectivesFr) || (language === 'ar' ? course.objectivesFr : course.objectivesAr) || []
  const prerequisites = (language === 'ar' ? course.prerequisitesAr : course.prerequisitesFr) || (language === 'ar' ? course.prerequisitesFr : course.prerequisitesAr) || []
  const publishedCourses = getPublishedCourses(state, school.id)
  const profile = trainer ? getTrainerProfile(state, trainer.id) : null
  const instructorLearners = new Set(state.enrollments.filter((item) => item.schoolId === school.id).map((item) => item.learnerId)).size
  const previewQuiz = previewLesson ? getQuizByLesson(state, previewLesson.id) : null
  const distribution = [5, 4, 3, 2, 1].map((stars) => ({ stars, count: reviews.filter((review) => review.rating === stars).length }))

  function enroll() {
    const target = `/s/${school.slug}/courses/${course.id}/checkout`
    if (!isAuthenticated) return navigate(`/s/${school.slug}/login?redirect=${encodeURIComponent(target)}`)
    if (user?.role !== 'learner') return toastError(t('auth.studentOnlyHere'))
    if (user.schoolId !== school.id) return toastError(t('checkout.errors.schoolMismatch'))
    navigate(target)
  }

  async function shareCourse() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      success(t('publicSite.linkCopied'))
    } catch {
      success(t('publicSite.copyLinkManual'))
    }
  }

  function toggleSection(sectionId, isOpen) {
    setOpenSections({ ...openSections, [sectionId]: !isOpen })
  }

  return (
    <div className="min-h-screen bg-white">
      <SchoolHeader school={school} />
      <div className="relative overflow-hidden border-b border-line bg-ink text-white">
        <img src={course.coverImage || coverImageFor(course, school)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
        <div className="absolute inset-0" style={{ background: `linear-gradient(105deg, rgba(11,37,35,0.97) 0%, rgba(11,37,35,0.88) 52%, ${accent}88 100%)` }} />
        <div className="relative mx-auto max-w-6xl px-4 py-8 sm:py-12">
          <Link to={`/s/${school.slug}`} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-white/65 transition hover:text-white">
            <ArrowLeft size={13} className="rtl:rotate-180" />
            {t('publicSite.breadcrumbHome')} / {t('publicSite.breadcrumbCourses')}
          </Link>
          <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_230px] lg:items-end">
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge className="border-white/20 bg-white/10 text-white">{course.category}</Badge>
                <Badge className="border-white/20 bg-white/10 text-white">{levelLabel(t, course.difficulty)}</Badge>
                <Badge className="border-white/20 bg-white/10 text-white">{course.language === 'ar' ? 'العربية' : 'Français'}</Badge>
                {course.isFree ? <Badge className="border-white/20 bg-white/90 text-ink">{t('publicSite.free')}</Badge> : null}
                {courseRibbon(course, students) ? <Badge tone="warning" className="bg-white/90">{t(courseRibbon(course, students).key)}</Badge> : null}
              </div>
              <h1 className="mt-4 max-w-3xl brand-font text-3xl font-bold leading-tight sm:text-4xl">{course.title}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/70">{course.shortDescription}</p>
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-white/70">
                <span className="flex items-center gap-1.5">{rating.count ? <><RatingStars value={rating.average} size={13} /><strong className="text-white">{rating.average}</strong><span>({t('publicSite.reviewsCount', { count: rating.count })})</span></> : <span>{t('publicSite.noRatings')}</span>}</span>
                <span className="flex items-center gap-1"><Users size={12} />{students} {t('publicSite.students')}</span>
                <span className="flex items-center gap-1"><BookOpen size={12} />{t('publicSite.lessonsCount', { count: lessons.length })}</span>
                <span className="flex items-center gap-1"><Clock size={12} />{formatDuration(duration)}</span>
                <span className="flex items-center gap-1"><Award size={12} />{levelLabel(t, course.difficulty)}</span>
                <span className="flex items-center gap-1"><CalendarDays size={12} />{t('publicSite.updatedOn', { date: date(course.updatedAt) })}</span>
              </div>
            </div>
            <div className="hidden overflow-hidden rounded-2xl border border-white/20 bg-white/10 backdrop-blur lg:block">
              <img src={coverImageFor(course, school)} alt="" className="h-32 w-full object-cover" />
              <div className="flex items-center justify-between gap-2 p-3">
                <span className="truncate text-[10px] text-white/70">{course.coverLabel}</span>
                <span className="shrink-0 text-sm font-bold text-white">{course.isFree ? t('publicSite.free') : money(course.priceDA)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <nav className="sticky top-[72px] z-30 border-b border-line bg-white/95 backdrop-blur-xl" aria-label={t('courseDetail.jumpTo')}>
        <div className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <span className="me-2 hidden shrink-0 text-[10px] font-bold uppercase tracking-wide text-muted sm:block">{t('courseDetail.jumpTo')}</span>
          {[
            ['overview', 'courseDetail.overview', BookOpen],
            ['curriculum', 'courseDetail.curriculum', Layers],
            ['instructor', 'courseDetail.instructor', Users],
            ['reviews', 'courseDetail.reviews', Star],
          ].filter(([id]) => id !== 'instructor' || trainer).map(([id, key, Icon]) => (
            <a key={id} href={`#${id}`} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-3 text-[11px] font-semibold text-muted transition hover:bg-brand-soft hover:text-brand-dark">
              <Icon size={13} />{t(key)}
            </a>
          ))}
        </div>
      </nav>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 pb-24 lg:grid-cols-[1fr_340px] lg:pb-8">
        <div className="space-y-6">
          <Card id="overview" className="scroll-mt-36 overflow-hidden">
            <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${accent}, transparent 70%)` }} />
            <div className="p-5 sm:p-6">
              <div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-soft text-brand"><Target size={15} /></span><h2 className="brand-font text-lg font-bold text-ink">{t('publicSite.objectives')}</h2></div>
              {objectives.length ? <ul className="mt-4 grid gap-2 sm:grid-cols-2">{objectives.map((item) => <li key={item} className="flex items-start gap-2 rounded-xl border border-line bg-surface/70 px-3 py-2.5 text-xs leading-relaxed text-muted"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-success" />{item}</li>)}</ul> : <p className="mt-3 text-xs text-muted">{t('publicSite.noObjectives')}</p>}
              <div className="my-6 h-px bg-line" />
              <h2 className="brand-font text-lg font-bold text-ink">{t('publicSite.description')}</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted">{course.description}</p>
              <h2 className="mt-6 flex items-center gap-2 brand-font text-lg font-bold text-ink"><Target size={16} className="text-brand" />{t('publicSite.prerequisites')}</h2>
              {prerequisites.length ? <ul className="mt-3 space-y-2">{prerequisites.map((item) => <li key={item} className="flex items-start gap-2 rounded-lg bg-surface px-3 py-2 text-xs text-muted"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand" />{item}</li>)}</ul> : <p className="mt-2 text-xs text-muted">{t('publicSite.noPrerequisites')}</p>}
            </div>
          </Card>

          <Card id="curriculum" className="scroll-mt-36 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface/50 p-5">
              <div className="flex items-center gap-2.5"><span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-soft text-brand"><Layers size={15} /></span><div><h2 className="brand-font text-lg font-bold text-ink">{t('publicSite.courseContent')}</h2><p className="text-[11px] text-muted">{t('publicSite.sectionsCount', { count: stats.sections })} · {t('publicSite.lessonsCount', { count: stats.lessons })} · {formatDuration(duration)}</p></div></div>
              {previewLessons.length ? <Badge tone="success" dot>{t('publicSite.freePreviewCount', { count: previewLessons.length })}</Badge> : <Badge tone="neutral">{t('publicSite.fullAccess')}</Badge>}
            </div>
            <div className="space-y-2 p-5">
              {sections.map((section, index) => {
                const sectionLessons = lessons.filter((lesson) => lesson.sectionId === section.id)
                const isOpen = openSections[section.id] ?? true
                const description = (language === 'ar' ? section.descriptionAr : section.descriptionFr) || (language === 'ar' ? section.descriptionFr : section.descriptionAr)
                const sectionDuration = sectionLessons.reduce((total, lesson) => total + (Number(lesson.durationMin) || 0), 0)
                return <div key={section.id} className="overflow-hidden rounded-xl border border-line">
                  <button type="button" onClick={() => toggleSection(section.id, isOpen)} className="flex w-full items-center gap-3 bg-surface px-3 py-3 text-start">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white text-[10px] font-bold text-brand">{String(index + 1).padStart(2, '0')}</span>
                    <span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-ink">{section.title}</span>{description ? <span className="mt-0.5 block truncate text-[10px] text-muted">{description}</span> : null}</span>
                    <span className="hidden text-[10px] text-muted sm:block">{sectionLessons.length} · {formatDuration(sectionDuration)}</span>
                    <ChevronDown size={15} className={cn('shrink-0 text-muted transition', isOpen && 'rotate-180')} />
                  </button>
                  {isOpen ? <div className="divide-y divide-line border-t border-line">{sectionLessons.map((lesson) => {
                    const displayType = getLessonDisplayType(state, lesson)
                    const LessonIcon = lesson.type === 'quiz' ? Layers : displayType === 'video' ? Video : FileText
                    const lessonDescription = (language === 'ar' ? lesson.descriptionAr : lesson.descriptionFr) || (language === 'ar' ? lesson.descriptionFr : lesson.descriptionAr)
                    return <div key={lesson.id} className="flex items-center gap-2.5 px-3 py-2.5 text-[11px] text-muted">
                      <LessonIcon size={14} className="shrink-0 text-brand" />
                      <span className="min-w-0 flex-1"><span className="block truncate font-medium text-ink">{lesson.title}</span>{lessonDescription ? <span className="mt-0.5 block truncate text-[10px]">{lessonDescription}</span> : null}</span>
                      {lesson.preview ? <Button size="xs" variant="ghost" icon={PlayCircle} onClick={() => setPreviewLesson(lesson)}>{t('publicSite.preview')}</Button> : <Lock size={12} className="shrink-0 text-muted/60" />}
                      <span className="w-12 shrink-0 text-end">{lesson.type === 'quiz' ? t('learner.quizTitle') : `${lesson.durationMin || 0} min`}</span>
                    </div>
                  })}</div> : null}
                </div>
              })}
            </div>
          </Card>

          {trainer ? <Card id="instructor" className="scroll-mt-36 overflow-hidden"><div className="p-5 sm:p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand">{t('publicSite.instructorTitle')}</p>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <Avatar name={trainer.name} size="xl" />
              <div className="min-w-0 flex-1">
                <p className="brand-font text-lg font-bold text-ink">{trainer.name}</p>
                <p className="text-[11px] text-muted">{t('publicSite.instructorRole')}</p>
                <div className="mt-2 flex flex-wrap gap-2"><Badge tone="neutral"><BookOpen size={11} />{t('publicSite.instructorCourses', { count: publishedCourses.length })}</Badge><Badge tone="neutral"><Users size={11} />{t('publicSite.teacherLearners', { count: instructorLearners })}</Badge></div>
              </div>
            </div>
            <p className="mt-4 border-t border-line pt-4 text-xs leading-relaxed text-muted">{profile?.bio || t('publicSite.instructorBio')}</p>
            {profile?.headline ? <p className="mt-2 rounded-lg bg-brand-soft px-3 py-2 text-[11px] font-semibold text-brand-dark">{profile.headline}</p> : null}
          </div></Card> : null}

          <Card id="reviews" className="scroll-mt-36 overflow-hidden"><div className="p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2.5"><span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-soft text-brand"><Star size={15} /></span><h2 className="brand-font text-lg font-bold text-ink">{t('publicSite.reviewsTitle')}</h2></div><Badge tone="neutral">{t('publicSite.reviewsCount', { count: reviews.length })}</Badge></div>
            {reviews.length ? <div className="mt-4 grid gap-5 sm:grid-cols-[180px_1fr]">
              <div className="rounded-xl bg-surface p-4 text-center"><p className="text-4xl font-bold text-ink">{rating.average}</p><div className="mt-1 flex justify-center"><RatingStars value={rating.average} /></div><p className="mt-1 text-[10px] text-muted">{t('publicSite.reviewsCount', { count: rating.count })}</p></div>
              <div className="space-y-1.5">{distribution.map((row) => <div key={row.stars} className="flex items-center gap-2 text-[10px] text-muted"><span className="w-3 text-end">{row.stars}</span><Star size={10} className="text-amber-500" /><ProgressBar value={reviews.length ? (row.count / reviews.length) * 100 : 0} className="h-1.5 flex-1" /><span className="w-5 text-end">{row.count}</span></div>)}</div>
              <div className="space-y-3 sm:col-span-2">{reviews.map((review) => {
                const author = state.users.find((item) => item.id === review.learnerId)
                const title = (language === 'ar' ? review.titleAr : review.titleFr) || (language === 'ar' ? review.titleFr : review.titleAr)
                const comment = (language === 'ar' ? review.commentAr : review.commentFr) || (language === 'ar' ? review.commentFr : review.commentAr)
                const reply = (language === 'ar' ? review.trainerReplyAr : review.trainerReplyFr) || ''
                return <div key={review.id} className="rounded-xl border border-line p-3">
                  <div className="flex items-center gap-2"><Avatar name={author?.name || t('common.learner')} size="sm" /><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-ink">{author?.name || t('common.learner')}</p><p className="text-[10px] text-muted">{date(review.createdAt)}</p></div><RatingStars value={review.rating} size={11} /></div>
                  {title ? <p className="mt-2 text-xs font-semibold text-ink">{title}</p> : null}
                  <p className="mt-1 text-xs leading-relaxed text-muted">{comment}</p>
                  {reply ? <div className="mt-2 rounded-lg bg-surface p-2.5"><p className="text-[10px] font-semibold text-brand">{t('publicSite.trainerReply')}</p><p className="mt-0.5 text-[11px] leading-relaxed text-muted">{reply}</p></div> : null}
                </div>
              })}</div>
            </div> : <EmptyState icon={Star} title={t('publicSite.noReviewsTitle')} description={t('publicSite.noReviewsDesc')} className="mt-4" />}
          </div></Card>
        </div>

        <aside className="space-y-4 self-start lg:sticky lg:top-36">
          <Card className="overflow-hidden shadow-[0_20px_50px_rgba(11,37,35,0.08)]"><div>
            <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}55)` }} />
            <div className="p-5">
              <div className="flex items-end justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">{t('publicSite.oneTimePayment')}</p>
                  <p className="mt-1 text-3xl font-bold leading-none text-ink">{course.isFree ? t('publicSite.free') : money(course.priceDA)}</p>
                </div>
                <Badge tone="success"><ShieldCheck size={11} />{t('publicSite.securePayment')}</Badge>
              </div>
              {enrollment?.status === 'active' ? <Button fullWidth className="mt-5" size="lg" icon={PlayCircle} onClick={() => navigate(`/s/${school.slug}/learn/courses/${course.id}`)}>{t('publicSite.continueLearning')}</Button> : <Button fullWidth className="mt-5" size="lg" onClick={enroll}>{isAuthenticated ? (course.isFree ? t('publicSite.enrollFree') : t('publicSite.enrollNow')) : t('publicSite.loginToEnroll')}</Button>}
              {!isAuthenticated ? <p className="mt-2 text-center text-[10px] text-muted">{t('publicSite.loginPrompt')}</p> : null}
              <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-surface p-3 text-[10px] text-muted">
                <span className="flex items-center gap-1.5"><Layers size={12} className="text-brand" />{t('publicSite.sectionsCount', { count: stats.sections })}</span>
                <span className="flex items-center gap-1.5"><PlayCircle size={12} className="text-brand" />{t('publicSite.lessonsCount', { count: stats.lessons })}</span>
                <span className="flex items-center gap-1.5"><Clock size={12} className="text-brand" />{formatDuration(duration)}</span>
                <span className="flex items-center gap-1.5"><Globe2 size={12} className="text-brand" />{course.language === 'ar' ? 'العربية' : 'Français'}</span>
              </div>
              <div className="mt-5 space-y-2.5 border-t border-line pt-4 text-[11px] text-muted">
                {[[ShieldCheck, t('publicSite.securePayment')], [PlayCircle, t('publicSite.includeAccess')], [FileText, t('publicSite.includeFiles')], [MessageSquare, t('publicSite.includeDiscussion')], [CheckCircle2, t('publicSite.includeCertificate')]].map(([Icon, label], index) => <p key={index} className="flex items-center gap-2"><Icon size={13} className="shrink-0 text-brand" />{label}</p>)}
              </div>
              <Button fullWidth variant="secondary" className="mt-4" icon={ArrowUpRight} onClick={shareCourse}>{t('publicSite.shareCourse')}</Button>
            </div>
          </div></Card>
          <Card><div className="p-4 text-center">
            <span className="mx-auto grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-brand"><MessageSquare size={16} /></span>
            <p className="mt-2 text-xs font-bold text-ink">{t('publicSite.needHelp')}</p>
            <p className="mt-1 text-[10px] leading-relaxed text-muted">{t('publicSite.needHelpDesc')}</p>
            {school.contactEmail ? <a href={`mailto:${school.contactEmail}`} className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-brand"><Mail size={12} />{school.contactEmail}</a> : null}
          </div></Card>
        </aside>
      </main>

      {relatedCourses.length ? <section className="border-t border-line bg-surface"><div className="mx-auto max-w-6xl px-4 py-10"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="brand-font text-xl font-bold text-ink">{t('publicSite.relatedCourses')}</h2><p className="mt-1 text-xs text-muted">{t('publicSite.relatedCoursesDesc')}</p></div><Link to={`/s/${school.slug}`} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-semibold text-brand transition hover:bg-brand-soft">{t('publicSite.browseCourses')}<ArrowRight size={13} className="rtl:rotate-180" /></Link></div><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{relatedCourses.map((item) => <CourseCard key={item.id} course={item} school={school} state={state} t={t} money={money} />)}</div></div></section> : null}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 shadow-[0_-8px_24px_rgba(11,37,35,0.08)] backdrop-blur lg:hidden">
        <div className="h-0.5 w-full" style={{ background: accent }} />
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[10px] text-muted">{enrollment?.status === 'active' ? t('publicSite.continueLearning') : t('checkout.price')}</p>
            <p className="text-lg font-bold leading-tight text-ink">{course.isFree ? t('publicSite.free') : money(course.priceDA)}</p>
          </div>
          {enrollment?.status === 'active' ? (
            <Button icon={PlayCircle} onClick={() => navigate(`/s/${school.slug}/learn/courses/${course.id}`)}>{t('publicSite.continueLearning')}</Button>
          ) : (
            <Button iconRight={ArrowRight} onClick={enroll}>{isAuthenticated ? (course.isFree ? t('publicSite.enrollFree') : t('publicSite.enrollNow')) : t('publicSite.loginToEnroll')}</Button>
          )}
        </div>
      </div>

      <SchoolFooter school={school} trainer={trainer} />

      <Modal open={Boolean(previewLesson)} onClose={() => setPreviewLesson(null)} title={previewLesson?.title} description={t('publicSite.previewNotice')} size="lg">
        {previewLesson ? <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2"><Badge tone="success">{t('publicSite.freePreview')}</Badge><span className="flex items-center gap-1 text-[10px] text-muted"><Clock size={11} />{previewLesson.durationMin || 0} min</span></div>
            {previewLesson.type === 'quiz' ? <div className="rounded-xl border border-line bg-surface p-4"><p className="flex items-center gap-2 text-sm font-semibold text-ink"><Layers size={16} className="text-brand" />{previewQuiz?.title || previewLesson.title}</p><p className="mt-1 text-xs text-muted">{(language === 'ar' ? previewQuiz?.descriptionAr : previewQuiz?.descriptionFr) || t('publicSite.quizPreviewDesc')}</p><div className="mt-3 flex flex-wrap gap-3 text-[10px] text-muted"><span>{t('publicSite.quizQuestions', { count: previewQuiz?.questions?.length || 0 })}</span>{previewQuiz?.timeLimitMin ? <span>{t('publicSite.quizTimeLimit', { count: previewQuiz.timeLimitMin })}</span> : null}</div></div> : getBlocks(state, previewLesson.id).map((block) => <LessonBlock key={block.id} block={block} />)}
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-[11px] text-amber-800"><Lock size={13} className="shrink-0" />{t('publicSite.previewLockedNote')}</div>
        </div> : null}
      </Modal>
    </div>
  )
}

function methodIcon(id) {
  if (id === 'edahabia' || id === 'cib' || id === 'chargily') return CreditCard
  if (id === 'bankTransfer') return Building2
  if (id === 'cash') return Banknote
  if (id === 'inPerson') return Store
  return Wallet
}

function localizedInstruction(language, fr, ar) {
  return (language === 'ar' ? ar || fr : fr || ar) || ''
}

function ManualDetails({ method, manual, school, language, t }) {
  const delay = manual?.delay || '24 h'
  if (method === 'cash') {
    return (
      <div className="rounded-xl border border-line bg-surface p-4 text-xs leading-relaxed text-muted">
        <p className="font-semibold text-ink">{t('payments.cash')}</p>
        <p className="mt-1">{localizedInstruction(language, manual?.cashInstructionsFr, manual?.cashInstructionsAr) || t('checkout.cashLocation')}</p>
        {school.city ? <p className="mt-1">{school.city}</p> : null}
        {school.contactPhone ? <p className="mt-1" dir="ltr">{school.contactPhone}</p> : null}
      </div>
    )
  }
  if (method === 'inPerson') {
    return (
      <div className="rounded-xl border border-line bg-surface p-4 text-xs leading-relaxed text-muted">
        <p className="font-semibold text-ink">{t('payments.inPerson')}</p>
        <p className="mt-1">{localizedInstruction(language, manual?.inPersonInstructionsFr, manual?.inPersonInstructionsAr) || t('checkout.inPersonLocation')}</p>
        {school.city ? <p className="mt-1">{school.city}</p> : null}
      </div>
    )
  }
  return (
    <div className="rounded-xl border border-line bg-surface p-4 text-xs">
      <p className="font-semibold text-ink">{t('checkout.bankDetails')}</p>
      <div className="mt-2 space-y-1.5">
        {manual?.beneficiary ? <p className="flex justify-between gap-3"><span className="text-muted">{t('checkout.accountName')}</span><span className="text-end font-medium text-ink">{manual.beneficiary}</span></p> : null}
        {method === 'ccp' || method === 'ccpRip' ? <p className="flex justify-between gap-3"><span className="text-muted">CCP / RIP</span><span className="text-end font-medium text-ink" dir="ltr">{manual?.ccp || manual?.rib}</span></p> : null}
        {method === 'baridimob' ? <p className="flex justify-between gap-3"><span className="text-muted">BaridiMob</span><span className="text-end font-medium text-ink" dir="ltr">{manual?.baridimob}</span></p> : null}
        {method === 'bankTransfer' ? (
          <>
            <p className="flex justify-between gap-3"><span className="text-muted">{t('checkout.bankName')}</span><span className="text-end font-medium text-ink">{manual?.bank?.name}</span></p>
            {manual?.bank?.agency ? <p className="flex justify-between gap-3"><span className="text-muted">{t('checkout.branch')}</span><span className="text-end font-medium text-ink">{manual.bank.agency}</span></p> : null}
            <p className="flex justify-between gap-3"><span className="text-muted">{t('checkout.rib')}</span><span className="text-end font-medium text-ink" dir="ltr">{manual?.bank?.rib}</span></p>
          </>
        ) : null}
      </div>
      {manual?.instructionsFr || manual?.instructionsAr ? <p className="mt-3 border-t border-line pt-2 text-[11px] leading-relaxed text-muted">{localizedInstruction(language, manual.instructionsFr, manual.instructionsAr)}</p> : null}
      <p className="mt-2 text-[10px] text-muted">{t('checkout.validationDelay', { delay })}</p>
    </div>
  )
}

function MethodCard({ option, selected, onSelect, t }) {
  const Icon = methodIcon(option.id)
  return (
    <button
      type="button"
      onClick={() => onSelect(option.id)}
      aria-pressed={selected}
      className={cn(
        'group relative flex items-center gap-3 overflow-hidden rounded-xl border p-3 text-start transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/10',
        selected
          ? 'border-brand bg-brand-soft/60 shadow-md ring-1 ring-brand/25'
          : 'border-line bg-white hover:border-brand/40 hover:bg-surface/60',
      )}
    >
      {selected ? <span className="absolute inset-y-0 start-0 w-1 bg-brand" /> : null}
      <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-lg transition', selected ? 'bg-brand text-white shadow-sm' : 'bg-surface text-brand group-hover:bg-brand-soft')}><Icon size={17} /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold text-ink">{t(paymentMethodLabelKey(option.id))}</span>
        <span className="mt-0.5 block truncate text-[10px] text-muted">{t(paymentMethodDescriptionKey(option.id))}</span>
      </span>
      {selected ? <CheckCircle2 size={16} className="shrink-0 text-brand" /> : null}
    </button>
  )
}

export function CourseCheckout() {
  const { slug, courseId } = useParams()
  const { state, school } = useSchoolPublic()
  const { user } = useAuth()
  const { t, money, language } = useI18n()
  const { success, error: toastError } = useToast()
  const navigate = useNavigate()
  const [selectedMethod, setSelectedMethod] = useState('')
  const [reference, setReference] = useState('')
  const [proofName, setProofName] = useState('')
  const [proofData, setProofData] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [result, setResult] = useState(null)

  const options = school ? getCoursePaymentOptions(state, school) : []
  const selectedOption = options.find((option) => option.id === selectedMethod) || options[0] || null
  const selectedId = selectedOption?.id || ''
  const onlineOptions = options.filter((option) => option.group === 'online')
  const manualOptions = options.filter((option) => option.group === 'manual')
  const needsReference = !['cash', 'inPerson'].includes(selectedId)

  if (!school) return <EmptyState icon={GraduationCap} title={t('publicSite.schoolUnavailable')} />
  const course = getCourse(state, courseId)
  if (!course || course.schoolId !== school.id || course.status !== 'published') return <div className="grid min-h-screen place-items-center"><EmptyState icon={BookOpen} title={t('publicSite.notFoundTitle')} action={<Link to={`/s/${school.slug}`}><Button>{t('publicSite.browseCourses')}</Button></Link>} /></div>
  const enrollment = user ? getEnrollment(state, course.id, user.id) : null
  const target = encodeURIComponent(`/s/${school.slug}/courses/${course.id}/checkout`)

  if (!user) {
    return <div className="min-h-screen bg-white"><SchoolHeader school={school} /><div className="mx-auto max-w-lg px-4 py-20"><EmptyState icon={CreditCard} title={t('checkout.needAccount')} description={t('publicSite.loginPrompt')} action={<><Link to={`/s/${school.slug}/login?redirect=${target}`}><Button>{t('checkout.login')}</Button></Link><Link to={`/s/${school.slug}/register?redirect=${target}`}><Button variant="secondary">{t('checkout.register')}</Button></Link></>} /></div></div>
  }

  if (user.role !== 'learner') {
    return <div className="min-h-screen bg-white"><SchoolHeader school={school} /><div className="mx-auto max-w-lg px-4 py-20"><EmptyState icon={CreditCard} title={t('auth.studentOnlyHere')} action={<Link to={`/s/${school.slug}`}><Button>{t('publicSite.browseCourses')}</Button></Link>} /></div></div>
  }

  if (user.schoolId !== school.id) {
    return <div className="min-h-screen bg-white"><SchoolHeader school={school} /><div className="mx-auto max-w-lg px-4 py-20"><EmptyState icon={CreditCard} title={t('checkout.errors.schoolMismatch')} action={<Link to={`/s/${school.slug}`}><Button>{t('publicSite.browseCourses')}</Button></Link>} /></div></div>
  }

  if (enrollment?.status === 'active') return <div className="min-h-screen bg-white"><SchoolHeader school={school} /><div className="mx-auto max-w-lg px-4 py-20"><EmptyState icon={CheckCircle2} title={t('checkout.alreadyEnrolled')} action={<Button onClick={() => navigate(`/s/${school.slug}/learn/courses/${course.id}`)}>{t('checkout.goToCourseNow')}</Button>} /></div></div>


  function pickProof(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setPaymentError(t('errors.fileTooLarge'))
      return toastError(t('errors.fileTooLarge'))
    }
    setPaymentError('')
    setProofName(file.name)
    const reader = new FileReader()
    reader.onload = () => setProofData(reader.result)
    reader.readAsDataURL(file)
  }

  function submit() {
    setProcessing(true)
    setPaymentError('')
    if (course.isFree) {
      const response = enrollFree(course.id, user.id)
      setProcessing(false)
      if (!response.ok) {
        const message = checkoutErrorMessage(t, response.error)
        setPaymentError(message)
        return toastError(message)
      }
      setResult({ type: 'free' })
      success(t('checkout.successTitle'))
      return
    }
    if (!selectedOption) {
      setProcessing(false)
      setPaymentError(t('checkout.noPaymentMethods'))
      return toastError(t('checkout.noPaymentMethods'))
    }
    if (selectedOption.group === 'online') {
      const response = submitCourseOnlinePayment({
        courseId: course.id,
        learnerId: user.id,
        provider: 'chargily',
        cardType: selectedId,
        outcome: 'success',
      })
      setProcessing(false)
      if (!response.ok) {
        const message = checkoutErrorMessage(t, response.error)
        setPaymentError(message)
        return toastError(message)
      }
      setResult({ type: 'online', reference: response.payment?.reference })
      success(t('checkout.paymentSuccess'))
      return
    }
    if (needsReference && !reference.trim()) {
      setProcessing(false)
      setPaymentError(t('checkout.referenceRequired'))
      return toastError(t('checkout.referenceRequired'))
    }
    const response = requestManualEnrollment({
      courseId: course.id,
      learnerId: user.id,
      reference: reference.trim(),
      proofName,
      proofDataUrl: proofData,
      method: selectedId,
    })
    setProcessing(false)
    if (!response.ok) {
      const message = checkoutErrorMessage(t, response.error)
      setPaymentError(message)
      return toastError(message)
    }
    setResult({ type: 'manual' })
    success(t('checkout.manualSubmitted'))
  }

  if (result) {
    const pending = result.type === 'manual'
    const successType = pending ? t('checkout.manualPendingTitle') : t('checkout.successTitle')
    const desc = pending ? t('checkout.manualPendingDesc') : t('checkout.successDesc')
    return <div className="min-h-screen bg-surface/40"><SchoolHeader school={school} /><div className="mx-auto max-w-2xl px-4 py-16"><Card className="overflow-hidden shadow-lg"><div className="h-1.5 w-full" style={{ background: pending ? '#E8A33D' : (school.brandAccent || '#0D7A6A') }} /><div className="p-8 text-center"><span className={cn('mx-auto grid h-16 w-16 place-items-center rounded-full', pending ? 'bg-warning-soft text-warning' : 'bg-success-soft text-success')}><CheckCircle2 size={30} /></span><h1 className="mt-4 brand-font text-xl font-bold text-ink">{successType}</h1><p className="mt-2 text-sm text-muted">{desc}</p>{result.reference ? <p className="mt-3 inline-flex rounded-lg bg-surface px-3 py-1.5 text-xs text-muted" dir="ltr">{t('payments.transactionId')}: <span className="ms-1 font-semibold text-ink">{result.reference}</span></p> : null}<div className="mt-5 flex flex-wrap justify-center gap-2">{!pending ? <Button onClick={() => navigate(`/s/${school.slug}/learn/courses/${course.id}`)}>{t('checkout.goToCourse')}</Button> : null}<Button variant="secondary" onClick={() => navigate(`/s/${school.slug}/payments`)}>{t('checkout.viewOrders')}</Button><Button variant="ghost" onClick={() => navigate(`/s/${school.slug}/learn`)}>{t('checkout.goToDashboard')}</Button></div></div></Card></div></div>
  }

  return (
    <div className="min-h-screen bg-white">
      <SchoolHeader school={school} />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Link to={`/s/${school.slug}/courses/${course.id}`} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted transition hover:text-brand"><ArrowLeft size={13} className="rtl:rotate-180" />{t('checkout.backToCourse')}</Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="brand-font text-2xl font-bold text-ink sm:text-3xl">{t('checkout.title')}</h1>
            <p className="mt-1 text-sm text-muted">{t('checkout.subtitle')}</p>
          </div>
          <Badge tone="brand"><ShieldCheck size={11} />{t('publicSite.securePayment')}</Badge>
        </div>
        <ol className="mt-6 flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-surface/50 p-3">
          {[
            [t('checkout.stepAccount'), 'done'],
            [t('checkout.stepPayment'), 'current'],
            [t('checkout.stepReview'), 'upcoming'],
            [t('checkout.stepConfirmation'), 'upcoming'],
          ].map(([label, stateName], index) => (
            <li key={label} className="flex items-center gap-2">
              <span className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold',
                stateName === 'done' && 'bg-success-soft text-success',
                stateName === 'current' && 'bg-brand text-white',
                stateName === 'upcoming' && 'bg-white text-muted',
              )}>
                {stateName === 'done' ? <CheckCircle2 size={12} /> : <span className="grid h-4 w-4 place-items-center rounded-full border border-current text-[9px]">{index + 1}</span>}
                {label}
              </span>
              {index < 3 ? <ChevronRight size={13} className="text-muted/60 rtl:rotate-180" /> : null}
            </li>
          ))}
        </ol>
        <div className="mt-5 grid gap-4 md:grid-cols-[1fr_320px]">
          <Card className="overflow-hidden">
            <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${school.brandAccent || '#0D7A6A'}, transparent 70%)` }} />
            <div className="p-5 sm:p-6">
              {paymentError ? <Alert className="mb-5" tone="danger" title={t('checkout.errorTitle')} action={<Button size="xs" variant="secondary" icon={RefreshCw} onClick={() => { setPaymentError(''); submit() }}>{t('checkout.retry')}</Button>}>{paymentError}</Alert> : null}
              {course.isFree ? (
                <div><Alert tone="success" title={t('checkout.freeTitle')}>{t('checkout.freeDesc')}</Alert><Button fullWidth className="mt-4" loading={processing} onClick={submit}>{t('checkout.confirmFree')}</Button></div>
              ) : !selectedOption ? (
                <Alert tone="warning" title={t('checkout.noPaymentMethods')}>{t('checkout.noPaymentMethodsDesc')}</Alert>
              ) : (
                <div className="space-y-5">
                  <div>
                    <div className="flex items-center gap-2.5"><span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-soft text-xs font-bold text-brand">1</span><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink">{t('checkout.chooseMethod')}</p></div>
                    {onlineOptions.length ? (
                      <div className="mt-2">
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted">{t('checkout.onlineGroup')} · {t('payments.chargily')}</p>
                        <div className="grid gap-2 sm:grid-cols-2">{onlineOptions.map((option) => <MethodCard key={option.id} option={option} selected={selectedId === option.id} onSelect={setSelectedMethod} t={t} />)}</div>
                      </div>
                    ) : null}
                    {manualOptions.length ? (
                      <div className="mt-4">
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted">{t('checkout.manualGroup')}</p>
                        <div className="grid gap-2 sm:grid-cols-2">{manualOptions.map((option) => <MethodCard key={option.id} option={option} selected={selectedId === option.id} onSelect={setSelectedMethod} t={t} />)}</div>
                      </div>
                    ) : null}
                  </div>

                  {selectedOption.group === 'online' ? (
                    <div className="space-y-3 rounded-xl border border-brand/15 bg-brand-soft/20 p-4">
                      <div className="flex items-center gap-2.5"><span className="grid h-7 w-7 place-items-center rounded-lg bg-brand text-xs font-bold text-white">2</span><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink">{t('checkout.paymentChoice')}</p></div>
                      <Alert tone="info" icon={CreditCard} title={t('checkout.chargilyCheckout')}>{t('checkout.chargilyNotice')}</Alert>
                      <div className="rounded-xl border border-line bg-white p-4">
                        <div className="flex items-center justify-between gap-2"><p className="text-[10px] uppercase tracking-wide text-muted">{t('payments.card')}</p><Badge tone="brand">{t(paymentMethodLabelKey(selectedId))}</Badge></div>
                        <p className="mt-3 font-mono text-sm tracking-[0.18em] text-ink" dir="ltr">•••• •••• •••• 4242</p>
                        <p className="mt-1 text-[10px] text-muted">{t('checkout.cardDemoHint')}</p>
                      </div>
                      <Button fullWidth loading={processing} onClick={submit} icon={ShieldCheck}>{t('checkout.payWithChargily', { amount: money(course.priceDA) })}</Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center gap-2.5"><span className="grid h-7 w-7 place-items-center rounded-lg bg-brand text-xs font-bold text-white">2</span><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink">{t('checkout.paymentChoice')}</p></div>
                        <Alert tone="warning" className="mt-2">{t('checkout.manualInstructionsText')}</Alert>
                      </div>
                      <ManualDetails method={selectedId} manual={school.paymentSettings?.manual} school={school} language={language} t={t} />
                      <div className="space-y-3 rounded-xl border border-line bg-surface/60 p-4">
                        <div>
                          <Label required={needsReference} hint={needsReference ? undefined : t('common.optional')}>{t('checkout.reference')}</Label>
                          <Input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="REF-..." dir="ltr" />
                        </div>
                        <div>
                          <Label hint={t('common.optional')}>{t('checkout.uploadReceipt')}</Label>
                          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-line bg-white px-4 py-5 text-center transition hover:border-brand/50">
                            <input type="file" accept="image/*,application/pdf" onChange={pickProof} className="hidden" />
                            <FileText size={20} className="text-brand" />
                            <span className="mt-2 text-xs font-semibold text-ink">{t('checkout.uploadReceipt')}</span>
                            <span className="mt-0.5 text-[10px] text-muted">{t('checkout.receiptHint')}</span>
                          </label>
                        </div>
                      </div>
                      <Button fullWidth size="lg" loading={processing} onClick={submit}>{t('checkout.submitReceipt')}</Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
          <aside className="self-start md:sticky md:top-24">
            <Card className="overflow-hidden shadow-sm">
              <div className="border-b border-line bg-surface/60 p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand">{t('payments.orderSummary')}</p>
                <h2 className="mt-1 brand-font text-base font-bold text-ink">{t('checkout.stepReview')}</h2>
              </div>
              <div className="p-5">
                <div className="flex gap-3">
                  <img src={coverImageFor(course, school)} alt="" className="h-16 w-20 shrink-0 rounded-xl object-cover" />
                  <div className="min-w-0"><p className="line-clamp-2 text-xs font-bold text-ink">{course.title}</p><p className="mt-0.5 truncate text-[10px] text-muted">{school.name}</p><Badge tone="neutral" className="mt-1.5">{levelLabel(t, course.difficulty)}</Badge></div>
                </div>
                <div className="mt-5 space-y-2.5 border-t border-line pt-4 text-xs">
                  <p className="flex justify-between gap-3"><span className="text-muted">{t('checkout.price')}</span><span className="font-semibold text-ink">{course.isFree ? t('publicSite.free') : money(course.priceDA)}</span></p>
                  <p className="flex justify-between gap-3"><span className="text-muted">{t('checkout.discount')}</span><span className="text-ink">—</span></p>
                  {selectedOption ? <p className="flex justify-between gap-3"><span className="text-muted">{t('payments.method')}</span><span className="text-end font-semibold text-ink">{t(paymentMethodLabelKey(selectedId))}</span></p> : null}
                </div>
                <div className="mt-5 rounded-2xl bg-brand-soft/60 p-4">
                  <p className="flex items-center justify-between text-sm font-bold"><span>{t('checkout.total')}</span><span className="text-lg text-brand">{course.isFree ? t('publicSite.free') : money(course.priceDA)}</span></p>
                </div>
                {processing ? <p className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-medium text-brand"><Loader2 size={12} className="animate-spin" />{t('checkout.validating')}</p> : null}
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-line bg-surface/60 p-3 text-[10px] leading-relaxed text-muted"><ShieldCheck size={14} className="mt-0.5 shrink-0 text-brand" /><span>{t('checkout.securePaymentDesc')}</span></div>
                <p className="mt-3 text-[9px] leading-relaxed text-muted">{t('checkout.terms')}</p>
              </div>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  )
}
