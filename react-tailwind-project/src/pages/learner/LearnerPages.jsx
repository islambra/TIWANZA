import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  FileQuestion,
  GraduationCap,
  Megaphone,
  MessageSquare,
  PlayCircle,
  Receipt,
  Search,
  Star,
  TrendingUp,
  UserRound,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useI18n } from '../../i18n/I18nContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { useTiwanzaStore } from '../../data/store.js'
import {
  getAnnouncementsForLearner,
  getBestAttempt,
  getCourse,
  getCourseLessons,
  getCourseProgress,
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
  PageHeader,
  ProgressBar,
  SearchField,
  Select,
  StatCard,
  Table,
  Tabs,
  Textarea,
} from '../../components/ui.jsx'
import { StatusPill } from '../admin/AdminDashboard.jsx'
import { cn } from '../../lib/utils.js'

function useLearner() {
  const { user } = useAuth()
  const state = useTiwanzaStore()
  const courses = getLearnerCourses(state, user.id)
  const schools = getLearnerSchoolIds(state, user.id).map((id) => getSchool(state, id)).filter(Boolean)
  return { user, state, courses, schools }
}

function CourseCard({ item }) {
  const { t, money } = useI18n()
  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="relative h-28 p-4 text-white" style={{ background: item.course.cover }}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-80">{item.course.coverLabel || item.course.category}</p>
        <p className="mt-1 line-clamp-2 text-sm font-bold">{item.course.title}</p>
        <span className="absolute bottom-2 end-3 text-[10px] opacity-90">{item.course.isFree ? t('publicSite.free') : money(item.course.priceDA)}</span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between text-[10px] text-muted"><span>{t('learner.lessonsCompleted', { completed: item.progress.completed, total: item.progress.total })}</span><span>{item.progress.percentage}%</span></div>
        <ProgressBar value={item.progress.percentage} size="sm" className="mt-1.5" />
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <Badge tone={item.progress.percentage === 100 ? 'success' : item.progress.percentage > 0 ? 'brand' : 'neutral'}>{item.progress.percentage === 100 ? t('learner.completed') : item.progress.percentage > 0 ? t('learner.inProgress') : t('learner.notStarted')}</Badge>
          <Link to={`/learn/courses/${item.course.id}`} className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline">{t('learner.continueCourse')}<ArrowRight size={12} /></Link>
        </div>
      </div>
    </Card>
  )
}

export function LearnerDashboard() {
  const { user, state, courses, schools } = useLearner()
  const { t, number, money, date } = useI18n()
  const announcements = getAnnouncementsForLearner(state, user.id)
  const events = getLearnerEvents(state, user.id).filter((event) => event.status !== 'cancelled' && new Date(event.startAt) >= new Date()).slice(0, 3)
  const payments = getLearnerPaymentRows(state, user.id).slice(0, 3)
  const attempts = state.quizAttempts.filter((attempt) => attempt.learnerId === user.id)
  const average = attempts.length ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / attempts.length) : 0
  const lessonsCompleted = courses.reduce((sum, item) => sum + item.progress.completed, 0)
  const completedCourses = courses.filter((item) => item.progress.percentage === 100).length
  const inProgress = courses.filter((item) => item.progress.percentage > 0 && item.progress.percentage < 100).sort((a, b) => b.progress.percentage - a.progress.percentage)
  const recommendations = schools.length ? getPublishedCourses(state, schools[0].id).filter((course) => !courses.some((item) => item.course.id === course.id)).slice(0, 3) : []

  return (
    <div className="space-y-5">
      <PageHeader eyebrow={t('nav.learner')} title={t('learner.dashboardTitle')} description={t('learner.welcome', { name: user.name })} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('learner.statEnrolled')} value={number(courses.length)} icon={BookOpen} tone="brand" />
        <StatCard label={t('learner.statCompleted')} value={number(completedCourses)} icon={CheckCircle2} tone="success" />
        <StatCard label={t('learner.statLessons')} value={number(lessonsCompleted)} icon={PlayCircle} tone="blue" />
        <StatCard label={t('learner.statAverageScore')} value={`${average}%`} icon={TrendingUp} tone="amber" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader title={t('learner.continueLearning')} description={t('learner.continueWhereLeft')} action={<Link to="/learn/courses" className="text-[11px] font-semibold text-brand hover:underline">{t('learner.viewAll')}</Link>} />
          {inProgress.length ? (
            <div className="space-y-3 p-5">
              {inProgress.slice(0, 3).map((item) => (
                <div key={item.course.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-white" style={{ background: item.course.cover }}><BookOpen size={17} /></span>
                  <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-ink">{item.course.title}</p><div className="mt-1 flex items-center gap-2"><ProgressBar value={item.progress.percentage} size="sm" className="flex-1" /><span className="text-[10px] text-muted">{item.progress.percentage}%</span></div></div>
                  <Button size="xs" variant="soft" iconRight={ArrowRight} onClick={() => { window.location.href = `/learn/courses/${item.course.id}` }}>{t('learner.resumeCourse')}</Button>
                </div>
              ))}
            </div>
          ) : <EmptyState icon={BookOpen} title={t('learner.noContinue')} description={t('learner.noContinueDesc')} compact action={<Link to="/learn/courses"><Button size="sm">{t('learner.browseCourses')}</Button></Link>} />}
        </Card>

        <Card>
          <CardHeader title={t('learner.announcements')} description={t('learner.announcementsDesc')} action={<Link to="/learn/announcements" className="text-[11px] font-semibold text-brand hover:underline">{t('learner.viewAll')}</Link>} />
          {announcements.length ? <div className="divide-y divide-line">{announcements.slice(0, 4).map((item) => <Link key={item.id} to={`/learn/announcements/${item.id}`} className="block px-4 py-3 transition hover:bg-surface"><div className="flex items-center gap-2"><Megaphone size={13} className="shrink-0 text-brand" /><p className="truncate text-xs font-semibold text-ink">{item.title}</p>{!item.readBy?.includes(user.id) ? <span className="ms-auto h-1.5 w-1.5 shrink-0 rounded-full bg-brand" /> : null}</div><p className="mt-0.5 line-clamp-1 ps-5 text-[10px] text-muted">{item.content}</p></Link>)}</div> : <EmptyState icon={Megaphone} title={t('learner.noAnnouncements')} description={t('learner.noAnnouncementsDesc')} compact />}
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title={t('learner.upcomingEvents')} description={t('learner.upcomingEventsDesc')} action={<Link to="/learn/calendar" className="text-[11px] font-semibold text-brand hover:underline">{t('learner.viewCalendar')}</Link>} />
          {events.length ? <div className="divide-y divide-line">{events.map((event) => { const course = event.courseId ? getCourse(state, event.courseId) : null; return <div key={event.id} className="flex items-center gap-3 px-4 py-3"><div className="flex w-11 shrink-0 flex-col items-center rounded-lg border border-line py-1"><span className="text-[8px] uppercase text-muted">{new Date(event.startAt).toLocaleDateString('fr-FR', { month: 'short' })}</span><span className="text-sm font-bold leading-none text-ink">{new Date(event.startAt).getDate()}</span></div><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-ink">{event.title}</p><p className="text-[10px] text-muted">{new Date(event.startAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} · {course?.title || event.type}</p></div>{event.joinUrl ? <a href={event.joinUrl} target="_blank" rel="noreferrer"><Button size="xs" variant="soft">{t('learner.joinEvent')}</Button></a> : null}</div> })}</div> : <EmptyState icon={CalendarDays} title={t('learner.noEvents')} description={t('learner.noEventsDesc')} compact />}
        </Card>

        <Card>
          <CardHeader title={t('learner.recentPayments')} description={t('learner.recentPaymentsDesc')} action={<Link to="/learn/payments" className="text-[11px] font-semibold text-brand hover:underline">{t('learner.viewAll')}</Link>} />
          {payments.length ? <Table><thead><tr><th>{t('learner.tableCourse')}</th><th>{t('learner.tableAmount')}</th><th>{t('learner.tableStatus')}</th></tr></thead><tbody>{payments.map((row) => <tr key={row.payment.id}><td className="max-w-[180px] truncate text-xs text-ink">{row.course?.title}</td><td className="text-xs font-semibold text-ink">{row.payment.amount ? money(row.payment.amount) : t('publicSite.free')}</td><td><StatusPill status={row.payment.status} t={t} /></td></tr>)}</tbody></Table> : <EmptyState icon={Receipt} title={t('learner.noPayments')} description={t('learner.noPaymentsDesc')} compact />}
        </Card>
      </div>

      {recommendations.length ? <Card><CardHeader title={t('learner.recommendations')} description={t('learner.courseCatalogDesc')} /><div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">{recommendations.map((course) => <Link key={course.id} to={`/s/${getSchool(state, course.schoolId)?.slug}/courses/${course.id}`} className="rounded-xl border border-line p-3 transition hover:border-brand"><div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-lg text-white" style={{ background: course.cover }}><BookOpen size={15} /></span><div className="min-w-0"><p className="truncate text-xs font-semibold text-ink">{course.title}</p><p className="text-[10px] text-muted">{course.category}</p></div></div></Link>)}</div></Card> : null}
    </div>
  )
}

export function LearnerCourses() {
  const { courses } = useLearner()
  const { t } = useI18n()
  const [tab, setTab] = useState('all')
  const [query, setQuery] = useState('')
  const rows = courses.filter((item) => {
    if (tab === 'progress' && !(item.progress.percentage > 0 && item.progress.percentage < 100)) return false
    if (tab === 'completed' && item.progress.percentage !== 100) return false
    if (tab === 'notStarted' && item.progress.percentage !== 0) return false
    return !query.trim() || item.course.title.toLowerCase().includes(query.trim().toLowerCase())
  })
  const tabs = [
    { value: 'all', label: t('learner.allCourses'), count: courses.length },
    { value: 'progress', label: t('learner.inProgress'), count: courses.filter((item) => item.progress.percentage > 0 && item.progress.percentage < 100).length },
    { value: 'completed', label: t('learner.completed'), count: courses.filter((item) => item.progress.percentage === 100).length },
    { value: 'notStarted', label: t('learner.notStarted'), count: courses.filter((item) => item.progress.percentage === 0).length },
  ]
  return (
    <div className="space-y-5">
      <PageHeader eyebrow={t('nav.learner')} title={t('learner.myCourses')} description={t('learner.myCoursesDesc')} />
      <Card>
        <div className="flex flex-col gap-2 border-b border-line p-3 sm:flex-row sm:items-center sm:justify-between"><Tabs items={tabs} value={tab} onChange={setTab} variant="pill" className="border-0" /><SearchField value={query} onChange={setQuery} placeholder={t('learner.search')} className="w-full sm:w-64" /></div>
        {rows.length ? <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">{rows.map((item) => <CourseCard key={item.course.id} item={item} />)}</div> : <EmptyState icon={BookOpen} title={t('learner.noCourses')} description={t('learner.noCoursesDesc')} action={<Link to="/learn"><Button>{t('learner.browseCourses')}</Button></Link>} />}
      </Card>
    </div>
  )
}

export function LearnerAnnouncements() {
  const { id } = useParams()
  const { user, state } = useLearner()
  const { t, dateTime, date } = useI18n()
  const navigate = useNavigate()
  const announcements = getAnnouncementsForLearner(state, user.id)
  const unread = getUnreadAnnouncements(state, user.id)
  const current = id ? announcements.find((item) => item.id === id) : null

  useEffect(() => { if (current) markAnnouncementRead(current.id, user.id) }, [current, user.id])

  if (id) {
    if (!current) return <EmptyState icon={Megaphone} title={t('learner.noAnnouncements')} description={t('learner.noAnnouncementsDesc')} action={<Button onClick={() => navigate('/learn/announcements')}>{t('learner.backToAnnouncements')}</Button>} />
    const course = current.courseId ? getCourse(state, current.courseId) : null
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/learn/announcements')}>← {t('learner.backToAnnouncements')}</Button>
        <Card><div className="p-6"><div className="flex flex-wrap items-center gap-2"><Badge tone="brand">{course?.title || t('publicSite.allCourses')}</Badge><span className="text-[11px] text-muted">{t('learner.publishedOn')} {date(current.publishedAt || current.createdAt)}</span></div><h1 className="mt-3 text-xl font-bold text-ink">{current.title}</h1><p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted">{current.content}</p></div></Card>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader eyebrow={t('nav.learner')} title={t('learner.announcements')} description={t('learner.announcementsDesc')} actions={<Badge tone={unread.length ? 'brand' : 'neutral'} dot>{unread.length ? `${unread.length}` : t('common.allRead') || 'Tout lu'}</Badge>} />
      {announcements.length ? <div className="space-y-3">{announcements.map((item) => { const course = item.courseId ? getCourse(state, item.courseId) : null; const isUnread = !item.readBy?.includes(user.id); return <Link key={item.id} to={`/learn/announcements/${item.id}`}><Card className={cn('transition hover:border-brand', isUnread && 'border-brand/30')}><div className="flex items-start gap-3 p-4"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand"><Megaphone size={17} /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold text-ink">{item.title}</p>{isUnread ? <span className="h-1.5 w-1.5 rounded-full bg-brand" /> : null}{course ? <Badge tone="blue">{course.title}</Badge> : null}</div><p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">{item.content}</p><p className="mt-1.5 text-[10px] text-muted">{dateTime(item.publishedAt || item.createdAt)}</p></div><ArrowRight size={15} className="mt-1 shrink-0 text-muted" /></div></Card></Link> })}</div> : <EmptyState icon={Megaphone} title={t('learner.noAnnouncements')} description={t('learner.noAnnouncementsDesc')} />}
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
  const { t } = useI18n()
  const events = getLearnerEvents(state, user.id).filter((event) => event.status !== 'cancelled')
  const upcoming = events.filter((event) => new Date(event.startAt) >= new Date())
  const past = events.filter((event) => new Date(event.startAt) < new Date()).reverse()
  return (
    <div className="space-y-5">
      <PageHeader eyebrow={t('nav.learner')} title={t('learner.upcomingEvents')} description={t('learner.upcomingEventsDesc')} />
      <div className="grid gap-4 xl:grid-cols-2">
        <Card><CardHeader title={t('trainerCalendar.upcoming')} action={<Badge tone="brand">{upcoming.length}</Badge>} />{upcoming.length ? <EventList events={upcoming} state={state} /> : <EmptyState icon={CalendarDays} title={t('learner.noEvents')} description={t('learner.noEventsDesc')} compact />}</Card>
        <Card><CardHeader title={t('trainerCalendar.past')} action={<Badge tone="neutral">{past.length}</Badge>} />{past.length ? <EventList events={past} state={state} past /> : <EmptyState icon={CalendarDays} title={t('learner.noEvents')} compact />}</Card>
      </div>
    </div>
  )
}

function EventList({ events, state, past = false }) {
  const { t } = useI18n()
  return <div className="divide-y divide-line">{events.map((event) => { const course = event.courseId ? getCourse(state, event.courseId) : null; return <div key={event.id} className="flex items-center gap-3 px-4 py-3"><div className={cn('flex w-11 shrink-0 flex-col items-center rounded-lg border py-1', past ? 'border-line bg-surface' : 'border-brand/20 bg-brand-soft')}><span className="text-[8px] uppercase text-muted">{new Date(event.startAt).toLocaleDateString('fr-FR', { month: 'short' })}</span><span className="text-sm font-bold leading-none text-ink">{new Date(event.startAt).getDate()}</span></div><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-ink">{event.title}</p><p className="text-[10px] text-muted">{new Date(event.startAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} · {course?.title || event.type}</p></div>{!past && event.joinUrl ? <a href={event.joinUrl} target="_blank" rel="noreferrer"><Button size="xs" variant="soft" icon={PlayCircle}>{t('learner.joinEvent')}</Button></a> : <Badge tone="neutral">{event.type}</Badge>}</div> })}</div>
}

export function LearnerPayments() {
  const { user, state } = useLearner()
  const { t, money, date } = useI18n()
  const rows = getLearnerPaymentRows(state, user.id)
  const totalPaid = rows.filter((row) => row.payment.status === 'validated').reduce((sum, row) => sum + row.payment.amount, 0)
  return (
    <div className="space-y-5">
      <PageHeader eyebrow={t('nav.learner')} title={t('learner.myPayments')} description={t('learner.myPaymentsDesc')} />
      <div className="grid gap-3 sm:grid-cols-3"><StatCard label={t('common.total')} value={money(totalPaid)} icon={CreditCard} tone="brand" /><StatCard label={t('checkout.statusPaid')} value={rows.filter((row) => row.payment.status === 'validated').length} icon={CheckCircle2} tone="success" /><StatCard label={t('checkout.statusPending')} value={rows.filter((row) => row.payment.status === 'pending').length} icon={Clock} tone="amber" /></div>
      <Card>{rows.length ? <Table><thead><tr><th>{t('learner.tableCourse')}</th><th>{t('learner.tableAmount')}</th><th className="hidden sm:table-cell">{t('learner.tableMethod')}</th><th className="hidden md:table-cell">{t('learner.tableDate')}</th><th>{t('learner.tableStatus')}</th><th className="text-end">{t('learner.tableAction')}</th></tr></thead><tbody>{rows.map((row) => <tr key={row.payment.id}><td className="max-w-[240px] truncate text-xs font-medium text-ink">{row.course?.title}</td><td className="text-xs font-semibold text-ink">{row.payment.amount ? money(row.payment.amount) : t('publicSite.free')}</td><td className="hidden sm:table-cell"><Badge tone={row.payment.method === 'manual' ? 'amber' : 'blue'}>{row.payment.method === 'manual' ? t('payments.manual') : t('payments.online')}</Badge></td><td className="hidden md:table-cell text-[11px] text-muted">{date(row.payment.submittedAt)}</td><td><StatusPill status={row.payment.status} t={t} /></td><td><div className="flex justify-end"><Badge tone="neutral">{row.payment.reference || '—'}</Badge></div></td></tr>)}</tbody></Table> : <EmptyState icon={Receipt} title={t('learner.noPaymentHistory')} description={t('learner.noPaymentHistoryDesc')} />}</Card>
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
