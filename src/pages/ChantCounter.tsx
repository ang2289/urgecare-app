import React, { useEffect, useMemo, useState } from 'react'
import { listMantras, addMantra, deleteMantra } from '@/db/repo'
import { useLiveQuery } from 'dexie-react-hooks'
import { chantTotal$, getCounts, getDefaultMantraId, saveCurrentMantraId, chantIncrement, clearToday, clearTotal } from '@/db/repo'

interface ChantCounterProps {
  title?: string;
  showClearTotal?: boolean;
}

export default function ChantCounter({ title, showClearTotal }: ChantCounterProps) {
  const [mantras, setMantras] = useState<{ id: string; name: string }[]>([])
  const [currentId, setCurrentId] = useState<string>(() => getDefaultMantraId(mantras))
  const [newName, setNewName] = useState('')
  const current = useMemo(() => mantras.find(m => m.id === currentId), [mantras, currentId])
  const chantTotal = useLiveQuery(() => chantTotal$)
  const counts = useLiveQuery(() => getCounts(currentId))

  async function refresh() {
    const ms = await listMantras()
    setMantras(ms)
    if (!currentId && ms[0]?.id) setCurrentId(ms[0].id)
  }
  useEffect(() => {
    refresh()
  }, [])
  useEffect(() => {
    if (currentId) getCounts(currentId).then()
  }, [currentId])

  async function onAddMantra() {
    const name = newName.trim()
    if (!name) return
    const m = await addMantra(name)
    setNewName('')
    await refresh()
    setCurrentId(m.id)
  }
  const onInc = async (delta: number) => {
    if (delta === 1) {
      await chantIncrement()
    } else {
      console.warn('Unsupported increment value:', delta)
    }
  }

  // 確保安全預設值
  const safeMantras = mantras.length > 0 ? mantras : [{ id: 'default', name: '（無資料）' }]
  const selectedMantra = currentId ? currentId : '（無資料）'

  return (
    <div className="chant-counter-container">
      <div className="title title-margin">
        {title || '誦念計數器'}
      </div>
      <div className="card form-narrow">
        <div className="section-title">選擇經文 / 咒語</div>
        <div className="row">
          <select className="input" value={selectedMantra} onChange={e => {
            const newId = e.target.value;
            setCurrentId(newId);
            saveCurrentMantraId(newId);
          }} title="Select chant type">
            {safeMantras.map(m => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <button
            className="btn btn-danger"
            disabled={!currentId}
            onClick={async () => {
              if (!currentId) return
              if (!confirm('刪除後此經文的累計也會一併移除，確定？')) return
              await deleteMantra(currentId)
              setCurrentId('')
              await refresh()
            }}
          >
            刪除經文
          </button>
        </div>
        <div className="row row-margin">
          <input
            className="input"
            placeholder="新增經文名稱"
            value={newName}
            onChange={e => setNewName(e.target.value)}
          />
          <button className="btn btn-primary" onClick={onAddMantra}>
            新增
          </button>
        </div>
      </div>

      <div className="card form-narrow">
        <div className="section-title">今日 / 總計</div>
        <div className="row row-gap">
          <Stat label="今日" value={counts?.today || 0} />
          <Stat label="總計" value={counts?.total || 0} />
        </div>
        <div className="actions-row actions-row-margin">
          <button className="btn btn-success" onClick={() => onInc(1)}>
            +1
          </button>
          <button className="btn" onClick={() => onInc(10)}>
            +10
          </button>
          <button className="btn" onClick={() => onInc(108)}>
            +108
          </button>
        </div>
        <div className="actions-row actions-row-margin">
          <button className="btn" onClick={async () => {
              if (!currentId) return
              await clearToday(currentId)
            }}
          >
            清除今日
          </button>
          {showClearTotal && (
            <button
              className="btn btn-danger"
              onClick={async () => {
                if (!currentId) return
                if (!confirm('確定清除總計？')) return
                await clearTotal(currentId)
              }}
            >
              清除總計
            </button>
          )}
        </div>
      </div>
      <div>
        <h1>Chant Total: {safeRender(chantTotal, 0)}</h1>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        minWidth: 140,
        border: '1px solid var(--card-border)',
        borderRadius: 12,
        padding: '12px 14px',
        background: 'var(--surface)',
      }}
    >
      <div className="helper helper-font">
        {label}
      </div>
      <div className="value-font">{value}</div>
    </div>
  )
}

function safeRender(value: any, fallback: string | number = '載入中') {
  if (typeof value === 'number' || typeof value === 'string') {
    return value
  }
  console.warn('Invalid value for rendering:', value)
  return fallback
}
