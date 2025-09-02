import { db } from './dexie'
import type { PomodoroPreset } from '../types'
import { nanoid } from 'nanoid'

const DEFAULTS: PomodoroPreset[] = [
  { id: 'p_25_5', name: '專注25・休息5', focusMin: 25, breakMin: 5, order: 1 },
  { id: 'p_50_10', name: '專注50・休息10', focusMin: 50, breakMin: 10, order: 2 },
  { id: 'p_90_20', name: '專注90・休息20', focusMin: 90, breakMin: 20, order: 3 },
]

export async function seedPomodoroDefaultsIfEmpty() {
  try {
    const count = await db.pomodoro_presets.count()
    if (!count) await db.pomodoro_presets.bulkAdd(DEFAULTS)
  } catch {
    /* 若 Dexie 尚未升級成功，讓元件用 FALLBACK */
  }
}

export async function listPomodoroPresets(): Promise<PomodoroPreset[]> {
  try {
    const rows = await db.pomodoro_presets.orderBy('order').toArray()
    return rows.length ? rows : DEFAULTS
  } catch {
    return DEFAULTS
  }
}

export async function addPomodoroPreset(
  input: Omit<PomodoroPreset, 'id' | 'order'> & { order?: number }
): Promise<PomodoroPreset> {
  const rows = await db.pomodoro_presets.toArray()
  const nextOrder = input.order ?? (rows.length ? Math.max(...rows.map(r => r.order)) + 1 : 1)
  const doc: PomodoroPreset = { id: nanoid(), order: nextOrder, ...input } as PomodoroPreset
  await db.pomodoro_presets.add(doc)
  return doc
}

export async function removePomodoroPreset(id: string) {
  await db.pomodoro_presets.delete(id)
}
