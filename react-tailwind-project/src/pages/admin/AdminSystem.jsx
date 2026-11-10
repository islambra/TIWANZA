import { useMemo, useState } from 'react'
import {
  Activity as ActivityIcon,
  AlertTriangle,
  Bell,
  BookOpen,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  Eye,
  Globe2,
  LifeBuoy,
  Mail,
  MessageSquare,
  RefreshCcw,
  RotateCcw,
  Save,
  Send,
  Server,
  Settings as SettingsIcon,
  ShieldAlert,
  Sparkles,
  UserRound,
  Users,
  Wallet,
} from 'lucide-react'
import { useI18n } from '../../i18n/I18nContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { useTiwanzaStore } from '../../data/store.js'
import { getCourse, getSchool, getTrainerBySchool } from '../../data/selectors.js'
import {
  resetDemoData,
  updatePlatformSettings,
  updateSupportRequestStatus,
} from '../../data/services.js'
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  Checkbox,
  ConfirmDialog,
  EmptyState,
  Input,
  Label,
  Modal,
  PageHeader,
  SearchField,
  Select,
  StatCard,
  Table,
  Tabs,
  Textarea,
} from '../../components/ui.jsx'
import { activityKey } from './AdminDashboard.jsx'
import { cn, downloadCsv } from '../../lib/utils.js'

export function AdminSettings() {
  const { t, language, number } = useI18n()
  const { success } = useToast()
  const state = useTiwanzaStore()
  const [tab, setTab] = useState('general')
  const [form, setForm] = useState(() => ({ ...state.platformSettings, commission: state.platformSettings.commission ?? 10 }))
  const [resetOpen, setResetOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const tabs = [
    { value: 'general', label: t('adminSettings.general') },
    { value: 'payments', label: t('adminSettings.payments') },
    { value: 'notifications', label: t('adminSettings.notifications') },
  ]

  function save() {
    setSaving(true)
    window.setTimeout(() => {
      updatePlatformSettings(form)
      setSaving(false)
      success(t('adminSettings.saveSuccess'))
    }, 350)
  }

  function resetDemo() {
    resetDemoData()
    success(t('adminSettings.resetSuccess'))
    setResetOpen(false)
    window.setTimeout(() => window.location.assign('/'), 700)
  }

  function updateManual(patch) {
    setForm((current) => ({ ...current, manualPayment: { ...current.manualPayment, ...patch } }))
  }

  function updateBank(patch) {
    setForm((current) => ({
      ...current,
      manualPayment: {
        ...current.manualPayment,
        bank: { ...current.manualPayment.bank, ...patch },
      },
    }))
  }

  function toggleMethod(name) {
    setForm((current) => ({ ...current, methods: { ...current.methods, [name]: !current.methods[name] } }))
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={t('nav.platform')}
        title={t('adminSettings.title')}
        description={t('adminSettings.subtitle')}
        actions={<Button icon={Save} loading={saving} onClick={save}>{t('common.save')}</Button>}
      />

      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <Card className="h-fit p-2">
          <div className="space-y-0.5">
            {tabs.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setTab(item.value)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-xs font-medium transition',
                  tab === item.value ? 'bg-brand text-white shadow-sm' : 'text-muted hover:bg-surface hover:text-ink',
                )}
              >
                {item.value === 'general' ? <SettingsIcon size={14} /> : item.value === 'payments' ? <CreditCard size={14} /> : <Bell size={14} />}
                {item.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setTab('danger')}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-xs font-medium transition',
                tab === 'danger' ? 'bg-danger-soft text-danger' : 'text-danger hover:bg-danger-soft/60',
              )}
            >
              <ShieldAlert size={14} /> {t('adminSettings.dangerZone')}
            </button>
          </div>
        </Card>

        <div className="space-y-4">
          {tab === 'general' ? (
            <Card>
              <CardHeader title={t('adminSettings.general')} description={t('adminSettings.subtitle')} />
              <div className="space-y-4 p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>{t('adminSettings.platformName')}</Label>
                    <Input value={form.platformName} onChange={(event) => setForm({ ...form, platformName: event.target.value })} />
                  </div>
                  <div>
                    <Label>{t('adminSettings.supportEmail')}</Label>
                    <Input type="email" value={form.supportEmail} onChange={(event) => setForm({ ...form, supportEmail: event.target.value })} />
                  </div>
                  <div>
                    <Label>{t('adminSettings.defaultLanguage')}</Label>
                    <Select value={form.defaultLanguage || 'fr'} onChange={(event) => setForm({ ...form, defaultLanguage: event.target.value })}>
                      <option value="fr">Français</option>
                      <option value="ar">العربية</option>
                    </Select>
                  </div>
                  <div>
                    <Label>{t('adminSettings.currency')}</Label>
                    <Select value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value })}>
                      <option value="DA">DA — Dinar algérien</option>
                      <option value="EUR">EUR — Euro</option>
                      <option value="USD">USD — Dollar</option>
                    </Select>
                  </div>
                  <div>
                    <Label>{t('adminSettings.timezone')}</Label>
                    <Select value={form.timezone} onChange={(event) => setForm({ ...form, timezone: event.target.value })}>
                      <option value="Africa/Algiers">Africa/Algiers (GMT+1)</option>
                      <option value="Africa/Casablanca">Africa/Casablanca</option>
                      <option value="Africa/Tunis">Africa/Tunis</option>
                      <option value="Europe/Paris">Europe/Paris</option>
                    </Select>
                  </div>
                  <div>
                    <Label>{t('adminSettings.commissionPercent')}</Label>
                    <Input type="number" min="0" max="50" value={form.commission} onChange={(event) => setForm({ ...form, commission: Number(event.target.value) })} />
                  </div>
                </div>
                <Alert tone="info" title={t('adminSettings.demoWarning')}>{t('adminSettings.simulatedNote') || t('admin.simulatedNote')}</Alert>
              </div>
            </Card>
          ) : null}

          {tab === 'payments' ? (
            <>
              <Card>
                <CardHeader title={t('adminSettings.payments')} description={t('adminSettings.commissionDesc')} />
                <div className="space-y-4 p-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <ToggleCard label={t('adminSettings.onlinePayments')} description={t('adminSettings.onlinePaymentsDesc')} checked={Boolean(form.methods?.online)} onChange={() => toggleMethod('online')} />
                    <ToggleCard label={t('adminSettings.manualPayments')} description={t('adminSettings.manualPaymentsDesc')} checked={Boolean(form.methods?.manual)} onChange={() => toggleMethod('manual')} />
                    <ToggleCard label={t('payments.cib')} description={t('payments.cibDesc')} checked={Boolean(form.methods?.cib)} onChange={() => toggleMethod('cib')} />
                    <ToggleCard label={t('payments.edahabia')} description={t('payments.edahabiaDesc')} checked={Boolean(form.methods?.edahabia)} onChange={() => toggleMethod('edahabia')} />
                  </div>
                  <div>
                    <Label>{t('adminSettings.commission')}</Label>
                    <div className="flex items-center gap-3">
                      <input type="range" min="0" max="30" value={form.commission} onChange={(event) => setForm({ ...form, commission: Number(event.target.value) })} className="flex-1 accent-[var(--color-brand)]" />
                      <span className="w-14 rounded-lg bg-surface px-2 py-1.5 text-center text-xs font-bold text-ink">{number(form.commission)}%</span>
                    </div>
                    <p className="mt-1 text-[10px] text-muted">{t('adminSettings.commissionDesc')}</p>
                  </div>
                </div>
              </Card>

              <Card>
                <CardHeader title={t('adminSettings.bankDetails')} />
                <div className="space-y-4 p-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div><Label>{t('adminSettings.bankName')}</Label><Input value={form.manualPayment?.bank?.name || ''} onChange={(event) => updateBank({ name: event.target.value })} /></div>
                    <div><Label>{t('adminSettings.accountName')}</Label><Input value={form.manualPayment?.beneficiary || ''} onChange={(event) => updateManual({ beneficiary: event.target.value })} /></div>
                    <div><Label>CCP</Label><Input value={form.manualPayment?.ccp || ''} onChange={(event) => updateManual({ ccp: event.target.value })} /></div>
                    <div><Label>BaridiMob</Label><Input value={form.manualPayment?.baridimob || ''} onChange={(event) => updateManual({ baridimob: event.target.value })} /></div>
                    <div><Label>{t('adminSettings.rib')}</Label><Input value={form.manualPayment?.bank?.rib || ''} onChange={(event) => updateBank({ rib: event.target.value })} /></div>
                    <div><Label>{t('adminSettings.accountNumber')}</Label><Input value={form.manualPayment?.bank?.agency || ''} onChange={(event) => updateBank({ agency: event.target.value })} /></div>
                  </div>
                  <div>
                    <Label>{t('adminSettings.instructionsFr') || 'Instructions FR'}</Label>
                    <Textarea rows={3} value={form.manualPayment?.instructionsFr || ''} onChange={(event) => updateManual({ instructionsFr: event.target.value })} />
                  </div>
                  <div>
                    <Label>{t('adminSettings.instructionsAr') || 'Instructions AR'}</Label>
                    <Textarea rows={3} dir="rtl" value={form.manualPayment?.instructionsAr || ''} onChange={(event) => updateManual({ instructionsAr: event.target.value })} />
                  </div>
                </div>
              </Card>
            </>
          ) : null}

          {tab === 'notifications' ? (
            <Card>
              <CardHeader title={t('adminSettings.notifications')} description={t('adminSettings.emailNotificationsDesc')} />
              <div className="space-y-3 p-5">
                <ToggleCard label={t('adminSettings.emailNotifications')} description={t('adminSettings.emailNotificationsDesc')} checked={form.notifications?.email !== false} onChange={() => setForm({ ...form, notifications: { ...form.notifications, email: form.notifications?.email === false } })} />
                <ToggleCard label={t('adminSettings.newSchoolAlerts')} description={t('adminUsers.subtitle')} checked={form.notifications?.newSchools !== false} onChange={() => setForm({ ...form, notifications: { ...form.notifications, newSchools: form.notifications?.newSchools === false } })} />
                <ToggleCard label={t('notification.title')} description={t('notifications.markAllRead')} checked={form.notifications?.inApp !== false} onChange={() => setForm({ ...form, notifications: { ...form.notifications, inApp: form.notifications?.inApp === false } })} />
              </div>
            </Card>
          ) : null}

          {tab === 'danger' ? (
            <Card className="border-danger/25">
              <CardHeader title={t('adminSettings.dangerZone')} description={t('adminSettings.demoWarning')} />
              <div className="space-y-4 p-5">
                <Alert tone="danger" title={t('adminSettings.resetConfirm')}>{t('adminSettings.resetConfirmDesc')}</Alert>
                <div className="flex flex-wrap gap-2">
                  <Button variant="danger" icon={RotateCcw} onClick={() => setResetOpen(true)}>{t('adminSettings.resetDemo')}</Button>
                  <Button variant="secondary" icon={RefreshCcw} onClick={() => setForm({ ...state.platformSettings })}>{t('common.cancel')}</Button>
                </div>
              </div>
            </Card>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={resetDemo}
        title={t('adminSettings.resetConfirm')}
        description={t('adminSettings.resetConfirmDesc')}
        confirmLabel={t('adminSettings.resetDemo')}
        tone="danger"
      />
    </div>
  )
}

function ToggleCard({ label, description, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={cn(
        'flex items-start gap-3 rounded-xl border p-3 text-start transition',
        checked ? 'border-brand/30 bg-brand-soft/40' : 'border-line bg-white hover:bg-surface/60',
      )}
    >
      <span className={cn('mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg', checked ? 'bg-brand text-white' : 'bg-surface text-muted')}>
        {checked ? <CheckCircle2 size={16} /> : <Server size={16} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold text-ink">{label}</span>
        <span className="mt-0.5 block text-[10px] leading-relaxed text-muted">{description}</span>
      </span>
      <span className={cn('mt-1 h-4 w-7 shrink-0 rounded-full p-0.5 transition', checked ? 'bg-brand' : 'bg-line')}>
        <span className={cn('block h-3 w-3 rounded-full bg-white transition-transform', checked ? 'translate-x-3 rtl:-translate-x-3' : '')} />
      </span>
    </button>
  )
}

const PRIORITY_TONES = { low: 'neutral', normal: 'blue', high: 'warning', urgent: 'danger' }
const SUPPORT_STATUS_TONES = { open: 'warning', pending: 'blue', resolved: 'success', closed: 'neutral' }

export function AdminSupport() {
  const { t, date, dateTime, language } = useI18n()
  const { success, error: toastError } = useToast()
  const state = useTiwanzaStore()
  const [tab, setTab] = useState('all')
  const [query, setQuery] = useState('')
  const [priority, setPriority] = useState('all')
  const [selected, setSelected] = useState(null)
  const [reply, setReply] = useState('')
  const [replies, setReplies] = useState({})

  const requests = state.supportRequests
    .slice()
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .filter((request) => tab === 'all' || request.status === tab)
    .filter((request) => priority === 'all' || request.priority === priority)
    .filter((request) => {
      const value = query.toLowerCase().trim()
      if (!value) return true
      const school = getSchool(state, request.schoolId)
      const trainer = getTrainerBySchool(state, request.schoolId)
      return request.subject.toLowerCase().includes(value) || request.message.toLowerCase().includes(value) || school?.name?.toLowerCase().includes(value) || trainer?.name?.toLowerCase().includes(value)
    })

  const counts = {
    open: state.supportRequests.filter((item) => item.status === 'open').length,
    pending: state.supportRequests.filter((item) => item.status === 'pending').length,
    resolved: state.supportRequests.filter((item) => item.status === 'resolved').length,
  }

  const tabs = [
    { value: 'all', label: t('common.all'), count: state.supportRequests.length },
    { value: 'open', label: t('adminSupport.open'), count: counts.open },
    { value: 'pending', label: t('adminSupport.inProgress'), count: counts.pending },
    { value: 'resolved', label: t('adminSupport.resolved'), count: counts.resolved },
  ]

  function setStatus(request, status) {
    updateSupportRequestStatus(request.id, status)
    success(t('adminSupport.statusUpdated'))
    setSelected((current) => (current?.id === request.id ? { ...current, status } : current))
  }

  function sendReply() {
    if (!reply.trim()) return toastError(t('errors.required'))
    if (!selected) return
    setReplies((current) => ({ ...current, [selected.id]: [...(current[selected.id] || []), { id: Date.now(), body: reply.trim(), createdAt: new Date().toISOString() }] }))
    updateSupportRequestStatus(selected.id, 'pending')
    setSelected((current) => (current ? { ...current, status: 'pending' } : current))
    setReply('')
    success(t('adminSupport.replySuccess'))
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={t('nav.platform')}
        title={t('adminSupport.title')}
        description={t('adminSupport.subtitle')}
        actions={<Badge tone={counts.open ? 'warning' : 'success'} dot>{counts.open + counts.pending} {t('nav.support').toLowerCase()}</Badge>}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label={t('adminSupport.open')} value={counts.open} icon={LifeBuoy} tone="amber" />
        <StatCard label={t('adminSupport.inProgress')} value={counts.pending} icon={Clock} tone="blue" />
        <StatCard label={t('adminSupport.resolved')} value={counts.resolved} icon={CheckCircle2} tone="success" />
      </div>

      <Card>
        <div className="flex flex-col gap-2 border-b border-line p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Tabs items={tabs} value={tab} onChange={setTab} variant="pill" className="border-0" />
            <SearchField value={query} onChange={setQuery} placeholder={t('adminSupport.searchPlaceholder')} className="w-full sm:w-72" />
          </div>
          <div className="flex items-center gap-2">
            <Select value={priority} onChange={(event) => setPriority(event.target.value)} className="w-auto min-w-36">
              <option value="all">{t('adminSupport.allPriorities')}</option>
              <option value="low">{t('adminSupport.low')}</option>
              <option value="normal">{t('adminSupport.normal')}</option>
              <option value="high">{t('adminSupport.high')}</option>
              <option value="urgent">{t('adminSupport.urgent')}</option>
            </Select>
            <Badge tone="neutral">{t('adminSupport.resultsCount', { count: requests.length })}</Badge>
          </div>
        </div>

        {requests.length ? (
          <Table>
            <thead>
              <tr>
                <th>{t('adminSupport.tableSubject')}</th>
                <th>{t('adminSupport.tableRequester')}</th>
                <th className="hidden md:table-cell">{t('adminSupport.school')}</th>
                <th>{t('adminSupport.tablePriority')}</th>
                <th className="hidden sm:table-cell">{t('adminSupport.tableDate')}</th>
                <th className="text-end">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => {
                const school = getSchool(state, request.schoolId)
                const trainer = getTrainerBySchool(state, request.schoolId)
                return (
                  <tr key={request.id}>
                    <td>
                      <button type="button" onClick={() => { setSelected(request); setReply('') }} className="max-w-[280px] truncate text-start text-xs font-semibold text-ink hover:text-brand">{request.subject}</button>
                      <p className="mt-0.5 max-w-[280px] truncate text-[10px] text-muted">{request.message}</p>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Avatar name={trainer?.name || 'Tiwanza'} size="xs" />
                        <div className="min-w-0">
                          <p className="max-w-[140px] truncate text-[11px] font-medium text-ink">{trainer?.name || '—'}</p>
                          <p className="text-[10px] text-muted">{t('roles.trainer')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell text-xs text-muted">{school?.name || '—'}</td>
                    <td><Badge tone={PRIORITY_TONES[request.priority] || 'neutral'}>{t(`adminSupport.${request.priority}`)}</Badge></td>
                    <td className="hidden sm:table-cell whitespace-nowrap text-[11px] text-muted">{date(request.createdAt)}</td>
                    <td>
                      <div className="flex justify-end">
                        <Button variant="ghost" size="xs" icon={Eye} onClick={() => { setSelected(request); setReply('') }}>{t('adminSupport.viewRequest')}</Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        ) : (
          <EmptyState icon={LifeBuoy} title={t('adminSupport.noRequests')} description={t('adminSupport.noRequestsDesc')} />
        )}
      </Card>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={t('adminSupport.requestDetail')}
        description={selected?.subject}
        size="lg"
        footer={
          selected ? (
            <>
              <Button variant="secondary" onClick={() => setSelected(null)}>{t('common.close')}</Button>
              {selected.status !== 'resolved' ? <Button variant="soft" icon={CheckCircle2} onClick={() => setStatus(selected, 'resolved')}>{t('adminSupport.markResolved')}</Button> : null}
              {selected.status !== 'closed' ? <Button variant="ghost" onClick={() => setStatus(selected, 'closed')}>{t('adminSupport.closeRequest')}</Button> : null}
            </>
          ) : null
        }
      >
        {selected ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={SUPPORT_STATUS_TONES[selected.status] || 'neutral'} dot>{t(`adminSupport.${selected.status === 'pending' ? 'inProgress' : selected.status}`)}</Badge>
              <Badge tone={PRIORITY_TONES[selected.priority] || 'neutral'}>{t(`adminSupport.${selected.priority}`)}</Badge>
              <span className="text-[10px] text-muted">{dateTime(selected.createdAt)}</span>
            </div>

            <div className="rounded-xl bg-surface p-4">
              <p className="text-xs leading-relaxed text-ink">{selected.message}</p>
            </div>

            <div className="grid gap-3 rounded-xl border border-line p-4 text-xs sm:grid-cols-2">
              <SupportDetail icon={Building2} label={t('adminSupport.school')} value={getSchool(state, selected.schoolId)?.name || '—'} />
              <SupportDetail icon={UserRound} label={t('adminSupport.requester')} value={getTrainerBySchool(state, selected.schoolId)?.name || '—'} />
              <SupportDetail icon={Mail} label={t('adminSettings.supportEmail')} value={getTrainerBySchool(state, selected.schoolId)?.email || '—'} />
              <SupportDetail icon={ShieldAlert} label={t('adminSupport.tablePriority')} value={t(`adminSupport.${selected.priority}`)} />
            </div>

            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-ink"><MessageSquare size={13} /> {t('adminSupport.conversation')}</p>
              <div className="space-y-2">
                {(replies[selected.id] || []).map((item) => (
                  <div key={item.id} className="rounded-xl bg-brand-soft/50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold text-brand">{t('roles.admin')}</span>
                      <span className="text-[9px] text-muted">{dateTime(item.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-ink">{item.body}</p>
                  </div>
                ))}
                {!(replies[selected.id] || []).length ? <p className="rounded-xl border border-dashed border-line p-3 text-[11px] text-muted">{t('adminSupport.noReply')}</p> : null}
              </div>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Textarea rows={2} value={reply} onChange={(event) => setReply(event.target.value)} placeholder={t('adminSupport.replyPlaceholder')} className="flex-1" />
                <Button icon={Send} onClick={sendReply} className="sm:self-end">{t('adminSupport.sendReply')}</Button>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}

function SupportDetail({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={13} className="mt-0.5 shrink-0 text-muted" />
      <div className="min-w-0">
        <p className="text-[10px] text-muted">{label}</p>
        <p className="truncate font-medium text-ink">{value}</p>
      </div>
    </div>
  )
}

const ACTIVITY_GROUPS = {
  schools: ['trainer_registered', 'school_created', 'school_updated'],
  payments: ['course_payment_pending', 'course_payment_validated', 'course_payment_rejected', 'subscription_manual', 'subscription_paid', 'subscription_approved', 'subscription_rejected'],
  courses: ['course_created', 'course_published', 'course_updated', 'course_deleted', 'enrollment_created', 'lesson_completed', 'quiz_passed', 'announcement_published', 'comment_created', 'event_created'],
  subscriptions: ['subscription_manual', 'subscription_paid', 'subscription_approved', 'subscription_rejected', 'subscription_free', 'plan_updated'],
  support: ['support_requested'],
}

const ACTIVITY_ICONS = {
  school_created: Building2,
  trainer_registered: Users,
  course_published: BookOpen,
  course_created: BookOpen,
  enrollment_created: GraduationCapFallback,
  lesson_completed: CheckCircle2,
  quiz_passed: Sparkles,
  course_payment_pending: CreditCard,
  course_payment_validated: Wallet,
  course_payment_rejected: AlertTriangle,
  subscription_manual: CreditCard,
  subscription_paid: Wallet,
  plan_updated: SettingsIcon,
  support_requested: LifeBuoy,
  comment_created: MessageSquare,
}

function GraduationCapFallback(props) {
  return <UserRound {...props} />
}

export function AdminActivity() {
  const { t, dateTime, date, number } = useI18n()
  const state = useTiwanzaStore()
  const [type, setType] = useState('all')
  const [query, setQuery] = useState('')

  const rows = state.activity
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .filter((entry) => {
      if (type === 'all') return true
      return (ACTIVITY_GROUPS[type] || []).includes(entry.type)
    })
    .filter((entry) => {
      const value = query.toLowerCase().trim()
      if (!value) return true
      const actor = state.users.find((user) => user.id === entry.actorId)
      const school = getSchool(state, entry.schoolId)
      const course = getCourse(state, entry.courseId)
      return [actor?.name, actor?.email, school?.name, course?.title, t(`activity.${activityKey(entry.type)}`)].some((item) => String(item || '').toLowerCase().includes(value))
    })

  const groups = useMemo(() => {
    const now = new Date()
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startWeek = new Date(startToday.getTime() - 6 * 24 * 60 * 60 * 1000)
    return [
      { key: 'today', label: t('adminActivity.today'), items: rows.filter((entry) => new Date(entry.createdAt) >= startToday) },
      { key: 'week', label: t('adminActivity.thisWeek'), items: rows.filter((entry) => { const value = new Date(entry.createdAt); return value < startToday && value >= startWeek }) },
      { key: 'older', label: t('adminActivity.older'), items: rows.filter((entry) => new Date(entry.createdAt) < startWeek) },
    ].filter((group) => group.items.length)
  }, [rows, t])

  function exportRows() {
    downloadCsv(
      `tiwanza-activite-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        [t('common.date'), t('adminActivity.title'), t('adminUsers.tableUser'), t('adminSupport.school'), t('adminPayments.tableCourse')],
        ...rows.map((entry) => {
          const actor = state.users.find((user) => user.id === entry.actorId)
          return [
            dateTime(entry.createdAt),
            t(`activity.${activityKey(entry.type)}`),
            actor?.name || '',
            getSchool(state, entry.schoolId)?.name || '',
            getCourse(state, entry.courseId)?.title || '',
          ]
        }),
      ],
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={t('nav.platform')}
        title={t('adminActivity.title')}
        description={t('adminActivity.subtitle')}
        actions={<Button variant="secondary" icon={Download} onClick={exportRows}>{t('adminPayments.exportCsv')}</Button>}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label={t('activity.title')} value={number(rows.length)} icon={ActivityIcon} tone="brand" />
        <StatCard label={t('adminActivity.today')} value={number(groups.find((group) => group.key === 'today')?.items.length || 0)} icon={Clock} tone="amber" />
        <StatCard label={t('adminActivity.thisWeek')} value={number(groups.filter((group) => group.key !== 'older').reduce((sum, group) => sum + group.items.length, 0))} icon={Sparkles} tone="blue" />
      </div>

      <Card>
        <div className="flex flex-col gap-2 border-b border-line p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Select value={type} onChange={(event) => setType(event.target.value)} className="w-auto min-w-36">
              <option value="all">{t('adminActivity.allTypes')}</option>
              <option value="schools">{t('adminActivity.schools')}</option>
              <option value="payments">{t('adminActivity.payments')}</option>
              <option value="courses">{t('adminActivity.courses')}</option>
              <option value="subscriptions">{t('adminActivity.subscriptions')}</option>
              <option value="support">{t('adminActivity.support')}</option>
            </Select>
            <Badge tone="neutral">{number(rows.length)}</Badge>
          </div>
          <SearchField value={query} onChange={setQuery} placeholder={t('adminActivity.searchPlaceholder') || t('adminUsers.searchPlaceholder')} className="w-full sm:w-72" />
        </div>

        {groups.length ? (
          <div className="divide-y divide-line">
            {groups.map((group) => (
              <div key={group.key} className="p-4">
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-muted">{group.label}</span>
                  <span className="h-px flex-1 bg-line" />
                  <Badge tone="neutral" size="xs">{group.items.length}</Badge>
                </div>
                <div className="space-y-1">
                  {group.items.map((entry) => {
                    const actor = state.users.find((user) => user.id === entry.actorId)
                    const school = getSchool(state, entry.schoolId)
                    const course = getCourse(state, entry.courseId)
                    const Icon = ACTIVITY_ICONS[entry.type] || ActivityIcon
                    return (
                      <div key={entry.id} className="flex items-start gap-3 rounded-lg p-2 transition hover:bg-surface/60">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-soft/60 text-brand"><Icon size={15} /></span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] leading-relaxed text-ink">
                            <span className="font-semibold">{actor?.name || 'Tiwanza'}</span>
                            <span className="text-muted"> — {t(`activity.${activityKey(entry.type)}`)}</span>
                          </p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-muted">
                            {school ? <span className="inline-flex items-center gap-1"><Building2 size={10} /> {school.name}</span> : null}
                            {course ? <span className="inline-flex items-center gap-1"><BookOpen size={10} /> {course.title}</span> : null}
                            {entry.meta?.amount ? <span className="inline-flex items-center gap-1"><Wallet size={10} /> {entry.meta.amount} DA</span> : null}
                          </div>
                        </div>
                        <span className="shrink-0 whitespace-nowrap text-[10px] text-muted">{dateTime(entry.createdAt)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={ActivityIcon} title={t('adminActivity.noActivity')} description={t('adminActivity.noActivityDesc')} />
        )}
      </Card>
    </div>
  )
}
