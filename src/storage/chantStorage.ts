import { db, uid, nowISO, type ChantMantra, type ChantLog } from './db'
import { MantraItem } from '@/types/chant'

export async function addMantra(name: string) {
  const m: ChantMantra = { id: uid(), name: name.trim(), createdAt: nowISO() }
  await db.mantras.add(m)
  return m
}

export async function deleteMantra(id: string) {
  await db.transaction('rw', db.mantras, db.chantLogs, async () => {
    await db.mantras.delete(id)
    await db.chantLogs.where('mantraId').equals(id).delete()
  })
}

export function todayStr(d = new Date()) {
  // 使用本地日期，避免時區造成「今天」被算到前一天
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export async function incChant(mantraId: string, delta = 1) {
  const d = todayStr()
  const existing = await db.chantLogs
    .where(['mantraId', 'date'])
    .equals([mantraId, d] as any)
    .first()
  if (existing) {
    await db.chantLogs.update(existing.id, { count: (existing.count || 0) + delta })
  } else {
    const row: ChantLog = { id: uid(), mantraId, date: d, count: delta }
    await db.chantLogs.add(row)
  }
}

export async function getCounts(mantraId: string) {
  const d = todayStr()
  const todayRow = await db.chantLogs
    .where(['mantraId', 'date'])
    .equals([mantraId, d] as any)
    .first()
  const total = (await db.chantLogs.where('mantraId').equals(mantraId).toArray()).reduce(
    (s, r) => s + (r.count || 0),
    0
  )
  return { today: todayRow?.count || 0, total }
}

export async function clearToday(mantraId: string) {
  const d = todayStr()
  const todayRow = await db.chantLogs
    .where(['mantraId', 'date'])
    .equals([mantraId, d] as any)
    .first()
  if (todayRow) {
    await db.chantLogs.update(todayRow.id, { count: 0 })
  }
}

export async function clearTotal(mantraId: string) {
  await db.chantLogs.where('mantraId').equals(mantraId).delete()
}

export async function chantIncrement() {
  // Increment chant count logic here
  console.log('Chant incremented')
}

// 新增 prayerIncrement 並匯出
export async function prayerIncrement() {
  console.log('Prayer incremented')
}

// 匯出缺失的成員 chantTotal$, prayerTotal$, listMantras
export const chantTotal$ = async () => {
  console.log('Chant total observable')
}

export const prayerTotal$ = async () => {
  console.log('Prayer total observable')
}

export const listMantras = async (): Promise<MantraItem[]> => {
  console.log('List of mantras')
  return [
    { id: '1', name: 'Mantra 1', preset: true },
    { id: '2', name: 'Mantra 2' }
  ]
}
