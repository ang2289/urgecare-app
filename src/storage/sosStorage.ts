// src/storage/sosStorage.ts
const KEY = 'urgecare.sos.history.v1'

export interface SOSLog {
  id: string
  createdAt: string
}

function safeJSON<T>(raw: string | null, fallback: T): T {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function uid() {
  return crypto.randomUUID()
}

export function loadSOSHistory(): SOSLog[] {
  return safeJSON<SOSLog[]>(localStorage.getItem(KEY), [])
}

export function addSOSLog() {
  const list = loadSOSHistory()
  const item: SOSLog = { id: uid(), createdAt: new Date().toISOString() }
  localStorage.setItem(KEY, JSON.stringify([item, ...list]))
}
