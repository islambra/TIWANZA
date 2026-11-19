import test from 'node:test'
import assert from 'node:assert/strict'
import { createPlanRecords } from '../src/data/plans.js'
import { migrateState } from '../src/data/seed.js'
import { getState, resetStore } from '../src/data/store.js'
import {
  canUsePlanFeature,
  getPlan,
  getPlanUsage,
  getTrainerProfile,
  getTrainerSubscription,
} from '../src/data/selectors.js'
import {
  createCourse,
  saveEvent,
  submitSubscriptionOnline,
  updatePlan,
} from '../src/data/services.js'

function freshState() {
  resetStore()
  return getState()
}

function setActivePlan(userId, planId) {
  const result = submitSubscriptionOnline({ userId, planId, outcome: 'success' })
  assert.equal(result.ok, true, result.error)
  return getState()
}

test('catalog contains exactly two paid monthly plans with the configured prices and limits', () => {
  const plans = createPlanRecords()
  assert.deepEqual(plans.map((plan) => plan.id), ['plan-starter', 'plan-business'])
  assert.deepEqual(plans.map((plan) => plan.priceDA), [2900, 9900])
  assert.ok(plans.every((plan) => plan.period === 'month'))
  assert.deepEqual(plans[0].limits, {
    publishedCourses: 5,
    paidCourses: 5,
    learners: 50,
    storageGb: 2,
    trainers: 1,
  })
  assert.deepEqual(plans[1].limits, {
    publishedCourses: 50,
    paidCourses: 50,
    learners: 500,
    storageGb: 50,
    trainers: 1,
  })
  assert.equal(plans[0].features.calendar, false)
  assert.equal(plans[1].features.calendar, true)
  assert.equal(plans[0].features.liveSessions, false)
  assert.equal(plans[1].features.liveSessions, true)
  assert.equal(plans[0].features.prioritySupport, false)
  assert.equal(plans[1].features.prioritySupport, true)
})

test('paid subscription validation rejects legacy or free plans', () => {
  const state = freshState()
  const rejected = submitSubscriptionOnline({ userId: 'u-t1', planId: 'plan-pro', outcome: 'success' })
  assert.equal(rejected.ok, false)
  assert.equal(rejected.error, 'plan-not-found')

  state.plans.push({
    ...structuredClone(state.plans[0]),
    id: 'plan-free',
    code: 'free',
    priceDA: 0,
    order: 3,
  })
  const freeRejected = submitSubscriptionOnline({ userId: 'u-t1', planId: 'plan-free', outcome: 'success' })
  assert.equal(freeRejected.ok, false)
  assert.equal(freeRejected.error, 'plan-not-allowed')
})

test('active plan controls limits, features, and course creation', () => {
  freshState()
  let state = setActivePlan('u-t1', 'plan-starter')
  let profile = getTrainerProfile(state, 'u-t1')
  let subscription = getTrainerSubscription(state, 'u-t1')
  let usage = getPlanUsage(state, profile.schoolId)
  assert.equal(subscription.planId, 'plan-starter')
  assert.equal(subscription.amount, 2900)
  assert.equal(usage.active, true)
  assert.equal(usage.limits.learners, 50)
  assert.equal(canUsePlanFeature(state, profile.schoolId, 'calendar'), false)
  assert.equal(canUsePlanFeature(state, profile.schoolId, 'prioritySupport'), false)

  const eventBlocked = saveEvent({
    schoolId: profile.schoolId,
    trainerId: 'u-t1',
    title: 'Atelier',
    type: 'workshop',
    startAt: '2026-12-01T10:00:00.000Z',
  })
  assert.equal(eventBlocked.ok, false)
  assert.equal(eventBlocked.error, 'feature-not-in-plan')

  assert.equal(createCourse({ schoolId: profile.schoolId, trainerId: 'u-t1', data: { title: 'Cours A' } }).ok, true)
  const courseBlocked = createCourse({ schoolId: profile.schoolId, trainerId: 'u-t1', data: { title: 'Cours B' } })
  assert.equal(courseBlocked.ok, false)
  assert.equal(courseBlocked.error, 'course-limit')

  state = setActivePlan('u-t1', 'plan-business')
  profile = getTrainerProfile(state, 'u-t1')
  subscription = getTrainerSubscription(state, 'u-t1')
  usage = getPlanUsage(state, profile.schoolId)
  assert.equal(subscription.planId, 'plan-business')
  assert.equal(subscription.amount, 9900)
  assert.equal(usage.limits.learners, 500)
  assert.equal(canUsePlanFeature(state, profile.schoolId, 'calendar'), true)
  assert.equal(canUsePlanFeature(state, profile.schoolId, 'prioritySupport'), true)

  const eventSaved = saveEvent({
    schoolId: profile.schoolId,
    trainerId: 'u-t1',
    title: 'Atelier',
    type: 'workshop',
    startAt: '2026-12-01T10:00:00.000Z',
  })
  assert.equal(eventSaved.ok, true)
  assert.equal(createCourse({ schoolId: profile.schoolId, trainerId: 'u-t1', data: { title: 'Cours C' } }).ok, true)
})

test('legacy plan records migrate to Starter or Business with paid amounts', () => {
  const migrated = migrateState({
    version: 3,
    trainerProfiles: [{ id: 'tp-legacy', userId: 'u-t1', schoolId: 's-nour', planId: 'plan-pro' }],
    subscriptions: [{ id: 'sub-legacy', trainerId: 'u-t1', planId: 'plan-pro', amount: 0, status: 'active' }],
    subscriptionPayments: [{ id: 'sp-legacy', trainerId: 'u-t1', planId: 'pro', amount: 0, status: 'validated' }],
    onboardingDrafts: { 'u-t1': { selectedPlanId: 'pro' } },
    activity: [{ id: 'act-legacy', type: 'subscription_free', createdAt: '2026-01-01T00:00:00.000Z' }],
    supportRequests: [{ id: 'sr-legacy', subject: 'Question plan Pro', status: 'open' }],
  })

  assert.equal(migrated.version, 7)
  assert.deepEqual(migrated.plans.map((plan) => plan.id), ['plan-starter', 'plan-business'])
  assert.equal(migrated.trainerProfiles.find((item) => item.id === 'tp-legacy').planId, 'plan-starter')
  assert.equal(migrated.subscriptions.find((item) => item.id === 'sub-legacy').planId, 'plan-starter')
  assert.equal(migrated.subscriptions.find((item) => item.id === 'sub-legacy').amount, 2900)
  assert.equal(migrated.subscriptionPayments.find((item) => item.id === 'sp-legacy').amount, 2900)
  assert.equal(migrated.onboardingDrafts['u-t1'].selectedPlanId, 'plan-starter')
  assert.equal(migrated.activity.find((item) => item.id === 'act-legacy').type, 'subscription_activated')
  assert.match(migrated.supportRequests.find((item) => item.id === 'sr-legacy').subject, /Business/)
})

test('admin plan editor only accepts paid monthly catalog plans', () => {
  const state = freshState()
  const starter = getPlan(state, 'plan-starter')
  const business = getPlan(state, 'plan-business')

  assert.equal(updatePlan(business.id, { ...business, priceDA: 0 }).ok, false)
  assert.equal(updatePlan(business.id, { ...business, period: 'year' }).ok, false)
  assert.equal(updatePlan(business.id, { ...business, priceDA: 12900 }).ok, true)
  assert.equal(getPlan(getState(), business.id).priceDA, 12900)
  assert.equal(updatePlan(starter.id, { ...starter, code: 'pro' }).ok, false)
})
