import fs from 'node:fs'
import path from 'node:path'
import { translations } from '../src/i18n/translations.js'

const root = path.resolve(import.meta.dirname, '..')
const sourceRoots = ['src', 'tests']

function flatten(value, prefix = '', output = new Set()) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    if (prefix) output.add(prefix)
    return output
  }
  for (const [key, child] of Object.entries(value)) {
    flatten(child, prefix ? `${prefix}.${key}` : key, output)
  }
  return output
}

function walk(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) return walk(fullPath)
    if (/\.(js|jsx|mjs)$/.test(entry.name)) return [fullPath]
    return []
  })
}

const localeKeys = Object.fromEntries(
  Object.entries(translations).map(([locale, bundle]) => [locale, flatten(bundle)]),
)
const files = sourceRoots.flatMap((dir) => walk(path.join(root, dir)))
const used = new Set()
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8')
  for (const match of content.matchAll(/\bt\(\s*['"]([^'"]+)['"]/g)) used.add(match[1])
}

const missing = []
for (const [locale, keys] of Object.entries(localeKeys)) {
  for (const key of used) {
    if (!keys.has(key)) missing.push(`${locale}: ${key}`)
  }
}

if (missing.length) {
  console.error(`Missing translation keys (${missing.length}):\n${missing.sort().join('\n')}`)
  process.exit(1)
}

console.log(`i18n check passed (${used.size} literal keys used across ${Object.keys(localeKeys).length} locales).`)
