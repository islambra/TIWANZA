import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  GraduationCap,
  Megaphone,
  Plus,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useI18n } from '../../i18n/I18nContext.jsx'
import { useTiwanzaStore } from '../../data/store.js'
import {
  canUsePlanFeature,
  getCourseEnrollments,
  getCourseProgress,
  getCourseRevenue,
  getCourseStats,
  getSchool,
  getSchoolCourses,
  getSchoolEnrollments,
  getTrainerActivity,
  getTrainerStats,
  getTrainerSubscription,
  isSubscriptionActive,
} from '../../data/selectors.js'
import { Avatar, Badge, Button, Card, CardHeader, EmptyState, PageHeader, ProgressBar, StatCard, Table, Tabs } from '../../components/ui.jsx'
import { activityKey, StatusPill } from '../admin/AdminDashboard.jsx'
import { cn } from '../../lib/utils.js'

function inRange(value, start, end) {
  if (!value) return false
  const date = new Date(value)
  return date >= start && date < end
}

function buildSeries(period, payments, enrollments, date) {
  const now = new Date()
  const count = period === '7d' ? 7 : period === '30d' ? 6 : 12
  const series = []
  for (let index = count - 1; index >= 0; index -= 1) {
    let start
    let end
    let label
    if (period === '12m') {
      start = new Date(now.getFullYear(), now.getMonth() - index, 1)
      end = new Date(now.getFullYear(), now.getMonth() - index + 1, 1)
      label = date(start, { day: undefined, month: 'short', year: undefined })
    } else {
      const span = period === '7d' ? 1 : 5
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1 - index * span)
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1 - (index + 1) * span)
      label = date(start, { day: '2-digit', month: 'short', year: undefined })
    }
    series.push({
      label,
      revenue: payments
        .filter((payment) => payment.status === 'validated' && inRange(payment.submittedAt, start, end))
        .reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0),
      enrollments: enrollments.filter((enrollment) => inRange(enrollment.enrolledAt, start, end)).length,
    })
  }
  return series
}

function SectionTitle({ title, description, action }) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-sm font-bold text-ink">{title}</h2>
        {description ? <p className="mt-0.5 text-xs text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}

function UsageRow({ label, value, limit, text }) {
  const unlimited = limit === -1 || limit === null || limit === undefined
  const percentage = unlimited ? 8 : Math.min(100, Math.round((Number(value) / Math.max(1, Number(limit))) * 100))
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="text-muted">{label}</span>
        <span className="font-semibold text-ink">{value} / {text}</span>
      </div>
      <ProgressBar value={percentage} tone={percentage > 85 ? 'warning' : 'brand'} size="sm" />
    </div>
  )
}

function QuickAction({ icon: Icon, label, count, to }) {
  return (
    <Link to={to} className="flex items-center gap-2.5 rounded-lg border border-line px-3 py-2.5 text-xs font-medium text-ink transition hover:border-brand/30 hover:bg-brand-soft/40">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand"><Icon size={14} /></span>
      <span className="min-w-0 truncate">{label}</span>
      {count !== undefined ? <Badge tone="neutral">{count}</Badge> : null}
      <ArrowRight size={13} className="ms-auto shrink-0 text-muted rtl:rotate-180" />
    </Link>
  )
}

export default function TrainerDashboard() {
  const [period, setPeriod] = useState('30d')
  const { user } = useAuth()
  const { t, language, money, number, date, dateTime, time } = useI18n()
  const state = useTiwanzaStore()
  const school = getSchool(state, user?.schoolId)

  const header = (
    <PageHeader
      eyebrow={t('roles.trainer')}
      title={t('trainer.overviewTitle')}
      description={t('trainer.overviewSubtitle')}
      actions={
        <>
          {school ? <Link to={`/s/${school.slug}`}><Button variant="secondary" icon={ArrowUpRight}>{t('trainer.viewSite')}</Button></Link> : null}
          <Link to="/trainer/courses/new"><Button icon={Plus}>{t('trainer.createCourse')}</Button></Link>
        </>
      }
    />
  )

  if (!school) {
    return (
      <div className="space-y-6">
        {header}
        <Card>
          <EmptyState
            icon={Sparkles}
            title={t('trainer.emptyWorkspaceTitle')}
            description={t('trainer.emptyWorkspaceDesc')}
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Link to="/onboarding"><Button icon={ArrowRight}>{t('onboarding.title')}</Button></Link>
                <Link to="/trainer/school"><Button variant="secondary">{t('trainer.quickEditSchool')}</Button></Link>
              </div>
            }
          />
        </Card>
      </div>
    )
  }

  const stats = getTrainerStats(state, school.id)
  const courses = getSchoolCourses(state, school.id)
  const schoolEnrollments = getSchoolEnrollments(state, school.id)
  const payments = state.coursePayments.filter((payment) => payment.schoolId === school.id)
  const activity = getTrainerActivity(state, school.id, 6)
  const subscription = getTrainerSubscription(state, user?.id)
  const usage = stats.usage
  const planName = usage.plan ? (language === 'ar' ? usage.plan.nameAr : usage.plan.nameFr) : '—'
  const canUseCalendar = canUsePlanFeature(state, school.id, 'calendar')

  if (!courses.length && !schoolEnrollments.length && !payments.length && !stats.totalLearners && !stats.revenue) {
    return (
      <div className="space-y-6">
        {header}
        <Card>
          <EmptyState
            icon={Sparkles}
            title={t('trainer.emptyWorkspaceTitle')}
            description={t('trainer.emptyWorkspaceDesc')}
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Link to="/trainer/courses/new"><Button icon={Plus}>{t('trainer.createCourse')}</Button></Link>
                <Link to="/trainer/school"><Button variant="secondary">{t('trainer.quickEditSchool')}</Button></Link>
                <Link to="/trainer/learners"><Button variant="secondary" icon={GraduationCap}>{t('trainer.quickViewLearners')}</Button></Link>
              </div>
            }
          />
        </Card>
      </div>
    )
  }

  const publishedCourses = courses.filter((course) => course.status === 'published')
  const draftCourses = courses.filter((course) => course.status === 'draft')
  const pendingEnrollments = schoolEnrollments.filter((enrollment) => enrollment.status === 'pending')
  const validatedPayments = payments.filter((payment) => payment.status === 'validated')
  const lowCompletionCourses = courses.filter((course) => {
    const courseStats = getCourseStats(state, course.id)
    return courseStats.learners > 0 && courseStats.averageProgress < 50
  })
  const planBlocked = !usage.canCreateCourse || !usage.canPublishCourse || !usage.canAddLearner || !usage.hasStorage

  const series = buildSeries(period, payments, schoolEnrollments, date)
  const maxRevenue = Math.max(...series.map((item) => item.revenue), 1)
  const maxEnrollments = Math.max(...series.map((item) => item.enrollments), 1)
  const seriesRevenue = series.reduce((sum, item) => sum + item.revenue, 0)
  const seriesEnrollments = series.reduce((sum, item) => sum + item.enrollments, 0)

  const lastUpdatedAt = activity[0]?.createdAt || stats.recentEnrollments[0]?.enrolledAt || school.updatedAt || school.createdAt
  let daysLeft = null
  if (subscription?.endsAt && isSubscriptionActive(subscription)) {
    daysLeft = Math.max(0, Math.ceil((new Date(subscription.endsAt).getTime() - Date.now()) / 86400000))
  }

  function limitText(value) {
    return value === -1 || value === null || value === undefined ? t('common.unlimited') : String(value)
  }

  const tasks = [
    ...(stats.pendingPayments.length
      ? [{ id: 'payments', icon: CreditCard, tone: 'warning', label: t('trainer.taskReviewPayments', { count: number(stats.pendingPayments.length) }), to: '/trainer/payments' }]
      : []),
    ...(pendingEnrollments.length
      ? [{ id: 'enrollments', icon: ClipboardList, tone: 'warning', label: t('trainer.taskReviewEnrollments', { count: number(pendingEnrollments.length) }), to: '/trainer/enrollments' }]
      : []),
    ...(draftCourses.length
      ? [{ id: 'drafts', icon: BookOpen, tone: 'amber', label: t('trainer.taskPublishDrafts', { count: number(draftCourses.length) }), to: '/trainer/courses' }]
      : []),
    ...(lowCompletionCourses.length
      ? [{ id: 'completion', icon: TrendingUp, tone: 'blue', label: t('trainer.taskCompleteCourses', { count: number(lowCompletionCourses.length) }), to: '/trainer/learners' }]
      : []),
    ...(planBlocked
      ? [{ id: 'plan', icon: ShieldCheck, tone: 'danger', label: t('trainer.taskPlanLimits'), to: '/trainer/subscription' }]
      : []),
    ...(!school.description || !school.contactEmail
      ? [{ id: 'school', icon: Sparkles, tone: 'neutral', label: t('trainer.taskEditSchool'), to: '/trainer/school' }]
      : []),
  ]

  const kpis = [
    { label: t('trainer.kpiNetRevenue'), value: money(stats.revenue), hint: `${number(validatedPayments.length)} ${t('trainerPayments.tabApproved')}`, icon: Wallet, tone: 'amber' },
    { label: t('trainer.statLearners'), value: number(stats.totalLearners), hint: `${number(stats.monthlyEnrollments)} ${t('trainer.statNewThisMonth')}`, icon: GraduationCap, tone: 'blue' },
    { label: t('trainer.activeCourses'), value: number(publishedCourses.length), hint: `${number(draftCourses.length)} ${t('trainer.statDrafts')}`, icon: BookOpen, tone: 'brand' },
    { label: t('trainer.kpiPendingReview'), value: number(stats.pendingPayments.length + pendingEnrollments.length), hint: `${number(stats.pendingPayments.length)} ${t('trainer.statPendingPayments')} · ${number(pendingEnrollments.length)} ${t('trainerEnrollments.pending')}`, icon: ClipboardList, tone: 'warning' },
    { label: t('trainer.completionRate'), value: `${number(stats.averageCompletion)}%`, hint: t('trainer.kpiCompletionHint'), icon: CheckCircle2, tone: 'success' },
    { label: t('trainer.planUsage'), value: `${number(usage.courses)} / ${limitText(usage.limits.publishedCourses)}`, hint: planName, icon: ShieldCheck, tone: 'purple' },
  ]

  const topCourses = courses
    .map((course) => ({
      course,
      learners: getCourseEnrollments(state, course.id, 'active').length,
      revenue: getCourseRevenue(state, course.id),
    }))
    .sort((a, b) => b.learners - a.learners)
    .slice(0, 5)

  return (
    <div className="space-y-7">
      {header}

      <div>
        <SectionTitle
          title={t('trainer.sectionAtAGlance')}
          action={lastUpdatedAt ? <Badge tone="neutral">{t('trainer.lastUpdated', { time: dateTime(lastUpdatedAt) })}</Badge> : null}
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {kpis.map((kpi) => <StatCard key={kpi.label} label={kpi.label} value={kpi.value} hint={kpi.hint} icon={kpi.icon} tone={kpi.tone} />)}
        </div>
      </div>

      <div>
        <SectionTitle
          title={t('trainer.sectionPerformance')}
          action={
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-3 text-[11px] text-muted">
                <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand" />{t('trainer.chartLegendRevenue')}</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-600" />{t('trainer.chartLegendEnrollments')}</span>
              </div>
              <Tabs
                variant="pills"
                value={period}
                onChange={setPeriod}
                items={[
                  { value: '7d', label: t('trainer.period7Days') },
                  { value: '30d', label: t('trainer.period30Days') },
                  { value: '12m', label: t('trainer.period12Months') },
                ]}
              />
            </div>
          }
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader
              title={t('trainer.revenueOverview')}
              description={t('trainer.revenueOverviewDesc')}
              action={<Badge tone="success" dot>{money(seriesRevenue)}</Badge>}
            />
            <div className="p-5">
              {seriesRevenue ? (
                <div
                  role="img"
                  aria-label={`${t('trainer.revenueOverview')} — ${series.map((item) => `${item.label}: ${money(item.revenue)}`).join(' · ')}`}
                  className="flex h-44 items-end gap-2 sm:gap-3"
                >
                  {series.map((item, index) => (
                    <div key={`${item.label}-${index}`} className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                      <span className="max-w-full truncate text-[9px] font-semibold text-muted opacity-0 transition group-hover:opacity-100">{money(item.revenue)}</span>
                      <div className="flex w-full flex-1 items-end">
                        <div className={cn('w-full rounded-t-lg transition-all duration-500', index === series.length - 1 ? 'bg-brand' : 'bg-brand/25 group-hover:bg-brand/40')} style={{ height: `${Math.max(4, (item.revenue / maxRevenue) * 100)}%` }} />
                      </div>
                      <span className="max-w-full truncate text-[9px] font-medium text-muted">{item.label}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={Wallet} title={t('trainer.chartNoData')} compact />
              )}
            </div>
          </Card>

          <Card>
            <CardHeader
              title={t('trainer.chartEnrollmentsTitle')}
              description={t('trainer.chartEnrollmentsDesc')}
              action={<Badge tone="blue" dot>{number(seriesEnrollments)}</Badge>}
            />
            <div className="p-5">
              {seriesEnrollments ? (
                <div role="img" aria-label={`${t('trainer.chartEnrollmentsTitle')} — ${series.map((item) => `${item.label}: ${number(item.enrollments)}`).join(' · ')}`} className="space-y-2.5">
                  {series.map((item, index) => (
                    <div key={`${item.label}-${index}`} className="flex items-center gap-3">
                      <span className="w-14 shrink-0 truncate text-[10px] text-muted sm:w-20">{item.label}</span>
                      <ProgressBar value={(item.enrollments / maxEnrollments) * 100} tone="blue" size="sm" className="flex-1" />
                      <span className="w-7 shrink-0 text-end text-[11px] font-bold text-ink">{number(item.enrollments)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={GraduationCap} title={t('trainer.chartNoData')} compact />
              )}
            </div>
          </Card>
        </div>
      </div>

      <div>
        <SectionTitle title={t('trainer.sectionOperations')} description={t('trainer.needsAttentionDesc')} />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Card>
            <CardHeader
              title={t('trainer.needsAttentionTitle')}
              action={<Badge tone={tasks.length ? 'warning' : 'success'}>{t('trainer.needsAttentionCount', { count: number(tasks.length) })}</Badge>}
            />
            {tasks.length ? (
              <div className="divide-y divide-line">
                {tasks.map((task) => (
                  <Link key={task.id} to={task.to} className="flex items-center gap-3 px-5 py-3 transition hover:bg-surface">
                    <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-lg', task.tone === 'danger' ? 'bg-danger-soft text-danger' : task.tone === 'warning' ? 'bg-warning-soft text-warning' : task.tone === 'amber' ? 'bg-amber-50 text-amber-600' : task.tone === 'blue' ? 'bg-blue-50 text-blue-600' : 'bg-brand-soft text-brand')}>
                      <task.icon size={15} />
                    </span>
                    <span className="min-w-0 flex-1 text-[11px] font-semibold text-ink">{task.label}</span>
                    <ArrowRight size={13} className="shrink-0 text-muted rtl:rotate-180" />
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState icon={CheckCircle2} title={t('trainer.attentionAllClear')} compact />
            )}
          </Card>

          <Card>
            <CardHeader title={t('trainer.planUsage')} description={t('trainer.planUsageDesc')} action={<Badge tone="purple">{planName}</Badge>} />
            <div className="space-y-4 p-5">
              {daysLeft !== null && daysLeft <= 14 ? (
                <div className="rounded-xl bg-brand-soft/60 p-3 text-[11px] font-medium text-brand-dark">{t('trainer.subscriptionExpiring', { count: number(daysLeft) })}</div>
              ) : null}
              <UsageRow label={t('adminPlans.maxCourses')} value={number(usage.courses)} limit={usage.limits.publishedCourses} text={limitText(usage.limits.publishedCourses)} />
              <UsageRow label={t('adminPlans.maxLearners')} value={number(usage.learners)} limit={usage.limits.learners} text={limitText(usage.limits.learners)} />
              <UsageRow label={t('limits.storage')} value={number(usage.storageUsedGb)} limit={usage.limits.storageGb} text={`${limitText(usage.limits.storageGb)} Go`} />
              <div className="grid gap-2 pt-1 sm:grid-cols-2">
                <Link to="/trainer/subscription" className="block"><Button variant="soft" size="sm" fullWidth icon={Sparkles}>{t('trainer.upgradePlan')}</Button></Link>
                <Link to="/trainer/subscription" className="block"><Button variant="secondary" size="sm" fullWidth>{t('trainer.renewPlan')}</Button></Link>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title={t('trainer.quickActions')} />
            <div className="grid gap-2 p-4 sm:grid-cols-2 xl:grid-cols-1">
              <QuickAction icon={Plus} label={t('trainer.quickCreateCourse')} to="/trainer/courses/new" />
              <QuickAction icon={CreditCard} label={t('trainer.quickReviewPayments')} count={number(stats.pendingPayments.length)} to="/trainer/payments" />
              <QuickAction icon={ClipboardList} label={t('trainerEnrollments.title')} count={number(pendingEnrollments.length)} to="/trainer/enrollments" />
              <QuickAction icon={Megaphone} label={t('trainer.quickAddAnnouncement')} to="/trainer/announcements" />
              {canUseCalendar ? <QuickAction icon={CalendarDays} label={t('trainer.quickScheduleEvent')} count={number(stats.upcomingEvents.length)} to="/trainer/calendar" /> : null}
              <QuickAction icon={GraduationCap} label={t('trainer.quickViewLearners')} count={number(stats.totalLearners)} to="/trainer/learners" />
            </div>
          </Card>
        </div>
      </div>

      <div>
        <SectionTitle title={t('trainer.sectionPlanning')} />
        <div className="grid gap-4 lg:grid-cols-2">
          {canUseCalendar ? (
            <Card>
              <CardHeader
                title={t('trainer.upcomingEvents')}
                action={<Link to="/trainer/calendar" className="text-[11px] font-semibold text-brand hover:underline">{t('trainer.viewAll')}</Link>}
              />
              {stats.upcomingEvents.length ? (
                <div className="divide-y divide-line">
                  {stats.upcomingEvents.map((event) => {
                    const course = courses.find((item) => item.id === event.courseId)
                    return (
                      <Link key={event.id} to="/trainer/calendar" className="flex items-center gap-3 px-5 py-3 transition hover:bg-surface">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
                          <span className="text-center leading-tight">
                            <span className="block text-[9px] font-semibold uppercase">{date(event.startAt, { day: undefined, month: 'short', year: undefined })}</span>
                            <span className="block text-sm font-bold">{new Date(event.startAt).getDate()}</span>
                          </span>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-semibold text-ink">{event.title}</span>
                          <span className="block truncate text-[10px] text-muted">{time(event.startAt)} · {course?.title || t('trainerCalendar.noCourse')}</span>
                        </span>
                        <Badge tone={event.type === 'live' ? 'success' : 'neutral'}>{t(`trainerCalendar.type${event.type === 'live' ? 'Live' : event.type === 'workshop' ? 'Workshop' : event.type === 'deadline' ? 'Deadline' : 'Other'}`)}</Badge>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <EmptyState icon={CalendarDays} title={t('trainer.noUpcomingEvents')} action={<Link to="/trainer/calendar"><Button size="sm" variant="soft" icon={Plus}>{t('trainer.scheduleEvent')}</Button></Link>} compact />
              )}
            </Card>
          ) : null}

          <Card>
            <CardHeader title={t('trainer.recentActivity')} description={t('trainer.recentActivityDesc')} />
            {activity.length ? (
              <div className="px-5 py-4">
                <div className="relative space-y-4 before:absolute before:bottom-2 before:start-[13px] before:top-2 before:w-px before:bg-line">
                  {activity.map((entry) => {
                    const actor = state.users.find((item) => item.id === entry.actorId)
                    const course = courses.find((item) => item.id === entry.courseId)
                    return (
                      <div key={entry.id} className="relative flex items-start gap-3 ps-0">
                        <span className="z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-brand/20 bg-brand-soft text-brand"><TrendingUp size={12} /></span>
                        <div className="min-w-0 flex-1 pt-0.5">
                          <p className="text-[11px] leading-relaxed text-ink"><span className="font-semibold">{actor?.name || 'Tiwanza'}</span> <span className="text-muted">— {t(`activity.${activityKey(entry.type)}`)}</span></p>
                          {course ? <p className="truncate text-[10px] text-muted">{course.title}</p> : null}
                        </div>
                        <span className="whitespace-nowrap pt-0.5 text-[10px] text-muted">{date(entry.createdAt)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <EmptyState icon={TrendingUp} title={t('trainer.noActivityYet')} description={t('trainer.noActivityYetDesc')} compact />
            )}
          </Card>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader
            title={t('trainer.recentEnrollments')}
            description={t('trainer.recentEnrollmentsDesc')}
            action={<Link to="/trainer/learners" className="text-[11px] font-semibold text-brand hover:underline">{t('trainer.viewAll')}</Link>}
          />
          {stats.recentEnrollments.length ? (
            <Table>
              <thead><tr><th>{t('trainerLearners.tableLearner')}</th><th className="hidden sm:table-cell">{t('trainerLearners.tableProgress')}</th><th className="text-end">{t('trainerLearners.tableJoined')}</th></tr></thead>
              <tbody>
                {stats.recentEnrollments.map((enrollment) => {
                  const learner = state.users.find((item) => item.id === enrollment.learnerId)
                  const course = courses.find((item) => item.id === enrollment.courseId)
                  const progress = getCourseProgress(state, enrollment.learnerId, enrollment.courseId)
                  return (
                    <tr key={enrollment.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <Avatar name={learner?.name || '—'} size="xs" />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-ink">{learner?.name || '—'}</p>
                            <p className="truncate text-[10px] text-muted">{course?.title}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden w-28 sm:table-cell"><ProgressBar value={progress.percentage} size="sm" showLabel /></td>
                      <td className="whitespace-nowrap text-end text-[11px] text-muted">{date(enrollment.enrolledAt)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          ) : (
            <EmptyState icon={GraduationCap} title={t('trainer.noLearnersYet')} description={t('trainer.noLearnersYetDesc')} compact />
          )}
        </Card>

        <Card>
          <CardHeader
            title={t('trainer.topCourses')}
            description={t('trainer.topCoursesDesc')}
            action={<Link to="/trainer/courses" className="text-[11px] font-semibold text-brand hover:underline">{t('trainer.manageCourses')}</Link>}
          />
          {topCourses.length ? (
            <Table>
              <thead><tr><th>{t('trainerCourses.tableCourse')}</th><th className="text-end">{t('trainerCourses.tableStudents')}</th><th className="text-end">{t('trainerCourses.tableRevenue')}</th></tr></thead>
              <tbody>
                {topCourses.map(({ course, learners, revenue }) => (
                  <tr key={course.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[9px] font-bold text-white" style={{ background: course.cover }}>{course.coverLabel}</span>
                        <div className="min-w-0">
                          <Link to={`/trainer/courses/${course.id}`} className="block max-w-[150px] truncate text-xs font-semibold text-ink hover:text-brand">{course.title}</Link>
                          <StatusPill status={course.status} t={t} />
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap text-end text-xs font-semibold text-ink">{number(learners)}</td>
                    <td className="whitespace-nowrap text-end text-xs font-semibold text-ink">{money(revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <EmptyState icon={BookOpen} title={t('trainer.noCoursesYet')} description={t('trainer.noCoursesYetDesc')} action={<Link to="/trainer/courses/new"><Button size="sm" icon={Plus}>{t('trainer.createFirstCourse')}</Button></Link>} compact />
          )}
        </Card>

        <Card>
          <CardHeader
            title={t('trainer.recentPayments')}
            description={t('trainer.recentPaymentsDesc')}
            action={<Link to="/trainer/payments" className="text-[11px] font-semibold text-brand hover:underline">{t('trainer.viewAll')}</Link>}
          />
          {stats.pendingPayments.length ? (
            <Table>
              <thead><tr><th>{t('trainerLearners.tableLearner')}</th><th className="text-end">{t('trainerPayments.tableAmount')}</th></tr></thead>
              <tbody>
                {stats.pendingPayments.slice(0, 5).map((payment) => {
                  const learner = state.users.find((item) => item.id === payment.learnerId)
                  const course = courses.find((item) => item.id === payment.courseId)
                  return (
                    <tr key={payment.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-600"><CreditCard size={14} /></span>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-ink">{learner?.name || '—'}</p>
                            <p className="truncate text-[10px] text-muted">{course?.title}</p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap text-end text-xs font-bold text-ink">{money(payment.amount)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          ) : (
            <EmptyState icon={CreditCard} title={t('trainer.noPendingPayments')} description={t('trainer.noPendingPaymentsDesc')} compact />
          )}
        </Card>
      </div>
    </div>
  )
}
