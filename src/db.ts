import Dexie, { Table } from 'dexie'

export type Diary = { id?: string; text: string; createdAt: string }
export type Wish = { id?: string; text: string; votes: number; createdAt: string }
export type Photo = { id?: string; path: string; caption: string; createdAt: string }
export type Delay = { id?: string; timestamp: number; source: string; minutes: number; occurredAt: string };
export type Support = { id: string; text?: string; image?: string; createdAt: string };

class UrgeDB extends Dexie {
  diary!: Table<Diary, string>
  wishes!: Table<Wish, string>
  photos!: Table<Photo, string>
  delays!: Table<Delay, string>;
  supports!: Table<Support, string>;

  constructor() {
    super('urgecare')
    this.version(1).stores({
      diary: '++id, createdAt',
      wishes: '++id, createdAt, votes',
      photos: '++id, createdAt, path',
      delays: '++id, timestamp, source, minutes',
      supports: '++id, createdAt',
    })
  }
}

export const db = new UrgeDB()

// 建立完 db 後，加這行（不會影響功能，只為除錯）
if (typeof window !== 'undefined') (window as any).urgeDb = db;
