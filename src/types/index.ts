export interface BaseDoc {
  id: string;
  createdAt: string;
}

export interface DelayRecord {
  id: string
  occurredAt: string
  timestamp: number
  source: string
  minutes: number
  description: string
  createdAt: string
}

export interface WishItem {
  id: string
  createdAt: string
  title?: string
  text?: string
  [key: string]: any
}
export type Wish = WishItem

// 重新加入 interface 定義
export interface SupportPhoto {
  id: string
  dataUrl: string
  createdAt: string
  title?: string
}



// 確保所有定義都被正確匯出

export interface SupportItem {
  id: string
  createdAt: string
  text?: string
  [key: string]: any
}

export interface DiaryEntry {
  id: string
  createdAt: string
  text: string
  [key: string]: any
}

// 確保 Todo 的匯出方式正確
export type Todo = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
};

// 確保 PomodoroPreset 被正確匯出
export interface PomodoroPreset {
  name: string;
  focusMin: number;
  breakMin: number;
}

export interface BackupPayload {
  version?: string; // 新增 version 屬性，為選填
  exportedAt?: string; // 新增 exportedAt 屬性，為選填
  tables: {
    journal: any[];
    wishes: any[];
    supports: any[];
    todos: any[];
    delays: any[];
  };
}

// 兼容舊程式碼：若有使用 Delay 名稱，等同於
export type Delay = DelayRecord;
