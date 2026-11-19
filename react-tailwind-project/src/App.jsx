import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { BookOpen, GraduationCap } from 'lucide-react'
import { useAuth } from './context/AuthContext.jsx'
import { useI18n } from './i18n/I18nContext.jsx'
import { useTiwanzaStore } from './data/store.js'
import { canUsePlanFeature, getSchoolBySlug } from './data/selectors.js'
import PublicLayout from './components/PublicLayout.jsx'
import AppShell from './components/AppShell.jsx'
import LandingPage from './pages/public/LandingPage.jsx'
import { CourseCheckout, PublicCourseDetail, PublicSchoolCourses, SchoolHome } from './pages/public/PublicSchool.jsx'
import AuthPage from './pages/auth/AuthPage.jsx'
import OnboardingPage from './pages/auth/OnboardingPage.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import { AdminPayments } from './pages/admin/AdminPayments.jsx'
import { AdminSchoolDetail, AdminSchools } from './pages/admin/AdminSchools.jsx'
import { AdminSubscriptions } from './pages/admin/AdminSubscriptions.jsx'
import { AdminActivity, AdminSettings, AdminSupport } from './pages/admin/AdminSystem.jsx'
import { AdminPlans, AdminUsers } from './pages/admin/AdminUsersPlans.jsx'
import TrainerDashboard from './pages/trainer/TrainerDashboard.jsx'
import TrainerCourses from './pages/trainer/TrainerCourses.jsx'
import TrainerCourseEditor from './pages/trainer/TrainerCourseEditor.jsx'
import { TrainerEnrollments, TrainerLearners, TrainerPayments, TrainerSales } from './pages/trainer/TrainerPeople.jsx'
import { TrainerAnnouncements, TrainerCalendar, TrainerComments, TrainerQuizzes } from './pages/trainer/TrainerEngagement.jsx'
import { TrainerPaymentSettings, TrainerProfile, TrainerSchool, TrainerSubscription } from './pages/trainer/TrainerSettings.jsx'
import CoursePlayer from './pages/learner/CoursePlayer.jsx'
import {
  LearnerAnnouncements,
  LearnerCalendar,
  LearnerCourses,
  LearnerDashboard,
  LearnerPayments,
  LearnerProfile,
  LearnerQuizResults,
} from './pages/learner/LearnerPages.jsx'
import { Button, EmptyState } from './components/ui.jsx'

function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.slice(1))
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
    }
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname, hash])
  return null
}

function ProtectedRoute({ roles, schoolScoped = false, children }) {
  const { user, isAuthenticated } = useAuth()
  const { pathname } = useLocation()
  const { slug } = useParams()
  const state = useTiwanzaStore()
  const learnerOnly = roles?.length === 1 && roles[0] === 'learner'
  const school = schoolScoped && slug ? getSchoolBySlug(state, slug) : null

  if (!isAuthenticated) {
    if (schoolScoped && slug) return <Navigate to={`/s/${slug}/login?redirect=${encodeURIComponent(pathname)}`} replace />
    if (learnerOnly) return <Navigate to="/" replace />
    return <Navigate to={`/login?redirect=${encodeURIComponent(pathname)}`} replace />
  }
  if (roles && !roles.includes(user.role)) {
    if (schoolScoped && slug) return <Navigate to={`/s/${slug}`} replace />
    const schoolForRole = user.schoolId ? state.schools.find((item) => item.id === user.schoolId) : null
    return <Navigate to={user.role === 'admin' ? '/admin' : user.role === 'trainer' ? '/trainer' : schoolForRole ? `/s/${schoolForRole.slug}/learn` : '/'} replace />
  }
  if (schoolScoped && (!school || user.schoolId !== school.id)) return <Navigate to="/" replace />
  if (user.role === 'learner' && !user.schoolId) return <Navigate to="/" replace />
  if (user.role === 'trainer' && !user.schoolId && pathname !== '/onboarding') return <Navigate to="/onboarding" replace />
  return children
}

function LegacyLearnerRedirect() {
  const { user, isAuthenticated } = useAuth()
  const state = useTiwanzaStore()
  const { pathname, search } = useLocation()
  const school = user?.schoolId ? state.schools.find((item) => item.id === user.schoolId) : null
  if (!isAuthenticated || user?.role !== 'learner' || !school) return <Navigate to="/" replace />
  const suffix = pathname.startsWith('/learn') ? pathname.slice('/learn'.length) : ''
  return <Navigate to={`/s/${school.slug}/learn${suffix}${search}`} replace />
}

function GuestOnly({ children }) {
  const { isAuthenticated, home } = useAuth()
  if (!isAuthenticated) return children
  return <Navigate to={home} replace />
}

function NotFound() {
  const { t } = useI18n()
  return (
    <div className="grid min-h-screen place-items-center bg-surface p-6">
      <EmptyState icon={BookOpen} title={t('errors.notFound')} description={t('errors.notFoundDesc')} action={<Button onClick={() => window.location.assign('/')}>{t('common.backHome')}</Button>} />
    </div>
  )
}

function TrainerGate({ children }) {
  const { user } = useAuth()
  if (user.role === 'trainer' && !user.schoolId) return <Navigate to="/onboarding" replace />
  return children
}

function PlanFeatureGate({ feature, children }) {
  const { user } = useAuth()
  const state = useTiwanzaStore()
  if (!canUsePlanFeature(state, user?.schoolId, feature)) return <Navigate to="/trainer/subscription" replace />
  return children
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
        </Route>

        <Route path="/login" element={<GuestOnly><AuthPage mode="login" /></GuestOnly>} />
        <Route path="/register" element={<GuestOnly><AuthPage mode="register" /></GuestOnly>} />
        <Route path="/onboarding" element={<ProtectedRoute roles={['trainer']}><OnboardingPage /></ProtectedRoute>} />

        <Route path="/s/:slug/login" element={<AuthPage mode="login" schoolScoped />} />
        <Route path="/s/:slug/register" element={<AuthPage mode="register" schoolScoped />} />
        <Route path="/s/:slug" element={<SchoolHome />} />
        <Route path="/s/:slug/catalog" element={<PublicSchoolCourses />} />
        <Route path="/s/:slug/courses/:courseId" element={<PublicCourseDetail />} />
        <Route path="/s/:slug/courses/:courseId/checkout" element={<ProtectedRoute roles={['learner']} schoolScoped><CourseCheckout /></ProtectedRoute>} />

        <Route path="/s/:slug/courses" element={<ProtectedRoute roles={['learner']} schoolScoped><AppShell /></ProtectedRoute>}>
          <Route index element={<LearnerCourses />} />
        </Route>
        <Route path="/s/:slug/announcements" element={<ProtectedRoute roles={['learner']} schoolScoped><AppShell /></ProtectedRoute>}>
          <Route index element={<LearnerAnnouncements />} />
          <Route path=":announcementId" element={<LearnerAnnouncements />} />
        </Route>
        <Route path="/s/:slug/calendar" element={<ProtectedRoute roles={['learner']} schoolScoped><AppShell /></ProtectedRoute>}>
          <Route index element={<LearnerCalendar />} />
        </Route>
        <Route path="/s/:slug/payments" element={<ProtectedRoute roles={['learner']} schoolScoped><AppShell /></ProtectedRoute>}>
          <Route index element={<LearnerPayments />} />
        </Route>
        <Route path="/s/:slug/quiz-results" element={<ProtectedRoute roles={['learner']} schoolScoped><AppShell /></ProtectedRoute>}>
          <Route index element={<LearnerQuizResults />} />
        </Route>
        <Route path="/s/:slug/profile" element={<ProtectedRoute roles={['learner']} schoolScoped><AppShell /></ProtectedRoute>}>
          <Route index element={<LearnerProfile />} />
        </Route>

        <Route path="/s/:slug/learn" element={<ProtectedRoute roles={['learner']} schoolScoped><AppShell /></ProtectedRoute>}>
          <Route index element={<LearnerDashboard />} />
          <Route path="courses" element={<LearnerCourses />} />
          <Route path="courses/:courseId" element={<CoursePlayer />} />
          <Route path="courses/:courseId/lessons/:lessonId" element={<CoursePlayer />} />
          <Route path="announcements" element={<LearnerAnnouncements />} />
          <Route path="announcements/:announcementId" element={<LearnerAnnouncements />} />
          <Route path="quiz-results" element={<LearnerQuizResults />} />
          <Route path="calendar" element={<LearnerCalendar />} />
          <Route path="payments" element={<LearnerPayments />} />
          <Route path="profile" element={<LearnerProfile />} />
        </Route>

        <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AppShell /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="schools" element={<AdminSchools />} />
          <Route path="schools/:schoolId" element={<AdminSchoolDetail />} />
          <Route path="subscriptions" element={<AdminSubscriptions />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="plans" element={<AdminPlans />} />
          <Route path="activity" element={<AdminActivity />} />
          <Route path="support" element={<AdminSupport />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        <Route path="/trainer" element={<ProtectedRoute roles={['trainer']}><TrainerGate><AppShell /></TrainerGate></ProtectedRoute>}>
          <Route index element={<TrainerDashboard />} />
          <Route path="courses" element={<TrainerCourses />} />
          <Route path="courses/new" element={<TrainerCourses />} />
          <Route path="courses/:courseId" element={<TrainerCourseEditor />} />
          <Route path="courses/:courseId/edit" element={<TrainerCourseEditor />} />
          <Route path="learners" element={<TrainerLearners />} />
          <Route path="enrollments" element={<TrainerEnrollments />} />
          <Route path="payments" element={<TrainerPayments />} />
          <Route path="sales" element={<TrainerSales />} />
          <Route path="quizzes" element={<TrainerQuizzes />} />
          <Route path="announcements" element={<TrainerAnnouncements />} />
          <Route path="comments" element={<TrainerComments />} />
          <Route path="calendar" element={<PlanFeatureGate feature="calendar"><TrainerCalendar /></PlanFeatureGate>} />
          <Route path="school" element={<TrainerSchool />} />
          <Route path="payment-settings" element={<TrainerPaymentSettings />} />
          <Route path="subscription" element={<TrainerSubscription />} />
          <Route path="profile" element={<TrainerProfile />} />
        </Route>

        <Route path="/learn/*" element={<LegacyLearnerRedirect />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}
