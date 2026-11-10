import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Archive,
  BarChart3,
  BookOpen,
  Copy,
  Eye,
  LayoutGrid,
  List,
  Pencil,
  Plus,
  Star,
  Trash2,
  UploadCloud,
  Users,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useI18n } from '../../i18n/I18nContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { useTiwanzaStore } from '../../data/store.js'
import {
  getCourseLearnerCount,
  getCourseLessons,
  getCourseRating,
  getCourseRevenue,
  getCourseStats,
  getSchool,
  getSchoolCourses,
  getSections,
} from '../../data/selectors.js'
import {
  createCourse,
  deleteCourse,
  duplicateCourse,
  publishCourse,
  unpublishCourse,
  validateCourseForPublish,
} from '../../data/services.js'
import {
  ActionMenu,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Input,
  Label,
  Modal,
  PageHeader,
  SearchField,
  Select,
  Table,
  Textarea,
} from '../../components/ui.jsx'
import { StatusPill } from '../admin/AdminDashboard.jsx'
import { cn } from '../../lib/utils.js'

const PUBLISH_CHECK_KEYS = {
  info: 'readinessInfo',
  objectives: 'readinessObjectives',
  sections: 'readinessSections',
  lessons: 'readinessLessons',
  content: 'readinessContent',
  quiz: 'readinessQuiz',
  payment: 'readinessPayment',
  'plan-courses': 'planCourseLimit',
  'plan-paid': 'planPaidLimit',
  'course-limit': 'planCourseLimit',
  'trainer-limit': 'planTrainerLimit',
  'storage-limit': 'planStorageLimit',
}

function publishIssueLabel(t, code) {
  return PUBLISH_CHECK_KEYS[code] ? t(`courseEditor.${PUBLISH_CHECK_KEYS[code]}`) : t(`errors.${code}`)
}

export default function TrainerCourses() {
  const { user } = useAuth()
  const { t, language, money, number, date } = useI18n()
  const { success, error: toastError } = useToast()
  const state = useTiwanzaStore()
  const navigate = useNavigate()
  const location = useLocation()
  const school = getSchool(state, user?.schoolId)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('newest')
  const [view, setView] = useState('grid')
  const [newOpen, setNewOpen] = useState(false)
  const [form, setForm] = useState({ title: '', category: 'DÃ©veloppement', language: 'fr', difficulty: 'beginner', isFree: false, priceDA: 3900, shortDescription: '' })
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [duplicateTarget, setDuplicateTarget] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (location.pathname.endsWith('/courses/new')) setNewOpen(true)
  }, [location.pathname])

  const courses = school ? getSchoolCourses(state, school.id) : []
  const categories = [...new Set(courses.map((course) => course.category))]

  const rows = courses
    .filter((course) => status === 'all' || course.status === status)
    .filter((course) => category === 'all' || course.category === category)
    .filter((course) => {
      const value = query.toLowerCase().trim()
      return !value || course.title.toLowerCase().includes(value) || course.category.toLowerCase().includes(value)
    })
    .sort((a, b) => {
      if (sort === 'name') return a.title.localeCompare(b.title)
      if (sort === 'students') return getCourseLearnerCount(state, b.id) - getCourseLearnerCount(state, a.id)
      return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
    })
  const publishedCount = courses.filter((course) => course.status === 'published').length
  const totalLearners = new Set(state.enrollments.filter((enrollment) => enrollment.schoolId === school?.id).map((enrollment) => enrollment.learnerId)).size
  const totalRevenue = courses.reduce((total, course) => total + getCourseRevenue(state, course.id), 0)
  const ratedCourses = courses.map((course) => getCourseRating(state, course.id)).filter((rating) => rating.count)
  const averageRating = ratedCourses.length ? (ratedCourses.reduce((total, rating) => total + rating.average, 0) / ratedCourses.length).toFixed(1) : 'â€”'
  const needsAttention = courses.filter((course) => course.status !== 'published' && validateCourseForPublish(state, course).length)
  const totalLessons = courses.reduce((total, course) => total + getCourseStats(state, course.id).lessons, 0)

  function create() {
    if (!form.title.trim()) return toastError(t('courseEditor.requiredTitle'))
    setBusy(true)
    const result = createCourse({
      schoolId: school.id,
      trainerId: user.id,
      data: { ...form, title: form.title.trim(), shortDescription: form.shortDescription.trim() },
    })
    setBusy(false)
    if (!result.ok) return toastError(t(`errors.${result.error}`))
    success(t('courseEditor.saved'))
    setNewOpen(false)
    setForm({ title: '', category: 'DÃ©veloppement', language: 'fr', difficulty: 'beginner', isFree: false, priceDA: 3900, shortDescription: '' })
    navigate(`/trainer/courses/${result.course.id}`)
  }

  function togglePublish(course) {
    if (course.status === 'published') {
      unpublishCourse(course.id)
      success(t('trainerCourses.unpublishSuccess'))
      return
    }
    const errors = validateCourseForPublish(state, course)
    if (errors.length) {
      toastError(errors.map((code) => publishIssueLabel(t, code)).join(' Â· '))
      return
    }
    const result = publishCourse(course.id)
    if (result.ok) success(t('trainerCourses.publishSuccess'))
    else toastError(t(`errors.${result.error}`))
  }

  function duplicate() {
    setBusy(true)
    const result = duplicateCourse(duplicateTarget.id, user.id)
    setBusy(false)
    if (result.ok) { success(t('trainerCourses.duplicateSuccess')); setDuplicateTarget(null) }
    else toastError(t(`errors.${result.error}`))
  }

  function remove() {
    deleteCourse(deleteTarget.id)
    success(t('trainerCourses.deleteSuccess'))
    setDeleteTarget(null)
  }

  if (!school) {
    return <EmptyState icon={BookOpen} title={t('trainer.noCoursesYet')} description={t('trainer.noCoursesYetDesc')} />
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={t('nav.trainer')}
        title={t('trainerCourses.title')}
        description={t('trainerCourses.subtitle')}
        actions={<Button icon={Plus} onClick={() => setNewOpen(true)}>{t('trainerCourses.newCourse')}</Button>}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4"><div className="flex items-center justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{t('trainerCourses.statPublished')}</p><p className="mt-1 text-2xl font-bold text-ink">{publishedCount}<span className="ms-1 text-xs font-medium text-muted">/ {courses.length}</span></p><p className="mt-1 text-[10px] text-muted">{t('trainerCourses.statLessons', { count: totalLessons })}</p></div><span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand"><BookOpen size={18} /></span></div></Card>
        <Card className="p-4"><div className="flex items-center justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{t('trainerCourses.statLearners')}</p><p className="mt-1 text-2xl font-bold text-ink">{number(totalLearners)}</p><p className="mt-1 text-[10px] text-muted">{t('trainerCourses.statAcrossCourses', { count: courses.length })}</p></div><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600"><Users size={18} /></span></div></Card>
        <Card className="p-4"><div className="flex items-center justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{t('trainerCourses.statRevenue')}</p><p className="mt-1 text-2xl font-bold text-ink">{money(totalRevenue)}</p><p className="mt-1 text-[10px] text-muted">{t('trainerCourses.statRevenueHint')}</p></div><span className="grid h-10 w-10 place-items-center rounded-xl bg-success-soft text-success"><BarChart3 size={18} /></span></div></Card>
        <Card className="p-4"><div className="flex items-center justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{t('trainerCourses.statRating')}</p><p className="mt-1 flex items-center gap-1.5 text-2xl font-bold text-ink">{averageRating}<Star size={15} className="text-amber-500" /></p><p className="mt-1 text-[10px] text-muted">{needsAttention ? t('trainerCourses.statNeedsAttention', { count: needsAttention }) : t('trainerCourses.statAllGood')}</p></div><span className={cn('grid h-10 w-10 place-items-center rounded-xl', needsAttention ? 'bg-warning-soft text-warning' : 'bg-success-soft text-success')}><Star size={18} /></span></div></Card>
      </div>

      <Card>
        <div className="flex flex-col gap-2 border-b border-line p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <SearchField value={query} onChange={setQuery} placeholder={t('trainerCourses.searchPlaceholder')} className="w-full sm:w-72" />
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-line p-0.5">
                <button type="button" onClick={() => setView('grid')} className={cn('grid h-7 w-7 place-items-center rounded-md', view === 'grid' ? 'bg-brand text-white' : 'text-muted hover:bg-surface')} aria-label="Grid"><LayoutGrid size={14} /></button>
                <button type="button" onClick={() => setView('list')} className={cn('grid h-7 w-7 place-items-center rounded-md', view === 'list' ? 'bg-brand text-white' : 'text-muted hover:bg-surface')} aria-label="List"><List size={14} /></button>
              </div>
              <Badge tone="neutral">{t('trainerCourses.resultsCount', { count: rows.length })}</Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={status} onChange={(event) => setStatus(event.target.value)} className="w-auto min-w-36">
              <option value="all">{t('trainerCourses.allStatuses')}</option>
              <option value="published">{t('trainerCourses.statusPublished')}</option>
              <option value="draft">{t('trainerCourses.statusDraft')}</option>
              <option value="unpublished">{t('trainerCourses.statusArchived')}</option>
            </Select>
            <Select value={category} onChange={(event) => setCategory(event.target.value)} className="w-auto min-w-36">
              <option value="all">{t('trainerCourses.allCategories')}</option>
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </Select>
            <Select value={sort} onChange={(event) => setSort(event.target.value)} className="w-auto min-w-36">
              <option value="newest">{t('trainerCourses.sortNewest')}</option>
              <option value="name">{t('trainerCourses.sortName')}</option>
              <option value="students">{t('trainerCourses.sortStudents')}</option>
            </Select>
          </div>
        </div>

        {rows.length ? view === 'grid' ? (
          <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((course) => {
              const lessons = getCourseLessons(state, course.id)
              const sections = getSections(state, course.id)
              const learners = getCourseLearnerCount(state, course.id)
              const rating = getCourseRating(state, course.id)
              const issues = course.status === 'published' ? [] : validateCourseForPublish(state, course)
              return (
                <Card key={course.id} className="group overflow-hidden transition hover:border-brand/30 hover:shadow-md">
                  <div className="relative h-28" style={{ background: course.cover }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
                    <div className="absolute start-3 top-3 flex gap-1.5">
                      <StatusPill status={course.status} t={t} />
                      {course.isFree ? <Badge tone="success">{t('trainerCourses.freeCourse')}</Badge> : null}
                    </div>
                    <span className="absolute bottom-2 start-3 text-[11px] font-bold uppercase tracking-wider text-white/90">{course.coverLabel}</span>
                    <div className="absolute bottom-2 end-2">
                      <ActionMenu
                        items={[
                          { label: t('trainerCourses.edit'), icon: Pencil, onClick: () => navigate(`/trainer/courses/${course.id}`) },
                          { label: t('trainerCourses.preview'), icon: Eye, onClick: () => window.open(`/s/${school.slug}/courses/${course.id}`, '_blank') },
                          { label: t('trainerCourses.duplicate'), icon: Copy, onClick: () => setDuplicateTarget(course) },
                          { separator: true },
                          { label: t('trainerCourses.delete'), icon: Trash2, tone: 'danger', onClick: () => setDeleteTarget(course) },
                        ]}
                      />
                    </div>
                  </div>
                  <div className="p-4">
                    <Badge tone="neutral">{course.category}</Badge>
                    <Link to={`/trainer/courses/${course.id}`} className="mt-2 block truncate text-sm font-bold text-ink hover:text-brand">{course.title}</Link>
                    <p className="mt-1 line-clamp-2 min-h-[32px] text-[11px] leading-relaxed text-muted">{course.shortDescription || t('common.none')}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted">
                      <span className="inline-flex items-center gap-1"><BookOpen size={11} /> {t('trainerCourses.lessonsCount', { count: lessons.length })}</span>
                      <span>{t('trainerCourses.sectionsCount', { count: sections.length })}</span>
                      <span>{t('trainerCourses.studentsCount', { count: learners })}</span>
                      {rating.count ? <span className="inline-flex items-center gap-1"><Star size={10} className="text-amber-500" /> {rating.average}</span> : null}
                    </div>
                    {issues.length ? <div className="mt-2"><Badge tone="warning">{t('trainerCourses.needsAttention', { count: issues.length })}</Badge></div> : null}
                    <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                      <span className="text-xs font-bold text-ink">{course.isFree ? t('trainerCourses.freeCourse') : money(course.priceDA)}</span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="xs" icon={Pencil} onClick={() => navigate(`/trainer/courses/${course.id}`)}>{t('trainerCourses.edit')}</Button>
                        <Button variant="ghost" size="xs" icon={course.status === 'published' ? Archive : UploadCloud} onClick={() => togglePublish(course)}>{course.status === 'published' ? t('trainerCourses.unpublish') : t('trainerCourses.publish')}</Button>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        ) : (
          <Table>
            <thead>
              <tr>
                <th>{t('trainerCourses.tableCourse')}</th>
                <th>{t('trainerCourses.tableStatus')}</th>
                <th>{t('trainerCourses.tableStudents')}</th>
                <th className="hidden md:table-cell">{t('trainerCourses.tableLessons')}</th>
                <th className="hidden lg:table-cell">{t('trainerCourses.tableRevenue')}</th>
                <th className="hidden xl:table-cell">{t('trainerCourses.tableUpdated')}</th>
                <th className="text-end">{t('trainerCourses.tableActions')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((course) => {
                const revenue = state.coursePayments.filter((payment) => payment.courseId === course.id && payment.status === 'validated').reduce((sum, payment) => sum + payment.amount, 0)
                return (
                  <tr key={course.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg text-[8px] font-bold text-white" style={{ background: course.cover }}>{course.coverLabel}</span>
                        <div className="min-w-0">
                          <button type="button" onClick={() => navigate(`/trainer/courses/${course.id}`)} className="block max-w-[240px] truncate text-xs font-semibold text-ink hover:text-brand">{course.title}</button>
                          <p className="text-[10px] text-muted">{course.category} Â· {course.isFree ? t('trainerCourses.freeCourse') : money(course.priceDA)}</p>
                        </div>
                      </div>
                    </td>
                    <td><StatusPill status={course.status} t={t} /></td>
                    <td className="text-xs text-muted">{getCourseLearnerCount(state, course.id)}</td>
                    <td className="hidden md:table-cell text-xs text-muted">{getCourseLessons(state, course.id).length}</td>
                    <td className="hidden lg:table-cell text-xs font-semibold text-ink">{money(revenue)}</td>
                    <td className="hidden xl:table-cell text-[11px] text-muted">{date(course.updatedAt)}</td>
                    <td>
                      <div className="flex justify-end">
                        <ActionMenu
                          items={[
                            { label: t('trainerCourses.edit'), icon: Pencil, onClick: () => navigate(`/trainer/courses/${course.id}`) },
                            { label: course.status === 'published' ? t('trainerCourses.unpublish') : t('trainerCourses.publish'), icon: UploadCloud, onClick: () => togglePublish(course) },
                            { label: t('trainerCourses.duplicate'), icon: Copy, onClick: () => setDuplicateTarget(course) },
                            { separator: true },
                            { label: t('trainerCourses.delete'), icon: Trash2, tone: 'danger', onClick: () => setDeleteTarget(course) },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        ) : (
          <EmptyState
            icon={BookOpen}
            title={query || status !== 'all' ? t('trainerCourses.noResults') : t('trainerCourses.noCourses')}
            description={query || status !== 'all' ? t('trainerCourses.noResultsDesc') : t('trainerCourses.noCoursesDesc')}
            action={<Button icon={Plus} onClick={() => setNewOpen(true)}>{t('trainerCourses.createFirst')}</Button>}
          />
        )}
      </Card>

      <Modal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        title={t('courseEditor.newCourseTitle')}
        description={t('courseEditor.createSubtitle')}
        footer={<><Button variant="secondary" onClick={() => setNewOpen(false)}>{t('common.cancel')}</Button><Button onClick={create} loading={busy}>{t('common.create')}</Button></>}
      >
        <div className="space-y-4">
          <div><Label required>{t('courseEditor.courseTitle')}</Label><Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder={t('courseEditor.courseTitlePlaceholder')} /></div>
          <div><Label>{t('courseEditor.shortDescription')}</Label><Textarea rows={2} value={form.shortDescription} onChange={(event) => setForm({ ...form, shortDescription: event.target.value })} placeholder={t('courseEditor.shortDescriptionPlaceholder')} /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>{t('courseEditor.category')}</Label><Select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{['DÃ©veloppement', 'Design', 'Business', 'Langues', 'Gestion', 'Autre'].map((item) => <option key={item}>{item}</option>)}</Select></div>
            <div><Label>{t('courseEditor.language')}</Label><Select value={form.language} onChange={(event) => setForm({ ...form, language: event.target.value })}><option value="fr">FranÃ§ais</option><option value="ar">Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©</option></Select></div>
            <div><Label>{t('courseEditor.level')}</Label><Select value={form.difficulty} onChange={(event) => setForm({ ...form, difficulty: event.target.value })}><option value="beginner">{t('publicSite.levelBeginner')}</option><option value="intermediate">{t('publicSite.levelIntermediate')}</option><option value="advanced">{t('publicSite.levelAdvanced')}</option></Select></div>
            <div><Label>{t('courseEditor.priceDA')}</Label><Input type="number" value={form.isFree ? 0 : form.priceDA} disabled={form.isFree} onChange={(event) => setForm({ ...form, priceDA: Number(event.target.value) })} /></div>
          </div>
          <label className="flex items-center gap-2 text-xs text-ink"><input type="checkbox" checked={form.isFree} onChange={(event) => setForm({ ...form, isFree: event.target.checked })} className="h-4 w-4 accent-[var(--color-brand)]" /> {t('courseEditor.freeCourse')}</label>
          <p className="text-[10px] text-muted">{t('courseEditor.createSubtitle')} {t('trainerCourses.draftHint')}</p>
        </div>
      </Modal>

      <ConfirmDialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} onConfirm={remove} title={t('trainerCourses.deleteConfirm')} description={t('trainerCourses.deleteDesc')} confirmLabel={t('trainerCourses.delete')} />
      <ConfirmDialog open={Boolean(duplicateTarget)} onClose={() => setDuplicateTarget(null)} onConfirm={duplicate} title={t('trainerCourses.duplicateConfirm')} description={t('trainerCourses.duplicateDesc')} confirmLabel={t('trainerCourses.duplicate')} tone="primary" loading={busy} />
    </div>
  )
}

