import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  FileText,
  FileUp,
  GripVertical,
  Image as ImageIcon,
  Layers,
  Link2,
  ListChecks,
  Plus,
  Save,
  Settings2,
  Trash2,
  UploadCloud,
  Video,
  X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useI18n } from '../../i18n/I18nContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { useTiwanzaStore } from '../../data/store.js'
import {
  getBlocks,
  getCourse,
  getCourseLessons,
  getLesson,
  getQuizByLesson,
  getSchool,
  getSections,
} from '../../data/selectors.js'
import {
  addBlock,
  addLesson,
  addSection,
  deleteBlock,
  deleteLesson,
  deleteSection,
  duplicateLesson,
  moveLesson,
  moveSection,
  publishCourse,
  saveQuizForLesson,
  unpublishCourse,
  updateBlock,
  updateCourse,
  updateLesson,
  updateSection,
  validateCourseForPublish,
} from '../../data/services.js'
import {
  Alert,
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
  ProgressBar,
  Select,
  Switch,
  Tabs,
  Textarea,
} from '../../components/ui.jsx'
import { StatusPill } from '../admin/AdminDashboard.jsx'
import { cn } from '../../lib/utils.js'

const BLOCK_ICONS = { richtext: FileText, video: Video, pdf: FileUp, file: FileUp, image: ImageIcon, youtube: Video, gdrive: Link2 }
const BLOCK_LABEL_KEYS = {
  richtext: 'courseContent.blockText',
  video: 'courseContent.blockVideo',
  pdf: 'courseContent.blockFile',
  file: 'courseContent.blockFile',
  image: 'courseContent.blockImage',
  youtube: 'courseContent.blockVideo',
  gdrive: 'courseContent.blockFile',
}

export default function TrainerCourseEditor() {
  const { courseId } = useParams()
  const { user } = useAuth()
  const { t, language, money } = useI18n()
  const { success, error: toastError } = useToast()
  const state = useTiwanzaStore()
  const navigate = useNavigate()
  const course = getCourse(state, courseId)
  const school = course ? getSchool(state, course.schoolId) : null
  const [tab, setTab] = useState('info')
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [sectionOpen, setSectionOpen] = useState(false)
  const [sectionTitle, setSectionTitle] = useState('')
  const [lessonTarget, setLessonTarget] = useState(null)
  const [deleteSectionTarget, setDeleteSectionTarget] = useState(null)
  const [deleteLessonTarget, setDeleteLessonTarget] = useState(null)
  const [deleteCourseOpen, setDeleteCourseOpen] = useState(false)

  useEffect(() => {
    if (!course) return
    setForm({
      title: course.title,
      shortDescription: course.shortDescription,
      description: course.description,
      category: course.category,
      language: course.language || 'fr',
      difficulty: course.difficulty || 'beginner',
      isFree: Boolean(course.isFree),
      priceDA: course.priceDA,
      coverLabel: course.coverLabel,
      objectives: (course.objectivesFr || []).join('\n'),
      objectivesAr: (course.objectivesAr || []).join('\n'),
      prerequisites: (course.prerequisitesFr || []).join('\n'),
      prerequisitesAr: (course.prerequisitesAr || []).join('\n'),
      sequential: Boolean(course.sequential),
      commentsEnabled: course.commentsEnabled !== false,
    })
  }, [courseId, course])

  if (!course || !school || course.deletedAt) {
    return <EmptyState icon={BookOpen} title={t('learner.courseNotFound')} description={t('trainerCourses.noCoursesDesc')} action={<Link to="/trainer/courses"><Button variant="secondary" icon={ArrowLeft}>{t('courseEditor.backToCourses')}</Button></Link>} />
  }
  if (course.trainerId !== user?.id) {
    return <EmptyState icon={BookOpen} title={t('errors.unauthorized')} action={<Link to="/trainer/courses"><Button variant="secondary">{t('courseEditor.backToCourses')}</Button></Link>} />
  }
  if (!form) return null

  const sections = getSections(state, course.id)
  const lessons = getCourseLessons(state, course.id)
  const publishErrors = validateCourseForPublish(state, course)
  const readinessChecks = [
    { code: 'info', key: 'readinessInfo' },
    { code: 'objectives', key: 'readinessObjectives' },
    { code: 'sections', key: 'readinessSections' },
    { code: 'lessons', key: 'readinessLessons' },
    { code: 'content', key: 'readinessContent' },
    { code: 'quiz', key: 'readinessQuiz' },
    { code: 'payment', key: 'readinessPayment' },
  ]
  const passedChecks = readinessChecks.filter((check) => !publishErrors.includes(check.code)).length
  const planLimitLabels = { 'plan-courses': 'planCourseLimit', 'plan-paid': 'planPaidLimit', 'course-limit': 'planCourseLimit', 'trainer-limit': 'planTrainerLimit', 'storage-limit': 'planStorageLimit' }
  const publishIssueLabel = (code) => {
    const check = readinessChecks.find((item) => item.code === code)
    if (check) return t(`courseEditor.${check.key}`)
    if (planLimitLabels[code]) return t(`courseEditor.${planLimitLabels[code]}`)
    return t(`errors.${code}`)
  }

  function saveInfo(nextTab) {
    setSaving(true)
    updateCourse(course.id, {
      title: form.title.trim(),
      shortDescription: form.shortDescription.trim(),
      description: form.description.trim(),
      category: form.category,
      language: form.language,
      difficulty: form.difficulty,
      isFree: form.isFree,
      priceDA: form.isFree ? 0 : Number(form.priceDA) || 0,
      coverLabel: form.coverLabel,
      objectivesFr: form.objectives.split('\n').map((line) => line.trim()).filter(Boolean),
      objectivesAr: form.objectivesAr.split('\n').map((line) => line.trim()).filter(Boolean),
      prerequisitesFr: form.prerequisites.split('\n').map((line) => line.trim()).filter(Boolean),
      prerequisitesAr: form.prerequisitesAr.split('\n').map((line) => line.trim()).filter(Boolean),
    })
    setSaving(false)
    success(t('courseEditor.saved'))
    if (nextTab) setTab(nextTab)
  }

  function saveSettings() {
    updateCourse(course.id, { sequential: form.sequential, commentsEnabled: form.commentsEnabled })
    success(t('courseEditor.saved'))
  }

  function publish() {
    const errors = validateCourseForPublish(state, course)
    if (errors.length) return toastError(errors.map((code) => publishIssueLabel(code)).join(' · '))
    const result = publishCourse(course.id)
    if (result.ok) success(t('trainerCourses.publishSuccess'))
    else toastError(t(`errors.${result.error}`))
  }

  function addNewSection() {
    if (!sectionTitle.trim()) return toastError(t('errors.required'))
    addSection(course.id, sectionTitle.trim())
    setSectionTitle('')
    setSectionOpen(false)
    success(t('courseContent.sectionSaved'))
  }

  function addNewLesson(sectionId, type) {
    const result = addLesson(sectionId, { title: t('courseContent.untitledLesson'), type, durationMin: 10 })
    if (result.ok) setLessonTarget(result.lesson.id)
  }

  const tabs = [
    { value: 'info', label: t('courseEditor.tabInfo'), icon: FileText },
    { value: 'content', label: t('courseEditor.tabContent'), icon: Layers, count: lessons.length },
    { value: 'settings', label: t('courseEditor.tabSettings'), icon: Settings2 },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link to="/trainer/courses"><Button variant="ghost" size="sm" icon={ArrowLeft}>{t('courseEditor.backToCourses')}</Button></Link>
          <StatusPill status={course.status} t={t} />
          <Badge tone={publishErrors.length ? 'warning' : 'success'} dot>{publishErrors.length ? t('courseEditor.needsWork', { count: publishErrors.length }) : t('courseEditor.readyToPublish')}</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {course.status === 'published' ? (
            <>
              <Button variant="secondary" size="sm" icon={Link2} onClick={() => window.open(`/s/${school.slug}/courses/${course.id}`, '_blank')}>{t('courseEditor.preview')}</Button>
              <Button variant="secondary" size="sm" onClick={() => { unpublishCourse(course.id); success(t('trainerCourses.unpublishSuccess')) }}>{t('courseEditor.unpublish')}</Button>
            </>
          ) : (
            <Button size="sm" icon={UploadCloud} onClick={publish}>{t('courseEditor.publish')}</Button>
          )}
        </div>
      </div>

      <PageHeader title={course.title} description={course.shortDescription || t('courseEditor.editSubtitle')} eyebrow={t('courseEditor.editCourseTitle')} />

      <Tabs items={tabs} value={tab} onChange={setTab} />

      {tab === 'info' ? (
        <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
          <Card>
            <CardHeader title={t('courseEditor.basicInfo')} description={t('courseEditor.editSubtitle')} />
            <div className="space-y-4 p-5">
              <div><Label required>{t('courseEditor.courseTitle')}</Label><Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder={t('courseEditor.courseTitlePlaceholder')} /></div>
              <div><Label>{t('courseEditor.shortDescription')}</Label><Textarea rows={2} value={form.shortDescription} onChange={(event) => setForm({ ...form, shortDescription: event.target.value })} placeholder={t('courseEditor.shortDescriptionPlaceholder')} /><p className="mt-1 text-[10px] text-muted">{t('courseEditor.shortDescriptionHint')}</p></div>
              <div><Label>{t('courseEditor.description')}</Label><Textarea rows={6} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder={t('courseEditor.descriptionPlaceholder')} /></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><Label>{t('courseEditor.category')}</Label><Select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{['Développement', 'Design', 'Business', 'Langues', 'Gestion', 'Autre'].map((item) => <option key={item}>{item}</option>)}</Select></div>
                <div><Label>{t('courseEditor.language')}</Label><Select value={form.language} onChange={(event) => setForm({ ...form, language: event.target.value })}><option value="fr">Français</option><option value="ar">العربية</option></Select></div>
                <div><Label>{t('courseEditor.level')}</Label><Select value={form.difficulty} onChange={(event) => setForm({ ...form, difficulty: event.target.value })}><option value="beginner">{t('publicSite.levelBeginner')}</option><option value="intermediate">{t('publicSite.levelIntermediate')}</option><option value="advanced">{t('publicSite.levelAdvanced')}</option></Select></div>
                <div><Label>{t('courseEditor.priceDA')}</Label><Input type="number" value={form.isFree ? 0 : form.priceDA} disabled={form.isFree} onChange={(event) => setForm({ ...form, priceDA: Number(event.target.value) })} /><p className="mt-1 text-[10px] text-muted">{t('courseEditor.priceHint')}</p></div>
                <div><Label>{t('courseEditor.coverImage')}</Label><Input value={form.coverLabel} onChange={(event) => setForm({ ...form, coverLabel: event.target.value.toUpperCase() })} /></div>
              </div>
              <Checkbox checked={form.isFree} onChange={(event) => setForm({ ...form, isFree: event.target.checked })} label={t('courseEditor.freeCourse')} />
              <div className="grid gap-3 sm:grid-cols-2">
                <div><Label>{t('courseEditor.objectives')} (FR)</Label><Textarea rows={4} value={form.objectives} onChange={(event) => setForm({ ...form, objectives: event.target.value })} placeholder={t('courseEditor.objectivePlaceholder')} /><p className="mt-1 text-[10px] text-muted">{language === 'ar' ? 'سطر لكل هدف' : 'Un objectif par ligne'}</p></div>
                <div><Label>{t('courseEditor.objectives')} (AR)</Label><Textarea rows={4} dir="rtl" value={form.objectivesAr} onChange={(event) => setForm({ ...form, objectivesAr: event.target.value })} placeholder={t('courseEditor.objectivePlaceholder')} /><p className="mt-1 text-[10px] text-muted">هدف واحد في كل سطر</p></div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><Label>{t('courseEditor.requirements')} (FR)</Label><Textarea rows={3} value={form.prerequisites} onChange={(event) => setForm({ ...form, prerequisites: event.target.value })} placeholder={t('courseEditor.requirementPlaceholder')} /></div>
                <div><Label>{t('courseEditor.requirements')} (AR)</Label><Textarea rows={3} dir="rtl" value={form.prerequisitesAr} onChange={(event) => setForm({ ...form, prerequisitesAr: event.target.value })} placeholder={t('courseEditor.requirementPlaceholder')} /></div>
              </div>
              <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setTab('content')}>{t('courseEditor.nextContent')}</Button><Button icon={Save} loading={saving} onClick={() => saveInfo()}>{t('courseEditor.saveChanges')}</Button></div>
            </div>
          </Card>

          <div className="space-y-4">
            <Card className="overflow-hidden">
              <div className="h-32 p-4 text-white" style={{ background: course.cover }}>
                <span className="text-lg font-bold uppercase tracking-wide">{form.coverLabel || 'COURS'}</span>
              </div>
              <div className="p-4">
                <Badge tone="neutral">{form.category}</Badge>
                <p className="mt-2 text-sm font-bold text-ink">{form.title || t('courseEditor.courseTitle')}</p>
                <p className="mt-1 line-clamp-3 text-[11px] leading-relaxed text-muted">{form.shortDescription || t('courseEditor.shortDescriptionPlaceholder')}</p>
                <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                  <span className="text-sm font-bold text-ink">{form.isFree ? t('trainerCourses.freeCourse') : money(Number(form.priceDA) || 0)}</span>
                  <StatusPill status={course.status} t={t} />
                </div>
              </div>
            </Card>
            <Card>
              <CardHeader title={t('courseEditor.readinessTitle')} description={t('courseEditor.readinessDesc')} />
              <div className="space-y-3 p-4 text-[11px]">
                <div className="flex items-center justify-between gap-2"><span className="text-muted">{t('courseEditor.publishReadiness')}</span><Badge tone={publishErrors.length ? 'warning' : 'success'}>{publishErrors.length ? t('courseEditor.needsWork', { count: publishErrors.length }) : t('courseEditor.readyToPublish')}</Badge></div>
                <ProgressBar value={(passedChecks / readinessChecks.length) * 100} />
                <div className="grid gap-1.5 pt-1">
                  {readinessChecks.map((check) => <div key={check.code} className="flex items-center gap-2"><span className={cn('grid h-5 w-5 place-items-center rounded-full', publishErrors.includes(check.code) ? 'bg-warning-soft text-warning' : 'bg-success-soft text-success')}><Check size={11} /></span><span className={publishErrors.includes(check.code) ? 'text-muted' : 'text-ink'}>{t(`courseEditor.${check.key}`)}</span></div>)}
                </div>
                {['plan-courses', 'plan-paid'].filter((code) => publishErrors.includes(code)).length ? <Alert tone="warning" title={t('errors.publishIncomplete')}>{['plan-courses', 'plan-paid'].filter((code) => publishErrors.includes(code)).map((code) => publishIssueLabel(code)).join(' · ')}</Alert> : null}
              </div>
            </Card>
          </div>
        </div>
      ) : null}

      {tab === 'content' ? (
        <Card>
          <CardHeader
            title={t('courseContent.title')}
            description={t('courseContent.subtitle')}
            action={<Button size="sm" icon={Plus} onClick={() => setSectionOpen(true)}>{t('courseContent.addSection')}</Button>}
          />
          <div className="space-y-3 p-4">
            {sections.length ? sections.map((section, sectionIndex) => {
              const sectionLessons = lessons.filter((lesson) => lesson.sectionId === section.id)
              return (
                <div key={section.id} className="overflow-hidden rounded-xl border border-line">
                  <div className="flex flex-wrap items-center gap-2 bg-surface/70 px-3 py-2.5">
                    <span className="grid h-6 w-6 place-items-center rounded-lg bg-white text-[10px] font-bold text-muted shadow-sm">{sectionIndex + 1}</span>
                    <input
                      defaultValue={section.title}
                      onBlur={(event) => { if (event.target.value !== section.title) { updateSection(section.id, { title: event.target.value }); success(t('courseContent.sectionSaved')) } }}
                      className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-ink outline-none"
                    />
                    <Badge tone="neutral">{sectionLessons.length} {t('common.lessons')}</Badge>
                    <div className="flex gap-1">
                      <button type="button" disabled={sectionIndex === 0} onClick={() => moveSection(course.id, section.id, -1)} className="grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-white disabled:opacity-30"><ArrowUp size={13} /></button>
                      <button type="button" disabled={sectionIndex === sections.length - 1} onClick={() => moveSection(course.id, section.id, 1)} className="grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-white disabled:opacity-30"><ArrowDown size={13} /></button>
                      <button type="button" onClick={() => addNewLesson(section.id, 'content')} className="grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-white hover:text-brand" title={t('courseContent.addLesson')}><Plus size={13} /></button>
                      <button type="button" onClick={() => setDeleteSectionTarget(section)} className="grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-danger-soft hover:text-danger"><Trash2 size={13} /></button>
                    </div>
                  </div>
                  <div className="grid gap-2 border-t border-line bg-white px-3 py-2 sm:grid-cols-2">
                    <Input defaultValue={section.descriptionFr || ''} onBlur={(event) => { if (event.target.value !== (section.descriptionFr || '')) updateSection(section.id, { descriptionFr: event.target.value }) }} placeholder={`${t('courseContent.sectionDescription')} (FR)`} className="h-8 text-[11px]" />
                    <Input defaultValue={section.descriptionAr || ''} dir="rtl" onBlur={(event) => { if (event.target.value !== (section.descriptionAr || '')) updateSection(section.id, { descriptionAr: event.target.value }) }} placeholder={`${t('courseContent.sectionDescription')} (AR)`} className="h-8 text-[11px]" />
                  </div>
                  <div className="divide-y divide-line">
                    {sectionLessons.length ? sectionLessons.map((lesson, lessonIndex) => (
                      <div key={lesson.id} className="flex items-center gap-2 px-3 py-2.5">
                        <GripVertical size={14} className="shrink-0 text-muted/50" />
                        <span className={cn('grid h-7 w-7 shrink-0 place-items-center rounded-lg', lesson.type === 'quiz' ? 'bg-purple-50 text-purple-600' : 'bg-brand-soft text-brand')}>
                          {lesson.type === 'quiz' ? <ListChecks size={13} /> : <FileText size={13} />}
                        </span>
                        <button type="button" onClick={() => setLessonTarget(lesson.id)} className="min-w-0 flex-1 truncate text-start text-xs font-medium text-ink hover:text-brand">{lesson.title || t('courseContent.untitledLesson')}</button>
                        {lesson.preview ? <Badge tone="success">{t('courseContent.lessonFreePreview')}</Badge> : null}
                        <span className="hidden text-[10px] text-muted sm:block">{lesson.durationMin} min</span>
                        <div className="flex gap-0.5">
                          <button type="button" disabled={lessonIndex === 0} onClick={() => moveLesson(section.id, lesson.id, -1)} className="grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-surface disabled:opacity-30"><ArrowUp size={12} /></button>
                          <button type="button" disabled={lessonIndex === sectionLessons.length - 1} onClick={() => moveLesson(section.id, lesson.id, 1)} className="grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-surface disabled:opacity-30"><ArrowDown size={12} /></button>
                          <button type="button" onClick={() => success(t('courseContent.duplicateLesson')) || duplicateLesson(lesson.id)} className="grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-surface"><Copy size={12} /></button>
                          <button type="button" onClick={() => setDeleteLessonTarget(lesson)} className="grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-danger-soft hover:text-danger"><Trash2 size={12} /></button>
                        </div>
                      </div>
                    )) : (
                      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-3 text-[11px] text-muted">
                        <span>{t('courseContent.noLessonsDesc')}</span>
                        <div className="flex gap-1.5">
                          <Button variant="ghost" size="xs" icon={Plus} onClick={() => addNewLesson(section.id, 'content')}>{t('courseContent.blockText')}</Button>
                          <Button variant="ghost" size="xs" icon={ListChecks} onClick={() => addNewLesson(section.id, 'quiz')}>{t('courseContent.blockQuiz')}</Button>
                        </div>
                      </div>
                    )}
                    {sectionLessons.length ? (
                      <div className="flex gap-1.5 px-3 py-2">
                        <Button variant="ghost" size="xs" icon={Plus} onClick={() => addNewLesson(section.id, 'content')}>{t('courseContent.addLesson')}</Button>
                        <Button variant="ghost" size="xs" icon={ListChecks} onClick={() => addNewLesson(section.id, 'quiz')}>{t('courseContent.blockQuiz')}</Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              )
            }) : (
              <EmptyState icon={Layers} title={t('courseContent.emptyCourse')} description={t('courseContent.emptyCourseDesc')} action={<Button size="sm" icon={Plus} onClick={() => setSectionOpen(true)}>{t('courseContent.addSection')}</Button>} />
            )}
          </div>
        </Card>
      ) : null}

      {tab === 'settings' ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader title={t('courseEditor.settingsTitle')} description={t('courseEditor.settingsTitle')} />
            <div className="space-y-4 p-5">
              <Switch checked={form.sequential} onChange={(event) => setForm({ ...form, sequential: event.target.checked })} label={t('courseEditor.sequential') || 'Progression séquentielle'} description={t('courseDetail.curriculum')} />
              <Switch checked={form.commentsEnabled} onChange={(event) => setForm({ ...form, commentsEnabled: event.target.checked })} label={t('courseEditor.discussion')} description={t('courseEditor.discussionDesc')} />
              <div className="rounded-xl bg-surface p-3 text-[11px] text-muted">{course.status === 'published' ? t('trainerCourses.publishedHint') : t('trainerCourses.draftHint')}</div>
              <div className="flex justify-end"><Button icon={Save} onClick={saveSettings}>{t('common.save')}</Button></div>
            </div>
          </Card>
          <Card className="border-danger/25">
            <CardHeader title={t('courseEditor.deleteCourse')} description={t('trainerCourses.deleteDesc')} />
            <div className="p-5">
              <Alert tone="danger" title={t('courseEditor.deleteCourse')}>{t('trainerCourses.deleteDesc')}</Alert>
              <Button variant="danger" icon={Trash2} className="mt-3" onClick={() => setDeleteCourseOpen(true)}>{t('courseEditor.deleteCourse')}</Button>
            </div>
          </Card>
        </div>
      ) : null}

      <Modal open={sectionOpen} onClose={() => setSectionOpen(false)} title={t('courseContent.newSection')} footer={<><Button variant="secondary" onClick={() => setSectionOpen(false)}>{t('common.cancel')}</Button><Button onClick={addNewSection}>{t('courseContent.addSection')}</Button></>}>
        <Label>{t('courseContent.sectionTitle')}</Label>
        <Input value={sectionTitle} onChange={(event) => setSectionTitle(event.target.value)} placeholder={t('courseContent.sectionTitlePlaceholder')} />
      </Modal>

      <LessonEditor
        lessonId={lessonTarget}
        onClose={() => setLessonTarget(null)}
        onDeleted={() => { setLessonTarget(null); setDeleteLessonTarget(null) }}
      />

      <ConfirmDialog open={Boolean(deleteSectionTarget)} onClose={() => setDeleteSectionTarget(null)} onConfirm={() => { deleteSection(deleteSectionTarget.id); setDeleteSectionTarget(null); success(t('courseContent.sectionSaved')) }} title={t('courseContent.deleteSectionConfirm')} description={t('courseContent.deleteSectionDesc')} confirmLabel={t('courseContent.deleteSection')} />
      <ConfirmDialog open={Boolean(deleteLessonTarget)} onClose={() => setDeleteLessonTarget(null)} onConfirm={() => { deleteLesson(deleteLessonTarget.id); setDeleteLessonTarget(null); success(t('courseContent.itemSaved')) }} title={t('courseContent.deleteLessonConfirm')} description={t('courseContent.deleteLessonDesc')} confirmLabel={t('courseContent.deleteLesson')} />
      <ConfirmDialog open={deleteCourseOpen} onClose={() => setDeleteCourseOpen(false)} onConfirm={() => { updateCourse(course.id, { deletedAt: new Date().toISOString(), status: 'draft' }); navigate('/trainer/courses'); success(t('trainerCourses.deleteSuccess')) }} title={t('trainerCourses.deleteConfirm')} description={t('trainerCourses.deleteDesc')} confirmLabel={t('trainerCourses.delete')} />
    </div>
  )
}

function LessonEditor({ lessonId, onClose, onDeleted }) {
  const { t } = useI18n()
  const { success, error: toastError } = useToast()
  const state = useTiwanzaStore()
  const lesson = lessonId ? getLesson(state, lessonId) : null
  const [title, setTitle] = useState('')
  const [durationMin, setDurationMin] = useState(10)
  const [type, setType] = useState('content')
  const [descriptionFr, setDescriptionFr] = useState('')
  const [descriptionAr, setDescriptionAr] = useState('')
  const [preview, setPreview] = useState(false)
  const [quizDraft, setQuizDraft] = useState(null)

  useEffect(() => {
    if (!lesson) return
    setTitle(lesson.title)
    setDurationMin(lesson.durationMin || 10)
    setType(lesson.type)
    setDescriptionFr(lesson.descriptionFr || '')
    setDescriptionAr(lesson.descriptionAr || '')
    setPreview(Boolean(lesson.preview))
    if (lesson.type === 'quiz') {
      const quiz = getQuizByLesson(state, lesson.id)
      setQuizDraft(quiz ? {
        title: quiz.title,
        descriptionFr: quiz.descriptionFr || '',
        descriptionAr: quiz.descriptionAr || '',
        passingScore: quiz.passingScore,
        timeLimitMin: quiz.timeLimitMin || 0,
        maxAttempts: quiz.maxAttempts || 0,
        randomizeQuestions: quiz.randomizeQuestions,
        randomizeAnswers: quiz.randomizeAnswers,
        questions: quiz.questions.map((question) => ({ ...question, choices: question.choices.map((choice) => ({ ...choice })) })),
      } : { title: lesson.title, descriptionFr: '', descriptionAr: '', passingScore: 70, timeLimitMin: 0, maxAttempts: 0, randomizeQuestions: false, randomizeAnswers: false, questions: [] })
    } else {
      setQuizDraft(null)
    }
  }, [lessonId])

  if (!lesson) return null
  const blocks = getBlocks(state, lesson.id)

  function saveLesson() {
    updateLesson(lesson.id, {
      title: title.trim() || t('courseContent.untitledLesson'),
      durationMin: Number(durationMin) || 10,
      descriptionFr: descriptionFr.trim(),
      descriptionAr: descriptionAr.trim(),
      preview: Boolean(preview),
    })
    success(t('courseContent.lessonSaved'))
  }

  function addQuestion() {
    setQuizDraft((current) => ({
      ...current,
      questions: [...current.questions, {
        id: `q-${Date.now()}`,
        type: 'single',
        title: '',
        points: 1,
        explanation: '',
        choices: [
          { id: `c-${Date.now()}-1`, text: '', correct: true },
          { id: `c-${Date.now()}-2`, text: '', correct: false },
        ],
      }],
    }))
  }

  function updateQuestion(index, patch) {
    setQuizDraft((current) => ({ ...current, questions: current.questions.map((question, i) => i === index ? { ...question, ...patch } : question) }))
  }

  function updateChoice(questionIndex, choiceIndex, patch) {
    setQuizDraft((current) => ({
      ...current,
      questions: current.questions.map((question, i) => {
        if (i !== questionIndex) return question
        const choices = question.choices.map((choice, c) => c === choiceIndex ? { ...choice, ...patch } : choice)
        return { ...question, choices }
      }),
    }))
  }

  function markCorrect(questionIndex, choiceIndex) {
    const question = quizDraft.questions[questionIndex]
    setQuizDraft((current) => ({
      ...current,
      questions: current.questions.map((item, i) => {
        if (i !== questionIndex) return item
        return {
          ...item,
          choices: item.choices.map((choice, c) => ({
            ...choice,
            correct: item.type === 'multiple' ? (c === choiceIndex ? !choice.correct : choice.correct) : c === choiceIndex,
          })),
        }
      }),
    }))
  }

  function removeQuestion(index) {
    setQuizDraft((current) => ({ ...current, questions: current.questions.filter((_, i) => i !== index) }))
  }

  function saveQuiz() {
    if (!quizDraft.questions.length) return toastError(t('courseContent.noQuizDesc'))
    const invalid = quizDraft.questions.find((question) => !question.title.trim() || !question.choices.some((choice) => choice.correct))
    if (invalid) return toastError(t('errors.requiredFields'))
    saveQuizForLesson(lesson.id, quizDraft)
    success(t('courseContent.quizSaved'))
  }

  return (
    <Modal
      open={Boolean(lessonId)}
      onClose={onClose}
      title={lesson.type === 'quiz' ? t('courseContent.quizTitle') : t('courseContent.editLesson')}
      description={lesson.type === 'quiz' ? t('courseContent.quizSettings') : t('courseContent.lessonSettings')}
      size="xl"
      footer={
        <>
          <Button variant="dangerSoft" icon={Trash2} onClick={() => { deleteLesson(lesson.id); onDeleted() }}>{t('courseContent.deleteLesson')}</Button>
          <Button variant="secondary" onClick={onClose}>{t('common.close')}</Button>
          {lesson.type === 'quiz' ? <Button icon={Save} onClick={saveQuiz}>{t('courseContent.saveQuiz')}</Button> : <Button icon={Save} onClick={saveLesson}>{t('courseContent.saveLesson')}</Button>}
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
          <div><Label>{t('courseContent.lessonTitle')}</Label><Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t('courseContent.lessonTitlePlaceholder')} /></div>
          <div><Label>{t('courseContent.lessonDuration')}</Label><Input type="number" value={durationMin} onChange={(event) => setDurationMin(event.target.value)} /></div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label>{t('courseContent.sectionDescription')} (FR)</Label><Textarea rows={2} value={descriptionFr} onChange={(event) => setDescriptionFr(event.target.value)} placeholder={t('courseContent.sectionDescriptionPlaceholder')} /></div>
          <div><Label>{t('courseContent.sectionDescription')} (AR)</Label><Textarea rows={2} dir="rtl" value={descriptionAr} onChange={(event) => setDescriptionAr(event.target.value)} placeholder={t('courseContent.sectionDescriptionPlaceholder')} /></div>
        </div>
        <Checkbox checked={preview} onChange={(event) => setPreview(event.target.checked)} label={t('courseContent.lessonFreePreview')} />

        {lesson.type === 'content' ? (
          <div className="rounded-xl border border-line">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface/70 px-3 py-2">
              <span className="text-xs font-semibold text-ink">{t('courseContent.lessonContent')}</span>
              <Select
                value=""
                onChange={(event) => { if (event.target.value) { addBlock(lesson.id, event.target.value); success(t('courseContent.itemSaved')) } }}
                className="h-8 w-auto min-w-32 py-1 text-[11px]"
              >
                <option value="">{t('courseContent.addBlock')}</option>
                <option value="richtext">{t('courseContent.blockText')}</option>
                <option value="video">{t('courseContent.blockVideo')}</option>
                <option value="youtube">{t('courseContent.blockVideo')}</option>
                <option value="file">{t('courseContent.blockFile')}</option>
                <option value="pdf">{t('courseContent.blockFile')}</option>
                <option value="image">{t('courseContent.blockImage')}</option>
                <option value="gdrive">{t('courseContent.blockFile')}</option>
              </Select>
            </div>
            {blocks.length ? (
              <div className="space-y-2 p-3">
                {blocks.map((block) => {
                  const Icon = BLOCK_ICONS[block.type] || FileText
                  return (
                    <div key={block.id} className="rounded-lg border border-line bg-white p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-ink"><Icon size={13} className="text-brand" /> {t(BLOCK_LABEL_KEYS[block.type] || 'courseContent.blockText')}</span>
                        <button type="button" onClick={() => deleteBlock(block.id)} className="grid h-6 w-6 place-items-center rounded text-muted hover:bg-danger-soft hover:text-danger"><X size={12} /></button>
                      </div>
                      <BlockFields block={block} onChange={(data) => updateBlock(block.id, data)} />
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-3"><EmptyState icon={FileText} title={t('courseContent.noBlocks')} description={t('courseContent.noBlocksDesc')} compact /></div>
            )}
          </div>
        ) : (
          <QuizEditor quizDraft={quizDraft} setQuizDraft={setQuizDraft} addQuestion={addQuestion} updateQuestion={updateQuestion} updateChoice={updateChoice} markCorrect={markCorrect} removeQuestion={removeQuestion} />
        )}
      </div>
    </Modal>
  )
}

function BlockFields({ block, onChange }) {
  const { t } = useI18n()
  if (block.type === 'richtext') {
    return <Textarea rows={4} value={block.data?.html || ''} onChange={(event) => onChange({ html: event.target.value })} placeholder={t('courseContent.textContentPlaceholder')} />
  }
  if (block.type === 'video') {
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        <Input value={block.data?.fileName || ''} onChange={(event) => onChange({ fileName: event.target.value })} placeholder={t('courseContent.fileName')} />
        <Input type="number" value={block.data?.sizeMb || 0} onChange={(event) => onChange({ sizeMb: Number(event.target.value), status: 'ready' })} placeholder="Mo" />
      </div>
    )
  }
  if (block.type === 'youtube') {
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        <Input value={block.data?.url || ''} onChange={(event) => onChange({ url: event.target.value })} placeholder={t('courseContent.videoUrlPlaceholder')} />
        <Input value={block.data?.title || ''} onChange={(event) => onChange({ title: event.target.value })} placeholder={t('courseContent.blockTitle')} />
      </div>
    )
  }
  if (block.type === 'image') {
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        <Input value={block.data?.url || ''} onChange={(event) => onChange({ url: event.target.value })} placeholder={t('courseContent.imageUrl')} />
        <Input value={block.data?.caption || ''} onChange={(event) => onChange({ caption: event.target.value })} placeholder={t('courseContent.blockTitle')} />
      </div>
    )
  }
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <Input value={block.data?.fileName || ''} onChange={(event) => onChange({ fileName: event.target.value, status: 'ready' })} placeholder={t('courseContent.fileName')} />
      <Input value={block.data?.url || ''} onChange={(event) => onChange({ url: event.target.value })} placeholder={t('courseContent.fileUrl')} />
    </div>
  )
}

function QuizEditor({ quizDraft, setQuizDraft, addQuestion, updateQuestion, updateChoice, markCorrect, removeQuestion }) {
  const { t } = useI18n()
  if (!quizDraft) return null
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_100px_100px_100px]">
        <div><Label>{t('courseContent.quizTitle')}</Label><Input value={quizDraft.title} onChange={(event) => setQuizDraft({ ...quizDraft, title: event.target.value })} /></div>
        <div><Label>{t('courseContent.passScore')}</Label><Input type="number" value={quizDraft.passingScore} onChange={(event) => setQuizDraft({ ...quizDraft, passingScore: Number(event.target.value) })} /></div>
        <div><Label>{t('courseContent.timeLimit')}</Label><Input type="number" min="0" value={quizDraft.timeLimitMin} onChange={(event) => setQuizDraft({ ...quizDraft, timeLimitMin: Number(event.target.value) })} /><p className="mt-1 text-[10px] text-muted">{quizDraft.timeLimitMin ? '' : t('courseContent.timeLimitNone')}</p></div>
        <div><Label>{t('courseContent.attempts')}</Label><Input type="number" min="0" value={quizDraft.maxAttempts} onChange={(event) => setQuizDraft({ ...quizDraft, maxAttempts: Number(event.target.value) })} /><p className="mt-1 text-[10px] text-muted">{quizDraft.maxAttempts ? '' : t('courseContent.attemptsUnlimited')}</p></div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><Label>{t('courseContent.quizDescription')} (FR)</Label><Textarea rows={2} value={quizDraft.descriptionFr} onChange={(event) => setQuizDraft({ ...quizDraft, descriptionFr: event.target.value })} /></div>
        <div><Label>{t('courseContent.quizDescription')} (AR)</Label><Textarea rows={2} dir="rtl" value={quizDraft.descriptionAr} onChange={(event) => setQuizDraft({ ...quizDraft, descriptionAr: event.target.value })} /></div>
      </div>
      <Badge tone="neutral">{t('courseContent.questions')}: {quizDraft.questions.length}</Badge>
      <div className="space-y-3">
        {quizDraft.questions.map((question, questionIndex) => (
          <div key={question.id} className="rounded-xl border border-line p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-brand-soft text-[10px] font-bold text-brand">{questionIndex + 1}</span>
              <Select value={question.type} onChange={(event) => updateQuestion(questionIndex, { type: event.target.value })} className="h-8 w-auto min-w-32 py-1 text-[11px]">
                <option value="single">{t('courseContent.typeSingle')}</option>
                <option value="multiple">{t('courseContent.typeMultiple')}</option>
                <option value="boolean">{t('courseContent.typeTrueFalse')}</option>
              </Select>
              <Input type="number" value={question.points} onChange={(event) => updateQuestion(questionIndex, { points: Number(event.target.value) })} className="h-8 w-20 py-1 text-[11px]" />
              <button type="button" onClick={() => removeQuestion(questionIndex)} className="ms-auto grid h-7 w-7 place-items-center rounded text-muted hover:bg-danger-soft hover:text-danger"><Trash2 size={13} /></button>
            </div>
            <Input value={question.title} onChange={(event) => updateQuestion(questionIndex, { title: event.target.value })} placeholder={t('courseContent.questionPlaceholder')} className="mt-2" />
            {question.type === 'boolean' ? (
              <div className="mt-2 flex gap-4 text-xs">
                {['Vrai', 'Faux'].map((label, index) => (
                  <label key={label} className="flex items-center gap-1.5"><input type="radio" name={`q-${question.id}`} checked={question.choices[index]?.correct} onChange={() => markCorrect(questionIndex, index)} className="accent-[var(--color-brand)]" /> {label}</label>
                ))}
              </div>
            ) : (
              <div className="mt-2 space-y-1.5">
                {question.choices.map((choice, choiceIndex) => (
                  <div key={choice.id} className="flex items-center gap-2">
                    <input type={question.type === 'multiple' ? 'checkbox' : 'radio'} checked={Boolean(choice.correct)} onChange={() => markCorrect(questionIndex, choiceIndex)} className="h-3.5 w-3.5 accent-[var(--color-brand)]" />
                    <Input value={choice.text} onChange={(event) => updateChoice(questionIndex, choiceIndex, { text: event.target.value })} placeholder={t('courseContent.answerPlaceholder', { number: choiceIndex + 1 })} className="h-8 py-1 text-[11px]" />
                    {question.choices.length > 2 ? <button type="button" onClick={() => updateQuestion(questionIndex, { choices: question.choices.filter((_, i) => i !== choiceIndex) })} className="grid h-7 w-7 shrink-0 place-items-center rounded text-muted hover:text-danger"><X size={12} /></button> : null}
                  </div>
                ))}
                <Button variant="ghost" size="xs" icon={Plus} onClick={() => updateQuestion(questionIndex, { choices: [...question.choices, { id: `c-${Date.now()}`, text: '', correct: false }] })}>{t('courseContent.addAnswer')}</Button>
              </div>
            )}
            <Input value={question.explanation || ''} onChange={(event) => updateQuestion(questionIndex, { explanation: event.target.value })} placeholder={t('courseContent.explanationPlaceholder')} className="mt-2 h-8 py-1 text-[11px]" />
          </div>
        ))}
        <Button variant="secondary" icon={Plus} onClick={addQuestion}>{t('courseContent.addQuestion')}</Button>
      </div>
    </div>
  )
}
