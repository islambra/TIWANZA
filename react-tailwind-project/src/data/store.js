import { useSyncExternalStore } from 'react'
import { createSeedData, migrateState } from './seed.js'

const STORAGE_KEY = 'tiwanza_lms_store_v1'
const listeners = new Set()

function loadInitialState() {
  if (typeof window === 'undefined') return createSeedData()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && parsed.version === 2) return parsed
      if (parsed && parsed.version === 1) {
        const migrated = migrateState(parsed)
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
        return migrated
      }
    }
  } catch (error) {
    console.warn('Tiwanza store could not be read, seeding a fresh demo dataset.', error)
  }
  const seed = createSeedData()
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
  } catch (error) {
    console.warn('Tiwanza store could not be persisted.', error)
  }
  return seed
}

let state = loadInitialState()

function emit() {
  listeners.forEach((listener) => listener())
}

function persist() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.warn('Tiwanza mock storage limit reached. Some data may not persist after refresh.', error)
  }
}

export function getState() {
  return state
}

export function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function updateState(updater) {
  const draft = structuredClone(state)
  const result = typeof updater === 'function' ? updater(draft) : updater
  state = draft
  persist()
  emit()
  return result
}

export function resetStore() {
  state = createSeedData()
  persist()
  emit()
}

export function clearSession() {
  updateState((draft) => {
    draft.session = null
  })
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY || !event.newValue) return
    try {
      state = JSON.parse(event.newValue)
      emit()
    } catch (error) {
      console.warn('Tiwanza cross-tab sync failed.', error)
    }
  })
}

export function useTiwanzaStore() {
  return useSyncExternalStore(subscribe, getState, getState)
}
