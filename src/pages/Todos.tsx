// src/pages/Todos.tsx
import React, { useEffect, useRef, useState } from 'react'
import type { Todo } from '../types'
import { loadTodos, saveTodos } from '../utils/storage'

function hashJson(x: unknown) {
  try {
    return JSON.stringify(x)
  } catch {
    return ''
  }
}

export default function Todos() {
  const [input, setInput] = useState('')
  const [list, setList] = useState<Todo[]>([])
  const lastHashRef = useRef<string>('') // 上次資料雜湊
  const mutatingRef = useRef<boolean>(false) // 本元件正在寫入中（略過自產事件）
  const handlingRef = useRef<boolean>(false) // 正在處理事件（避免同輪 re-entrancy）

  // 初次載入 + 只掛一次事件監聽
  useEffect(() => {
    const init = loadTodos()
    setList(init)
    lastHashRef.current = hashJson(init)

    const onChanged = () => {
      if (mutatingRef.current) return // 自己剛存的，略過
      if (handlingRef.current) return // 同一輪事件連鎖中，略過
      handlingRef.current = true
      // 放到下一個 event loop，再比對一次再更新（去同步 & 去抖）
      setTimeout(() => {
        try {
          const next = loadTodos()
          const nextHash = hashJson(next)
          if (nextHash !== lastHashRef.current) {
            setList(next)
            lastHashRef.current = nextHash
          }
        } finally {
          handlingRef.current = false
        }
      }, 0)
    }

    window.addEventListener('urgecare:todos-changed', onChanged)
    return () => window.removeEventListener('urgecare:todos-changed', onChanged)
  }, [])

  function afterLocalUpdate(next: Todo[]) {
    setList(next)
    lastHashRef.current = hashJson(next)
    // 讓 storage.emit（setTimeout 0）先發完這一輪事件，再解除 mutating
    setTimeout(() => {
      mutatingRef.current = false
    }, 0)
  }

  function onAdd() {
    const t = input.trim()
    if (!t) return
    const item: Todo = {
      id: crypto.randomUUID(),
      text: t,
      done: false,
      createdAt: new Date().toISOString(),
    }
    const next = [item, ...list]
    mutatingRef.current = true
    saveTodos(next) // 會非同步 emit
    afterLocalUpdate(next)
    setInput('')
  }

  function onToggle(id: string) {
    const next = list.map(x => (x.id === id ? { ...x, done: !x.done } : x))
    mutatingRef.current = true
    saveTodos(next)
    afterLocalUpdate(next)
  }

  function onRemove(id: string) {
    if (!confirm('確定刪除此待辦？')) return
    const next = list.filter(x => x.id !== id)
    mutatingRef.current = true
    saveTodos(next)
    afterLocalUpdate(next)
  }

  function onClear() {
    if (!confirm('清除全部待辦？')) return
    const next: Todo[] = []
    mutatingRef.current = true
    saveTodos(next)
    afterLocalUpdate(next)
  }

  // 匯出 CSV 功能（與日記本一致）
  function todosToCSV(rows: Todo[]) {
    const esc = (s: string) => {
      if (/^\d{10,}$/.test(s) || /^0\d+/.test(s)) {
        return `="${s}"`;
      }
      return `"${String(s).replace(/"/g, '""')}"`;
    };
    const header = ["內容", "完成", "建立時間"];
    const lines = [header.join(",")];
    for (const r of rows) {
      lines.push([
        esc(r.text),
        esc(r.done ? "已完成" : "未完成"),
        esc(new Date(r.createdAt).toLocaleString())
      ].join(","));
    }
    return lines.join("\r\n");
  }
  function downloadCSV(filename: string, csv: string) {
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }
  function onExportCSV() {
    if (!list.length) {
      alert("目前尚無待辦可匯出。");
      return;
    }
    const csv = todosToCSV(list);
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    downloadCSV(`todo-logs-${ts}.csv`, csv);
  }

  return (
    <div className="container">
      <div className="title" style={{ marginTop: 8 }}>
        待辦事項
      </div>
      <div className="helper">寫下可以取代衝動的小任務；打勾完成或刪除。資料保存在本機。</div>

      <div className="card">
        <div className="section-title">新增待辦</div>
        <div className="flex gap-3 flex-wrap">
          <input
            className="input"
            placeholder="例如：喝 300 ml 水、走路 3 分鐘"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') onAdd()
            }}
          />
          <button className="btn btn-success" onClick={onAdd}>
            加入
          </button>
          <button className="btn btn-danger" onClick={onClear}>
            清除全部
          </button>
        </div>
      </div>

      <div className="card">
        <div className="section-title flex items-center justify-between">
          <span>列表</span>
          <button className="btn" onClick={onExportCSV} disabled={list.length === 0} title={list.length === 0 ? '沒有資料可匯出' : '匯出 CSV'}>
            匯出 CSV
          </button>
        </div>
        {list.length === 0 && <div className="helper">目前沒有待辦</div>}

        <div
          className="list todo-list"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: 12,
          }}
        >
          {list.map(t => (
            <div key={t.id} className="item">
              <div
                className="flex"
                style={{ justifyContent: 'space-between', alignItems: 'center' }}
              >
                <label
                  className="one-line"
                  style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1 }}
                >
                  <input type="checkbox" checked={!!t.done} onChange={() => onToggle(t.id)} />
                  <span
                    style={{
                      textDecoration: t.done ? 'line-through' : 'none',
                      opacity: t.done ? 0.7 : 1,
                    }}
                  >
                    {t.text}
                  </span>
                </label>
                <button className="btn btn-danger" onClick={() => onRemove(t.id)}>
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
