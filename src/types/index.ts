export interface BaseDoc {
  id: string;
  createdAt: string;
}

export type DiaryEntry = {
  id: string;
  createdAt: string;
  text: string;
};

export interface SupportItem extends BaseDoc {
  title: string;
  content: string;
  likes?: number;
  path?: string; // 新增 path 屬性
  caption?: string; // 新增 caption 屬性
}

export interface DelayRecord extends BaseDoc {
  occurredAt: string; // 確保 occurredAt 是 ISO 字串
  timestamp: number;
  source: string;
  minutes: number;
  description?: string; // 新增描述屬性
}

export interface WishItem extends BaseDoc {
  text: string;
  votes: number;
  updatedAt?: string;
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
