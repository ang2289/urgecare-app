import React, { useState } from 'react'
import PillButton from '../components/PillButton'
import PomodoroTimer from '../components/pomodoro/PomodoroTimer'
import SOS from './SOS'

type Tab = 'diary' | 'sos'

export default function Home() {
  const [tab, setTab] = useState<Tab>('diary') // 預設顯示「日記」

  return (
    <div>
      <div className="container" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
        <div className="pillbar">
          <PillButton label="日記" active={tab === 'diary'} onClick={() => setTab('diary')} />
          <PillButton label="SOS 延遲" active={tab === 'sos'} onClick={() => setTab('sos')} />
        </div>
      </div>

      {tab === 'diary' ? <PomodoroTimer /> : <SOS />}
    </div>
  )
}
