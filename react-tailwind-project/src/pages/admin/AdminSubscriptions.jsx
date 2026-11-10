import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Banknote,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  Eye,
  FileText,
  Landmark,
  Receipt,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Wallet,
  XCircle,
} from 'lucide-react'
import { useI18n } from '../../i18n/I18nContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { useTiwanzaStore } from '../../data/store.js'
import {
  getPlan,
  getSchool,
  getSubscriptionPayments,
  getTrainerProfile,
} from '../../data/selectors.js'
import {
  approveSubscriptionPayment,
  cancelSubscription,
  rejectSubscriptionPayment,
} from '../../data/services.js'
import { Alert, Avatar, Badge, Button, Card, CardHeader, ConfirmDialog, EmptyState, Modal, PageHeader, SearchField, StatCard, Table, Tabs, Textarea } from '../../components/ui.jsx'
import { StatusPill } from './AdminDashboard.jsx'
import { cn } from '../../lib/utils.js'

export function AdminSubscriptions() {
  const { t, language, number, money, date, dateTime } = useI18n()
  const { success, error: toastError } = useToast()
  const state = useTiwanzaStore()
  const [tab, setTab] = useState('pending')
  const [query, setQuery] = useState('')
  const [approveTarget, setApproveTarget] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [reason, setReason] = useState('')
  const [receiptTarget, setReceiptTarget] = useState(null)
  const [loading, setLoading] = useState(false)

  const rows = useMemo(() => {
    return state.subscriptions
      .map((subscription) => {
        const trainer = state.users.find((user) => user.id === subscription.trainerId)
        const profile = getTrainerProfile(state, subscription.trainerId)
        const school = profile?.schoolId ? getSchool(state, profile.schoolId) : null
        const plan = getPlan(state, subscription.planId)
        const payments = state.subscriptionPayments
          .filter((payment) => payment.trainerId === subscription.trainerId && payment.planId === subscription.planId)
          .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
        const latestPayment = payments[0] || null
        return { subscription, trainer, profile, school, plan, latestPayment, payments }
      })
      .sort((a, b) => new Date(b.subscription.createdAt) - new Date(a.subscription.createdAt))
  }, [state])

  const pendingPayments = getSubscriptionPayments(state, { status: 'pending' })
  const totalPending = pendingPayments.reduce((sum, item) => sum + item.payment.amount, 0)
  const activeCount = rows.filter((row) => row.subscription.status === 'active').length
  const expiredCount = rows.filter((row) => row.subscription.status === 'expired').length
  const proCount = rows.filter((row) => row.plan?.code === 'pro' && row.subscription.status === 'active').length

  const filtered = rows.filter((row) => {
    const matchesTab =
      tab === 'all' ||
      (tab === 'active' && row.subscription.status === 'active') ||
      (tab === 'expired' && row.subscription.status === 'expired') ||
      (tab === 'pending' && row.subscription.status === 'pending')
    const value = query.toLowerCase().trim()
    const matchesQuery =
      !value ||
      row.school?.name?.toLowerCase().includes(value) ||
      row.trainer?.name?.toLowerCase().includes(value) ||
      row.trainer?.email?.toLowerCase().includes(value) ||
      row.latestPayment?.reference?.toLowerCase().includes(value)
    return matchesTab && matchesQuery
  })

  const tabs = [
    { value: 'pending', label: t('adminSubscriptions.tabPending'), count: pendingPayments.length },
    { value: 'active', label: t('adminSubscriptions.tabActive'), count: activeCount },
    { value: 'expired', label: t('adminSubscriptions.tabExpired'), count: expiredCount },
    { value: 'all', label: t('adminSubscriptions.tabAll'), count: rows.length },
  ]

  function handleApprove() {
    if (!approveTarget?.latestPayment) return
    setLoading(true)
    window.setTimeout(() => {
      approveSubscriptionPayment(approveTarget.latestPayment.id)
      setLoading(false)
      setApproveTarget(null)
      success(t('adminSubscriptions.approveSuccess'))
    }, 450)
  }

  function handleReject() {
    if (!rejectTarget?.latestPayment) return
    if (!reason.trim()) return toastError(t('errors.required'))
    setLoading(true)
    window.setTimeout(() => {
      rejectSubscriptionPayment(rejectTarget.latestPayment.id, reason.trim())
      setLoading(false)
      setRejectTarget(null)
      setReason('')
      success(t('adminSubscriptions.rejectSuccess'))
    }, 450)
  }

  function handleCancel(row) {
    cancelSubscription(row.subscription.trainerId)
    success(t('adminSubscriptions.cancelSuccess'))
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={t('nav.platform')}
        title={t('adminSubscriptions.title')}
        description={t('adminSubscriptions.subtitle')}
        actions={<Badge tone={pendingPayments.length ? 'warning' : 'success'} dot>{pendingPayments.length} {t('common.pending')}</Badge>}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('adminSubscriptions.totalPendingAmount')} value={money(totalPending)} icon={Clock} tone="amber" hint={t('adminSubscriptions.pendingCount', { count: pendingPayments.length })} />
        <StatCard label={t('admin.statActiveSubscriptions')} value={number(activeCount)} icon={CheckCircle2} tone="success" />
        <StatCard label={t('admin.statProSchools')} value={number(proCount)} icon={Sparkles} tone="purple" />
        <StatCard label={t('adminSubscriptions.tabExpired')} value={number(expiredCount)} icon={Clock} tone="danger" />
      </div>

      <Card>
        <div className="flex flex-col gap-2 border-b border-line p-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs items={tabs} value={tab} onChange={setTab} variant="pill" className="border-0" />
          <SearchField value={query} onChange={setQuery} placeholder={t('adminSubscriptions.searchPlaceholder')} className="w-full sm:w-72" />
        </div>

        {filtered.length ? (
          <Table>
            <thead>
              <tr>
                <th>{t('adminSubscriptions.tableSchool')}</th>
                <th>{t('adminSubscriptions.tablePlan')}</th>
                <th>{t('adminSubscriptions.tableAmount')}</th>
                <th className="hidden md:table-cell">{t('adminSubscriptions.tableMethod')}</th>
                <th className="hidden lg:table-cell">{t('adminSubscriptions.tableReference')}</th>
                <th>{t('adminSubscriptions.tableStatus')}</th>
                <th className="text-end">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.subscription.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={row.school?.name || row.trainer?.name} size="sm" tone={row.plan?.code === 'pro' ? 'purple' : 'brand'} />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-ink">{row.school?.name || t('adminUsers.noSchool')}</p>
                        <p className="truncate text-[10px] text-muted">{row.trainer?.name}</p>
                      </div>
                    </div>
                  </td>
                  <td><Badge tone={row.plan?.code === 'pro' ? 'purple' : 'neutral'}>{row.plan ? (language === 'ar' ? row.plan.nameAr : row.plan.nameFr) : '—'}</Badge></td>
                  <td className="text-xs font-semibold text-ink">{money(row.subscription.amount || row.plan?.priceDA || 0)}</td>
                  <td className="hidden md:table-cell">
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-muted">
                      {row.subscription.method === 'manual' ? <Landmark size={12} /> : <CreditCard size={12} />}
                      {row.subscription.method === 'free' ? t('common.free') : row.subscription.method === 'manual' ? t('payments.manual') : t('payments.online')}
                    </span>
                  </td>
                  <td className="hidden lg:table-cell">
                    {row.latestPayment?.reference ? (
                      <button type="button" onClick={() => setReceiptTarget(row)} className="font-mono text-[10px] text-brand hover:underline" dir="ltr">{row.latestPayment.reference}</button>
                    ) : <span className="text-[10px] text-muted">—</span>}
                  </td>
                  <td><StatusPill status={row.subscription.status} t={t} /></td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      {row.latestPayment?.proofName || row.latestPayment ? (
                        <Button variant="ghost" size="xs" icon={Receipt} onClick={() => setReceiptTarget(row)}>{t('adminSubscriptions.viewReceipt')}</Button>
                      ) : null}
                      {row.subscription.status === 'pending' ? (
                        <>
                          <Button variant="success" size="xs" icon={CheckCircle2} onClick={() => setApproveTarget(row)}>{t('adminSubscriptions.approve')}</Button>
                          <Button variant="dangerSoft" size="xs" icon={XCircle} onClick={() => { setRejectTarget(row); setReason('') }}>{t('adminSubscriptions.reject')}</Button>
                        </>
                      ) : row.school ? (
                        <Link to={`/admin/schools/${row.school.id}`} className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline">
                          {t('common.view')} <ArrowRight size={12} className="rtl:rotate-180" />
                        </Link>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState
            icon={tab === 'pending' ? CheckCircle2 : CreditCard}
            title={tab === 'pending' ? t('adminSubscriptions.noPending') : tab === 'active' ? t('adminSubscriptions.noActive') : t('adminSubscriptions.noSubscriptions')}
            description={tab === 'pending' ? t('adminSubscriptions.noPendingDesc') : t('common.emptyDescription')}
          />
        )}
      </Card>

      <Modal
        open={Boolean(approveTarget)}
        onClose={() => !loading && setApproveTarget(null)}
        title={t('adminSubscriptions.approveTitle')}
        description={t('adminSubscriptions.approveDesc', { plan: approveTarget?.plan?.nameFr || '', school: approveTarget?.school?.name || '' })}
        footer={<><Button variant="secondary" onClick={() => setApproveTarget(null)} disabled={loading}>{t('common.cancel')}</Button><Button variant="success" onClick={handleApprove} loading={loading} icon={CheckCircle2}>{t('adminSubscriptions.approve')}</Button></>}
      >
        {approveTarget ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-surface p-3 text-xs">
              <Detail label={t('adminSubscriptions.tableSchool')} value={approveTarget.school?.name || '—'} />
              <Detail label={t('adminSubscriptions.tablePlan')} value={approveTarget.plan ? (language === 'ar' ? approveTarget.plan.nameAr : approveTarget.plan.nameFr) : '—'} />
              <Detail label={t('adminSubscriptions.tableAmount')} value={money(approveTarget.latestPayment?.amount || 0)} />
              <Detail label={t('adminSubscriptions.tableReference')} value={approveTarget.latestPayment?.reference || '—'} />
            </div>
            <Alert tone="info" icon={ShieldCheck}>{t('common.simulated')}</Alert>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(rejectTarget)}
        onClose={() => !loading && setRejectTarget(null)}
        title={t('adminSubscriptions.rejectTitle')}
        description={t('adminSubscriptions.rejectDesc', { school: rejectTarget?.school?.name || '' })}
        footer={<><Button variant="secondary" onClick={() => setRejectTarget(null)} disabled={loading}>{t('common.cancel')}</Button><Button variant="danger" onClick={handleReject} loading={loading} icon={XCircle}>{t('adminSubscriptions.reject')}</Button></>}
      >
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-ink">{t('adminSubscriptions.rejectReason')}</label>
          <Textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder={t('adminSubscriptions.rejectReasonPlaceholder')} rows={3} />
        </div>
      </Modal>

      <Modal
        open={Boolean(receiptTarget)}
        onClose={() => setReceiptTarget(null)}
        title={t('adminSubscriptions.paymentDetails')}
        size="lg"
        footer={<Button variant="secondary" onClick={() => setReceiptTarget(null)}>{t('common.close')}</Button>}
      >
        {receiptTarget ? (
          <div className="space-y-4">
            <div className="grid gap-3 rounded-xl border border-line p-4 text-xs sm:grid-cols-2">
              <Detail label={t('adminSubscriptions.tableSchool')} value={receiptTarget.school?.name || '—'} />
              <Detail label={t('adminSubscriptions.tableOwner')} value={receiptTarget.trainer?.name || '—'} />
              <Detail label={t('adminSubscriptions.tablePlan')} value={receiptTarget.plan ? (language === 'ar' ? receiptTarget.plan.nameAr : receiptTarget.plan.nameFr) : '—'} />
              <Detail label={t('adminSubscriptions.tableAmount')} value={money(receiptTarget.latestPayment?.amount || 0)} />
              <Detail label={t('adminSubscriptions.tableMethod')} value={receiptTarget.latestPayment?.method === 'manual' ? t('adminSubscriptions.manualPayment') : t('adminSubscriptions.onlinePayment')} />
              <Detail label={t('adminSubscriptions.tableReference')} value={receiptTarget.latestPayment?.reference || '—'} />
              <Detail label={t('adminSubscriptions.submittedOn')} value={dateTime(receiptTarget.latestPayment?.submittedAt)} />
              <Detail label={t('adminSubscriptions.reviewedOn')} value={receiptTarget.latestPayment?.reviewedAt ? dateTime(receiptTarget.latestPayment.reviewedAt) : '—'} />
            </div>
            <div className="rounded-xl border border-line p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-ink">{t('adminSubscriptions.tableReceipt')}</p>
                <Button variant="ghost" size="xs" icon={Download} onClick={() => success(t('common.simulated'))}>{t('common.download')}</Button>
              </div>
              {receiptTarget.latestPayment?.proofName ? (
                <div className="mt-3 flex min-h-40 items-center justify-center rounded-lg border border-dashed border-line bg-surface/60 p-4">
                  <div className="text-center">
                    <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-white text-brand shadow-sm"><FileText size={24} /></span>
                    <p className="mt-2 text-xs font-medium text-ink">{receiptTarget.latestPayment.proofName}</p>
                    <p className="mt-0.5 text-[10px] text-muted">{t('common.simulated')} · PDF / image</p>
                  </div>
                </div>
              ) : (
                <div className="mt-3 rounded-lg bg-surface/60 p-4 text-center text-xs text-muted">{receiptTarget.latestPayment?.method === 'online' ? t('payments.transactionSimulated') : t('adminSubscriptions.noReceipt')}</div>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
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
