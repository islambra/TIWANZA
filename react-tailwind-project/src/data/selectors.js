import { normalizeSearch, percent } from '../lib/utils.js'

export function isUnlimited(value) {
  return value === -1 || value === null || value === undefined
}

export function getPlan(state, planId) {
  return state.plans.find((plan) => plan.id === planId) || null
}

export function getPlans(state, includeDisabled = false) {
  return state.plans
    .filter((plan) => includeDisabled || plan.enabled)
    .slice()
    .sort((a, b) => a.order - b.order)
}

export function getSchool(state, schoolId) {
  return state.schools.find((school) => school.id === schoolId) || null
}

export function getSchoolBySlug(state, slug) {
  return state.schools.find((school) => school.slug === slug) || null
}

export function getTrainerProfile(state, userId) {
  return state.trainerProfiles.find((profile) => profile.userId === userId) || null
}

export function getTrainerBySchool(state, schoolId) {
  const profile = state.trainerProfiles.find((item) => item.schoolId === schoolId)
  if (!profile) return null
  return state.users.find((user) => user.id === profile.userId) || null
}

export function getSubscription(state, subscriptionId) {
  return state.subscriptions.find((subscription) => subscription.id === subscriptionId) || null
}

export function getTrainerSubscription(state, userId) {
  const profile = getTrainerProfile(state, userId)
  if (!profile) return null
  return getSubscription(state, profile.subscriptionId)
}

export function isSubscriptionActive(subscription) {
  if (!subscription) return false
  if (subscription.status !== 'active') return false
  if (!subscription.endsAt) return true
  return new Date(subscription.endsAt).getTime() > Date.now()
}

export function hasActiveSubscription(state, userId) {
  return isSubscriptionActive(getTrainerSubscription(state, userId))
}

export function getCourse(state, courseId) {
  return state.courses.find((course) => course.id === courseId) || null
}

export function getSchoolCourses(state, schoolId, options = {}) {
  const { includeDeleted = false, includeUnpublished = true } = options
  return state.courses
    .filter((course) => course.schoolId === schoolId)
    .filter((course) => includeDeleted || !course.deletedAt)
    .filter((course) => includeUnpublished || course.status === 'published')
    .slice()
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
}

export function getPublishedCourses(state, schoolId) {
  return getSchoolCourses(state, schoolId, { includeUnpublished: false })
}

export function getSections(state, courseId, includeDeleted = false) {
  return state.sections
    .filter((section) => section.courseId === courseId)
    .filter((section) => includeDeleted || !section.deletedAt)
    .slice()
    .sort((a, b) => a.order - b.order)
}

export function getLessonsBySection(state, sectionId, includeDeleted = false) {
  return state.lessons
    .filter((lesson) => lesson.sectionId === sectionId)
    .filter((lesson) => includeDeleted || !lesson.deletedAt)
    .slice()
    .sort((a, b) => a.order - b.order)
}

export function getCourseLessons(state, courseId, includeDeleted = false) {
  const sections = getSections(state, courseId, includeDeleted)
  const sectionOrder = new Map(sections.map((section, index) => [section.id, index]))
  return state.lessons
    .filter((lesson) => lesson.courseId === courseId)
    .filter((lesson) => includeDeleted || !lesson.deletedAt)
    .slice()
    .sort((a, b) => {
      const sectionDiff = (sectionOrder.get(a.sectionId) ?? 0) - (sectionOrder.get(b.sectionId) ?? 0)
      return sectionDiff !== 0 ? sectionDiff : a.order - b.order
    })
}

export function getLesson(state, lessonId) {
  return state.lessons.find((lesson) => lesson.id === lessonId) || null
}

export function getBlocks(state, lessonId) {
  return state.blocks
    .filter((block) => block.lessonId === lessonId)
    .slice()
    .sort((a, b) => a.order - b.order)
}

export function getQuiz(state, quizId) {
  return state.quizzes.find((quiz) => quiz.id === quizId) || null
}

export function getQuizByLesson(state, lessonId) {
  return state.quizzes.find((quiz) => quiz.lessonId === lessonId) || null
}

export function getEnrollment(state, courseId, learnerId) {
  return state.enrollments.find((enrollment) => enrollment.courseId === courseId && enrollment.learnerId === learnerId) || null
}

export function getCourseEnrollments(state, courseId, status = 'active') {
  return state.enrollments.filter((enrollment) => enrollment.courseId === courseId && (!status || enrollment.status === status))
}

export function getLearnerEnrollments(state, learnerId, options = {}) {
  const { includeInactive = true } = options
  return state.enrollments
    .filter((enrollment) => enrollment.learnerId === learnerId)
    .filter((enrollment) => includeInactive || enrollment.status === 'active')
    .slice()
    .sort((a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt))
}

export function getSchoolEnrollments(state, schoolId) {
  return state.enrollments.filter((enrollment) => enrollment.schoolId === schoolId)
}

export function getCoursePaymentForEnrollment(state, enrollmentId) {
  return (
    state.coursePayments
      .filter((payment) => payment.enrollmentId === enrollmentId)
      .slice()
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))[0] || null
  )
}

export function getCoursePayment(state, paymentId) {
  return state.coursePayments.find((payment) => payment.id === paymentId) || null
}

export function getLessonProgress(state, learnerId, lessonId) {
  return state.lessonProgress.find((entry) => entry.learnerId === learnerId && entry.lessonId === lessonId) || null
}

export function getBestAttempt(state, learnerId, quizId) {
  return (
    state.quizAttempts
      .filter((attempt) => attempt.learnerId === learnerId && attempt.quizId === quizId)
      .slice()
      .sort((a, b) => b.percentage - a.percentage)[0] || null
  )
}

export function isLessonCompleted(state, learnerId, courseId, lesson) {
  if (!lesson) return false
  if (lesson.type === 'quiz') {
    const quiz = getQuiz(state, lesson.quizId)
    if (!quiz) return false
    const best = getBestAttempt(state, learnerId, quiz.id)
    if (best?.passed) return true
    const progress = getLessonProgress(state, learnerId, lesson.id)
    return Boolean(progress?.completed)
  }
  const progress = getLessonProgress(state, learnerId, lesson.id)
  return Boolean(progress?.completed)
}

export function getCourseProgress(state, learnerId, courseId) {
  const lessons = getCourseLessons(state, courseId)
  const completedLessons = lessons.filter((lesson) => isLessonCompleted(state, learnerId, courseId, lesson))
  return {
    total: lessons.length,
    completed: completedLessons.length,
    percentage: percent(completedLessons.length, lessons.length),
    completedLessonIds: completedLessons.map((lesson) => lesson.id),
  }
}

export function getLessonLockState(state, learnerId, course, lesson) {
  if (!course || !lesson) return { locked: false }
  if (isLessonCompleted(state, learnerId, course.id, lesson)) return { locked: false }
  if (!course.sequential) return { locked: false }
  const lessons = getCourseLessons(state, course.id)
  const index = lessons.findIndex((item) => item.id === lesson.id)
  if (index <= 0) return { locked: false }
  const previous = lessons[index - 1]
  if (isLessonCompleted(state, learnerId, course.id, previous)) return { locked: false }
  return { locked: true, prerequisite: previous }
}

export function getLearnerActiveEnrollments(state, learnerId) {
  return state.enrollments
    .filter((enrollment) => enrollment.learnerId === learnerId && enrollment.status === 'active')
    .slice()
    .sort((a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt))
}

export function getLearnerCourses(state, learnerId) {
  return getLearnerActiveEnrollments(state, learnerId)
    .map((enrollment) => {
      const course = getCourse(state, enrollment.courseId)
      if (!course) return null
      return { enrollment, course, progress: getCourseProgress(state, learnerId, course.id) }
    })
    .filter(Boolean)
}

export function getLearnerSchoolIds(state, learnerId) {
  const learner = state.users.find((user) => user.id === learnerId)
  const ids = new Set()
  if (learner?.schoolId) ids.add(learner.schoolId)
  state.enrollments
    .filter((enrollment) => enrollment.learnerId === learnerId && enrollment.status === 'active')
    .forEach((enrollment) => ids.add(enrollment.schoolId))
  return [...ids]
}

export function getLearnerEnrolledCourseIds(state, learnerId) {
  return getLearnerActiveEnrollments(state, learnerId).map((enrollment) => enrollment.courseId)
}

export function getAnnouncementsForLearner(state, learnerId) {
  const schoolIds = new Set(getLearnerSchoolIds(state, learnerId))
  const courseIds = new Set(getLearnerEnrolledCourseIds(state, learnerId))
  return state.announcements
    .filter((announcement) => announcement.status === 'published')
    .filter((announcement) => schoolIds.has(announcement.schoolId))
    .filter((announcement) => announcement.audience === 'all' || courseIds.has(announcement.courseId))
    .slice()
    .sort((a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt))
}

export function getLearnerEvents(state, learnerId) {
  const schoolIds = new Set(getLearnerSchoolIds(state, learnerId))
  const courseIds = new Set(getLearnerEnrolledCourseIds(state, learnerId))
  return state.events
    .filter((event) => schoolIds.has(event.schoolId))
    .filter((event) => !event.courseId || courseIds.has(event.courseId))
    .slice()
    .sort((a, b) => new Date(a.startAt) - new Date(b.startAt))
}

export function getSchoolEvents(state, schoolId) {
  return state.events
    .filter((event) => event.schoolId === schoolId)
    .slice()
    .sort((a, b) => new Date(a.startAt) - new Date(b.startAt))
}

export function getLessonComments(state, lessonId) {
  return state.comments
    .filter((comment) => comment.lessonId === lessonId)
    .slice()
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
}

export function getCourseComments(state, courseId) {
  return state.comments
    .filter((comment) => comment.courseId === courseId)
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export function getSchoolComments(state, schoolId) {
  return state.comments
    .filter((comment) => comment.schoolId === schoolId)
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export function getSchoolAnnouncements(state, schoolId) {
  return state.announcements
    .filter((announcement) => announcement.schoolId === schoolId)
    .slice()
    .sort((a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt))
}

export function getPlanUsage(state, schoolId) {
  const school = getSchool(state, schoolId)
  const trainer = school ? getTrainerProfile(state, school.trainerId) : null
  const plan = trainer ? getPlan(state, trainer.planId) : null
  const courses = getSchoolCourses(state, schoolId)
  const published = courses.filter((course) => course.status === 'published')
  const paidPublished = published.filter((course) => !course.isFree)
  const enrollments = getSchoolEnrollments(state, schoolId).filter((enrollment) => enrollment.status === 'active')
  const learners = new Set(enrollments.map((enrollment) => enrollment.learnerId))
  const videoMb = courses.reduce((total, course) => {
    const lessons = getCourseLessons(state, course.id)
    return (
      total +
      lessons.reduce(
        (sum, lesson) =>
          sum +
          getBlocks(state, lesson.id)
            .filter((block) => block.type === 'video')
            .reduce((mb, block) => mb + (Number(block.data?.sizeMb) || 0), 0),
        0,
      )
    )
  }, 0)
  const limits = plan?.limits || { publishedCourses: 0, paidCourses: 0, learners: 0, storageGb: 0 }
  return {
    plan,
    trainer,
    limits,
    courses: courses.length,
    published: published.length,
    paidPublished: paidPublished.length,
    learners: learners.size,
    storageUsedGb: Number((videoMb / 1024).toFixed(2)),
    storageUsedMb: Math.round(videoMb),
    canCreateCourse: isUnlimited(limits.publishedCourses) || courses.length < limits.publishedCourses,
    canPublishCourse: isUnlimited(limits.publishedCourses) || published.length < limits.publishedCourses,
    canPublishPaidCourse: isUnlimited(limits.paidCourses) || paidPublished.length < limits.paidCourses,
    canAddLearner: isUnlimited(limits.learners) || learners.size < limits.learners,
    hasStorage: isUnlimited(limits.storageGb) || videoMb / 1024 < limits.storageGb,
  }
}

export function getTrainerStats(state, schoolId) {
  const usage = getPlanUsage(state, schoolId)
  const enrollments = getSchoolEnrollments(state, schoolId)
  const activeEnrollments = enrollments.filter((enrollment) => enrollment.status === 'active')
  const courses = getSchoolCourses(state, schoolId)
  const courseProgress = activeEnrollments.map((enrollment) => getCourseProgress(state, enrollment.learnerId, enrollment.courseId).percentage)
  const averageCompletion = courseProgress.length
    ? Math.round(courseProgress.reduce((total, value) => total + value, 0) / courseProgress.length)
    : 0
  const payments = state.coursePayments.filter((payment) => payment.schoolId === schoolId)
  const validatedPayments = payments.filter((payment) => payment.status === 'validated')
  const revenue = validatedPayments.reduce((total, payment) => total + payment.amount, 0)
  const pendingPayments = payments.filter((payment) => payment.status === 'pending')
  const comments = getSchoolComments(state, schoolId).filter((comment) => comment.status !== 'deleted')
  const events = getSchoolEvents(state, schoolId)
  const upcomingEvents = events.filter((event) => new Date(event.startAt) > new Date() && event.status === 'scheduled')
  const recentEnrollments = enrollments
    .slice()
    .sort((a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt))
    .slice(0, 5)
  return {
    usage,
    totalLearners: usage.learners,
    averageCompletion,
    revenue,
    pendingPayments,
    recentComments: comments.slice(0, 5),
    upcomingEvents: upcomingEvents.slice(0, 4),
    recentEnrollments,
    courses,
    activeEnrollments,
    weeklyEnrollments: enrollments.filter((enrollment) => new Date(enrollment.enrolledAt).getTime() > Date.now() - 7 * 86400000).length,
    monthlyEnrollments: enrollments.filter((enrollment) => new Date(enrollment.enrolledAt).getTime() > Date.now() - 30 * 86400000).length,
  }
}

export function getPlatformStats(state) {
  const trainers = state.users.filter((user) => user.role === 'trainer')
  const activeSubscriptions = state.subscriptions.filter((subscription) => isSubscriptionActive(subscription))
  const pendingSubscriptions = state.subscriptionPayments.filter((payment) => payment.status === 'pending')
  const validatedRevenue = state.subscriptionPayments
    .filter((payment) => payment.status === 'validated')
    .reduce((total, payment) => total + payment.amount, 0)
  return {
    trainers: trainers.length,
    activeSubscriptions: activeSubscriptions.length,
    pendingSubscriptions: pendingSubscriptions.length,
    schools: state.schools.length,
    learners: state.users.filter((user) => user.role === 'learner').length,
    courses: state.courses.filter((course) => !course.deletedAt && course.status === 'published').length,
    revenue: validatedRevenue,
  }
}

export function getLearnersForSchool(state, schoolId) {
  const rows = new Map()
  getSchoolEnrollments(state, schoolId).forEach((enrollment) => {
    const learner = state.users.find((user) => user.id === enrollment.learnerId)
    if (!learner) return
    const existing = rows.get(learner.id) || {
      learner,
      enrollments: [],
      progressValues: [],
    }
    existing.enrollments.push(enrollment)
    existing.progressValues.push(getCourseProgress(state, learner.id, enrollment.courseId).percentage)
    rows.set(learner.id, existing)
  })
  return [...rows.values()]
    .map((row) => ({
      learner: row.learner,
      enrollments: row.enrollments,
      courseCount: row.enrollments.filter((enrollment) => enrollment.status === 'active').length,
      averageProgress: row.progressValues.length
        ? Math.round(row.progressValues.reduce((total, value) => total + value, 0) / row.progressValues.length)
        : 0,
    }))
    .sort((a, b) => a.learner.name.localeCompare(b.learner.name))
}

export function searchLearners(rows, query) {
  const value = normalizeSearch(query)
  if (!value) return rows
  return rows.filter(
    (row) => normalizeSearch(row.learner.name).includes(value) || normalizeSearch(row.learner.email).includes(value),
  )
}

export function getSalesRows(state, schoolId) {
  return state.coursePayments
    .filter((payment) => payment.schoolId === schoolId)
    .map((payment) => ({
      payment,
      course: getCourse(state, payment.courseId),
      learner: state.users.find((user) => user.id === payment.learnerId),
    }))
    .sort((a, b) => new Date(b.payment.submittedAt) - new Date(a.payment.submittedAt))
}

export function getQuizResults(state, schoolId) {
  return state.quizAttempts
    .map((attempt) => {
      const quiz = getQuiz(state, attempt.quizId)
      const course = getCourse(state, attempt.courseId)
      const learner = state.users.find((user) => user.id === attempt.learnerId)
      if (!quiz || !course || course.schoolId !== schoolId) return null
      const attemptCount = state.quizAttempts.filter(
        (item) => item.learnerId === attempt.learnerId && item.quizId === attempt.quizId,
      ).length
      return { attempt, quiz, course, learner, attemptCount }
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.attempt.completedAt) - new Date(a.attempt.completedAt))
}

export function getSupportRequests(state) {
  return state.supportRequests.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export function getSubscriptionPayments(state, filters = {}) {
  return state.subscriptionPayments
    .filter((payment) => !filters.status || filters.status === 'all' || payment.status === filters.status)
    .filter((payment) => !filters.planId || payment.planId === filters.planId)
    .map((payment) => {
      const trainer = state.users.find((user) => user.id === payment.trainerId)
      const profile = trainer ? getTrainerProfile(state, trainer.id) : null
      const school = profile?.schoolId ? getSchool(state, profile.schoolId) : null
      const plan = getPlan(state, payment.planId)
      return { payment, trainer, school, plan }
    })
    .sort((a, b) => new Date(b.payment.submittedAt) - new Date(a.payment.submittedAt))
}

export function getTrainersOverview(state) {
  return state.users
    .filter((user) => user.role === 'trainer')
    .map((user) => {
      const profile = getTrainerProfile(state, user.id)
      const school = profile?.schoolId ? getSchool(state, profile.schoolId) : null
      const subscription = getTrainerSubscription(state, user.id)
      const plan = subscription ? getPlan(state, subscription.planId) : profile?.planId ? getPlan(state, profile.planId) : null
      const usage = school ? getPlanUsage(state, school.id) : null
      return { user, profile, school, subscription, plan, usage }
    })
    .sort((a, b) => a.user.name.localeCompare(b.user.name))
}

export function getTrainerActivity(state, schoolId, limit = 8) {
  return state.activity
    .filter((entry) => entry.schoolId === schoolId)
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit)
}

export function getAdminActivity(state, limit = 10) {
  return state.activity
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit)
}

export function getActivePaymentMethods(school) {
  if (!school) return []
  const methods = []
  if (school.paymentSettings?.chargerly?.status === 'connected') methods.push('online')
  if (school.paymentSettings?.manual?.enabled) methods.push('manual')
  return methods
}

export function getCourseByPayment(state, paymentId) {
  const payment = getCoursePayment(state, paymentId)
  return payment ? getCourse(state, payment.courseId) : null
}

export function getLearnerPaymentRows(state, learnerId) {
  return state.coursePayments
    .filter((payment) => payment.learnerId === learnerId)
    .map((payment) => ({
      payment,
      course: getCourse(state, payment.courseId),
      school: getSchool(state, payment.schoolId),
    }))
    .sort((a, b) => new Date(b.payment.submittedAt) - new Date(a.payment.submittedAt))
}

export function getLessonQuizSummary(state, lesson) {
  if (!lesson || lesson.type !== 'quiz') return null
  const quiz = getQuiz(state, lesson.quizId)
  if (!quiz) return null
  const totalPoints = quiz.questions.reduce((total, question) => total + question.points, 0)
  return { quiz, totalPoints, questionCount: quiz.questions.length }
}

export function getCourseDurationMinutes(state, courseId) {
  return getCourseLessons(state, courseId).reduce((total, lesson) => total + (lesson.durationMin || 0), 0)
}

export function getCourseLearnerCount(state, courseId) {
  return getCourseEnrollments(state, courseId, 'active').length
}

export function getCourseReviews(state, courseId) {
  return (state.reviews || [])
    .filter((review) => review.courseId === courseId)
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export function getCourseRating(state, courseId) {
  const reviews = getCourseReviews(state, courseId)
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  reviews.forEach((review) => {
    const rating = Math.max(1, Math.min(5, Math.round(Number(review.rating) || 0)))
    distribution[rating] += 1
  })
  const total = reviews.reduce((sum, review) => sum + (Number(review.rating) || 0), 0)
  return {
    count: reviews.length,
    average: reviews.length ? Number((total / reviews.length).toFixed(1)) : 0,
    distribution,
  }
}

export function getLessonDisplayType(state, lesson) {
  if (!lesson) return 'content'
  if (lesson.type === 'quiz') return 'quiz'
  const blocks = getBlocks(state, lesson.id)
  const hasVideo = blocks.some((block) => ['video', 'youtube'].includes(block.type))
  const hasFile = blocks.some((block) => ['pdf', 'file', 'gdrive'].includes(block.type))
  const hasImage = blocks.some((block) => block.type === 'image')
  const hasText = blocks.some((block) => block.type === 'richtext')
  if (hasVideo) return 'video'
  if (hasFile) return 'file'
  if (hasImage) return 'image'
  if (hasText) return 'text'
  return 'content'
}

export function getCoursePreviewLessons(state, courseId) {
  return getCourseLessons(state, courseId).filter((lesson) => lesson.preview)
}

export function getCourseRevenue(state, courseId) {
  return state.coursePayments
    .filter((payment) => payment.courseId === courseId && payment.status === 'validated')
    .reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0)
}

export function getQuizAttemptCount(state, learnerId, quizId) {
  return state.quizAttempts.filter((attempt) => attempt.learnerId === learnerId && attempt.quizId === quizId).length
}

export function getCourseStats(state, courseId) {
  const lessons = getCourseLessons(state, courseId)
  const sections = getSections(state, courseId)
  const enrollments = getCourseEnrollments(state, courseId, 'active')
  const progressValues = enrollments.map((enrollment) => getCourseProgress(state, enrollment.learnerId, courseId).percentage)
  const completed = progressValues.filter((value) => value >= 100).length
  const rating = getCourseRating(state, courseId)
  return {
    lessons: lessons.length,
    sections: sections.length,
    learners: enrollments.length,
    completed,
    averageProgress: progressValues.length
      ? Math.round(progressValues.reduce((total, value) => total + value, 0) / progressValues.length)
      : 0,
    completionRate: progressValues.length ? Math.round((completed / progressValues.length) * 100) : 0,
    revenue: getCourseRevenue(state, courseId),
    rating: rating.average,
    reviewCount: rating.count,
    duration: getCourseDurationMinutes(state, courseId),
  }
}

export function getRelatedCourses(state, courseId, limit = 3) {
  const course = getCourse(state, courseId)
  if (!course) return []
  return getSchoolCourses(state, course.schoolId, { includeUnpublished: false })
    .filter((item) => item.id !== courseId)
    .sort((a, b) => {
      const sameCategoryA = a.category === course.category ? 1 : 0
      const sameCategoryB = b.category === course.category ? 1 : 0
      return sameCategoryB - sameCategoryA
    })
    .slice(0, limit)
}

export function getUnreadAnnouncements(state, learnerId) {
  return getAnnouncementsForLearner(state, learnerId).filter(
    (announcement) => !(announcement.readBy || []).includes(learnerId),
  )
}

export function getNextLesson(state, learnerId, course) {
  const lessons = getCourseLessons(state, course.id)
  for (const lesson of lessons) {
    if (!isLessonCompleted(state, learnerId, course.id, lesson)) {
      const lock = getLessonLockState(state, learnerId, course, lesson)
      if (!lock.locked) return lesson
    }
  }
  return lessons[lessons.length - 1] || null
}

export function getLastAccessedLesson(state, learnerId, course) {
  const lessons = getCourseLessons(state, course.id)
  const progress = state.lessonProgress
    .filter((entry) => entry.learnerId === learnerId && entry.courseId === course.id)
    .sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0))
  for (const entry of progress) {
    const lesson = lessons.find((item) => item.id === entry.lessonId)
    if (lesson && !entry.completed) return lesson
  }
  return getNextLesson(state, learnerId, course)
}

export function getSchoolPaymentMethodStatus(school) {
  return {
    online: school?.paymentSettings?.chargerly?.status === 'connected',
    manual: Boolean(school?.paymentSettings?.manual?.enabled),
  }
}

export function getLearnerPaymentsSummary(state, learnerId) {
  const rows = getLearnerPaymentRows(state, learnerId)
  return {
    total: rows.length,
    pending: rows.filter((row) => row.payment.status === 'pending').length,
    validated: rows.filter((row) => row.payment.status === 'validated').length,
    rejected: rows.filter((row) => row.payment.status === 'rejected').length,
  }
}
