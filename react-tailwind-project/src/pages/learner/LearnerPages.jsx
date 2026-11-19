import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  Compass,
  CreditCard,
  FileQuestion,
  GraduationCap,
  Layers,
  Megaphone,
  PlayCircle,
  Receipt,
  Search,
  Sparkles,
  Star,
  Target,
  TrendingUp,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useI18n } from '../../i18n/I18nContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { useTiwanzaStore } from '../../data/store.js'
import {
  getAnnouncementsForLearner,
  getCourse,
  getCourseLessons,
  getCourseRating,
  getLearnerCourses,
  getLearnerEvents,
  getLearnerPaymentRows,
  getLearnerPaymentsSummary,
  getLearnerSchoolIds,
  getNextLesson,
  getPublishedCourses,
  getQuiz,
  getSchool,
  getUnreadAnnouncements,
} from '../../data/selectors.js'
import { markAnnouncementRead, updateUser } from '../../data/services.js'
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Input,
  Label,
  Modal,
  PageHeader,
  ProgressBar,
  SearchField,
  Select,
  StatCard,
  Table,
  Tabs,
  Textarea,
} from '../../components/ui.jsx'
import { displayPaymentMethod, paymentMethodLabelKey } from '../../data/paymentMethods.js'
import { StatusPill } from '../admin/AdminDashboard.jsx'
import { cn } from '../../lib/utils.js'

function useLearner() {
  const { user } = useAuth()
  const { slug } = useParams()
  const state = useTiwanzaStore()
  const school = user?.schoolId ? getSchool(state, user.schoolId) : null
  const activeSlug = slug || school?.slug || null
  const learnBase = activeSlug ? `/s/${activeSlug}/learn` : '/learn'
  const courses = getLearnerCourses(state, user.id).filter((item) => !user?.schoolId || item.enrollment.schoolId === user.schoolId)
  const schools = school ? [school] : getLearnerSchoolIds(state, user.id).map((id) => getSchool(state, id)).filter(Boolean)
  return { user, state, courses, schools, school, slug: activeSlug, learnBase }
}

function catalogLinks(state, schoolId) {
  const slug = state.schools.find((school) => school.id === schoolId)?.slug
  return {
    school: slug ? `/s/${slug}` : '/',
    catalog: slug ? `/s/${slug}/catalog` : '/',
  }
}

function courseHref(state, schoolId, courseId) {
  const slug = state.schools.find((school) => school.id === schoolId)?.slug
  return slug ? `/s/${slug}/courses/${courseId}` : '/'
}

function progressStatus(t, percentage) {
  if (percentage === 100) return { tone: 'success', label: t('learner.completed') }
  if (percentage > 0) return { tone: 'brand', label: t('learner.inProgress') }
  return { tone: 'neutral', label: t('learner.notStarted') }
}

function enrollmentStatusBadge(t, status) {
  if (status === 'cancelled') return <Badge tone="danger" dot>{t('common.inactive')}</Badge>
  if (status === 'pending') return <Badge tone="warning" dot>{t('common.pending')}</Badge>
  if (status === 'completed') return <Badge tone="success" dot>{t('learner.completed')}</Badge>
  return <Badge tone="success" dot>{t('common.active')}</Badge>
}

function SchoolCourseCard({ course, state }) {
  const { t, money } = useI18n()
  const rating = getCourseRating(state, course.id)
  return (
    <Link to={courseHref(state, course.schoolId, course.id)} className="group overflow-hidden rounded-xl border border-line transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md">
      <div className="relative flex h-24 flex-col justify-end p-3 text-white" style={{ background: course.cover }}>
        <Badge className="absolute end-2 top-2 border-white/20 bg-black/25 text-white">{course.isFree ? t('publicSite.free') : money(course.priceDA)}</Badge>
        <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/75">{course.category}</span>
        <span className="line-clamp-1 text-xs font-bold">{course.title}</span>
      </div>
      <div className="flex items-center justify-between gap-2 p-3">
        <span className="inline-flex min-w-0 items-center gap-2 text-[10px] text-muted"><BookOpen size={11} />{t('publicSite.lessonsCount', { count: getCourseLessons(state, course.id).length })}{rating.count ? <><Star size={11} className="text-amber-500" />{rating.average}</> : null}</span>
        <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold text-brand group-hover:underline">{t('publicSite.viewCourse')}<ArrowRight size={11} /></span>
      </div>
    </Link>
  )
}

function AvailableCoursesPanel({ state, user, courses, limit = 3 }) {
  const { t } = useI18n()
  const available = user?.schoolId
    ? getPublishedCourses(state, user.schoolId).filter((course) => !courses.some((item) => item.course.id === course.id))
    : []
  if (!available.length) return null
  const { catalog: catalogHref } = catalogLinks(state, user.schoolId)
  return (
    <Card>
      <CardHeader title={t('learner.availableCourses')} description={t('learner.availableCoursesDesc')} action={<Link to={catalogHref} className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline">{t('learner.browseCourses')}<ArrowRight size={12} /></Link>} />
      <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">{available.slice(0, limit || available.length).map((course) => <SchoolCourseCard key={course.id} course={course} state={state} />)}</div>
    </Card>
  )
}

function PendingCoursesPanel({ state, user, learnBase }) {
  const { t } = useI18n()
  const pending = getLearnerPaymentRows(state, user.id).filter((row) => row.payment.status === 'pending' && (!user?.schoolId || row.course?.schoolId === user.schoolId))
  if (!pending.length) return null
  return (
    <Card className="border-warning/30 bg-warning-soft/40">
      <CardHeader title={t('learner.pendingApproval')} description={t('learner.pendingApprovalDesc')} action={<Link to={`${learnBase}/payments`} className="text-[11px] font-semibold text-brand hover:underline">{t('learner.viewAll')}</Link>} />
      <div className="divide-y divide-line">{pending.map((row) => <div key={row.payment.id} className="flex flex-wrap items-center gap-2 px-4 py-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-white text-warning"><Clock size={15} /></span><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-ink">{row.course?.title || '—'}</p><p className="text-[10px] text-muted">{t('checkout.validationDelay')}</p></div><Badge tone="warning" dot>{t('common.pending')}</Badge></div>)}</div>
    </Card>
  )
}

function ZeroCoursesPanel({ state, user }) {
  const { t } = useI18n()
  const { school: schoolHref, catalog: catalogHref } = catalogLinks(state, user?.schoolId)
  const school = state.schools.find((item) => item.id === user?.schoolId)
  const benefits = [
    { icon: Layers, title: t('publicSite.why1Title'), description: t('publicSite.why1Desc') },
    { icon: PlayCircle, title: t('publicSite.why2Title'), description: t('publicSite.why2Desc') },
    { icon: Target, title: t('publicSite.why3Title'), description: t('publicSite.why3Desc') },
  ]
  return (
    <Card className="overflow-hidden border-brand/20 shadow-sm">
      <div className="relative overflow-hidden px-5 py-8 text-white sm:px-8 sm:py-10" style={{ background: 'linear-gradient(135deg, #0B2523, #123B38)' }}>
        <div className="pointer-events-none absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.5) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="pointer-events-none absolute -end-16 -top-20 h-56 w-56 rounded-full bg-brand/30 blur-2xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur"><GraduationCap size={28} /></span>
            <div className="min-w-0">
              <Badge className="border-white/20 bg-white/10 text-white" dot>{t('common.getStarted')}</Badge>
              <h2 className="brand-font mt-3 text-xl font-bold sm:text-2xl">{t('learner.noCourses')}</h2>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/80">{t('learner.noCoursesDesc')}{school ? ` ${t('learner.courseCatalogDesc')}` : ''}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link to={catalogHref}><Button size="sm" variant="secondary" iconRight={ArrowRight}>{t('learner.browseCourses')}</Button></Link>
                <Link to={schoolHref}><Button size="sm" variant="ghost" className="border border-white/25 text-white hover:bg-white/10">{t('publicSite.heroSecondary')}</Button></Link>
              </div>
            </div>
          </div>
          <div className="hidden shrink-0 rounded-2xl border border-white/15 bg-white/10 px-5 py-4 text-center backdrop-blur sm:block">
            <Sparkles size={22} className="mx-auto text-amber-300" />
            <p className="mt-2 max-w-40 truncate text-[11px] font-semibold text-white">{school ? school.name : t('app.name')}</p>
            <p className="text-[10px] text-white/60">{t('publicSite.heroBadge')}</p>
          </div>
        </div>
      </div>
      <div className="grid gap-3 p-5 sm:grid-cols-3 sm:p-6">
        {benefits.map(({ icon: Icon, title, description }) => (
          <div key={title} className="rounded-xl border border-line bg-surface/50 p-4">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-soft text-brand"><Icon size={17} /></span>
            <p className="mt-3 text-xs font-semibold text-ink">{title}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">{description}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}

function WelcomeHero({ state, user, courses, inProgress, learnBase }) {
  const { t, number } = useI18n()
  const school = state.schools.find((item) => item.id === user?.schoolId)
  const { catalog: catalogHref } = catalogLinks(state, user?.schoolId)
  const nextCourse = inProgress[0] || null
  const overall = inProgress.length
    ? Math.round(inProgress.reduce((sum, item) => sum + item.progress.percentage, 0) / inProgress.length)
    : courses.length ? 100 : 0
  const accent = school?.brandAccent || '#0D7A6A'
  return (
    <Card
      className="relative overflow-hidden shadow-sm"
      style={{ backgroundColor: '#0B2523', backgroundImage: `radial-gradient(circle at 88% 12%, ${accent}66, transparent 38%), radial-gradient(circle at 8% 100%, #E8A33D26, transparent 34%), linear-gradient(135deg, #0B2523, #123B38)` }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.5) 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
      <div className="relative grid gap-6 px-5 py-7 sm:px-8 sm:py-9 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-white/20 bg-white/10 text-white" dot>{t('roles.learner')}</Badge>
            {school ? <Badge className="border-white/20 bg-white/10 text-white/80"><GraduationCap size={12} />{school.name}</Badge> : null}
          </div>
          <h1 className="brand-font mt-4 text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl">{t('learner.welcome', { name: user?.name?.split(' ')[0] || user?.name || '' })}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75">{school ? `${t('common.school')}: ${school.name} · ` : ''}{t('learner.courseCatalogDesc')} {nextCourse ? `${t('learner.continueWhereLeft')}: ${nextCourse.course.title}` : t('learner.myCoursesDesc')}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {nextCourse ? <Link to={`${learnBase}/courses/${nextCourse.course.id}`}><Button size="sm" variant="secondary" iconRight={ArrowRight}>{t('learner.resumeCourse')}</Button></Link> : null}
            <Link to={catalogHref}>
              <Button size="sm" variant={nextCourse ? 'ghost' : 'secondary'} className={nextCourse ? 'border border-white/25 text-white hover:bg-white/10' : ''} icon={nextCourse ? undefined : Compass}>
                {t('learner.browseCourses')}
              </Button>
            </Link>
          </div>
        </div>
        <div className="hidden rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur lg:block">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">{t('common.progress')}</p>
          <p className="brand-font mt-2 text-4xl font-bold text-white">{overall}%</p>
          <div className="mt-3 rounded-xl bg-white/95 p-2.5"><ProgressBar value={overall} showLabel /></div>
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/15 pt-4 text-[10px] text-white/70">
            <div><p className="text-lg font-bold text-white">{number(courses.length)}</p><p className="truncate">{t('learner.statEnrolled')}</p></div>
            <div><p className="text-lg font-bold text-white">{number(inProgress.length)}</p><p className="truncate">{t('learner.inProgress')}</p></div>
          </div>
        </div>
      </div>
    </Card>
  )
}

function CourseCard({ item, learnBase }) {
  const { t, money } = useI18n()
  const status = progressStatus(t, item.progress.percentage)
  return (
    <Card className="group flex h-full flex-col overflow-hidden transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lg">
      <div className="relative flex h-28 flex-col justify-between p-4 text-white" style={{ background: item.course.cover }}>
        <div className="flex items-start justify-between gap-2">
          <Badge className="border-white/20 bg-black/20 text-white">{item.course.category || t('publicSite.coursesAll')}</Badge>
          <Badge className="border-white/20 bg-white/90 text-ink">{item.course.isFree ? t('publicSite.free') : money(item.course.priceDA)}</Badge>
        </div>
        <p className="line-clamp-2 text-sm font-bold">{item.course.title}</p>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={status.tone} dot>{status.label}</Badge>
          {enrollmentStatusBadge(t, item.enrollment?.status)}
          <span className="ms-auto text-sm font-bold text-ink">{item.progress.percentage}%</span>
        </div>
        <p className="mt-3 text-[10px] text-muted">{t('learner.lessonsCompleted', { completed: item.progress.completed, total: item.progress.total })}</p>
        <ProgressBar value={item.progress.percentage} size="sm" tone={item.progress.percentage === 100 ? 'success' : 'brand'} className="mt-1.5" />
        <div className="mt-auto pt-4">
          <Link to={`${learnBase}/courses/${item.course.id}`} className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-soft px-3 py-2 text-[11px] font-semibold text-brand-dark transition hover:bg-brand-soft/70">
            {t('learner.continueCourse')}<ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </Card>
  )
}

export function LearnerDashboard() {
  const { user, state, courses, school, learnBase } = useLearner()
  const { t, number, money } = useI18n()
  const { catalog: catalogHref } = catalogLinks(state, user?.schoolId)
  const announcements = getAnnouncementsForLearner(state, user.id)
  const events = getLearnerEvents(state, user.id).filter((event) => event.status !== 'cancelled' && new Date(event.startAt) >= new Date()).slice(0, 3)
  const payments = getLearnerPaymentRows(state, user.id).slice(0, 3)
  const attempts = state.quizAttempts.filter((attempt) => attempt.learnerId === user.id)
  const average = attempts.length ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / attempts.length) : 0
  const lessonsCompleted = courses.reduce((sum, item) => sum + item.progress.completed, 0)
  const totalLessons = courses.reduce((sum, item) => sum + item.progress.total, 0)
  const completedCourses = courses.filter((item) => item.progress.percentage === 100).length
  const inProgress = courses.filter((item) => item.progress.percentage > 0 && item.progress.percentage < 100).sort((a, b) => b.progress.percentage - a.progress.percentage)
  const available = school ? getPublishedCourses(state, school.id).filter((course) => !courses.some((item) => item.course.id === course.id)) : []

  if (!courses.length && !available.length) {
    return (
      <div className="space-y-5">
        <WelcomeHero state={state} user={user} courses={courses} inProgress={inProgress} learnBase={learnBase} />
        <ZeroCoursesPanel state={state} user={user} />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <WelcomeHero state={state} user={user} courses={courses} inProgress={inProgress} learnBase={learnBase} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('learner.statEnrolled')} value={number(courses.length)} hint={`${number(inProgress.length)} ${t('learner.inProgress')}`} icon={BookOpen} tone="brand" />
        <StatCard label={t('learner.statCompleted')} value={number(completedCourses)} hint={`${number(courses.length)} ${t('common.courses')}`} icon={CheckCircle2} tone="success" />
        <StatCard label={t('learner.statLessons')} value={number(lessonsCompleted)} hint={`${number(totalLessons)} ${t('common.lessons')}`} icon={PlayCircle} tone="blue" />
        <StatCard label={t('learner.statAverageScore')} value={`${average}%`} hint={`${number(attempts.length)} ${t('learner.quizResults')}`} icon={TrendingUp} tone="amber" />
      </div>

      <PendingCoursesPanel state={state} user={user} learnBase={learnBase} />
      <AvailableCoursesPanel state={state} user={user} courses={courses} limit={3} />
      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader title={t('learner.continueLearning')} description={t('learner.continueWhereLeft')} action={<Link to={`${learnBase}/courses`} className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline">{t('learner.viewAll')}<ArrowUpRight size={12} /></Link>} />
          {inProgress.length ? (
            <div className="space-y-3 p-5">
              {inProgress.slice(0, 3).map((item) => {
                const nextLesson = getNextLesson(state, user.id, item.course)
                return (
                  <div key={item.course.id} className="group flex flex-col gap-3 rounded-xl border border-line p-3 transition hover:border-brand/40 hover:shadow-sm sm:flex-row sm:items-center">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-white" style={{ background: item.course.cover }}><BookOpen size={19} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2"><p className="truncate text-xs font-semibold text-ink">{item.course.title}</p><Badge tone="brand">{item.progress.percentage}%</Badge></div>
                      <p className="mt-0.5 truncate text-[10px] text-muted">{nextLesson ? `${t('learner.nextLesson')}: ${nextLesson.title}` : item.course.category}</p>
                      <div className="mt-2 flex items-center gap-2"><ProgressBar value={item.progress.percentage} size="sm" className="flex-1" /><span className="whitespace-nowrap text-[10px] text-muted">{t('learner.lessonsCompleted', { completed: item.progress.completed, total: item.progress.total })}</span></div>
                    </div>
                    <Link to={`${learnBase}/courses/${item.course.id}`}><Button size="xs" variant="soft" iconRight={ArrowRight}>{t('learner.resumeCourse')}</Button></Link>
                  </div>
                )
              })}
            </div>
          ) : <EmptyState icon={PlayCircle} title={t('learner.noContinue')} description={t('learner.noContinueDesc')} compact action={<Link to={catalogHref}><Button size="sm">{t('learner.browseCourses')}</Button></Link>} />}
        </Card>

        <Card>
          <CardHeader title={t('learner.announcements')} description={t('learner.announcementsDesc')} action={<Link to={`${learnBase}/announcements`} className="text-[11px] font-semibold text-brand hover:underline">{t('learner.viewAll')}</Link>} />
          {announcements.length ? <div className="divide-y divide-line">{announcements.slice(0, 4).map((item) => <Link key={item.id} to={`${learnBase}/announcements/${item.id}`} className="block px-4 py-3 transition hover:bg-surface"><div className="flex items-center gap-2"><Megaphone size={13} className="shrink-0 text-brand" /><p className="truncate text-xs font-semibold text-ink">{item.title}</p>{!item.readBy?.includes(user.id) ? <span className="ms-auto h-1.5 w-1.5 shrink-0 rounded-full bg-brand" /> : null}</div><p className="mt-0.5 line-clamp-1 ps-5 text-[10px] text-muted">{item.content}</p></Link>)}</div> : <EmptyState icon={Megaphone} title={t('learner.noAnnouncements')} description={t('learner.noAnnouncementsDesc')} compact />}
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title={t('learner.upcomingEvents')} description={t('learner.upcomingEventsDesc')} action={<Link to={`${learnBase}/calendar`} className="text-[11px] font-semibold text-brand hover:underline">{t('learner.viewCalendar')}</Link>} />
          {events.length ? <div className="divide-y divide-line">{events.map((event) => { const course = event.courseId ? getCourse(state, event.courseId) : null; return <div key={event.id} className="flex items-center gap-3 px-4 py-3"><div className="flex w-11 shrink-0 flex-col items-center rounded-lg border border-line py-1"><span className="text-[8px] uppercase text-muted">{new Date(event.startAt).toLocaleDateString('fr-FR', { month: 'short' })}</span><span className="text-sm font-bold leading-none text-ink">{new Date(event.startAt).getDate()}</span></div><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-ink">{event.title}</p><p className="text-[10px] text-muted">{new Date(event.startAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} · {course?.title || event.type}</p></div>{event.joinUrl ? <a href={event.joinUrl} target="_blank" rel="noreferrer"><Button size="xs" variant="soft">{t('learner.joinEvent')}</Button></a> : null}</div> })}</div> : <EmptyState icon={CalendarDays} title={t('learner.noEvents')} description={t('learner.noEventsDesc')} compact />}
        </Card>

        <Card>
          <CardHeader title={t('learner.recentPayments')} description={t('learner.recentPaymentsDesc')} action={<Link to={`${learnBase}/payments`} className="text-[11px] font-semibold text-brand hover:underline">{t('learner.viewAll')}</Link>} />
          {payments.length ? <Table><thead><tr><th>{t('learner.tableCourse')}</th><th>{t('learner.tableAmount')}</th><th className="hidden sm:table-cell">{t('learner.tableMethod')}</th><th>{t('learner.tableStatus')}</th></tr></thead><tbody>{payments.map((row) => <tr key={row.payment.id}><td className="max-w-[180px] truncate text-xs text-ink">{row.course?.title}</td><td className="text-xs font-semibold text-ink">{row.payment.amount ? money(row.payment.amount) : t('publicSite.free')}</td><td className="hidden sm:table-cell"><Badge tone={row.payment.method === 'manual' ? 'amber' : 'blue'}>{t(paymentMethodLabelKey(displayPaymentMethod(row.payment)))}</Badge></td><td><StatusPill status={row.payment.status} t={t} /></td></tr>)}</tbody></Table> : <EmptyState icon={Receipt} title={t('learner.noPayments')} description={t('learner.noPaymentsDesc')} compact />}
        </Card>
      </div>

    </div>
  )
}

export function LearnerCourses() {
  const { user, state, courses, school, learnBase } = useLearner()
  const { t } = useI18n()
  const available = school ? getPublishedCourses(state, school.id).filter((course) => !courses.some((item) => item.course.id === course.id)) : []
  const [tab, setTab] = useState(courses.length ? 'mine' : 'school')
  const [query, setQuery] = useState('')
  const { catalog: catalogHref } = catalogLinks(state, user?.schoolId)
  const isSchoolTab = tab === 'school'
  const matchesQuery = (title) => !query.trim() || title.toLowerCase().includes(query.trim().toLowerCase())
  const rows = isSchoolTab
    ? available.filter((course) => matchesQuery(course.title))
    : courses.filter((item) => {
        if (tab === 'progress' && !(item.progress.percentage > 0 && item.progress.percentage < 100)) return false
        if (tab === 'completed' && item.progress.percentage !== 100) return false
        if (tab === 'notStarted' && item.progress.percentage !== 0) return false
        return matchesQuery(item.course.title)
      })
  const tabs = [
    { value: 'mine', label: t('learner.myCoursesTab'), count: courses.length },
    { value: 'progress', label: t('learner.inProgress'), count: courses.filter((item) => item.progress.percentage > 0 && item.progress.percentage < 100).length },
    { value: 'completed', label: t('learner.completed'), count: courses.filter((item) => item.progress.percentage === 100).length },
    { value: 'notStarted', label: t('learner.notStarted'), count: courses.filter((item) => item.progress.percentage === 0).length },
    { value: 'school', label: t('learner.browseSchoolCourses'), count: available.length },
  ]
  function clearFilters() {
    setTab(courses.length ? 'mine' : 'school')
    setQuery('')
  }
  return (
    <div className="space-y-5">
      <PageHeader eyebrow={t('nav.learner')} title={t('learner.myCourses')} description={t('learner.myCoursesDesc')} actions={<Link to={catalogHref}><Button variant="secondary" icon={Compass}>{t('learner.browseSchoolCourses')}</Button></Link>} />
      <PendingCoursesPanel state={state} user={user} learnBase={learnBase} />
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line bg-surface/40 p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between">
          <Tabs items={tabs} value={tab} onChange={setTab} variant="pill" className="border-0" />
          <div className="flex items-center gap-2">
            <span className="hidden shrink-0 sm:block"><Badge tone="neutral">{rows.length} {t('common.results')}</Badge></span>
            <SearchField value={query} onChange={setQuery} placeholder={t('learner.search')} className="w-full sm:w-64" />
          </div>
        </div>
        {rows.length ? (
          isSchoolTab
            ? <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">{rows.map((course) => <SchoolCourseCard key={course.id} course={course} state={state} />)}</div>
            : <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">{rows.map((item) => <CourseCard key={item.course.id} item={item} learnBase={learnBase} />)}</div>
        ) : (
          <EmptyState icon={isSchoolTab ? Compass : Search} title={isSchoolTab ? t('learner.noAvailableCourses') : t('common.noResults')} description={isSchoolTab ? t('learner.availableCoursesDesc') : t('common.noResultsDescription')} action={<Button variant="secondary" onClick={clearFilters}>{t('common.clearFilters')}</Button>} />
        )}
      </Card>
    </div>
  )
}

export function LearnerAnnouncements() {
  const { announcementId, id } = useParams()
  const { user, state, slug, learnBase } = useLearner()
  const { t, dateTime, date } = useI18n()
  const navigate = useNavigate()
  const [tab, setTab] = useState('all')
  const announcements = getAnnouncementsForLearner(state, user.id)
  const unread = getUnreadAnnouncements(state, user.id)
  const activeId = announcementId || id
  const current = activeId ? announcements.find((item) => item.id === activeId) : null
  const announcementsBase = slug ? `/s/${slug}/announcements` : `${learnBase}/announcements`
  const isUnread = (item) => !(item.readBy || []).includes(user.id)
  const rows = tab === 'unread' ? announcements.filter(isUnread) : announcements

  useEffect(() => { if (current) markAnnouncementRead(current.id, user.id) }, [current, user.id])

  if (activeId) {
    if (!current) return <EmptyState icon={Megaphone} title={t('learner.noAnnouncements')} description={t('learner.noAnnouncementsDesc')} action={<Button onClick={() => navigate(announcementsBase)}>{t('learner.backToAnnouncements')}</Button>} />
    const course = current.courseId ? getCourse(state, current.courseId) : null
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(announcementsBase)}>← {t('learner.backToAnnouncements')}</Button>
        <Card><div className="p-6"><div className="flex flex-wrap items-center gap-2"><Badge tone="brand">{course?.title || t('publicSite.allCourses')}</Badge><span className="text-[11px] text-muted">{t('learner.publishedOn')} {date(current.publishedAt || current.createdAt)}</span></div><h1 className="mt-3 text-xl font-bold text-ink">{current.title}</h1><p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted">{current.content}</p></div></Card>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader eyebrow={t('nav.learner')} title={t('learner.announcements')} description={t('learner.announcementsDesc')} actions={<Badge tone={unread.length ? 'brand' : 'neutral'} dot>{unread.length ? `${unread.length} ${t('learner.unreadOnly')}` : t('common.allRead') || 'Tout lu'}</Badge>} />
      <Card className="overflow-hidden">
        <div className="border-b border-line bg-surface/40 p-3 sm:p-4">
          <Tabs
            items={[
              { value: 'all', label: t('common.all'), count: announcements.length },
              { value: 'unread', label: t('learner.unreadOnly'), count: unread.length },
            ]}
            value={tab}
            onChange={setTab}
            variant="pill"
            className="border-0"
          />
        </div>
        {rows.length ? (
          <div className="space-y-3 p-3 sm:p-4">{rows.map((item) => { const course = item.courseId ? getCourse(state, item.courseId) : null; const unreadItem = isUnread(item); return <Link key={item.id} to={`${announcementsBase}/${item.id}`}><Card className={cn('transition hover:border-brand', unreadItem && 'border-brand/30')}><div className="flex items-start gap-3 p-4"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand"><Megaphone size={17} /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold text-ink">{item.title}</p>{unreadItem ? <Badge tone="brand">{t('learner.unreadOnly')}</Badge> : null}{course ? <Badge tone="blue">{course.title}</Badge> : null}</div><p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">{item.content}</p><p className="mt-1.5 text-[10px] text-muted">{dateTime(item.publishedAt || item.createdAt)}</p></div><ArrowRight size={15} className="mt-1 shrink-0 text-muted" /></div></Card></Link> })}</div>
        ) : <EmptyState icon={Megaphone} title={t('learner.noAnnouncements')} description={t('learner.noAnnouncementsDesc')} />}
      </Card>
    </div>
  )
}

export function LearnerQuizResults() {
  const { user, state } = useLearner()
  const { t, date, number } = useI18n()
  const [query, setQuery] = useState('')
  const attempts = state.quizAttempts
    .filter((attempt) => attempt.learnerId === user.id)
    .filter((attempt) => {
      const quiz = getQuiz(state, attempt.quizId)
      return !query.trim() || quiz?.title.toLowerCase().includes(query.trim().toLowerCase())
    })
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
  const passed = attempts.filter((attempt) => attempt.passed).length

  return (
    <div className="space-y-5">
      <PageHeader eyebrow={t('nav.learner')} title={t('learner.quizResults')} />
      <div className="grid gap-3 sm:grid-cols-3"><StatCard label={t('learner.quizResults')} value={number(attempts.length)} icon={FileQuestion} tone="brand" /><StatCard label={t('learner.quizPassed')} value={number(passed)} icon={CheckCircle2} tone="success" /><StatCard label={t('learner.averageScore')} value={`${attempts.length ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / attempts.length) : 0}%`} icon={Star} tone="amber" /></div>
      <Card>
        <div className="border-b border-line p-3"><SearchField value={query} onChange={setQuery} placeholder={t('common.search')} className="w-full sm:w-72" /></div>
        {attempts.length ? <Table><thead><tr><th>{t('learner.quizTitle')}</th><th>{t('learner.tableCourse')}</th><th>{t('learner.averageScore')}</th><th>{t('learner.tableStatus')}</th><th>{t('learner.tableDate')}</th></tr></thead><tbody>{attempts.map((attempt) => { const quiz = getQuiz(state, attempt.quizId); const course = getCourse(state, attempt.courseId); return <tr key={attempt.id}><td className="text-xs font-medium text-ink">{quiz?.title || '—'}</td><td className="max-w-[180px] truncate text-xs text-muted">{course?.title}</td><td className="text-xs font-semibold text-ink">{attempt.percentage}%</td><td><Badge tone={attempt.passed ? 'success' : 'danger'}>{attempt.passed ? t('learner.quizPassed') : t('learner.quizFailed')}</Badge></td><td className="text-[11px] text-muted">{date(attempt.completedAt)}</td></tr> })}</tbody></Table> : <EmptyState icon={FileQuestion} title={t('learner.noQuizResults')} description={t('learner.noQuizResultsDesc')} />}
      </Card>
    </div>
  )
}

export function LearnerCalendar() {
  const { user, state } = useLearner()
  const { t, number } = useI18n()
  const allEvents = getLearnerEvents(state, user.id)
  const upcoming = allEvents.filter((event) => event.status !== 'cancelled' && new Date(event.startAt) >= new Date())
  const past = allEvents.filter((event) => event.status !== 'cancelled' && new Date(event.startAt) < new Date()).reverse()
  const cancelled = allEvents.filter((event) => event.status === 'cancelled')
  return (
    <div className="space-y-5">
      <PageHeader eyebrow={t('nav.learner')} title={t('learner.upcomingEvents')} description={t('learner.upcomingEventsDesc')} />
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label={t('trainerCalendar.upcoming')} value={number(upcoming.length)} icon={CalendarDays} tone="brand" />
        <StatCard label={t('trainerCalendar.past')} value={number(past.length)} icon={Clock} tone="blue" />
        <StatCard label={t('learner.cancelledEvents')} value={number(cancelled.length)} icon={CalendarDays} tone="danger" />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <Card><CardHeader title={t('trainerCalendar.upcoming')} action={<Badge tone="brand">{upcoming.length}</Badge>} />{upcoming.length ? <EventList events={upcoming} state={state} /> : <EmptyState icon={CalendarDays} title={t('learner.noEvents')} description={t('learner.noEventsDesc')} compact />}</Card>
        <Card><CardHeader title={t('trainerCalendar.past')} action={<Badge tone="blue">{past.length}</Badge>} />{past.length ? <EventList events={past} state={state} past /> : <EmptyState icon={CalendarDays} title={t('learner.noEvents')} compact />}</Card>
        <Card><CardHeader title={t('learner.cancelledEvents')} action={<Badge tone="danger">{cancelled.length}</Badge>} />{cancelled.length ? <EventList events={cancelled} state={state} cancelled /> : <EmptyState icon={CalendarDays} title={t('learner.noEvents')} compact />}</Card>
      </div>
    </div>
  )
}

function eventTypeLabel(t, type) {
  if (type === 'live') return t('trainerCalendar.typeLive')
  if (type === 'deadline') return t('trainerCalendar.typeDeadline')
  if (type === 'workshop') return t('trainerCalendar.typeWorkshop')
  return t('trainerCalendar.typeOther')
}

function eventTypeTone(type) {
  if (type === 'live') return 'brand'
  if (type === 'deadline') return 'danger'
  if (type === 'workshop') return 'purple'
  return 'neutral'
}

function EventList({ events, state, past = false, cancelled = false }) {
  const { t } = useI18n()
  return <div className="divide-y divide-line">{events.map((event) => { const course = event.courseId ? getCourse(state, event.courseId) : null; const canJoin = !past && !cancelled && Boolean(event.joinUrl); return <div key={event.id} className="flex items-center gap-3 px-4 py-3"><div className={cn('flex w-11 shrink-0 flex-col items-center rounded-lg border py-1', cancelled ? 'border-danger/20 bg-danger-soft' : past ? 'border-line bg-surface' : 'border-brand/20 bg-brand-soft')}><span className="text-[8px] uppercase text-muted">{new Date(event.startAt).toLocaleDateString('fr-FR', { month: 'short' })}</span><span className={cn('text-sm font-bold leading-none', cancelled ? 'text-danger line-through' : 'text-ink')}>{new Date(event.startAt).getDate()}</span></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-1.5"><p className={cn('truncate text-xs font-semibold text-ink', cancelled && 'line-through')}>{event.title}</p><Badge tone={eventTypeTone(event.type)}>{eventTypeLabel(t, event.type)}</Badge></div><p className="truncate text-[10px] text-muted">{new Date(event.startAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} · {course?.title || t('publicSite.allCourses')}</p>{event.description ? <p className="mt-1 line-clamp-1 text-[10px] text-muted">{event.description}</p> : null}</div>{canJoin ? <a href={event.joinUrl} target="_blank" rel="noreferrer"><Button size="xs" variant="soft" icon={PlayCircle}>{t('learner.joinEvent')}</Button></a> : null}</div> })}</div>
}

export function LearnerPayments() {
  const { user, state } = useLearner()
  const { t, money, date } = useI18n()
  const [receipt, setReceipt] = useState(null)
  const [filter, setFilter] = useState('all')
  const allRows = getLearnerPaymentRows(state, user.id)
  const summary = getLearnerPaymentsSummary(state, user.id)
  const totalPaid = allRows.filter((row) => row.payment.status === 'validated').reduce((sum, row) => sum + row.payment.amount, 0)
  const rows = filter === 'all' ? allRows : allRows.filter((row) => row.payment.status === filter)
  const tabs = [
    { value: 'all', label: t('common.all'), count: summary.total },
    { value: 'validated', label: t('payments.paid'), count: summary.validated },
    { value: 'pending', label: t('checkout.statusPending'), count: summary.pending },
    { value: 'refunded', label: t('payments.refunded'), count: summary.refunded },
  ]
  return (
    <div className="space-y-5">
      <PageHeader eyebrow={t('nav.learner')} title={t('learner.myPayments')} description={t('learner.myPaymentsDesc')} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('common.total')} value={money(totalPaid)} hint={t('learner.myPaymentsDesc')} icon={CreditCard} tone="brand" />
        <StatCard label={t('payments.paid')} value={summary.validated} hint={t('checkout.statusPaid')} icon={CheckCircle2} tone="success" />
        <StatCard label={t('checkout.statusPending')} value={summary.pending} hint={t('checkout.validationDelay')} icon={Clock} tone="amber" />
        <StatCard label={t('payments.refunded')} value={summary.refunded} hint={t('learner.myPayments')} icon={Receipt} tone="blue" />
      </div>
      <Card className="overflow-hidden">
        <div className="border-b border-line bg-surface/40 p-3 sm:p-4">
          <Tabs items={tabs} value={filter} onChange={setFilter} variant="pill" className="border-0" />
        </div>
        {rows.length ? <Table><thead><tr><th>{t('learner.tableCourse')}</th><th>{t('learner.tableAmount')}</th><th className="hidden sm:table-cell">{t('learner.tableMethod')}</th><th className="hidden md:table-cell">{t('learner.tableDate')}</th><th>{t('learner.tableStatus')}</th><th className="text-end">{t('learner.tableAction')}</th></tr></thead><tbody>{rows.map((row) => <tr key={row.payment.id}><td className="max-w-[240px] truncate text-xs font-medium text-ink">{row.course?.title}</td><td className="text-xs font-semibold text-ink">{row.payment.amount ? money(row.payment.amount) : t('publicSite.free')}</td><td className="hidden sm:table-cell"><Badge tone={row.payment.method === 'manual' ? 'amber' : 'blue'}>{t(paymentMethodLabelKey(displayPaymentMethod(row.payment)))}</Badge></td><td className="hidden md:table-cell text-[11px] text-muted">{date(row.payment.submittedAt)}</td><td><StatusPill status={row.payment.status} t={t} /></td><td><div className="flex justify-end"><Button variant="ghost" size="xs" icon={Receipt} onClick={() => setReceipt(row)}>{row.payment.reference || '—'}</Button></div></td></tr>)}</tbody></Table> : <EmptyState icon={Receipt} title={t('learner.noPaymentHistory')} description={t('learner.noPaymentHistoryDesc')} />}
      </Card>
      <Modal open={Boolean(receipt)} onClose={() => setReceipt(null)} title={t('payments.receipt')} description={receipt?.course?.title} size="md" footer={<Button variant="secondary" onClick={() => setReceipt(null)}>{t('common.close')}</Button>}>
        {receipt ? (
          <div className="grid gap-3 rounded-xl border border-line p-4 text-xs sm:grid-cols-2">
            <div><p className="text-[10px] text-muted">{t('subscription.method')}</p><p className="mt-0.5 break-words font-medium text-ink">{t(paymentMethodLabelKey(displayPaymentMethod(receipt.payment)))}</p></div>
            <div><p className="text-[10px] text-muted">{t('common.amount')}</p><p className="mt-0.5 font-medium text-ink">{receipt.payment.amount ? money(receipt.payment.amount) : t('publicSite.free')}</p></div>
            <div><p className="text-[10px] text-muted">{t('payments.reference')}</p><p className="mt-0.5 break-words font-medium text-ink" dir="ltr">{receipt.payment.reference || '—'}</p></div>
            <div><p className="text-[10px] text-muted">{t('subscription.date')}</p><p className="mt-0.5 font-medium text-ink">{date(receipt.payment.submittedAt)}</p></div>
            <div><p className="text-[10px] text-muted">{t('payments.receipt')}</p><p className="mt-0.5 break-words font-medium text-ink">{receipt.payment.proofName || '—'}</p></div>
            <div><p className="text-[10px] text-muted">{t('learner.tableStatus')}</p><div className="mt-0.5"><StatusPill status={receipt.payment.status} t={t} /></div></div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}

export function LearnerProfile() {
  const { user, courses } = useLearner()
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
      <PageHeader eyebrow={t('nav.learner')} title={t('learner.profile')} description={t('learner.profileDesc')} />
      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card><CardHeader title={t('learner.profile')} /><div className="grid gap-4 p-5 sm:grid-cols-2"><div className="sm:col-span-2 flex items-center gap-3"><Avatar name={user.name} size="lg" /><div><p className="text-sm font-semibold text-ink">{user.name}</p><p className="text-xs text-muted">{user.email}</p><p className="mt-1 text-[10px] text-muted">{t('learner.enrolledOn')} {new Date(user.createdAt).toLocaleDateString('fr-FR')} · {courses.length} {t('nav.courses').toLowerCase()}</p></div></div><div className="sm:col-span-2"><Label>{t('learner.fullName')}</Label><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div><div className="sm:col-span-2"><Label hint={t('learner.emailNotEditable')}>{t('learner.email')}</Label><Input value={user.email} disabled /></div><div><Label>{t('learner.phone')}</Label><Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></div><div><Label>{t('learner.language')}</Label><Select value={form.language} onChange={(event) => setForm({ ...form, language: event.target.value })}><option value="fr">Français</option><option value="ar">العربية</option></Select></div><div className="sm:col-span-2"><Button onClick={saveProfile}>{t('learner.saveProfile')}</Button></div></div></Card>
        <Card><CardHeader title={t('learner.changePassword')} /><div className="space-y-3 p-5"><div><Label>{t('learner.currentPassword')}</Label><Input type="password" value={passwords.current} onChange={(event) => setPasswords({ ...passwords, current: event.target.value })} /></div><div><Label>{t('learner.newPassword')}</Label><Input type="password" value={passwords.next} onChange={(event) => setPasswords({ ...passwords, next: event.target.value })} /></div><div><Label>{t('learner.confirmPassword')}</Label><Input type="password" value={passwords.confirm} onChange={(event) => setPasswords({ ...passwords, confirm: event.target.value })} /></div><Button onClick={savePassword}>{t('learner.updatePassword')}</Button></div></Card>
      </div>
    </div>
  )
}
