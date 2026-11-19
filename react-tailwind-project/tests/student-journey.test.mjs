import test from 'node:test'
import assert from 'node:assert/strict'
import { getState, resetStore } from '../src/data/store.js'
import {
  approveCoursePayment,
  demoLogin,
  enrollFree,
  login,
  registerLearner,
  requestManualEnrollment,
  submitCourseOnlinePayment,
} from '../src/data/services.js'
import {
  getAnnouncementsForLearner,
  getCoursePaymentOptions,
  getLearnerEnrollments,
  getLearnerEvents,
  getLearnerPaymentRows,
  getUnreadAnnouncements,
} from '../src/data/selectors.js'

const PASSWORD = 'Passw0rd!'
const DEMO_PASSWORD = 'demo1234'

function freshSchool(schoolId = 's-nour') {
  resetStore()
  const state = getState()
  return { state, school: state.schools.find((item) => item.id === schoolId) }
}

function uniqueEmail(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.dz`
}

function createLearner(school) {
  const email = uniqueEmail('student')
  const result = registerLearner({ name: 'Test Learner', email, password: PASSWORD, schoolSlug: school.slug })
  assert.equal(result.ok, true, result.error)
  return { email, user: result.user }
}

function loginLearner(email, school) {
  const result = login(email, PASSWORD, { roles: ['learner'], schoolId: school.id })
  assert.equal(result.ok, true, result.error)
  return result.user
}

function getPublishedCourse(state, schoolId, predicate) {
  return state.courses.find((item) => item.schoolId === schoolId && item.status === 'published' && predicate(item))
}

test('every seeded school has a student demo and usable published courses', () => {
  resetStore()
  const state = getState()
  for (const school of state.schools) {
    const learner = state.users.find((user) => user.role === 'learner' && user.schoolId === school.id)
    assert.ok(learner, `expected a demo learner for ${school.slug}`)
    assert.ok(state.courses.some((course) => course.schoolId === school.id && course.status === 'published'), `expected a published course for ${school.slug}`)
    assert.ok(state.subscriptions.some((subscription) => subscription.trainerId === school.trainerId && subscription.status === 'active'), `expected an active subscription for ${school.slug}`)
    assert.equal(demoLogin(learner.id, { roles: ['learner'], schoolId: school.id }).ok, true)
  }
})

test('Nour demo learner has payments, calendar, and announcements data', () => {
  resetStore()
  const state = getState()
  const learner = state.users.find((user) => user.id === 'u-l1')
  assert.ok(learner, 'expected the Nour demo learner')
  assert.ok(learner.phone, 'expected demo profile details')

  const payments = getLearnerPaymentRows(state, learner.id)
  assert.ok(payments.some((row) => row.payment.status === 'validated'), 'expected a validated payment')
  assert.ok(payments.some((row) => row.payment.status === 'pending'), 'expected a pending payment')

  const attempts = state.quizAttempts.filter((attempt) => attempt.learnerId === learner.id)
  assert.ok(attempts.length >= 4, 'expected several quiz attempts')
  assert.ok(attempts.some((attempt) => attempt.passed), 'expected a passed quiz')
  assert.ok(attempts.some((attempt) => !attempt.passed), 'expected a failed quiz')

  const events = getLearnerEvents(state, learner.id)
  assert.ok(events.some((event) => event.status !== 'cancelled' && new Date(event.startAt) >= new Date()), 'expected an upcoming event')
  assert.ok(events.some((event) => event.status !== 'cancelled' && new Date(event.startAt) < new Date()), 'expected a past event')
  assert.ok(events.some((event) => event.status === 'cancelled'), 'expected a cancelled event')

  const announcements = getAnnouncementsForLearner(state, learner.id)
  assert.ok(announcements.length >= 4, 'expected several learner announcements')
  assert.ok(getUnreadAnnouncements(state, learner.id).length >= 1, 'expected an unread announcement')
})

test('school-scoped learner auth replaces a trainer session', () => {
  const { state, school } = freshSchool()
  const trainer = state.users.find((user) => user.role === 'trainer' && user.schoolId === school.id)
  assert.ok(trainer, 'expected a trainer for the school')
  const trainerLogin = login(trainer.email, DEMO_PASSWORD, { roles: ['trainer', 'admin'] })
  assert.equal(trainerLogin.ok, true, trainerLogin.error)
  const trainerSession = getState().session.userId
  assert.equal(trainerSession, trainer.id)

  const rejected = login(trainer.email, DEMO_PASSWORD, { roles: ['learner'], schoolId: school.id })
  assert.equal(rejected.error, 'role-not-allowed')
  assert.equal(getState().session.userId, trainerSession)

  const learner = state.users.find((user) => user.role === 'learner' && user.schoolId === school.id)
  assert.ok(learner, 'expected a learner for the school')
  const learnerLogin = login(learner.email, DEMO_PASSWORD, { roles: ['learner'], schoolId: school.id })
  assert.equal(learnerLogin.ok, true, learnerLogin.error)
  assert.equal(getState().session.userId, learner.id)

  const registered = registerLearner({ name: 'Switch Learner', email: uniqueEmail('switch'), password: PASSWORD, schoolSlug: school.slug })
  assert.equal(registered.ok, true, registered.error)
  assert.equal(getState().session.userId, registered.user.id)
})

test('registration is school scoped and new learners have zero courses', () => {
  const { state, school } = freshSchool()
  const otherSchool = state.schools.find((item) => item.id !== school.id)
  const email = uniqueEmail('scope')

  const registered = registerLearner({ name: 'Scope Learner', email, password: PASSWORD, schoolSlug: school.slug })
  assert.equal(registered.ok, true, registered.error)
  assert.equal(registered.user.role, 'learner')
  assert.equal(registered.user.schoolId, school.id)
  assert.equal(getLearnerEnrollments(getState(), registered.user.id).length, 0)

  const duplicate = registerLearner({ name: 'Duplicate', email, password: PASSWORD, schoolSlug: school.slug })
  assert.equal(duplicate.error, 'email-taken')

  const wrongSchool = login(email, PASSWORD, { roles: ['learner'], schoolId: otherSchool.id })
  assert.equal(wrongSchool.error, 'school-not-allowed')

  const otherSchoolRegistration = registerLearner({ name: 'Other Learner', email, password: PASSWORD, schoolSlug: otherSchool.slug })
  assert.equal(otherSchoolRegistration.ok, true, otherSchoolRegistration.error)
  assert.equal(otherSchoolRegistration.user.schoolId, otherSchool.id)

  loginLearner(email, school)
})

test('free enrollment requires the session learner and blocks cross-school or duplicate access', () => {
  const { state, school } = freshSchool()
  const course = getPublishedCourse(state, school.id, (item) => item.isFree)
  assert.ok(course, 'expected a published free course')
  const learner = createLearner(school)
  const trainer = state.users.find((item) => item.role === 'trainer' && item.schoolId === school.id)
  assert.ok(trainer, 'expected a trainer for the school')

  demoLogin(trainer.id, { roles: ['trainer'] })
  const unauthorized = enrollFree(course.id, learner.user.id)
  assert.equal(unauthorized.error, 'unauthorized')

  loginLearner(learner.email, school)
  const enrolled = enrollFree(course.id, learner.user.id)
  assert.equal(enrolled.ok, true, enrolled.error)

  const duplicate = enrollFree(course.id, learner.user.id)
  assert.equal(duplicate.error, 'already-enrolled')

  const crossSchoolCourse = getPublishedCourse(state, state.schools.find((item) => item.id !== school.id).id, (item) => item.isFree)
  assert.ok(crossSchoolCourse, 'expected a free course in another school')
  const crossSchool = enrollFree(crossSchoolCourse.id, learner.user.id)
  assert.equal(crossSchool.error, 'school-not-allowed')
})

test('online payment enrolls once and rejects duplicates', () => {
  const { state, school } = freshSchool()
  const course = getPublishedCourse(state, school.id, (item) => !item.isFree && item.priceDA > 0)
  assert.ok(course, 'expected a published paid course')
  assert.ok(getCoursePaymentOptions(state, school).some((option) => option.group === 'online'))
  const learner = createLearner(school)
  loginLearner(learner.email, school)

  const paid = submitCourseOnlinePayment({ courseId: course.id, learnerId: learner.user.id, outcome: 'success' })
  assert.equal(paid.ok, true, paid.error)
  assert.ok(paid.payment?.reference)

  const current = getState()
  const payment = current.coursePayments.find((item) => item.courseId === course.id && item.learnerId === learner.user.id)
  assert.equal(payment.status, 'validated')
  const enrollment = current.enrollments.find((item) => item.courseId === course.id && item.learnerId === learner.user.id)
  assert.equal(enrollment.status, 'active')

  const duplicate = submitCourseOnlinePayment({ courseId: course.id, learnerId: learner.user.id, outcome: 'success' })
  assert.equal(duplicate.error, 'already-enrolled')
})

test('manual payment stays pending, requires trusted reviewer approval, and auto-enrolls', () => {
  const { state, school } = freshSchool()
  const course = getPublishedCourse(state, school.id, (item) => !item.isFree && item.priceDA > 0)
  assert.ok(course, 'expected a published paid course')
  const manualOption = getCoursePaymentOptions(state, school).find((option) => option.group === 'manual' && option.id !== 'cash' && option.id !== 'inPerson')
  assert.ok(manualOption, 'expected a configured manual payment method')
  const learner = createLearner(school)
  loginLearner(learner.email, school)

  const missingReference = requestManualEnrollment({ courseId: course.id, learnerId: learner.user.id, method: manualOption.id })
  assert.equal(missingReference.error, 'reference-required')

  const pending = requestManualEnrollment({ courseId: course.id, learnerId: learner.user.id, method: manualOption.id, reference: 'MAN-12345' })
  assert.equal(pending.ok, true, pending.error)

  const current = getState()
  const payment = current.coursePayments.find((item) => item.courseId === course.id && item.learnerId === learner.user.id)
  assert.equal(payment.status, 'pending')
  assert.equal(payment.proofDataUrl, null)
  const enrollment = current.enrollments.find((item) => item.courseId === course.id && item.learnerId === learner.user.id)
  assert.equal(enrollment.status, 'pending')

  const duplicate = requestManualEnrollment({ courseId: course.id, learnerId: learner.user.id, method: manualOption.id, reference: 'MAN-99999' })
  assert.equal(duplicate.error, 'already-pending')

  const wrongTrainer = getState().users.find((item) => item.role === 'trainer' && item.schoolId && item.schoolId !== school.id)
  assert.ok(wrongTrainer, 'expected a trainer in another school')
  demoLogin(wrongTrainer.id, { roles: ['trainer'] })
  const unauthorizedApproval = approveCoursePayment(payment.id, wrongTrainer.id)
  assert.equal(unauthorizedApproval.error, 'not-allowed')

  const trainer = getState().users.find((item) => item.role === 'trainer' && item.schoolId === school.id)
  assert.ok(trainer, 'expected a trainer for the school')
  demoLogin(trainer.id, { roles: ['trainer'] })
  const approved = approveCoursePayment(payment.id, trainer.id)
  assert.equal(approved.ok, true, approved.error)

  const approvedState = getState()
  assert.equal(approvedState.coursePayments.find((item) => item.id === payment.id).status, 'validated')
  assert.equal(approvedState.enrollments.find((item) => item.id === enrollment.id).status, 'active')
})

test('cash payment can be submitted without proof or reference', () => {
  const { state, school } = freshSchool()
  const course = getPublishedCourse(state, school.id, (item) => !item.isFree && item.priceDA > 0)
  assert.ok(course, 'expected a published paid course')
  assert.ok(getCoursePaymentOptions(state, school).some((option) => option.group === 'manual' && option.id === 'cash'))
  const learner = createLearner(school)
  loginLearner(learner.email, school)

  const pending = requestManualEnrollment({ courseId: course.id, learnerId: learner.user.id, method: 'cash' })
  assert.equal(pending.ok, true, pending.error)

  const payment = getState().coursePayments.find((item) => item.courseId === course.id && item.learnerId === learner.user.id)
  assert.equal(payment.status, 'pending')
  assert.equal(payment.reference, undefined)
})
