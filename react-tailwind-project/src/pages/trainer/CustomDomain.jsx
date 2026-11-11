import { useMemo, useState } from 'react'
import {
  CheckCircle2,
  ExternalLink,
  Globe2,
  ShieldCheck,
  Alert,
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
  Select,
  StatCard,
  Switch,
  Table,
  Textarea,
} from '../../components/ui.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useI18n } from '../../i18n/I18nContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { useTiwanzaStore } from '../../data/store.js'
import {
  getPlan,
  getPlanUsage,
  getPlans,
  getSchool,
  getTrainerProfile,
  getTrainerSubscription,
  isSubscriptionActive,
} from '../../data/selectors.js'
import {
  activateFreePlan,
  cancelSubscription,
  checkSubdomainAvailability,
  submitSubscriptionManual,
  submitSubscriptionOnline,
  testChargerlyConnection,
  updatePlan,
  updateSchool,
  updateSchoolPaymentSettings,
  updateUser,
} from '../../data/services.js'
import { cn } from '../../lib/utils.js'

function useTrainerSchool() {
  const { user } = useAuth()
  const state = useTiwanzaStore()
  const school = getSchool(state, user?.schoolId)
  const profile = getTrainerProfile(state, user?.id)
  const subscription = getTrainerSubscription(state, user?.id)
  return { user, state, school, profile, subscription }
}

export function CustomDomain() {
  const { user, state, school, profile, subscription } = useTrainerSchool()
  const { t, money, date } = useI18n()
  const { success, error: toastError } = useToast()
  const [form, setForm] = useState({ domain: '' })
  const [status, setStatus] = useState('not-connected')
  const [verifying, setVerifying] = useState(false)
  const [sslStatus, setSslStatus] = useState(null)
  const [editing, setEditing] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  if (!school) return <EmptyState icon={Globe2} title={t('customDomain.title')} description={t('customDomain.subtitle')} />

  function set(key, value) { setForm((current) => ({ ...current, [key]: value })) }

  function handleDomainChange(event) {
    const value = event.target.value.replace(/[^a-z0-9.-]/gi, '').toLowerCase()
    set('domain', value)
  }

  function connectDomain() {
    const domain = form.domain.trim()
    if (!domain) return toastError(t('errors.requiredFields'))

    if (!domain.includes('.')) return toastError(t('customDomain.errorInvalidDomain'))

    setStatus('verifying')
    setVerifying(true)

    setTimeout(() => {
      const isValid = domain.includes('.') && domain.length > 3
      if (isValid) {
        setStatus('connected')
        setSslStatus('active')
        success(t('customDomain.connected'))
      } else {
        setStatus('not-connected')
        setSslStatus('error')
        toastError(t('customDomain.errorVerificationFailed'))
      }
      setVerifying(false)
    }, 1500)
  }

  function disconnectDomain() {
    setRemoving(true)
    setTimeout(() => {
      setStatus('not-connected')
      setSslStatus(null)
      success(t('customDomain.removeSuccess'))
      setRemoving(false)
    }, 1000)
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => success(t('customDomain.copySuccess')))
  }

  function viewSite() {
    window.open(`/s/${school.slug}`, '_blank')
  }

  const usageRows = [
    { label: t('subscription.usageCourses'), used: 1, limit: -1 },
    { label: t('subscription.usageLearners'), used: 0, limit: -1 },
  ]

  return (
    <div className="space-y-5">
      <PageHeader eyebrow={t('nav.trainer')} title={t('customDomain.title')} description={t('customDomain.subtitle')} />

      <div className="space-y-4">
        <Card>
          <CardHeader title={t('customDomain.status')} description={t(`customDomain.${status}.desc`)} />
          <div className="p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              {status === 'not-connected' ? (
                <div>
                  <Label>{t('customDomain.domain')}</Label>
                  <Input
                    placeholder={t('customDomain.domainPlaceholder')}
                    value={form.domain}
                    onChange={handleDomainChange}
                    disabled={verifying}
                    className="w-full"
                    hint={t('customDomain.hint')}
                  />
                  <Button variant="primary" onClick={connectDomain} disabled={verifying}>
                    {verifying ? t('customDomain.verify') : t('customDomain.addDomain')}
                  </Button>
                </div>
              ) : status === 'connected' ? (
                <div>
                  <div className="flex items-center gap-3">
                    <Badge tone="success" size="sm">{t('customDomain.connected')}</Badge>
                    <Badge tone="success" size="sm">{t('customDomain.sslActive')}</Badge>
                  </div>
                  <p className="text-muted text-sm">{t('customDomain.verifiedDesc', { domain: form.domain })}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <Button variant="secondary" size="sm" onClick={() => copyToClipboard(form.domain)}>
                      {t('customDomain.copyDomain')}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={disconnectDomain} className="text-danger">
                      {t('customDomain.removeDomain')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <Badge tone="error" size="sm">{t('customDomain.error')}</Badge>
                  <p className="text-muted text-sm mt-2">{t('customDomain.errorInvalidDomain')}</p>
                  <Button variant="primary" onClick={connectDomain} disabled={verifying}>
                    {verifying ? t('customDomain.verify') : t('customDomain.addDomain')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>

        {status === 'connected' && (
          <Card>
            <CardHeader title={t('customDomain.domainManagement')} description={t('customDomain.manageDesc')} />
            <div className="p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>{t('customDomain.subdomain')}</Label>
                  <p className="mt-1 text-[10px] text-muted">{school.slug}.tiwanza.com</p>
                  <Button variant="secondary" size="sm" onClick={() => viewSite()}>
                    {t('customDomain.viewSite')}
                  </Button>
                </div>
                <div>
                  <Label>{t('customDomain.sslStatus')}</Label>
                  <Badge tone={sslStatus === 'active' ? 'success' : sslStatus === 'pending' ? 'warning' : 'error'}>
                    {t(`customDomain.ssl.${sslStatus}`)}
                  </Badge>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-line">
                <Label>{t('customDomain.dnsRecords')}</Label>
                <div className="grid gap-3 sm:grid-cols-2 mt-3 p-3 bg-surface rounded">
                  <div>
                    <Label>@</Label>
                    <Input value="@" readOnly className="w-full p-2 border rounded text-muted" />
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard('@')}>
                      Copy
                    </Button>
                  </div>
                  <div>
                    <Label>www</Label>
                    <Input value="www" readOnly className="w-full p-2 border rounded text-muted" />
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard('www')}>
                      Copy
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {editing && (
          <ConfirmDialog
            open={editing}
            onClose={() => setEditing(false)}
            onConfirm={disconnectDomain}
            title={t('customDomain.removeConfirm')}
            description={t('customDomain.removeConfirmDesc')}
            confirmLabel={t('customDomain.remove')}
          />
        )}
      </div>
    </div>
  )
}