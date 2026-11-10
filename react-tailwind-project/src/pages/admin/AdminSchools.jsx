import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Activity,
  ArrowLeft,
  Banknote,
  BookOpen,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  ExternalLink,
  Globe2,
  Mail,
  MapPin,
  MoreHorizontal,
  Search,
  School as SchoolIcon,
  ShieldCheck,
  Users,
  Wallet,
} from 'lucide-react'
import { useI18n } from '../../i18n/I18nContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { useTiwanzaStore } from '../../data/store.js'
import {
  getPlan,
  getPlanUsage,
  getSchool,
  getSchoolCourses,
  getSchoolEnrollments,
  getSchoolEvents,
  getTrainerProfile,
  getTrainerStats,
  getLearnersForSchool,
  searchLearners,
  getCoursePaymentForEnrollment,
} from '../../data/selectors.js'
import { updateSchool } from '../../data/services.js'
import { Avatar, Badge, Button, Card, CardHeader, ConfirmDialog, EmptyState, IconButton, Input, PageHeader, ProgressBar, SearchField, Select, StatCard, Table } from '../../components/ui.jsx'
import { StatusPill, activityKey } from './AdminDashboard.jsx'
import { cn } from '../../lib/utils.js'

export function AdminSchools() {
  const { t, language, number, date } = useI18n()
  const state = useTiwanzaStore()
  const [query, setQuery] = useState('')
  const [planFilter, setPlanFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [target, setTarget] = useState(null)

  const rows = useMemo(
    () =>
      state.schools.map((school) => {
        const owner = state.users.find((user) => user.id === school.trainerId)
        const profile = getTrainerProfile(state, school.trainerId)
        const plan = getPlan(state, profile?.planId)
        const subscription = state.subscriptions.find((item) => item.id === profile?.subscriptionId)
        const usage = getPlanUsage(state, school.id)
        const status = school.status === 'suspended' ? 'suspended' : subscription?.status || 'none'
        return { school, owner, plan, subscription, usage, status }
      }),
    [state],
  )

  const filtered = rows.filter((row) => {
    const value = query.toLowerCase().trim()
    const matchesQuery =
      !value ||
      row.school.name.toLowerCase().includes(value) ||
      row.school.slug.toLowerCase().includes(value) ||
      row.owner?.name?.toLowerCase().includes(value) ||
      row.owner?.email?.toLowerCase().includes(value)
    const matchesPlan = planFilter === 'all' || row.plan?.code === planFilter
    const matchesStatus = statusFilter === 'all' || row.status === statusFilter
    return matchesQuery && matchesPlan && matchesStatus
  })

  function toggleSuspension() {
    if (!target) return
    updateSchool(target.school.id, { status: target.school.status === 'suspended' ? 'active' : 'suspended' })
    setTarget(null)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={t('nav.platform')}
        title={t('adminSchools.title')}
        description={t('adminSchools.subtitle')}
        actions={<Badge tone="brand">{t('adminSchools.resultsCount', { count: filtered.length })}</Badge>}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('admin.statSchools')} value={number(state.schools.length)} icon={SchoolIcon} />
        <StatCard label={t('adminSchools.active')} value={number(rows.filter((row) => row.status === 'active').length)} icon={CheckCircle2} tone="success" />
        <StatCard label={t('admin.statProSchools')} value={number(rows.filter((row) => row.plan?.code === 'pro').length)} icon={ShieldCheck} tone="purple" />
        <StatCard label={t('admin.statPending')} value={number(rows.filter((row) => row.status === 'pending').length)} icon={CreditCard} tone="amber" />
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
          <SearchField value={query} onChange={setQuery} placeholder={t('adminSchools.searchPlaceholder')} className="w-full sm:w-72" />
          <Select value={planFilter} onChange={(event) => setPlanFilter(event.target.value)} className="w-auto min-w-36">
            <option value="all">{t('adminSchools.allPlans')}</option>
            <option value="free">{t('common.free')}</option>
            <option value="pro">{t('common.pro')}</option>
          </Select>
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="w-auto min-w-36">
            <option value="all">{t('adminSchools.allStatuses')}</option>
            <option value="active">{t('common.active')}</option>
            <option value="pending">{t('common.pending')}</option>
            <option value="expired">{t('common.expired')}</option>
            <option value="suspended">{t('common.suspended')}</option>
          </Select>
        </div>

        {filtered.length ? (
          <Table>
            <thead>
              <tr>
                <th>{t('adminSchools.tableSchool')}</th>
                <th>{t('adminSchools.tableOwner')}</th>
                <th>{t('adminSchools.tablePlan')}</th>
                <th className="hidden sm:table-cell">{t('adminSchools.tableLearners')}</th>
                <th className="hidden lg:table-cell">{t('adminSchools.tableCourses')}</th>
                <th>{t('common.status')}</th>
                <th className="text-end">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.school.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={row.school.name} size="md" />
                      <div className="min-w-0">
                        <Link to={`/admin/schools/${row.school.id}`} className="block truncate text-xs font-semibold text-ink hover:text-brand">{row.school.name}</Link>
                        <span className="flex items-center gap-1 text-[10px] text-muted"><Globe2 size={9} /> {row.school.subdomain}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <p className="truncate text-xs text-ink">{row.owner?.name || '—'}</p>
                    <p className="truncate text-[10px] text-muted">{row.owner?.email}</p>
                  </td>
                  <td><Badge tone={row.plan?.code === 'pro' ? 'purple' : 'neutral'}>{row.plan ? (language === 'ar' ? row.plan.nameAr : row.plan.nameFr) : '—'}</Badge></td>
                  <td className="hidden sm:table-cell">
                    <span className="text-xs font-medium text-ink">{number(row.usage.learners)}</span>
                    <span className="text-[10px] text-muted"> / {row.usage.limits.learners < 0 ? '∞' : row.usage.limits.learners}</span>
                  </td>
                  <td className="hidden lg:table-cell text-xs text-muted">{row.usage.courses}</td>
                  <td><StatusPill status={row.status} t={t} /></td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <Link to={`/admin/schools/${row.school.id}`}><IconButton label={t('adminSchools.viewSchool')} variant="outline" size="sm"><ChevronRight size={15} className="rtl:rotate-180" /></IconButton></Link>
                      <IconButton label={row.school.status === 'suspended' ? t('adminSchools.reactivate') : t('adminSchools.suspend')} variant={row.school.status === 'suspended' ? 'soft' : 'danger'} size="sm" onClick={() => setTarget(row)}>
                        <ShieldCheck size={14} />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState icon={SchoolIcon} title={t('adminSchools.noSchools')} description={t('adminSchools.noSchoolsDesc')} />
        )}
      </Card>

      <ConfirmDialog
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        onConfirm={toggleSuspension}
        title={target?.school.status === 'suspended' ? t('adminSchools.reactivateConfirm') : t('adminSchools.suspendConfirm')}
        description={target?.school.status === 'suspended' ? t('adminSchools.reactivateDesc') : t('adminSchools.suspendDesc')}
        confirmLabel={target?.school.status === 'suspended' ? t('adminSchools.reactivate') : t('adminSchools.suspend')}
        tone={target?.school.status === 'suspended' ? 'success' : 'danger'}
      />
    </div>
  )
}

export function AdminSchoolDetail() {
  const { schoolId } = useParams()
  const navigate = useNavigate()
  const { t, language, number, money, date } = useI18n()
  const { success } = useToast()
  const state = useTiwanzaStore()
  const [tab, setTab] = useState('overview')
  const [confirm, setConfirm] = useState(false)
  const [query, setQuery] = useState('')

  const school = getSchool(state, schoolId)
  if (!school) {
    return (
      <Card>
        <EmptyState icon={SchoolIcon} title={t('errors.notFound')} action={<Button onClick={() => navigate('/admin/schools')}>{t('adminSchoolDetail.back')}</Button>} />
      </Card>
    )
  }

  const owner = state.users.find((user) => user.id === school.trainerId)
  const profile = getTrainerProfile(state, school.trainerId)
  const plan = getPlan(state, profile?.planId)
  const subscription = state.subscriptions.find((item) => item.id === profile?.subscriptionId)
  const usage = getPlanUsage(state, school.id)
  const stats = getTrainerStats(state, school.id)
  const courses = getSchoolCourses(state, school.id)
  const learners = searchLearners(getLearnersForSchool(state, school.id), query)
  const enrollments = getSchoolEnrollments(state, school.id)
  const payments = state.coursePayments
    .filter((payment) => payment.schoolId === school.id)
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
  const activity = state.activity.filter((entry) => entry.schoolId === school.id).slice(0, 12)
  const status = school.status === 'suspended' ? 'suspended' : subscription?.status || 'none'

  const tabs = [
    ['overview', t('adminSchoolDetail.overview')],
    ['courses', t('adminSchoolDetail.courses'), courses.length],
    ['learners', t('adminSchoolDetail.learners'), learners.length],
    ['payments', t('adminSchoolDetail.payments'), payments.length],
    ['activity', t('adminSchoolDetail.activity')],
  ]

  function toggleSuspension() {
    updateSchool(school.id, { status: school.status === 'suspended' ? 'active' : 'suspended' })
    setConfirm(false)
    success(school.status === 'suspended' ? t('adminSchools.reactivateSuccess') : t('adminSchools.suspendSuccess'))
  }

  return (
    <div className="space-y-5">
      <button type="button" onClick={() => navigate('/admin/schools')} className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-ink">
        <ArrowLeft size={14} className="rtl:rotate-180" /> {t('adminSchoolDetail.back')}
      </button>

      <Card className="overflow-hidden">
        <div className="brand-gradient h-24" />
        <div className="px-5 pb-5">
          <div className="-mt-8 flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-end gap-3">
              <span className="grid h-16 w-16 place-items-center rounded-2xl border-4 border-white bg-brand-soft text-2xl font-bold text-brand shadow-sm">{school.name.slice(0, 1)}</span>
              <div className="pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="brand-font text-xl font-bold text-ink">{school.name}</h1>
                  <StatusPill status={status} t={t} />
                </div>
                <p className="mt-0.5 text-xs text-muted" dir="ltr">{school.subdomain}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" icon={ExternalLink} onClick={() => navigate(`/s/${school.slug}`)}>{t('adminSchoolDetail.viewPublicSite')}</Button>
              <Button variant={school.status === 'suspended' ? 'success' : 'dangerSoft'} size="sm" icon={ShieldCheck} onClick={() => setConfirm(true)}>
                {school.status === 'suspended' ? t('adminSchoolDetail.reactivateSchool') : t('adminSchoolDetail.suspendSchool')}
              </Button>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[11px] text-muted">
            <span className="inline-flex items-center gap-1.5"><Users size={12} /> {owner?.name}</span>
            <span className="inline-flex items-center gap-1.5"><Mail size={12} /> {school.contactEmail || owner?.email}</span>
            <span className="inline-flex items-center gap-1.5"><MapPin size={12} /> {school.city || '—'}</span>
            <span className="inline-flex items-center gap-1.5"><CalendarDays size={12} /> {t('adminSchoolDetail.startedOn')} {date(school.createdAt)}</span>
          </div>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('adminSchoolDetail.statsLearners')} value={number(usage.learners)} icon={Users} />
        <StatCard label={t('adminSchoolDetail.statsCourses')} value={number(courses.length)} icon={BookOpen} tone="blue" />
        <StatCard label={t('adminSchoolDetail.statsRevenue')} value={money(stats.revenue)} icon={Wallet} tone="amber" />
        <StatCard label={t('adminSchoolDetail.statsCompletion')} value={`${stats.averageCompletion}%`} icon={Activity} tone="purple" />
      </div>

      <Card>
        <div className="no-scrollbar flex overflow-x-auto border-b border-line">
          {tabs.map(([value, label, count]) => (
            <button key={value} type="button" onClick={() => setTab(value)} className={cn('inline-flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-3 text-xs font-semibold transition', tab === value ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-ink')}>
              {label}
              {count !== undefined ? <span className={cn('rounded-full px-1.5 py-0.5 text-[9px]', tab === value ? 'bg-brand-soft text-brand' : 'bg-surface text-muted')}>{count}</span> : null}
            </button>
          ))}
        </div>

        {tab === 'overview' ? (
          <div className="grid gap-5 p-5 lg:grid-cols-[1.2fr_1fr]">
            <div className="space-y-5">
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">{t('adminSchoolDetail.schoolInfo')}</h3>
                <dl className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
                  <Info label={t('adminSchoolDetail.slug')} value={school.subdomain} dir="ltr" />
                  <Info label={t('adminSchoolDetail.language')} value={school.language === 'ar' ? t('common.arabic') : t('common.french')} />
                  <Info label={t('adminSchoolDetail.category')} value={school.category || '—'} />
                  <Info label={t('adminSchoolDetail.startedOn')} value={date(school.createdAt)} />
                </dl>
                <div className="mt-3 rounded-xl bg-surface/70 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{t('adminSchoolDetail.description')}</p>
                  <p className="mt-1 text-xs leading-relaxed text-ink">{school.description || t('adminSchoolDetail.noDescription')}</p>
                </div>
              </section>
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">{t('adminSchoolDetail.ownerInfo')}</h3>
                <div className="mt-3 flex items-center gap-3 rounded-xl border border-line p-3">
                  <Avatar name={owner?.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-ink">{owner?.name}</p>
                    <p className="truncate text-[10px] text-muted">{owner?.email}</p>
                  </div>
                  <a href={`mailto:${owner?.email}`}><Button variant="secondary" size="xs" icon={Mail}>{t('adminSchoolDetail.contactOwner')}</Button></a>
                </div>
              </section>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-line p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-ink">{t('adminSchoolDetail.planInfo')}</h3>
                  <Badge tone={plan?.code === 'pro' ? 'purple' : 'neutral'}>{plan ? (language === 'ar' ? plan.nameAr : plan.nameFr) : '—'}</Badge>
                </div>
                <div className="mt-3 space-y-3">
                  <UsageRow label={t('subscription.usageCourses')} used={usage.published} limit={usage.limits.publishedCourses} />
                  <UsageRow label={t('subscription.usageLearners')} used={usage.learners} limit={usage.limits.learners} />
                  <UsageRow label={t('limits.storage')} used={usage.storageUsedGb} limit={usage.limits.storageGb} unit="Go" />
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-[11px]">
                  <span className="text-muted">{t('adminSchoolDetail.subscriptionStatus')}</span>
                  <StatusPill status={subscription?.status || 'none'} t={t} />
                </div>
                {subscription?.endsAt ? (
                  <p className="mt-2 text-[10px] text-muted">{t('adminSchoolDetail.expiresOn')} {date(subscription.endsAt)}</p>
                ) : null}
              </div>
              <div className="rounded-xl border border-line p-4">
                <h3 className="text-xs font-semibold text-ink">{t('admin.platformHealth')}</h3>
                <div className="mt-3 space-y-2">
                  {[['Chargerly', school.paymentSettings?.chargerly?.status === 'connected'], ['CCP', school.paymentSettings?.manual?.enabled], ['Site public', school.status !== 'suspended']].map(([label, ok]) => (
                    <div key={label} className="flex items-center justify-between text-[11px]">
                      <span className="text-muted">{label}</span>
                      <Badge tone={ok ? 'success' : 'danger'} dot>{ok ? t('admin.serviceOperational') : t('admin.serviceDown')}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {tab === 'courses' ? (
          courses.length ? (
            <Table>
              <thead><tr><th>{t('common.course')}</th><th>{t('common.status')}</th><th>{t('common.students')}</th><th>{t('common.price')}</th><th>{t('common.date')}</th></tr></thead>
              <tbody>
                {courses.map((course) => {
                  const count = enrollments.filter((enrollment) => enrollment.courseId === course.id && enrollment.status === 'active').length
                  return (
                    <tr key={course.id}>
                      <td><p className="max-w-xs truncate text-xs font-semibold text-ink">{course.title}</p><p className="text-[10px] text-muted">{course.category}</p></td>
                      <td><Badge tone={course.status === 'published' ? 'success' : 'neutral'}>{t(`common.${course.status}`)}</Badge></td>
                      <td className="text-xs text-muted">{count}</td>
                      <td className="text-xs text-ink">{course.isFree ? t('common.free') : money(course.priceDA)}</td>
                      <td className="text-xs text-muted">{date(course.createdAt)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          ) : <EmptyState icon={BookOpen} title={t('adminSchoolDetail.noCourses')} />
        ) : null}

        {tab === 'learners' ? (
          <div>
            <div className="border-b border-line p-3"><SearchField value={query} onChange={setQuery} className="sm:w-72" /></div>
            {learners.length ? (
              <Table>
                <thead><tr><th>{t('common.name')}</th><th>{t('common.email')}</th><th>{t('common.courses')}</th><th>{t('common.progress')}</th></tr></thead>
                <tbody>
                  {learners.map((row) => (
                    <tr key={row.learner.id}>
                      <td><div className="flex items-center gap-2"><Avatar name={row.learner.name} size="sm" /><span className="text-xs font-medium text-ink">{row.learner.name}</span></div></td>
                      <td className="text-xs text-muted">{row.learner.email}</td>
                      <td className="text-xs text-muted">{row.courseCount}</td>
                      <td><div className="flex items-center gap-2"><ProgressBar value={row.averageProgress} className="w-24" size="sm" /><span className="text-[10px] text-muted">{row.averageProgress}%</span></div></td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : <EmptyState icon={Users} title={t('adminSchoolDetail.noLearners')} />}
          </div>
        ) : null}

        {tab === 'payments' ? (
          payments.length ? (
            <Table>
              <thead><tr><th>{t('adminPayments.tableLearner')}</th><th>{t('adminPayments.tableCourse')}</th><th>{t('common.amount')}</th><th>{t('common.date')}</th><th>{t('common.status')}</th></tr></thead>
              <tbody>
                {payments.map((payment) => {
                  const learner = state.users.find((item) => item.id === payment.learnerId)
                  const course = state.courses.find((item) => item.id === payment.courseId)
                  return (
                    <tr key={payment.id}>
                      <td className="text-xs font-medium text-ink">{learner?.name}</td>
                      <td className="max-w-xs truncate text-xs text-muted">{course?.title}</td>
                      <td className="text-xs font-semibold text-ink">{money(payment.amount)}</td>
                      <td className="text-xs text-muted">{date(payment.submittedAt)}</td>
                      <td><StatusPill status={payment.status} t={t} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          ) : <EmptyState icon={Wallet} title={t('adminSchoolDetail.noPayments')} />
        ) : null}

        {tab === 'activity' ? (
          activity.length ? (
            <div className="divide-y divide-line">
              {activity.map((entry) => {
                const actor = state.users.find((item) => item.id === entry.actorId)
                return (
                  <div key={entry.id} className="flex items-start gap-3 px-4 py-3">
                    <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-soft text-brand"><Activity size={13} /></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-ink"><span className="font-semibold">{actor?.name || 'Tiwanza'}</span> — {t(`activity.${activityKey(entry.type)}`)}</p>
                      <p className="mt-0.5 text-[10px] text-muted">{date(entry.createdAt)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : <EmptyState icon={Activity} title={t('admin.noActivity')} />
        ) : null}
      </Card>

      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={toggleSuspension}
        title={school.status === 'suspended' ? t('adminSchools.reactivateConfirm') : t('adminSchools.suspendConfirm')}
        description={school.status === 'suspended' ? t('adminSchools.reactivateDesc') : t('adminSchools.suspendDesc')}
        confirmLabel={school.status === 'suspended' ? t('adminSchools.reactivate') : t('adminSchools.suspend')}
        tone={school.status === 'suspended' ? 'success' : 'danger'}
      />
    </div>
  )
}

function Info({ label, value, dir }) {
  return (
    <div>
      <dt className="text-[10px] text-muted">{label}</dt>
      <dd className="mt-0.5 truncate text-xs font-medium text-ink" dir={dir}>{value}</dd>
    </div>
  )
}

function UsageRow({ label, used, limit, unit = '' }) {
  const unlimited = limit < 0
  const value = unlimited ? 0 : Math.min(100, Math.round((used / Math.max(limit, 1)) * 100))
  return (
    <div>
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-muted">{label}</span>
        <span className="font-medium text-ink">{used}{unit ? ` ${unit}` : ''} / {unlimited ? '∞' : `${limit}${unit ? ` ${unit}` : ''}`}</span>
      </div>
      <ProgressBar value={unlimited ? 100 : value} size="sm" className="mt-1" tone={value > 85 ? 'warning' : 'brand'} />
    </div>
  )
}
