import { db } from '../db/dexie'
export { fmtLocal, csvEscape } from '../storage/backup'
import { toCSV } from '../utils/csv'
import { BackupPayload } from '../types/index';

const DIARY_TABLE_NAME = 'journal';

export async function exportJSON(): Promise<Blob> {
  const payload: BackupPayload = {
    version: '2.0.0',
    exportedAt: new Date().toISOString(),
    tables: {
      journal: await db.journal.toArray(),
      wishes: await db.wishes.toArray(),
      supports: await db.supports.toArray(),
      todos: await db.todos.toArray(),
      delays: await db.delays.toArray(),
    },
  }
  return new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
}

export async function importJSON(file: File): Promise<void> {
  const text = await file.text()
  const data = JSON.parse(text) as BackupPayload
  // 簡單版本：清庫後全量寫回（可視需要先做快照）
  await db.transaction('rw', db.supports, db.diary, db.delays, async () => {
    await Promise.all([
      db.journal.clear(),
      db.wishes.clear(),
      db.supports.clear(),
      db.todos.clear(),
      db.delays.clear(),
    ])
    await db.journal.bulkAdd(data.tables.journal)
    await db.wishes.bulkAdd(data.tables.wishes)
    await db.supports.bulkAdd(data.tables.supports)
    await db.todos.bulkAdd(data.tables.todos)
    await db.delays.bulkAdd(data.tables.delays)
  })
}

export async function exportCSVAll(): Promise<{ name: string; blob: Blob }[]> {
  const [journal, wishes, supports, todos, delays] = await Promise.all([
    db.journal.toArray(),
    db.wishes.toArray(),
    db.supports.toArray(),
    db.todos.toArray(),
    db.delays.toArray(),
  ])
  return [
    { name: 'journal.csv', blob: new Blob([toCSV(journal)], { type: 'text/csv' }) },
    { name: 'wishes.csv', blob: new Blob([toCSV(wishes)], { type: 'text/csv' }) },
    { name: 'supports.csv', blob: new Blob([toCSV(supports)], { type: 'text/csv' }) },
    { name: 'todos.csv', blob: new Blob([toCSV(todos)], { type: 'text/csv' }) },
    { name: 'delays.csv', blob: new Blob([toCSV(delays)], { type: 'text/csv' }) },
  ]
}

// 將舊的函式改名並移除 export
async function _legacy_exportDiariesToCSV(opts?: { tableName?: string; dateKey?: string; textKey?: string }): Promise<Blob> {
  const tableName = DIARY_TABLE_NAME;
  const dateKey = opts?.dateKey ?? 'createdAt';
  const textKey = opts?.textKey ?? 'text';

  const table = db[tableName];
  if (!table) {
    console.warn(`Table "${tableName}" does not exist in the database.`);
    // 如果表不存在，返回只有標頭的空 CSV
    const header = [dateKey, textKey];
    const csvContent = header.join(',') + '\n';
    return new Blob([csvContent], { type: 'text/csv' });
  }

  const rows: Array<{ [key: string]: any }> = await table.toArray();
  console.log(`Exporting ${rows.length} rows from table "${tableName}".`);

  const header = [dateKey, textKey];
  const csvContent = [
    header.join(','),
    ...rows.map(row => `${row[dateKey] ?? ''},${row[textKey] ?? ''}`),
  ].join('\n');

  return new Blob([csvContent], { type: 'text/csv' });
}

// 新增獨立的日記匯出函數
async function _legacy_exportJournalToCSV(): Promise<Blob> {
  try {
    const rows = await db.journal.toArray();
    const header = ['createdAt', 'text'];
    const csvContent = [
      header.join(','),
      ...rows.map(row => `${row.createdAt},${row.text}`),
    ].join('\n');

    return new Blob([csvContent], { type: 'text/csv' });
  } catch (err) {
    console.error('Error exporting journal to CSV:', err);
    const header = ['createdAt', 'text'];
    const csvContent = header.join(',') + '\n';
    return new Blob([csvContent], { type: 'text/csv' });
  }
}

// 從 localStorage 匯出日記資料
// 更新匯出函數，添加日誌並提供回退機制
async function _legacy_exportJournalFromLocalStorageToCSV(): Promise<Blob> {
  try {
    const DIARY_KEY = 'urgecare.diary.v1';
    console.log(`Attempting to fetch journal data from localStorage with key: ${DIARY_KEY}`);
    const raw = localStorage.getItem(DIARY_KEY);
    if (!raw) {
      console.warn('No journal data found in localStorage. Returning empty CSV.');
      const header = ['createdAt', 'text'];
      const csvContent = header.join(',') + '\n';
      return new Blob([csvContent], { type: 'text/csv' });
    }

    const rows = JSON.parse(raw);
    console.log(`Fetched ${rows.length} journal entries from localStorage.`);
    const header = ['createdAt', 'text'];
    const csvContent = [
      header.join(','),
      ...rows.map((row: { createdAt: string; text: string }) => `${row.createdAt},${row.text}`),
    ].join('\n');

    return new Blob([csvContent], { type: 'text/csv' });
  } catch (err) {
    console.error('Error exporting journal from localStorage to CSV:', err);
    const header = ['createdAt', 'text'];
    const csvContent = header.join(',') + '\n';
    return new Blob([csvContent], { type: 'text/csv' });
  }
}

// 更新匯出邏輯，生成空的 CSV
async function _legacy_exportEmptyJournalToCSV(): Promise<Blob> {
  try {
    console.warn('No journal data available. Generating empty CSV.');
    const header = ['createdAt', 'text'];
    const csvContent = header.join(',') + '\n';
    return new Blob([csvContent], { type: 'text/csv' });
  } catch (err) {
    console.error('Error generating empty journal CSV:', err);
    const header = ['createdAt', 'text'];
    const csvContent = header.join(',') + '\n';
    return new Blob([csvContent], { type: 'text/csv' });
  }
}

// 生成範例日記 CSV
async function _legacy_exportSampleJournalToCSV(): Promise<Blob> {
  try {
    console.log('Generating sample journal CSV.');
    const header = ['createdAt', 'text'];
    const sampleRows = [
      { createdAt: '2025/08/26 13:53', text: 'Sample entry 1' },
      { createdAt: '2025/08/27 09:09', text: 'Sample entry 2' },
    ];
    const csvContent = [
      header.join(','),
      ...sampleRows.map(row => `${row.createdAt},${row.text}`),
    ].join('\n');

    return new Blob([csvContent], { type: 'text/csv' });
  } catch (err) {
    console.error('Error generating sample journal CSV:', err);
    const header = ['createdAt', 'text'];
    const csvContent = header.join(',') + '\n';
    return new Blob([csvContent], { type: 'text/csv' });
  }
}

// 新增一個全新的函式，用於安全匯出日記 CSV
export async function exportDiaryCSVSafe(): Promise<Blob> {
  console.log('[SAFE] start');
  console.log('Starting safe diary CSV export...');

  let rows: Array<{ createdAt: string; text: string }> = [];

  try {
    if (db.tables.some(table => table.name === 'journal')) {
      console.log('Fetching data from journal table...');
      rows = await db.journal.toArray();
    } else if (db.tables.some(table => table.name === 'diary')) {
      console.log('Fetching data from diary table...');
      const diaryRows = await db.diary.toArray();
      rows = diaryRows.map(row => ({ createdAt: row.createdAt, text: '' }));
    } else {
      console.log('Fetching data from chants or prayers table...');
      const chantRows = db.tables.some(table => table.name === 'chants')
        ? await db.chants.toArray()
        : [];
      const prayerRows = db.tables.some(table => table.name === 'prayers')
        ? await db.prayers.toArray()
        : [];

      rows = [
        ...chantRows.map(row => ({
          createdAt: row.occurredAt?.toISOString() || '',
          text: `[chant] ${row.description || 'chant'}`,
        })),
        ...prayerRows.map(row => ({
          createdAt: row.occurredAt?.toISOString() || '',
          text: `[prayer] ${row.description || 'prayer'}`,
        })),
      ];
    }
  } catch (err) {
    console.error('Error during data fetching:', err);
    // 確保即使發生錯誤也不拋出，繼續執行
  }

  const header = ['createdAt', 'text'];
  const csvContent = [
    '\ufeff' + header.join(','), // 加入 BOM
    ...rows.map(row => `${row.createdAt},${row.text}`),
  ].join('\n');

  console.log('Diary CSV export completed successfully.');
  return new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
}
