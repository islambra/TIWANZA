import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  GraduationCap,
  LifeBuoy,
  Plus,
  School,
  Settings,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useI18n } from '../../i18n/I18nContext.jsx'
import { useTiwanzaStore } from '../../data/store.js'
import {
  getAdminActivity,
  getPlanUsage,
  getPlatformStats,
  getSubscriptionPayments,
  getTrainerProfile,
  getTrainersOverview,
} from '../../data/selectors.js'
import { Avatar, Badge, Button, Card, CardHeader, EmptyState, PageHeader, ProgressBar, StatCard } from '../../components/ui.jsx'
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

export default function AdminDashboard() {
  const { user } = useAuth()
  const { t, language, number, money, date } = useI18n()
  const state = useTiwanzaStore()
  const stats = getPlatformStats(state)
  const payments = getSubscriptionPayments(state)
  const buckets = monthBuckets(state.subscriptionPayments)
  const maxBucket = Math.max(...buckets.map((bucket) => bucket.total), 1)
  const trainers = getTrainersOverview(state)
  const recentSchools = state.schools
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
  const activity = getAdminActivity(state, 7)
  const pendingPayments = payments.filter((item) => item.payment.status === 'pending')
  const openSupport = state.supportRequests.filter((item) => item.status === 'open' || item.status === 'pending')
  const topSchools = state.schools
    .map((school) => ({ school, usage: getPlanUsage(state, school.id) }))
    .sort((a, b) => b.usage.learners - a.usage.learners)
    .slice(0, 4)

  function planName(profile) {
    const plan = state.plans.find((item) => item.id === profile?.planId)
    return plan ? (language === 'ar' ? plan.nameAr : plan.nameFr) : '—'
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={t('roles.admin')}
        title={t('admin.welcome', { name: user?.name?.split(' ')[0] || '' })}
        description={t('admin.welcomeSubtitle')}
        actions={
          <>
            <Link to="/admin/subscriptions">
              <Button variant="secondary" icon={CreditCard}>
                {t('admin.reviewPayments')}
                {pendingPayments.length ? <span className="ms-1 rounded-full bg-danger px-1.5 text-[10px] text-white">{pendingPayments.length}</span> : null}
              </Button>
            </Link>
            <Link to="/admin/schools">
              <Button icon={School}>{t('admin.manageSchools')}</Button>
            </Link>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('admin.statSchools')} value={number(stats.schools)} hint={t('admin.statActiveSubscriptions') + ` : ${stats.activeSubscriptions}`} icon={School} trend={{ value: '+2', label: t('admin.statNewThisMonth'), positive: true }} />
        <StatCard label={t('admin.statLearners')} value={number(state.users.filter((item) => item.role === 'learner').length * 24)} hint={`${number(state.users.filter((item) => item.role === 'learner').length)} ${t('admin.statTrainers')}`} icon={Users} tone="blue" trend={{ value: '+12 %', label: t('admin.fromLastMonth'), positive: true }} />
        <StatCard label={t('admin.statRevenue')} value={money(stats.revenue)} hint={t('payments.subscriptionPayment')} icon={Wallet} tone="amber" trend={{ value: '+18 %', label: t('admin.fromLastMonth'), positive: true }} />
        <StatCard label={t('admin.statPending')} value={number(stats.pendingSubscriptions)} hint={t('admin.statPendingDesc')} icon={Clock} tone={stats.pendingSubscriptions ? 'danger' : 'success'} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader
            title={t('admin.revenueOverview')}
            description={t('admin.revenueOverviewDesc')}
            action={<Badge tone="success" dot>{money(buckets.reduce((sum, bucket) => sum + bucket.total, 0))}</Badge>}
          />
          <div className="p-5">
            <div className="flex h-44 items-end gap-3 sm:gap-5">
              {buckets.map((bucket, index) => (
                <div key={`${bucket.label}-${index}`} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
                  <span className="text-[9px] font-semibold text-muted opacity-0 transition group-hover:opacity-100">{money(bucket.total)}</span>
                  <div className="relative flex w-full max-w-14 flex-1 items-end">
                    <div
                      className={cn('w-full rounded-t-lg transition-all duration-500', index === buckets.length - 1 ? 'bg-brand' : 'bg-brand/25 group-hover:bg-brand/40')}
                      style={{ height: `${Math.max(6, (bucket.total / maxBucket) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-medium capitalize text-muted">{bucket.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4">
              <div>
                <p className="text-[10px] text-muted">{t('admin.statActiveSubscriptions')}</p>
                <p className="text-sm font-bold text-ink">{stats.activeSubscriptions}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted">{t('admin.statProSchools')}</p>
                <p className="text-sm font-bold text-ink">{state.subscriptions.filter((item) => item.planId === 'plan-pro' && item.status === 'active').length}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted">{t('admin.statFreeSchools')}</p>
                <p className="text-sm font-bold text-ink">{state.subscriptions.filter((item) => item.planId === 'plan-free' && item.status === 'active').length}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title={t('admin.pendingActions')} description={t('admin.pendingActionsDesc')} action={<Badge tone={pendingPayments.length + openSupport.length ? 'warning' : 'success'}>{pendingPayments.length + openSupport.length}</Badge>} />
          <div className="divide-y divide-line">
            {pendingPayments.length ? (
              <Link to="/admin/subscriptions" className="flex items-start gap-3 px-4 py-3 transition hover:bg-surface">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-700"><CreditCard size={15} /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-ink">{t('admin.pendingSubscriptionPayments', { count: pendingPayments.length })}</p>
                  <p className="mt-0.5 text-[10px] text-muted">{money(pendingPayments.reduce((sum, item) => sum + item.payment.amount, 0))} · {t('admin.reviewNow')}</p>
                </div>
                <ArrowRight size={14} className="mt-1 text-muted rtl:rotate-180" />
              </Link>
            ) : null}
            {openSupport.length ? (
              <Link to="/admin/support" className="flex items-start gap-3 px-4 py-3 transition hover:bg-surface">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700"><LifeBuoy size={15} /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-ink">{t('admin.pendingSupport', { count: openSupport.length })}</p>
                  <p className="mt-0.5 text-[10px] text-muted">{t('adminSupport.subtitle')}</p>
                </div>
                <ArrowRight size={14} className="mt-1 text-muted rtl:rotate-180" />
              </Link>
            ) : null}
            {!pendingPayments.length && !openSupport.length ? (
              <EmptyState compact icon={CheckCircle2} title={t('admin.noPendingActions')} description={t('admin.noPendingActionsDesc')} />
            ) : null}
            <div className="grid grid-cols-2 gap-2 p-3">
              <Link to="/admin/users"><Button variant="secondary" size="sm" fullWidth icon={Users}>{t('admin.manageUsers')}</Button></Link>
              <Link to="/admin/plans"><Button variant="secondary" size="sm" fullWidth icon={Sparkles}>{t('admin.viewPlans')}</Button></Link>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHeader title={t('admin.recentSchools')} description={t('admin.recentSchoolsDesc')} action={<Link to="/admin/schools" className="text-[11px] font-semibold text-brand hover:underline">{t('admin.viewAllSchools')}</Link>} />
          {recentSchools.length ? (
            <div className="table-wrap">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>{t('adminSchools.tableSchool')}</th>
                    <th>{t('adminSchools.tablePlan')}</th>
                    <th className="hidden sm:table-cell">{t('adminSchools.tableLearners')}</th>
                    <th>{t('common.status')}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {recentSchools.map((school) => {
                    const owner = state.users.find((item) => item.id === school.trainerId)
                    const profile = getTrainerProfile(state, school.trainerId)
                    const subscription = state.subscriptions.find((item) => item.id === profile?.subscriptionId)
                    const usage = getPlanUsage(state, school.id)
                    const status = school.status === 'suspended' ? 'suspended' : subscription?.status || 'none'
                    return (
                      <tr key={school.id}>
                        <td>
                          <div className="flex items-center gap-2.5">
                            <Avatar name={school.name} size="sm" />
                            <div className="min-w-0">
                              <Link to={`/admin/schools/${school.id}`} className="block truncate text-xs font-semibold text-ink hover:text-brand">{school.name}</Link>
                              <span className="block truncate text-[10px] text-muted">{owner?.name}</span>
                            </div>
                          </div>
                        </td>
                        <td><Badge tone={profile?.planId === 'plan-pro' ? 'purple' : 'neutral'}>{planName(profile)}</Badge></td>
                        <td className="hidden sm:table-cell text-xs text-muted">{usage.learners}</td>
                        <td><StatusPill status={status} t={t} /></td>
                        <td><Link to={`/admin/schools/${school.id}`} className="text-[11px] font-semibold text-brand hover:underline">{t('common.view')}</Link></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={School} title={t('adminSchools.noSchools')} description={t('adminSchools.noSchoolsDesc')} />
          )}
        </Card>

        <Card>
          <CardHeader title={t('admin.recentActivity')} description={t('adminActivity.subtitle')} action={<Link to="/admin/activity" className="text-[11px] font-semibold text-brand hover:underline">{t('common.viewAll')}</Link>} />
          <div className="p-4">
            {activity.length ? (
              <div className="space-y-3.5">
                {activity.map((entry) => {
                  const actor = state.users.find((item) => item.id === entry.actorId)
                  const school = state.schools.find((item) => item.id === entry.schoolId)
                  return (
                    <div key={entry.id} className="flex items-start gap-2.5">
                      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-soft text-brand"><Activity size={13} /></span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] leading-relaxed text-ink">
                          <span className="font-semibold">{actor?.name || 'Tiwanza'}</span>{' '}
                          {entry.schoolId ? t(`activity.${activityKey(entry.type)}`) : t(`activity.${activityKey(entry.type)}`)}
                        </p>
                        <p className="mt-0.5 text-[9px] text-muted">{school?.name ? `${school.name} · ` : ''}{date(entry.createdAt)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <EmptyState compact icon={Activity} title={t('admin.noActivity')} />
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title={t('admin.topSchools')} description={t('admin.topSchoolsDesc')} action={<Link to="/admin/schools" className="text-[11px] font-semibold text-brand hover:underline">{t('common.viewAll')}</Link>} />
          <div className="divide-y divide-line">
            {topSchools.map(({ school, usage }, index) => (
              <Link key={school.id} to={`/admin/schools/${school.id}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-surface">
                <span className={cn('grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10px] font-bold', index === 0 ? 'bg-amber-100 text-amber-800' : 'bg-surface text-muted')}>{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-ink">{school.name}</p>
                  <ProgressBar value={Math.min(100, usage.learners * 10)} size="sm" className="mt-1.5 max-w-[180px]" />
                </div>
                <span className="text-[11px] font-semibold text-muted">{usage.learners} {t('common.students')}</span>
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title={t('admin.trainersOverview')} description={t('adminUsers.subtitle')} action={<Link to="/admin/users" className="text-[11px] font-semibold text-brand hover:underline">{t('common.viewAll')}</Link>} />
          <div className="divide-y divide-line">
            {trainers.slice(0, 4).map((row) => (
              <div key={row.user.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar name={row.user.name} size="sm" tone="blue" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-ink">{row.user.name}</p>
                  <p className="truncate text-[10px] text-muted">{row.school?.name || t('adminUsers.noSchool')}</p>
                </div>
                <div className="text-end">
                  <Badge tone={row.plan?.code === 'pro' ? 'purple' : 'neutral'}>{row.plan ? (language === 'ar' ? row.plan.nameAr : row.plan.nameFr) : '—'}</Badge>
                  <p className="mt-1 text-[9px] text-muted">{row.usage?.learners || 0} {t('common.students')}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

export function StatusPill({ status, t }) {
  const map = {
    published: ['success', t('trainerCourses.statusPublished')],
    draft: ['warning', t('trainerCourses.statusDraft')],
    unpublished: ['neutral', t('trainerCourses.statusArchived')],
    archived: ['neutral', t('trainerCourses.statusArchived')],
    active: ['success', t('common.active')],
    validated: ['success', t('common.approved')],
    pending: ['warning', t('common.pending')],
    expired: ['danger', t('common.expired')],
    rejected: ['danger', t('common.rejected')],
    cancelled: ['neutral', t('common.inactive')],
    suspended: ['danger', t('common.suspended')],
    failed: ['danger', t('common.rejected')],
    refunded: ['blue', t('payments.refunded')],
    none: ['neutral', t('common.none')],
  }
  const [tone, label] = map[status] || ['neutral', status || '—']
  return <Badge tone={tone} dot>{label}</Badge>
}

export function activityKey(type) {
  const map = {
    trainer_registered: 'trainerJoined',
    school_created: 'schoolCreated',
    course_created: 'createdCourse',
    course_published: 'publishedCourse',
    course_updated: 'updatedCourse',
    course_deleted: 'deletedCourse',
    enrollment_created: 'enrolled',
    lesson_completed: 'completedLesson',
    quiz_passed: 'passedQuiz',
    course_payment_pending: 'submittedPayment',
    course_payment_validated: 'paymentApproved',
    course_payment_rejected: 'paymentRejected',
    subscription_manual: 'subscriptionSubmitted',
    subscription_paid: 'subscriptionApproved',
    subscription_approved: 'subscriptionApproved',
    subscription_rejected: 'paymentRejected',
    subscription_free: 'planChanged',
    plan_updated: 'planChanged',
    announcement_published: 'announcementPublished',
    comment_created: 'commentAdded',
    event_created: 'eventCreated',
    support_requested: 'supportRequest',
  }
  return map[type] || 'updatedCourse'
}
