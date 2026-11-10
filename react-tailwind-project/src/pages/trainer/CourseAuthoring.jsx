import { useEffect, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Check,
  FileText,
  FileUp,
  Image as ImageIcon,
  Link2,
  ListChecks,
  Plus,
  Save,
  Star,
  Trash2,
  Video,
  X,
} from 'lucide-react'
import { useI18n } from '../../i18n/I18nContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { useTiwanzaStore } from '../../data/store.js'
import {
  getBlocks,
  getCourse,
  getCourseDurationMinutes,
  getCourseLessons,
  getCourseRating,
  getLesson,
  getQuizByLesson,
  getSections,
} from '../../data/selectors.js'
import {
  addBlock,
  deleteBlock,
  deleteLesson,
  moveBlock,
  saveQuizForLesson,
  updateBlock,
  updateLesson,
  validateCourseForPublish,
} from '../../data/services.js'
import { LessonBlock } from '../../components/LessonContent.jsx'
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  EmptyState,
  Input,
  Label,
  Modal,
  ProgressBar,
  Select,
  Textarea,
} from '../../components/ui.jsx'
import { cn } from '../../lib/utils.js'

export const BLOCK_ICONS = { richtext: FileText, video: Video, pdf: FileUp, file: FileUp, image: ImageIcon, gdrive: Link2 }
export const BLOCK_LABEL_KEYS = {
richtext: 'courseContent.blockText',
  video: 'courseContent.blockVideo',
  pdf: 'courseContent.blockPdf',
  file: 'courseContent.blockFile',
  image: 'courseContent.blockImage',
  gdrive: 'courseContent.blockGdrive',
}
}

export const READINESS_CHECKS = [
  { code: 'info', key: 'readinessInfo' },
  { code: 'objectives', key: 'readinessObjectives' },
  { code: 'sections', key: 'readinessSections' },
  { code: 'lessons', key: 'readinessLessons' },
  { code: 'content', key: 'readinessContent' },
  { code: 'quiz', key: 'readinessQuiz' },
  { code: 'payment', key: 'readinessPayment' },
]

const PLAN_LIMIT_KEYS = { 'plan-courses': 'planCourseLimit', 'plan-paid': 'planPaidLimit' }

export function publishIssueLabel(t, code) {
  const check = READINESS_CHECKS.find((item) => item.code === code)
  if (check) return t(`courseEditor.${check.key}`)
  if (PLAN_LIMIT_KEYS[code]) return t(`courseEditor.${PLAN_LIMIT_KEYS[code]}`)
  return t(`errors.${code}`)
}

export function courseToForm(course) {
  return {
    title: course?.title || '',
    shortDescription: course?.shortDescription || '',
    description: course?.description || '',
    category: course?.category || 'Développement',
    language: course?.language || 'fr',
    difficulty: course?.difficulty || 'beginner',
    isFree: Boolean(course?.isFree),
    priceDA: course?.priceDA || 0,
    coverLabel: course?.coverLabel || '',
    coverImage: course?.coverImage || '',
    objectivesFrText: (course?.objectivesFr || []).join('\n'),
    objectivesArText: (course?.objectivesAr || []).join('\n'),
    prerequisitesFrText: (course?.prerequisitesFr || []).join('\n'),
    prerequisitesArText: (course?.prerequisitesAr || []).join('\n'),
    targetAudienceFrText: (course?.targetAudienceFr || []).join('\n'),
    targetAudienceArText: (course?.targetAudienceAr || []).join('\n'),
    outcomesFrText: (course?.outcomesFr || []).join('\n'),
    outcomesArText: (course?.outcomesAr || []).join('\n'),
    estimatedDurationMin: course?.estimatedDurationMin || 0,
    sequential: Boolean(course?.sequential),
    commentsEnabled: course?.commentsEnabled !== false,
    allowManual: course?.enrollmentSettings?.allowManual !== false,
    allowOnline: course?.enrollmentSettings?.allowOnline !== false,
    visibility: course?.visibility || 'public',
  }
}

function lines(value) {
  return String(value || '').split('\n').map((line) => line.trim()).filter(Boolean)
}

export function formToCourse(form) {
  return {
    title: form.title.trim(),
    shortDescription: form.shortDescription.trim(),
    description: form.description.trim(),
    category: form.category,
    language: form.language,
    difficulty: form.difficulty,
    isFree: form.isFree,
    priceDA: form.isFree ? 0 : Number(form.priceDA) || 0,
    coverLabel: form.coverLabel.trim().toUpperCase(),
    coverImage: form.coverImage.trim() || null,
    objectivesFr: lines(form.objectivesFrText),
    objectivesAr: lines(form.objectivesArText),
    prerequisitesFr: lines(form.prerequisitesFrText),
    prerequisitesAr: lines(form.prerequisitesArText),
    targetAudienceFr: lines(form.targetAudienceFrText),
    targetAudienceAr: lines(form.targetAudienceArText),
    outcomesFr: lines(form.outcomesFrText),
    outcomesAr: lines(form.outcomesArText),
    estimatedDurationMin: Number(form.estimatedDurationMin) || 0,
    sequential: Boolean(form.sequential),
    commentsEnabled: Boolean(form.commentsEnabled),
    visibility: form.visibility,
    enrollmentSettings: { allowManual: Boolean(form.allowManual), allowOnline: Boolean(form.allowOnline) },
  }
}

const CATEGORIES = ['Développement', 'Design', 'Business', 'Langues', 'Gestion', 'Autre']

export function CourseInfoFields({ form, setForm }) {
  const { t, language } = useI18n()
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Label required>{t('courseEditor.courseTitle')}</Label><Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder={t('courseEditor.courseTitlePlaceholder')} /></div>
        <div className="sm:col-span-2"><Label required>{t('courseEditor.shortDescription')}</Label><Textarea rows={2} value={form.shortDescription} onChange={(event) => setForm({ ...form, shortDescription: event.target.value })} placeholder={t('courseEditor.shortDescriptionPlaceholder')} /><p className="mt-1 text-[10px] text-muted">{t('courseEditor.shortDescriptionHint')}</p></div>
        <div className="sm:col-span-2"><Label required>{t('courseEditor.description')}</Label><Textarea rows={5} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder={t('courseEditor.descriptionPlaceholder')} /></div>
        <div><Label>{t('courseEditor.category')}</Label><Select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{CATEGORIES.map((item) => <option key={item}>{item}</option>)}</Select></div>
        <div><Label>{t('courseEditor.language')}</Label><Select value={form.language} onChange={(event) => setForm({ ...form, language: event.target.value })}><option value="fr">Francais</option><option value="ar">Arabic</option></Select></div>
        <div><Label>{t('courseEditor.level')}</Label><Select value={form.difficulty} onChange={(event) => setForm({ ...form, difficulty: event.target.value })}><option value="beginner">{t('publicSite.levelBeginner')}</option><option value="intermediate">{t('publicSite.levelIntermediate')}</option><option value="advanced">{t('publicSite.levelAdvanced')}</option></Select></div>
        <div><Label>{t('courseEditor.coverImage')}</Label><Input value={form.coverImage} onChange={(event) => setForm({ ...form, coverImage: event.target.value })} placeholder="https://..." /></div>
        <div><Label>{t('courseEditor.coverLabel')}</Label><Input value={form.coverLabel} onChange={(event) => setForm({ ...form, coverLabel: event.target.value.toUpperCase() })} placeholder="REACT" /></div>
        <div><Label>{t('courseEditor.duration')}</Label><Input type="number" min="0" value={form.estimatedDurationMin} onChange={(event) => setForm({ ...form, estimatedDurationMin: Number(event.target.value) })} /><p className="mt-1 text-[10px] text-muted">{t('courseEditor.durationHint')}</p></div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div><Label>{t('courseEditor.objectives')} (FR)</Label><Textarea rows={4} value={form.objectivesFrText} onChange={(event) => setForm({ ...form, objectivesFrText: event.target.value })} placeholder={t('courseEditor.objectivePlaceholder')} /><p className="mt-1 text-[10px] text-muted">{t('courseWizard.onePerLine')}</p></div>
        <div><Label>{t('courseEditor.objectives')} (AR)</Label><Textarea rows={4} dir="rtl" value={form.objectivesArText} onChange={(event) => setForm({ ...form, objectivesArText: event.target.value })} placeholder={t('courseEditor.objectivePlaceholder')} /><p className="mt-1 text-[10px] text-muted">{t('courseWizard.onePerLine')}</p></div>
        <div><Label>{t('courseEditor.requirements')} (FR)</Label><Textarea rows={3} value={form.prerequisitesFrText} onChange={(event) => setForm({ ...form, prerequisitesFrText: event.target.value })} placeholder={t('courseEditor.requirementPlaceholder')} /></div>
        <div><Label>{t('courseEditor.requirements')} (AR)</Label><Textarea rows={3} dir="rtl" value={form.prerequisitesArText} onChange={(event) => setForm({ ...form, prerequisitesArText: event.target.value })} placeholder={t('courseEditor.requirementPlaceholder')} /></div>
        <div><Label>{t('courseWizard.targetAudience')} (FR)</Label><Textarea rows={3} value={form.targetAudienceFrText} onChange={(event) => setForm({ ...form, targetAudienceFrText: event.target.value })} placeholder={t('courseWizard.targetAudiencePlaceholder')} /></div>
        <div><Label>{t('courseWizard.targetAudience')} (AR)</Label><Textarea rows={3} dir="rtl" value={form.targetAudienceArText} onChange={(event) => setForm({ ...form, targetAudienceArText: event.target.value })} placeholder={t('courseWizard.targetAudiencePlaceholder')} /></div>
        <div><Label>{t('courseWizard.outcomes')} (FR)</Label><Textarea rows={3} value={form.outcomesFrText} onChange={(event) => setForm({ ...form, outcomesFrText: event.target.value })} placeholder={t('courseWizard.outcomesPlaceholder')} /></div>
        <div><Label>{t('courseWizard.outcomes')} (AR)</Label><Textarea rows={3} dir="rtl" value={form.outcomesArText} onChange={(event) => setForm({ ...form, outcomesArText: event.target.value })} placeholder={t('courseWizard.outcomesPlaceholder')} /></div>
      </div>
      <p className="text-[10px] text-muted">{language === 'ar' ? 'يتم حفظ النسختين الفرنسية والعربية.' : 'Les versions française et arabe sont conservées.'}</p>
    </div>
  )
}

export function ReadinessChecklist({ course, state, compact = false }) {
  const { t } = useI18n()
  const errors = validateCourseForPublish(state, course)
  const passed = READINESS_CHECKS.filter((check) => !errors.includes(check.code)).length
  return (
    <div className={cn('space-y-3', compact ? 'text-[11px]' : 'text-xs')}>
      <div className="flex items-center justify-between gap-2"><span className="text-muted">{t('courseEditor.publishReadiness')}</span><Badge tone={errors.length ? 'warning' : 'success'}>{errors.length ? t('courseEditor.needsWork', { count: errors.length }) : t('courseEditor.readyToPublish')}</Badge></div>
      <ProgressBar value={(passed / READINESS_CHECKS.length) * 100} />
      <div className="grid gap-1.5 pt-1">
        {READINESS_CHECKS.map((check) => <div key={check.code} className="flex items-center gap-2"><span className={cn('grid h-5 w-5 place-items-center rounded-full', errors.includes(check.code) ? 'bg-warning-soft text-warning' : 'bg-success-soft text-success')}><Check size={11} /></span><span className={errors.includes(check.code) ? 'text-muted' : 'text-ink'}>{t(`courseEditor.${check.key}`)}</span></div>)}
      </div>
      {errors.filter((code) => PLAN_LIMIT_KEYS[code]).length ? <Alert tone="warning" title={t('errors.publishIncomplete')}>{errors.filter((code) => PLAN_LIMIT_KEYS[code]).map((code) => publishIssueLabel(t, code)).join(' · ')}</Alert> : null}
    </div>
  )
}

export function CoursePreviewPanel({ courseId }) {
  const { t, language, money } = useI18n()
  const state = useTiwanzaStore()
  const course = getCourse(state, courseId)
  const [mode, setMode] = useState('landing')
  const [lessonId, setLessonId] = useState(null)
  if (!course) return null
  const sections = getSections(state, course.id)
  const lessons = getCourseLessons(state, course.id)
  const contentLessons = lessons.filter((lesson) => lesson.type === 'content')
  const quizLessons = lessons.filter((lesson) => lesson.type === 'quiz')
  const selectedLesson = lessons.find((lesson) => lesson.id === lessonId) || contentLessons[0] || null
  const selectedQuizLesson = quizLessons[0] || null
  const quiz = selectedQuizLesson ? getQuizByLesson(state, selectedQuizLesson.id) : null
  const blocks = selectedLesson ? getBlocks(state, selectedLesson.id) : []
  const rating = getCourseRating(state, course.id)
  const duration = course.estimatedDurationMin || getCourseDurationMinutes(state, course.id)
  const objectives = (language === 'ar' ? course.objectivesAr : course.objectivesFr) || []
  const prerequisites = (language === 'ar' ? course.prerequisitesAr : course.prerequisitesFr) || []
  const targetAudience = (language === 'ar' ? course.targetAudienceAr : course.targetAudienceFr) || []
  const outcomes = (language === 'ar' ? course.outcomesAr : course.outcomesFr) || []
  const modes = [
    { value: 'landing', label: t('courseWizard.previewLanding') },
    { value: 'curriculum', label: t('courseWizard.previewCurriculum') },
    { value: 'lesson', label: t('courseWizard.previewLesson') },
    { value: 'quiz', label: t('courseWizard.previewQuiz') },
  ]

  return (
    <div className="space-y-4">
      <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-xl bg-surface p-1">
        {modes.map((item) => <button key={item.value} type="button" onClick={() => setMode(item.value)} className={cn('shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition', mode === item.value ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink')}>{item.label}</button>)}
      </div>

      {mode === 'landing' ? (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <div className="relative h-44 p-5 text-white" style={{ background: course.cover }}>
            {course.coverImage ? <img src={course.coverImage} alt="" className="absolute inset-0 h-full w-full object-cover" /> : null}
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
            <div className="relative flex h-full flex-col justify-end">
              <Badge className="mb-2 w-fit border-white/20 bg-black/20 text-white">{course.category}</Badge>
              <h2 className="max-w-2xl text-xl font-bold leading-tight">{course.title || t('courseEditor.courseTitle')}</h2>
              <p className="mt-1 max-w-2xl text-xs text-white/80">{course.shortDescription || t('courseEditor.shortDescriptionPlaceholder')}</p>
            </div>
          </div>
          <div className="space-y-4 p-5">
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted">
              <span className="inline-flex items-center gap-1"><Star size={12} className="text-amber-500" /> {rating.count ? `${rating.average} (${rating.count})` : t('publicSite.noRatings')}</span>
              <span>{duration ? `${duration} min` : t('courseWizard.notSet')}</span>
              <span>{course.isFree ? t('trainerCourses.freeCourse') : money(course.priceDA)}</span>
            </div>
            <p className="text-sm leading-relaxed text-muted">{course.description || t('courseEditor.descriptionPlaceholder')}</p>
            {objectives.length ? <PreviewList title={t('courseEditor.objectives')} items={objectives} /> : null}
            {prerequisites.length ? <PreviewList title={t('courseEditor.requirements')} items={prerequisites} /> : null}
            {targetAudience.length ? <PreviewList title={t('courseWizard.targetAudience')} items={targetAudience} /> : null}
            {outcomes.length ? <PreviewList title={t('courseWizard.outcomes')} items={outcomes} /> : null}
            <div className="rounded-xl border border-line bg-surface/60 p-3 text-xs text-muted">{t('courseWizard.previewLandingHint')}</div>
          </div>
        </div>
      ) : null}

      {mode === 'curriculum' ? (
        <div className="space-y-3">
          {sections.length ? sections.map((section, index) => {
            const sectionLessons = lessons.filter((lesson) => lesson.sectionId === section.id)
            return (
              <div key={section.id} className="overflow-hidden rounded-xl border border-line bg-white">
                <div className="flex items-center gap-2 border-b border-line bg-surface/60 px-4 py-3"><span className="grid h-6 w-6 place-items-center rounded-lg bg-white text-[10px] font-bold text-muted shadow-sm">{index + 1}</span><div><p className="text-xs font-semibold text-ink">{section.title || t('courseContent.untitledSection')}</p><p className="text-[10px] text-muted">{t('trainerCourses.lessonsCount', { count: sectionLessons.length })}</p></div></div>
                <div className="divide-y divide-line">
                  {sectionLessons.map((lesson) => <div key={lesson.id} className="flex items-center gap-2 px-4 py-2.5 text-xs"><span className="grid h-6 w-6 place-items-center rounded-lg bg-brand-soft text-brand">{lesson.type === 'quiz' ? <ListChecks size={12} /> : <FileText size={12} />}</span><span className="min-w-0 flex-1 truncate text-ink">{lesson.title || t('courseContent.untitledLesson')}</span>{lesson.preview ? <Badge tone="success">{t('courseContent.lessonFreePreview')}</Badge> : null}<span className="text-[10px] text-muted">{lesson.durationMin} min</span></div>)}
                </div>
              </div>
            )
          }) : <EmptyState icon={FileText} title={t('courseContent.noSections')} description={t('courseContent.noSectionsDesc')} compact />}
        </div>
      ) : null}

      {mode === 'lesson' ? (
        <div className="overflow-hidden rounded-xl border border-line bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface/60 px-4 py-2.5">
            <p className="text-xs font-semibold text-ink">{selectedLesson?.title || t('courseWizard.noLessonYet')}</p>
            {contentLessons.length ? <Select value={selectedLesson?.id || ''} onChange={(event) => setLessonId(event.target.value)} className="h-8 w-auto min-w-40 text-[11px]">{contentLessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.title || t('courseContent.untitledLesson')}</option>)}</Select> : null}
          </div>
          <div className="p-5">
            {selectedLesson ? <><p className="mb-4 text-xs leading-relaxed text-muted">{language === 'ar' ? selectedLesson.descriptionAr : selectedLesson.descriptionFr}</p><div className="space-y-4">{blocks.length ? blocks.map((block) => <LessonBlock key={block.id} block={block} />) : <EmptyState icon={FileText} title={t('courseContent.noBlocks')} description={t('courseContent.noBlocksDesc')} compact />}</div></> : <EmptyState icon={FileText} title={t('courseWizard.noLessonYet')} description={t('courseWizard.noLessonYetDesc')} compact />}
          </div>
        </div>
      ) : null}

      {mode === 'quiz' ? (
        <div className="rounded-xl border border-line bg-white">
          {quiz ? <div className="p-5"><div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="text-sm font-bold text-ink">{quiz.title}</h3><p className="text-[11px] text-muted">{t('courseContent.questionsCount', { count: quiz.questions.length })} · {t('courseContent.passing')} {quiz.passingScore}%</p></div><Badge tone="purple">{quiz.timeLimitMin ? t('learner.quizTimeLimit', { count: quiz.timeLimitMin }) : t('courseContent.timeLimitNone')}</Badge></div><p className="mt-2 text-xs text-muted">{language === 'ar' ? quiz.descriptionAr : quiz.descriptionFr}</p><div className="mt-4 space-y-3">{quiz.questions.map((question, index) => <div key={question.id} className="rounded-xl border border-line p-3"><p className="text-xs font-semibold text-ink">{index + 1}. {question.title}</p><div className="mt-2 grid gap-1.5">{question.choices.map((choice) => <div key={choice.id} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-[11px] text-muted"><span className="h-3 w-3 rounded-full border border-line" />{choice.text}</div>)}</div></div>)}</div></div> : <EmptyState icon={ListChecks} title={t('courseWizard.noQuizYet')} description={t('courseWizard.noQuizYetDesc')} compact />}
        </div>
      ) : null}
    </div>
  )
}

function PreviewList({ title, items }) {
  return <div><p className="text-xs font-semibold text-ink">{title}</p><ul className="mt-2 grid gap-1.5 text-xs text-muted">{items.map((item) => <li key={item} className="flex items-start gap-2"><Check size={13} className="mt-0.5 shrink-0 text-brand" />{item}</li>)}</ul></div>
}

export function LessonEditor({ lessonId, onClose, onDeleted }) {
  const { t } = useI18n()
  const { success, error: toastError } = useToast()
  const state = useTiwanzaStore()
  const lesson = lessonId ? getLesson(state, lessonId) : null
  const [title, setTitle] = useState('')
  const [durationMin, setDurationMin] = useState(10)
  const [descriptionFr, setDescriptionFr] = useState('')
  const [descriptionAr, setDescriptionAr] = useState('')
  const [preview, setPreview] = useState(false)
  const [quizDraft, setQuizDraft] = useState(null)

  useEffect(() => {
    if (!lesson) return
    setTitle(lesson.title)
    setDurationMin(lesson.durationMin || 10)
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
          <div className="rounded-xl border border-line border-brand bg-brand-soft">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-b border-line bg-surface/70 px-3 py-2">
              <span className="text-sm font-medium text-brand">{t('courseContent.lessonContent')}</span>
              <Select value="" onChange={(event) => { if (event.target.value) { addBlock(lesson.id, event.target.value); success(t('courseContent.itemSaved')) } }} className="h-9 w-auto min-w-[200px] py-1.5 text-[11px] text-brand">
                <option value="">{t('courseContent.addBlock')}</option>
                <option value="richtext">{t('courseContent.blockText')}</option>
                <option value="video">{t('courseContent.blockVideo')}</option>
                <option value="file">{t('courseContent.blockFile')}</option>
                <option value="pdf">{t('courseContent.blockPdf')}</option>
                <option value="image">{t('courseContent.blockImage')}</option>
                <option value="gdrive">{t('courseContent.blockGdrive')}</option>
              </Select>
            </div>
            {blocks.length ? (
              <div className="space-y-2 p-3">
                {blocks.map((block, blockIndex) => {
                  const Icon = BLOCK_ICONS[block.type] || FileText
                  return (
                    <div key={block.id} className="rounded-lg border border-line bg-white p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-ink"><Icon size={13} className="text-brand" /> {t(BLOCK_LABEL_KEYS[block.type] || 'courseContent.blockText')}</span>
                        <div className="flex gap-0.5">
                          <button type="button" disabled={blockIndex === 0} onClick={() => moveBlock(lesson.id, block.id, -1)} className="grid h-6 w-6 place-items-center rounded text-muted hover:bg-surface disabled:opacity-30"><ArrowUp size={12} /></button>
                          <button type="button" disabled={blockIndex === blocks.length - 1} onClick={() => moveBlock(lesson.id, block.id, 1)} className="grid h-6 w-6 place-items-center rounded text-muted hover:bg-surface disabled:opacity-30"><ArrowDown size={12} /></button>
                          <button type="button" onClick={() => deleteBlock(block.id)} className="grid h-6 w-6 place-items-center rounded text-muted hover:bg-danger-soft hover:text-danger"><X size={12} /></button>
                        </div>
                      </div>
                      <BlockFields block={block} onChange={(data) => { const result = updateBlock(block.id, data); if (result && !result.ok) toastError(t(`errors.${result.error}`)) }} />
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
                {[t('courseWizard.true'), t('courseWizard.false')].map((label, index) => (
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
