// src/pages/Wish.tsx
import React, { useEffect, useMemo, useState } from 'react'
import { db } from '../db'
import { exportWishesToCSV, downloadBlob } from '@/db/repo'
import type { WishItem } from '@/types';

type Wish = {
  id?: string
  text: string
  createdAt: string
  votes: number
}

const KEY = 'urgecare.wish.v1'
const uid = () => crypto.randomUUID()

function load(): Wish[] {
  try {
    const raw = localStorage.getItem(KEY)
    const arr = raw ? JSON.parse(raw) : []
    if (Array.isArray(arr)) return arr
  } catch {}
  return []
}
function save(list: Wish[]) {
  localStorage.setItem(KEY, JSON.stringify(list))
}

export default function WishPage() {
  const [list, setList] = useState<Wish[]>([])
  const [text, setText] = useState('')
  const [q, setQ] = useState('')

  // Load initial wishes from IndexedDB
  useEffect(() => {
    db.wishes.orderBy('createdAt').reverse().toArray().then(setList)
  }, [])

  async function add() {
    const t = text.trim()
    if (!t) return
    const createdAt = new Date().toISOString()
    await db.wishes.add({ text: t, votes: 0, createdAt })
    const updated = await db.wishes.orderBy('createdAt').reverse().toArray()
    setList(updated)
    setText('')
  }

  async function upvote(id: string) {
    const w = await db.wishes.get(id)
    if (!w) return
    await db.wishes.update(id, { votes: (w.votes || 0) + 1 })
    const updated = await db.wishes.orderBy('createdAt').reverse().toArray()
    setList(updated)
  }

  async function del(id: string) {
    if (!confirm('確定刪除這個願望？')) return
    await db.wishes.delete(id)
    const updated = await db.wishes.orderBy('createdAt').reverse().toArray()
    setList(updated)
  }
  async function handleExportWishes() {
    try {
      console.log('[Wish] Export Wishes CSV start')
      const blob = await exportWishesToCSV()
      downloadBlob(`UrgeCare-wishes-${new Date().toISOString().slice(0, 10)}.csv`, blob)
      alert('✅ 匯出願望 CSV 成功')
    } catch (e) {
      console.error(e)
      if (e instanceof Error) alert(e.message);
    }
  }

  const filtered = useMemo(() => {
    const s = q.trim()
    return s ? list.filter(w => w.text.includes(s)) : list
  }, [q, list])

  return (
    <div className="container">
      <div className="title title-margin">
        許願牆
      </div>
      <div className="helper">留下你的願望，彼此 +1 彼此鼓勵。</div>

      <div className="card form-narrow">
        <div className="section-title">新增願望</div>
        <textarea
          aria-label="請輸入內容"
          className="textarea"
          placeholder="輸入願望內容…"
          value={text}
          onChange={e => setText(e.target.value)}
          rows={3}
        />
        <div className="actions-row" style={{ marginTop: 8 }}>
          <button className="btn btn-primary" onClick={add}>
            新增
          </button>
          <button className="btn" onClick={handleExportWishes}>
            匯出 CSV
          </button>
        </div>
      </div>

      <div className="card form-narrow">
        <div className="section-title">搜尋</div>
        <input
          className="input"
          placeholder="輸入關鍵字過濾"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
      </div>

      <div className="card form-narrow">
        <div className="section-title">全部願望</div>
        {filtered.length === 0 && <div className="helper">目前沒有資料</div>}
        <div className="list">
          {filtered.map(w => (
            <div
              key={w.id}
              className="item"
              style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}
            >
              <div>
                <div className="one-line" title={w.text} style={{ marginBottom: 4 }}>
                  {w.text}
                </div>
                <div className="helper" style={{ fontSize: 12 }}>
                  {new Date(w.createdAt).toLocaleString()}．{w.votes} 票
                </div>
              </div>
              <div className="actions-row" style={{ alignItems: 'center' }}>
                <button className="btn btn-success" onClick={() => upvote(w.id || '')}>
                  +1
                </button>
                <button className="btn btn-danger" onClick={() => del(w.id || '')}>
                  刪除
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
