import { frBase } from './fr/base.js'
import { frAccount } from './fr/account.js'
import { frAdmin } from './fr/admin.js'
import { frTrainer } from './fr/trainer.js'
import { frLearn } from './fr/learn.js'
import { frExtras } from './fr/extras.js'
import { arBase } from './ar/base.js'
import { arAccount } from './ar/account.js'
import { arAdmin } from './ar/admin.js'
import { arTrainer } from './ar/trainer.js'
import { arLearn } from './ar/learn.js'
import { arExtras } from './ar/extras.js'

function mergeSections(sections) {
  return sections.reduce((merged, section) => {
    for (const [key, value] of Object.entries(section)) {
      merged[key] = value && typeof value === 'object' && !Array.isArray(value)
        ? { ...(merged[key] || {}), ...value }
        : value
    }
    return merged
  }, {})
}

export const translations = {
  fr: mergeSections([frBase, frAccount, frAdmin, frTrainer, frLearn, frExtras]),
  ar: mergeSections([arBase, arAccount, arAdmin, arTrainer, arLearn, arExtras]),
}
