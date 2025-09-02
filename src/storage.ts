// src/storage.ts —— 背景（顏色/圖片）＋預設主題（活潑）＋重設

/** 工具 */
function emitThemeChanged() {
  window.dispatchEvent(new CustomEvent('urgecare:bg-changed'))
}
function nonEmpty(v: string | null | undefined, def: string) {
  const s = (v ?? '').trim()
  return s ? s : def
}

/** 儲存鍵 */
export const BG_KEY = 'urgecare.bg.v1' // 可放 #色碼、linear-gradient(...)、或 url(data:...)
export const BG_OVERLAY_KEY = 'urgecare.bg.overlay.v1' // 圖片時的遮罩強度（0~0.8）
export const THEME_FLAG_KEY = 'urgecare.theme.applied.v1' // 是否已套過預設活潑主題

/** 活潑預設（預設主題） */
const LIVELY = {
  /* Light 主題（白底）做為預設 */
  appBg: '#f6f7fb',
  text: '#111827',
  primary: '#2563eb',
  navBg: 'rgba(255,255,255,0.92)',
  overlay: 0, // 白底不需要遮罩
  surface: '#ffffff', // 卡片
  cardBorder: '#e5e7eb', // 卡片邊框
  inputBg: '#ffffff', // 輸入框底
  inputBorder: '#d1d5db', // 輸入框邊
}

// 舊版主題用過的鍵，為避免覆寫我們在啟動時順手清掉
const LEGACY_THEME_KEYS = [
  'urgecare.theme.surface.v1',
  'urgecare.theme.inputbg.v1',
  'urgecare.theme.inputborder.v1',
  'urgecare.nav.bg.v1',
  'urgecare.nav.mode.v1',
  'urgecare.nav.color.v1',
]

/** 啟動時套活潑（第一次或被重設後） */
export function applyLivelyIfNeeded() {
  const flagged = localStorage.getItem(THEME_FLAG_KEY) === '1'
  // 即使設過，也主動覆蓋，避免殘留舊的深色變數
  const root = document.documentElement.style
  root.setProperty('--app-bg', LIVELY.appBg)
  root.setProperty('--text', LIVELY.text)
  root.setProperty('--primary', LIVELY.primary)
  root.setProperty('--nav-bg', LIVELY.navBg)
  root.setProperty('--surface', LIVELY.surface)
  root.setProperty('--card-border', LIVELY.cardBorder)
  root.setProperty('--input-bg', LIVELY.inputBg)
  root.setProperty('--input-border', LIVELY.inputBorder)

  // 順手清掉舊版主題鍵，避免其他地方讀到舊值再覆寫
  LEGACY_THEME_KEYS.forEach(k => localStorage.removeItem(k))

  if (!flagged) {
    localStorage.setItem(BG_KEY, LIVELY.appBg)
    localStorage.setItem(BG_OVERLAY_KEY, String(LIVELY.overlay))
    localStorage.setItem(THEME_FLAG_KEY, '1')
  }
  emitThemeChanged()
}

/** 讀/寫背景（顏色 or 圖片） */
export function loadBg(): string {
  return nonEmpty(localStorage.getItem(BG_KEY), LIVELY.appBg)
}
export function saveBgColor(color: string) {
  // color 可為 #RRGGBB / rgb(...) / linear-gradient(...)
  localStorage.setItem(BG_KEY, color)
  localStorage.setItem(THEME_FLAG_KEY, '1')
  document.documentElement.style.setProperty('--app-bg', color)
  // 顏色背景通常不需要遮罩
  localStorage.setItem(BG_OVERLAY_KEY, '0')
  emitThemeChanged()
}
export async function saveBgImageFromFile(file: File) {
  const dataUrl = await fileToDataURL(file) // 轉 dataURL
  const css = `url(${dataUrl})`
  localStorage.setItem(BG_KEY, css)
  localStorage.setItem(THEME_FLAG_KEY, '1')
  // 圖片背景加一點遮罩以免太亮
  localStorage.setItem(BG_OVERLAY_KEY, String(LIVELY.overlay))
  document.documentElement.style.setProperty('--app-bg', css)
  emitThemeChanged()
}
function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(String(fr.result))
    fr.onerror = reject
    fr.readAsDataURL(file)
  })
}

/** 讀遮罩強度（圖片時用） */
export function loadBgOverlay(): number {
  const v = localStorage.getItem(BG_OVERLAY_KEY)
  const n = v ? Number(v) : LIVELY.overlay
  return Number.isFinite(n) ? Math.max(0, Math.min(0.8, n)) : LIVELY.overlay
}

/** 一鍵恢復預設（活潑） */
export function resetToLivelyDefault() {
  localStorage.removeItem(BG_KEY)
  localStorage.removeItem(BG_OVERLAY_KEY)
  localStorage.removeItem(THEME_FLAG_KEY)
  applyLivelyIfNeeded()
}
// 兼容舊版 API：將 applyThemePreset 指向 applyLivelyIfNeeded
export const applyThemePreset = applyLivelyIfNeeded

/** =========================
 *  兼容舊版 API：介面色彩
 *  - 提供現有頁面 import 使用
 *  - 同步 CSS 變數並觸發變更事件
 *  ========================= */
const SURFACE_KEY = 'urgecare.theme.surface.v1'
const INPUT_BG_KEY = 'urgecare.theme.inputbg.v1'
const INPUT_BORDER_KEY = 'urgecare.theme.inputborder.v1'

export function loadSurface(): string {
  const v =
    localStorage.getItem(SURFACE_KEY) ||
    getComputedStyle(document.documentElement).getPropertyValue('--surface') ||
    ''
  const s = v.trim()
  return s || '#111827'
}
export function saveSurface(v: string) {
  localStorage.setItem(SURFACE_KEY, v)
  document.documentElement.style.setProperty('--surface', v)
  emitThemeChanged()
}

export function loadInputBg(): string {
  const v =
    localStorage.getItem(INPUT_BG_KEY) ||
    getComputedStyle(document.documentElement).getPropertyValue('--input-bg') ||
    ''
  const s = v.trim()
  return s || '#0f172a'
}
export function saveInputBg(v: string) {
  localStorage.setItem(INPUT_BG_KEY, v)
  document.documentElement.style.setProperty('--input-bg', v)
  emitThemeChanged()
}

export function loadInputBorder(): string {
  const v =
    localStorage.getItem(INPUT_BORDER_KEY) ||
    getComputedStyle(document.documentElement).getPropertyValue('--input-border') ||
    ''
  const s = v.trim()
  return s || '#374151'
}
export function saveInputBorder(v: string) {
  localStorage.setItem(INPUT_BORDER_KEY, v)
  document.documentElement.style.setProperty('--input-border', v)
  emitThemeChanged()
}

// 重新匯出 Diary 與 Todo storage 以供各頁面 import
export { loadEntries, loadTodos } from './utils/storage'
// 重新匯出 SOS storage 以供各頁面 import
export { addSOSLog, loadSOSHistory } from './storage/sosStorage'
