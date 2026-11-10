import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  GraduationCap,
  Megaphone,
  Plus,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useI18n } from '../../i18n/I18nContext.jsx'
import { useTiwanzaStore } from '../../data/store.js'
import {
  getCourseProgress,
  getLearnerEnrollments,
  getSchool,
  getSchoolCourses,
  getTrainerActivity,
  getTrainerBySchool,
  getTrainerStats,
} from '../../data/selectors.js'
import { Avatar, Badge, Button, Card, CardHeader, EmptyState, PageHeader, ProgressBar, StatCard } from '../../components/ui.jsx'
import { StatusPill } from '../admin/AdminDashboard.jsx'
import { activityKey } from '../admin/AdminDashboard.jsx'
import { cn } from '../../lib/utils.js'

function monthBuckets(payments) {
  const buckets = []
  const now = new Date()
  for (let index = 5; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1)
    const next = new Date(now.getFullYear(), now.getMonth() - index + 1, 1)
    const total = payments
      .filter((payment) => payment.status === 'validated')
      .filter((payment) => {
        const value = new Date(payment.submittedAt)
        return value >= date && value < next
      })
      .reduce((sum, payment) => sum + payment.amount, 0)
    buckets.push({ label: date.toLocaleDateString('fr-FR', { month: 'short' }), total })
  }
  return buckets
}

export default function TrainerDashboard() {
  const { user } = useAuth()
  const { t, language, money, number, date } = useI18n()
  const state = useTiwanzaStore()
  const school = getSchool(state, user?.schoolId)

  if (!school) {
    return (
      <div className="mt-10">
        <EmptyState
          icon={Sparkles}
          title={t('trainer.noCoursesYet')}
          description={t('onboarding.title') || t('trainer.welcomeSubtitle')}
          action={<Link to="/onboarding"><Button icon={ArrowRight}>{t('onboarding.title')}</Button></Link>}
        />
      </div>
    )
  }

  const stats = getTrainerStats(state, school.id)
  const courses = getSchoolCourses(state, school.id)
  const payments = state.coursePayments.filter((payment) => payment.schoolId === school.id)
  const buckets = monthBuckets(payments)
  const maxBucket = Math.max(...buckets.map((bucket) => bucket.total), 1)
  const activity = getTrainerActivity(state, school.id, 6)
  const topCourses = courses
    .map((course) => {
      const enrollments = getLearnerEnrollments.length ? state.enrollments.filter((item) => item.courseId === course.id && item.status === 'active') : []
      const revenue = payments.filter((payment) => payment.courseId === course.id && payment.status === 'validated').reduce((sum, payment) => sum + payment.amount, 0)
      return { course, learners: enrollments.length, revenue }
    })
    .sort((a, b) => b.learners - a.learners)
    .slice(0, 4)

  const usage = stats.usage
  const planName = usage.plan ? (language === 'ar' ? usage.plan.nameAr : usage.plan.nameFr) : '—'
  const daysLeft = usage.plan?.priceDA ? 10 : null

  function limitText(value) {
    return value === -1 || value === null || value === undefined ? t('common.unlimited') : String(value)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={t('roles.trainer')}
        title={t('trainer.welcome', { name: user?.name?.split(' ')[0] || '' })}
        description={t('trainer.welcomeSubtitle')}
        actions={
          <>
            <Link to={`/s/${school.slug}`}><Button variant="secondary" icon={ArrowUpRight}>{t('trainer.viewSite')}</Button></Link>
            <Link to="/trainer/courses/new"><Button icon={Plus}>{t('trainer.createCourse')}</Button></Link>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('trainer.statCourses')} value={number(courses.length)} hint={`${stats.courses.filter((course) => course.status === 'published').length} ${t('trainer.statPublished').toLowerCase()}`} icon={BookOpen} tone="brand" />
        <StatCard label={t('trainer.statLearners')} value={number(stats.totalLearners)} hint={`${number(stats.monthlyEnrollments)} ${t('trainer.statNewThisMonth')}`} icon={GraduationCap} tone="blue" trend={{ value: `+${stats.weeklyEnrollments}`, label: t('trainer.fromLastMonth'), positive: true }} />
        <StatCard label={t('trainer.statRevenue')} value={money(stats.revenue)} hint={t('trainer.totalNet') || t('trainerPayments.totalNet')} icon={Wallet} tone="amber" trend={{ value: '+12 %', label: t('trainer.fromLastMonth'), positive: true }} />
        <StatCard label={t('trainer.statCompletion')} value={`${stats.averageCompletion}%`} hint={t('trainer.completionRate')} icon={CheckCircle2} tone="success" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader
            title={t('trainer.revenueOverview')}
            description={t('trainer.revenueOverviewDesc')}
            action={<Badge tone="success" dot>{money(buckets.reduce((sum, bucket) => sum + bucket.total, 0))}</Badge>}
          />
          <div className="p-5">
            <div className="flex h-44 items-end gap-3 sm:gap-5">
              {buckets.map((bucket, index) => (
                <div key={`${bucket.label}-${index}`} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
                  <span className="text-[9px] font-semibold text-muted opacity-0 transition group-hover:opacity-100">{money(bucket.total)}</span>
                  <div className="relative flex w-full max-w-14 flex-1 items-end">
                    <div className={cn('w-full rounded-t-lg transition-all duration-500', index === buckets.length - 1 ? 'bg-brand' : 'bg-brand/25 group-hover:bg-brand/40')} style={{ height: `${Math.max(5, (bucket.total / maxBucket) * 100)}%` }} />
                  </div>
                  <span className="text-[10px] font-medium capitalize text-muted">{bucket.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4">
              <div><p className="text-[10px] text-muted">{t('trainer.statPendingPayments')}</p><p className="text-sm font-bold text-ink">{stats.pendingPayments.length}</p></div>
              <div><p className="text-[10px] text-muted">{t('trainer.statActiveLearners')}</p><p className="text-sm font-bold text-ink">{stats.totalLearners}</p></div>
              <div><p className="text-[10px] text-muted">{t('trainer.statEnrollments')}</p><p className="text-sm font-bold text-ink">{stats.activeEnrollments.length}</p></div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title={t('trainer.planUsage')} description={t('trainer.planUsageDesc')} action={<Badge tone="purple">{planName}</Badge>} />
          <div className="space-y-4 p-5">
            {daysLeft ? (
              <div className="rounded-xl bg-brand-soft/60 p-3 text-[11px] font-medium text-brand-dark">{t('trainer.subscriptionExpiring', { count: daysLeft })}</div>
            ) : null}
            <UsageRow label={t('adminPlans.maxCourses')} value={usage.courses} limit={usage.limits.publishedCourses} text={limitText(usage.limits.publishedCourses)} />
            <UsageRow label={t('adminPlans.maxLearners')} value={usage.learners} limit={usage.limits.learners} text={limitText(usage.limits.learners)} />
            <UsageRow label={t('limits.storage')} value={usage.storageUsedGb} limit={usage.limits.storageGb} text={`${limitText(usage.limits.storageGb)} Go`} />
            <div className="flex gap-2 pt-1">
              <Link to="/trainer/subscription"><Button variant="soft" size="sm" fullWidth icon={Sparkles}>{t('trainer.upgradePlan')}</Button></Link>
              <Link to="/trainer/subscription"><Button variant="secondary" size="sm" fullWidth>{t('trainer.renewPlan')}</Button></Link>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader title={t('trainer.recentEnrollments')} description={t('trainer.recentEnrollmentsDesc')} action={<Link to="/trainer/learners" className="text-[11px] font-semibold text-brand hover:underline">{t('trainer.viewAll')}</Link>} />
          {stats.recentEnrollments.length ? (
            <div className="divide-y divide-line">
              {stats.recentEnrollments.map((enrollment) => {
                const learner = state.users.find((item) => item.id === enrollment.learnerId)
                const course = courses.find((item) => item.id === enrollment.courseId)
                const progress = getCourseProgress(state, enrollment.learnerId, enrollment.courseId)
                return (
                  <div key={enrollment.id} className="flex items-center gap-3 px-5 py-3">
                    <Avatar name={learner?.name || '—'} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-ink">{learner?.name || '—'}</p>
                      <p className="truncate text-[10px] text-muted">{course?.title}</p>
                    </div>
                    <div className="hidden w-28 sm:block"><ProgressBar value={progress.percentage} size="sm" showLabel /></div>
                    <span className="text-[10px] text-muted">{date(enrollment.enrolledAt)}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState icon={GraduationCap} title={t('trainer.noLearnersYet')} description={t('trainer.noLearnersYetDesc')} compact />
          )}
        </Card>

        <Card>
          <CardHeader title={t('trainer.recentPayments')} description={t('trainer.recentPaymentsDesc')} action={<Link to="/trainer/payments" className="text-[11px] font-semibold text-brand hover:underline">{t('trainer.viewAll')}</Link>} />
          {stats.pendingPayments.length ? (
            <div className="divide-y divide-line">
              {stats.pendingPayments.slice(0, 5).map((payment) => {
                const learner = state.users.find((item) => item.id === payment.learnerId)
                const course = courses.find((item) => item.id === payment.courseId)
                return (
                  <div key={payment.id} className="flex items-center gap-3 px-5 py-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-600"><CreditCard size={15} /></span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-ink">{learner?.name || '—'}</p>
                      <p className="truncate text-[10px] text-muted">{course?.title}</p>
                    </div>
                    <span className="text-xs font-bold text-ink">{money(payment.amount)}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState icon={CreditCard} title={t('trainer.noPendingPayments')} description={t('trainer.noPendingPaymentsDesc')} compact />
          )}
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title={t('trainer.topCourses')} description={t('trainer.topCoursesDesc')} action={<Link to="/trainer/courses" className="text-[11px] font-semibold text-brand hover:underline">{t('trainer.manageCourses')}</Link>} />
          {topCourses.length ? (
            <div className="divide-y divide-line">
              {topCourses.map(({ course, learners, revenue }) => (
                <div key={course.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg text-[9px] font-bold text-white" style={{ background: course.cover }}>{course.coverLabel}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-ink">{course.title}</p>
                    <p className="text-[10px] text-muted">{t('trainerCourses.studentsCount', { count: learners })}</p>
                  </div>
                  <span className="text-xs font-bold text-ink">{money(revenue)}</span>
                  <StatusPill status={course.status} t={t} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={BookOpen} title={t('trainer.noCoursesYet')} description={t('trainer.noCoursesYetDesc')} action={<Link to="/trainer/courses/new"><Button size="sm" icon={Plus}>{t('trainer.createFirstCourse')}</Button></Link>} compact />
          )}
        </Card>

        <Card>
          <CardHeader title={t('trainer.quickActions')} />
          <div className="grid gap-2 p-4">
            <QuickAction icon={Plus} label={t('trainer.quickCreateCourse')} to="/trainer/courses/new" />
            <QuickAction icon={CreditCard} label={t('trainer.quickReviewPayments')} to="/trainer/payments" />
            <QuickAction icon={Megaphone} label={t('trainer.quickAddAnnouncement')} to="/trainer/announcements" />
            <QuickAction icon={CalendarDays} label={t('trainer.quickScheduleEvent')} to="/trainer/calendar" />
            <QuickAction icon={GraduationCap} label={t('trainer.quickViewLearners')} to="/trainer/learners" />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title={t('trainer.recentActivity')} description={t('trainer.recentActivityDesc')} />
          {activity.length ? (
            <div className="divide-y divide-line">
              {activity.map((entry) => {
                const actor = state.users.find((item) => item.id === entry.actorId)
                const course = courses.find((item) => item.id === entry.courseId)
                return (
                  <div key={entry.id} className="flex items-start gap-3 px-5 py-3">
                    <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand"><TrendingUp size={13} /></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] leading-relaxed text-ink"><span className="font-semibold">{actor?.name || 'Tiwanza'}</span> <span className="text-muted">— {t(`activity.${activityKey(entry.type)}`)}</span></p>
                      {course ? <p className="text-[10px] text-muted">{course.title}</p> : null}
                    </div>
                    <span className="whitespace-nowrap text-[10px] text-muted">{date(entry.createdAt)}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState icon={TrendingUp} title={t('trainer.noActivityYet')} description={t('trainer.noActivityYetDesc')} compact />
          )}
        </Card>

        <Card>
          <CardHeader title={t('trainer.upcomingEvents')} action={<Link to="/trainer/calendar" className="text-[11px] font-semibold text-brand hover:underline">{t('trainer.viewAll')}</Link>} />
          {stats.upcomingEvents.length ? (
            <div className="divide-y divide-line">
              {stats.upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600"><CalendarDays size={15} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-ink">{event.title}</p>
                    <p className="text-[10px] text-muted">{date(event.startAt)} · {new Date(event.startAt).toLocaleTimeString(language === 'ar' ? 'ar-DZ' : 'fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={CalendarDays} title={t('trainer.noUpcomingEvents')} action={<Link to="/trainer/calendar"><Button size="sm" variant="soft" icon={Plus}>{t('trainer.scheduleEvent')}</Button></Link>} compact />
          )}
        </Card>
      </div>
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

function QuickAction({ icon: Icon, label, to }) {
  return (
    <Link to={to} className="flex items-center gap-2.5 rounded-lg border border-line px-3 py-2.5 text-xs font-medium text-ink transition hover:border-brand/30 hover:bg-brand-soft/40">
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-soft text-brand"><Icon size={14} /></span>
      {label}
      <ArrowRight size={13} className="ms-auto text-muted rtl:rotate-180" />
    </Link>
  )
}
