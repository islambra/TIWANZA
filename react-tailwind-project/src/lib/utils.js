export const TIMEZONE = 'Africa/Algiers'

export function cn(...values) {
  return values.filter(Boolean).join(' ')
}

export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
}

export function nowIso() {
  return new Date().toISOString()
}

export function addDays(date, days) {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

export function addMinutes(date, minutes) {
  return new Date(new Date(date).getTime() + minutes * 60000)
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export function percent(part, total) {
  if (!total) return 0
  return Math.round((part / total) * 100)
}

function intlLocale(lang) {
  return lang === 'ar' ? 'ar-DZ-u-nu-latn' : 'fr-FR'
}

export function formatNumber(value, lang = 'fr') {
  return new Intl.NumberFormat(intlLocale(lang), { maximumFractionDigits: 0 }).format(Number(value) || 0)
}

export function formatDA(value, lang = 'fr') {
  return `${formatNumber(value, lang)} DA`
}

export function formatDate(value, lang = 'fr', options = {}) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(intlLocale(lang), {
    timeZone: TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options,
  }).format(date)
}

export function formatDateTime(value, lang = 'fr') {
  return formatDate(value, lang, { hour: '2-digit', minute: '2-digit' })
}

export function formatTime(value, lang = 'fr') {
  if (!value) return '—'
  return new Intl.DateTimeFormat(intlLocale(lang), {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function formatWeekday(value, lang = 'fr') {
  return new Intl.DateTimeFormat(intlLocale(lang), {
    timeZone: TIMEZONE,
    weekday: 'long',
  }).format(new Date(value))
}

export function dateInputValue(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

export function timeInputValue(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export function combineDateTime(dateStr, timeStr) {
  if (!dateStr) return null
  const [year, month, day] = dateStr.split('-').map(Number)
  const [hours, minutes] = (timeStr || '00:00').split(':').map(Number)
  return new Date(year, (month || 1) - 1, day || 1, hours || 0, minutes || 0, 0, 0).toISOString()
}

export function durationLabel(minutes) {
  const value = Number(minutes) || 0
  if (value < 60) return `${value} min`
  const hours = Math.floor(value / 60)
  const rest = value % 60
  return rest ? `${hours} h ${rest}` : `${hours} h`
}

export function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

export function slugify(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

export function isEmail(value = '') {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim())
}

export function shuffle(items) {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[target]] = [copy[target], copy[index]]
  }
  return copy
}

export function parseYouTubeId(url = '') {
  const patterns = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{6,})/,
    /youtu\.be\/([a-zA-Z0-9_-]{6,})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,})/,
  ]
  for (const pattern of patterns) {
    const match = String(url).match(pattern)
    if (match) return match[1]
  }
  return null
}

export function parseDriveId(url = '') {
  const match = String(url).match(/\/d\/([a-zA-Z0-9_-]{10,})/) || String(url).match(/[?&]id=([a-zA-Z0-9_-]{10,})/)
  return match ? match[1] : null
}

export function fileToDataUrl(file, maxBytes = 1500000) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('empty'))
      return
    }
    if (file.size > maxBytes) {
      reject(new Error('too-large'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('read-error'))
    reader.readAsDataURL(file)
  })
}

export function readTextFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('read-error'))
    reader.readAsText(file)
  })
}

export function downloadCsv(filename, rows) {
  const content = rows
    .map((row) =>
      row
        .map((cell) => {
          const value = cell === null || cell === undefined ? '' : String(cell)
          return `"${value.replace(/"/g, '""')}"`
        })
        .join(';'),
    )
    .join('\n')
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function paymentMethodLabelKey(method) {
  const map = {
    cib: 'payments.cib',
    edahabia: 'payments.edahabia',
    ccp: 'payments.ccp',
    baridimob: 'payments.baridimob',
    bank: 'payments.bank',
    online: 'payments.online',
    manual: 'payments.manual',
    free: 'payments.free',
  }
  return map[method] || 'payments.manual'
}

export function normalizeSearch(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}
