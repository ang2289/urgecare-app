// src/pages/Support.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'

type SupportItem = {
  id: string
  path: string // Filesystem 路徑，例如 UrgeCare/Support/xxx.jpg
  caption: string // 使用者自訂說明
  createdAt: string
  tag?: string // 🔹 新增：分類標籤
  order: number // 🔹 新增：排序（0 在最上）
  dataUrl?: string // fallback base64 圖片
}

const LIST_KEY = 'urgecare.support.v1'
const PHRASE_KEY = 'urgecare.support.phrase.v1'
const FOLDER = 'UrgeCare/Support' // 子資料夾
const isNative = () => Capacitor.getPlatform() !== 'web'

function safeJSON<T>(raw: string | null, fallback: T): T {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}
function uid() {
  return crypto.randomUUID()
}

async function ensureFolder() {
  try {
    // Filesystem 不需要特別 create folder（會在 writeFile recursive: true 自動建立）
    return
  } catch {}
}

export default function Support() {
  const [list, setList] = useState<SupportItem[]>([])
  const [previews, setPreviews] = useState<Record<string, string>>({}) // id -> dataURL
  const [phrase, setPhrase] = useState<string>('')
  const [adding, setAdding] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // 讀 manifest & phrase
  useEffect(() => {
    const l = safeJSON<SupportItem[]>(localStorage.getItem(LIST_KEY), [])
    const normalized = normalizeOrder(l)
    setList(normalized)
    setPhrase(localStorage.getItem(PHRASE_KEY) || '')
    // 初次載入，把預覽抓一輪
    refreshPreviews(normalized)
  }, [])

  // 更新清單時，保存到 localStorage
  useEffect(() => {
    localStorage.setItem(LIST_KEY, JSON.stringify(list))
  }, [list])

  // 儲存支持標語
  function savePhrase() {
    localStorage.setItem(PHRASE_KEY, phrase)
    alert('已儲存支持標語')
  }

  // 讀出預覽（base64 → dataURL）
  async function readPreview(item: SupportItem): Promise<string | null> {
    // 使用 fallback dataUrl
    if (item.dataUrl) return item.dataUrl
    try {
      const res = await Filesystem.readFile({
        path: item.path,
        directory: Directory.Data,
      })
      return `data:image/*;base64,${res.data}`
    } catch {
      return null
    }
  }

  async function refreshPreviews(items: SupportItem[]) {
    const pairs: [string, string | null][] = await Promise.all(
      items.map(async it => [it.id, await readPreview(it)] as [string, string | null])
    )
    const obj: Record<string, string> = {}
    pairs.forEach(([id, url]) => {
      if (url) obj[id] = url
    })
    setPreviews(obj)
  }

  // 上傳（支援多檔）
  async function onPickFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setAdding(true)
    await ensureFolder()

    const newly: SupportItem[] = []
    for (const file of Array.from(files)) {
      try {
        const b64 = await fileToBase64(file)
        const id = uid()
        const ext = guessExt(file.type) || 'jpg'
        const path = `${FOLDER}/${id}.${ext}`

        let wrote = false
        try {
          await Filesystem.writeFile({
            path,
            data: b64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, ''), // 只留純 base64
            directory: Directory.Data,
            recursive: true,
          })
          wrote = true
        } catch (e) {
          console.warn('Filesystem 寫入失敗，使用 dataUrl fallback', e)
        }
        const item: SupportItem = {
          id,
          path,
          caption: file.name.replace(/\.[^.]+$/, ''), // 先用檔名當預設說明
          createdAt: new Date().toISOString(),
          order: list.length + newly.length,
          dataUrl: wrote ? undefined : b64,
        }
        newly.push(item)
      } catch (e) {
        console.error('write error', e)
        alert(`有一張圖片寫入失敗：${(file as any)?.name ?? ''}`)
      }
    }

    if (newly.length) {
      const next = [...newly, ...list]
      setList(normalizeOrder(next))
      // 只補新圖的預覽即可
      const patch: Record<string, string> = { ...previews }
      for (const it of newly) {
        const url = await readPreview(it)
        if (url) patch[it.id] = url
      }
      setPreviews(patch)
    }

    // 清空 input 值，避免同檔名無法再次觸發變更
    if (fileInputRef.current) fileInputRef.current.value = ''
    setAdding(false)
  }

  async function onDelete(id: string) {
    const it = list.find(x => x.id === id)
    if (!it) return
    if (!confirm('確定刪除這張照片？')) return
    try {
      await Filesystem.deleteFile({
        path: it.path,
        directory: Directory.Data,
      })
    } catch {
      // 即使刪檔失敗，仍從清單上移除，避免卡死
    }
    const next = list.filter(x => x.id !== id)
    setList(normalizeOrder(next))
    const p = { ...previews }
    delete p[id]
    setPreviews(p)
  }

  function onUpdateCaption(id: string, caption: string) {
    setList(prev => prev.map(x => (x.id === id ? { ...x, caption } : x)))
  }

  // 放大圖 modal
  const [zoomId, setZoomId] = useState<string | null>(null)
  const zoomUrl = useMemo(() => (zoomId ? previews[zoomId] : ''), [zoomId, previews])
  const zoomCaption = useMemo(
    () => (zoomId ? list.find(x => x.id === zoomId)?.caption ?? '' : ''),
    [zoomId, list]
  )
  const sorted = useMemo(() => [...list].sort((a, b) => a.order - b.order), [list])

  return (
    <div className="container">
      <div className="title" style={{ marginTop: 8 }}>
        支持牆
      </div>
      <div className="helper">
        放上家人、伴侶、孩子、信仰或任何能鼓勵你的照片；在衝動來時成為你的力量。
      </div>

      {/* 支持標語 */}
      <div className="card">
        <div className="section-title">支持標語</div>
        <textarea
          aria-label="請輸入內容"
          className="textarea"
          placeholder="例：你做得到，我們都在這裡支持你。"
          value={phrase}
          onChange={e => setPhrase(e.target.value)}
          rows={2}
        />
        <div className="flex gap-3 flex-wrap justify-center" style={{ marginTop: 8 }}>
          <button className="btn btn-success" onClick={savePhrase}>
            儲存標語
          </button>
        </div>
      </div>

      {/* 新增圖片 */}
      <div className="card">
        <div className="section-title">新增照片</div>
        <div className="helper">可一次選多張；在原生 App 與瀏覽器都能使用。</div>
        <div className="flex gap-3 flex-wrap">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={e => onPickFiles(e.target.files)}
            style={{ display: 'none' }}
            tabIndex={-1}
          />
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={adding}
          >
            {adding ? '處理中…' : '選擇檔案'}
          </button>
        </div>
      </div>

      {/* 圖片格狀牆 */}
      <div className="card">
        <div className="section-title">我的支持照片</div>
        {list.length === 0 && <div className="helper">尚未新增照片</div>}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 12,
          }}
        >
          {list.map((it, idx) => (
            <div
              key={it.id}
              className="card support-card"
              style={{ padding: 10, display: 'flex', flexDirection: 'column' }}
            >
              <div
                style={{
                  width: '100%',
                  aspectRatio: '1 / 1',
                  overflow: 'hidden',
                  borderRadius: 12,
                  background: '#111827',
                  cursor: 'pointer',
                }}
                onClick={() => setZoomId(it.id)}
                title="點一下放大"
              >
                {previews[it.id] ? (
                  <img
                    src={previews[it.id]}
                    alt={it.caption || 'photo'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <div className="helper" style={{ textAlign: 'center', paddingTop: 40 }}>
                    載入中…
                  </div>
                )}
              </div>

              {/* 說明文字可編輯 */}
              <input
                className="input"
                style={{ marginTop: 8 }}
                placeholder="輸入說明文字"
                value={it.caption}
                onChange={e => onUpdateCaption(it.id, e.target.value)}
              />
              {/* 固定在卡片底部的控制列：上移 / 下移 / 刪除 */}
              <div
                className="flex gap-3 flex-wrap justify-center support-actions"
                style={{ marginTop: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}
              >
                <button
                  className="btn"
                  onClick={() => {
                    if (idx <= 0) return
                    const next = [...list]
                    const [moved] = next.splice(idx, 1)
                    next.splice(idx - 1, 0, moved)
                    setList(next)
                  }}
                >
                  上移
                </button>
                <button
                  className="btn"
                  onClick={() => {
                    if (idx >= list.length - 1) return
                    const next = [...list]
                    const [moved] = next.splice(idx, 1)
                    next.splice(idx + 1, 0, moved)
                    setList(next)
                  }}
                >
                  下移
                </button>
                <button className="btn btn-danger" onClick={() => onDelete(it.id)}>
                  刪除
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 放大檢視 Modal */}
      {zoomId && (
        <div
          onClick={() => setZoomId(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: 16,
          }}
        >
          <div className="card" style={{ maxWidth: '96vw', maxHeight: '90vh' }}>
            {zoomUrl && (
              <img
                src={zoomUrl}
                alt={zoomCaption}
                style={{
                  maxWidth: '90vw',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                  display: 'block',
                  margin: '0 auto',
                }}
              />
            )}
            <div className="helper" style={{ marginTop: 8, textAlign: 'center' }}>
              {zoomCaption}
            </div>
            <div className="flex justify-center" style={{ marginTop: 8 }}>
              <button className="btn" onClick={() => setZoomId(null)}>
                關閉
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------- helpers ---------- */
function guessExt(mime: string | undefined | null) {
  if (!mime) return 'jpg'
  const m = mime.toLowerCase()
  if (m.includes('png')) return 'png'
  if (m.includes('webp')) return 'webp'
  if (m.includes('gif')) return 'gif'
  return 'jpg'
}
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(String(fr.result))
    fr.onerror = reject
    fr.readAsDataURL(file)
  })
}

function normalizeOrder(list: SupportItem[]): SupportItem[] {
  if (!Array.isArray(list)) {
    console.error('Invalid list provided to normalizeOrder:', list)
    return []
  }
  return [...list]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((x, idx) => ({ ...x, order: idx }))
}

function moveItem(list: SupportItem[], id: string, dir: 'up' | 'down'): SupportItem[] {
  const arr = normalizeOrder(list)
  const idx = arr.findIndex(x => x.id === id)
  if (idx < 0) return arr
  const swapWith = dir === 'up' ? idx - 1 : idx + 1
  if (swapWith < 0 || swapWith >= arr.length) return arr
  const a = arr[idx],
    b = arr[swapWith]
  arr[idx] = { ...b, order: idx }
  arr[swapWith] = { ...a, order: swapWith }
  return arr
}
