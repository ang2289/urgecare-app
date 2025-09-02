import React, { useRef, useState } from 'react'
import { exportAllToJSON, importFromJSON, exportDiariesToCSV, exportWishesToCSV, downloadBlob, downloadText } from '@/db/repo'
import { exportDiaryCSVSafe } from '@/utils/backup'

export default function Settings() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  async function handleExportJSON() {
    try {
      console.log('[Settings] Export JSON start')
      setBusy(true)
      const json = await exportAllToJSON()
      downloadText(`UrgeCare-backup-${new Date().toISOString().slice(0, 10)}.json`, json)
      alert('✅ Export JSON success')
    } catch (e: any) {
      console.error(e)
      alert('❌ Export JSON failed: ' + e.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleExportDiaries() {
    try {
      console.log('[Settings] Export Diaries CSV start')
      setBusy(true)
      const blob = await exportDiariesToCSV()
      downloadBlob(`UrgeCare-diaries-${new Date().toISOString().slice(0, 10)}.csv`, blob)
      alert('✅ Export Diaries CSV success')
    } catch (e: any) {
      console.error(e)
      alert('❌ Export Diaries CSV failed: ' + e.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleExportWishes() {
    try {
      console.log('[Settings] Export Wishes CSV start')
      setBusy(true)
      const blob = await exportWishesToCSV()
      downloadBlob(`UrgeCare-wishes-${new Date().toISOString().slice(0, 10)}.csv`, blob)
      alert('✅ Export Wishes CSV success')
    } catch (e: any) {
      console.error(e)
      alert('❌ Export Wishes CSV failed: ' + e.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleExportDiaryCSVSafe() {
    try {
      console.log('[Settings] Export Diary CSV (Safe) start')
      setBusy(true)
      const blob = await exportDiaryCSVSafe()
      downloadBlob(`UrgeCare-diary-safe-${new Date().toISOString().slice(0, 10)}.csv`, blob)
      alert('✅ Export Diary CSV (Safe) success')
    } catch (e: any) {
      console.error(e)
      alert('❌ Export Diary CSV (Safe) failed: ' + e.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleImport(mode: 'merge' | 'overwrite') {
    const f = fileRef.current?.files?.[0]
    if (!f) {
      alert('請先選擇 JSON 檔')
      return
    }
    const text = await f.text()
    try {
      console.log(`🚀 匯入 JSON (${mode}) start`)
      setBusy(true)
      await importFromJSON(text, mode)
      alert(`✅ 匯入完成（${mode === 'merge' ? '合併' : '覆蓋'}）`)
      location.reload()
    } catch (e: any) {
      console.error(e)
      alert('❌ 匯入失敗：' + e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container">
      <h2 className="title">設定</h2>

      <div className="card form-narrow">
        <div className="section-title">備份與還原</div>
        <div className="helper">匯出包含：日記、許願、支持牆照片（base64）。</div>

        <div className="actions-row">
          <button className="btn" disabled={busy} onClick={handleExportJSON}>匯出 JSON（完整）</button>
          <button className="btn" disabled={busy} onClick={handleExportDiaries}>匯出 日記 CSV</button>
          <button className="btn" disabled={busy} onClick={handleExportWishes}>匯出 許願 CSV</button>
          <button className="btn" disabled={busy} onClick={() => alert('SAFE BTN ✓')}>匯出 日記 CSV（安全）</button>
        </div>

        <div className="row custom-margin">
          <input ref={fileRef} type="file" accept="application/json" className="input" aria-label="請選擇檔案" />
          <button className="btn btn-primary" disabled={busy} onClick={() => handleImport('merge')}>
            匯入（合併）
          </button>
          <button className="btn btn-danger" disabled={busy} onClick={() => handleImport('overwrite')}>
            匯入（覆蓋）
          </button>
        </div>
      </div>

      {/* <div className="card">
        <div className="section-title">排行榜設定</div>
        <div className="helper">...</div>
      </div> */}
    </div>
  )
}

// 在外部 CSS 文件中新增樣式
// .custom-margin {
//   margin-top: 8px;
//   gap: 8px;
// }
