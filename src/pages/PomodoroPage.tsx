// 極簡版番茄鐘頁面
import { useEffect, useState } from 'react'

export default function PomodoroPage() {
  const [secondsLeft, setSecondsLeft] = useState(() => {
    const minutes = parseInt(localStorage.getItem('uc_pomodoro_minutes') || '25')
    return minutes * 60
  })
  const [timerRunning, setTimerRunning] = useState(false)
  let timer: number | null = null

  useEffect(() => {
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [])

  const startTimer = () => {
    if (!timerRunning) {
      setTimerRunning(true)
      timer = window.setInterval(() => {
        setSecondsLeft(prev => (prev > 0 ? prev - 1 : 0))
      }, 1000)
    }
  }

  const pauseTimer = () => {
    if (timerRunning && timer) {
      clearInterval(timer)
      setTimerRunning(false)
    }
  }

  const resetTimer = () => {
    if (timer) clearInterval(timer)
    const minutes = parseInt(localStorage.getItem('uc_pomodoro_minutes') || '25')
    setSecondsLeft(minutes * 60)
    setTimerRunning(false)
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">番茄鐘</h2>
        <button className="btn" onClick={() => window.location.href = '#/pomodoro-settings'}>
          設定
        </button>
      </div>
      <div className="text-2xl">剩餘時間: {mm}:{ss}</div>
      <div className="flex gap-4">
        <button className="btn" onClick={startTimer}>開始</button>
        <button className="btn" onClick={pauseTimer}>暫停</button>
        <button className="btn" onClick={resetTimer}>歸零</button>
      </div>
    </div>
  )
}
