// src/utils/storage.ts
import type { DiaryEntry, Todo } from '@/types';

/* ========= 通用 ========= */
export function safeJSON<T>(raw: string | null, fallback: T): T {
  try {
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}
// ✅ 非同步發送，避免同步事件造成的更新交錯
function emit(topic: string) {
  try {
    setTimeout(() => window.dispatchEvent(new CustomEvent(`urgecare:${topic}`)), 0)
  } catch {}
}

/* ========= Diary ========= */
const DIARY_KEY = 'urgecare.diary.v1'

export function loadEntries(): DiaryEntry[] {
  return safeJSON(localStorage.getItem(DIARY_KEY), [])
}
export function saveEntries(list: DiaryEntry[]) {
  localStorage.setItem(DIARY_KEY, JSON.stringify(list))
  emit('diary-changed')
}
export function addEntry(text: string): DiaryEntry[] {
  const now = new Date().toISOString()
  const item: DiaryEntry = { id: crypto.randomUUID(), createdAt: now, text }
  const list = [item, ...loadEntries()]
  saveEntries(list)
  return list
}
export function updateEntry(id: string, text: string): DiaryEntry[] {
  const list = loadEntries().map(e => (e.id === id ? { ...e, text } : e))
  saveEntries(list)
  return list
}
export function removeEntry(id: string): DiaryEntry[] {
  const list = loadEntries().filter(e => e.id !== id)
  saveEntries(list)
  return list
}
/** 在 cooldownMin 分鐘內，若已有相同文字則不再新增 */
export function addEntrySmart(text: string, cooldownMin = 10): DiaryEntry[] {
  const list = loadEntries()
  const now = Date.now()
  const hit = list.find(
    e => e.text === text && now - new Date(e.createdAt).getTime() < cooldownMin * 60_000
  )
  if (hit) return list
  return addEntry(text)
}

/* ========= Todos ========= */
const TODOS_KEY = 'urgecare.todos.v1'

export function loadTodos(): Todo[] {
  return safeJSON(localStorage.getItem(TODOS_KEY), [])
}
export function saveTodos(list: Todo[]) {
  localStorage.setItem(TODOS_KEY, JSON.stringify(list))
  emit('todos-changed')
}
export function addTodo(text: string): Todo[] {
  const item: Todo = {
    id: crypto.randomUUID(),
    text,
    done: false,
    createdAt: new Date().toISOString(),
  }
  const next = [item, ...loadTodos()]
  saveTodos(next)
  return next
}
/** 在 cooldownMin 分鐘內相同文字不重複加入 */
export function addTodoSmart(text: string, cooldownMin = 10): Todo[] {
  const list = loadTodos()
  const now = Date.now()
  const hit = list.find(
    t => t.text === text && now - new Date(t.createdAt || 0).getTime() < cooldownMin * 60_000
  )
  if (hit) return list
  return addTodo(text)
}
export function toggleTodo(id: string): Promise<Todo[]> {
  return new Promise(resolve => {
    const next = loadTodos().map(t => (t.id === id ? { ...t, done: !t.done } : t))
    saveTodos(next)
    resolve(next)
  })
}
export function deleteTodo(id: string): Promise<Todo[]> {
  return new Promise(resolve => {
    const next = loadTodos().filter(t => t.id !== id)
    saveTodos(next)
    resolve(next)
  })
}
export function clearTodos(): Todo[] {
  saveTodos([])
  return []
}
export function listTodos(): Todo[] {
  return loadTodos();
}

/* ========= Settings ========= */
export type AppSettings = {
  sosDefaultMinutes: number
  cooldownMin: number
}
const SETTINGS_KEY = 'urgecare.settings.v1'

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    const s = raw ? (JSON.parse(raw) as AppSettings) : null
    return {
      sosDefaultMinutes: s?.sosDefaultMinutes ?? 5,
      cooldownMin: s?.cooldownMin ?? 10,
    }
  } catch {
    return { sosDefaultMinutes: 5, cooldownMin: 10 }
  }
}

export function saveSettings(s: AppSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
  emit('settings-changed')
}

/* ========= Wishes ========= */
export function addWish(title: string): void {
  console.log(`Adding wish: ${title}`);
}

export function listWishes(): string[] {
  console.log('Listing wishes');
  return [];
}

export function voteWish(id: string): void {
  console.log(`Voting for wish with id: ${id}`);
}
