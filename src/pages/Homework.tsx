import React, { useEffect, useState } from 'react'
import {
  listHomework,
  addHomework,
  deleteHomework,
  logHomework,
  getHomeworkToday,
} from '../storage/homeworkStorage'

type HW = { id: string; title: string; createdAt: string }

export default function HomeworkPage() {
  const [list, setList] = useState<HW[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [todayAmount, setTodayAmount] = useState<Record<string, number>>({})

  async function refresh() {
    const l = await listHomework()
    setList(l)
    const map: Record<string, number> = {}
    for (const h of l) {
      map[h.id] = await getHomeworkToday(h.id)
    }
    setTodayAmount(map)
  }
  useEffect(() => {
    refresh()
  }, [])

  async function onAdd() {
    const t = newTitle.trim()
    if (!t) return
    await addHomework(t)
    setNewTitle('')
    await refresh()
  }
  async function onPlus(id: string, inc: number) {
    await logHomework(id, inc)
    await refresh()
  }
  async function onDel(id: string) {
    if (!confirm('確定刪除此功課與其今日記錄？')) return
    await deleteHomework(id)
    await refresh()
  }

  return (
    <div className="container">
      <div className="title" style={{ marginTop: 8 }}>
        功課
      </div>
      <div className="card form-narrow">
        <div className="section-title">新增功課項目</div>
        <div className="row">
          <input
            className="input"
            placeholder="例：早課 108 次、抄寫一頁…"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
          />
          <button className="btn btn-primary" onClick={onAdd}>
            新增
          </button>
        </div>
      </div>

      <div className="card form-narrow">
        <div className="section-title">今日進度</div>
        {list.length === 0 && <div className="helper">尚未建立功課</div>}
        <div className="list">
          {list.map(h => (
            <div
              key={h.id}
              className="item"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: 10,
                alignItems: 'center',
              }}
            >
              <div>
                <div className="one-line" style={{ fontWeight: 700 }}>
                  {h.title}
                </div>
                <div className="helper" style={{ fontSize: 12 }}>
                  今日：{todayAmount[h.id] || 0}
                </div>
              </div>
              <div className="actions-row">
                <button className="btn btn-success" onClick={() => onPlus(h.id, 1)}>
                  +1
                </button>
                <button className="btn" onClick={() => onPlus(h.id, 10)}>
                  +10
                </button>
                <button className="btn btn-danger" onClick={() => onDel(h.id)}>
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
