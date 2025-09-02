import Dexie, { Table } from 'dexie';
import { liveQuery } from 'dexie';
import type { SupportItem, DiaryEntry, DelayRecord } from '@/types';

class UrgeCareDB extends Dexie {
  supports!: Table<SupportItem, string>;
  diary!: Table<DiaryEntry, string>;
  delays!: Table<DelayRecord, number>;
  chants!: Table<{ id?: number; description: string; occurredAt: Date }, number>;
  prayers!: Table<{ id?: number; description: string; occurredAt: Date }, number>;
  journal!: Table<{ id?: number; createdAt: string; text: string }, number>;
  wishes!: Table<{ id?: number; description: string; votes: number; createdAt: string }, number>;
  todos!: Table<{ id?: number; text: string; completed: boolean; createdAt: string }, number>;
  pomodoro_presets!: Table<{ id?: number; title: string; minutes: number; order: number }, number>;

  constructor() {
    super('UrgeCareDB');
    this.version(3).stores({
      // 主鍵 + 索引
      supports: 'id, createdAt',
      diary: 'id, createdAt',
      delays: '++id, occurredAt, source', // ✅ db.delays: DelayRecord 表
      chants: '++id, description, occurredAt',
      prayers: '++id, description, occurredAt',
      journal: '++id, createdAt, text', // 新增 journal 表
      wishes: 'id, createdAt, votes',
      todos: 'id, text, completed, createdAt',
      pomodoro_presets: 'id, title, minutes, order',
    });

    // 列出所有資料庫表
    this.tables.forEach(table => {
      console.log(`Table: ${table.name}`);
    });
  }
}

export const db = new UrgeCareDB();

// 方便外部一起匯入型別
export type { SupportItem, DiaryEntry, DelayRecord };

export const chantTotal$ = liveQuery(async () => {
  const total = await db.delays.where('source').equals('chant').count();
  return total;
});

export const prayerTotal$ = liveQuery(async () => {
  const total = await db.delays.where('source').equals('prayer').count();
  return total;
});

export const recentDelays$ = liveQuery(async () => {
  const delays = await db.delays.orderBy('occurredAt').reverse().limit(10).toArray();
  return delays.map((delay: DelayRecord) => ({
    ...delay,
    occurredAt: delay.occurredAt || new Date().toISOString(), // 確保 occurredAt 有預設值
  }));
});

// 新增 listJournal 實作
export async function listJournal() {
  return await db.journal.toArray();
}

// 清除並重新初始化資料庫
(async () => {
  try {
    await db.delete();
    await db.open();
    console.log('Database reinitialized successfully.');
  } catch (err) {
    console.error('Error reinitializing database:', err);
  }
})();

// 確保資料庫包含 journal 表
(async () => {
  try {
    if (!db.tables.some(table => table.name === 'journal')) {
      console.warn('Journal table does not exist. Reinitializing database.');
      await db.delete();
      await db.open();
    }
  } catch (err) {
    console.error('Error checking or reinitializing database:', err);
  }
})();

// 強制升級資料庫版本以確保 journal 表建立
(async () => {
  try {
    const currentVersion = db.verno;
    const targetVersion = 4; // 假設最新版本為 4

    if (currentVersion < targetVersion) {
      console.log(`Upgrading database from version ${currentVersion} to ${targetVersion}`);
      db.version(targetVersion).stores({
        journal: '++id, createdAt, text',
        // 其他表...
      });
      await db.open();
      console.log('Database upgraded successfully.');
    }
  } catch (err) {
    console.error('Error upgrading database:', err);
  }
})();

// 強制建立 journal 表並添加日誌
(async () => {
  try {
    const tableNames = db.tables.map(table => table.name);
    if (!tableNames.includes('journal')) {
      console.warn('Journal table does not exist. Creating manually.');
      db.version(db.verno + 1).stores({
        journal: '++id, createdAt, text',
        // 其他表...
      });
      await db.open();
      console.log('Journal table created successfully.');
    } else {
      console.log('Journal table already exists.');
    }
  } catch (err) {
    console.error('Error creating journal table manually:', err);
  }
})();

// 檢查所有表的狀態並添加日誌
(async () => {
  try {
    console.log('Checking database tables...');
    db.tables.forEach(table => {
      console.log(`Table: ${table.name}, Schema: ${table.schema}`);
    });

    const requiredTables = ['journal', 'wishes', 'supports', 'todos', 'delays'];
    requiredTables.forEach(async tableName => {
      if (!db.tables.some(table => table.name === tableName)) {
        console.warn(`Table "${tableName}" does not exist. Creating manually.`);
        db.version(db.verno + 1).stores({
          [tableName]: '++id, createdAt, text',
        });
        await db.open();
        console.log(`Table "${tableName}" created successfully.`);
      } else {
        console.log(`Table "${tableName}" already exists.`);
      }
    });
  } catch (err) {
    console.error('Error checking or creating tables:', err);
  }
})();

// 添加更詳細的日誌並手動操作 journal 表
(async () => {
  try {
    console.log('Initializing database...');
    db.tables.forEach(table => {
      console.log(`Table: ${table.name}, Schema: ${table.schema}`);
    });

    const journalTable = db.tables.find(table => table.name === 'journal');
    if (!journalTable) {
      console.warn('Journal table does not exist. Creating manually.');
      db.version(db.verno + 1).stores({
        journal: '++id, createdAt, text',
      });
      await db.open();
      console.log('Journal table created successfully.');
    } else {
      console.log('Journal table exists. Testing operations...');
      const testEntry = { createdAt: new Date().toISOString(), text: 'Test entry' };
      await db.journal.add(testEntry);
      const entries = await db.journal.toArray();
      console.log(`Journal entries: ${JSON.stringify(entries)}`);
    }
  } catch (err) {
    console.error('Error initializing or testing database:', err);
  }
})();

// 清除舊資料庫並強制建立 journal 表
(async () => {
  try {
    console.log('Checking database connections...');
    if (db.isOpen()) {
      console.warn('Closing existing database connection to avoid conflicts.');
      await db.close();
    }

    console.log('Deleting old database if exists...');
    await db.delete();

    console.log('Reinitializing database and creating journal table...');
    db.version(1).stores({
      journal: '++id, createdAt, text',
      // 其他表...
    });
    await db.open();
    console.log('Database reinitialized successfully.');
  } catch (err) {
    console.error('Error reinitializing database:', err);
  }
})();

// 強制刪除資料庫並解決連線衝突問題
(async () => {
  try {
    console.log('Closing existing database connection...');
    if (db.isOpen()) {
      await db.close();
      console.log('Database connection closed successfully.');
    }

    console.log('Attempting to delete database...');
    await Dexie.delete('UrgeCareDB');
    console.log('Database deleted successfully.');

    console.log('Reinitializing database and creating journal table...');
    db.version(1).stores({
      journal: '++id, createdAt, text',
      // 其他表...
    });
    await db.open();
    console.log('Database reinitialized successfully.');
  } catch (err) {
    console.error('Error deleting or reinitializing database:', err);
  }
})();