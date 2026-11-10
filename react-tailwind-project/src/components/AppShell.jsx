import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Activity,
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  CreditCard,
  FileQuestion,
  GraduationCap,
  Home,
  Languages,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Mail,
  Megaphone,
  Menu,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
  RotateCcw,
  School,
  Settings,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRound,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import { useAuth, roleHome } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'
import { useTiwanzaStore } from '../data/store.js'
import {
  getSchool,
  getSchoolEnrollments,
  getUnreadAnnouncements,
  getTrainerProfile,
} from '../data/selectors.js'
import { resetDemoData, demoLogin } from '../data/services.js'
import { cn } from '../lib/utils.js'
import { Avatar, Badge, Button, IconButton } from './ui.jsx'

const adminNav = [
  { key: 'nav.dashboard', to: '/admin', icon: LayoutDashboard, end: true },
  { key: 'adminSchools.title', to: '/admin/schools', icon: School },
  { key: 'adminSubscriptions.title', to: '/admin/subscriptions', icon: CreditCard, badge: 'subscriptions' },
  { key: 'adminPayments.title', to: '/admin/payments', icon: Wallet },
  { key: 'adminUsers.title', to: '/admin/users', icon: Users },
  { key: 'adminPlans.title', to: '/admin/plans', icon: Sparkles },
  { key: 'adminActivity.title', to: '/admin/activity', icon: Activity },
  { key: 'adminSupport.title', to: '/admin/support', icon: LifeBuoy, badge: 'support' },
  { key: 'adminSettings.title', to: '/admin/settings', icon: Settings },
]

const trainerNav = [
  { key: 'nav.dashboard', to: '/trainer', icon: LayoutDashboard, end: true },
  { key: 'trainerCourses.title', to: '/trainer/courses', icon: BookOpen },
  { key: 'trainerLearners.title', to: '/trainer/learners', icon: Users },
  { key: 'trainerEnrollments.title', to: '/trainer/enrollments', icon: ClipboardList, badge: 'enrollments' },
  { key: 'trainerPayments.title', to: '/trainer/payments', icon: Wallet, badge: 'payments' },
  { key: 'trainerSales.title', to: '/trainer/sales', icon: TrendingUp },
  { key: 'trainerQuizzes.title', to: '/trainer/quizzes', icon: FileQuestion },
  { key: 'trainerAnnouncements.title', to: '/trainer/announcements', icon: Megaphone },
  { key: 'trainerComments.title', to: '/trainer/comments', icon: MessageSquare },
  { key: 'trainerCalendar.title', to: '/trainer/calendar', icon: CalendarDays },
  { key: 'nav.school', to: '/trainer/school', icon: Building2 },
  { key: 'trainerPaymentSettings.title', to: '/trainer/payment-settings', icon: CreditCard },
  { key: 'subscription.title', to: '/trainer/subscription', icon: ShieldCheck },
]

const learnerNav = [
  { key: 'nav.dashboard', to: '/learn', icon: Home, end: true },
  { key: 'learner.myCourses', to: '/learn/courses', icon: BookOpen },
  { key: 'learner.announcements', to: '/learn/announcements', icon: Megaphone, badge: 'unread' },
  { key: 'learner.quizResults', to: '/learn/quiz-results', icon: FileQuestion },
  { key: 'learner.upcomingEvents', to: '/learn/calendar', icon: CalendarDays },
  { key: 'learner.myPayments', to: '/learn/payments', icon: Receipt },
  { key: 'learner.profile', to: '/learn/profile', icon: UserRound },
]

function roleNav(role) {
  if (role === 'admin') return adminNav
  if (role === 'trainer') return trainerNav
  return learnerNav
}

export default function AppShell() {
  const { user, isAdmin, isTrainer, isLearner, logout } = useAuth()
  const { t, language, toggleLanguage } = useI18n()
  const { success, info } = useToast()
  const state = useTiwanzaStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
    setNotificationsOpen(false)
    setProfileOpen(false)
  }, [location.pathname])

  const nav = roleNav(user?.role)
  const school = user?.schoolId ? getSchool(state, user.schoolId) : null
  const profile = isTrainer ? getTrainerProfile(state, user.id) : null
  const pendingSubscriptionPayments = state.subscriptionPayments.filter((item) => item.status === 'pending').length
  const supportOpen = state.supportRequests.filter((item) => item.status === 'open' || item.status === 'in_progress').length
  const pendingEnrollments = school
    ? state.coursePayments.filter((item) => item.schoolId === school.id && item.status === 'pending').length
    : 0
  const unreadAnnouncements = isLearner ? getUnreadAnnouncements(state, user.id).length : 0
  const schoolLearners = school ? new Set(getSchoolEnrollments(state, school.id).filter((e) => e.status === 'active').map((e) => e.learnerId)).size : 0

  const badgeCounts = {
    subscriptions: pendingSubscriptionPayments,
    support: supportOpen,
    enrollments: pendingEnrollments,
    payments: pendingEnrollments,
    unread: unreadAnnouncements,
  }

  const notifications = useMemo(() => {
    if (isAdmin) {
      return state.subscriptionPayments
        .filter((item) => item.status === 'pending')
        .slice(0, 4)
        .map((item) => {
          const trainer = state.users.find((entry) => entry.id === item.trainerId)
          return {
            id: item.id,
            icon: CreditCard,
            title: t('adminSubscriptions.approveTitle'),
            description: `${trainer?.name || '—'} · ${item.reference}`,
            to: '/admin/subscriptions',
          }
        })
    }
    if (isTrainer && school) {
      return state.coursePayments
        .filter((item) => item.schoolId === school.id && item.status === 'pending')
        .slice(0, 4)
        .map((item) => {
          const learner = state.users.find((entry) => entry.id === item.learnerId)
          const course = state.courses.find((entry) => entry.id === item.courseId)
          return {
            id: item.id,
            icon: Wallet,
            title: t('trainerPayments.pending'),
            description: `${learner?.name || '—'} · ${course?.title || '—'}`,
            to: '/trainer/payments',
          }
        })
    }
    if (isLearner) {
      return getUnreadAnnouncements(state, user.id)
        .slice(0, 4)
        .map((item) => ({
          id: item.id,
          icon: Megaphone,
          title: item.title,
          description: item.content,
          to: `/learn/announcements/${item.id}`,
        }))
    }
    return []
  }, [state, isAdmin, isTrainer, isLearner, school, user, t])

  const currentNav = [...nav].sort((a, b) => b.to.length - a.to.length).find((item) => {
    if (item.end) return location.pathname === item.to
    return location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)
  })

  const pageTitle = currentNav ? t(currentNav.key) : t('nav.dashboard')

  function handleLogout() {
    logout()
    success(t('auth.logoutSuccess'))
    navigate('/')
  }

  function switchDemo(userId) {
    const result = demoLogin(userId)
    if (result.ok) {
      info(t('auth.demoNotice'))
      navigate(roleHome[result.user.role] || '/')
    }
  }

  function resetDemo() {
    resetDemoData()
    success(t('adminSettings.resetSuccess'))
    navigate('/login')
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className={cn('flex h-16 items-center gap-2 border-b border-line px-4', collapsed ? 'justify-center px-2' : 'justify-between')}>
        <Link to={roleHome[user.role]} className="flex min-w-0 items-center gap-2.5">
          <span className="brand-gradient grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white shadow-sm">
            <GraduationCap size={19} />
          </span>
          {!collapsed ? (
            <span className="min-w-0">
              <span className="brand-font block text-lg font-bold leading-none tracking-tight text-ink">Tiwanza</span>
              <span className="mt-1 block truncate text-[10px] font-medium uppercase tracking-[0.14em] text-muted">{t(`roles.${user.role}`)}</span>
            </span>
          ) : null}
        </Link>
        {!collapsed ? (
          <IconButton label={t('common.closeMenu')} onClick={() => setCollapsed(true)} size="sm" className="hidden lg:inline-grid">
            <PanelLeftClose size={16} />
          </IconButton>
        ) : null}
      </div>

      {!collapsed && isTrainer && school ? (
        <div className="mx-3 mt-3 rounded-xl border border-line bg-surface/60 p-2.5">
          <div className="flex items-center gap-2">
            <Avatar name={school.name} src={school.logo} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-ink">{school.name}</p>
              <p className="truncate text-[10px] text-muted">{school.subdomain}</p>
            </div>
          </div>
        </div>
      ) : null}

      <nav className={cn('thin-scroll mt-3 flex-1 overflow-y-auto px-2 pb-4', collapsed && 'px-1.5')}>
        <div className="space-y-0.5">
          {nav.map((item) => {
            const count = item.badge ? badgeCounts[item.badge] : 0
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                title={collapsed ? t(item.key) : undefined}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition',
                    isActive ? 'bg-brand-soft text-brand-dark' : 'text-muted hover:bg-surface hover:text-ink',
                    collapsed && 'justify-center px-0',
                  )
                }
              >
                <item.icon size={17} className="shrink-0" />
                {!collapsed ? <span className="min-w-0 flex-1 truncate">{t(item.key)}</span> : null}
                {!collapsed && count > 0 ? (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">{count}</span>
                ) : null}
                {collapsed && count > 0 ? <span className="absolute h-1.5 w-1.5 rounded-full bg-brand" /> : null}
              </NavLink>
            )
          })}
        </div>

        {!collapsed && isLearner && school ? (
          <div className="mt-4 border-t border-line pt-3">
            <Link
              to={`/s/${school.slug}`}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-muted transition hover:bg-surface hover:text-ink"
            >
              <Building2 size={17} />
              <span className="flex-1 truncate">{t('nav.publicSite')}</span>
            </Link>
          </div>
        ) : null}
      </nav>

      <div className={cn('border-t border-line p-2', collapsed && 'px-1.5')}>
        <div className={cn('rounded-xl bg-surface/70 p-2.5', collapsed && 'flex justify-center')}>
          {!collapsed ? (
            <div className="flex items-start gap-2">
              <Sparkles size={15} className="mt-0.5 shrink-0 text-brand" />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-ink">{t('app.demoBadge')}</p>
                <p className="mt-0.5 text-[10px] leading-relaxed text-muted">{t('app.version')} · {t('common.simulated')}</p>
              </div>
            </div>
          ) : (
            <Sparkles size={15} className="text-brand" />
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-surface">
      <aside
        className={cn(
          'fixed inset-y-0 start-0 z-40 hidden border-e border-line bg-white transition-[width] duration-200 lg:block',
          collapsed ? 'w-[72px]' : 'w-[252px]',
        )}
      >
        {sidebar}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label={t('common.closeMenu')} className="absolute inset-0 bg-ink/35" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 h-full w-[280px] animate-slide-end border-e border-line bg-white">
            <div className="absolute end-2 top-2 z-10">
              <IconButton label={t('common.closeMenu')} onClick={() => setMobileOpen(false)} size="sm">
                <X size={17} />
              </IconButton>
            </div>
            {sidebar}
          </div>
        </div>
      ) : null}

      <div className={cn('transition-[padding] duration-200', collapsed ? 'lg:ps-[72px]' : 'lg:ps-[252px]')}>
        <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
          <div className="flex h-16 items-center gap-2 px-3 sm:px-5">
            <IconButton label={t('common.openMenu')} onClick={() => setMobileOpen(true)} className="lg:hidden">
              <Menu size={19} />
            </IconButton>
            {collapsed ? (
              <IconButton label={t('common.openMenu')} onClick={() => setCollapsed(false)} className="hidden lg:inline-grid">
                <PanelLeftOpen size={17} />
              </IconButton>
            ) : null}

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{pageTitle}</p>
              <p className="hidden truncate text-[11px] text-muted sm:block">
                {isTrainer && school ? school.name : t('app.tagline')}
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="sm" onClick={toggleLanguage} className="hidden px-2.5 sm:inline-flex" title={t('common.language')}>
                <Languages size={15} />
                <span className="text-xs font-bold uppercase">{language === 'fr' ? 'AR' : 'FR'}</span>
              </Button>

              <div className="relative">
                <IconButton label={t('common.notifications')} onClick={() => { setNotificationsOpen((v) => !v); setProfileOpen(false) }} className="relative">
                  <Bell size={17} />
                  {notifications.length ? <span className="absolute end-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-danger ring-2 ring-white" /> : null}
                </IconButton>
                {notificationsOpen ? (
                  <>
                    <button type="button" aria-label="Fermer" className="fixed inset-0 z-20 cursor-default" onClick={() => setNotificationsOpen(false)} />
                    <div className="absolute end-0 top-full z-30 mt-2 w-[320px] max-w-[calc(100vw-24px)] animate-slide-up overflow-hidden rounded-xl border border-line bg-white shadow-xl">
                      <div className="flex items-center justify-between border-b border-line px-4 py-3">
                        <p className="text-xs font-semibold text-ink">{t('common.notifications')}</p>
                        <Badge tone="brand">{notifications.length}</Badge>
                      </div>
                      {notifications.length ? (
                        <div className="max-h-80 overflow-y-auto">
                          {notifications.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => { setNotificationsOpen(false); navigate(item.to) }}
                              className="flex w-full items-start gap-2.5 border-b border-line/70 px-4 py-3 text-start transition last:border-0 hover:bg-surface"
                            >
                              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
                                <item.icon size={15} />
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate text-xs font-semibold text-ink">{item.title}</span>
                                <span className="mt-0.5 line-clamp-2 block text-[11px] leading-relaxed text-muted">{item.description}</span>
                              </span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="px-4 py-8 text-center text-xs text-muted">{t('activity.noActivity')}</p>
                      )}
                    </div>
                  </>
                ) : null}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setProfileOpen((v) => !v); setNotificationsOpen(false) }}
                  className="flex items-center gap-2 rounded-lg p-1 transition hover:bg-surface"
                >
                  <Avatar name={user.name} size="sm" />
                  <span className="hidden min-w-0 text-start sm:block">
                    <span className="block max-w-[120px] truncate text-xs font-semibold text-ink">{user.name}</span>
                    <span className="block text-[10px] text-muted">{t(`roles.${user.role}`)}</span>
                  </span>
                  <ChevronDown size={14} className="hidden text-muted sm:block" />
                </button>
                {profileOpen ? (
                  <>
                    <button type="button" aria-label="Fermer" className="fixed inset-0 z-20 cursor-default" onClick={() => setProfileOpen(false)} />
                    <div className="absolute end-0 top-full z-30 mt-2 w-64 animate-slide-up overflow-hidden rounded-xl border border-line bg-white shadow-xl">
                      <div className="border-b border-line px-4 py-3">
                        <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
                        <p className="truncate text-[11px] text-muted">{user.email}</p>
                        <Badge tone="brand" className="mt-2">{t(`roles.${user.role}`)}</Badge>
                      </div>
                      <div className="p-1">
                        <button type="button" onClick={() => { setProfileOpen(false); navigate(isTrainer ? '/trainer/profile' : isLearner ? '/learn/profile' : '/admin/settings') }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-ink hover:bg-surface">
                          <UserRound size={14} /> {t('common.profile')}
                        </button>
                        <button type="button" onClick={toggleLanguage} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-ink hover:bg-surface sm:hidden">
                          <Languages size={14} /> {language === 'fr' ? 'العربية' : 'Français'}
                        </button>
                        <div className="my-1 border-t border-line" />
                        <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted">{t('common.demoAccount')}</p>
                        <button type="button" onClick={() => switchDemo('u-admin')} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-ink hover:bg-surface">
                          <ShieldCheck size={14} /> {t('auth.demoAdmin')}
                        </button>
                        <button type="button" onClick={() => switchDemo('u-t1')} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-ink hover:bg-surface">
                          <GraduationCap size={14} /> {t('auth.demoTrainer')}
                        </button>
                        <button type="button" onClick={() => switchDemo('u-l1')} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-ink hover:bg-surface">
                          <BookOpen size={14} /> {t('auth.demoLearner')}
                        </button>
                        <div className="my-1 border-t border-line" />
                        <button type="button" onClick={resetDemo} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted hover:bg-surface hover:text-ink">
                          <RotateCcw size={14} /> {t('adminSettings.resetDemo')}
                        </button>
                        <button type="button" onClick={handleLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-danger hover:bg-danger-soft">
                          <LogOut size={14} /> {t('common.logout')}
                        </button>
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 sm:py-7">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
