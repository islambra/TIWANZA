export const COURSE_ONLINE_METHODS = ['edahabia', 'cib']
export const COURSE_MANUAL_METHODS = ['ccp', 'baridimob', 'bankTransfer', 'cash', 'inPerson']
export const SUBSCRIPTION_MANUAL_METHODS = ['ccpRip', 'bankTransfer', 'cash']

const LABEL_KEYS = {
  chargily: 'payments.chargily',
  online: 'payments.online',
  manual: 'payments.manual',
  edahabia: 'payments.edahabia',
  cib: 'payments.cib',
  ccp: 'payments.ccp',
  baridimob: 'payments.baridimob',
  bankTransfer: 'payments.bankTransfer',
  cash: 'payments.cash',
  inPerson: 'payments.inPerson',
  ccpRip: 'payments.ccpRip',
}

const DESCRIPTION_KEYS = {
  chargily: 'payments.chargilyDesc',
  online: 'payments.onlineDesc',
  manual: 'payments.manualDesc',
  edahabia: 'payments.edahabiaDesc',
  cib: 'payments.cibDesc',
  ccp: 'payments.ccpDesc',
  baridimob: 'payments.baridimobDesc',
  bankTransfer: 'payments.bankTransferDesc',
  cash: 'payments.cashDesc',
  inPerson: 'payments.inPersonDesc',
  ccpRip: 'payments.ccpRipDesc',
}

export function paymentMethodLabelKey(method) {
  return LABEL_KEYS[method] || 'payments.manual'
}

export function paymentMethodDescriptionKey(method) {
  return DESCRIPTION_KEYS[method] || 'payments.manualDesc'
}

export function displayPaymentMethod(payment) {
  if (!payment) return 'manual'
  if (payment.method === 'online' && payment.cardType) return payment.cardType
  if (payment.method === 'online' && ['cib', 'edahabia'].includes(payment.provider)) return payment.provider
  return payment.provider || payment.method
}

export function defaultSchoolPaymentSettings() {
  return {
    chargerly: {
      status: 'disconnected',
      mode: 'test',
      accountName: '',
      edahabia: true,
      cib: true,
    },
    manual: {
      enabled: false,
      ccp: '',
      baridimob: '',
      beneficiary: '',
      bank: { name: '', agency: '', rib: '' },
      instructionsFr: '',
      instructionsAr: '',
      delay: '24 h ouvrées',
      methods: {
        ccp: true,
        baridimob: true,
        bankTransfer: true,
        cash: true,
        inPerson: true,
      },
      cashInstructionsFr: '',
      cashInstructionsAr: '',
      inPersonInstructionsFr: '',
      inPersonInstructionsAr: '',
    },
  }
}

export function defaultPlatformPaymentSettings() {
  return {
    methods: {
      online: true,
      manual: true,
      chargily: true,
      cib: true,
      edahabia: true,
      ccp: true,
      baridimob: true,
      bankTransfer: true,
      cash: true,
      inPerson: true,
      ccpRip: true,
    },
    manualPayment: {
      ccp: '',
      baridimob: '',
      bank: { name: '', agency: '', rib: '' },
      beneficiary: '',
      instructionsFr: '',
      instructionsAr: '',
      delay: '24-48 h',
      cashInstructionsFr: '',
      cashInstructionsAr: '',
      inPersonInstructionsFr: '',
      inPersonInstructionsAr: '',
    },
  }
}
