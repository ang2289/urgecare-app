import { db } from './dexie'

export interface PomodoroPreset {
  id?: number
  title: string
  minutes: number
  order?: number
  createdAt: string
}

export async function listPomodoroPresets(): Promise<PomodoroPreset[]> {
  const rows = await db.pomodoro_presets.orderBy('order').toArray() as PomodoroPreset[]
  return rows
}

export async function addPomodoroPreset(input: Omit<PomodoroPreset, 'id' | 'createdAt' | 'order'> & Partial<Pick<PomodoroPreset, 'order'>>) {
  const rows = await db.pomodoro_presets.toArray() as PomodoroPreset[]
  const nextOrder = input.order ?? (rows.length ? Math.max(...rows.map(r => r.order ?? 0)) + 1 : 1)
  const item: PomodoroPreset = {
    ...input,
    order: nextOrder,
    createdAt: new Date().toISOString()
  }
  await db.pomodoro_presets.add(item as any)
  return item
}

export async function deletePomodoroPreset(id: number) {
  await db.pomodoro_presets.delete(id)
}

export async function updatePomodoroPreset(id: number, patch: Partial<PomodoroPreset>) {
  await db.pomodoro_presets.update(id, patch as any)
}
