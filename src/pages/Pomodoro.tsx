import React, { useEffect, useRef, useState } from 'react'
import { addPomoSession, listRecentPomo } from '../storage/pomodoroStorage'

export default function PomodoroPage() {
  const [minutes, setMinutes] = useState<number>(25)
  const [secondsLeft, setSecondsLeft] = useState<number>(25 * 60)
  const [running, setRunning] = useState(false)
  const [label, setLabel] = useState('')
  const [startedAt, setStartedAt] = useState<string | null>(null)
  const [recent, setRecent] = useState<any[]>([])
  const timerRef = useRef<number | null>(null)

  async function refreshRecent() {
    setRecent(await listRecentPomo(20))
  }
  useEffect(() => {
    refreshRecent()
  }, [])

  useEffect(() => {
    setSecondsLeft(minutes * 60)
  }, [minutes])

  useEffect(() => {
    if (!running) return
    if (!startedAt) setStartedAt(new Date().toISOString())
    timerRef.current = window.setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          window.clearInterval(timerRef.current!) // eslint-disable-line @typescript-eslint/no-non-null-assertion
          timerRef.current = null
          setRunning(false)
          const endedAt = new Date().toISOString()
          const mins = minutes
          addPomoSession(startedAt || endedAt, endedAt, mins, label || undefined).then(
            refreshRecent
          )
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [running])

  function start() {
    setSecondsLeft(minutes * 60)
    setStartedAt(new Date().toISOString())
    setRunning(true)
  }
  function pause() {
    if (timerRef.current) window.clearInterval(timerRef.current)
    timerRef.current = null
    setRunning(false)
  }
  function reset() {
    if (timerRef.current) window.clearInterval(timerRef.current)
    timerRef.current = null
    setRunning(false)
    setSecondsLeft(minutes * 60)
    setStartedAt(null)
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')

  // 圓形進度（0~1）
  const total = Math.max(1, minutes * 60)
  const progress = 1 - secondsLeft / total
  const R = 80
  const C = 2 * Math.PI * R

  return (
    <div className="container">
      <div className="title" style={{ marginTop: 8 }}>
        番茄鐘
      </div>
      <div className="card form-narrow">
        <div className="section-title">設定</div>
        <div className="row">
          <input
            className="input"
            type="number"
            min={1}
            max={120}
            value={minutes}
            onChange={e => setMinutes(Math.max(1, Number(e.target.value || 25)))}
          />
          <input
            className="input"
            placeholder="這次專注的內容（可選）"
            value={label}
            onChange={e => setLabel(e.target.value)}
          />
        </div>
      </div>
      <div className="card form-narrow" style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <svg width="220" height="220" viewBox="0 0 200 200">
            <circle
              cx="100"
              cy="100"
              r="80"
              stroke="var(--card-border)"
              strokeWidth="12"
              fill="none"
            />
            <circle
              cx="100"
              cy="100"
              r="80"
              stroke="var(--primary)"
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="502 502"
              strokeDashoffset="{502 * (1 - progress)}"
              transform="rotate(-90 100 100)"
            />
            <text
              x="100"
              y="110"
              textAnchor="middle"
              fontSize="36"
              fontWeight="800"
              fill="currentColor"
            >
              {mm}:{ss}
            </text>
          </svg>
        </div>
        <div className="actions-row">
          {!running && (
            <button className="btn btn-primary" onClick={start}>
              開始
            </button>
          )}
          {running && (
            <button className="btn" onClick={pause}>
              暫停
            </button>
          )}
          <button className="btn" onClick={reset}>
            重設
          </button>
        </div>
      </div>
      <div className="card form-narrow">
        <div className="section-title">最近完成</div>
        {recent.length === 0 && <div className="helper">尚無紀錄</div>}
        <div className="list">
          {recent.map(r => (
            <div
              key={r.id}
              className="item"
            >
              <div className="helper helper-small">
                {new Date(r.endedAt).toLocaleString()}
              </div>
              <div className="item-bold">{r.minutes} 分</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
