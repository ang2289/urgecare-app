import React, { useEffect, useState } from 'react'
import {
  addExperience,
  loadExperiences,
  deleteExperience,
  exportExperiencesCSV,
} from '../storage/experienceStorage'

export default function ExperienceWall() {
  const [list, setList] = useState<{ id: string; text: string; createdAt: string }[]>([])
  const [text, setText] = useState('')
  const [q, setQ] = useState('')

  async function refresh() {
    try {
      const rows = await loadExperiences()
      setList(rows)
    } catch (e) {
      console.error('loadExperiences failed', e)
      alert('讀取心得牆資料失敗，請確認已安裝 Dexie（npm i dexie）')
    }
  }
  useEffect(() => {
    refresh()
  }, [])

  async function onAdd() {
    const t = text.trim()
    if (!t) return
    await addExperience(t)
    setText('')
    await refresh()
  }
  async function onDel(id: string) {
    if (!confirm('確定刪除此心得？')) return
    await deleteExperience(id)
    await refresh()
  }
  async function onExportCSV() {
    const csv = await exportExperiencesCSV()
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'experiences.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = q.trim() ? list.filter(x => x.text.includes(q.trim())) : list

  return (
    <div className="container">
      <div className="title" style={{ marginTop: 8 }}>
        心得牆
      </div>

      <div className="card form-narrow">
        <div className="section-title">新增心得</div>
        <textarea
          aria-label="請輸入內容"
          className="textarea"
          placeholder="今天的收穫／感想…"
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <div className="actions-row" style={{ marginTop: 8 }}>
          <button className="btn btn-primary" onClick={onAdd}>
            新增
          </button>
          <button className="btn" onClick={onExportCSV}>
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
        <div className="section-title">全部心得</div>
        {filtered.length === 0 && <div className="helper">目前沒有資料</div>}
        <div className="list">
          {filtered.map(x => (
            <div
              key={x.id}
              className="item"
              style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}
            >
              <div>
                <div className="one-line" title={x.text} style={{ marginBottom: 4 }}>
                  {x.text}
                </div>
                <div className="helper" style={{ fontSize: 12 }}>
                  {new Date(x.createdAt).toLocaleString()}
                </div>
              </div>
              <button className="btn btn-danger" onClick={() => onDel(x.id)}>
                刪除
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
