// src/pages/Stats.tsx
import React, { useEffect, useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'
import { db } from '../storage/db'

// 產生日字串（YYYY-MM-DD），使用「本地日期」避免時區誤差
function dstr(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
function rangeDays(n: number): string[] {
  const today = new Date()
  const arr: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    const t = new Date(today)
    t.setDate(today.getDate() - i)
    arr.push(dstr(t))
  }
  return arr
}

type DayRow = { date: string; chant: number; homework: number; pomoMin: number }

export default function Stats() {
  const [rows, setRows] = useState<DayRow[]>([])
  const days = 14 // 近 14 天

  useEffect(() => {
    ;(async () => {
      const keys = rangeDays(days)
      const base: Record<string, DayRow> = {}
      for (const k of keys) base[k] = { date: k, chant: 0, homework: 0, pomoMin: 0 }

      // 讀取功課數據
      const homeworkLogs = await db.homeworkLogs.toArray()
      for (const log of homeworkLogs) {
        const day = log.date
        if (day && base[day]) base[day].homework += log.amount || 0
      }

      // 讀取番茄鐘數據
      const pomoSessions = await db.pomo.toArray()
      for (const session of pomoSessions) {
        const day = session.endedAt
          ? dstr(new Date(session.endedAt))
          : session.startedAt
          ? dstr(new Date(session.startedAt))
          : ''
        if (day && base[day]) base[day].pomoMin += session.minutes || 0
      }

      setRows(keys.map(k => base[k]))
    })()
  }, [])

  const totalChant = useMemo(() => rows.reduce((s, r) => s + r.chant, 0), [rows])
  const totalHw = useMemo(() => rows.reduce((s, r) => s + r.homework, 0), [rows])
  const totalPomo = useMemo(() => rows.reduce((s, r) => s + r.pomoMin, 0), [rows])

  // 移除統計頁面內容，保留其他邏輯
  return (
    <div className="container">
      <div className="title custom-margin-top">
        統計頁面已移除
      </div>
    </div>
  )
}

function MiniStat({ label, value, unit }: { label: string; value: number; unit?: string }) {
  return (
    <div className="mini-stat">
      <div className="helper">{label}</div>
      <div className="value">
        {value}
        {unit ? <span className="unit">{unit}</span> : null}
      </div>
    </div>
  )
}

// 在外部 CSS 文件中新增樣式
// .custom-margin-top {
//   margin-top: 8px;
// }
// .custom-grid {
//   display: grid;
//   grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
//   gap: 12px;
// }
// .chart-container {
//   width: 100%;
//   height: 260px;
// }
// .mini-stat {
//   border: 1px solid var(--card-border);
//   border-radius: 12px;
//   padding: 12px 14px;
//   background: var(--surface);
// }
// .helper {
//   font-size: 13px;
// }
// .value {
//   font-size: 24px;
//   font-weight: 800;
// }
// .unit {
//   font-size: 14px;
//   margin-left: 4px;
// }
