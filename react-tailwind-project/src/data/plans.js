export const PLAN_CODES = {
  STARTER: 'starter',
  BUSINESS: 'business',
}

export const PLAN_FEATURE_KEYS = [
  'publicSchoolSite',
  'manualPayments',
  'onlinePayments',
  'liveSessions',
  'calendar',
  'prioritySupport',
]

export const PLAN_LIMIT_KEYS = ['publishedCourses', 'paidCourses', 'learners', 'storageGb', 'trainers']

export const PLAN_CATALOG = [
  {
    id: 'plan-starter',
    code: PLAN_CODES.STARTER,
    nameFr: 'Démarrage',
    nameAr: 'البداية',
    descFr: 'Pour les formateurs individuels qui lancent leur école en ligne.',
    descAr: 'للمدربين الأفراد الذين يطلقون مدرستهم على الإنترنت.',
    priceDA: 2900,
    period: 'month',
    order: 1,
    enabled: true,
    recommended: false,
    limits: {
      publishedCourses: 5,
      paidCourses: 5,
      learners: 50,
      storageGb: 2,
      trainers: 1,
    },
    features: {
      publicSchoolSite: true,
      manualPayments: true,
      onlinePayments: true,
      liveSessions: false,
      calendar: false,
      prioritySupport: false,
    },
  },
  {
    id: 'plan-business',
    code: PLAN_CODES.BUSINESS,
    nameFr: 'Business',
    nameAr: 'الأعمال',
    descFr: 'Pour les formateurs professionnels qui gèrent une école en croissance.',
    descAr: 'للمدربين المحترفين الذين يديرون مدرسة متنامية.',
    priceDA: 9900,
    period: 'month',
    order: 2,
    enabled: true,
    recommended: true,
    limits: {
      publishedCourses: 50,
      paidCourses: 50,
      learners: 500,
      storageGb: 50,
      trainers: 1,
    },
    features: {
      publicSchoolSite: true,
      manualPayments: true,
      onlinePayments: true,
      liveSessions: true,
      calendar: true,
      prioritySupport: true,
    },
  },
]

export function createPlanRecords() {
  return structuredClone(PLAN_CATALOG)
}

export function getCatalogPlan(idOrCode) {
  return (
    PLAN_CATALOG.find((plan) => plan.id === idOrCode || plan.code === idOrCode) ||
    null
  )
}

export function getPlanName(plan, language = 'fr') {
  if (!plan) return ''
  if (language === 'ar') return plan.nameAr || plan.nameFr || ''
  return plan.nameFr || plan.nameAr || ''
}

export function getPlanDescription(plan, language = 'fr') {
  if (!plan) return ''
  if (language === 'ar') return plan.descAr || plan.descFr || ''
  return plan.descFr || plan.descAr || ''
}

export function hasPlanFeature(plan, feature) {
  return Boolean(plan?.features?.[feature])
}
