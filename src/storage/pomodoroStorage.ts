import { db, uid, nowISO, type PomodoroSession } from './db'

export async function addPomoSession(
  startedAt: string,
  endedAt: string,
  minutes: number,
  label?: string
) {
  const row: PomodoroSession = { id: uid(), startedAt, endedAt, minutes, label }
  await db.pomo.add(row)
  return row
}
export async function listRecentPomo(limit = 20) {
  const all = await db.pomo.orderBy('startedAt').reverse().toArray()
  return all.slice(0, limit)
}
