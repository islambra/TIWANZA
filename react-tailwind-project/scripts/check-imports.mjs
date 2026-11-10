import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const src = join(root, 'src')
const extensions = ['.js', '.jsx', '.mjs', '.json']
const importPattern = /(?:import|export)\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })
}

function resolves(specifier, fromFile) {
  if (!specifier.startsWith('.')) return true
  const base = resolve(dirname(fromFile), specifier)
  const candidates = [base, ...extensions.map((ext) => base + ext)]
  if (!extname(base)) candidates.push(...extensions.map((ext) => join(base, `index${ext}`)))
  return candidates.some((candidate) => {
    try {
      return statSync(candidate).isFile()
    } catch {
      return false
    }
  })
}

const errors = []
const files = walk(src).filter((file) => ['.js', '.jsx', '.mjs'].includes(extname(file)))

for (const file of files) {
  const content = readFileSync(file, 'utf8')
  for (const match of content.matchAll(importPattern)) {
    const specifier = match[1] || match[2]
    if (!resolves(specifier, file)) {
      errors.push(`${file.slice(root.length + 1)} -> ${specifier}`)
    }
  }
}

if (errors.length) {
  console.error(`Unresolved relative imports (${errors.length}):`)
  for (const error of errors) console.error(`  ${error}`)
  process.exit(1)
}

console.log(`Import check passed (${files.length} files).`)
