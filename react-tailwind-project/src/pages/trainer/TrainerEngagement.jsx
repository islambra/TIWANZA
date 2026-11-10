import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Edit3,
  Eye,
  EyeOff,
  MessageSquare,
  Megaphone,
  Plus,
  Send,
  Trash2,
  Users,
  Video,
  XCircle,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useI18n } from '../../i18n/I18nContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { useTiwanzaStore } from '../../data/store.js'
import {
  getCourse,
  getLesson,
  getQuizResults,
  getSchool,
  getSchoolAnnouncements,
  getSchoolComments,
  getSchoolCourses,
  getSchoolEvents,
} from '../../data/selectors.js'
import {
  addComment,
  deleteAnnouncement,
  deleteComment,
  deleteEvent,
  publishAnnouncement,
  saveAnnouncement,
  saveEvent,
  setCommentStatus,
  unpublishAnnouncement,
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
  SearchField,
  Select,
  StatCard,
  Table,
  Tabs,
  Textarea,
} from '../../components/ui.jsx'
import { StatusPill } from '../admin/AdminDashboard.jsx'
import { cn, downloadCsv } from '../../lib/utils.js'

function useTraining() {
  const { user } = useAuth()
  const state = useTiwanzaStore()
  const school = getSchool(state, user?.schoolId)
  const courses = school ? getSchoolCourses(state, school.id) : []
  return { user, state, school, courses }
}

export function TrainerQuizzes() {
  const { state, school, courses } = useTraining()
  const { t, date, number } = useI18n()
  const navigate = useNavigate()
  const [courseId, setCourseId] = useState('all')
  const [query, setQuery] = useState('')
  const [detail, setDetail] = useState(null)

  if (!school) return <EmptyState icon={MessageSquare} title={t('trainerQuizzes.noQuizzes')} description={t('trainerQuizzes.noQuizzesDesc')} />

  const results = getQuizResults(state, school.id).filter((row) => courseId === 'all' || row.course.id === courseId)
  const grouped = useMemo(() => {
    const map = new Map()
    results.forEach((row) => {
      if (!map.has(row.quiz.id)) map.set(row.quiz.id, { quiz: row.quiz, course: row.course, attempts: [] })
      map.get(row.quiz.id).attempts.push(row)
    })
    return [...map.values()]
      .map((item) => {
        const passed = item.attempts.filter((row) => row.attempt.passed).length
        return {
          ...item,
          average: Math.round(item.attempts.reduce((sum, row) => sum + row.attempt.percentage, 0) / item.attempts.length),
          passRate: Math.round((passed / item.attempts.length) * 100),
        }
      })
      .filter((item) => !query.trim() || item.quiz.title.toLowerCase().includes(query.trim().toLowerCase()))
  }, [results, query])

  const totalAttempts = results.length
  const average = totalAttempts ? Math.round(results.reduce((sum, row) => sum + row.attempt.percentage, 0) / totalAttempts) : 0
  const passRate = totalAttempts ? Math.round((results.filter((row) => row.attempt.passed).length / totalAttempts) * 100) : 0

  function exportCsv() {
    downloadCsv(`tiwanza-resultats-quiz-${new Date().toISOString().slice(0, 10)}.csv`, [
      [t('trainerQuizzes.tableQuiz'), t('trainerQuizzes.tableCourse'), t('trainerQuizzes.tableLearner'), t('trainerQuizzes.tableScore'), t('trainerQuizzes.tableStatus'), t('trainerQuizzes.tableDate')],
      ...results.map((row) => [row.quiz.title, row.course.title, row.learner?.name || '', `${row.attempt.percentage}%`, row.attempt.passed ? 'Réussi' : 'Échoué', date(row.attempt.completedAt)]),
    ])
  }

  return (
    <div className="space-y-5">
      <PageHeader eyebrow={t('nav.trainer')} title={t('trainerQuizzes.title')} description={t('trainerQuizzes.subtitle')} actions={<Button variant="secondary" icon={Send} onClick={exportCsv}>{t('trainerQuizzes.exportCsv')}</Button>} />
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label={t('trainerQuizzes.totalAttempts')} value={number(totalAttempts)} icon={MessageSquare} tone="brand" />
        <StatCard label={t('trainerQuizzes.averageScore')} value={`${average}%`} icon={CheckCircle2} tone="blue" />
        <StatCard label={t('trainerQuizzes.passRate')} value={`${passRate}%`} icon={Users} tone="success" />
      </div>
      <Card>
        <div className="flex flex-col gap-2 border-b border-line p-3 sm:flex-row sm:items-center sm:justify-between">
          <SearchField value={query} onChange={setQuery} placeholder={t('common.search')} className="w-full sm:w-72" />
          <Select value={courseId} onChange={(event) => setCourseId(event.target.value)} className="w-auto min-w-44"><option value="all">{t('trainerQuizzes.allCourses')}</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</Select>
        </div>
        {grouped.length ? (
          <Table>
            <thead><tr><th>{t('trainerQuizzes.tableQuiz')}</th><th>{t('trainerQuizzes.tableCourse')}</th><th>{t('trainerQuizzes.tableAttempts')}</th><th>{t('trainerQuizzes.tableAverage')}</th><th>{t('trainerQuizzes.tablePassRate')}</th><th className="text-end">{t('trainerQuizzes.tableActions')}</th></tr></thead>
            <tbody>
              {grouped.map((item) => (
                <tr key={item.quiz.id}>
                  <td><p className="text-xs font-semibold text-ink">{item.quiz.title}</p><p className="text-[10px] text-muted">{t('trainerQuizzes.questionsCount', { count: item.quiz.questions.length })} · {t('trainerQuizzes.passingScore')} {item.quiz.passingScore}%</p></td>
                  <td className="max-w-[200px] truncate text-xs text-muted">{item.course.title}</td>
                  <td className="text-xs font-semibold text-ink">{number(item.attempts.length)}</td>
                  <td className="min-w-28"><div className="flex items-center gap-2"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface"><div className="h-full rounded-full bg-brand" style={{ width: `${item.average}%` }} /></div><span className="text-[10px] font-semibold text-muted">{item.average}%</span></div></td>
                  <td><Badge tone={item.passRate >= 70 ? 'success' : item.passRate >= 40 ? 'warning' : 'danger'}>{item.passRate}%</Badge></td>
                  <td><div className="flex justify-end gap-1"><Button variant="ghost" size="xs" icon={Eye} onClick={() => setDetail(item)}>{t('trainerQuizzes.viewResults')}</Button><Button variant="ghost" size="xs" icon={Edit3} onClick={() => navigate(`/trainer/courses/${item.course.id}/edit`)}>{t('trainerQuizzes.editQuiz')}</Button></div></td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : <EmptyState icon={MessageSquare} title={t('trainerQuizzes.noQuizzes')} description={t('trainerQuizzes.noQuizzesDesc')} />}
      </Card>

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title={detail ? t('trainerQuizzes.resultsFor', { quiz: detail.quiz.title }) : ''} size="xl" footer={<Button variant="secondary" onClick={() => setDetail(null)}>{t('common.close')}</Button>}>
        {detail ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3"><StatCard label={t('trainerQuizzes.totalAttempts')} value={detail.attempts.length} icon={MessageSquare} tone="brand" /><StatCard label={t('trainerQuizzes.averageScore')} value={`${detail.average}%`} icon={CheckCircle2} tone="blue" /><StatCard label={t('trainerQuizzes.passRate')} value={`${detail.passRate}%`} icon={Users} tone="success" /></div>
            {detail.attempts.length ? (
              <Table>
                <thead><tr><th>{t('trainerQuizzes.tableLearner')}</th><th>{t('trainerQuizzes.tableScore')}</th><th>{t('trainerQuizzes.tableStatus')}</th><th>{t('trainerQuizzes.tableDate')}</th></tr></thead>
                <tbody>{detail.attempts.map((row) => <tr key={row.attempt.id}><td><div className="flex items-center gap-2"><Avatar name={row.learner?.name} size="xs" /><span className="text-xs font-medium text-ink">{row.learner?.name || '—'}</span></div></td><td className="text-xs font-semibold text-ink">{row.attempt.percentage}%</td><td><Badge tone={row.attempt.passed ? 'success' : 'danger'}>{row.attempt.passed ? t('trainerQuizzes.passed') : t('trainerQuizzes.failed')}</Badge></td><td className="text-[11px] text-muted">{date(row.attempt.completedAt)}</td></tr>)}</tbody>
              </Table>
            ) : <EmptyState icon={MessageSquare} title={t('trainerQuizzes.noAttempts')} description={t('trainerQuizzes.noAttemptsDesc')} />}
          </div>
        ) : null}
      </Modal>
    </div>
  )
}

export function TrainerAnnouncements() {
  const { user, state, school, courses } = useTraining()
  const { t, date, dateTime } = useI18n()
  const { success, error: toastError } = useToast()
  const [filter, setFilter] = useState('all')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ title: '', content: '', courseId: '' })
  const [deleteTarget, setDeleteTarget] = useState(null)

  if (!school) return <EmptyState icon={Megaphone} title={t('trainerAnnouncements.noAnnouncements')} description={t('trainerAnnouncements.noAnnouncementsDesc')} />

  const rows = getSchoolAnnouncements(state, school.id).filter((item) => filter === 'all' || item.status === filter)

  function openNew() {
    setEditing(null)
    setForm({ title: '', content: '', courseId: '' })
    setOpen(true)
  }

  function openEdit(item) {
    setEditing(item)
    setForm({ title: item.title, content: item.content, courseId: item.courseId || '' })
    setOpen(true)
  }

  function save(publishNow = false) {
    if (!form.title.trim() || !form.content.trim()) return toastError(t('errors.requiredFields'))
    const result = saveAnnouncement({ schoolId: school.id, courseId: form.courseId || null, title: form.title.trim(), content: form.content.trim(), authorId: user.id }, editing?.id)
    if (publishNow) publishAnnouncement(result.id)
    success(publishNow ? t('trainerAnnouncements.publishSuccess') : t('trainerAnnouncements.saveSuccess'))
    setOpen(false)
  }

  function togglePublish(item) {
    if (item.status === 'published') unpublishAnnouncement(item.id)
    else publishAnnouncement(item.id)
    success(item.status === 'published' ? t('trainerAnnouncements.saveSuccess') : t('trainerAnnouncements.publishSuccess'))
  }

  function remove() {
    deleteAnnouncement(deleteTarget.id)
    success(t('trainerAnnouncements.deleteSuccess'))
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-5">
      <PageHeader eyebrow={t('nav.trainer')} title={t('trainerAnnouncements.title')} description={t('trainerAnnouncements.subtitle')} actions={<Button icon={Plus} onClick={openNew}>{t('trainerAnnouncements.newAnnouncement')}</Button>} />
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label={t('trainerAnnouncements.statusPublished')} value={getSchoolAnnouncements(state, school.id).filter((item) => item.status === 'published').length} icon={Megaphone} tone="brand" />
        <StatCard label={t('trainerAnnouncements.statusDraft')} value={getSchoolAnnouncements(state, school.id).filter((item) => item.status === 'draft').length} icon={Edit3} tone="amber" />
        <StatCard label={t('trainerAnnouncements.resultsCount', { count: getSchoolAnnouncements(state, school.id).length })} value={getSchoolAnnouncements(state, school.id).length} icon={Users} tone="blue" />
      </div>
      <Card>
        <div className="border-b border-line p-3"><Tabs items={[{ value: 'all', label: t('trainerEnrollments.all'), count: getSchoolAnnouncements(state, school.id).length }, { value: 'published', label: t('trainerAnnouncements.statusPublished'), count: getSchoolAnnouncements(state, school.id).filter((item) => item.status === 'published').length }, { value: 'draft', label: t('trainerAnnouncements.statusDraft'), count: getSchoolAnnouncements(state, school.id).filter((item) => item.status === 'draft').length }]} value={filter} onChange={setFilter} variant="pill" className="border-0" /></div>
        {rows.length ? (
          <div className="divide-y divide-line">
            {rows.map((item) => {
              const course = item.courseId ? getCourse(state, item.courseId) : null
              return (
                <article key={item.id} className="p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-xl', item.status === 'published' ? 'bg-brand-soft text-brand' : 'bg-surface text-muted')}><Megaphone size={17} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold text-ink">{item.title}</h3><Badge tone={item.status === 'published' ? 'success' : 'neutral'}>{item.status === 'published' ? t('trainerAnnouncements.statusPublished') : t('trainerAnnouncements.statusDraft')}</Badge>{course ? <Badge tone="blue">{course.title}</Badge> : <Badge tone="brand">{t('trainerAnnouncements.audienceAll')}</Badge>}</div>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">{item.content || t('trainerAnnouncements.noContent')}</p>
                      <p className="mt-1.5 text-[10px] text-muted">{item.publishedAt ? `${t('trainerAnnouncements.publishedOn')} ${date(item.publishedAt)}` : `${t('common.modified')} ${date(item.updatedAt || item.createdAt)}`} · {t('trainerAnnouncements.audienceLabel', { audience: course ? course.title : t('trainerAnnouncements.audienceAll') })}</p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
                      <Button variant="ghost" size="xs" icon={Edit3} onClick={() => openEdit(item)}>{t('trainerAnnouncements.edit')}</Button>
                      <Button variant={item.status === 'published' ? 'soft' : 'success'} size="xs" icon={item.status === 'published' ? EyeOff : Send} onClick={() => togglePublish(item)}>{item.status === 'published' ? t('trainerAnnouncements.unpublish') : t('trainerAnnouncements.publish')}</Button>
                      <Button variant="ghost" size="xs" icon={Trash2} className="text-danger" onClick={() => setDeleteTarget(item)}>{t('trainerAnnouncements.delete')}</Button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        ) : <EmptyState icon={Megaphone} title={t('trainerAnnouncements.noAnnouncements')} description={t('trainerAnnouncements.noAnnouncementsDesc')} action={<Button icon={Plus} onClick={openNew}>{t('trainerAnnouncements.newAnnouncement')}</Button>} />}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? t('trainerAnnouncements.editAnnouncement') : t('trainerAnnouncements.newAnnouncement')} size="lg" footer={<><Button variant="secondary" onClick={() => setOpen(false)}>{t('common.cancel')}</Button><Button variant="soft" onClick={() => save(false)}>{t('trainerAnnouncements.saveDraft')}</Button><Button icon={Send} onClick={() => save(true)}>{editing?.status === 'published' ? t('common.save') : t('trainerAnnouncements.publishNow')}</Button></>}>
        <div className="space-y-4">
          <div><Label required>{t('trainerAnnouncements.titleField')}</Label><Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder={t('trainerAnnouncements.titlePlaceholder')} /></div>
          <div><Label required>{t('trainerAnnouncements.content')}</Label><Textarea rows={6} value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} placeholder={t('trainerAnnouncements.contentPlaceholder')} /></div>
          <div><Label>{t('trainerAnnouncements.audience')}</Label><Select value={form.courseId} onChange={(event) => setForm({ ...form, courseId: event.target.value })}><option value="">{t('trainerAnnouncements.audienceAll')}</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</Select></div>
        </div>
      </Modal>
      <ConfirmDialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} onConfirm={remove} title={t('trainerAnnouncements.deleteConfirm')} description={t('trainerAnnouncements.deleteSuccess')} confirmLabel={t('trainerAnnouncements.delete')} />
    </div>
  )
}

export function TrainerComments() {
  const { user, state, school, courses } = useTraining()
  const { t, date, dateTime } = useI18n()
  const { success, error: toastError } = useToast()
  const [query, setQuery] = useState('')
  const [courseId, setCourseId] = useState('all')
  const [status, setStatus] = useState('all')
  const [replyTarget, setReplyTarget] = useState(null)
  const [reply, setReply] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  if (!school) return <EmptyState icon={MessageSquare} title={t('trainerComments.noComments')} description={t('trainerComments.noCommentsDesc')} />

  const rows = getSchoolComments(state, school.id)
    .filter((comment) => comment.status !== 'deleted')
    .filter((comment) => courseId === 'all' || comment.courseId === courseId)
    .filter((comment) => status === 'all' || comment.status === status)
    .filter((comment) => {
      const value = query.trim().toLowerCase()
      if (!value) return true
      const learner = state.users.find((item) => item.id === comment.userId)
      return comment.content.toLowerCase().includes(value) || learner?.name.toLowerCase().includes(value)
    })

  function sendReply() {
    if (!reply.trim()) return toastError(t('errors.required'))
    addComment({ lessonId: replyTarget.lessonId, userId: user.id, content: reply.trim(), parentId: replyTarget.id })
    success(t('trainerComments.replySuccess'))
    setReplyTarget(null)
    setReply('')
  }

  function toggleVisibility(comment) {
    setCommentStatus(comment.id, comment.status === 'hidden' ? 'visible' : 'hidden')
    success(comment.status === 'hidden' ? t('trainerComments.visibleSuccess') : t('trainerComments.hiddenSuccess'))
  }

  function remove() {
    deleteComment(deleteTarget.id)
    success(t('trainerComments.deleteSuccess'))
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-5">
      <PageHeader eyebrow={t('nav.trainer')} title={t('trainerComments.title')} description={t('trainerComments.subtitle')} />
      <Card>
        <div className="flex flex-col gap-2 border-b border-line p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><SearchField value={query} onChange={setQuery} placeholder={t('trainerComments.searchPlaceholder')} className="w-full sm:w-80" /><Badge tone="neutral">{t('trainerComments.resultsCount', { count: rows.length })}</Badge></div>
          <div className="flex flex-wrap gap-2">
            <Select value={courseId} onChange={(event) => setCourseId(event.target.value)} className="w-auto min-w-44"><option value="all">{t('trainerComments.allCourses')}</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</Select>
            <Select value={status} onChange={(event) => setStatus(event.target.value)} className="w-auto min-w-36"><option value="all">{t('trainerComments.allStatuses')}</option><option value="visible">{t('trainerComments.statusVisible')}</option><option value="hidden">{t('trainerComments.statusHidden')}</option><option value="reported">{t('common.reported') || 'Signalé'}</option></Select>
          </div>
        </div>
        {rows.length ? (
          <Table>
            <thead><tr><th>{t('trainerComments.tableLearner')}</th><th>{t('trainerComments.tableComment')}</th><th className="hidden md:table-cell">{t('trainerComments.tableLesson')}</th><th className="hidden sm:table-cell">{t('trainerComments.tableDate')}</th><th>{t('trainerComments.tableStatus')}</th><th className="text-end">{t('trainerComments.tableActions')}</th></tr></thead>
            <tbody>
              {rows.map((comment) => {
                const learner = state.users.find((item) => item.id === comment.userId)
                const lesson = getLesson(state, comment.lessonId)
                return (
                  <tr key={comment.id} className={cn(comment.parentId && 'bg-surface/50')}>
                    <td><div className="flex items-center gap-2"><Avatar name={learner?.name} size="xs" /><div className="min-w-0"><p className="truncate text-xs font-medium text-ink">{learner?.name}</p><p className="text-[10px] text-muted">{comment.parentId ? t('trainerComments.replyFrom') : t('trainerComments.tableLearner')}</p></div></div></td>
                    <td className="max-w-[320px]"><p className="line-clamp-2 text-xs text-ink">{comment.content}</p></td>
                    <td className="hidden md:table-cell max-w-[160px] truncate text-[11px] text-muted">{lesson?.title || '—'}</td>
                    <td className="hidden sm:table-cell text-[11px] text-muted">{date(comment.createdAt)}</td>
                    <td><Badge tone={comment.status === 'visible' ? 'success' : comment.status === 'reported' ? 'danger' : 'warning'}>{comment.status === 'visible' ? t('trainerComments.statusVisible') : comment.status === 'reported' ? (t('common.reported') || 'Signalé') : t('trainerComments.statusHidden')}</Badge></td>
                    <td><div className="flex justify-end gap-1"><Button variant="ghost" size="xs" icon={MessageSquare} onClick={() => { setReplyTarget(comment); setReply('') }}>{t('trainerComments.reply')}</Button><Button variant="ghost" size="xs" icon={comment.status === 'hidden' ? Eye : EyeOff} onClick={() => toggleVisibility(comment)}>{comment.status === 'hidden' ? t('trainerComments.show') : t('trainerComments.hide')}</Button><Button variant="ghost" size="xs" className="text-danger" icon={Trash2} onClick={() => setDeleteTarget(comment)}>{t('trainerComments.delete')}</Button></div></td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        ) : <EmptyState icon={MessageSquare} title={t('trainerComments.noComments')} description={t('trainerComments.noCommentsDesc')} />}
      </Card>

      <Modal open={Boolean(replyTarget)} onClose={() => setReplyTarget(null)} title={t('trainerComments.replyTitle')} footer={<><Button variant="secondary" onClick={() => setReplyTarget(null)}>{t('common.cancel')}</Button><Button icon={Send} onClick={sendReply}>{t('common.send')}</Button></>}>
        {replyTarget ? <div className="space-y-3"><div className="rounded-xl bg-surface p-3 text-xs text-muted">« {replyTarget.content} »</div><Textarea rows={4} value={reply} onChange={(event) => setReply(event.target.value)} placeholder={t('trainerComments.replyPlaceholder')} /></div> : null}
      </Modal>
      <ConfirmDialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} onConfirm={remove} title={t('trainerComments.deleteConfirm')} description={t('trainerComments.deleteSuccess')} confirmLabel={t('trainerComments.delete')} />
    </div>
  )
}

export function TrainerCalendar() {
  const { user, state, school, courses } = useTraining()
  const { t, date, dateTime } = useI18n()
  const { success, error: toastError } = useToast()
  const [tab, setTab] = useState('upcoming')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm] = useState(emptyEventForm())

  if (!school) return <EmptyState icon={CalendarDays} title={t('trainerCalendar.noEvents')} description={t('trainerCalendar.noEventsDesc')} />

  const now = new Date()
  const all = getSchoolEvents(state, school.id).filter((event) => event.status !== 'cancelled')
  const rows = all.filter((event) => tab === 'past' ? new Date(event.startAt) < now : new Date(event.startAt) >= now)
  const grouped = rows.reduce((map, event) => {
    const key = new Date(event.startAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    if (!map[key]) map[key] = []
    map[key].push(event)
    return map
  }, {})

  function openNew() { setEditing(null); setForm(emptyEventForm()); setOpen(true) }
  function openEdit(event) {
    const start = new Date(event.startAt)
    setEditing(event)
    setForm({ title: event.title, type: event.type || 'live', courseId: event.courseId || '', date: start.toISOString().slice(0, 10), time: start.toTimeString().slice(0, 5), durationMin: String(event.durationMin || 60), joinUrl: event.joinUrl || '', description: event.description || '' })
    setOpen(true)
  }
  function save() {
    if (!form.title.trim() || !form.date || !form.time) return toastError(t('errors.requiredFields'))
    const payload = { schoolId: school.id, trainerId: user.id, title: form.title.trim(), description: form.description.trim(), type: form.type, courseId: form.courseId || null, startAt: new Date(`${form.date}T${form.time}`).toISOString(), durationMin: Number(form.durationMin) || 60, joinUrl: form.joinUrl.trim(), provider: form.joinUrl.trim() ? 'external' : 'none', status: 'scheduled' }
    saveEvent(payload, editing?.id)
    success(t('trainerCalendar.saveSuccess'))
    setOpen(false)
  }
  function remove() { deleteEvent(deleteTarget.id); success(t('trainerCalendar.deleteSuccess')); setDeleteTarget(null) }

  return (
    <div className="space-y-5">
      <PageHeader eyebrow={t('nav.trainer')} title={t('trainerCalendar.title')} description={t('trainerCalendar.subtitle')} actions={<Button icon={Plus} onClick={openNew}>{t('trainerCalendar.newEvent')}</Button>} />
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label={t('trainerCalendar.upcoming')} value={all.filter((event) => new Date(event.startAt) >= now).length} icon={CalendarDays} tone="brand" />
        <StatCard label={t('trainerCalendar.thisWeek')} value={all.filter((event) => { const diff = new Date(event.startAt) - now; return diff >= 0 && diff <= 7 * 86400000 }).length} icon={Clock} tone="blue" />
        <StatCard label={t('trainerCalendar.liveNow')} value={all.filter((event) => event.type === 'live').length} icon={Video} tone="success" />
      </div>
      <Card>
        <div className="flex flex-col gap-2 border-b border-line p-3 sm:flex-row sm:items-center sm:justify-between"><Tabs items={[{ value: 'upcoming', label: t('trainerCalendar.upcoming'), count: all.filter((event) => new Date(event.startAt) >= now).length }, { value: 'past', label: t('trainerCalendar.past'), count: all.filter((event) => new Date(event.startAt) < now).length }, { value: 'all', label: t('trainerCalendar.allEvents'), count: all.length }]} value={tab} onChange={setTab} variant="pill" className="border-0" /><span className="text-[11px] text-muted">{t('trainerCalendar.eventCount', { count: rows.length })}</span></div>
        {rows.length ? (
          <div className="divide-y divide-line">
            {Object.entries(grouped).map(([month, events]) => (
              <div key={month}>
                <div className="bg-surface/60 px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted">{month}</div>
                {events.map((event) => {
                  const course = event.courseId ? getCourse(state, event.courseId) : null
                  return (
                    <div key={event.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
                      <div className="flex w-16 shrink-0 flex-col items-center rounded-xl border border-line bg-white py-1.5"><span className="text-[9px] uppercase text-muted">{new Date(event.startAt).toLocaleDateString('fr-FR', { weekday: 'short' })}</span><span className="text-lg font-bold leading-none text-ink">{new Date(event.startAt).getDate()}</span><span className="text-[9px] text-muted">{new Date(event.startAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span></div>
                      <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-1.5"><p className="text-sm font-semibold text-ink">{event.title}</p><Badge tone={event.type === 'live' ? 'brand' : event.type === 'deadline' ? 'danger' : 'blue'}>{event.type === 'live' ? t('trainerCalendar.typeLive') : event.type === 'deadline' ? t('trainerCalendar.typeDeadline') : event.type === 'workshop' ? t('trainerCalendar.typeWorkshop') : t('trainerCalendar.typeOther')}</Badge>{course ? <Badge tone="neutral">{course.title}</Badge> : null}</div><p className="mt-0.5 line-clamp-1 text-xs text-muted">{event.description}</p><p className="mt-0.5 text-[10px] text-muted">{event.durationMin ? t('trainerCalendar.minutes', { count: event.durationMin }) : ''} {event.joinUrl ? <a href={event.joinUrl} target="_blank" rel="noreferrer" className="ms-2 text-brand hover:underline">{t('trainerCalendar.joinLive')}</a> : null}</p></div>
                      <div className="flex shrink-0 gap-1"><Button variant="ghost" size="xs" icon={Edit3} onClick={() => openEdit(event)}>{t('trainerCalendar.edit')}</Button><Button variant="ghost" size="xs" className="text-danger" icon={Trash2} onClick={() => setDeleteTarget(event)}>{t('trainerCalendar.delete')}</Button></div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        ) : <EmptyState icon={CalendarDays} title={t('trainerCalendar.noEvents')} description={t('trainerCalendar.noEventsDesc')} action={<Button icon={Plus} onClick={openNew}>{t('trainerCalendar.newEvent')}</Button>} />}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? t('trainerCalendar.editEvent') : t('trainerCalendar.newEvent')} size="lg" footer={<><Button variant="secondary" onClick={() => setOpen(false)}>{t('common.cancel')}</Button><Button onClick={save}>{editing ? t('trainerCalendar.save') : t('trainerCalendar.create')}</Button></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><Label required>{t('trainerCalendar.eventTitle')}</Label><Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder={t('trainerCalendar.eventTitlePlaceholder')} /></div>
          <div><Label>{t('trainerCalendar.eventType')}</Label><Select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}><option value="live">{t('trainerCalendar.typeLive')}</option><option value="workshop">{t('trainerCalendar.typeWorkshop')}</option><option value="deadline">{t('trainerCalendar.typeDeadline')}</option><option value="event">{t('trainerCalendar.typeOther')}</option></Select></div>
          <div><Label>{t('trainerCalendar.course')}</Label><Select value={form.courseId} onChange={(event) => setForm({ ...form, courseId: event.target.value })}><option value="">{t('trainerCalendar.selectCourse')}</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</Select></div>
          <div><Label required>{t('trainerCalendar.date')}</Label><Input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></div>
          <div><Label required>{t('trainerCalendar.time')}</Label><Input type="time" value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} /></div>
          <div><Label>{t('trainerCalendar.duration')}</Label><Input type="number" value={form.durationMin} onChange={(event) => setForm({ ...form, durationMin: event.target.value })} /></div>
          <div><Label>{t('trainerCalendar.link')}</Label><Input value={form.joinUrl} onChange={(event) => setForm({ ...form, joinUrl: event.target.value })} placeholder={t('trainerCalendar.linkPlaceholder')} /></div>
          <div className="sm:col-span-2"><Label>{t('trainerCalendar.description')}</Label><Textarea rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder={t('trainerCalendar.descriptionPlaceholder')} /></div>
        </div>
      </Modal>
      <ConfirmDialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} onConfirm={remove} title={t('trainerCalendar.deleteConfirm')} description={t('trainerCalendar.deleteSuccess')} confirmLabel={t('trainerCalendar.delete')} />
    </div>
  )
}

function emptyEventForm() {
  const tomorrow = new Date(Date.now() + 86400000)
  return { title: '', type: 'live', courseId: '', date: tomorrow.toISOString().slice(0, 10), time: '18:00', durationMin: '60', joinUrl: '', description: '' }
}
