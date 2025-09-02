import { db, uid, nowISO, type Homework, type HomeworkLog } from './db'
import { todayStr } from '@/db/repo'

export async function listHomework(): Promise<Homework[]> {
  return db.homeworks.orderBy('createdAt').toArray()
}

export async function addHomework(title: string) {
  const h: Homework = { id: uid(), title: title.trim(), createdAt: nowISO() }
  await db.homeworks.add(h)
  return h
}

export async function deleteHomework(id: string) {
  await db.transaction('rw', db.homeworks, db.homeworkLogs, async () => {
    await db.homeworks.delete(id)
    await db.homeworkLogs.where('homeworkId').equals(id).delete()
  })
}

export async function logHomework(homeworkId: string, amount: number) {
  const d = todayStr()
  const row = await db.homeworkLogs
    .where(['homeworkId', 'date'])
    .equals([homeworkId, d] as any)
    .first()
  if (row) {
    await db.homeworkLogs.update(row.id, { amount: (row.amount || 0) + amount })
  } else {
    const r: HomeworkLog = { id: uid(), homeworkId, date: d, amount }
    await db.homeworkLogs.add(r)
  }
}

export async function getHomeworkToday(homeworkId: string) {
  const d = todayStr()
  const row = await db.homeworkLogs
    .where(['homeworkId', 'date'])
    .equals([homeworkId, d] as any)
    .first()
  return row?.amount || 0
}
