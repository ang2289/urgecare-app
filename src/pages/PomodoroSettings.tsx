// 極簡版番茄鐘設定頁面
import React, { useState } from 'react'

export default function PomodoroSettings() {
  const [focusMinutes, setFocusMinutes] = useState(() => parseInt(localStorage.getItem('uc_pomodoro_minutes') || '25'))
  const [shortBreakMinutes, setShortBreakMinutes] = useState(() => parseInt(localStorage.getItem('uc_pomodoro_shortBreak') || '5'))
  const [longBreakMinutes, setLongBreakMinutes] = useState(() => parseInt(localStorage.getItem('uc_pomodoro_longBreak') || '15'))
  const [longBreakInterval, setLongBreakInterval] = useState(() => parseInt(localStorage.getItem('uc_pomodoro_longBreakInterval') || '4'))
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('uc_pomodoro_soundEnabled') === 'true')

  // 儲存設定到 localStorage
  const saveSettings = () => {
    localStorage.setItem('uc_pomodoro_minutes', focusMinutes.toString())
    localStorage.setItem('uc_pomodoro_shortBreak', shortBreakMinutes.toString())
    localStorage.setItem('uc_pomodoro_longBreak', longBreakMinutes.toString())
    localStorage.setItem('uc_pomodoro_longBreakInterval', longBreakInterval.toString())
    localStorage.setItem('uc_pomodoro_soundEnabled', soundEnabled.toString())
    alert('設定已儲存!')
    window.location.href = '#/pomodoro'
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">番茄鐘設定</h2>
        <button className="btn" onClick={() => window.location.href = '#/pomodoro'}>
          返回
        </button>
      </div>

      <div className="flex flex-col gap-4">
        <label>
          專注時間（分鐘）:
          <input
            type="number"
            value={focusMinutes}
            onChange={e => setFocusMinutes(parseInt(e.target.value || '0'))}
            className="input"
          />
        </label>
        <label>
          短休息（分鐘）:
          <input
            type="number"
            value={shortBreakMinutes}
            onChange={e => setShortBreakMinutes(parseInt(e.target.value || '0'))}
            className="input"
          />
        </label>
        <label>
          長休息（分鐘）:
          <input
            type="number"
            value={longBreakMinutes}
            onChange={e => setLongBreakMinutes(parseInt(e.target.value || '0'))}
            className="input"
          />
        </label>
        <label>
          長休息間隔（次）:
          <input
            type="number"
            value={longBreakInterval}
            onChange={e => setLongBreakInterval(parseInt(e.target.value || '0'))}
            className="input"
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={soundEnabled}
            onChange={e => setSoundEnabled(e.target.checked)}
          />
          完成時播放音效
          <button className="btn" onClick={() => {
            const audio = new Audio(
              'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABYBHQAAAB8AAAB/f39/f39/f39/f38/Pz8/Pw=='
            )
            audio.play()
          }}>
            🔊 試聽
          </button>
        </label>
      </div>

      <div className="flex justify-end gap-4">
        <button className="btn" onClick={saveSettings}>
          儲存
        </button>
      </div>
    </div>
  )
}
