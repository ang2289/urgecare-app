import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Encoding } from '@capacitor/filesystem';

type ChantStat = {
  id: string
  today: number
  total: number
  lastDate: string
}

type SupportPhoto = {
  id: string
  label?: string
  // Web：dataUrl；Native：convert 後的可顯示 src
  displaySrc: string
  // Native 專用：原始 file:// uri 與 path（刪除檔案用）
  nativeUri?: string
  nativePath?: string
}

type Props = {
  onSelect?: (chantName: string) => void
  rewardThresholds?: number[]
}

const STATS_KEY = 'urgecare.chantStats.v1'
const PHOTOS_KEY = 'urgecare.supportPhotos.meta.v1' // 僅存 metadata，不直接存大圖
const CHANTS_KEY = 'urgecare.chantList.v1'
const DEFAULT_THRESHOLDS = [10, 50, 108]

const DEFAULT_CHANTS: string[] = [
  '觀世音菩薩聖號',
  '南無阿彌陀佛',
  '六字大明咒（嗡嘛呢叭咪吽）',
  '大悲咒（心）',
  '心經',
  '藥師灌頂真言',
  '準提咒',
  '不動明王心咒',
  '普門品',
  '主禱文',
  '聖母經',
];

const ENCOURAGES = [
  '🎉 你剛剛撐住了！每一遍都在增強你的自由肌肉。',
  '💪 很棒！短短幾分鐘，你做到了困難的選擇。',
  '🌊 衝動像海浪，你學會衝浪了！',
  '🙌 家人/朋友會為你感到驕傲，繼續加油！',
]

const isNative = () => Capacitor.getPlatform() !== 'web'
const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const convertSrc = (uri: string) => (isNative() ? Capacitor.convertFileSrc(uri) : uri)

function emit(topic: 'chant-changed') {
  try {
    window.dispatchEvent(new CustomEvent(`urgecare:${topic}`))
  } catch {}
}

/* ---------- LocalStorage helpers ---------- */
function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}
function safeSet(key: string, value: any) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.warn(`[UrgeCare] localStorage setItem 失敗：${key}`, e)
  }
}

function loadStats(): Record<string, ChantStat> {
  return safeGet(STATS_KEY, {})
}
function saveStats(map: Record<string, ChantStat>) {
  safeSet(STATS_KEY, map)
  emit('chant-changed')
}
function loadChants(): string[] {
  const saved = safeGet<string[]>(CHANTS_KEY, []);
  // 如果從前存成空陣列，這裡會自動帶入預設清單
  return saved.length ? saved : DEFAULT_CHANTS;
}
function saveChants(list: string[]) {
  safeSet(CHANTS_KEY, Array.from(new Set(list.map(s => s.trim()).filter(Boolean))))
}

// 只保存 metadata（web: dataUrl、native: nativeUri/nativePath）
function loadPhotoMeta(): SupportPhoto[] {
  return safeGet<SupportPhoto[]>(PHOTOS_KEY, [])
}
function savePhotoMeta(list: SupportPhoto[]) {
  safeSet(PHOTOS_KEY, list)
}

/* ---------- 圖片處理 ---------- */
// Web：上傳後壓縮存 base64，避免 localStorage 爆量
async function compressImageToDataUrl(file: File, maxSide = 1024, quality = 0.7): Promise<string> {
  const img = document.createElement('img')
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
  await new Promise<void>((res, rej) => {
    img.onload = () => res()
    img.onerror = rej
    img.src = dataUrl
  })
  const { width, height } = img
  const scale = Math.min(1, maxSide / Math.max(width, height))
  const w = Math.round(width * scale)
  const h = Math.round(height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, w, h)
  return canvas.toDataURL('image/jpeg', quality)
}

// Native：寫入檔案到 Documents/UrgeCare/SupportPhotos/<id>.jpg
async function writeNativeJpegBase64(base64DataUrl: string, id: string) {
  const base64 = base64DataUrl.split(',')[1] || base64DataUrl // 允許傳入純 base64
  const path = `UrgeCare/SupportPhotos/${id}.jpg`
  const res = await Filesystem.writeFile({
    path,
    data: base64,
    directory: Directory.Documents,
    encoding: Encoding.UTF8,
    recursive: true,
  })
  // res.uri: file://... 需要 convert 才能 <img src="">
  return { uri: res.uri, path }
}

async function deleteNativeFile(path: string) {
  try {
    await Filesystem.deleteFile({ path, directory: Directory.Documents })
  } catch (e) {
    console.warn('[UrgeCare] 刪除原生照片失敗：', e)
  }
}

/* ---------- 元件 ---------- */
export default function ChantCounter({ onSelect, rewardThresholds = DEFAULT_THRESHOLDS }: Props) {
  const [chants, setChants] = useState<string[]>([])
  const [custom, setCustom] = useState('')
  const [selected, setSelected] = useState('')

  const [stats, setStats] = useState<Record<string, ChantStat>>({})
  const [photos, setPhotos] = useState<SupportPhoto[]>([])
  const [labelDraft, setLabelDraft] = useState('')

  const [rewardOpen, setRewardOpen] = useState(false)
  const [rewardText, setRewardText] = useState('')

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const c = loadChants();
    setChants(c);
    setSelected(c[0] ?? '');
  }, []);

  useEffect(() => {
    if (selected) onSelect?.(selected)
  }, [selected])

  // 初始化統計項目 + 跨日歸零今日
  useEffect(() => {
    if (!selected) return
    setStats(prev => {
      const map = { ...prev }
      if (!map[selected]) {
        map[selected] = { id: selected, today: 0, total: 0, lastDate: todayStr() }
      } else if (map[selected].lastDate !== todayStr()) {
        map[selected] = { ...map[selected], today: 0, lastDate: todayStr() }
      }
      saveStats(map)
      return map
    })
  }, [selected])

  const current = useMemo<ChantStat>(() => {
    return stats[selected] ?? { id: selected, today: 0, total: 0, lastDate: todayStr() }
  }, [stats, selected])

  function addChant() {
    const name = custom.trim()
    if (!name) return
    setChants(prev => {
      const next = [name, ...prev.filter(x => x !== name)]
      saveChants(next)
      return next
    })
    setCustom('')
    setSelected(name)
  }

  function increment(delta: number) {
    if (!selected) return
    setStats(prev => {
      const map = { ...prev }
      const s = map[selected] ?? { id: selected, today: 0, total: 0, lastDate: todayStr() }
      const isNewDay = s.lastDate !== todayStr()
      const before = isNewDay ? 0 : s.today
      const afterToday = Math.max(0, before + delta)
      const afterTotal = Math.max(0, s.total + delta)
      map[selected] = { id: selected, today: afterToday, total: afterTotal, lastDate: todayStr() }
      saveStats(map)
      const crossed = rewardThresholds.find(th => before < th && afterToday >= th)
      if (crossed !== undefined) {
        setRewardText(ENCOURAGES[Math.floor(Math.random() * ENCOURAGES.length)])
        setRewardOpen(true)
      }
      return map
    })
  }

  function resetToday() {
    if (!selected) return
    setStats(prev => {
      const map = { ...prev }
      const s = map[selected] ?? { id: selected, today: 0, total: 0, lastDate: todayStr() }
      map[selected] = { ...s, today: 0, lastDate: todayStr() }
      saveStats(map)
      return map
    })
  }

  function resetTotal() {
    if (!selected) return
    if (!confirm(`確定清除「${selected}」的全部總計？`)) return
    setStats(prev => {
      const map = { ...prev }
      const s = map[selected] ?? { id: selected, today: 0, total: 0, lastDate: todayStr() }
      map[selected] = { ...s, total: 0 }
      saveStats(map)
      return map
    })
  }

  async function onUploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || !files[0]) return
    if (photos.length >= 3) {
      alert('最多上傳 3 張支持照片')
      e.currentTarget.value = ''
      return
    }

    try {
      const file = files[0]
      const id = crypto.randomUUID()

      if (isNative()) {
        // 先壓一版，取其 base64 存入 Filesystem（容量更小）
        const dataUrl = await compressImageToDataUrl(file, 1280, 0.75)
        const { uri, path } = await writeNativeJpegBase64(dataUrl, id)
        const meta: SupportPhoto = {
          id,
          label: labelDraft.trim() || undefined,
          displaySrc: convertSrc(uri),
          nativeUri: uri,
          nativePath: path,
        }
        const next = [meta, ...photos]
        setPhotos(next)
        savePhotoMeta(next)
      } else {
        // Web：壓縮 → 直接存 base64 dataUrl（小很多）
        const dataUrl = await compressImageToDataUrl(file, 1024, 0.7)
        const meta: SupportPhoto = {
          id,
          label: labelDraft.trim() || undefined,
          displaySrc: dataUrl,
        }
        const next = [meta, ...photos]
        setPhotos(next)
        savePhotoMeta(next)
      }
      setLabelDraft('')
    } catch (err) {
      alert('圖片上傳失敗，請改用較小的圖片或截圖後再試。')
      console.warn('[UrgeCare] upload/save photo error', err)
    } finally {
      e.currentTarget.value = ''
    }
  }

  async function removePhoto(id: string) {
    const item = photos.find(p => p.id === id)
    const next = photos.filter(p => p.id !== id)
    setPhotos(next)
    savePhotoMeta(next)
    // 原生同步刪除檔案
    if (isNative() && item?.nativePath) {
      await deleteNativeFile(item.nativePath)
    }
  }

  function deleteChant(name: string) {
    if (!confirm(`確定刪除「${name}」這個咒語？`)) return
    setChants(prev => {
      const next = prev.filter(c => c !== name)
      saveChants(next)
      return next
    })
    setSelected('')
  }

  return (
    <div className="card">
      <div className="section-title">唸咒 / 祈禱 計數器</div>

      {/* 選擇或新增咒 */}
      <div className="flex gap-3 flex-wrap">
        <select
          className="input"
          value={selected}
          onChange={e => setSelected(e.target.value)}
          title="選擇咒語"
        >
          {chants.map(c => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          className="input"
          placeholder="自訂新增（例如：唸經 10 遍）"
          value={custom}
          onChange={e => setCustom(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') addChant()
          }}
          title="新增咒語"
        />
        <button className="btn btn-success" onClick={addChant}>
          加入
        </button>
        <button
          className="btn btn-danger"
          onClick={() => deleteChant(selected)}
          disabled={!selected}
          title="刪除選擇的咒語"
        >
          刪除選擇
        </button>
      </div>

      {/* 今日數量與累計數量 */}
      <div className="chant-counter-stats">
        <div className="chant-counter-stat">
          <span>今日數量：</span>
          <span>{current.today}</span>
        </div>
        <div className="chant-counter-stat">
          <span>累計數量：</span>
          <span>{current.total}</span>
        </div>
      </div>

      <div className="chant-counter-actions">
        <button className="btn btn-success" onClick={() => increment(1)}>+1</button>
        <button className="btn btn-success" onClick={() => increment(10)}>+10</button>
        <button className="btn btn-success" onClick={() => increment(108)}>+108</button>
        <button className="btn btn-danger" onClick={resetToday}>清今日</button>
        <button className="btn btn-danger" onClick={resetTotal}>清總計</button>
      </div>

      <div className="chant-counter-section-title">
        支持照片（最多 3 張）
      </div>
      <div className="flex gap-3 flex-wrap flex-wrap-margin">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => fileRef.current?.click()}
          title="選擇圖片"
        >
          選擇圖片
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={onUploadPhoto}
          style={{ display: 'none' }}
        />
        <input
          className="input"
          placeholder="標籤（例如：家人、寶貝、伴侶）"
          value={labelDraft}
          onChange={e => setLabelDraft(e.target.value)}
        />
      </div>

      {photos.length > 0 && (
        <div className="flex gap-3 flex-wrap flex-wrap-margin">
          {photos.map(p => (
            <div key={p.id} className="photo-card">
              <img
                src={p.displaySrc}
                alt={p.label || 'photo'}
                className="photo-img"
              />
              {p.label && (
                <div className="helper-center">
                  {p.label}
                </div>
              )}
              <div className="helper-center-margin">
                <button className="btn btn-danger" onClick={() => removePhoto(p.id)}>
                  刪除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 獎勵卡片 */}
      {rewardOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div className="card card-center">
            <div className="helper helper-large">
              {photos.length > 0 ? '恭喜！您已達成目標！' : '加油！繼續努力！'}
            </div>
            {photos.length > 0 && (
              <div className="flex gap-3 flex-wrap flex-wrap-justify">
                {photos.slice(0, 3).map(p => (
                  <img
                    key={p.id}
                    src={p.displaySrc}
                    alt={p.label || 'photo'}
                    className="photo-small"
                  />
                ))}
              </div>
            )}
            <button className="btn btn-primary" onClick={() => setRewardOpen(false)}>
              收到！
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
