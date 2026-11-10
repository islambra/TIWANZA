import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowDownToLine,
  CheckCircle2,
  CreditCard,
  Download,
  Eye,
  GraduationCap,
  RotateCcw,
  Search,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
  XCircle,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useI18n } from '../../i18n/I18nContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { useTiwanzaStore } from '../../data/store.js'
import {
  getCourse,
  getCourseProgress,
  getLearnersForSchool,
  getSchool,
  getSchoolCourses,
  getSchoolEnrollments,
  getSalesRows,
} from '../../data/selectors.js'
import {
  approveCoursePayment,
  manualEnroll,
  reactivateLearner,
  refundCoursePayment,
  rejectCoursePayment,
  suspendLearner,
} from '../../data/services.js'
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
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
import { StatusPill } from '../admin/AdminDashboard.jsx'
import { cn, downloadCsv } from '../../lib/utils.js'

function useSchool() {
  const { user } = useAuth()
  const state = useTiwanzaStore()
  const school = getSchool(state, user?.schoolId)
  const courses = school ? getSchoolCourses(state, school.id) : []
  return { user, state, school, courses }
}

export function TrainerLearners() {
  const { user, state, school, courses } = useSchool()
  const { t, date, number, money } = useI18n()
  const { success, error: toastError } = useToast()
  const [query, setQuery] = useState('')
  const [courseId, setCourseId] = useState('all')
  const [status, setStatus] = useState('all')
  const [profileTarget, setProfileTarget] = useState(null)
  const [enrollOpen, setEnrollOpen] = useState(false)
  const [enrollForm, setEnrollForm] = useState({ courseId: '', email: '' })
  const [suspendTarget, setSuspendTarget] = useState(null)

  if (!school) return <EmptyState icon={Users} title={t('trainer.noLearnersYet')} description={t('trainer.noLearnersYetDesc')} />

  const rows = getLearnersForSchool(state, school.id)
    .filter((row) => status === 'all' || row.learner.status === status)
    .filter((row) => courseId === 'all' || row.enrollments.some((enrollment) => enrollment.courseId === courseId))
    .filter((row) => {
      const value = query.toLowerCase().trim()
      return !value || row.learner.name.toLowerCase().includes(value) || row.learner.email.toLowerCase().includes(value)
    })

  const averaged = rows.length ? Math.round(rows.reduce((sum, row) => sum + row.averageProgress, 0) / rows.length) : 0

  function enroll() {
    if (!enrollForm.courseId || !enrollForm.email.trim()) return toastError(t('errors.requiredFields'))
    const result = manualEnroll({ schoolId: school.id, courseId: enrollForm.courseId, email: enrollForm.email.trim() }, user.id)
    if (!result.ok) return toastError(t(`errors.${result.error}`) === `errors.${result.error}` ? result.error : t(`errors.${result.error}`))
    success(t('trainerLearners.enrollSuccess'))
    setEnrollOpen(false)
    setEnrollForm({ courseId: '', email: '' })
  }

  function toggleSuspend() {
    if (!suspendTarget) return
    if (suspendTarget.learner.status === 'suspended') {
      reactivateLearner(suspendTarget.learner.id, user.id)
      success(t('trainerLearners.reactivateSuccess'))
    } else {
      suspendLearner(suspendTarget.learner.id, user.id)
      success(t('trainerLearners.suspendSuccess'))
    }
    setSuspendTarget(null)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={t('nav.trainer')}
        title={t('trainerLearners.title')}
        description={t('trainerLearners.subtitle')}
        actions={<Button icon={UserPlus} onClick={() => { setEnrollForm({ courseId: courses[0]?.id || '', email: '' }); setEnrollOpen(true) }}>{t('trainerLearners.manualEnroll')}</Button>}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label={t('trainer.statLearners')} value={number(rows.length)} icon={Users} tone="brand" />
        <StatCard label={t('trainer.statAverageScore')} value={`${averaged}%`} icon={TrendingUp} tone="blue" hint={t('trainer.completionRate')} />
        <StatCard label={t('trainer.statSuspended') || t('common.suspended')} value={number(state.users.filter((item) => item.schoolId === school.id && item.role === 'learner' && item.status === 'suspended').length)} icon={XCircle} tone="danger" />
      </div>

      <Card>
        <div className="flex flex-col gap-2 border-b border-line p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <SearchField value={query} onChange={setQuery} placeholder={t('trainerLearners.searchPlaceholder')} className="w-full sm:w-72" />
            <div className="flex flex-wrap gap-2">
              <Select value={courseId} onChange={(event) => setCourseId(event.target.value)} className="w-auto min-w-40">
                <option value="all">{t('trainerLearners.allCourses')}</option>
                {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
              </Select>
              <Select value={status} onChange={(event) => setStatus(event.target.value)} className="w-auto min-w-36">
                <option value="all">{t('trainerLearners.allStatuses')}</option>
                <option value="active">{t('trainerLearners.statusActive')}</option>
                <option value="suspended">{t('trainerLearners.statusSuspended')}</option>
              </Select>
              <Badge tone="neutral">{t('trainerLearners.resultsCount', { count: rows.length })}</Badge>
            </div>
          </div>
        </div>

        {rows.length ? (
          <Table>
            <thead>
              <tr>
                <th>{t('trainerLearners.tableLearner')}</th>
                <th>{t('trainerLanguages.courses') || t('trainerLearners.tableCourses')}</th>
                <th>{t('trainerLearners.tableProgress')}</th>
                <th className="hidden md:table-cell">{t('trainerLearners.tableJoined')}</th>
                <th>{t('trainerLearners.tableStatus')}</th>
                <th className="text-end">{t('trainerLearners.tableActions')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.learner.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={row.learner.name} size="sm" />
                      <div className="min-w-0">
                        <button type="button" onClick={() => setProfileTarget(row)} className="block max-w-[200px] truncate text-xs font-semibold text-ink hover:text-brand">{row.learner.name}</button>
                        <p className="max-w-[200px] truncate text-[10px] text-muted">{row.learner.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-xs text-muted">{t('trainerLearners.coursesCount', { count: row.courseCount })}</td>
                  <td className="min-w-32"><ProgressBar value={row.averageProgress} size="sm" showLabel /></td>
                  <td className="hidden md:table-cell text-[11px] text-muted">{date(row.learner.createdAt)}</td>
                  <td><StatusPill status={row.learner.status} t={t} /></td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="xs" icon={Eye} onClick={() => setProfileTarget(row)}>{t('trainerLearners.viewLearner')}</Button>
                      <Button variant={row.learner.status === 'suspended' ? 'soft' : 'dangerSoft'} size="xs" onClick={() => setSuspendTarget(row)}>{row.learner.status === 'suspended' ? t('trainerLearners.reactivateLearner') : t('trainerLearners.suspendLearner')}</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState icon={GraduationCap} title={t('trainerLearners.noLearners')} description={t('trainerLearners.noLearnersDesc')} />
        )}
      </Card>

      <Modal open={Boolean(profileTarget)} onClose={() => setProfileTarget(null)} title={t('trainerLearners.learnerProfile')} size="lg" footer={<Button variant="secondary" onClick={() => setProfileTarget(null)}>{t('common.close')}</Button>}>
        {profileTarget ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-surface p-4">
              <Avatar name={profileTarget.learner.name} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-ink">{profileTarget.learner.name}</p>
                <p className="text-xs text-muted">{profileTarget.learner.email}</p>
              </div>
              <StatusPill status={profileTarget.learner.status} t={t} />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard label={t('trainerLearners.completedLessons') || t('learner.lessonsCompleted', { completed: 0, total: 0 })} value={`${profileTarget.averageProgress}%`} icon={CheckCircle2} tone="success" />
              <StatCard label={t('trainerLearners.tableCourses')} value={profileTarget.courseCount} icon={GraduationCap} tone="blue" />
              <StatCard label={t('trainerLearners.tableJoined')} value={date(profileTarget.learner.createdAt)} icon={Users} tone="brand" />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-ink">{t('trainerLearners.enrolledCourses')}</p>
              {profileTarget.enrollments.map((enrollment) => {
                const course = courses.find((item) => item.id === enrollment.courseId)
                const progress = getCourseProgress(state, profileTarget.learner.id, enrollment.courseId)
                return (
                  <div key={enrollment.id} className="rounded-xl border border-line p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-medium text-ink">{course?.title}</p>
                      <StatusPill status={enrollment.status} t={t} />
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <ProgressBar value={progress.percentage} size="sm" className="flex-1" />
                      <span className="text-[10px] text-muted">{progress.percentage}%</span>
                    </div>
                    <p className="mt-1 text-[10px] text-muted">{t('learner.lessonsCompleted', { completed: progress.completedLessons, total: progress.totalLessons })}</p>
                  </div>
                )
              })}
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal open={enrollOpen} onClose={() => setEnrollOpen(false)} title={t('trainerLearners.manualEnrollTitle')} description={t('trainerLearners.manualEnrollDesc')} footer={<><Button variant="secondary" onClick={() => setEnrollOpen(false)}>{t('common.cancel')}</Button><Button onClick={enroll}>{t('trainerLearners.enroll')}</Button></>}>
        <div className="space-y-4">
          <div><Label>{t('trainerLearners.selectCourse')}</Label><Select value={enrollForm.courseId} onChange={(event) => setEnrollForm({ ...enrollForm, courseId: event.target.value })}><option value="">{t('common.select')}</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</Select></div>
          <div><Label>{t('trainerLearners.email')}</Label><Input type="email" value={enrollForm.email} onChange={(event) => setEnrollForm({ ...enrollForm, email: event.target.value })} placeholder="amina@example.dz" /><p className="mt-1 text-[10px] text-muted">{t('trainerLearners.orNewLearner')}</p></div>
        </div>
      </Modal>

      <ConfirmDialog open={Boolean(suspendTarget)} onClose={() => setSuspendTarget(null)} onConfirm={toggleSuspend} title={suspendTarget?.learner.status === 'suspended' ? t('trainerLearners.reactivateLearner') : t('trainerLearners.suspendConfirm')} description={t('trainerLearners.suspendDesc')} confirmLabel={suspendTarget?.learner.status === 'suspended' ? t('trainerLearners.reactivateLearner') : t('trainerLearners.suspendLearner')} tone={suspendTarget?.learner.status === 'suspended' ? 'success' : 'danger'} />
    </div>
  )
}

export function TrainerEnrollments() {
  const { user, state, school, courses } = useSchool()
  const { t, date, money, dateTime } = useI18n()
  const { success, error: toastError } = useToast()
  const [tab, setTab] = useState('pending')
  const [courseId, setCourseId] = useState('all')
  const [detail, setDetail] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [reason, setReason] = useState('')

  if (!school) return <EmptyState icon={CreditCard} title={t('trainerEnrollments.noEnrollments')} />

  const rows = state.coursePayments
    .filter((payment) => payment.schoolId === school.id)
    .filter((payment) => tab === 'all' || payment.status === tab)
    .filter((payment) => courseId === 'all' || payment.courseId === courseId)
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))

  const pending = state.coursePayments.filter((payment) => payment.schoolId === school.id && payment.status === 'pending')

  function approve(payment) {
    approveCoursePayment(payment.id, user.id)
    success(t('trainerEnrollments.approveSuccess'))
    setDetail(null)
  }

  function reject() {
    if (!reason.trim()) return toastError(t('errors.required'))
    rejectCoursePayment(rejectTarget.id, reason.trim(), user.id)
    success(t('trainerEnrollments.rejectSuccess'))
    setRejectTarget(null)
    setReason('')
  }

  return (
    <div className="space-y-5">
      <PageHeader eyebrow={t('nav.trainer')} title={t('trainerEnrollments.title')} description={t('trainerEnrollments.subtitle')} actions={<Badge tone={pending.length ? 'warning' : 'success'} dot>{t('trainerEnrollments.pendingCount', { count: pending.length })}</Badge>} />
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label={t('trainerEnrollments.pending')} value={pending.length} icon={ClockIcon} tone="amber" />
        <StatCard label={t('trainerEnrollments.approved')} value={state.coursePayments.filter((payment) => payment.schoolId === school.id && payment.status === 'validated').length} icon={CheckCircle2} tone="success" />
        <StatCard label={t('trainerEnrollments.amountTotal')} value={money(pending.reduce((sum, payment) => sum + payment.amount, 0))} icon={Wallet} tone="brand" />
      </div>

      <Card>
        <div className="flex flex-col gap-2 border-b border-line p-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs items={[{ value: 'pending', label: t('trainerEnrollments.pending'), count: pending.length }, { value: 'all', label: t('trainerEnrollments.all'), count: state.coursePayments.filter((payment) => payment.schoolId === school.id).length }]} value={tab} onChange={setTab} variant="pill" className="border-0" />
          <Select value={courseId} onChange={(event) => setCourseId(event.target.value)} className="w-auto min-w-44">
            <option value="all">{t('trainerEnrollments.allCourses')}</option>
            {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
          </Select>
        </div>
        {rows.length ? (
          <Table>
            <thead><tr><th>{t('trainerEnrollments.tableLearner')}</th><th>{t('trainerEnrollments.tableCourse')}</th><th>{t('trainerEnrollments.tableAmount')}</th><th className="hidden sm:table-cell">{t('trainerEnrollments.tableMethod')}</th><th className="hidden md:table-cell">{t('trainerEnrollments.tableDate')}</th><th>{t('trainerEnrollments.tableStatus')}</th><th className="text-end">{t('trainerEnrollments.tableActions')}</th></tr></thead>
            <tbody>
              {rows.map((payment) => {
                const learner = state.users.find((item) => item.id === payment.learnerId)
                const course = getCourse(state, payment.courseId)
                return (
                  <tr key={payment.id}>
                    <td><p className="text-xs font-medium text-ink">{learner?.name}</p><p className="text-[10px] text-muted">{learner?.email}</p></td>
                    <td className="max-w-[220px] truncate text-xs text-muted">{course?.title}</td>
                    <td className="text-xs font-semibold text-ink">{money(payment.amount)}</td>
                    <td className="hidden sm:table-cell"><Badge tone={payment.method === 'manual' ? 'amber' : 'blue'}>{payment.method === 'manual' ? t('payments.manual') : t('payments.online')}</Badge></td>
                    <td className="hidden md:table-cell text-[11px] text-muted">{date(payment.submittedAt)}</td>
                    <td><StatusPill status={payment.status} t={t} /></td>
                    <td><div className="flex justify-end gap-1"><Button variant="ghost" size="xs" icon={Eye} onClick={() => setDetail(payment)}>{t('trainerEnrollments.viewReceipt')}</Button>{payment.status === 'pending' ? <><Button variant="success" size="xs" icon={CheckCircle2} onClick={() => approve(payment)}>{t('trainerEnrollments.approve')}</Button><Button variant="dangerSoft" size="xs" icon={XCircle} onClick={() => { setRejectTarget(payment); setReason('') }}>{t('trainerEnrollments.reject')}</Button></> : null}</div></td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        ) : (
          <EmptyState icon={CreditCard} title={t('trainerEnrollments.noEnrollments')} description={t('trainerEnrollments.noEnrollmentsDesc')} />
        )}
      </Card>

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title={t('trainerEnrollments.manualRequest')} description={detail?.reference} size="md" footer={<><Button variant="secondary" onClick={() => setDetail(null)}>{t('common.close')}</Button>{detail?.status === 'pending' ? <><Button variant="dangerSoft" onClick={() => { setRejectTarget(detail); setDetail(null) }}>{t('trainerEnrollments.reject')}</Button><Button variant="success" onClick={() => approve(detail)}>{t('trainerEnrollments.approve')}</Button></> : null}</>}>
        {detail ? <PaymentReceipt payment={detail} /> : null}
      </Modal>

      <Modal open={Boolean(rejectTarget)} onClose={() => setRejectTarget(null)} title={t('trainerEnrollments.rejectTitle')} description={t('trainerEnrollments.rejectDesc', { learner: state.users.find((item) => item.id === rejectTarget?.learnerId)?.name || '' })} footer={<><Button variant="secondary" onClick={() => setRejectTarget(null)}>{t('common.cancel')}</Button><Button variant="danger" onClick={reject}>{t('trainerEnrollments.reject')}</Button></>}>
        <Label>{t('trainerEnrollments.rejectReason')}</Label>
        <Textarea rows={3} value={reason} onChange={(event) => setReason(event.target.value)} placeholder={t('trainerEnrollments.rejectReasonPlaceholder')} />
      </Modal>
    </div>
  )
}

function ClockIcon(props) {
  return <CreditCard {...props} />
}

function PaymentReceipt({ payment }) {
  const { t, dateTime, money } = useI18n()
  const state = useTiwanzaStore()
  const learner = state.users.find((item) => item.id === payment.learnerId)
  const course = getCourse(state, payment.courseId)
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl bg-surface p-4">
        <div><p className="text-[10px] text-muted">{t('common.amount')}</p><p className="text-xl font-bold text-ink">{money(payment.amount)}</p></div>
        <StatusPill status={payment.status} t={t} />
      </div>
      <div className="grid gap-3 rounded-xl border border-line p-4 text-xs sm:grid-cols-2">
        <ReceiptRow label={t('trainerLearners.tableLearner')} value={learner?.name || '—'} />
        <ReceiptRow label={t('common.email')} value={learner?.email || '—'} />
        <ReceiptRow label={t('trainerEnrollments.tableCourse')} value={course?.title || '—'} />
        <ReceiptRow label={t('trainerEnrollments.reference')} value={payment.reference || '—'} />
        <ReceiptRow label={t('trainerEnrollments.tableMethod')} value={payment.method === 'manual' ? t('payments.manual') : t('payments.online')} />
        <ReceiptRow label={t('trainerEnrollments.submittedOn')} value={dateTime(payment.submittedAt)} />
        <ReceiptRow label={t('trainerEnrollments.reviewedOn')} value={payment.reviewedAt ? dateTime(payment.reviewedAt) : '—'} />
        <ReceiptRow label={t('common.status')} value={payment.status} />
      </div>
      <div className="rounded-xl border border-dashed border-line p-4">
        <p className="text-xs font-semibold text-ink">{t('trainerPayments.receipt')}</p>
        {payment.proofName ? (
          <div className="mt-2 flex items-center gap-2 rounded-lg bg-surface p-2 text-[11px]"><FileIcon /> <span className="truncate">{payment.proofName}</span><Button variant="ghost" size="xs" icon={Download} className="ms-auto" onClick={() => {}}>{t('common.download')}</Button></div>
        ) : <p className="mt-1 text-[11px] text-muted">{t('trainerEnrollments.noReceipt')}</p>}
      </div>
      {payment.rejectionReason ? <div className="rounded-xl bg-danger-soft p-3 text-[11px] text-danger"><strong>{t('trainerEnrollments.rejectReason')} : </strong>{payment.rejectionReason}</div> : null}
    </div>
  )
}

function FileIcon() {
  return <span className="grid h-7 w-7 place-items-center rounded bg-white text-brand"><CreditCard size={13} /></span>
}

function ReceiptRow({ label, value }) {
  return <div><p className="text-[10px] text-muted">{label}</p><p className="mt-0.5 break-words font-medium text-ink">{value}</p></div>
}

export function TrainerPayments() {
  const { user, state, school, courses } = useSchool()
  const { t, date, money, number, dateTime } = useI18n()
  const { success, error: toastError } = useToast()
  const [tab, setTab] = useState('all')
  const [query, setQuery] = useState('')
  const [method, setMethod] = useState('all')
  const [courseId, setCourseId] = useState('all')
  const [detail, setDetail] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [refundTarget, setRefundTarget] = useState(null)
  const [reason, setReason] = useState('')

  if (!school) return <EmptyState icon={Wallet} title={t('trainerPayments.noPayments')} description={t('trainerPayments.noPaymentsDesc')} />

  const allRows = getSalesRows(state, school.id).filter((row) => courseId === 'all' || row.payment.courseId === courseId)
  const rows = allRows
    .filter((row) => tab === 'all' || row.payment.status === tab)
    .filter((row) => method === 'all' || row.payment.method === method)
    .filter((row) => {
      const value = query.toLowerCase().trim()
      return !value || row.learner?.name?.toLowerCase().includes(value) || row.learner?.email?.toLowerCase().includes(value) || row.course?.title?.toLowerCase().includes(value) || row.payment.reference?.toLowerCase().includes(value)
    })

  const validated = allRows.filter((row) => row.payment.status === 'validated')
  const gross = validated.reduce((sum, row) => sum + row.payment.amount, 0)
  const net = Math.round(gross * 0.9)
  const pending = allRows.filter((row) => row.payment.status === 'pending')

  function approve(row) {
    approveCoursePayment(row.payment.id, user.id)
    success(t('trainerPayments.approveSuccess'))
    setDetail(null)
  }

  function reject() {
    if (!reason.trim()) return toastError(t('errors.required'))
    rejectCoursePayment(rejectTarget.id, reason.trim(), user.id)
    success(t('trainerPayments.rejectSuccess'))
    setRejectTarget(null)
    setReason('')
  }

  function refund() {
    refundCoursePayment(refundTarget.id, user.id)
    success(t('trainerPayments.refundSuccess'))
    setRefundTarget(null)
    setDetail(null)
  }

  function exportRows() {
    downloadCsv(`tiwanza-paiements-formateur-${new Date().toISOString().slice(0, 10)}.csv`, [
      [t('common.date'), t('trainerPayments.tableLearner'), t('trainerPayments.tableCourse'), t('trainerPayments.tableAmount'), t('common.status')],
      ...rows.map((row) => [dateTime(row.payment.submittedAt), row.learner?.name || '', row.course?.title || '', row.payment.amount, row.payment.status]),
    ])
  }

  const tabs = [
    { value: 'all', label: t('trainerPayments.tabAll'), count: allRows.length },
    { value: 'pending', label: t('trainerPayments.tabPending'), count: pending.length },
    { value: 'validated', label: t('trainerPayments.tabApproved'), count: validated.length },
    { value: 'rejected', label: t('trainerPayments.tabRejected'), count: allRows.filter((row) => row.payment.status === 'rejected').length },
    { value: 'refunded', label: t('trainerPayments.tabRefunded'), count: allRows.filter((row) => row.payment.status === 'refunded').length },
  ]

  return (
    <div className="space-y-5">
      <PageHeader eyebrow={t('nav.trainer')} title={t('trainerPayments.title')} description={t('trainerPayments.subtitle')} actions={<Button variant="secondary" icon={Download} onClick={exportRows}>{t('trainerPayments.exportCsv')}</Button>} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('trainerPayments.statRevenue')} value={money(gross)} icon={Wallet} tone="success" />
        <StatCard label={t('trainerPayments.statPending')} value={money(pending.reduce((sum, row) => sum + row.payment.amount, 0))} icon={CreditCard} tone="amber" hint={`${pending.length}`} />
        <StatCard label={t('trainerPayments.statCommission')} value={money(gross - net)} icon={ArrowDownToLine} tone="purple" hint="10%" />
        <StatCard label={t('trainerPayments.totalNet')} value={money(net)} icon={TrendingUp} tone="brand" />
      </div>

      <Card>
        <div className="flex flex-col gap-2 border-b border-line p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Tabs items={tabs} value={tab} onChange={setTab} variant="pill" className="border-0" />
            <SearchField value={query} onChange={setQuery} placeholder={t('trainerPayments.searchPlaceholder')} className="w-full sm:w-72" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={method} onChange={(event) => setMethod(event.target.value)} className="w-auto min-w-36"><option value="all">{t('trainerPayments.allMethods')}</option><option value="online">{t('payments.online')}</option><option value="manual">{t('payments.manual')}</option></Select>
            <Select value={courseId} onChange={(event) => setCourseId(event.target.value)} className="w-auto min-w-40"><option value="all">{t('trainerPayments.allCourses')}</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</Select>
            <Badge tone="neutral">{t('trainerPayments.resultsCount', { count: rows.length })}</Badge>
          </div>
        </div>
        {rows.length ? (
          <Table>
            <thead><tr><th>{t('trainerPayments.tableLearner')}</th><th>{t('trainerPayments.tableCourse')}</th><th>{t('trainerPayments.tableAmount')}</th><th className="hidden md:table-cell">{t('trainerPayments.tableNet')}</th><th className="hidden sm:table-cell">{t('trainerPayments.tableMethod')}</th><th className="hidden lg:table-cell">{t('trainerPayments.tableDate')}</th><th>{t('common.status')}</th><th className="text-end">{t('common.actions')}</th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.payment.id}>
                  <td><div className="flex items-center gap-2"><Avatar name={row.learner?.name || '—'} size="xs" /><div className="min-w-0"><p className="max-w-[140px] truncate text-xs font-medium text-ink">{row.learner?.name}</p><p className="max-w-[140px] truncate text-[10px] text-muted">{row.learner?.email}</p></div></div></td>
                  <td className="max-w-[200px] truncate text-xs text-muted">{row.course?.title}</td>
                  <td className="whitespace-nowrap text-xs font-semibold text-ink">{money(row.payment.amount)}</td>
                  <td className="hidden md:table-cell whitespace-nowrap text-xs text-muted">{money(Math.round(row.payment.amount * 0.9))}</td>
                  <td className="hidden sm:table-cell"><Badge tone={row.payment.method === 'manual' ? 'amber' : 'blue'}>{row.payment.method === 'manual' ? t('payments.manual') : t('payments.online')}</Badge></td>
                  <td className="hidden lg:table-cell whitespace-nowrap text-[11px] text-muted">{date(row.payment.submittedAt)}</td>
                  <td><StatusPill status={row.payment.status} t={t} /></td>
                  <td><div className="flex justify-end"><Button variant="ghost" size="xs" icon={Eye} onClick={() => setDetail(row)}>{t('trainerPayments.viewDetails')}</Button></div></td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : <EmptyState icon={CreditCard} title={t('trainerPayments.noPayments')} description={t('trainerPayments.noPaymentsDesc')} />}
      </Card>

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title={t('trainerPayments.paymentDetail')} size="md" footer={detail ? <><Button variant="secondary" onClick={() => setDetail(null)}>{t('common.close')}</Button>{detail.payment.status === 'pending' ? <><Button variant="dangerSoft" icon={XCircle} onClick={() => { setRejectTarget(detail.payment); setDetail(null) }}>{t('trainerPayments.reject')}</Button><Button variant="success" icon={CheckCircle2} onClick={() => approve(detail)}>{t('trainerPayments.approve')}</Button></> : null}{detail.payment.status === 'validated' ? <Button variant="dangerSoft" icon={RotateCcw} onClick={() => setRefundTarget(detail.payment)}>{t('trainerPayments.refund')}</Button> : null}</> : null}>
        {detail ? <PaymentDetail row={detail} /> : null}
      </Modal>

      <Modal open={Boolean(rejectTarget)} onClose={() => setRejectTarget(null)} title={t('trainerPayments.rejectTitle')} footer={<><Button variant="secondary" onClick={() => setRejectTarget(null)}>{t('common.cancel')}</Button><Button variant="danger" onClick={reject}>{t('trainerPayments.reject')}</Button></>}>
        <Label>{t('trainerPayments.rejectReason')}</Label>
        <Textarea rows={3} value={reason} onChange={(event) => setReason(event.target.value)} placeholder={t('trainerPayments.rejectReasonPlaceholder')} />
      </Modal>

      <ConfirmDialog open={Boolean(refundTarget)} onClose={() => setRefundTarget(null)} onConfirm={refund} title={t('trainerPayments.refundTitle')} description={t('trainerPayments.refundDesc', { amount: money(refundTarget?.amount || 0) })} confirmLabel={t('trainerPayments.refund')} />
    </div>
  )
}

function PaymentDetail({ row }) {
  const { t, money, dateTime } = useI18n()
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl bg-surface p-4"><div><p className="text-[10px] text-muted">{t('common.total')}</p><p className="text-xl font-bold text-ink">{money(row.payment.amount)}</p></div><StatusPill status={row.payment.status} t={t} /></div>
      <div className="grid gap-3 rounded-xl border border-line p-4 text-xs sm:grid-cols-2">
        <ReceiptRow label={t('trainerPayments.tableLearner')} value={row.learner?.name || '—'} />
        <ReceiptRow label={t('trainerPayments.learnerEmail')} value={row.learner?.email || '—'} />
        <ReceiptRow label={t('trainerPayments.tableCourse')} value={row.course?.title || '—'} />
        <ReceiptRow label={t('trainerPayments.reference')} value={row.payment.reference || '—'} />
        <ReceiptRow label={t('trainerPayments.paymentDate')} value={dateTime(row.payment.submittedAt)} />
        <ReceiptRow label={t('trainerPayments.commission')} value={money(Math.round(row.payment.amount * 0.1))} />
        <ReceiptRow label={t('trainerPayments.netAmount')} value={money(Math.round(row.payment.amount * 0.9))} />
      </div>
      {row.payment.rejectionReason ? <div className="rounded-xl bg-danger-soft p-3 text-[11px] text-danger">{row.payment.rejectionReason}</div> : null}
    </div>
  )
}

export function TrainerSales() {
  const { state, school, courses } = useSchool()
  const { t, money, number, date, dateTime } = useI18n()
  const [period, setPeriod] = useState('all')

  if (!school) return <EmptyState icon={TrendingUp} title={t('trainerSales.noSales')} description={t('trainerSales.noSalesDesc')} />

  const allRows = getSalesRows(state, school.id).filter((row) => row.payment.status === 'validated')
  const now = new Date()
  const filtered = allRows.filter((row) => {
    const value = new Date(row.payment.submittedAt)
    if (period === 'week') return now.getTime() - value.getTime() <= 7 * 86400000
    if (period === 'month') return value.getMonth() === now.getMonth() && value.getFullYear() === now.getFullYear()
    if (period === '30days') return now.getTime() - value.getTime() <= 30 * 86400000
    if (period === 'year') return value.getFullYear() === now.getFullYear()
    return true
  })
  const gross = filtered.reduce((sum, row) => sum + row.payment.amount, 0)
  const net = Math.round(gross * 0.9)
  const average = filtered.length ? Math.round(gross / filtered.length) : 0
  const byCourse = courses.map((course) => {
    const rows = filtered.filter((row) => row.payment.courseId === course.id)
    const revenue = rows.reduce((sum, row) => sum + row.payment.amount, 0)
    return { course, sales: rows.length, revenue, net: Math.round(revenue * 0.9), share: gross ? Math.round((revenue / gross) * 100) : 0 }
  }).filter((item) => item.sales).sort((a, b) => b.revenue - a.revenue)

  const months = []
  for (let index = 5; index >= 0; index -= 1) {
    const start = new Date(now.getFullYear(), now.getMonth() - index, 1)
    const end = new Date(now.getFullYear(), now.getMonth() - index + 1, 1)
    const total = allRows.filter((row) => { const value = new Date(row.payment.submittedAt); return value >= start && value < end }).reduce((sum, row) => sum + row.payment.amount, 0)
    months.push({ label: start.toLocaleDateString('fr-FR', { month: 'short' }), total })
  }
  const maxMonth = Math.max(...months.map((month) => month.total), 1)

  function exportRows() {
    downloadCsv(`tiwanza-ventes-${new Date().toISOString().slice(0, 10)}.csv`, [
      [t('common.date'), t('trainerSales.tableCourse'), t('trainerSales.tableLearner'), t('trainerSales.tableAmount'), t('common.status')],
      ...filtered.map((row) => [dateTime(row.payment.submittedAt), row.course?.title || '', row.learner?.name || '', row.payment.amount, row.payment.status]),
    ])
  }

  return (
    <div className="space-y-5">
      <PageHeader eyebrow={t('nav.trainer')} title={t('trainerSales.title')} description={t('trainerSales.subtitle')} actions={<><Select value={period} onChange={(event) => setPeriod(event.target.value)} className="w-auto min-w-36"><option value="all">{t('trainerSales.allTime')}</option><option value="week">{t('trainerSales.thisWeek')}</option><option value="30days">{t('trainerSales.last30Days')}</option><option value="month">{t('trainerSales.thisMonth')}</option><option value="year">{t('trainerSales.thisYear')}</option></Select><Button variant="secondary" icon={Download} onClick={exportRows}>{t('trainerSales.exportCsv')}</Button></>} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('trainerSales.totalRevenue')} value={money(gross)} icon={Wallet} tone="success" />
        <StatCard label={t('trainerSales.netRevenue')} value={money(net)} icon={TrendingUp} tone="brand" />
        <StatCard label={t('trainerSales.totalSales')} value={number(filtered.length)} icon={CreditCard} tone="blue" />
        <StatCard label={t('trainerSales.averageOrder')} value={money(average)} icon={ArrowDownToLine} tone="amber" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader title={t('trainerSales.revenueChart')} description={t('trainerSales.revenueChartDesc')} action={<Badge tone="success" dot>{money(months.reduce((sum, month) => sum + month.total, 0))}</Badge>} />
          <div className="p-5">
            <div className="flex h-44 items-end gap-3 sm:gap-5">
              {months.map((month, index) => (
                <div key={`${month.label}-${index}`} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
                  <span className="text-[9px] font-semibold text-muted opacity-0 transition group-hover:opacity-100">{money(month.total)}</span>
                  <div className="relative flex w-full max-w-14 flex-1 items-end"><div className={cn('w-full rounded-t-lg', index === months.length - 1 ? 'bg-brand' : 'bg-brand/25 group-hover:bg-brand/40')} style={{ height: `${Math.max(5, (month.total / maxMonth) * 100)}%` }} /></div>
                  <span className="text-[10px] capitalize text-muted">{month.label}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
        <Card>
          <CardHeader title={t('trainerSales.salesByCourse')} description={t('trainerSales.salesByCourseDesc')} />
          {byCourse.length ? (
            <div className="divide-y divide-line">
              {byCourse.map((item) => (
                <div key={item.course.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-ink">{item.course.title}</p><p className="text-[10px] text-muted">{item.sales} {t('common.sales') || 'ventes'} · {item.share}%</p></div>
                  <span className="text-xs font-bold text-ink">{money(item.revenue)}</span>
                </div>
              ))}
            </div>
          ) : <EmptyState icon={TrendingUp} title={t('trainerSales.noSales')} description={t('trainerSales.noSalesDesc')} compact />}
        </Card>
      </div>

      <Card>
        <CardHeader title={t('trainerSales.transactions')} description={t('trainerSales.transactionsDesc')} />
        {filtered.length ? (
          <Table>
            <thead><tr><th>{t('trainerSales.tableLearner')}</th><th>{t('trainerSales.tableCourse')}</th><th>{t('trainerSales.tableAmount')}</th><th className="hidden sm:table-cell">{t('trainerSales.tableMethod')}</th><th className="hidden md:table-cell">{t('trainerSales.tableDate')}</th><th>{t('common.status')}</th></tr></thead>
            <tbody>{filtered.map((row) => <tr key={row.payment.id}><td><div className="flex items-center gap-2"><Avatar name={row.learner?.name} size="xs" /><span className="text-xs text-ink">{row.learner?.name}</span></div></td><td className="max-w-[220px] truncate text-xs text-muted">{row.course?.title}</td><td className="text-xs font-semibold text-ink">{money(row.payment.amount)}</td><td className="hidden sm:table-cell"><Badge tone={row.payment.method === 'manual' ? 'amber' : 'blue'}>{row.payment.method === 'manual' ? t('payments.manual') : t('payments.online')}</Badge></td><td className="hidden md:table-cell text-[11px] text-muted">{date(row.payment.submittedAt)}</td><td><StatusPill status={row.payment.status} t={t} /></td></tr>)}</tbody>
          </Table>
        ) : <EmptyState icon={CreditCard} title={t('trainerSales.noTransactions')} compact />}
      </Card>
    </div>
  )
}
