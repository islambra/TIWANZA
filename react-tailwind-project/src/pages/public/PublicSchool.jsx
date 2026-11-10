import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock,
  CreditCard,
  FileText,
  GraduationCap,
  Globe2,
  Layers,
  Lock,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  PlayCircle,
  Search,
  ShieldCheck,
  Star,
  Target,
  Users,
  Video,
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
  Input,
  Label,
  Modal,
  ProgressBar,
  RatingStars,
  Select,
  Textarea,
} from '../../components/ui.jsx'
import { LessonBlock } from '../../components/LessonContent.jsx'
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

function CourseCard({ course, school, state, t, money }) {
  const lessons = getCourseLessons(state, course.id)
  const students = getCourseLearnerCount(state, course.id)
  const duration = getCourseDurationMinutes(state, course.id)
  const rating = getCourseRating(state, course.id)
  return (
    <Link to={`/s/${school.slug}/courses/${course.id}`} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lg">
      <div className="relative flex h-36 flex-col justify-between overflow-hidden p-4 text-white" style={{ background: course.cover }}>
        {course.coverImage ? <img src={course.coverImage} alt="" className="absolute inset-0 h-full w-full object-cover" /> : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent" />
        <div className="relative flex justify-between gap-2">
          <Badge className="border-white/20 bg-black/20 text-white">{course.category || t('publicSite.coursesAll')}</Badge>
          <div className="flex gap-1"><Badge className="border-white/20 bg-white/15 text-white">{levelLabel(t, course.difficulty)}</Badge>{course.isFree ? <Badge className="border-white/20 bg-white/90 text-ink">{t('publicSite.free')}</Badge> : null}</div>
        </div>
        <div className="relative"><p className="text-[10px] uppercase tracking-[0.16em] text-white/70">{course.coverLabel}</p><h3 className="mt-1 line-clamp-2 text-base font-bold">{course.title}</h3></div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="line-clamp-2 text-xs leading-relaxed text-muted">{course.shortDescription}</p>
        <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-muted">
          {rating.count ? <><RatingStars value={rating.average} size={12} /><span className="font-semibold text-ink">{rating.average}</span><span>({t('publicSite.reviewsCount', { count: rating.count })})</span></> : <span>{t('publicSite.noRatings')}</span>}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted">
          <span className="flex items-center gap-1"><BookOpen size={11} />{t('publicSite.lessonsCount', { count: lessons.length })}</span>
          <span className="flex items-center gap-1"><Clock size={11} />{formatDuration(duration)}</span>
          <span className="flex items-center gap-1"><Users size={11} />{t('publicSite.studentsCount', { count: students })}</span>
        </div>
        <div className="mt-auto flex items-center justify-between border-t border-line pt-3">
          <span className="text-sm font-bold text-ink">{course.isFree ? t('publicSite.free') : money(course.priceDA)}</span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand group-hover:underline">{t('publicSite.viewCourse')}<ArrowRight size={12} /></span>
        </div>
      </div>
    </Link>
  )
}

function SchoolHeader({ school }) {
  const { t, language, toggleLanguage } = useI18n()
  const { isAuthenticated, home } = useAuth()
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link to={`/s/${school.slug}`} className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl text-white" style={{ background: school.brandAccent || '#0D7A6A' }}>{school.logo ? <img src={school.logo} alt="" className="h-full w-full rounded-xl object-cover" /> : <GraduationCap size={19} />}</span>
          <span className="min-w-0"><span className="block truncate text-sm font-bold text-ink">{school.name}</span><span className="block truncate text-[10px] text-muted">{school.subdomain}</span></span>
        </Link>
        <nav className="ms-auto hidden items-center gap-1 sm:flex"><Link to={`/s/${school.slug}`} className="rounded-lg px-3 py-2 text-xs font-medium text-muted hover:bg-surface hover:text-ink">{t('publicSite.navHome')}</Link><a href={`/s/${school.slug}#courses`} className="rounded-lg px-3 py-2 text-xs font-medium text-muted hover:bg-surface hover:text-ink">{t('publicSite.navCourses')}</a><a href={`/s/${school.slug}#about`} className="rounded-lg px-3 py-2 text-xs font-medium text-muted hover:bg-surface hover:text-ink">{t('publicSite.navAbout')}</a><a href={`/s/${school.slug}#contact`} className="rounded-lg px-3 py-2 text-xs font-medium text-muted hover:bg-surface hover:text-ink">{t('publicSite.navContact')}</a></nav>
        <Button variant="ghost" size="sm" onClick={toggleLanguage} className="px-2"><Globe2 size={14} /><span className="text-[10px] font-bold uppercase">{language === 'fr' ? 'AR' : 'FR'}</span></Button>
        {isAuthenticated ? <a href={home}><Button size="sm">{t('publicSite.navMySpace')}</Button></a> : <><Link to="/login" className="hidden sm:block"><Button variant="secondary" size="sm">{t('publicSite.navLogin')}</Button></Link><Link to="/register"><Button size="sm">{t('publicSite.navRegister')}</Button></Link></>}
      </div>
    </header>
  )
}

function SchoolFooter({ school, trainer }) {
  const { t } = useI18n()
  return (
    <footer className="mt-12 border-t border-line bg-ink text-white/70">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-3">
        <div><div className="flex items-center gap-2 text-white"><GraduationCap size={18} /><span className="font-bold">{school.name}</span></div><p className="mt-2 text-[11px] leading-relaxed">{school.description}</p><p className="mt-3 text-[10px] text-white/40">{t('publicSite.poweredBy')}</p></div>
        <div><p className="text-[11px] font-semibold uppercase tracking-wide text-white">{t('publicSite.quickLinks')}</p><div className="mt-2 flex flex-col gap-1.5 text-[11px]"><a href={`/s/${school.slug}#courses`} className="hover:text-white">{t('publicSite.navCourses')}</a><a href={`/s/${school.slug}#about`} className="hover:text-white">{t('publicSite.navAbout')}</a><a href={`/s/${school.slug}#contact`} className="hover:text-white">{t('publicSite.navContact')}</a></div></div>
        <div><p className="text-[11px] font-semibold uppercase tracking-wide text-white">{t('publicSite.contactInfo')}</p><div className="mt-2 space-y-1.5 text-[11px]">{school.contactEmail ? <p className="flex items-center gap-1.5"><Mail size={11} />{school.contactEmail}</p> : null}{school.contactPhone ? <p className="flex items-center gap-1.5"><Phone size={11} />{school.contactPhone}</p> : null}{school.city ? <p className="flex items-center gap-1.5"><MapPin size={11} />{school.city}</p> : null}{trainer ? <p>{trainer.name}</p> : null}</div></div>
      </div>
      <div className="border-t border-white/10 py-3 text-center text-[10px] text-white/40">{t('publicSite.footerRights', { year: new Date().getFullYear(), school: school.name })}</div>
    </footer>
  )
}

export function SchoolHome() {
  const { state, school, trainer } = useSchoolPublic()
  const { t, money } = useI18n()
  const { success } = useToast()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [level, setLevel] = useState('all')
  const [price, setPrice] = useState('all')
  const [courseLanguage, setCourseLanguage] = useState('all')
  const [sort, setSort] = useState('popular')
  const [contact, setContact] = useState({ name: '', email: '', subject: '', message: '' })

  if (!school) return <div className="grid min-h-screen place-items-center bg-surface p-6"><EmptyState icon={GraduationCap} title={t('publicSite.schoolUnavailable')} description={t('publicSite.schoolUnavailableDesc')} action={<Link to="/"><Button>{t('publicSite.backHome')}</Button></Link>} /></div>

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
  const allLearners = new Set(state.enrollments.filter((enrollment) => enrollment.schoolId === school.id).map((enrollment) => enrollment.learnerId)).size
  const years = school.createdAt ? new Date().getFullYear() - new Date(school.createdAt).getFullYear() : 0
  const ratedCourses = courses.map((course) => getCourseRating(state, course.id)).filter((rating) => rating.count)
  const satisfaction = ratedCourses.length
    ? (ratedCourses.reduce((total, rating) => total + rating.average, 0) / ratedCourses.length).toFixed(1)
    : '—'
  const hasFilters = query || category !== 'all' || level !== 'all' || price !== 'all' || courseLanguage !== 'all'

  function clearFilters() {
    setQuery('')
    setCategory('all')
    setLevel('all')
    setPrice('all')
    setCourseLanguage('all')
    setSort('popular')
  }

  function sendContact(event) {
    event.preventDefault()
    if (!contact.name.trim() || !contact.email.trim() || !contact.message.trim()) return
    success(t('publicSite.contactEmailSent'), t('publicSite.contactEmailSentDesc'))
    setContact({ name: '', email: '', subject: '', message: '' })
  }

  return (
    <div className="min-h-screen bg-white">
      <SchoolHeader school={school} />
      <section className="relative overflow-hidden px-4 py-16 text-white sm:py-24" style={{ background: `linear-gradient(135deg, ${school.brandAccent || '#0D7A6A'}, #123B38)` }}>
        <div className="mx-auto max-w-6xl">
          <Badge className="border-white/20 bg-white/10 text-white" dot>{t('publicSite.heroBadge')}</Badge>
          <h1 className="mt-4 max-w-3xl text-3xl font-bold leading-tight sm:text-5xl">{school.name}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">{school.description}</p>
          <div className="mt-6 flex flex-wrap gap-2"><a href="#courses"><Button size="lg" variant="secondary">{t('publicSite.heroCta')}<ArrowRight size={16} /></Button></a><a href="#about"><Button size="lg" variant="ghost" className="border border-white/20 text-white hover:bg-white/10">{t('publicSite.heroSecondary')}</Button></a></div>
          <div className="mt-8 flex flex-wrap gap-6 text-xs text-white/80"><span><strong className="text-lg text-white">{courses.length}</strong> {t('publicSite.statsCourses')}</span><span><strong className="text-lg text-white">{allLearners}</strong> {t('publicSite.statsLearners')}</span><span><strong className="text-lg text-white">{satisfaction}</strong> {t('publicSite.satisfaction')}</span><span><strong className="text-lg text-white">{years || 1}</strong> {t('publicSite.schoolSince', { year: new Date(school.createdAt).getFullYear() })}</span></div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4">
        <section id="courses" className="py-12">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"><div><h2 className="text-2xl font-bold text-ink">{t('publicSite.coursesTitle')}</h2><p className="mt-1 text-sm text-muted">{t('publicSite.coursesSubtitle')}</p></div><div className="flex flex-wrap items-center gap-2"><div className="relative"><Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('publicSite.searchPlaceholder')} className="w-60 ps-8" /></div><Badge tone="neutral">{t('publicSite.resultsCount', { count: rows.length })}</Badge></div></div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Select value={category} onChange={(event) => setCategory(event.target.value)} className="w-auto min-w-36"><option value="all">{t('publicSite.allCategories')}</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</Select>
            <Select value={level} onChange={(event) => setLevel(event.target.value)} className="w-auto min-w-36"><option value="all">{t('publicSite.allLevels')}</option><option value="beginner">{t('publicSite.levelBeginner')}</option><option value="intermediate">{t('publicSite.levelIntermediate')}</option><option value="advanced">{t('publicSite.levelAdvanced')}</option></Select>
            <Select value={price} onChange={(event) => setPrice(event.target.value)} className="w-auto min-w-32"><option value="all">{t('publicSite.allPrices')}</option><option value="free">{t('publicSite.freeCourses')}</option><option value="paid">{t('publicSite.paidCourses')}</option></Select>
            <Select value={courseLanguage} onChange={(event) => setCourseLanguage(event.target.value)} className="w-auto min-w-36"><option value="all">{t('publicSite.allLanguages')}</option><option value="fr">Français</option><option value="ar">العربية</option></Select>
            <Select value={sort} onChange={(event) => setSort(event.target.value)} className="w-auto min-w-40"><option value="popular">{t('publicSite.sortPopular')}</option><option value="newest">{t('publicSite.sortNewest')}</option><option value="rating">{t('publicSite.sortRating')}</option><option value="priceLow">{t('publicSite.sortPriceLow')}</option><option value="priceHigh">{t('publicSite.sortPriceHigh')}</option></Select>
            {hasFilters ? <Button variant="ghost" size="sm" onClick={clearFilters}>{t('publicSite.clearFilters')}</Button> : null}
          </div>
          {rows.length ? <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{rows.map((course) => <CourseCard key={course.id} course={course} school={school} state={state} t={t} money={money} />)}</div> : <EmptyState icon={BookOpen} title={t('publicSite.noResults')} description={t('publicSite.noResultsDesc')} action={hasFilters ? <Button variant="secondary" onClick={clearFilters}>{t('publicSite.clearFilters')}</Button> : null} className="mt-6" />}
        </section>

        <section id="about" className="grid gap-6 border-y border-line py-12 md:grid-cols-2">
          <div><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">{t('publicSite.navAbout')}</p><h2 className="mt-2 text-2xl font-bold text-ink">{t('publicSite.aboutTitle')}</h2><p className="mt-2 text-sm leading-relaxed text-muted">{school.description}</p><div className="mt-4 grid gap-3 sm:grid-cols-3">{[[t('publicSite.why1Title'), t('publicSite.why1Desc')], [t('publicSite.why2Title'), t('publicSite.why2Desc')], [t('publicSite.why3Title'), t('publicSite.why3Desc')]].map(([title, desc]) => <div key={title} className="rounded-xl bg-surface p-3"><p className="text-xs font-semibold text-ink">{title}</p><p className="mt-1 text-[10px] leading-relaxed text-muted">{desc}</p></div>)}</div></div>
          {trainer ? <Card><div className="flex items-center gap-3"><span className="grid h-14 w-14 place-items-center rounded-full text-lg font-bold text-white" style={{ background: school.brandAccent }}>{trainer.name.charAt(0)}</span><div><p className="text-sm font-bold text-ink">{trainer.name}</p><p className="text-[11px] text-muted">{t('publicSite.teacherTitle')}</p></div></div><p className="mt-3 text-xs leading-relaxed text-muted">{state.trainerProfiles.find((profile) => profile.userId === trainer.id)?.bio || t('publicSite.teacherBio')}</p><div className="mt-3 flex gap-3 text-[10px] text-muted"><span>{t('publicSite.teacherCourses', { count: courses.length })}</span><span>{t('publicSite.teacherLearners', { count: allLearners })}</span></div></Card> : null}
        </section>

        <section id="contact" className="grid gap-6 py-12 md:grid-cols-2">
          <div><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">{t('publicSite.navContact')}</p><h2 className="mt-2 text-2xl font-bold text-ink">{t('publicSite.contactTitle')}</h2><p className="mt-1 text-sm text-muted">{t('publicSite.contactSubtitle')}</p><div className="mt-4 space-y-2 text-xs text-muted">{school.contactEmail ? <p className="flex items-center gap-2"><Mail size={13} className="text-brand" />{school.contactEmail}</p> : null}{school.contactPhone ? <p className="flex items-center gap-2"><Phone size={13} className="text-brand" />{school.contactPhone}</p> : null}{school.city ? <p className="flex items-center gap-2"><MapPin size={13} className="text-brand" />{school.city}</p> : null}</div></div>
          <Card><form onSubmit={sendContact} className="space-y-3 p-5"><div className="grid gap-3 sm:grid-cols-2"><div><Label>{t('publicSite.contactName')}</Label><Input value={contact.name} onChange={(event) => setContact({ ...contact, name: event.target.value })} /></div><div><Label>{t('publicSite.contactEmail')}</Label><Input type="email" value={contact.email} onChange={(event) => setContact({ ...contact, email: event.target.value })} /></div></div><div><Label>{t('publicSite.contactSubject')}</Label><Input value={contact.subject} onChange={(event) => setContact({ ...contact, subject: event.target.value })} /></div><div><Label>{t('publicSite.contactMessage')}</Label><Textarea rows={3} value={contact.message} onChange={(event) => setContact({ ...contact, message: event.target.value })} /></div><Button fullWidth icon={MessageSquare} type="submit">{t('publicSite.contactSend')}</Button></form></Card>
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
  const { success } = useToast()
  const navigate = useNavigate()
  const [openSections, setOpenSections] = useState({})
  const [previewLesson, setPreviewLesson] = useState(null)
  const course = getCourse(state, courseId)
  const enrollment = user && course ? getEnrollment(state, course.id, user.id) : null

  if (!school) return <div className="grid min-h-screen place-items-center"><EmptyState icon={GraduationCap} title={t('publicSite.schoolUnavailable')} /></div>
  if (!course || course.schoolId !== school.id || course.status !== 'published') return <div className="min-h-screen bg-white"><SchoolHeader school={school} /><div className="mx-auto max-w-3xl px-4 py-20"><EmptyState icon={BookOpen} title={t('publicSite.notFoundTitle')} description={t('publicSite.notFoundDesc')} action={<Link to={`/s/${school.slug}`}><Button>{t('publicSite.browseCourses')}</Button></Link>} /></div></div>

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
    if (!isAuthenticated) return navigate(`/login?redirect=${encodeURIComponent(target)}`)
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
      <div className="border-b border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
          <Link to={`/s/${school.slug}`} className="text-[11px] font-medium text-muted hover:text-brand">← {t('publicSite.breadcrumbHome')} / {t('publicSite.breadcrumbCourses')}</Link>
          <div className="mt-3 flex flex-wrap gap-2"><Badge tone="brand">{course.category}</Badge><Badge tone="neutral">{levelLabel(t, course.difficulty)}</Badge><Badge tone="neutral">{course.language === 'ar' ? 'العربية' : 'Français'}</Badge>{course.isFree ? <Badge tone="success">{t('publicSite.free')}</Badge> : null}</div>
          <h1 className="mt-2 max-w-3xl text-2xl font-bold text-ink sm:text-3xl">{course.title}</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted">{course.shortDescription}</p>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-muted">
            <span className="flex items-center gap-1.5">{rating.count ? <><RatingStars value={rating.average} size={13} /><strong className="text-ink">{rating.average}</strong><span>({t('publicSite.reviewsCount', { count: rating.count })})</span></> : <span>{t('publicSite.noRatings')}</span>}</span>
            <span className="flex items-center gap-1"><Users size={12} />{students} {t('publicSite.students')}</span>
            <span className="flex items-center gap-1"><BookOpen size={12} />{t('publicSite.lessonsCount', { count: lessons.length })}</span>
            <span className="flex items-center gap-1"><Clock size={12} />{formatDuration(duration)}</span>
            <span className="flex items-center gap-1"><Award size={12} />{levelLabel(t, course.difficulty)}</span>
            <span className="flex items-center gap-1"><Star size={12} />{t('publicSite.updatedOn', { date: date(course.updatedAt) })}</span>
          </div>
        </div>
      </div>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card><div className="p-5">
            <h2 className="text-base font-bold text-ink">{t('publicSite.objectives')}</h2>
            {objectives.length ? <ul className="mt-3 grid gap-2 sm:grid-cols-2">{objectives.map((item) => <li key={item} className="flex items-start gap-2 rounded-lg bg-surface px-3 py-2 text-xs text-muted"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-success" />{item}</li>)}</ul> : <p className="mt-2 text-xs text-muted">{t('publicSite.noObjectives')}</p>}
            <h2 className="mt-6 text-base font-bold text-ink">{t('publicSite.description')}</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted">{course.description}</p>
            <h2 className="mt-6 flex items-center gap-2 text-base font-bold text-ink"><Target size={16} className="text-brand" />{t('publicSite.prerequisites')}</h2>
            {prerequisites.length ? <ul className="mt-2 space-y-1.5">{prerequisites.map((item) => <li key={item} className="flex items-start gap-2 text-xs text-muted"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand" />{item}</li>)}</ul> : <p className="mt-2 text-xs text-muted">{t('publicSite.noPrerequisites')}</p>}
          </div></Card>

          <Card><div className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-base font-bold text-ink">{t('publicSite.courseContent')}</h2><p className="text-[11px] text-muted">{t('publicSite.sectionsCount', { count: stats.sections })} · {t('publicSite.lessonsCount', { count: stats.lessons })} · {formatDuration(duration)}</p></div>{previewLessons.length ? <Badge tone="success" dot>{t('publicSite.freePreviewCount', { count: previewLessons.length })}</Badge> : <Badge tone="neutral">{t('publicSite.fullAccess')}</Badge>}</div>
            <div className="mt-4 space-y-2">
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
          </div></Card>

          {trainer ? <Card><div className="p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">{t('publicSite.instructorTitle')}</p>
            <div className="mt-3 flex items-center gap-3"><Avatar name={trainer.name} size="xl" /><div><p className="text-sm font-bold text-ink">{trainer.name}</p><p className="text-[11px] text-muted">{t('publicSite.instructorRole')}</p><div className="mt-1 flex flex-wrap gap-3 text-[10px] text-muted"><span>{t('publicSite.instructorCourses', { count: publishedCourses.length })}</span><span>{t('publicSite.teacherLearners', { count: instructorLearners })}</span></div></div></div>
            <p className="mt-3 text-xs leading-relaxed text-muted">{profile?.bio || t('publicSite.instructorBio')}</p>
            {profile?.headline ? <p className="mt-2 text-[11px] font-semibold text-brand">{profile.headline}</p> : null}
          </div></Card> : null}

          <Card><div className="p-5">
            <div className="flex items-center justify-between"><h2 className="text-base font-bold text-ink">{t('publicSite.reviewsTitle')}</h2><Badge tone="neutral">{t('publicSite.reviewsCount', { count: reviews.length })}</Badge></div>
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

        <aside className="space-y-4 self-start lg:sticky lg:top-20">
          <Card><div className="p-5">
            <p className="text-2xl font-bold text-ink">{course.isFree ? t('publicSite.free') : money(course.priceDA)}</p><p className="mt-1 text-[10px] text-muted">{t('publicSite.oneTimePayment')}</p>
            {enrollment?.status === 'active' ? <Button fullWidth className="mt-4" onClick={() => navigate(`/learn/courses/${course.id}`)}>{t('publicSite.continueLearning')}</Button> : <Button fullWidth className="mt-4" onClick={enroll}>{isAuthenticated ? (course.isFree ? t('publicSite.enrollFree') : t('publicSite.enrollNow')) : t('publicSite.loginToEnroll')}</Button>}
            {!isAuthenticated ? <p className="mt-2 text-center text-[10px] text-muted">{t('publicSite.loginPrompt')}</p> : null}
            <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-surface p-3 text-[10px] text-muted"><span className="flex items-center gap-1.5"><Layers size={12} className="text-brand" />{t('publicSite.sectionsCount', { count: stats.sections })}</span><span className="flex items-center gap-1.5"><PlayCircle size={12} className="text-brand" />{t('publicSite.lessonsCount', { count: stats.lessons })}</span><span className="flex items-center gap-1.5"><Clock size={12} className="text-brand" />{formatDuration(duration)}</span><span className="flex items-center gap-1.5"><Globe2 size={12} className="text-brand" />{course.language === 'ar' ? 'العربية' : 'Français'}</span></div>
            <div className="mt-4 space-y-2 border-t border-line pt-3 text-[11px] text-muted">{[[ShieldCheck, t('publicSite.securePayment')], [PlayCircle, t('publicSite.includeAccess')], [FileText, t('publicSite.includeFiles')], [MessageSquare, t('publicSite.includeDiscussion')], [CheckCircle2, t('publicSite.includeCertificate')]].map(([Icon, label], index) => <p key={index} className="flex items-center gap-2"><Icon size={13} className="text-brand" />{label}</p>)}</div>
            <Button fullWidth variant="secondary" className="mt-3" onClick={shareCourse}>{t('publicSite.shareCourse')}</Button>
          </div></Card>
          <Card><div className="p-4 text-center"><p className="text-xs font-semibold text-ink">{t('publicSite.needHelp')}</p><p className="mt-1 text-[10px] text-muted">{t('publicSite.needHelpDesc')}</p>{school.contactEmail ? <a href={`mailto:${school.contactEmail}`} className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-brand"><Mail size={12} />{school.contactEmail}</a> : null}</div></Card>
        </aside>
      </main>

      {relatedCourses.length ? <section className="border-t border-line bg-surface"><div className="mx-auto max-w-6xl px-4 py-10"><div className="flex items-end justify-between"><div><h2 className="text-xl font-bold text-ink">{t('publicSite.relatedCourses')}</h2><p className="mt-1 text-xs text-muted">{t('publicSite.relatedCoursesDesc')}</p></div><Link to={`/s/${school.slug}`} className="text-[11px] font-semibold text-brand hover:underline">{t('publicSite.browseCourses')} →</Link></div><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{relatedCourses.map((item) => <CourseCard key={item.id} course={item} school={school} state={state} t={t} money={money} />)}</div></div></section> : null}

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

export function CourseCheckout() {
  const { slug, courseId } = useParams()
  const { state, school } = useSchoolPublic()
  const { user } = useAuth()
  const { t, money } = useI18n()
  const { success, error: toastError } = useToast()
  const navigate = useNavigate()
  const [method, setMethod] = useState('online')
  const [provider, setProvider] = useState('cib')
  const [card, setCard] = useState({ number: '4242 4242 4242 4242', name: user?.name || '', expiry: '12/28', cvv: '123' })
  const [reference, setReference] = useState('')
  const [proofName, setProofName] = useState('')
  const [proofData, setProofData] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null)

  if (!school) return <EmptyState icon={GraduationCap} title={t('publicSite.schoolUnavailable')} />
  const course = getCourse(state, courseId)
  if (!course || course.schoolId !== school.id) return <div className="grid min-h-screen place-items-center"><EmptyState icon={BookOpen} title={t('publicSite.notFoundTitle')} action={<Link to={`/s/${school.slug}`}><Button>{t('publicSite.browseCourses')}</Button></Link>} /></div>
  const enrollment = user ? getEnrollment(state, course.id, user.id) : null
  const manual = school.paymentSettings?.manual
  const online = school.paymentSettings?.chargerly?.status === 'connected'

  if (!user) {
    const target = encodeURIComponent(`/s/${school.slug}/courses/${course.id}/checkout`)
    return <div className="min-h-screen bg-white"><SchoolHeader school={school} /><div className="mx-auto max-w-lg px-4 py-20"><EmptyState icon={CreditCard} title={t('checkout.needAccount')} description={t('publicSite.loginPrompt')} action={<><Link to={`/login?redirect=${target}`}><Button>{t('checkout.login')}</Button></Link><Link to={`/register?role=learner&redirect=${target}`}><Button variant="secondary">{t('checkout.register')}</Button></Link></>} /></div></div>
  }

  if (enrollment?.status === 'active') return <div className="min-h-screen bg-white"><SchoolHeader school={school} /><div className="mx-auto max-w-lg px-4 py-20"><EmptyState icon={CheckCircle2} title={t('checkout.alreadyEnrolled')} action={<Button onClick={() => navigate(`/learn/courses/${course.id}`)}>{t('checkout.goToCourseNow')}</Button>} /></div></div>

  function pickProof(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) return toastError(t('errors.fileTooLarge'))
    setProofName(file.name)
    const reader = new FileReader()
    reader.onload = () => setProofData(reader.result)
    reader.readAsDataURL(file)
  }

  function submit() {
    setProcessing(true)
    if (course.isFree) {
      const response = enrollFree(course.id, user.id)
      setProcessing(false)
      if (!response.ok) return toastError(t('checkout.paymentFailed'))
      setResult({ type: 'free' })
      success(t('checkout.successTitle'))
      return
    }
    if (method === 'online') {
      const response = submitCourseOnlinePayment({ courseId: course.id, learnerId: user.id, provider, outcome: 'success' })
      setProcessing(false)
      if (!response.ok) return toastError(t('checkout.paymentFailed'))
      setResult({ type: 'online', reference: response.payment?.reference })
      success(t('checkout.paymentSuccess'))
      return
    }
    if (!reference.trim() || !proofName) {
      setProcessing(false)
      return toastError(t('checkout.receiptRequired'))
    }
    const response = requestManualEnrollment({ courseId: course.id, learnerId: user.id, reference: reference.trim(), proofName, proofDataUrl: proofData })
    setProcessing(false)
    if (!response.ok) return toastError(t('checkout.paymentFailed'))
    setResult({ type: 'manual' })
    success(t('checkout.manualSubmitted'))
  }

  if (result) {
    const successType = result.type === 'manual' ? t('checkout.manualPendingTitle') : t('checkout.successTitle')
    const desc = result.type === 'manual' ? t('checkout.manualPendingDesc') : t('checkout.successDesc')
    return <div className="min-h-screen bg-white"><SchoolHeader school={school} /><div className="mx-auto max-w-2xl px-4 py-16"><Card><div className="p-8 text-center"><span className={cn('mx-auto grid h-16 w-16 place-items-center rounded-full', result.type === 'manual' ? 'bg-warning-soft text-warning' : 'bg-success-soft text-success')}><CheckCircle2 size={30} /></span><h1 className="mt-4 text-xl font-bold text-ink">{successType}</h1><p className="mt-2 text-sm text-muted">{desc}</p><div className="mt-5 flex flex-wrap justify-center gap-2">{result.type === 'online' ? <Button onClick={() => navigate(`/learn/courses/${course.id}`)}>{t('checkout.goToCourse')}</Button> : result.type === 'free' ? <Button onClick={() => navigate(`/learn/courses/${course.id}`)}>{t('checkout.goToCourse')}</Button> : null}<Button variant="secondary" onClick={() => navigate('/learn/payments')}>{t('checkout.viewOrders')}</Button><Button variant="ghost" onClick={() => navigate('/learn')}>{t('checkout.goToDashboard')}</Button></div></div></Card></div></div>
  }

  return (
    <div className="min-h-screen bg-white">
      <SchoolHeader school={school} />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Link to={`/s/${school.slug}/courses/${course.id}`} className="text-[11px] text-muted hover:text-brand">← {t('checkout.backToCourse')}</Link>
        <h1 className="mt-2 text-2xl font-bold text-ink">{t('checkout.title')}</h1>
        <p className="mt-1 text-sm text-muted">{t('checkout.subtitle')}</p>
        <div className="mt-5 grid gap-4 md:grid-cols-[1fr_300px]">
          <Card>
            <div className="p-5">
              {course.isFree ? <div><Alert tone="success" title={t('checkout.freeTitle')}>{t('checkout.freeDesc')}</Alert><Button fullWidth className="mt-4" loading={processing} onClick={submit}>{t('checkout.confirmFree')}</Button></div> : (
                <div className="space-y-4">
                  <div><Label>{t('checkout.paymentMethod')}</Label><div className="grid gap-2 sm:grid-cols-2"><button type="button" disabled={!online} onClick={() => setMethod('online')} className={cn('rounded-xl border p-3 text-start transition', method === 'online' ? 'border-brand bg-brand-soft/40' : 'border-line hover:border-brand/40', !online && 'cursor-not-allowed opacity-50')}><CreditCard size={17} className="text-brand" /><p className="mt-2 text-xs font-semibold text-ink">{t('checkout.payOnline')}</p><p className="mt-0.5 text-[10px] text-muted">{t('checkout.payOnlineDesc')}</p></button><button type="button" disabled={!manual?.enabled} onClick={() => setMethod('manual')} className={cn('rounded-xl border p-3 text-start transition', method === 'manual' ? 'border-brand bg-brand-soft/40' : 'border-line hover:border-brand/40', !manual?.enabled && 'cursor-not-allowed opacity-50')}><BookOpen size={17} className="text-brand" /><p className="mt-2 text-xs font-semibold text-ink">{t('checkout.payManual')}</p><p className="mt-0.5 text-[10px] text-muted">{t('checkout.payManualDesc')}</p></button></div></div>
                  {method === 'online' ? <><Alert tone="info">{t('checkout.cardDemoHint')}</Alert><div><Label>{t('checkout.cardNumber')}</Label><Input value={card.number} onChange={(event) => setCard({ ...card, number: event.target.value })} /></div><div className="grid gap-3 sm:grid-cols-2"><div><Label>{t('checkout.cardName')}</Label><Input value={card.name} onChange={(event) => setCard({ ...card, name: event.target.value })} /></div><div><Label>{t('checkout.cardExpiry')}</Label><Input value={card.expiry} onChange={(event) => setCard({ ...card, expiry: event.target.value })} /></div></div><div className="grid gap-3 sm:grid-cols-2"><div><Label>{t('checkout.cardCvv')}</Label><Input value={card.cvv} onChange={(event) => setCard({ ...card, cvv: event.target.value })} /></div><div><Label>{t('checkout.cardholderName')}</Label><Select value={provider} onChange={(event) => setProvider(event.target.value)}><option value="cib">CIB Web</option><option value="edahabia">Edahabia</option></Select></div></div><Button fullWidth loading={processing} onClick={submit}>{t('checkout.payNow', { amount: money(course.priceDA) })}</Button></> : <><Alert tone="warning">{t('checkout.manualInstructionsText')}</Alert>{manual ? <div className="rounded-xl bg-surface p-4 text-[11px]"><p className="flex justify-between py-1"><span className="text-muted">{t('checkout.bankName')}</span><span className="font-medium text-ink">{manual.bank?.name}</span></p><p className="flex justify-between py-1"><span className="text-muted">{t('checkout.accountName')}</span><span className="font-medium text-ink">{manual.beneficiary}</span></p><p className="flex justify-between py-1"><span className="text-muted">CCP</span><span className="font-medium text-ink">{manual.ccp}</span></p><p className="flex justify-between py-1"><span className="text-muted">{t('checkout.rib')}</span><span className="font-medium text-ink">{manual.bank?.rib}</span></p></div> : null}<div><Label required>{t('checkout.reference')}</Label><Input value={reference} onChange={(event) => setReference(event.target.value)} /></div><div><Label required>{t('checkout.uploadReceipt')}</Label><label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-line px-3 py-6 text-xs text-muted hover:border-brand hover:text-brand"><CreditCard size={16} />{proofName || t('checkout.receiptHint')}<input type="file" accept="image/*,application/pdf" className="hidden" onChange={pickProof} /></label></div><Button fullWidth loading={processing} onClick={submit}>{processing ? t('checkout.processingManual') : t('checkout.submitReceipt')}</Button></>}
                </div>
              )}
            </div>
          </Card>
          <aside><Card><div className="p-5"><p className="text-sm font-bold text-ink">{t('checkout.orderSummary')}</p><div className="mt-3 flex gap-2"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-white" style={{ background: course.cover }}><BookOpen size={16} /></span><div className="min-w-0"><p className="line-clamp-2 text-xs font-semibold text-ink">{course.title}</p><p className="text-[10px] text-muted">{school.name}</p></div></div><div className="mt-4 space-y-2 border-t border-line pt-3 text-xs"><p className="flex justify-between"><span className="text-muted">{t('checkout.price')}</span><span className="font-medium text-ink">{course.isFree ? t('publicSite.free') : money(course.priceDA)}</span></p><p className="flex justify-between"><span className="text-muted">{t('checkout.discount')}</span><span className="text-ink">—</span></p><p className="flex justify-between border-t border-line pt-2 text-sm font-bold"><span>{t('checkout.total')}</span><span className="text-brand">{course.isFree ? t('publicSite.free') : money(course.priceDA)}</span></p></div><p className="mt-3 text-[10px] leading-relaxed text-muted">{t('checkout.securePaymentDesc')}</p><p className="mt-2 text-[9px] text-muted">{t('checkout.terms')}</p></div></Card></aside>
        </div>
      </main>
    </div>
  )
}
