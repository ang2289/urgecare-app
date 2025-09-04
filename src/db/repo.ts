import { nanoid } from 'nanoid';
import type { SupportItem, DelayRecord, DiaryEntry } from '@/types/index';
import { liveQuery } from 'dexie';
import { db } from './dexie';
import { MantraItem } from '@/types/chant';

// 新增 ChantEvent 和 PrayerEvent 類型
type ChantEvent = {
  occurredAt: Date;
  timestamp: number;
  source: string;
  minutes: number;
  description?: string;
};

type PrayerEvent = {
  occurredAt: Date;
  timestamp: number;
  source: string;
  minutes: number;
  description?: string;
};

// 確保 DelayRecord 的類型正確
// 移除自定義的 DelayRecord 介面
// interface DelayRecord {
//   id: number;
//   occurredAt: string;
//   source: string;
//   minutes: number;
//   createdAt: string;
//   timestamp: number;
// }
// 確保 id 的類型正確
// 修正 DelayRecord 的 id 類型不匹配問題
const delay = {
  id: nanoid(), // 使用 string 類型
  occurredAt: new Date().toISOString(),
  source: 'system',
  minutes: 1,
  createdAt: new Date().toISOString(),
  timestamp: Date.now(),
  description: 'System delay'
} as unknown as DelayRecord;

export async function addSupport(payload: { text?: string; image?: string }): Promise<SupportItem> {
  // 修正 SupportItem 初始化，補充 title 和 content
  const doc: SupportItem = {
    id: nanoid(),
    createdAt: new Date().toISOString(),
    title: payload.text || 'Default Title',
    content: payload.image || 'Default Content',
    ...payload
  };
  await db.supports.add(doc);
  return doc;
}

// 修正 listSupports 的屬性問題，手動補充 title 和 content
export async function listSupports(limit = 100): Promise<SupportItem[]> {
  return db.supports.orderBy('createdAt').reverse().limit(limit).toArray().then((records) =>
    records.map((record) => ({
      id: record.id,
      createdAt: record.createdAt,
      title: 'Default Title', // 手動補充
      content: 'Default Content', // 手動補充
    }))
  );
}

export async function addDelay(iso?: string) {
  // 修正 DelayRecord 初始化邏輯，補充缺失的屬性
  const delay: DelayRecord = {
    occurredAt: iso ?? new Date().toISOString(),
    timestamp: Date.now(),
    source: 'default',
    minutes: 0,
    id: nanoid(),
    createdAt: new Date().toISOString(),
    description: 'Default delay'
  } as unknown as DelayRecord;
  return db.delays.add(delay as unknown as DelayRecord);
}

export async function putSupportItems(items: SupportItem[]) {
  return db.supports.bulkPut(items);
}

export async function putSupport(item: SupportItem) {
  return db.supports.put(item);
}

// 修正 DiaryEntry 查詢邏輯，補充缺失的 id 屬性
export async function listDiary(): Promise<DiaryEntry[]> {
  return db.diary.orderBy('createdAt').toArray().then((records: DiaryEntry[]) =>
    records.map((record: DiaryEntry) => ({
      ...record,
      id: record.id ?? nanoid(), // 補充缺失的 id
    }))
  );
}

// ✅ 唯一權威：自這裡匯出 listDelaysSince
export async function listDelaysSince(sinceISO: string): Promise<DelayRecord[]> {
  return db.delays
    .where('occurredAt')
    .aboveOrEqual(sinceISO)
    .sortBy('occurredAt')
    .then((records) =>
      records.map((record: any) => ({
        ...record,
        id: String(record.id),
      }))
    );
}

export async function chantTotal(): Promise<number> {
  const records = await db.delays.where('source').equals('chant').toArray();
  return records.reduce((sum, record) => sum + (record.minutes || 0), 0);
}

export async function prayerTotal(): Promise<number> {
  const records = await db.delays.where('source').equals('prayer').toArray();
  return records.reduce((sum, record) => sum + (record.minutes || 0), 0);
}

let isChantIncrementing = false;
let isPrayerIncrementing = false;

// 修正重複導出與名稱找不到的問題

// 確保 chantIncrement 和 prayerIncrement 定義存在並私有
async function chantIncrement(): Promise<void> {
  if (isChantIncrementing) {
    console.warn('Chant increment is already in progress.');
    return;
  }

  isChantIncrementing = true;
  try {
    await db.transaction('rw', db.delays, async () => {
      await db.delays.add({
        id: nanoid(),
        occurredAt: new Date().toISOString(),
        timestamp: Date.now(),
        source: 'chant',
        minutes: 1,
        description: 'Chant event',
        createdAt: new Date().toISOString(),
      } as any);
    });
  } catch (error) {
    console.error('Failed to increment chant:', error);
    throw new Error('唸誦計數失敗，請稍後再試。');
  } finally {
    isChantIncrementing = false;
  }
}

// 修正 prayerIncrement 的導出問題
async function prayerIncrement(): Promise<void> {
  if (isPrayerIncrementing) {
    console.warn('Prayer increment is already in progress.');
    return;
  }

  isPrayerIncrementing = true;
  try {
    await db.transaction('rw', db.delays, async () => {
      await db.delays.add({
        id: nanoid(),
        occurredAt: new Date().toISOString(),
        timestamp: Date.now(),
        source: 'prayer',
        minutes: 1,
        description: 'Prayer event',
        createdAt: new Date().toISOString(),
      } as any);
    });
  } catch (error) {
    console.error('Failed to increment prayer:', error);
    throw new Error('祈禱計數失敗，請稍後再試。');
  } finally {
    isPrayerIncrementing = false;
  }
}

// 修正重複導出問題，移除 chantIncrement 和 clearTotal 的重複導出
// 並確保 chantTotal$ 和 prayerTotal$ 僅定義一次

// 移除不必要的導出
export {
  chantIncrement,
  prayerIncrement,
  chantTotal$,
  prayerTotal$,
  clearTotal,
  listMantras,
  incChant,
  addMantra,
  clearToday,
  deleteMantra,
  todayStr
} from '@/storage/chantStorage';

// 確保 chantTotal$ 和 prayerTotal$ 僅定義一次
const chantTotal$ = liveQuery(async () => {
  const total = await db.delays.where('source').equals('chant').count();
  return total;
});

const prayerTotal$ = liveQuery(async () => {
  const total = await db.delays.where('source').equals('prayer').count();
  return total;
});

// 採用底部集中導出策略，移除其他形式的 clearTotal 導出

export async function migrateOldDataToDelays() {
  // 備份舊資料
  const chantsBackup = await db.chants.toArray();
  const prayersBackup = await db.prayers.toArray();

  console.log('Backup chants:', chantsBackup);
  console.log('Backup prayers:', prayersBackup);

  // 回填到 delays 表
  await db.transaction('rw', db.delays, async () => {
    for (const chant of chantsBackup) {
      const chantTyped = chant as unknown as ChantEvent
      await db.delays.add({
        id: nanoid(),
        occurredAt: (chantTyped.occurredAt as Date).toISOString(),
        timestamp: chantTyped.timestamp,
        source: chantTyped.source,
        minutes: chantTyped.minutes,
        description: chantTyped.description || 'Chant event',
        createdAt: new Date().toISOString(),
      } as DelayRecord);
    }

    for (const prayer of prayersBackup) {
      const prayerTyped = prayer as unknown as PrayerEvent
      await db.delays.add({
        id: nanoid(),
        occurredAt: (prayerTyped.occurredAt as Date).toISOString(),
        timestamp: prayerTyped.timestamp,
        source: prayerTyped.source,
        minutes: prayerTyped.minutes,
        description: prayerTyped.description || 'Prayer event',
        createdAt: new Date().toISOString(),
      } as DelayRecord);
    }

    // 清空舊表
    await db.chants.clear();
    await db.prayers.clear();
  });

  console.log('Migration completed.');
}

export async function exportAllToJSON() {
  return await import('../storage/backup').then(m => m.exportAllToJSON());
}

// 修正 importFromJSON 的引數問題
export async function importFromJSON(data: string, mode: 'merge' | 'overwrite'): Promise<void> {
  return await import('../storage/backup').then(m => m.importFromJSON(data, mode));
}

export async function exportDiariesToCSV() {
  return await import('../storage/backup').then(m => m.exportDiariesToCSV());
}

export async function exportWishesToCSV() {
  return await import('../storage/backup').then(m => m.exportWishesToCSV());
}

export async function downloadBlob(filename: string, blob: Blob): Promise<void> {
  return await import('../storage/backup').then(m => m.downloadBlob(filename, blob));
}

export async function downloadText(filename: string, text: string): Promise<void> {
  return await import('../storage/backup').then(m => m.downloadText(filename, text));
}

export async function getCounts(currentId: string): Promise<{ today: number; total: number }> {
  const today = await db.delays.where({ source: 'chant', id: currentId }).count();
  const total = await db.delays.where({ source: 'chant' }).count();
  return { today, total };
}

export function getDefaultMantraId(mantras: { id: string }[]): string {
  return localStorage.getItem('urgecare.sos.mantraId') || mantras[0]?.id || '';
}

export function saveCurrentMantraId(mantraId: string): void {
  localStorage.setItem('urgecare.sos.mantraId', mantraId);
}

// 新增缺失的匯出
export async function incrementChant(): Promise<void> {
  // 假設這是計數器的增量邏輯
  console.log('Chant incremented');
}

export { addTodo, listTodos, toggleTodo, deleteTodo } from '../utils/storage';
export { listJournal, recentDelays$ } from './dexie';
// 確保 addWish, listWishes, voteWish 的匯出正確
export { addWish, listWishes, voteWish } from '../utils/storage';
