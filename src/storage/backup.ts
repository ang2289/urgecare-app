// ✅ 注意：這裡一定要用 ./db（因為 backup.ts 與 db.ts 同在 storage/ 目錄）
import { db } from '../db';
import type { DiaryEntry, WishItem } from '@/types/index';

// ---------- 小工具 ----------
export const pad2 = (n: number) => String(n).padStart(2, '0');
export function fmtLocal(v: any) {
  const d = new Date(v);
  if (isNaN(+d)) return '';
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
export function csvEscape(s: string) {
  const str = s == null ? '' : String(s);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}
const BOM = '\uFEFF';

const DATE_KEYS  = ['createdAt', 'created_at', 'date', 'occurredAt', 'occurred_at', 'timestamp'];
const TEXT_KEYS  = ['text', 'content', 'body', 'note', 'message'];

// 這是我們不想誤判的表
const EXCLUDE_TABLE_RE = /(wish|wishes|support|photo|image|experience|experiences|心得)/i;

// 先試偏好的日記表名
function getPreferredDiaryTable(db: any) {
  return db.diaries ?? db.diary ?? db.journals ?? db.entries ?? db.logs ?? null;
}

const DIARY_TABLE_NAME = 'journal';

// 新版：可以傳 tableName；沒傳才自動偵測（並排除 wish / support / photo）
export async function resolveDiaryTableAndKeys(db: any, tableName?: string): Promise<{table:any, dateKey:string, textKey:string} | null> {
  if (DIARY_TABLE_NAME) {
    const table = db[DIARY_TABLE_NAME];
    if (table) {
      return { table, dateKey: 'createdAt', textKey: 'text' };
    }
  }

  const tryTable = async (t:any) => {
    if (!t) return null;
    const one = await t.limit(1).toArray();
    const row = one?.[0];
    if (!row) return null;
    const dateKey = DATE_KEYS.find(k => k in row);
    const textKey = TEXT_KEYS.find(k => k in row);
    if (dateKey && textKey) return { table: t, dateKey, textKey };
    return null;
  };

  // 1) 明確指定表名時，直接用
  if (tableName) {
    const t = (db as any)[tableName];
    const hit = await tryTable(t);
    if (hit) { console.log('[backup] diary table (forced):', t.name, hit.dateKey, hit.textKey); return hit; }
  }

  // 2) 偏好日記表名
  const preferred = getPreferredDiaryTable(db);
  const hitPref = await tryTable(preferred);
  if (hitPref) { console.log('[backup] diary table (preferred):', preferred.name, hitPref.dateKey, hitPref.textKey); return hitPref; }

  // 3) 全表掃描，但排除 wish/support/photo 相關表
  for (const t of db.tables) {
    if (EXCLUDE_TABLE_RE.test(t.name)) continue;
    try {
      const hit = await tryTable(t);
      if (hit) { console.log('[backup] diary table (auto):', t.name, hit.dateKey, hit.textKey); return hit; }
    } catch {}
  }

  console.warn('[backup] no diary-like table found');
  return null;
}

// ---------- 匯出 / 匯入 JSON ----------
export async function exportAllToJSON(): Promise<string> {
  console.log('[backup] exportAllToJSON');
  const [diaries, wishes, photos] = await Promise.all([
    db.diary?.toArray?.() ?? [],
    db.wishes?.toArray?.() ?? [],
    db.photos?.toArray?.() ?? [],
  ]);
  return JSON.stringify({ diaries, wishes, photos }, null, 2);
}

export async function importFromJSON(text: string, mode: 'merge' | 'overwrite') {
  console.log('[backup] importFromJSON mode=', mode);
  const data = JSON.parse(text) || {};
  const diaries: DiaryEntry[] = Array.isArray(data.diaries) ? data.diaries : [];
  const wishes = Array.isArray(data.wishes) ? data.wishes : [];
  const photos = Array.isArray(data.photos) ? data.photos : [];

  await db.transaction('rw', db.diary, db.wishes, db.photos, async () => {
    if (mode === 'overwrite') {
      await Promise.all([db.diary.clear(), db.wishes.clear(), db.photos?.clear?.()]);
    }
    if (diaries.length) await db.diary.bulkPut(diaries);
    if (wishes.length) await db.wishes.bulkPut(wishes);
    if (photos.length && db.photos?.bulkPut) await db.photos.bulkPut(photos);
  });
}

// ---------- 匯出 CSV（日記 / 許願） ----------
export async function exportDiariesToCSV(opts?: { tableName?: string; dateKey?: string; textKey?: string }): Promise<Blob> {
  const tableName = opts?.tableName ?? DIARY_TABLE_NAME;
  const dateKey = opts?.dateKey ?? 'createdAt';
  const textKey = opts?.textKey ?? 'text';

  if (!tableName) {
    throw new Error('Table name is required to export diaries to CSV.');
  }

  const table = db[tableName];
  if (!table) {
    throw new Error(`Table "${tableName}" does not exist in the database.`);
  }

  const rows = await table.toArray();
  const header = [dateKey, textKey];
  const body = rows.map(r => [fmtLocal(r[dateKey]), csvEscape(r[textKey])]);
  const csv = [header, ...body].map(r => r.join(',')).join('\r\n');

  return new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' });
}

export async function exportWishesToCSV(): Promise<Blob> {
  console.log('[backup] exportWishesToCSV');
  const rows: WishItem[] = await db.wishes?.orderBy('createdAt')?.toArray?.() ?? [];
  const header = ['createdAt', 'text'];
  const body = rows.map(r => [fmtLocal(r.createdAt), csvEscape(r.text)]);
  const csv = [header, ...body].map(r => r.join(',')).join('\r\n');
  return new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' });
}

// ---------- 下載工具 ----------
export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadText(filename: string, text: string) {
  downloadBlob(filename, new Blob([BOM + text], { type: 'text/plain;charset=utf-8' }));
}

// ---------- 日記表處理 ----------
function getDiaryTableByName() {
  // 先用常見表名（如果你後面已經建了索引，這條路會最快）
  return (db as any).diaries ?? (db as any).diary ?? (db as any).logs ?? null;
}

// 自動偵測：從所有表裡找出「看起來像日記」的（同時有 createdAt 與 text，而且有資料）
async function resolveDiaryTable(): Promise<any> {
  // 先試常見表名，而且有資料就用
  const preferred = getDiaryTableByName();
  if (preferred) {
    try {
      const c = await preferred.count();
      if (c > 0) {
        console.log('[backup] diary table = preferred name, count =', c);
        return preferred;
      }
    } catch {}
  }

  // 全表掃描：找有 createdAt + text 的
  const tables: any[] = (db as any).tables || [];
  for (const t of tables) {
    try {
      const one = await t.limit(1).toArray();
      const row = one?.[0];
      if (row && 'createdAt' in row && 'text' in row) {
        const c = await t.count();
        if (c > 0) {
          console.log('[backup] diary table auto-detected =', t.name, 'count =', c);
          return t;
        }
      }
    } catch {}
  }

  console.warn('[backup] diary table not found…');
  return null;
}
