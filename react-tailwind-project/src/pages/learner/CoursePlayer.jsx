import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
  Lock,
  MessageSquare,
  Send,
  Trash2,
  Trophy,
  XCircle,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useI18n } from '../../i18n/I18nContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { useTiwanzaStore } from '../../data/store.js'
import {
  getBestAttempt,
  getBlocks,
  getCourse,
  getCourseLessons,
  getCourseProgress,
  getEnrollment,
  getLastAccessedLesson,
  getLesson,
  getLessonComments,
  getLessonLockState,
  getNextLesson,
  getQuiz,
  getQuizAttemptCount,
  getQuizByLesson,
  getSections,
} from '../../data/selectors.js'
import { addComment, completeLesson, deleteComment, submitQuiz } from '../../data/services.js'
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Modal,
  ProgressBar,
  Textarea,
} from '../../components/ui.jsx'
import { LessonBlock } from '../../components/LessonContent.jsx'
import { cn } from '../../lib/utils.js'

export default function CoursePlayer() {
  const { courseId, lessonId } = useParams()
  const { user } = useAuth()
  const state = useTiwanzaStore()
  const { t, language, number, date } = useI18n()
  const { success, error: toastError } = useToast()
  const navigate = useNavigate()
  const [commentText, setCommentText] = useState('')
  const [quizOpen, setQuizOpen] = useState(false)
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [secondsLeft, setSecondsLeft] = useState(null)

  const course = getCourse(state, courseId)
  const enrollment = course ? getEnrollment(state, course.id, user.id) : null
  const lessons = course ? getCourseLessons(state, course.id) : []
  const sections = course ? getSections(state, course.id) : []
  const storedLesson = lessonId ? getLesson(state, lessonId) : null
  const activeLesson = storedLesson && storedLesson.courseId === course?.id ? storedLesson : getLastAccessedLesson(state, user.id, course) || getNextLesson(state, user.id, course) || lessons[0]
  const progress = course ? getCourseProgress(state, user.id, course.id) : { total: 0, completed: 0, percentage: 0 }
  const activeIndex = activeLesson ? lessons.findIndex((lesson) => lesson.id === activeLesson.id) : -1
  const prevLesson = activeIndex > 0 ? lessons[activeIndex - 1] : null
  const nextLesson = activeIndex >= 0 && activeIndex < lessons.length - 1 ? lessons[activeIndex + 1] : null
  const lock = activeLesson && course ? getLessonLockState(state, user.id, course, activeLesson) : { locked: false }
  const blocks = activeLesson && activeLesson.type !== 'quiz' ? getBlocks(state, activeLesson.id) : []
  const quiz = activeLesson?.type === 'quiz' ? getQuiz(state, activeLesson.quizId) || getQuizByLesson(state, activeLesson.id) : null
  const bestAttempt = quiz ? getBestAttempt(state, user.id, quiz.id) : null
  const attemptsUsed = quiz ? getQuizAttemptCount(state, user.id, quiz.id) : 0
  const attemptsLeft = quiz?.maxAttempts ? Math.max(0, quiz.maxAttempts - attemptsUsed) : null
  const quizAvailable = !quiz?.maxAttempts || attemptsUsed < quiz.maxAttempts
  const comments = activeLesson ? getLessonComments(state, activeLesson.id).filter((comment) => comment.status === 'visible') : []

  useEffect(() => {
    if (!quizOpen || result || secondsLeft === null) return undefined
    if (secondsLeft <= 0) {
      sendQuiz(true)
      return undefined
    }
    const timer = setTimeout(() => setSecondsLeft((value) => (value === null ? null : value - 1)), 1000)
    return () => clearTimeout(timer)
  }, [quizOpen, result, secondsLeft])

  if (!course) return <EmptyState icon={BookOpen} title={t('learner.courseNotFound')} action={<Button onClick={() => navigate('/learn/courses')}>{t('learner.backToMyCourses')}</Button>} />
  if (!enrollment || enrollment.status !== 'active') return <EmptyState icon={Lock} title={t('learner.accessDenied')} description={t('checkout.alreadyEnrolled')} action={<Link to="/learn/courses"><Button>{t('learner.backToMyCourses')}</Button></Link>} />

  function openLesson(lesson) {
    navigate(`/learn/courses/${course.id}/lessons/${lesson.id}`)
  }

  function markComplete() {
    if (!activeLesson) return
    const result = completeLesson(user.id, course.id, activeLesson.id)
    if (!result.ok) return toastError(t('errors.generic'))
    success(t('learner.completedLabel'))
    if (nextLesson) openLesson(nextLesson)
  }

  function postComment() {
    if (!commentText.trim()) return toastError(t('errors.required'))
    const result = addComment({ lessonId: activeLesson.id, userId: user.id, content: commentText.trim() })
    if (!result.ok) return toastError(t('errors.generic'))
    success(t('learner.commentPosted'))
    setCommentText('')
  }

  function removeComment(comment) {
    deleteComment(comment.id)
    success(t('learner.commentDeleted'))
  }

  function toggleAnswer(question, choiceId) {
    setAnswers((current) => {
      if (question.type === 'multiple') {
        const values = Array.isArray(current[question.id]) ? current[question.id] : []
        return { ...current, [question.id]: values.includes(choiceId) ? values.filter((id) => id !== choiceId) : [...values, choiceId] }
      }
      return { ...current, [question.id]: choiceId }
    })
  }

  function startQuiz() {
    if (!quizAvailable) return toastError(t('learner.noAttemptsLeft'))
    setResult(null)
    setAnswers({})
    setSecondsLeft(quiz?.timeLimitMin ? quiz.timeLimitMin * 60 : null)
    setQuizOpen(true)
  }

  function sendQuiz(force = false) {
    if (!quiz) return
    const missing = quiz.questions.some((question) => {
      const value = answers[question.id]
      return value === undefined || (Array.isArray(value) && !value.length)
    })
    if (missing && !force) return toastError(t('learner.selectAnswer'))
    setSecondsLeft(null)
    const response = submitQuiz(user.id, course.id, quiz.id, answers)
    if (!response.ok) return toastError(response.error === 'attempts-exhausted' ? t('learner.noAttemptsLeft') : t('errors.generic'))
    setResult(response)
  }

  function closeQuiz() {
    setQuizOpen(false)
    setResult(null)
    setAnswers({})
    setSecondsLeft(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => navigate('/learn/courses')}>{t('learner.backToMyCourses')}</Button>
          <span className="hidden text-xs text-muted sm:inline">/</span>
          <Link to={`/learn/courses/${course.id}`} className="hidden max-w-[240px] truncate text-xs font-semibold text-ink sm:inline">{course.title}</Link>
        </div>
        <div className="flex items-center gap-3"><span className="text-[11px] text-muted">{t('learner.lessonsCompleted', { completed: progress.completed, total: progress.total })}</span><div className="w-28"><ProgressBar value={progress.percentage} size="sm" /></div><Badge tone="brand">{progress.percentage}%</Badge></div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[300px_1fr]">
        <Card className="order-2 self-start xl:order-1">
          <button type="button" onClick={() => setSidebarOpen((value) => !value)} className="flex w-full items-center justify-between border-b border-line p-3 text-start xl:cursor-default">
            <span><span className="block text-xs font-semibold text-ink">{t('learner.courseContent')}</span><span className="text-[10px] text-muted">{t('learner.courseProgress')} · {progress.percentage}%</span></span>
            <ChevronDown size={15} className={cn('text-muted transition xl:hidden', sidebarOpen && 'rotate-180')} />
          </button>
          <div className={cn('thin-scroll max-h-[calc(100vh-190px)] overflow-y-auto p-2 xl:block', !sidebarOpen && 'hidden')}>
            {sections.map((section) => {
              const sectionLessons = lessons.filter((lesson) => lesson.sectionId === section.id)
              return (
                <div key={section.id} className="mb-2">
                  <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">{section.title}</p>
                  <div className="space-y-0.5">
                    {sectionLessons.map((lesson) => {
                      const done = progress.completedLessonIds.includes(lesson.id)
                      const lessonLock = getLessonLockState(state, user.id, course, lesson)
                      const active = lesson.id === activeLesson?.id
                      return (
                        <button key={lesson.id} type="button" disabled={lessonLock.locked} onClick={() => openLesson(lesson)} className={cn('flex w-full items-start gap-2 rounded-lg px-2 py-2 text-start text-[11px] transition', active ? 'bg-brand-soft text-brand-dark' : 'text-muted hover:bg-surface hover:text-ink', lessonLock.locked && 'cursor-not-allowed opacity-50')}>
                          <span className={cn('mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border text-[8px]', done ? 'border-success bg-success text-white' : active ? 'border-brand bg-white text-brand' : 'border-line bg-white')}>{done ? <Check size={9} /> : lessonLock.locked ? <Lock size={8} /> : null}</span>
                          <span className="min-w-0 flex-1"><span className={cn('line-clamp-2', active && 'font-semibold')}>{lesson.title}</span><span className="mt-0.5 block text-[9px] text-muted">{lesson.type === 'quiz' ? t('learner.quizTitle') : `${lesson.durationMin || 0} min`}</span></span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <div className="order-1 min-w-0 space-y-4 xl:order-2">
          {lock.locked ? (
            <Card><EmptyState icon={Lock} title={t('learner.lockedTitle')} description={lock.prerequisite ? `${t('learner.lockedDesc')} (${lock.prerequisite.title})` : t('learner.lockedDesc')} action={lock.prerequisite ? <Button variant="soft" onClick={() => openLesson(lock.prerequisite)}>{t('learner.goToPrevious')}</Button> : null} /></Card>
          ) : activeLesson ? (
            <>
              <Card>
                <div className="border-b border-line p-5">
                  <div className="flex flex-wrap items-center gap-2"><Badge tone={activeLesson.type === 'quiz' ? 'purple' : 'brand'}>{activeLesson.type === 'quiz' ? t('learner.quizTitle') : t('learner.lessonContent')}</Badge>{activeLesson.durationMin ? <span className="text-[10px] text-muted">{activeLesson.durationMin} min</span> : null}{progress.completedLessonIds.includes(activeLesson.id) ? <Badge tone="success" dot>{t('learner.completedLabel')}</Badge> : null}</div>
                  <h1 className="mt-2 text-xl font-bold text-ink">{activeLesson.title}</h1>
                </div>

                <div className="space-y-5 p-5">
                  {activeLesson.type === 'quiz' && quiz ? (
                    <div className="rounded-2xl border border-line bg-surface p-6 text-center">
                      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand"><Trophy size={26} /></span>
                      <h2 className="mt-3 text-base font-bold text-ink">{quiz.title}</h2>
                      <p className="mt-1 text-xs text-muted">{(language === 'ar' ? quiz.descriptionAr : quiz.descriptionFr) || t('learner.quizIntro')}</p>
                      <div className="mt-4 flex flex-wrap justify-center gap-2"><Badge tone="neutral">{t('learner.quizQuestions', { count: quiz.questions.length })}</Badge><Badge tone="neutral">{t('learner.quizPassScore', { score: quiz.passingScore })}</Badge>{quiz.timeLimitMin ? <Badge tone="neutral">{t('learner.quizTimeLimit', { count: quiz.timeLimitMin })}</Badge> : null}{quiz.maxAttempts ? <Badge tone={attemptsLeft ? 'neutral' : 'warning'}>{t('learner.quizAttemptsLeft', { count: attemptsLeft })}</Badge> : <Badge tone="neutral">{t('learner.quizAttemptsUnlimited')}</Badge>}{bestAttempt ? <Badge tone={bestAttempt.passed ? 'success' : 'warning'}>{bestAttempt.percentage}%</Badge> : null}</div>
                      <Button className="mt-5" onClick={startQuiz} disabled={!quizAvailable}>{bestAttempt ? t('learner.retryQuiz') : t('learner.startQuiz')}</Button>
                      {!quizAvailable ? <p className="mt-2 text-[10px] text-danger">{t('learner.noAttemptsLeft')}</p> : null}
                    </div>
                  ) : blocks.length ? blocks.map((block) => <LessonBlock key={block.id} block={block} />) : <EmptyState icon={FileText} title={t('learner.noContent')} compact />}

                  {activeLesson.type !== 'quiz' ? (
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
                      <Button variant={progress.completedLessonIds.includes(activeLesson.id) ? 'success' : 'soft'} icon={CheckCircle2} onClick={markComplete} disabled={progress.completedLessonIds.includes(activeLesson.id)}>{t('learner.markComplete')}</Button>
                      <div className="flex gap-2">{prevLesson ? <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => openLesson(prevLesson)}>{t('learner.previousLesson')}</Button> : null}{nextLesson ? <Button variant="secondary" size="sm" iconRight={ArrowRight} onClick={() => openLesson(nextLesson)}>{t('learner.nextLesson')}</Button> : null}</div>
                    </div>
                  ) : null}
                </div>
              </Card>

              {comments.length || course.commentsEnabled ? (
                <Card>
                  <div className="flex items-center gap-2 border-b border-line p-4"><MessageSquare size={16} className="text-brand" /><div className="flex-1"><p className="text-sm font-semibold text-ink">{t('learner.comments')}</p><p className="text-[10px] text-muted">{t('learner.commentsDesc')}</p></div><Badge tone="neutral">{comments.length}</Badge></div>
                  {course.commentsEnabled ? <div className="border-b border-line p-4"><div className="flex gap-2"><Avatar name={user.name} size="sm" /><div className="flex-1"><Textarea rows={2} value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder={t('learner.commentPlaceholder')} /><div className="mt-2 flex justify-end"><Button size="sm" icon={Send} onClick={postComment}>{t('learner.postComment')}</Button></div></div></div></div> : null}
                  {comments.length ? <div className="divide-y divide-line">{comments.map((comment) => { const author = state.users.find((item) => item.id === comment.userId); const isTrainer = author?.role === 'trainer'; return <div key={comment.id} className="flex gap-2.5 p-4"><Avatar name={author?.name} size="sm" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-semibold text-ink">{author?.name}</p>{isTrainer ? <Badge tone="brand">{t('learner.trainerReply')}</Badge> : null}<span className="text-[9px] text-muted">{date(comment.createdAt)}</span></div><p className="mt-1 text-xs leading-relaxed text-muted">{comment.content}</p>{comment.userId === user.id ? <button type="button" onClick={() => removeComment(comment)} className="mt-1 inline-flex items-center gap-1 text-[10px] text-danger hover:underline"><Trash2 size={10} />{t('learner.deleteComment')}</button> : null}</div></div> })}</div> : <EmptyState icon={MessageSquare} title={t('learner.noComments')} description={t('learner.noCommentsDesc')} compact />}
                </Card>
              ) : null}
            </>
          ) : <EmptyState icon={BookOpen} title={t('learner.lessonNotFound')} />}
        </div>
      </div>

      <Modal open={quizOpen} onClose={closeQuiz} title={quiz?.title || t('learner.quizTitle')} size="lg" footer={result ? <Button onClick={closeQuiz}>{t('common.close')}</Button> : <><Button variant="secondary" onClick={closeQuiz}>{t('common.cancel')}</Button><Button onClick={sendQuiz}>{t('learner.submitQuiz')}</Button></>}>
        {!quiz ? null : result ? (
          <div className="space-y-4">
            <div className={cn('rounded-2xl p-5 text-center', result.passed ? 'bg-success-soft' : 'bg-danger-soft')}>
              <span className={cn('mx-auto grid h-12 w-12 place-items-center rounded-full bg-white', result.passed ? 'text-success' : 'text-danger')}>{result.passed ? <Trophy size={24} /> : <XCircle size={24} />}</span>
              <p className={cn('mt-2 text-base font-bold', result.passed ? 'text-success' : 'text-danger')}>{result.passed ? t('learner.quizPassedTitle') : t('learner.quizFailedTitle')}</p>
              <p className="mt-1 text-xs text-muted">{t('learner.scoreOf', { score: result.score, total: result.total })} · {result.percentage}%</p>
              <p className="text-[10px] text-muted">{t('learner.passThreshold', { score: result.passingScore })}</p>
            </div>
            <div className="space-y-2">{quiz.questions.map((question, index) => { const detail = result.details.find((item) => item.questionId === question.id); const correctChoices = question.choices.filter((choice) => choice.correct); return <div key={question.id} className={cn('rounded-xl border p-3', detail?.correct ? 'border-success/30 bg-success-soft/30' : 'border-danger/30 bg-danger-soft/30')}><p className="text-xs font-semibold text-ink">{index + 1}. {question.title}</p><p className="mt-1 text-[11px] text-muted">{t('learner.correctAnswer')} : {correctChoices.map((choice) => choice.text).join(', ')}</p>{question.explanation ? <p className="mt-1 text-[10px] text-muted">{question.explanation}</p> : null}</div> })}</div>
          </div>
        ) : (
          <div className="space-y-5"><div className="flex flex-wrap items-center gap-2"><Badge tone="neutral">{t('learner.quizQuestions', { count: quiz.questions.length })}</Badge><Badge tone="neutral">{t('learner.quizPassScore', { score: quiz.passingScore })}</Badge>{quiz.maxAttempts ? <span className="text-[10px] text-muted">{t('learner.quizAttemptsLeft', { count: attemptsLeft })}</span> : <span className="text-[10px] text-muted">{t('learner.quizAttemptsUnlimited')}</span>}{secondsLeft !== null ? <Badge tone={secondsLeft <= 60 ? 'warning' : 'neutral'}>{String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:{String(secondsLeft % 60).padStart(2, '0')}</Badge> : null}</div>{quiz.questions.map((question, index) => <div key={question.id} className="rounded-xl border border-line p-4"><p className="text-sm font-semibold text-ink">{index + 1}. {question.title}</p><p className="mt-0.5 text-[10px] text-muted">{question.type === 'multiple' ? t('learner.selectAnswers') : t('learner.selectAnswer')} · {question.points} pts</p><div className="mt-3 space-y-2">{question.choices.map((choice) => { const selected = question.type === 'multiple' ? (answers[question.id] || []).includes(choice.id) : answers[question.id] === choice.id; return <button key={choice.id} type="button" onClick={() => toggleAnswer(question, choice.id)} className={cn('flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-start text-xs transition', selected ? 'border-brand bg-brand-soft text-brand-dark' : 'border-line text-muted hover:border-brand/40 hover:text-ink')}><span className={cn('grid h-4 w-4 shrink-0 place-items-center border', question.type === 'multiple' ? 'rounded' : 'rounded-full', selected ? 'border-brand bg-brand text-white' : 'border-line')}>{selected ? <Check size={10} /> : null}</span>{choice.text}</button> })}</div></div>)}</div>
        )}
      </Modal>
    </div>
  )
}

