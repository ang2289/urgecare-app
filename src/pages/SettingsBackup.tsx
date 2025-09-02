import { useRef, useState } from 'react'
import { exportAllToJSON, importFromJSON, downloadBlob, downloadText, exportDiariesToCSV, exportWishesToCSV } from '@/db/repo'
import { exportDiaryCSVSafe } from '@/utils/backup'

export default function SettingsBackup() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [importMode, setImportMode] = useState<'merge' | 'overwrite'>('merge')
  const [working, setWorking] = useState(false)

  async function onExportJSON() {
    try {
      console.log('[ui] export JSON')
      setWorking(true)
      const json = await exportAllToJSON()
      downloadText(`UrgeCare-backup-${new Date().toISOString().slice(0, 10)}.json`, json)
      alert('✅ 匯出 JSON 成功')
    } catch (e) {
      console.error(e)
      alert('❌ 匯出 JSON 失敗')
    } finally {
      setWorking(false)
    }
  }

  async function onExportDiariesCSV() {
    try {
      console.log('[ui] export diaries CSV')
      setWorking(true)
      const blob = await exportDiariesToCSV()
      downloadBlob(`UrgeCare-diaries-${new Date().toISOString().slice(0, 10)}.csv`, blob)
      alert('✅ 匯出日記 CSV 成功')
    } catch (e) {
      console.error(e)
      alert('❌ 匯出日記 CSV 失敗')
    } finally {
      setWorking(false)
    }
  }

  async function onExportWishesCSV() {
    try {
      console.log('[ui] export wishes CSV')
      setWorking(true)
      const blob = await exportWishesToCSV()
      downloadBlob(`UrgeCare-wishes-${new Date().toISOString().slice(0, 10)}.csv`, blob)
      alert('✅ 匯出許願 CSV 成功')
    } catch (e) {
      console.error(e)
      alert('❌ 匯出許願 CSV 失敗')
    } finally {
      setWorking(false)
    }
  }

  async function onExportDiaryCSVSafe() {
    try {
      console.log('[ui] export diary CSV (safe)')
      setWorking(true)
      const blob = await exportDiaryCSVSafe()
      downloadBlob(`UrgeCare-diary-safe-${new Date().toISOString().slice(0, 10)}.csv`, blob)
      alert('✅ 匯出日記 CSV（安全）成功')
    } catch (e) {
      console.error(e)
      alert('❌ 匯出日記 CSV（安全）失敗')
    } finally {
      setWorking(false)
    }
  }

  async function onChooseFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const text = await f.text()
    await importFromJSON(text, importMode)
    alert(importMode === 'merge' ? '合併完成' : '覆蓋完成')
    location.reload()
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">設定</h2>

      <section className="card p-4 space-y-3">
        <h3 className="font-semibold">備份與還原</h3>
        <p className="text-sm opacity-70">
          匯出包含：日記、許願、支持牆照片（base64）。若資料量大，JSON 會較大。
        </p>

        <div className="flex flex-wrap gap-2">
          {/* <button className="btn" disabled={working} onClick={onExportJSON}>
            匯出 JSON（完整）
          </button>
          <button className="btn" disabled={working} onClick={onExportDiariesCSV}>
            匯出 日記 CSV
          </button> */}
          <button className="btn" disabled={working} onClick={onExportWishesCSV}>
            匯出 許願 CSV
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="importMode" className="text-sm">匯入模式：</label>
          <select
            id="importMode"
            className="input"
            value={importMode}
            onChange={e => setImportMode(e.target.value as 'merge' | 'overwrite')}
          >
            <option value="merge">合併</option>
            <option value="overwrite">覆蓋</option>
          </select>
          <label className="btn">
            選擇檔案
            <input
              hidden
              ref={fileRef}
              type="file"
              accept="application/json"
              onChange={onChooseFile}
            />
          </label>
        </div>

        <button onClick={() => alert('SAFE BTN ✓')} disabled={working} className="btn">
          匯出日記 CSV（安全）
        </button>
      </section>
    </div>
  )
}

function dateStr() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
