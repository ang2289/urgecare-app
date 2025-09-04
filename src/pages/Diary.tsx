// src/pages/Diary.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import type { DiaryEntry } from '@/types';
import { addEntry, loadEntries, saveEntries, updateEntry, removeEntry } from '../utils/storage'
import { exportDiariesToCSV, downloadBlob } from '@/db/repo';

const isNative = () => Capacitor.getPlatform() !== 'web'

function format(dt: string) {
  const d = new Date(dt)
  const y = d.getFullYear()
  const m = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  const hh = d.getHours().toString().padStart(2, '0')
  const mm = d.getMinutes().toString().padStart(2, '0')
  return `${y}-${m}-${day} ${hh}:${mm}`
}

// 修正型別不匹配問題，確保 undefined 不會傳遞給 string
function safeString(value: string | undefined): string {
  return value || ''
}

export default function Diary() {
  const [text, setText] = useState('')
  const [query, setQuery] = useState('')
  const [list, setList] = useState<DiaryEntry[]>([])
  const [listening, setListening] = useState(false)
  const recogRef = useRef<any>(null)
  const lastFinalRef = useRef<string>('')

  // 編輯狀態
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState<string>('')

  // 初次載入
  useEffect(() => {
    setList(loadEntries())
  }, [])

  // 跨頁同步：其他頁面變動日記時即時刷新
  useEffect(() => {
    const onChanged = () => setList(loadEntries())
    window.addEventListener('urgecare:diary-changed', onChanged)
    return () => window.removeEventListener('urgecare:diary-changed', onChanged)
  }, [])

  const filtered = useMemo(() => {
    if (!query.trim()) return list
    const q = query.toLowerCase()
    return list.filter(x => x.text.toLowerCase().includes(q) || format(x.createdAt).includes(query))
  }, [list, query])

  function onAdd() {
    const t = text.trim()
    if (!t) return
    const next = addEntry(t)
    setList(next)
    setText('')
  }

  // 編輯流程
  function startEdit(e: DiaryEntry) {
    setEditingId(safeString(e.id))
    setEditingText(e.text)
  }
  function cancelEdit() {
    setEditingId(null)
    setEditingText('')
  }
  function saveEdit() {
    if (!editingId) return
    const t = editingText.trim()
    if (!t) {
      alert('內容不可為空')
      return
    }
    const next = updateEntry(editingId, t)
    setList(next)
    cancelEdit()
  }
  function deleteItem(id: string) {
    if (!confirm('確定要刪除這筆日記？')) return
    const next = removeEntry(id)
    setList(next)
    if (editingId === id) cancelEdit()
  }

  // ---- CSV 匯出（直接用 filtered 狀態） ----
  function diariesToCSV(rows: DiaryEntry[]) {
    // 只對長數字或有前導零的內容用公式格式，避免 Excel 科學記號且不出現單引號
    const esc = (s: string) => {
      if (/^\d{10,}$/.test(s) || /^0\d+/.test(s)) {
        return `="${s}"`;
      }
      return `"${String(s).replace(/"/g, '""')}"`;
    };
    const header = ["內容", "建立時間"];
    const lines = [header.join(",")];
    for (const r of rows) {
      lines.push([esc(r.text), esc(format(r.createdAt))].join(","));
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
  const onExportDiaryCSV = () => {
    if (!filtered.length) {
      alert("目前尚無日記可匯出。");
      return;
    }
    const csv = diariesToCSV(filtered);
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    downloadCSV(`diary-logs-${ts}.csv`, csv);
  };

  // ---- 語音：只取 final，避免重覆 ----
  function startVoice() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      alert('此瀏覽器不支援 Web Speech API 語音輸入。')
      return
    }
    const recog = new SR()
    recog.lang = 'zh-TW'
    recog.interimResults = false
    recog.continuous = true
    recog.onresult = (e: any) => {
      const res = e.results[e.results.length - 1]
      if (!res) return
      const t = (res[0]?.transcript || '').trim()
      if (res.isFinal && t && t !== lastFinalRef.current) {
        lastFinalRef.current = t
        setText(prev => (prev.trim() ? prev + ' ' : '') + t)
      }
    }
    recog.onend = () => setListening(false)
    recog.onerror = () => setListening(false)
    recogRef.current = recog
    lastFinalRef.current = ''
    setListening(true)
    recog.start()
  }
  function stopVoice() {
    try {
      recogRef.current?.stop?.()
    } catch {}
    setListening(false)
  }

  function clearAll() {
    if (!confirm('確定要清除所有日記？此操作無法復原。')) return
    saveEntries([])
    setList([])
    cancelEdit()
  }

  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.warn("Adsense error", e);
    }
  }, []);

  return (
    <div className="container">
      <div className="title title-margin">
        日記
      </div>
      <div className="helper">
        記下想法、衝動與對策。支援搜尋、語音輸入、CSV 匯出，並可編輯與刪除。
      </div>

      {/* 輸入卡片 */}
      <div className="card">
        <div className="form-narrow">
          <label htmlFor="diaryText">日記內容</label>
          <textarea
            id="diaryText"
            name="diaryText"
            title="Diary Entry"
            className="textarea textarea-lg"
            placeholder="寫下此刻的想法或計劃…"
            value={text}
            onChange={e => setText(e.target.value)}
            aria-label="請輸入內容"
          />
          <div className="actions-row">
            {!listening ? (
              <button className="btn btn-xl btn-xl" onClick={startVoice}>
                🎤 語音
              </button>
            ) : (
              <button className="btn btn-danger btn-xl btn-xl" onClick={stopVoice}>
                ■ 停止
              </button>
            )}
            <button className="btn btn-success btn-xl" onClick={onAdd} disabled={!text.trim()}>
              新增日記
            </button>
            <button className="btn btn-danger btn-xl" onClick={clearAll} disabled={list.length === 0}>
              清除全部
            </button>
          </div>
        </div>
      </div>

      {/* 搜尋卡片 */}
      <div className="card">
        <div className="section-title text-lg">搜尋</div>
        <input
          className="input input-lg"
          placeholder="輸入文字或日期（例如 2025-08-21）"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      {/* 列表卡片 */}
      <div className="card">
        <div className="section-title flex items-center justify-between">
          <span className="text-lg">列表</span>
          <button className="btn" onClick={onExportDiaryCSV} disabled={filtered.length === 0} title={filtered.length === 0 ? '沒有資料可匯出' : '匯出 CSV'}>
            匯出 CSV
          </button>
        </div>

        {/* Google AdSense 廣告區塊 */}
        <div className="my-8 flex justify-center">
          <ins className="adsbygoogle"
            style={{ display: 'block' }}
            data-ad-client="ca-pub-0000000000000000"
            data-ad-slot="1234567890"
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>
        <div className="list">
          {filtered.length === 0 && <div className="helper">目前沒有資料</div>}

          {filtered.map(x => (
            <div className="item" key={x.id}>
              {/* 內容 */}
              {editingId === x.id ? (
                <textarea
                  className="textarea textarea-lg"
                  value={editingText}
                  onChange={e => setEditingText(e.target.value)}
                  rows={3}
                  aria-label="請編輯內容"
                />
              ) : (
                <>
                  <div className="one-line" title={x.text}>
                    {x.text}
                  </div>
                  <div className="meta">{format(x.createdAt)}</div>
                </>
              )}

              {/* 按鈕區 */}
              <div className="flex gap-3 flex-margin">
                {editingId === x.id ? (
                  <>
                    <button className="btn btn-success btn-xl" onClick={saveEdit}>
                      儲存
                    </button>
                    <button className="btn btn-xl" onClick={cancelEdit}>
                      取消
                    </button>
                  </>
                ) : (
                  <>
                    <button className="btn btn-xl" onClick={() => startEdit(x)}>
                      編輯
                    </button>
                    <button className="btn btn-danger btn-xl" onClick={() => deleteItem(safeString(x.id))}>
                      刪除
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
