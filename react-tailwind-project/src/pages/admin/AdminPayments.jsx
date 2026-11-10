import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowDownToLine,
  Banknote,
  CheckCircle2,
  CreditCard,
  Download,
  Eye,
  Landmark,
  Receipt,
  RotateCcw,
  Search,
  TrendingUp,
  Wallet,
  XCircle,
} from 'lucide-react'
import { useI18n } from '../../i18n/I18nContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { useTiwanzaStore } from '../../data/store.js'
import { getCourse, getPlan, getSchool, getSubscriptionPayments } from '../../data/selectors.js'
import {
  approveSubscriptionPayment,
  refundCoursePayment,
  rejectSubscriptionPayment,
} from '../../data/services.js'
import { Badge, Button, Card, ConfirmDialog, EmptyState, Modal, PageHeader, SearchField, Select, StatCard, Table, Tabs, Textarea } from '../../components/ui.jsx'
import { StatusPill } from './AdminDashboard.jsx'
import { downloadCsv } from '../../lib/utils.js'

export function AdminPayments() {
  const { t, language, money, number, date, dateTime } = useI18n()
  const { success, error: toastError } = useToast()
  const state = useTiwanzaStore()
  const [tab, setTab] = useState('all')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [method, setMethod] = useState('all')
  const [detail, setDetail] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [reason, setReason] = useState('')
  const [refundTarget, setRefundTarget] = useState(null)
  const [loading, setLoading] = useState(false)

  const subscriptionRows = getSubscriptionPayments(state).map((row) => ({
    id: row.payment.id,
    kind: 'subscription',
    payment: row.payment,
    school: row.school,
    plan: row.plan,
    trainer: row.trainer,
    learner: null,
    course: null,
    date: row.payment.submittedAt,
    amount: row.payment.amount,
    method: row.payment.method,
    status: row.payment.status,
  }))

  const courseRows = state.coursePayments.map((payment) => {
    const school = getSchool(state, payment.schoolId)
    const learner = state.users.find((user) => user.id === payment.learnerId)
    return {
      id: payment.id,
      kind: 'course',
      payment,
      school,
      plan: null,
      trainer: school ? state.users.find((user) => user.id === school.trainerId) : null,
      learner,
      course: getCourse(state, payment.courseId),
      date: payment.submittedAt,
      amount: payment.amount,
      method: payment.method,
      status: payment.status,
    }
  })

  const allRows = [...subscriptionRows, ...courseRows].sort((a, b) => new Date(b.date) - new Date(a.date))
  const rows = allRows.filter((row) => {
    if (tab === 'subscriptions' && row.kind !== 'subscription') return false
    if (tab === 'courses' && row.kind !== 'course') return false
    if (status !== 'all' && row.status !== status) return false
    if (method !== 'all' && row.method !== method) return false
    const value = query.toLowerCase().trim()
    if (!value) return true
    return (
      row.school?.name?.toLowerCase().includes(value) ||
      row.trainer?.name?.toLowerCase().includes(value) ||
      row.learner?.name?.toLowerCase().includes(value) ||
      row.course?.title?.toLowerCase().includes(value) ||
      row.payment.reference?.toLowerCase().includes(value)
    )
  })

  const validated = allRows.filter((row) => row.status === 'validated')
  const totalRevenue = validated.reduce((sum, row) => sum + row.amount, 0)
  const pending = allRows.filter((row) => row.status === 'pending')
  const pendingTotal = pending.reduce((sum, row) => sum + row.amount, 0)
  const thisMonth = allRows.filter((row) => {
    const value = new Date(row.date)
    const now = new Date()
    return value.getMonth() === now.getMonth() && value.getFullYear() === now.getFullYear() && row.status === 'validated'
  })
  const commissionRate = Number(state.platformSettings?.commission || 10)
  const commission = Math.round((totalRevenue * commissionRate) / 100)

  const tabs = [
    { value: 'all', label: t('adminPayments.tabAll'), count: allRows.length },
    { value: 'subscriptions', label: t('adminPayments.tabSubscriptions'), count: subscriptionRows.length },
    { value: 'courses', label: t('adminPayments.tabCourses'), count: courseRows.length },
  ]

  function approve(row) {
    setLoading(true)
    window.setTimeout(() => {
      approveSubscriptionPayment(row.payment.id)
      setLoading(false)
      setDetail(null)
      success(t('adminSubscriptions.approveSuccess'))
    }, 400)
  }

  function reject() {
    if (!reason.trim()) return toastError(t('errors.required'))
    setLoading(true)
    window.setTimeout(() => {
      rejectSubscriptionPayment(rejectTarget.payment.id, reason.trim())
      setLoading(false)
      setRejectTarget(null)
      setReason('')
      success(t('adminSubscriptions.rejectSuccess'))
    }, 400)
  }

  function refund() {
    setLoading(true)
    window.setTimeout(() => {
      refundCoursePayment(refundTarget.payment.id)
      setLoading(false)
      setRefundTarget(null)
      setDetail(null)
      success(t('adminPayments.refundSuccess'))
    }, 400)
  }

  function exportRows() {
    downloadCsv(
      `tiwanza-paiements-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        [t('common.date'), t('adminPayments.tableType'), t('adminPayments.tableSchool'), t('adminPayments.tableLearner'), t('adminPayments.tableCourse'), t('common.amount'), t('common.status')],
        ...rows.map((row) => [
          date(row.date),
          row.kind === 'course' ? t('adminPayments.typeCourse') : t('adminPayments.typeSubscription'),
          row.school?.name || '',
          row.learner?.name || '',
          row.course?.title || row.plan?.nameFr || '',
          row.amount,
          row.status,
        ]),
      ],
    )
    success(t('common.download'))
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={t('nav.platform')}
        title={t('adminPayments.title')}
        description={t('adminPayments.subtitle')}
        actions={<Button variant="secondary" icon={Download} onClick={exportRows}>{t('adminPayments.exportCsv')}</Button>}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('adminPayments.statTotal')} value={money(totalRevenue)} icon={Wallet} tone="success" hint={`${validated.length} ${t('common.approved').toLowerCase()}`} />
        <StatCard label={t('adminPayments.statPending')} value={money(pendingTotal)} icon={CreditCard} tone="amber" hint={`${pending.length} ${t('common.pending').toLowerCase()}`} />
        <StatCard label={t('adminPayments.statThisMonth')} value={money(thisMonth.reduce((sum, row) => sum + row.amount, 0))} icon={TrendingUp} tone="blue" />
        <StatCard label={t('adminPayments.statCommission')} value={money(commission)} icon={Banknote} tone="purple" hint={`${commissionRate}%`} />
      </div>

      <Card>
        <div className="flex flex-col gap-2 border-b border-line p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Tabs items={tabs} value={tab} onChange={setTab} variant="pill" className="border-0" />
            <SearchField value={query} onChange={setQuery} placeholder={t('adminPayments.searchPlaceholder')} className="w-full sm:w-72" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={status} onChange={(event) => setStatus(event.target.value)} className="w-auto min-w-36" aria-label={t('adminPayments.filterStatus')}>
              <option value="all">{t('adminPayments.allStatuses')}</option>
              <option value="validated">{t('common.approved')}</option>
              <option value="pending">{t('common.pending')}</option>
              <option value="rejected">{t('common.rejected')}</option>
              <option value="refunded">{t('payments.refunded')}</option>
            </Select>
            <Select value={method} onChange={(event) => setMethod(event.target.value)} className="w-auto min-w-36" aria-label={t('adminPayments.filterMethod')}>
              <option value="all">{t('adminPayments.allMethods')}</option>
              <option value="online">{t('payments.online')}</option>
              <option value="manual">{t('payments.manual')}</option>
              <option value="free">{t('common.free')}</option>
            </Select>
            <Badge tone="neutral" className="self-center">{t('adminPayments.resultsCount', { count: rows.length })}</Badge>
          </div>
        </div>

        {rows.length ? (
          <Table>
            <thead>
              <tr>
                <th>{t('common.date')}</th>
                <th>{t('adminPayments.tableType')}</th>
                <th>{t('adminPayments.tableSchool')}</th>
                <th className="hidden md:table-cell">{t('adminPayments.tableLearner')}</th>
                <th className="hidden lg:table-cell">{t('adminPayments.tableCourse')}</th>
                <th>{t('common.amount')}</th>
                <th className="hidden sm:table-cell">{t('common.status')}</th>
                <th className="text-end">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.kind}-${row.id}`}>
                  <td className="whitespace-nowrap text-[11px] text-muted">{date(row.date)}</td>
                  <td><Badge tone={row.kind === 'course' ? 'blue' : 'purple'}>{row.kind === 'course' ? t('adminPayments.typeCourse') : t('adminPayments.typeSubscription')}</Badge></td>
                  <td>
                    <p className="truncate text-xs font-medium text-ink">{row.school?.name || '—'}</p>
                    <p className="truncate text-[10px] text-muted">{row.kind === 'course' ? row.trainer?.name : row.plan?.nameFr}</p>
                  </td>
                  <td className="hidden md:table-cell text-xs text-muted">{row.learner?.name || '—'}</td>
                  <td className="hidden lg:table-cell max-w-[180px] truncate text-xs text-muted">{row.course?.title || row.plan?.nameFr || '—'}</td>
                  <td className="whitespace-nowrap text-xs font-semibold text-ink">{money(row.amount)}</td>
                  <td className="hidden sm:table-cell"><StatusPill status={row.status} t={t} /></td>
                  <td>
                    <div className="flex justify-end">
                      <Button variant="ghost" size="xs" icon={Eye} onClick={() => setDetail(row)}>{t('common.view')}</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState icon={Wallet} title={t('adminPayments.noPayments')} description={t('adminPayments.noPaymentsDesc')} />
        )}
      </Card>

      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={t('adminPayments.paymentDetail')}
        description={detail?.kind === 'course' ? t('adminPayments.coursePayment') : t('adminPayments.subscriptionPayment')}
        size="lg"
        footer={
          detail ? (
            <>
              <Button variant="secondary" onClick={() => setDetail(null)}>{t('common.close')}</Button>
              {detail.kind === 'subscription' && detail.status === 'pending' ? (
                <>
                  <Button variant="dangerSoft" icon={XCircle} onClick={() => { setRejectTarget(detail); setReason(''); setDetail(null) }}>{t('adminPayments.reject')}</Button>
                  <Button variant="success" icon={CheckCircle2} loading={loading} onClick={() => approve(detail)}>{t('adminPayments.approve')}</Button>
                </>
              ) : null}
              {detail.kind === 'course' && detail.status === 'validated' ? (
                <Button variant="dangerSoft" icon={RotateCcw} onClick={() => setRefundTarget(detail)}>{t('adminPayments.refund')}</Button>
              ) : null}
            </>
          ) : null
        }
      >
        {detail ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-surface p-4">
              <div>
                <p className="text-[10px] text-muted">{t('common.total')}</p>
                <p className="brand-font text-2xl font-bold text-ink">{money(detail.amount)}</p>
              </div>
              <StatusPill status={detail.status} t={t} />
            </div>
            <div className="grid gap-3 rounded-xl border border-line p-4 text-xs sm:grid-cols-2">
              <Detail label={t('adminPayments.tableType')} value={detail.kind === 'course' ? t('adminPayments.typeCourse') : t('adminPayments.typeSubscription')} />
              <Detail label={t('adminPayments.tableSchool')} value={detail.school?.name || '—'} />
              <Detail label={t('adminPayments.reference')} value={detail.payment.reference || '—'} />
              <Detail label={t('common.date')} value={dateTime(detail.date)} />
              <Detail label={t('common.method')} value={detail.method === 'manual' ? t('payments.manual') : detail.method === 'free' ? t('common.free') : t('payments.online')} />
              <Detail label={t('adminPayments.transactionId')} value={detail.payment.provider || detail.method} />
              <Detail label={t('adminPayments.tableLearner')} value={detail.learner?.name || '—'} />
              <Detail label={t('adminPayments.tableCourse')} value={detail.course?.title || detail.plan?.nameFr || '—'} />
              {detail.payment.rejectionReason ? <Detail label={t('adminSubscriptions.rejectReason')} value={detail.payment.rejectionReason} /> : null}
            </div>
            <div className="rounded-xl border border-line p-4">
              <p className="text-xs font-semibold text-ink">{t('adminPayments.receipt')}</p>
              {detail.payment.proofName ? (
                <div className="mt-3 flex items-center gap-3 rounded-lg border border-dashed border-line bg-surface/60 p-3">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-white text-brand shadow-sm"><Receipt size={18} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-ink">{detail.payment.proofName}</p>
                    <p className="text-[10px] text-muted">{t('common.simulated')}</p>
                  </div>
                  <Button variant="ghost" size="xs" icon={Download} onClick={() => success(t('common.simulated'))}>{t('common.download')}</Button>
                </div>
              ) : (
                <p className="mt-2 text-[11px] text-muted">{detail.method === 'online' ? t('payments.transactionSimulated') : t('common.none')}</p>
              )}
            </div>
            {detail.kind === 'course' ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-brand-soft/60 p-3">
                  <p className="text-[10px] text-muted">{t('adminPayments.platformRevenue')}</p>
                  <p className="mt-1 text-sm font-bold text-brand">{money(Math.round(detail.amount * commissionRate / 100))}</p>
                </div>
                <div className="rounded-xl bg-surface p-3">
                  <p className="text-[10px] text-muted">{t('adminPayments.trainerRevenue')}</p>
                  <p className="mt-1 text-sm font-bold text-ink">{money(detail.amount - Math.round(detail.amount * commissionRate / 100))}</p>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(rejectTarget)}
        onClose={() => !loading && setRejectTarget(null)}
        title={t('adminSubscriptions.rejectTitle')}
        description={t('adminSubscriptions.rejectDesc', { school: rejectTarget?.school?.name || '' })}
        footer={<><Button variant="secondary" onClick={() => setRejectTarget(null)} disabled={loading}>{t('common.cancel')}</Button><Button variant="danger" onClick={reject} loading={loading}>{t('adminSubscriptions.reject')}</Button></>}
      >
        <Textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder={t('adminSubscriptions.rejectReasonPlaceholder')} rows={3} />
      </Modal>

      <ConfirmDialog
        open={Boolean(refundTarget)}
        onClose={() => setRefundTarget(null)}
        onConfirm={refund}
        title={t('adminPayments.refundConfirm')}
        description={t('adminPayments.refundDesc')}
        confirmLabel={t('adminPayments.refund')}
        tone="danger"
        loading={loading}
      />
    </div>
  )
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-[10px] text-muted">{label}</p>
      <p className="mt-0.5 break-words font-medium text-ink">{value}</p>
    </div>
  )
}
