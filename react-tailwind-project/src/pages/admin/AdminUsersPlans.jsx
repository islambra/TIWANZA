import { useMemo, useState } from 'react'
import {
  BookOpen,
  Check,
  CreditCard,
  GraduationCap,
  Mail,
  Pencil,
  School,
  ShieldCheck,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  UserRound,
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
  getTrainerProfile,
  isUnlimited,
} from '../../data/selectors.js'
import { togglePlan, updatePlan, updateUser } from '../../data/services.js'
import {
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  ConfirmDialog,
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
import { StatusPill } from './AdminDashboard.jsx'
import { cn } from '../../lib/utils.js'

export function AdminUsers() {
  const { t, number, money, date } = useI18n()
  const { success } = useToast()
  const state = useTiwanzaStore()
  const [tab, setTab] = useState('all')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [profileTarget, setProfileTarget] = useState(null)
  const [suspendTarget, setSuspendTarget] = useState(null)

  const counts = {
    all: state.users.length,
    admin: state.users.filter((user) => user.role === 'admin').length,
    trainer: state.users.filter((user) => user.role === 'trainer').length,
    learner: state.users.filter((user) => user.role === 'learner').length,
  }

  const rows = state.users
    .filter((user) => tab === 'all' || user.role === tab)
    .filter((user) => status === 'all' || user.status === status)
    .filter((user) => {
      const value = query.toLowerCase().trim()
      return !value || user.name.toLowerCase().includes(value) || user.email.toLowerCase().includes(value)
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  const tabs = [
    { value: 'all', label: t('adminUsers.tabAll'), count: counts.all },
    { value: 'admin', label: t('adminUsers.tabAdmins'), count: counts.admin },
    { value: 'trainer', label: t('adminUsers.tabTrainers'), count: counts.trainer },
    { value: 'learner', label: t('adminUsers.tabLearners'), count: counts.learner },
  ]

  function toggleStatus() {
    if (!suspendTarget || suspendTarget.role === 'admin') return
    const nextStatus = suspendTarget.status === 'suspended' ? 'active' : 'suspended'
    updateUser(suspendTarget.id, { status: nextStatus })
    success(nextStatus === 'suspended' ? t('adminUsers.suspendSuccess') : t('adminUsers.reactivateSuccess'))
    setSuspendTarget(null)
  }

  function learnerStats(user) {
    const enrollments = state.enrollments.filter((item) => item.learnerId === user.id)
    const spent = state.coursePayments
      .filter((payment) => payment.learnerId === user.id && payment.status === 'validated')
      .reduce((sum, payment) => sum + payment.amount, 0)
    return { enrolled: enrollments.length, spent }
  }

  function trainerStats(user) {
    const profile = getTrainerProfile(state, user.id)
    const school = profile?.schoolId ? getSchool(state, profile.schoolId) : null
    const usage = school ? getPlanUsage(state, school.id) : null
    return { school, usage, plan: getPlan(state, profile?.planId) }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={t('nav.platform')}
        title={t('adminUsers.title')}
        description={t('adminUsers.subtitle')}
        actions={<Badge tone="brand" dot>{number(state.users.length)} {t('nav.users').toLowerCase()}</Badge>}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label={t('admin.statTrainers')} value={number(counts.trainer)} icon={GraduationCap} tone="blue" />
        <StatCard label={t('admin.statLearners')} value={number(counts.learner)} icon={Users} tone="success" />
        <StatCard label={t('admin.usersSuspended')} value={number(state.users.filter((user) => user.status === 'suspended').length)} icon={ShieldCheck} tone="danger" />
      </div>

      <Card>
        <div className="flex flex-col gap-2 border-b border-line p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Tabs items={tabs} value={tab} onChange={setTab} variant="pill" className="border-0" />
            <SearchField value={query} onChange={setQuery} placeholder={t('adminUsers.searchPlaceholder')} className="w-full sm:w-72" />
          </div>
          <div className="flex items-center gap-2">
            <Select value={status} onChange={(event) => setStatus(event.target.value)} className="w-auto min-w-36">
              <option value="all">{t('adminUsers.allStatuses')}</option>
              <option value="active">{t('common.active')}</option>
              <option value="suspended">{t('common.suspended')}</option>
            </Select>
            <Badge tone="neutral">{t('adminUsers.resultsCount', { count: rows.length })}</Badge>
          </div>
        </div>

        {rows.length ? (
          <Table>
            <thead>
              <tr>
                <th>{t('adminUsers.tableUser')}</th>
                <th>{t('adminUsers.tableRole')}</th>
                <th className="hidden md:table-cell">{t('adminUsers.tableSchool')}</th>
                <th>{t('adminUsers.tableStatus')}</th>
                <th className="hidden lg:table-cell">{t('adminUsers.tableJoined')}</th>
                <th className="text-end">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((user) => {
                const school = user.schoolId ? getSchool(state, user.schoolId) : null
                return (
                  <tr key={user.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={user.name} size="sm" tone={user.role === 'admin' ? 'purple' : user.role === 'trainer' ? 'blue' : 'brand'} />
                        <div className="min-w-0">
                          <button type="button" onClick={() => setProfileTarget(user)} className="block max-w-[190px] truncate text-xs font-semibold text-ink hover:text-brand">{user.name}</button>
                          <span className="block max-w-[190px] truncate text-[10px] text-muted">{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge tone={user.role === 'admin' ? 'purple' : user.role === 'trainer' ? 'blue' : 'brand'}>
                        {user.role === 'admin' ? <ShieldCheck size={10} /> : user.role === 'trainer' ? <GraduationCap size={10} /> : <BookOpen size={10} />}
                        {t(`roles.${user.role}`)}
                      </Badge>
                    </td>
                    <td className="hidden md:table-cell text-xs text-muted">{school?.name || <span className="text-muted/60">{t('adminUsers.noSchool')}</span>}</td>
                    <td><StatusPill status={user.status} t={t} /></td>
                    <td className="hidden lg:table-cell text-[11px] text-muted">{date(user.createdAt)}</td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="xs" icon={UserRound} onClick={() => setProfileTarget(user)}>{t('adminUsers.viewProfile')}</Button>
                        {user.role !== 'admin' ? (
                          <Button variant={user.status === 'suspended' ? 'soft' : 'dangerSoft'} size="xs" icon={ShieldCheck} onClick={() => setSuspendTarget(user)}>
                            {user.status === 'suspended' ? t('adminUsers.reactivate') : t('adminUsers.suspend')}
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        ) : (
          <EmptyState icon={Users} title={t('adminUsers.noUsers')} description={t('adminUsers.noUsersDesc')} />
        )}
      </Card>

      <Modal
        open={Boolean(profileTarget)}
        onClose={() => setProfileTarget(null)}
        title={t('adminUsers.profileTitle')}
        size="lg"
        footer={<Button variant="secondary" onClick={() => setProfileTarget(null)}>{t('common.close')}</Button>}
      >
        {profileTarget ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4 rounded-xl bg-surface p-4">
              <Avatar name={profileTarget.name} size="xl" tone={profileTarget.role === 'trainer' ? 'blue' : profileTarget.role === 'admin' ? 'purple' : 'brand'} />
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold text-ink">{profileTarget.name}</p>
                <p className="text-xs text-muted">{profileTarget.email}</p>
                <div className="mt-1.5 flex gap-1.5">
                  <Badge tone={profileTarget.role === 'admin' ? 'purple' : profileTarget.role === 'trainer' ? 'blue' : 'brand'}>{t(`roles.${profileTarget.role}`)}</Badge>
                  <StatusPill status={profileTarget.status} t={t} />
                </div>
              </div>
              <a href={`mailto:${profileTarget.email}`}><Button variant="secondary" size="sm" icon={Mail}>{t('common.contact')}</Button></a>
            </div>

            <div className="grid gap-3 rounded-xl border border-line p-4 text-xs sm:grid-cols-2">
              <Detail label={t('adminUsers.tableJoined')} value={date(profileTarget.createdAt)} />
              <Detail label={t('adminUsers.lastLogin')} value={profileTarget.lastActiveAt ? date(profileTarget.lastActiveAt) : t('adminUsers.neverLoggedIn')} />
              {profileTarget.role === 'trainer' ? <TrainerProfileDetails user={profileTarget} /> : null}
              {profileTarget.role === 'learner' ? <LearnerProfileDetails user={profileTarget} /> : null}
            </div>

            {profileTarget.role === 'learner' ? (
              <div className="rounded-xl border border-line p-4">
                <p className="text-xs font-semibold text-ink">{t('learner.myCourses')}</p>
                <div className="mt-2 space-y-2">
                  {state.enrollments.filter((item) => item.learnerId === profileTarget.id).slice(0, 4).map((enrollment) => {
                    const course = state.courses.find((item) => item.id === enrollment.courseId)
                    return (
                      <div key={enrollment.id} className="flex items-center justify-between gap-2 text-[11px]">
                        <span className="truncate text-muted">{course?.title}</span>
                        <StatusPill status={enrollment.status} t={t} />
                      </div>
                    )
                  })}
                  {!state.enrollments.some((item) => item.learnerId === profileTarget.id) ? <p className="text-[11px] text-muted">{t('common.empty')}</p> : null}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(suspendTarget)}
        onClose={() => setSuspendTarget(null)}
        onConfirm={toggleStatus}
        title={suspendTarget?.status === 'suspended' ? t('adminUsers.reactivate') : t('adminUsers.suspendConfirm')}
        description={suspendTarget?.status === 'suspended' ? t('adminUsers.reactivateSuccess') : t('adminUsers.suspendDesc')}
        confirmLabel={suspendTarget?.status === 'suspended' ? t('adminUsers.reactivate') : t('adminUsers.suspend')}
        tone={suspendTarget?.status === 'suspended' ? 'success' : 'danger'}
      />
    </div>
  )
}

function TrainerProfileDetails({ user }) {
  const { t } = useI18n()
  const state = useTiwanzaStore()
  const profile = getTrainerProfile(state, user.id)
  const school = profile?.schoolId ? getSchool(state, profile.schoolId) : null
  const plan = getPlan(state, profile?.planId)
  return (
    <>
      <Detail label={t('adminUsers.tableSchool')} value={school?.name || t('adminUsers.noSchool')} />
      <Detail label={t('adminSubscriptions.tablePlan')} value={plan?.nameFr || '—'} />
    </>
  )
}

function LearnerProfileDetails({ user }) {
  const { t, money } = useI18n()
  const state = useTiwanzaStore()
  const enrollments = state.enrollments.filter((item) => item.learnerId === user.id)
  const spent = state.coursePayments.filter((item) => item.learnerId === user.id && item.status === 'validated').reduce((sum, item) => sum + item.amount, 0)
  return (
    <>
      <Detail label={t('adminUsers.coursesEnrolled')} value={String(enrollments.length)} />
      <Detail label={t('adminUsers.totalSpent')} value={money(spent)} />
    </>
  )
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-[10px] text-muted">{label}</p>
      <p className="mt-0.5 truncate font-medium text-ink">{value}</p>
    </div>
  )
}

export function AdminPlans() {
  const { t, language, number, money } = useI18n()
  const { success } = useToast()
  const state = useTiwanzaStore()
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm] = useState(null)
  const plans = state.plans.slice().sort((a, b) => a.order - b.order)

  function startEdit(plan) {
    setEditTarget(plan)
    setForm({
      priceDA: plan.priceDA,
      publishedCourses: plan.limits.publishedCourses,
      learners: plan.limits.learners,
      storageGb: plan.limits.storageGb,
      features: (language === 'ar' ? plan.featuresAr : plan.featuresFr).join('\n'),
      enabled: plan.enabled,
    })
  }

  function save() {
    if (!editTarget || !form) return
    const features = form.features.split('\n').map((line) => line.trim()).filter(Boolean)
    updatePlan(editTarget.id, {
      priceDA: Number(form.priceDA) || 0,
      enabled: form.enabled,
      limits: {
        publishedCourses: Number(form.publishedCourses),
        paidCourses: Number(form.publishedCourses),
        learners: Number(form.learners),
        storageGb: Number(form.storageGb),
      },
      [language === 'ar' ? 'featuresAr' : 'featuresFr']: features,
    })
    success(t('adminPlans.saveSuccess'))
    setEditTarget(null)
    setForm(null)
  }

  function planStats(plan) {
    const profiles = state.trainerProfiles.filter((profile) => profile.planId === plan.id)
    const schools = profiles.map((profile) => profile.schoolId).filter(Boolean)
    const payments = state.subscriptionPayments.filter((payment) => payment.planId === plan.id && payment.status === 'validated')
    return { count: schools.length, revenue: payments.reduce((sum, payment) => sum + payment.amount, 0) }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={t('nav.platform')}
        title={t('adminPlans.title')}
        description={t('adminPlans.subtitle')}
        actions={<Badge tone="brand">{plans.length} {t('subscription.plan')}</Badge>}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {plans.map((plan) => {
          const stats = planStats(plan)
          const isPro = plan.code === 'pro'
          return (
            <Card key={plan.id} className={cn('overflow-hidden', isPro && 'border-brand/30')}>
              <div className={cn('flex items-start justify-between gap-3 p-5', isPro ? 'bg-gradient-to-br from-brand-soft/80 to-white' : 'bg-surface/50')}>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-ink">{language === 'ar' ? plan.nameAr : plan.nameFr}</h2>
                    <Badge tone={plan.enabled ? 'success' : 'neutral'} dot>{plan.enabled ? t('common.active') : t('common.inactive')}</Badge>
                    {isPro ? <Badge tone="purple">{t('adminPlans.recommended')}</Badge> : null}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{language === 'ar' ? plan.descAr : plan.descFr}</p>
                  <div className="mt-3 flex items-end gap-1">
                    <span className="brand-font text-3xl font-bold text-ink">{money(plan.priceDA)}</span>
                    <span className="pb-1 text-[11px] text-muted">{plan.priceDA ? t('common.perMonth') : t('subscription.freeForever')}</span>
                  </div>
                </div>
                <span className={cn('grid h-11 w-11 place-items-center rounded-xl', isPro ? 'bg-brand text-white' : 'bg-white text-muted shadow-sm')}><Sparkles size={20} /></span>
              </div>

              <div className="grid grid-cols-3 divide-x divide-line border-y border-line text-center rtl:divide-x-reverse">
                <div className="p-3">
                  <p className="text-[10px] text-muted">{t('adminPlans.activeSchools')}</p>
                  <p className="text-sm font-bold text-ink">{number(stats.count)}</p>
                </div>
                <div className="p-3">
                  <p className="text-[10px] text-muted">{t('adminPlans.revenue')}</p>
                  <p className="text-sm font-bold text-ink">{money(stats.revenue)}</p>
                </div>
                <div className="p-3">
                  <p className="text-[10px] text-muted">{t('adminPlans.limits')}</p>
                  <p className="text-sm font-bold text-ink">{isUnlimited(plan.limits.learners) ? '∞' : plan.limits.learners}</p>
                </div>
              </div>

              <div className="p-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <LimitRow label={t('adminPlans.maxCourses')} value={plan.limits.publishedCourses} />
                  <LimitRow label={t('adminPlans.maxLearners')} value={plan.limits.learners} />
                  <LimitRow label={t('adminPlans.maxTrainers')} value={plan.limits.trainers} />
                  <LimitRow label={t('limits.storage')} value={plan.limits.storageGb} unit="Go" />
                </div>
                <div className="mt-4 space-y-1.5">
                  {(language === 'ar' ? plan.featuresAr : plan.featuresFr).map((feature) => (
                    <div key={feature} className="flex items-start gap-2 text-[11px] text-muted"><Check size={12} className="mt-0.5 shrink-0 text-brand" />{feature}</div>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button variant="secondary" size="sm" icon={Pencil} onClick={() => startEdit(plan)}>{t('adminPlans.editPlan')}</Button>
                  <Button
                    variant={plan.enabled ? 'ghost' : 'soft'}
                    size="sm"
                    icon={plan.enabled ? ToggleRight : ToggleLeft}
                    onClick={() => { togglePlan(plan.id, !plan.enabled); success(t('adminPlans.saveSuccess')) }}
                  >
                    {plan.enabled ? t('common.inactive') : t('common.active')}
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-line bg-brand-soft/50 p-4 text-xs leading-relaxed text-brand-dark">{t('adminPlans.freeNotice')}</div>
        <div className="rounded-xl border border-line bg-surface p-4 text-xs leading-relaxed text-muted">{t('adminPlans.proNotice')}</div>
      </div>

      <Modal
        open={Boolean(editTarget)}
        onClose={() => { setEditTarget(null); setForm(null) }}
        title={t('adminPlans.editPlan')}
        description={editTarget ? (language === 'ar' ? editTarget.nameAr : editTarget.nameFr) : ''}
        footer={<><Button variant="secondary" onClick={() => { setEditTarget(null); setForm(null) }}>{t('common.cancel')}</Button><Button onClick={save}>{t('common.save')}</Button></>}
      >
        {form ? (
          <div className="space-y-4">
            <div>
              <Label>{t('adminPlans.priceDA')}</Label>
              <Input type="number" value={form.priceDA} onChange={(event) => setForm({ ...form, priceDA: event.target.value })} />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div><Label>{t('adminPlans.maxCourses')}</Label><Input type="number" value={form.publishedCourses} onChange={(event) => setForm({ ...form, publishedCourses: event.target.value })} /></div>
              <div><Label>{t('adminPlans.maxLearners')}</Label><Input type="number" value={form.learners} onChange={(event) => setForm({ ...form, learners: event.target.value })} /></div>
              <div><Label>{t('limits.storage')} (Go)</Label><Input type="number" value={form.storageGb} onChange={(event) => setForm({ ...form, storageGb: event.target.value })} /></div>
            </div>
            <p className="text-[10px] text-muted">{t('common.unlimited')} = -1</p>
            <div>
              <Label>{t('adminPlans.features')}</Label>
              <Textarea rows={6} value={form.features} onChange={(event) => setForm({ ...form, features: event.target.value })} />
            </div>
            <Checkbox checked={form.enabled} onChange={(event) => setForm({ ...form, enabled: event.target.checked })} label={t('common.active')} />
            <p className="text-[10px] text-muted">{t('adminPlans.simulatedNote')}</p>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}

function LimitRow({ label, value, unit = '' }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-surface/70 px-3 py-2 text-[11px]">
      <span className="text-muted">{label}</span>
      <span className="font-semibold text-ink">{isUnlimited(value) ? '∞' : `${value}${unit ? ` ${unit}` : ''}`}</span>
    </div>
  )
}
