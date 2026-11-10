import { nowIso, uid } from '../lib/utils.js'
import { getState, resetStore, updateState } from './store.js'
import {
  getActivePaymentMethods,
  getCourse,
  getCourseEnrollments,
  getCourseLessons,
  getCoursePayment,
  getCourseProgress,
  getLearnerEnrollments,
  getLesson,
  getLessonLockState,
  getPlan,
  getPlanUsage,
  getQuiz,
  getSchool,
  getSchoolBySlug,
  getSubscription,
  getTrainerProfile,
  getTrainerSubscription,
  hasActiveSubscription,
  isLessonCompleted,
  isSubscriptionActive,
} from './selectors.js'

function pushActivity(draft, entry) {
  draft.activity.unshift({
    id: uid('act'),
    createdAt: nowIso(),
    ...entry,
  })
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function findUserByEmail(draft, email) {
  const value = normalizeEmail(email)
  return draft.users.find((user) => normalizeEmail(user.email) === value) || null
}

function findProfile(draft, userId) {
  return draft.trainerProfiles.find((profile) => profile.userId === userId) || null
}

function upsertProgress(draft, learnerId, courseId, lessonId, patch) {
  let entry = draft.lessonProgress.find(
    (item) => item.learnerId === learnerId && item.lessonId === lessonId,
  )
  if (!entry) {
    entry = {
      id: uid('lpg'),
      learnerId,
      courseId,
      lessonId,
      completed: false,
      completedAt: null,
      videoPosition: 0,
    }
    draft.lessonProgress.push(entry)
  }
  Object.assign(entry, patch)
  return entry
}

function activateSubscription(draft, userId, planId, method, amount) {
  const profile = findProfile(draft, userId)
  if (!profile) return null
  const now = new Date()
  let subscription = profile.subscriptionId
    ? draft.subscriptions.find((item) => item.id === profile.subscriptionId)
    : null
  if (!subscription) {
    subscription = {
      id: uid('sub'),
      trainerId: userId,
      planId,
      status: 'active',
      startedAt: now.toISOString(),
      endsAt: null,
      amount,
      method,
      createdAt: now.toISOString(),
      cancelledAt: null,
    }
    draft.subscriptions.push(subscription)
  } else {
    subscription.planId = planId
    subscription.status = 'active'
    subscription.startedAt = now.toISOString()
    subscription.endsAt = new Date(now.getTime() + 30 * 86400000).toISOString()
    subscription.amount = amount
    subscription.method = method
    subscription.cancelledAt = null
  }
  profile.planId = planId
  profile.subscriptionId = subscription.id
  return subscription
}

function setSubscriptionStatus(draft, userId, status, planId) {
  const profile = findProfile(draft, userId)
  if (!profile) return null
  let subscription = profile.subscriptionId
    ? draft.subscriptions.find((item) => item.id === profile.subscriptionId)
    : null
  if (!subscription) {
    subscription = {
      id: uid('sub'),
      trainerId: userId,
      planId,
      status,
      startedAt: null,
      endsAt: null,
      amount: 0,
      method: 'manual',
      createdAt: nowIso(),
      cancelledAt: null,
    }
    draft.subscriptions.push(subscription)
  }
  subscription.status = status
  if (planId) subscription.planId = planId
  profile.subscriptionId = subscription.id
  if (planId) profile.planId = planId
  return subscription
}

export function login(email, password) {
  const state = getState()
  const user = findUserByEmail(state, email)
  if (!user) return { ok: false, error: 'invalid-credentials' }
  if (user.password !== password) return { ok: false, error: 'invalid-credentials' }
  if (user.status === 'suspended') return { ok: false, error: 'suspended', user }
  updateState((draft) => {
    const target = draft.users.find((item) => item.id === user.id)
    target.lastActiveAt = nowIso()
    draft.session = { userId: user.id, since: nowIso() }
  })
  return { ok: true, user }
}

export function demoLogin(userId) {
  const state = getState()
  const user = state.users.find((item) => item.id === userId)
  if (!user) return { ok: false, error: 'not-found' }
  updateState((draft) => {
    const target = draft.users.find((item) => item.id === userId)
    target.lastActiveAt = nowIso()
    draft.session = { userId, since: nowIso() }
  })
  return { ok: true, user }
}

export function logout() {
  updateState((draft) => {
    draft.session = null
  })
}

export function updateUser(userId, patch) {
  updateState((draft) => {
    const user = draft.users.find((item) => item.id === userId)
    if (user) Object.assign(user, patch)
  })
}

export function registerLearner({ name, email, password, schoolId, language = 'fr' }) {
  const state = getState()
  if (findUserByEmail(state, email)) return { ok: false, error: 'email-taken' }
  const user = {
    id: uid('usr'),
    name: String(name).trim(),
    email: normalizeEmail(email),
    password,
    role: 'learner',
    schoolId: schoolId || null,
    language,
    status: 'active',
    createdAt: nowIso(),
    lastActiveAt: nowIso(),
  }
  updateState((draft) => {
    draft.users.push(user)
    draft.session = { userId: user.id, since: nowIso() }
  })
  return { ok: true, user }
}

export function registerTrainer({ name, email, password, language = 'fr' }) {
  const state = getState()
  if (findUserByEmail(state, email)) return { ok: false, error: 'email-taken' }
  const userId = uid('usr')
  const profileId = uid('tp')
  const user = {
    id: userId,
    name: String(name).trim(),
    email: normalizeEmail(email),
    password,
    role: 'trainer',
    schoolId: null,
    language,
    status: 'active',
    createdAt: nowIso(),
    lastActiveAt: nowIso(),
  }
  updateState((draft) => {
    draft.users.push(user)
    draft.trainerProfiles.push({
      id: profileId,
      userId,
      schoolId: null,
      bio: '',
      headline: '',
      onboardingComplete: false,
      planId: null,
      subscriptionId: null,
      createdAt: nowIso(),
    })
    draft.onboardingDrafts[userId] = { step: 2, accountDone: true }
    draft.session = { userId, since: nowIso() }
    pushActivity(draft, { type: 'trainer_registered', actorId: userId, schoolId: null })
  })
  return { ok: true, user }
}

export function saveOnboardingDraft(userId, patch) {
  updateState((draft) => {
    draft.onboardingDrafts[userId] = { ...(draft.onboardingDrafts[userId] || {}), ...patch }
  })
}

export function completeOnboarding(userId) {
  updateState((draft) => {
    const profile = findProfile(draft, userId)
    if (profile) profile.onboardingComplete = true
    draft.onboardingDrafts[userId] = { ...(draft.onboardingDrafts[userId] || {}), step: 6, completed: true }
  })
}

export function checkSubdomainAvailability(rawValue, excludeSchoolId = null) {
  const state = getState()
  const value = String(rawValue || '').trim().toLowerCase()
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
  const reserved = ['admin', 'www', 'app', 'api', 'mail', 'support', 'tiwanza', 'demo', 'school', 'login']
  const base = normalized || 'mon-ecole'
  const suggestions = [`${base}-dz`, `${base}-academy`, `${base}-2`]
    .map((slug) => slug.replace(/-+/g, '-').replace(/^-+|-+$/g, ''))
    .filter((slug, index, list) => list.indexOf(slug) === index)
    .filter(
      (slug) =>
        !reserved.includes(slug) &&
        !state.schools.some((school) => school.slug === slug && school.id !== excludeSchoolId),
    )
  if (!normalized || normalized.length < 3) {
    return { available: false, reason: 'too-short', normalized, suggestions }
  }
  if (normalized.length > 32) {
    return { available: false, reason: 'too-long', normalized, suggestions }
  }
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])$/.test(normalized)) {
    return { available: false, reason: 'invalid', normalized, suggestions }
  }
  if (reserved.includes(normalized)) {
    return { available: false, reason: 'reserved', normalized, suggestions }
  }
  const taken = state.schools.some((school) => school.slug === normalized && school.id !== excludeSchoolId)
  return { available: !taken, reason: taken ? 'taken' : null, normalized, suggestions }
}

export function createSchoolForTrainer(userId, data) {
  const state = getState()
  const profile = getTrainerProfile(state, userId)
  if (!profile) return { ok: false, error: 'no-profile' }
  const existing = profile.schoolId ? getSchool(state, profile.schoolId) : null
  if (existing) {
    updateState((draft) => {
      const school = draft.schools.find((item) => item.id === existing.id)
      Object.assign(school, data)
      const draftProfile = findProfile(draft, userId)
      draftProfile.headline = data.headline || draftProfile.headline
      draftProfile.bio = data.bio || draftProfile.bio
      draft.onboardingDrafts[userId] = { ...(draft.onboardingDrafts[userId] || {}), step: 3 }
    })
    return { ok: true, school: { ...existing, ...data } }
  }
  const schoolId = uid('sch')
  const slug = data.slug || `ecole-${Math.random().toString(36).slice(2, 7)}`
  const school = {
    id: schoolId,
    trainerId: userId,
    name: data.name,
    slug,
    subdomain: `${slug}.tiwanza.com`,
    description: data.description || '',
    contactEmail: data.contactEmail || '',
    contactPhone: data.contactPhone || '',
    city: data.city || '',
    language: data.language || 'fr',
    logo: data.logo || null,
    brandAccent: '#0D7A6A',
    createdAt: nowIso(),
    paymentSettings: {
      chargerly: { status: 'disconnected', mode: 'test', accountName: data.name || '' },
      manual: {
        enabled: true,
        ccp: '',
        baridimob: '',
        bank: { name: '', agency: '', rib: '' },
        beneficiary: data.name || '',
        instructionsFr: 'Contactez votre formateur pour les instructions de paiement.',
        instructionsAr: 'تواصل مع مدربك للحصول على تعليمات الدفع.',
        delay: '48 h ouvrées',
      },
    },
  }
  updateState((draft) => {
    draft.schools.push(school)
    draft.users.find((user) => user.id === userId).schoolId = schoolId
    const draftProfile = findProfile(draft, userId)
    draftProfile.schoolId = schoolId
    draftProfile.headline = data.headline || draftProfile.headline
    draftProfile.bio = data.bio || ''
    draft.onboardingDrafts[userId] = { ...(draft.onboardingDrafts[userId] || {}), step: 3 }
    pushActivity(draft, { type: 'school_created', actorId: userId, schoolId })
  })
  return { ok: true, school }
}

export function updateSchool(schoolId, patch) {
  const state = getState()
  const school = getSchool(state, schoolId)
  if (!school) return { ok: false, error: 'not-found' }
  const slug = patch.slug ? String(patch.slug).toLowerCase() : school.slug
  if (patch.slug && slug !== school.slug) {
    const check = checkSubdomainAvailability(slug, schoolId)
    if (!check.available) return { ok: false, error: check.reason, suggestions: check.suggestions }
  }
  let next = patch
  if (patch.paymentSettings) {
    next = {
      ...patch,
      paymentSettings: {
        ...school.paymentSettings,
        ...patch.paymentSettings,
        manual: { ...school.paymentSettings?.manual, ...(patch.paymentSettings.manual || {}) },
        chargerly: { ...school.paymentSettings?.chargerly, ...(patch.paymentSettings.chargerly || {}) },
      },
    }
  }
  updateState((draft) => {
    const target = draft.schools.find((item) => item.id === schoolId)
    Object.assign(target, next)
    if (patch.slug) target.subdomain = `${patch.slug}.tiwanza.com`
  })
  return { ok: true, school: { ...school, ...next } }
}

export function savePlanSelection(userId, planId) {
  updateState((draft) => {
    draft.onboardingDrafts[userId] = { ...(draft.onboardingDrafts[userId] || {}), selectedPlanId: planId }
    const profile = findProfile(draft, userId)
    if (profile) profile.planId = planId
  })
}

export function activateFreePlan(userId) {
  const plan = getState().plans.find((item) => item.code === 'free')
  if (!plan) return { ok: false, error: 'not-found' }
  updateState((draft) => {
    activateSubscription(draft, userId, plan.id, 'free', 0)
    draft.onboardingDrafts[userId] = {
      ...(draft.onboardingDrafts[userId] || {}),
      selectedPlanId: plan.id,
      subscriptionStatus: 'active',
    }
    pushActivity(draft, { type: 'subscription_free', actorId: userId, schoolId: findProfile(draft, userId)?.schoolId })
  })
  return { ok: true, plan }
}

export function submitSubscriptionOnline({ userId, planId, provider, outcome }) {
  const state = getState()
  const plan = getPlan(state, planId)
  if (!plan) return { ok: false, error: 'not-found' }
  const status = outcome === 'success' ? 'validated' : outcome === 'cancelled' ? 'cancelled' : 'failed'
  const paymentId = uid('sp')
  updateState((draft) => {
    draft.subscriptionPayments.unshift({
      id: paymentId,
      trainerId: userId,
      planId,
      amount: plan.priceDA,
      method: 'online',
      provider,
      status,
      reference: `TIW-ONL-${Math.floor(10000 + Math.random() * 89999)}`,
      proofName: null,
      proofDataUrl: null,
      submittedAt: nowIso(),
      reviewedAt: nowIso(),
      rejectionReason: null,
    })
    if (status === 'validated') {
      activateSubscription(draft, userId, planId, 'online', plan.priceDA)
      const profile = findProfile(draft, userId)
      draft.onboardingDrafts[userId] = {
        ...(draft.onboardingDrafts[userId] || {}),
        selectedPlanId: planId,
        subscriptionStatus: 'active',
      }
      pushActivity(draft, {
        type: 'subscription_paid',
        actorId: userId,
        schoolId: profile?.schoolId,
        meta: { amount: plan.priceDA },
      })
    }
  })
  return { ok: status === 'validated', status, paymentId }
}

export function submitSubscriptionManual({ userId, planId, reference, proofName, proofDataUrl }) {
  const state = getState()
  const plan = getPlan(state, planId)
  if (!plan) return { ok: false, error: 'not-found' }
  const paymentId = uid('sp')
  updateState((draft) => {
    draft.subscriptionPayments.unshift({
      id: paymentId,
      trainerId: userId,
      planId,
      amount: plan.priceDA,
      method: 'manual',
      provider: 'ccp',
      status: 'pending',
      reference,
      proofName: proofName || null,
      proofDataUrl: proofDataUrl || null,
      submittedAt: nowIso(),
      reviewedAt: null,
      rejectionReason: null,
    })
    setSubscriptionStatus(draft, userId, 'pending', planId)
    draft.onboardingDrafts[userId] = {
      ...(draft.onboardingDrafts[userId] || {}),
      selectedPlanId: planId,
      subscriptionStatus: 'pending',
    }
    pushActivity(draft, {
      type: 'subscription_manual',
      actorId: userId,
      schoolId: findProfile(draft, userId)?.schoolId,
      meta: { amount: plan.priceDA },
    })
  })
  return { ok: true, paymentId }
}

export function approveSubscriptionPayment(paymentId, reviewerId = 'u-admin') {
  const state = getState()
  const payment = state.subscriptionPayments.find((item) => item.id === paymentId)
  if (!payment) return { ok: false, error: 'not-found' }
  updateState((draft) => {
    const target = draft.subscriptionPayments.find((item) => item.id === paymentId)
    target.status = 'validated'
    target.reviewedAt = nowIso()
    target.rejectionReason = null
    activateSubscription(draft, target.trainerId, target.planId, target.method, target.amount)
    const profile = findProfile(draft, target.trainerId)
    draft.onboardingDrafts[target.trainerId] = {
      ...(draft.onboardingDrafts[target.trainerId] || {}),
      subscriptionStatus: 'active',
    }
    pushActivity(draft, {
      type: 'subscription_approved',
      actorId: reviewerId,
      schoolId: profile?.schoolId,
      meta: { trainerId: target.trainerId, amount: target.amount },
    })
  })
  return { ok: true }
}

export function rejectSubscriptionPayment(paymentId, reason, reviewerId = 'u-admin') {
  const state = getState()
  const payment = state.subscriptionPayments.find((item) => item.id === paymentId)
  if (!payment) return { ok: false, error: 'not-found' }
  updateState((draft) => {
    const target = draft.subscriptionPayments.find((item) => item.id === paymentId)
    target.status = 'rejected'
    target.reviewedAt = nowIso()
    target.rejectionReason = reason || ''
    setSubscriptionStatus(draft, target.trainerId, 'rejected', target.planId)
    const profile = findProfile(draft, target.trainerId)
    draft.onboardingDrafts[target.trainerId] = {
      ...(draft.onboardingDrafts[target.trainerId] || {}),
      subscriptionStatus: 'rejected',
    }
    pushActivity(draft, {
      type: 'subscription_rejected',
      actorId: reviewerId,
      schoolId: profile?.schoolId,
      meta: { trainerId: target.trainerId },
    })
  })
  return { ok: true }
}

export function cancelSubscription(userId) {
  updateState((draft) => {
    const profile = findProfile(draft, userId)
    const subscription = profile?.subscriptionId
      ? draft.subscriptions.find((item) => item.id === profile.subscriptionId)
      : null
    if (subscription) {
      subscription.status = 'cancelled'
      subscription.cancelledAt = nowIso()
      subscription.endsAt = nowIso()
    }
  })
  return { ok: true }
}

export function createCourse({ schoolId, trainerId, data }) {
  const state = getState()
  if (!hasActiveSubscription(state, trainerId)) return { ok: false, error: 'subscription-required' }
  const usage = getPlanUsage(state, schoolId)
  if (!usage.hasStorage) return { ok: false, error: 'storage-limit' }
  if (!usage.canCreateCourse) return { ok: false, error: 'course-limit' }
  const courseId = uid('crs')
  const course = {
    id: courseId,
    schoolId,
    trainerId,
    title: data.title || '',
    shortDescription: data.shortDescription || '',
    description: data.description || '',
    category: data.category || 'Autre',
    language: data.language || 'fr',
    difficulty: data.difficulty || 'beginner',
    isFree: Boolean(data.isFree),
    priceDA: data.isFree ? 0 : Number(data.priceDA) || 0,
    cover: data.cover || 'linear-gradient(135deg,#0D7A6A 0%,#0A5F53 100%)',
    coverLabel: data.coverLabel || (data.title || 'COURS').slice(0, 12).toUpperCase(),
    coverImage: data.coverImage || null,
    status: 'draft',
    visibility: data.visibility || 'public',
    sequential: Boolean(data.sequential),
    commentsEnabled: data.commentsEnabled !== false,
    objectivesFr: data.objectivesFr || [],
    objectivesAr: data.objectivesAr || [],
    prerequisitesFr: data.prerequisitesFr || [],
    prerequisitesAr: data.prerequisitesAr || [],
    targetAudienceFr: data.targetAudienceFr || [],
    targetAudienceAr: data.targetAudienceAr || [],
    outcomesFr: data.outcomesFr || [],
    outcomesAr: data.outcomesAr || [],
    estimatedDurationMin: Number(data.estimatedDurationMin) || 0,
    enrollmentSettings: {
      allowManual: data.allowManual !== false,
      allowOnline: data.allowOnline !== false,
    },
    createdAt: nowIso(),
    updatedAt: nowIso(),
    publishedAt: null,
    deletedAt: null,
  }
  updateState((draft) => {
    draft.courses.push(course)
    pushActivity(draft, { type: 'course_created', actorId: trainerId, schoolId, courseId })
  })
  return { ok: true, course }
}

export function updateCourse(courseId, patch) {
  updateState((draft) => {
    const course = draft.courses.find((item) => item.id === courseId)
    if (!course) return
    const coverImage = patch.coverImage !== undefined ? patch.coverImage : course.coverImage
    Object.assign(course, patch, { updatedAt: nowIso(), coverImage })
    if (course.isFree) course.priceDA = 0
  })
  return { ok: true }
}

export function duplicateCourse(courseId, trainerId) {
  const state = getState()
  const original = getCourse(state, courseId)
  if (!original) return { ok: false, error: 'not-found' }
  if (!hasActiveSubscription(state, trainerId)) return { ok: false, error: 'subscription-required' }
  const usage = getPlanUsage(state, original.schoolId)
  if (!usage.canCreateCourse) return { ok: false, error: 'course-limit' }
  const newCourseId = uid('crs')
  updateState((draft) => {
    const source = draft.courses.find((item) => item.id === courseId)
    const copy = {
      ...structuredClone(source),
      id: newCourseId,
      title: `${source.title} (copie)`,
      status: 'draft',
      publishedAt: null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      deletedAt: null,
    }
    draft.courses.push(copy)
    const sectionMap = new Map()
    draft.sections
      .filter((section) => section.courseId === courseId)
      .forEach((section) => {
        const newSectionId = uid('sec')
        sectionMap.set(section.id, newSectionId)
        draft.sections.push({ ...section, id: newSectionId, courseId: newCourseId })
      })
    const lessonMap = new Map()
    draft.lessons
      .filter((lesson) => lesson.courseId === courseId)
      .forEach((lesson) => {
        const newLessonId = uid('les')
        lessonMap.set(lesson.id, newLessonId)
        draft.lessons.push({
          ...lesson,
          id: newLessonId,
          courseId: newCourseId,
          sectionId: sectionMap.get(lesson.sectionId) || lesson.sectionId,
          quizId: lesson.quizId ? `${lesson.quizId}-copy-${newLessonId}` : null,
        })
      })
    draft.blocks
      .filter((block) => lessonMap.has(block.lessonId))
      .forEach((block) => {
        draft.blocks.push({ ...structuredClone(block), id: uid('blk'), lessonId: lessonMap.get(block.lessonId) })
      })
    draft.quizzes
      .filter((quiz) => quiz.courseId === courseId)
      .forEach((quiz) => {
        const newQuizId = quiz.lessonId ? `${quiz.id}-copy-${lessonMap.get(quiz.lessonId)}` : uid('qz')
        draft.quizzes.push({
          ...structuredClone(quiz),
          id: newQuizId,
          courseId: newCourseId,
          lessonId: lessonMap.get(quiz.lessonId) || null,
          questions: quiz.questions.map((question) => ({
            ...question,
            id: uid('q'),
            choices: question.choices.map((choice) => ({ ...choice, id: uid('ch') })),
          })),
        })
        const lesson = draft.lessons.find((item) => item.id === lessonMap.get(quiz.lessonId))
        if (lesson) lesson.quizId = newQuizId
      })
    pushActivity(draft, { type: 'course_duplicated', actorId: trainerId, schoolId: original.schoolId, courseId: newCourseId })
  })
  return { ok: true, courseId: newCourseId }
}

export function deleteCourse(courseId) {
  updateState((draft) => {
    const course = draft.courses.find((item) => item.id === courseId)
    if (course) {
      course.deletedAt = nowIso()
      course.status = 'draft'
    }
  })
  return { ok: true }
}

export function validateCourseForPublish(state, course) {
  const errors = []
  if (!course.title?.trim() || !course.shortDescription?.trim() || !course.description?.trim()) errors.push('info')
  if (!(course.objectivesFr?.length || course.objectivesAr?.length)) errors.push('objectives')
  const sections = state.sections.filter((section) => section.courseId === course.id && !section.deletedAt)
  if (!sections.length) errors.push('sections')
  const lessons = getCourseLessons(state, course.id)
  if (!lessons.length) errors.push('lessons')
  const contentLessons = lessons.filter((lesson) => lesson.type === 'content')
  if (!contentLessons.length) errors.push('content')
  const emptyContent = contentLessons.find((lesson) => {
    const blocks = state.blocks.filter((block) => block.lessonId === lesson.id)
    const hasText = blocks.some((block) => block.type === 'richtext' && block.data?.html?.trim())
    const hasMedia = blocks.some((block) => ['video', 'pdf', 'file', 'image', 'youtube', 'gdrive'].includes(block.type) && Boolean(block.data?.fileName || block.data?.url))
    return !hasText && !hasMedia
  })
  if (emptyContent) errors.push('content')
  const emptyQuiz = lessons.find((lesson) => {
    if (lesson.type !== 'quiz') return false
    const quiz = getQuiz(state, lesson.quizId)
    return !quiz || !quiz.questions.length
  })
  if (emptyQuiz) errors.push('quiz')
  if (!course.isFree) {
    const school = getSchool(state, course.schoolId)
    if (!getActivePaymentMethods(school).length) errors.push('payment')
  }
  const usage = getPlanUsage(state, course.schoolId)
  const alreadyPublished = course.status === 'published'
  if (!alreadyPublished && !usage.canPublishCourse) errors.push('plan-courses')
  if (!course.isFree && !alreadyPublished && !usage.canPublishPaidCourse) errors.push('plan-paid')
  return errors
}

export function publishCourse(courseId) {
  const state = getState()
  const course = getCourse(state, courseId)
  if (!course) return { ok: false, error: 'not-found' }
  if (!hasActiveSubscription(state, course.trainerId)) return { ok: false, error: 'subscription-required' }
  const errors = validateCourseForPublish(state, course)
  if (errors.length) return { ok: false, errors }
  updateState((draft) => {
    const target = draft.courses.find((item) => item.id === courseId)
    target.status = 'published'
    target.publishedAt = nowIso()
    target.archivedAt = null
    target.updatedAt = nowIso()
    pushActivity(draft, { type: 'course_published', actorId: target.trainerId, schoolId: target.schoolId, courseId })
  })
  return { ok: true }
}

export function unpublishCourse(courseId) {
  updateState((draft) => {
    const course = draft.courses.find((item) => item.id === courseId)
    if (course) {
      course.status = 'unpublished'
      course.archivedAt = null
      course.updatedAt = nowIso()
    }
  })
  return { ok: true }
}

export function archiveCourse(courseId) {
  updateState((draft) => {
    const course = draft.courses.find((item) => item.id === courseId)
    if (course) {
      course.status = 'unpublished'
      course.archivedAt = nowIso()
      course.updatedAt = nowIso()
    }
  })
  return { ok: true }
}

export function restoreCourse(courseId) {
  updateState((draft) => {
    const course = draft.courses.find((item) => item.id === courseId)
    if (course) {
      course.status = 'draft'
      course.archivedAt = null
      course.updatedAt = nowIso()
    }
  })
  return { ok: true }
}

export function addSection(courseId, title) {
  const state = getState()
  const sections = state.sections.filter((section) => section.courseId === courseId && !section.deletedAt)
  const order = sections.reduce((max, section) => Math.max(max, section.order), 0) + 1
  const section = { id: uid('sec'), courseId, title: title || '', order }
  updateState((draft) => {
    draft.sections.push(section)
    const course = draft.courses.find((item) => item.id === courseId)
    if (course) course.updatedAt = nowIso()
  })
  return { ok: true, section }
}

export function updateSection(sectionId, patch) {
  updateState((draft) => {
    const section = draft.sections.find((item) => item.id === sectionId)
    if (section) Object.assign(section, patch)
  })
  return { ok: true }
}

export function deleteSection(sectionId) {
  updateState((draft) => {
    const section = draft.sections.find((item) => item.id === sectionId)
    if (!section) return
    section.deletedAt = nowIso()
    draft.lessons
      .filter((lesson) => lesson.sectionId === sectionId)
      .forEach((lesson) => {
        lesson.deletedAt = nowIso()
      })
  })
  return { ok: true }
}

export function moveSection(courseId, sectionId, direction) {
  updateState((draft) => {
    const sections = draft.sections
      .filter((section) => section.courseId === courseId && !section.deletedAt)
      .sort((a, b) => a.order - b.order)
    const index = sections.findIndex((section) => section.id === sectionId)
    const target = index + direction
    if (index < 0 || target < 0 || target >= sections.length) return
    const a = sections[index]
    const b = sections[target]
    const temp = a.order
    a.order = b.order
    b.order = temp
  })
  return { ok: true }
}

export function reorderSections(courseId, orderedIds) {
  updateState((draft) => {
    orderedIds.forEach((id, index) => {
      const section = draft.sections.find((item) => item.id === id && item.courseId === courseId)
      if (section) section.order = index + 1
    })
  })
  return { ok: true }
}

export function addLesson(sectionId, data = {}) {
  const state = getState()
  const section = state.sections.find((item) => item.id === sectionId)
  if (!section) return { ok: false, error: 'not-found' }
  const lessons = state.lessons.filter(
    (lesson) => lesson.sectionId === sectionId && !lesson.deletedAt,
  )
  const order = lessons.reduce((max, lesson) => Math.max(max, lesson.order), 0) + 1
  const lessonId = uid('les')
  const quizId = data.type === 'quiz' ? uid('qz') : null
  const lesson = {
    id: lessonId,
    courseId: section.courseId,
    sectionId,
    title: data.title || '',
    type: data.type === 'quiz' ? 'quiz' : 'content',
    order,
    durationMin: data.durationMin || 10,
    descriptionFr: data.descriptionFr || '',
    descriptionAr: data.descriptionAr || '',
    preview: Boolean(data.preview),
    quizId,
    createdAt: nowIso(),
    deletedAt: null,
  }
  updateState((draft) => {
    draft.lessons.push(lesson)
    if (quizId) {
      draft.quizzes.push({
        id: quizId,
        courseId: section.courseId,
        lessonId,
        title: data.title || '',
        passingScore: 70,
        randomizeQuestions: false,
        randomizeAnswers: false,
        questions: [],
      })
    }
    const course = draft.courses.find((item) => item.id === section.courseId)
    if (course) course.updatedAt = nowIso()
  })
  return { ok: true, lesson }
}

export function updateLesson(lessonId, patch) {
  updateState((draft) => {
    const lesson = draft.lessons.find((item) => item.id === lessonId)
    if (lesson) Object.assign(lesson, patch)
    if (patch.title !== undefined) {
      const quiz = draft.quizzes.find((item) => item.lessonId === lessonId)
      if (quiz && !quiz.title) quiz.title = patch.title
    }
    if (lesson) {
      const course = draft.courses.find((item) => item.id === lesson.courseId)
      if (course) course.updatedAt = nowIso()
    }
  })
  return { ok: true }
}

export function deleteLesson(lessonId) {
  updateState((draft) => {
    const lesson = draft.lessons.find((item) => item.id === lessonId)
    if (lesson) lesson.deletedAt = nowIso()
  })
  return { ok: true }
}

export function duplicateLesson(lessonId) {
  const state = getState()
  const source = getLesson(state, lessonId)
  if (!source) return { ok: false, error: 'not-found' }
  const siblings = state.lessons.filter(
    (lesson) => lesson.sectionId === source.sectionId && !lesson.deletedAt,
  )
  const order = siblings.reduce((max, lesson) => Math.max(max, lesson.order), 0) + 1
  const newLessonId = uid('les')
  const newQuizId = source.type === 'quiz' ? uid('qz') : null
  updateState((draft) => {
    draft.lessons.push({
      ...structuredClone(source),
      id: newLessonId,
      title: `${source.title} (copie)`,
      order,
      quizId: newQuizId,
      deletedAt: null,
      createdAt: nowIso(),
    })
    draft.blocks
      .filter((block) => block.lessonId === lessonId)
      .forEach((block) => {
        draft.blocks.push({ ...structuredClone(block), id: uid('blk'), lessonId: newLessonId })
      })
    const quiz = draft.quizzes.find((item) => item.lessonId === lessonId)
    if (quiz && newQuizId) {
      draft.quizzes.push({
        ...structuredClone(quiz),
        id: newQuizId,
        lessonId: newLessonId,
        questions: quiz.questions.map((question) => ({
          ...question,
          id: uid('q'),
          choices: question.choices.map((choice) => ({ ...choice, id: uid('ch') })),
        })),
      })
    }
  })
  return { ok: true, lessonId: newLessonId }
}

export function moveLesson(sectionId, lessonId, direction) {
  updateState((draft) => {
    const lessons = draft.lessons
      .filter((lesson) => lesson.sectionId === sectionId && !lesson.deletedAt)
      .sort((a, b) => a.order - b.order)
    const index = lessons.findIndex((lesson) => lesson.id === lessonId)
    const target = index + direction
    if (index < 0 || target < 0 || target >= lessons.length) return
    const a = lessons[index]
    const b = lessons[target]
    const temp = a.order
    a.order = b.order
    b.order = temp
  })
  return { ok: true }
}

export function reorderLessons(sectionId, orderedIds) {
  updateState((draft) => {
    orderedIds.forEach((id, index) => {
      const lesson = draft.lessons.find((item) => item.id === id && item.sectionId === sectionId)
      if (lesson) lesson.order = index + 1
    })
  })
  return { ok: true }
}

export function addBlock(lessonId, type) {
  const state = getState()
  const lesson = getLesson(state, lessonId)
  if (!lesson) return { ok: false, error: 'not-found' }
  const blocks = state.blocks.filter((block) => block.lessonId === lessonId)
  const order = blocks.reduce((max, block) => Math.max(max, block.order), 0) + 1
  const defaults = {
    richtext: { html: '' },
    video: { fileName: '', sizeMb: 0, durationSec: 0, status: 'empty' },
    pdf: { fileName: '', sizeMb: 0, status: 'empty' },
    file: { fileName: '', sizeMb: 0, status: 'empty' },
    image: { fileName: '', caption: '', url: null },
    youtube: { url: '', title: '' },
    gdrive: { url: '', fileName: '' },
  }
  const block = { id: uid('blk'), lessonId, type, order, data: defaults[type] || {} }
  updateState((draft) => {
    draft.blocks.push(block)
    const course = draft.courses.find((item) => item.id === lesson.courseId)
    if (course) course.updatedAt = nowIso()
  })
  return { ok: true, block }
}

export function updateBlock(blockId, data) {
  const state = getState()
  const block = state.blocks.find((item) => item.id === blockId)
  if (!block) return { ok: false, error: 'not-found' }
  const lesson = getLesson(state, block.lessonId)
  const course = lesson ? getCourse(state, lesson.courseId) : null
  if (block.type === 'video' && course) {
    const usage = getPlanUsage(state, course.schoolId)
    const otherVideoMb = state.blocks
      .filter((item) => item.id !== blockId && item.type === 'video')
      .reduce((total, item) => total + (Number(item.data?.sizeMb) || 0), 0)
    const nextTotal = otherVideoMb + (Number(data.sizeMb) || 0)
    if (!usage.hasStorage && nextTotal / 1024 > usage.limits.storageGb) {
      return { ok: false, error: 'storage-limit' }
    }
  }
  updateState((draft) => {
    const target = draft.blocks.find((item) => item.id === blockId)
    if (target) target.data = { ...target.data, ...data }
  })
  return { ok: true }
}

export function deleteBlock(blockId) {
  updateState((draft) => {
    draft.blocks = draft.blocks.filter((block) => block.id !== blockId)
  })
  return { ok: true }
}

export function moveBlock(lessonId, blockId, direction) {
  updateState((draft) => {
    const blocks = draft.blocks
      .filter((block) => block.lessonId === lessonId)
      .sort((a, b) => a.order - b.order)
    const index = blocks.findIndex((block) => block.id === blockId)
    const target = index + direction
    if (index < 0 || target < 0 || target >= blocks.length) return
    const a = blocks[index]
    const b = blocks[target]
    const temp = a.order
    a.order = b.order
    b.order = temp
  })
  return { ok: true }
}

export function reorderBlocks(lessonId, orderedIds) {
  updateState((draft) => {
    orderedIds.forEach((id, index) => {
      const block = draft.blocks.find((item) => item.id === id && item.lessonId === lessonId)
      if (block) block.order = index + 1
    })
  })
  return { ok: true }
}

export function saveQuizForLesson(lessonId, quizData) {
  const state = getState()
  const lesson = getLesson(state, lessonId)
  if (!lesson) return { ok: false, error: 'not-found' }
  const existing = state.quizzes.find((quiz) => quiz.lessonId === lessonId)
  const quizId = existing?.id || uid('qz')
  const quiz = {
    id: quizId,
    courseId: lesson.courseId,
    lessonId,
    title: quizData.title || lesson.title || '',
    descriptionFr: quizData.descriptionFr || '',
    descriptionAr: quizData.descriptionAr || '',
    passingScore: Number(quizData.passingScore) || 60,
    timeLimitMin: Number(quizData.timeLimitMin) || 0,
    maxAttempts: Number(quizData.maxAttempts) || 0,
    randomizeQuestions: Boolean(quizData.randomizeQuestions),
    randomizeAnswers: Boolean(quizData.randomizeAnswers),
    questions: (quizData.questions || []).map((question) => ({
      ...question,
      id: question.id || uid('q'),
      points: Number(question.points) || 1,
      choices: (question.choices || []).map((choice) => ({
        ...choice,
        id: choice.id || uid('ch'),
      })),
    })),
  }
  updateState((draft) => {
    const index = draft.quizzes.findIndex((item) => item.id === quizId)
    if (index >= 0) draft.quizzes[index] = quiz
    else draft.quizzes.push(quiz)
    const targetLesson = draft.lessons.find((item) => item.id === lessonId)
    if (targetLesson) targetLesson.quizId = quizId
  })
  return { ok: true, quiz }
}

export function saveQuiz(quizId, patch) {
  updateState((draft) => {
    const quiz = draft.quizzes.find((item) => item.id === quizId)
    if (quiz) Object.assign(quiz, patch)
  })
  return { ok: true }
}

function scoreQuiz(quiz, answers) {
  let score = 0
  let total = 0
  const details = quiz.questions.map((question) => {
    total += question.points
    const correctChoiceIds = question.choices.filter((choice) => choice.correct).map((choice) => choice.id)
    const given = answers[question.id]
    let correct = false
    if (question.type === 'multiple') {
      const values = Array.isArray(given) ? given : []
      correct =
        values.length === correctChoiceIds.length && correctChoiceIds.every((id) => values.includes(id))
    } else {
      correct = given === correctChoiceIds[0]
    }
    const earned = correct ? question.points : 0
    score += earned
    return { questionId: question.id, earned, correct, correctChoiceIds, given }
  })
  return { score, total, percentage: total ? Math.round((score / total) * 100) : 0, details }
}

export function submitQuiz(learnerId, courseId, quizId, answers) {
  const state = getState()
  const quiz = getQuiz(state, quizId)
  if (!quiz) return { ok: false, error: 'not-found' }
  const course = getCourse(state, courseId)
  if (!course) return { ok: false, error: 'not-found' }
  const enrollment = state.enrollments.find(
    (item) => item.courseId === courseId && item.learnerId === learnerId && item.status === 'active',
  )
  if (!enrollment) return { ok: false, error: 'not-enrolled' }
  if (!quiz.questions.length) return { ok: false, error: 'empty-quiz' }
  const attemptCount = state.quizAttempts.filter(
    (item) => item.learnerId === learnerId && item.quizId === quizId,
  ).length
  if (quiz.maxAttempts > 0 && attemptCount >= quiz.maxAttempts) {
    return { ok: false, error: 'attempts-exhausted' }
  }
  const result = scoreQuiz(quiz, answers || {})
  const passed = result.percentage >= quiz.passingScore
  const attempt = {
    id: uid('att'),
    quizId,
    courseId,
    lessonId: quiz.lessonId,
    learnerId,
    score: result.score,
    total: result.total,
    percentage: result.percentage,
    passed,
    answers: answers || {},
    startedAt: nowIso(),
    completedAt: nowIso(),
  }
  updateState((draft) => {
    draft.quizAttempts.unshift(attempt)
    upsertProgress(draft, learnerId, courseId, quiz.lessonId, {
      completed: passed,
      completedAt: passed ? nowIso() : null,
    })
    if (passed) {
      pushActivity(draft, {
        type: 'quiz_passed',
        actorId: learnerId,
        schoolId: course.schoolId,
        courseId,
        meta: { percentage: result.percentage },
      })
    }
  })
  return {
    ok: true,
    attempt,
    passed,
    percentage: result.percentage,
    score: result.score,
    total: result.total,
    details: result.details,
    passingScore: quiz.passingScore,
  }
}

export function saveVideoPosition(learnerId, courseId, lessonId, position) {
  updateState((draft) => {
    const existing = draft.lessonProgress.find(
      (item) => item.learnerId === learnerId && item.lessonId === lessonId,
    )
    if (existing) existing.videoPosition = position
    else
      upsertProgress(draft, learnerId, courseId, lessonId, {
        completed: false,
        completedAt: null,
        videoPosition: position,
      })
  })
  return { ok: true }
}

export function completeLesson(learnerId, courseId, lessonId) {
  const state = getState()
  const course = getCourse(state, courseId)
  const lesson = getLesson(state, lessonId)
  if (!course || !lesson) return { ok: false, error: 'not-found' }
  if (lesson.type === 'quiz') return { ok: false, error: 'quiz-required' }
  const enrollment = state.enrollments.find(
    (item) => item.courseId === courseId && item.learnerId === learnerId && item.status === 'active',
  )
  if (!enrollment) return { ok: false, error: 'not-enrolled' }
  const lock = getLessonLockState(state, learnerId, course, lesson)
  if (lock.locked) return { ok: false, error: 'locked' }
  updateState((draft) => {
    upsertProgress(draft, learnerId, courseId, lessonId, { completed: true, completedAt: nowIso() })
    pushActivity(draft, {
      type: 'lesson_completed',
      actorId: learnerId,
      schoolId: course.schoolId,
      courseId,
      meta: { lessonTitle: lesson.title },
    })
  })
  return { ok: true }
}

export function enrollFree(courseId, learnerId) {
  const state = getState()
  const course = getCourse(state, courseId)
  if (!course) return { ok: false, error: 'not-found' }
  if (!course.isFree) return { ok: false, error: 'not-free' }
  if (course.status !== 'published') return { ok: false, error: 'not-published' }
  const existing = state.enrollments.find(
    (item) => item.courseId === courseId && item.learnerId === learnerId,
  )
  if (existing?.status === 'active') return { ok: false, error: 'already-enrolled' }
  const usage = getPlanUsage(state, course.schoolId)
  if (!usage.hasStorage) return { ok: false, error: 'storage-limit' }
  if (!usage.canAddLearner) return { ok: false, error: 'learner-limit' }
  updateState((draft) => {
    let enrollment = draft.enrollments.find(
      (item) => item.courseId === courseId && item.learnerId === learnerId,
    )
    if (enrollment) {
      enrollment.status = 'active'
      enrollment.source = 'free'
      enrollment.enrolledAt = nowIso()
      enrollment.updatedAt = nowIso()
    } else {
      enrollment = {
        id: uid('enr'),
        courseId,
        schoolId: course.schoolId,
        learnerId,
        status: 'active',
        source: 'free',
        enrolledAt: nowIso(),
        updatedAt: nowIso(),
      }
      draft.enrollments.push(enrollment)
    }
    pushActivity(draft, { type: 'enrollment_created', actorId: learnerId, schoolId: course.schoolId, courseId })
  })
  return { ok: true }
}

export function submitCourseOnlinePayment({ courseId, learnerId, provider, outcome }) {
  const state = getState()
  const course = getCourse(state, courseId)
  if (!course) return { ok: false, error: 'not-found' }
  if (course.isFree) return { ok: false, error: 'not-free' }
  if (course.status !== 'published') return { ok: false, error: 'not-published' }
  const school = getSchool(state, course.schoolId)
  if (!getActivePaymentMethods(school).includes('online')) return { ok: false, error: 'online-disabled' }
  if (outcome !== 'success') {
    updateState((draft) => {
      draft.coursePayments.unshift({
        id: uid('cpy'),
        enrollmentId: null,
        courseId,
        schoolId: course.schoolId,
        learnerId,
        amount: course.priceDA,
        method: 'online',
        provider,
        status: outcome === 'cancelled' ? 'cancelled' : 'failed',
        reference: `CHG-${Math.floor(10000 + Math.random() * 89999)}`,
        proofName: null,
        proofDataUrl: null,
        submittedAt: nowIso(),
        reviewedAt: nowIso(),
        rejectionReason: null,
        refundedAt: null,
      })
    })
    return { ok: false, error: outcome === 'cancelled' ? 'cancelled' : 'failed' }
  }
  const usage = getPlanUsage(state, course.schoolId)
  if (!usage.canAddLearner) return { ok: false, error: 'learner-limit' }
  updateState((draft) => {
    let enrollment = draft.enrollments.find(
      (item) => item.courseId === courseId && item.learnerId === learnerId,
    )
    if (!enrollment) {
      enrollment = {
        id: uid('enr'),
        courseId,
        schoolId: course.schoolId,
        learnerId,
        status: 'active',
        source: 'online',
        enrolledAt: nowIso(),
        updatedAt: nowIso(),
      }
      draft.enrollments.push(enrollment)
    } else {
      enrollment.status = 'active'
      enrollment.source = 'online'
      enrollment.updatedAt = nowIso()
    }
    draft.coursePayments.unshift({
      id: uid('cpy'),
      enrollmentId: enrollment.id,
      courseId,
      schoolId: course.schoolId,
      learnerId,
      amount: course.priceDA,
      method: 'online',
      provider,
      status: 'validated',
      reference: `CHG-${Math.floor(10000 + Math.random() * 89999)}`,
      proofName: null,
      proofDataUrl: null,
      submittedAt: nowIso(),
      reviewedAt: nowIso(),
      rejectionReason: null,
      refundedAt: null,
    })
    pushActivity(draft, {
      type: 'enrollment_created',
      actorId: learnerId,
      schoolId: course.schoolId,
      courseId,
    })
    pushActivity(draft, {
      type: 'course_payment_validated',
      actorId: learnerId,
      schoolId: course.schoolId,
      courseId,
      meta: { amount: course.priceDA, learnerId },
    })
  })
  return { ok: true }
}

export function requestManualEnrollment({ courseId, learnerId, reference, proofName, proofDataUrl }) {
  const state = getState()
  const course = getCourse(state, courseId)
  if (!course) return { ok: false, error: 'not-found' }
  if (course.isFree) return { ok: false, error: 'not-free' }
  if (course.status !== 'published') return { ok: false, error: 'not-published' }
  const school = getSchool(state, course.schoolId)
  if (!school?.paymentSettings?.manual?.enabled) return { ok: false, error: 'manual-disabled' }
  const existing = state.enrollments.find(
    (item) => item.courseId === courseId && item.learnerId === learnerId,
  )
  if (existing?.status === 'active') return { ok: false, error: 'already-enrolled' }
  const pendingPayment = state.coursePayments.find(
    (item) => item.courseId === courseId && item.learnerId === learnerId && item.status === 'pending',
  )
  if (pendingPayment) return { ok: false, error: 'already-pending' }
  const usage = getPlanUsage(state, course.schoolId)
  if (!usage.canAddLearner) return { ok: false, error: 'learner-limit' }
  updateState((draft) => {
    let enrollment = draft.enrollments.find(
      (item) => item.courseId === courseId && item.learnerId === learnerId,
    )
    if (!enrollment) {
      enrollment = {
        id: uid('enr'),
        courseId,
        schoolId: course.schoolId,
        learnerId,
        status: 'pending',
        source: 'manual',
        enrolledAt: nowIso(),
        updatedAt: nowIso(),
      }
      draft.enrollments.push(enrollment)
    } else {
      enrollment.status = 'pending'
      enrollment.source = 'manual'
      enrollment.updatedAt = nowIso()
    }
    draft.coursePayments.unshift({
      id: uid('cpy'),
      enrollmentId: enrollment.id,
      courseId,
      schoolId: course.schoolId,
      learnerId,
      amount: course.priceDA,
      method: 'manual',
      provider: 'ccp',
      status: 'pending',
      reference,
      proofName: proofName || null,
      proofDataUrl: proofDataUrl || null,
      submittedAt: nowIso(),
      reviewedAt: null,
      rejectionReason: null,
      refundedAt: null,
    })
    pushActivity(draft, {
      type: 'course_payment_pending',
      actorId: learnerId,
      schoolId: course.schoolId,
      courseId,
      meta: { amount: course.priceDA },
    })
  })
  return { ok: true }
}

export function approveCoursePayment(paymentId, reviewerId) {
  const state = getState()
  const payment = getCoursePayment(state, paymentId)
  if (!payment) return { ok: false, error: 'not-found' }
  const course = getCourse(state, payment.courseId)
  updateState((draft) => {
    const target = draft.coursePayments.find((item) => item.id === paymentId)
    target.status = 'validated'
    target.reviewedAt = nowIso()
    target.rejectionReason = null
    if (target.enrollmentId) {
      const enrollment = draft.enrollments.find((item) => item.id === target.enrollmentId)
      if (enrollment) {
        enrollment.status = 'active'
        enrollment.updatedAt = nowIso()
        enrollment.enrolledAt = enrollment.enrolledAt || nowIso()
      }
    }
    pushActivity(draft, {
      type: 'course_payment_validated',
      actorId: reviewerId,
      schoolId: target.schoolId,
      courseId: target.courseId,
      meta: { amount: target.amount, learnerId: target.learnerId },
    })
    if (course) {
      pushActivity(draft, {
        type: 'enrollment_created',
        actorId: target.learnerId,
        schoolId: target.schoolId,
        courseId: target.courseId,
      })
    }
  })
  return { ok: true }
}

export function rejectCoursePayment(paymentId, reason, reviewerId) {
  const state = getState()
  const payment = getCoursePayment(state, paymentId)
  if (!payment) return { ok: false, error: 'not-found' }
  updateState((draft) => {
    const target = draft.coursePayments.find((item) => item.id === paymentId)
    target.status = 'rejected'
    target.reviewedAt = nowIso()
    target.rejectionReason = reason || ''
    if (target.enrollmentId) {
      const enrollment = draft.enrollments.find((item) => item.id === target.enrollmentId)
      if (enrollment) {
        enrollment.status = 'rejected'
        enrollment.updatedAt = nowIso()
      }
    }
    pushActivity(draft, {
      type: 'course_payment_rejected',
      actorId: reviewerId,
      schoolId: target.schoolId,
      courseId: target.courseId,
      meta: { learnerId: target.learnerId },
    })
  })
  return { ok: true }
}

export function refundCoursePayment(paymentId, reviewerId) {
  const state = getState()
  const payment = getCoursePayment(state, paymentId)
  if (!payment) return { ok: false, error: 'not-found' }
  updateState((draft) => {
    const target = draft.coursePayments.find((item) => item.id === paymentId)
    target.status = 'refunded'
    target.refundedAt = nowIso()
    pushActivity(draft, {
      type: 'course_payment_refunded',
      actorId: reviewerId,
      schoolId: target.schoolId,
      courseId: target.courseId,
      meta: { amount: target.amount },
    })
  })
  return { ok: true }
}

export function suspendLearner(learnerId, trainerId) {
  const state = getState()
  const learner = state.users.find((user) => user.id === learnerId)
  if (!learner) return { ok: false, error: 'not-found' }
  updateState((draft) => {
    const target = draft.users.find((user) => user.id === learnerId)
    target.status = 'suspended'
    pushActivity(draft, { type: 'learner_suspended', actorId: trainerId, schoolId: learner.schoolId })
  })
  return { ok: true }
}

export function reactivateLearner(learnerId, trainerId) {
  const state = getState()
  const learner = state.users.find((user) => user.id === learnerId)
  if (!learner) return { ok: false, error: 'not-found' }
  updateState((draft) => {
    const target = draft.users.find((user) => user.id === learnerId)
    target.status = 'active'
    pushActivity(draft, { type: 'learner_reactivated', actorId: trainerId, schoolId: learner.schoolId })
  })
  return { ok: true }
}

export function manualEnroll({ schoolId, courseId, email }, trainerId) {
  const state = getState()
  const course = getCourse(state, courseId)
  if (!course || course.schoolId !== schoolId) return { ok: false, error: 'not-found' }
  const learner = findUserByEmail(state, email)
  if (!learner || learner.role !== 'learner') return { ok: false, error: 'learner-not-found' }
  if (learner.status === 'suspended') return { ok: false, error: 'learner-suspended' }
  const existing = state.enrollments.find(
    (item) => item.courseId === courseId && item.learnerId === learner.id,
  )
  if (existing?.status === 'active') return { ok: false, error: 'already-enrolled' }
  const usage = getPlanUsage(state, schoolId)
  if (!usage.canAddLearner && existing?.status !== 'active') return { ok: false, error: 'learner-limit' }
  updateState((draft) => {
    let enrollment = draft.enrollments.find(
      (item) => item.courseId === courseId && item.learnerId === learner.id,
    )
    if (enrollment) {
      enrollment.status = 'active'
      enrollment.source = 'manual'
      enrollment.updatedAt = nowIso()
    } else {
      enrollment = {
        id: uid('enr'),
        courseId,
        schoolId,
        learnerId: learner.id,
        status: 'active',
        source: 'manual',
        enrolledAt: nowIso(),
        updatedAt: nowIso(),
      }
      draft.enrollments.push(enrollment)
    }
    pushActivity(draft, {
      type: 'enrollment_created',
      actorId: trainerId,
      schoolId,
      courseId,
      meta: { learnerId: learner.id },
    })
  })
  return { ok: true, learner }
}

export function addComment({ lessonId, userId, content, parentId = null }) {
  const state = getState()
  const lesson = getLesson(state, lessonId)
  if (!lesson) return { ok: false, error: 'not-found' }
  const course = getCourse(state, lesson.courseId)
  if (!course) return { ok: false, error: 'not-found' }
  if (!course.commentsEnabled) return { ok: false, error: 'comments-disabled' }
  const school = getSchool(state, course.schoolId)
  const user = state.users.find((item) => item.id === userId)
  const isTrainer = user?.role === 'trainer' && school?.trainerId === userId
  const enrollment = state.enrollments.find(
    (item) => item.courseId === course.id && item.learnerId === userId && item.status === 'active',
  )
  if (!isTrainer && !enrollment) return { ok: false, error: 'not-enrolled' }
  const comment = {
    id: uid('cmt'),
    lessonId,
    courseId: course.id,
    schoolId: course.schoolId,
    userId,
    parentId,
    content: String(content).trim(),
    status: 'visible',
    reported: false,
    createdAt: nowIso(),
  }
  updateState((draft) => {
    draft.comments.push(comment)
    pushActivity(draft, {
      type: 'comment_created',
      actorId: userId,
      schoolId: course.schoolId,
      courseId: course.id,
      meta: { lessonId },
    })
  })
  return { ok: true, comment }
}

export function deleteComment(commentId) {
  updateState((draft) => {
    const comment = draft.comments.find((item) => item.id === commentId)
    if (comment) comment.status = 'deleted'
  })
  return { ok: true }
}

export function replyToReview(reviewId, reply) {
  updateState((draft) => {
    const review = draft.reviews.find((item) => item.id === reviewId)
    if (review) {
      review.trainerReplyFr = reply
      review.trainerReplyAr = reply
      review.trainerRepliedAt = nowIso()
    }
  })
  return { ok: true }
}

export function reportComment(commentId) {
  updateState((draft) => {
    const comment = draft.comments.find((item) => item.id === commentId)
    if (comment) {
      comment.reported = true
      comment.status = 'reported'
    }
  })
  return { ok: true }
}

export function setCommentStatus(commentId, status) {
  updateState((draft) => {
    const comment = draft.comments.find((item) => item.id === commentId)
    if (comment) {
      comment.status = status
      if (status === 'visible') comment.reported = false
    }
  })
  return { ok: true }
}

export function saveAnnouncement(data, announcementId = null) {
  const state = getState()
  const now = nowIso()
  if (announcementId) {
    updateState((draft) => {
      const announcement = draft.announcements.find((item) => item.id === announcementId)
      if (announcement) {
        Object.assign(announcement, {
          ...data,
          audience: data.courseId ? 'course' : 'all',
          updatedAt: now,
        })
      }
    })
    return { ok: true, id: announcementId }
  }
  const announcement = {
    id: uid('ann'),
    ...data,
    audience: data.courseId ? 'course' : 'all',
    status: 'draft',
    publishedAt: null,
    createdAt: now,
    readBy: [],
  }
  updateState((draft) => {
    draft.announcements.unshift(announcement)
    pushActivity(draft, {
      type: 'announcement_created',
      actorId: data.authorId,
      schoolId: data.schoolId,
      courseId: data.courseId || null,
    })
  })
  void state
  return { ok: true, id: announcement.id }
}

export function publishAnnouncement(announcementId) {
  updateState((draft) => {
    const announcement = draft.announcements.find((item) => item.id === announcementId)
    if (announcement) {
      announcement.status = 'published'
      announcement.publishedAt = nowIso()
    }
  })
  return { ok: true }
}

export function unpublishAnnouncement(announcementId) {
  updateState((draft) => {
    const announcement = draft.announcements.find((item) => item.id === announcementId)
    if (announcement) {
      announcement.status = 'draft'
      announcement.publishedAt = null
    }
  })
  return { ok: true }
}

export function deleteAnnouncement(announcementId) {
  updateState((draft) => {
    draft.announcements = draft.announcements.filter((item) => item.id !== announcementId)
  })
  return { ok: true }
}

export function markAnnouncementRead(announcementId, userId) {
  updateState((draft) => {
    const announcement = draft.announcements.find((item) => item.id === announcementId)
    if (announcement) {
      announcement.readBy = announcement.readBy || []
      if (!announcement.readBy.includes(userId)) announcement.readBy.push(userId)
    }
  })
  return { ok: true }
}

export function saveEvent(data, eventId = null) {
  if (eventId) {
    updateState((draft) => {
      const event = draft.events.find((item) => item.id === eventId)
      if (event) Object.assign(event, data)
    })
    return { ok: true, id: eventId }
  }
  const event = {
    id: uid('evt'),
    ...data,
    status: data.status || 'scheduled',
    createdAt: nowIso(),
  }
  updateState((draft) => {
    draft.events.push(event)
    pushActivity(draft, {
      type: 'event_created',
      actorId: data.trainerId,
      schoolId: data.schoolId,
      courseId: data.courseId || null,
    })
  })
  return { ok: true, id: event.id }
}

export function cancelEvent(eventId) {
  updateState((draft) => {
    const event = draft.events.find((item) => item.id === eventId)
    if (event) event.status = 'cancelled'
  })
  return { ok: true }
}

export function rescheduleEvent(eventId, startAt) {
  updateState((draft) => {
    const event = draft.events.find((item) => item.id === eventId)
    if (event) {
      event.startAt = startAt
      event.status = 'scheduled'
      event.rescheduled = true
    }
  })
  return { ok: true }
}

export function deleteEvent(eventId) {
  updateState((draft) => {
    draft.events = draft.events.filter((item) => item.id !== eventId)
  })
  return { ok: true }
}

export function updateSchoolPaymentSettings(schoolId, paymentSettings) {
  return updateSchool(schoolId, { paymentSettings })
}

export function testChargerlyConnection(schoolId) {
  const state = getState()
  const school = getSchool(state, schoolId)
  if (!school) return { ok: false, error: 'not-found' }
  const accountName = school.paymentSettings?.chargerly?.accountName
  const status = accountName ? 'connected' : 'invalid'
  updateState((draft) => {
    const target = draft.schools.find((item) => item.id === schoolId)
    target.paymentSettings.chargerly.status = status
  })
  return { ok: status === 'connected', status }
}

export function updatePlan(planId, patch) {
  updateState((draft) => {
    const plan = draft.plans.find((item) => item.id === planId)
    if (plan) {
      Object.assign(plan, patch)
      if (patch.limits) plan.limits = { ...plan.limits, ...patch.limits }
    }
    pushActivity(draft, { type: 'plan_updated', actorId: 'u-admin', schoolId: null, meta: { planId } })
  })
  return { ok: true }
}

export function togglePlan(planId, enabled) {
  return updatePlan(planId, { enabled })
}

export function updatePlatformSettings(patch) {
  updateState((draft) => {
    draft.platformSettings = { ...draft.platformSettings, ...patch }
  })
  return { ok: true }
}

export function updateSupportRequestStatus(requestId, status) {
  updateState((draft) => {
    const request = draft.supportRequests.find((item) => item.id === requestId)
    if (request) {
      request.status = status
      request.updatedAt = nowIso()
    }
  })
  return { ok: true }
}

export function resetDemoData() {
  resetStore()
}

export function getSubscriptionAccessState(state, userId) {
  const profile = getTrainerProfile(state, userId)
  const subscription = getTrainerSubscription(state, userId)
  if (!profile?.schoolId) return { state: 'no-school', subscription: null, profile }
  if (!subscription) return { state: 'none', subscription: null, profile }
  if (subscription.status === 'pending') return { state: 'pending', subscription, profile }
  if (subscription.status === 'rejected') return { state: 'rejected', subscription, profile }
  if (subscription.status === 'cancelled') return { state: 'cancelled', subscription, profile }
  if (subscription.status === 'expired' || (subscription.endsAt && new Date(subscription.endsAt) <= new Date()))
    return { state: 'expired', subscription, profile }
  if (isSubscriptionActive(subscription)) return { state: 'active', subscription, profile }
  return { state: 'none', subscription, profile }
}
