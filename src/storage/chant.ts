export type ChantState = {
  today: number
  total: number
  scriptureId: string
  updatedAt: string
}

const KEY = 'chant_state_v1'
const todayStr = () => new Date().toISOString().slice(0, 10)

export function getChant(): ChantState {
  const raw = localStorage.getItem(KEY)
  let s: ChantState = raw
    ? (JSON.parse(raw) as ChantState)
    : { today: 0, total: 0, scriptureId: 'heart-sutra', updatedAt: new Date().toISOString() }
  if (!s.updatedAt.startsWith(todayStr())) {
    s = { ...s, today: 0, updatedAt: new Date().toISOString() }
  }
  localStorage.setItem(KEY, JSON.stringify(s))
  return s
}

export function addChant(n: number): ChantState {
  const s = getChant()
  s.today += n
  s.total += n
  s.updatedAt = new Date().toISOString()
  localStorage.setItem(KEY, JSON.stringify(s))
  return s
}

export function setScripture(id: string): ChantState {
  const s = getChant()
  s.scriptureId = id
  s.updatedAt = new Date().toISOString()
  localStorage.setItem(KEY, JSON.stringify(s))
  return s
}
