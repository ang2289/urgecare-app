export type MantraId = string

export interface ChantSessionItem {
  id: string // uuid
  mantraId: MantraId // 經咒 id
  ts: string // ISO 時間
  delta: number // 本次增加的數量（+1/+5/+10…）
}

export interface ChantTotals {
  byDate: Record<string, number> // YYYY-MM-DD -> 當日總數
  allTime: number // 累積總數
  streakDays: number // 連續天數
  lastDate?: string // 上次紀錄日期（YYYY-MM-DD）
}

export interface ChantState {
  selected: MantraId // 目前選擇的經咒
  totals: ChantTotals // 統計
  todayItems: ChantSessionItem[] // 今日細項（時間線）
  goalToday?: number // 今日目標（如 500）
}

export interface MantraItem {
  id: MantraId
  name: string // 顯示名稱
  preset?: boolean // 是否預設
}

// DiaryEntry 已移至 index.ts，請從該模組匯入
