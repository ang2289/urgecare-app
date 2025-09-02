import Dexie, { Table } from 'dexie'
import type { WishItem } from '@/types/index'

export type SupportPhoto = {
  id: string
  type?: string // 資料分類，如 'support'
  text?: string // 支持文字
  /** base64 data URL (ex: "data:image/png;base64,...") */
  dataUrl: string
  createdAt: string
}

// ✅ 新增：心得牆
export type Experience = {
  id: string
  text: string
  createdAt: string
}

// === 新增資料型別 ===
export type ChantMantra = { id: string; name: string; createdAt: string }
export type ChantLog = { id: string; mantraId: string; date: string; count: number } // date: YYYY-MM-DD
export type Homework = { id: string; title: string; createdAt: string }
export type HomeworkLog = { id: string; homeworkId: string; date: string; amount: number }
export type PomodoroSession = {
  id: string
  label?: string
  startedAt: string
  endedAt: string
  minutes: number
}

class UCDB extends Dexie {
  wishes!: Table<WishItem, string>
  photos!: Table<SupportPhoto, string>
  experiences!: Table<Experience, string>
  mantras!: Table<ChantMantra, string>
  chantLogs!: Table<ChantLog, string>
  homeworks!: Table<Homework, string>
  homeworkLogs!: Table<HomeworkLog, string>
  pomo!: Table<PomodoroSession, string>

  constructor() {
    super('urgecare_v1')
    this.version(1).stores({
      diaries: 'id, createdAt',
      wishes: 'id, createdAt, votes',
      photos: 'id, createdAt',
    })
    // v2：新增誦念／功課／番茄鐘
    this.version(2).stores({
      mantras: 'id, createdAt, name',
      chantLogs: 'id, mantraId, date, [mantraId+date]',
      homeworks: 'id, createdAt, title',
      homeworkLogs: 'id, homeworkId, date, [homeworkId+date]',
      pomo: 'id, startedAt, endedAt, minutes',
    })
    // v3：新增心得牆
    this.version(3).stores({
      experiences: 'id, createdAt',
    })
  }
}

export const db = new UCDB()

export function uid() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    // @ts-ignore
    return crypto.randomUUID()
  }
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function nowISO() {
  return new Date().toISOString()
}

// 從唯一來源模組單點 re-export
export { toCSV } from '@/utils/csv'
