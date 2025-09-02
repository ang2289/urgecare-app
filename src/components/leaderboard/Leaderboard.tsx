import { listDelaysSince } from '@/db/repo'
import { useEffect, useMemo, useState } from 'react'

export default function Leaderboard() {
  const [delays, setDelays] = useState([] as Awaited<ReturnType<typeof listDelaysSince>>)
  useEffect(() => {
    listDelaysSince('14').then(setDelays)
  }, [])

  const stats = useMemo(() => {
    // 以 source 匯總：誰最常觸發延遲（示例：系統/手動）
    const map = new Map<string, number>()
    for (const d of delays) map.set(d.source, (map.get(d.source) || 0) + d.minutes)
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  }, [delays])

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold">近14天延遲統計</h3>
      <ul className="space-y-1">
        {stats.map(([source, minutes]) => (
          <li key={source} className="card p-2 flex justify-between">
            <span>{source.toUpperCase()}</span>
            <span>{minutes} 分</span>
          </li>
        ))}
      </ul>
      <a href="/settings" className="btn">
        前往設定危險時段 / 備份
      </a>
    </div>
  )
}
