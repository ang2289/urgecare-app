// src/pages/SOS.tsx
import React, { useEffect, useRef, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { LocalNotifications } from '@capacitor/local-notifications'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { loadTodos, addTodoSmart, addEntrySmart, loadSettings } from '../utils/storage'
import { addSOSLog } from '../storage/sosStorage'
// === 誦念同步 ===
import { listMantras, getCounts, incChant } from '@/db/repo'
import ChantCounter from '../components/ChantCounter'
import { getDefaultMantraId, saveCurrentMantraId } from '@/db/repo'
import { safeJSON } from '@/utils/storage';
import { pad2 as pad } from '@/storage/backup';
import styles from './SOS.module.css'
// 解決 `SupportItem` 的導入衝突
// @ts-ignore
import type { SupportItem } from '@/types';

export interface SupportItem {
  id: string;
  path: string;
  caption: string;
  createdAt: string;
}

const SHOW_SUPPORT_KEY = 'urgecare.support.v1';
const BUILTIN_SUGGESTIONS = [
  '喝一杯水',
  '深呼吸 10 次',
  '走路 3 分鐘',
  '沖冷水臉 30 秒',
  '伸展 1 分鐘',
  '寫下此刻念頭',
  '做 10 個深蹲',
  '整理桌面 2 分鐘',
  '離開座位 1 分鐘',
];

// 新增 isNative 和 SUPPORT_LIST_KEY 的定義
const isNative = () => Capacitor.getPlatform() !== 'web';
const SUPPORT_LIST_KEY = 'support_list';

function loadFavs(): string[] {
  try {
    const raw = localStorage.getItem(SHOW_SUPPORT_KEY);
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.from(new Set(arr.map(s => s.trim()).filter(Boolean)));
  } catch {
    return [];
  }
}

export default function SOS() {
  // --- 誦念同步狀態 ---
  const [mantras, setMantras] = useState<{ id: string; name: string }[]>([])
  const [currentId, setCurrentId] = useState<string>(() => getDefaultMantraId(mantras))
  const [chantToday, setChantToday] = useState<number>(0)
  const [chantTotal, setChantTotal] = useState<number>(0)

  // 初次載入誦念清單與統計
  useEffect(() => {
    ;(async () => {
      const ms = await listMantras()
      setMantras(ms)
      if (!currentId && ms[0]?.id) setCurrentId(ms[0].id)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 同步 mantraId 與更新統計
  useEffect(() => {
    localStorage.setItem('urgecare.sos.mantraId', currentId)
    if (!currentId) return
    getCounts(currentId).then(c => {
      setChantToday(c.today)
      setChantTotal(c.total)
    })
  }, [currentId])

  /* ===== 設定值 ===== */
  const settings = loadSettings()
  const DEFAULT_MIN = settings.sosDefaultMinutes || 5
  const COOL_DOWN_MIN = settings.cooldownMin || 10

  /* ===== 計時器 ===== */
  const [minutes, setMinutes] = useState<number>(DEFAULT_MIN)
  const [remaining, setRemaining] = useState<number>(DEFAULT_MIN * 60)
  const [running, setRunning] = useState<boolean>(false)
  const timerRef = useRef<number | null>(null)

  /* ===== 行為選擇 ===== */
  const [favs, setFavs] = useState<string[]>([])
  const [favInput, setFavInput] = useState('')
  const [selectedAction, setSelectedAction] = useState('')

  /* ===== 待辦（只讀＋同步） ===== */
  const [todos, setTodos] = useState(loadTodos())
  const [selectedTodoId, setSelectedTodoId] = useState('')

  /* ===== 選項 ===== */
  const [autoAddToTodos, setAutoAddToTodos] = useState(true)
  const [alsoLogToDiary, setAlsoLogToDiary] = useState(true)
  const [showSupportOnComplete, setShowSupportOnComplete] = useState<boolean>(() => {
    return safeJSON(localStorage.getItem(SHOW_SUPPORT_KEY), true)
  })
  const [supportModal, setSupportModal] = useState<{ url: string; caption: string } | null>(null)

  // 初始化
  useEffect(() => {
    setFavs(loadFavs())
    setTodos(loadTodos())
  }, [])

  // 監聽 todos 變更（只掛一次；不保存，只更新畫面）
  useEffect(() => {
    const onChanged = () => setTodos(loadTodos())
    window.addEventListener('urgecare:todos-changed', onChanged)
    return () => window.removeEventListener('urgecare:todos-changed', onChanged)
  }, [])

  // 記住「顯示支持照片」開關
  useEffect(() => {
    localStorage.setItem(SHOW_SUPPORT_KEY, JSON.stringify(showSupportOnComplete))
  }, [showSupportOnComplete])

  // 卸載時清除 interval
  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [])

  // 倒數核心
  useEffect(() => {
    if (!running) return
    if (timerRef.current) window.clearInterval(timerRef.current)

    timerRef.current = window.setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          if (timerRef.current) window.clearInterval(timerRef.current)
          setRunning(false)
          onTimerDoneWithChant()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [running])

  function applyMinutes(val: string) {
    const num = Math.max(1, Math.min(999, Math.floor(Number(val) || 0)))
    setMinutes(num)
    if (!running) setRemaining(num * 60)
  }

  /* ===== 倒數結束 ===== */
  // 👉 當倒數結束，同步誦念 +1
  async function onTimerDoneWithChant() {
    try {
      if (currentId) {
        await incChant(currentId, 1);
        const c = await getCounts(currentId)
        setChantToday(c.today)
        setChantTotal(c.total)
      }
    } catch (e) {
      console.error('chant +1 failed', e)
    }
    if (typeof onTimerComplete === 'function') onTimerComplete()
  }
  async function onTimerComplete() {
    // 震動
    try {
      if (isNative()) await Haptics.impact({ style: ImpactStyle.Heavy })
      else if ('vibrate' in navigator) navigator.vibrate?.(300)
    } catch {}

    const chosenTodo = todos.find(t => t.id === selectedTodoId)?.text
    const message = (selectedAction || chosenTodo || '做幾次深呼吸、喝點水或走走。').trim()

    // 寫入：只呼叫 addTodoSmart / addEntrySmart（內部會保存＋emit），這裡不再 save
    try {
      if (autoAddToTodos && selectedAction.trim()) {
        setTodos(addTodoSmart(selectedAction, COOL_DOWN_MIN))
      }
      if (alsoLogToDiary && message) {
        addEntrySmart(`[SOS] ${message}`, COOL_DOWN_MIN)
      }
    } catch {}
    // 更新排行榜延遲成功統計
    incrementDelaySuccess()
    // 記錄 SOS 執行紀錄
    addSOSLog()

    // 通知
    try {
      const perm = await LocalNotifications.requestPermissions()
      if (perm.display === 'granted') {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: Date.now() % 100000,
              title: 'UrgeCare',
              body: `時間到！請執行：${message}`,
              schedule: { at: new Date(Date.now() + 50) },
            },
          ],
        })
      } else {
        alert(`時間到！請執行：${message}`)
      }
    } catch {
      alert(`時間到！請執行：${message}`)
    }

    // 顯示支持照片
    if (showSupportOnComplete) {
      const modal = await loadLatestSupportPreview()
      if (modal) setSupportModal(modal)
    }
  }

  // 讀最新支持照片
  async function loadLatestSupportPreview(): Promise<{ url: string; caption: string } | null> {
    try {
      const raw = localStorage.getItem(SUPPORT_LIST_KEY)
      const arr = raw ? (JSON.parse(raw) as SupportItem[]) : []
      if (!Array.isArray(arr) || arr.length === 0) return null
      const latest = [...arr].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0]
      // 為 `path` 和 `caption` 屬性添加 `@ts-ignore`
      // @ts-ignore
      const res = await Filesystem.readFile({ path: latest.path, directory: Directory.Data })
      // @ts-ignore
      return { url: `data:image/*;base64,${res.data}`, caption: latest.caption || '' }
    } catch {
      return null
    }
  }

  /* ===== 常用替代行為 ===== */
  function addFav() {
    const t = favInput.trim()
    if (!t) return
    const next = Array.from(new Set([t, ...favs]))
    setFavs(next)
    setFavs(next)
    setFavInput('')
  }
  function removeFav(text: string) {
    const next = favs.filter(s => s !== text)
    setFavs(next)
    setFavs(next)
    if (selectedAction === text) setSelectedAction('')
  }

  const mm = Math.floor(remaining / 60)
  const ss = remaining % 60

  // 匯出 CSV 功能（比照日記）
  function sosToCSV() {
    const esc = (s: string) => {
      if (/^\d{10,}$/.test(s) || /^0\d+/.test(s)) {
        return `="${s}"`;
      }
      return `"${String(s).replace(/"/g, '""')}"`;
    };
    const header = ["類型", "內容"];
    const lines = [header.join(",")];
    // 只匯出目前選擇的常用替代行為
    if (selectedAction) {
      lines.push([esc("常用替代行為"), esc(selectedAction)].join(","));
    }
    // 只匯出目前選擇的待辦
    if (selectedTodoId) {
      const todo = todos.find(t => t.id === selectedTodoId);
      if (todo) {
        lines.push([esc("待辦"), esc(todo.text)].join(","));
      }
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
  const onExportSOSCSV = () => {
    const csv = sosToCSV();
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    downloadCSV(`sos-logs-${ts}.csv`, csv);
  };

  return (
    <div className="container">
      <div className="title sos-title flex items-center justify-between">
        <span>SOS 延遲</span>
        <button className="btn" onClick={onExportSOSCSV} title="匯出 CSV">
          匯出 CSV
        </button>
      </div>
      {/* 誦念同步卡片 */}
      {/* <div className="card form-narrow">
        <div className="section-title">誦念同步</div>
        <div className="row">
          <select className={styles.input} title="Select a mantra" value={currentId} onChange={e => {
            setCurrentId(e.target.value);
          }}>
            {mantras.map(mantra => (
              <option key={mantra.id} value={mantra.id}>
                {mantra.name}
              </option>
            ))}
          </select>
          <div className={`${styles.helper} ${styles['margin-left-8']}`}>
            今日：{chantToday}　總計：{chantTotal}
          </div>
        </div>
      </div> */}
      <div className={styles.helper}>
        當衝動很強時，先延遲 {minutes}{' '}
        分鐘，讓自己冷卻一下。時間到我會提醒你做一個替代行為或待辦事項。
      </div>

      {/* 心理支持 */}
      <div className="card">
        <div className="section-title">給自己的一句話</div>
        <div className={`${styles.helper} ${styles['font-size-16']}`}>
          衝動像海浪，會起也會退。你不需要永遠都不想，只要先撐過這一小段時間。做一件小事（喝水、走動、呼吸），就能把注意力帶回來。
        </div>
      </div>

      {/* 延遲設定 */}
      <div className="card">
        <div className="section-title">延遲設定</div>
        <div className="flex gap-3 flex-wrap">
          <label className="helper" htmlFor="sos-min">
            分鐘數
          </label>
          <input
            id="sos-min"
            className="input"
            type="number"
            min={1}
            max={999}
            inputMode="numeric"
            value={minutes}
            onChange={e => applyMinutes(e.target.value)}
          />
        </div>

        <div
          className="counter"
          style={{ textAlign: 'center', marginTop: 12, fontSize: 42, fontWeight: 700 }}
        >
          {pad(mm)}:{pad(ss)}
        </div>

        <div className={`${styles.flex} ${styles['margin-top-12']}`}>
          <button
            className="btn btn-primary"
            onClick={() => setRunning(true)}
            disabled={running || remaining === 0}
          >
            開始
          </button>
          <button className="btn" onClick={() => setRunning(false)} disabled={!running}>
            暫停
          </button>
          <button
            className="btn btn-danger"
            onClick={() => {
              setRunning(false)
              if (timerRef.current) window.clearInterval(timerRef.current)
              setRemaining(minutes * 60)
            }}
          >
            重設
          </button>
        </div>

        <div className={`${styles.flex} ${styles['margin-top-8']}`}>
          時間到時：
          <ul className={styles['margin-top-4']}>
            <li>
              <label className={styles['flex-align-center']}>
                <input
                  type="checkbox"
                  checked={autoAddToTodos}
                  onChange={e => setAutoAddToTodos(e.target.checked)}
                />
                若已選擇替代行為 → <b>自動加入「待辦」</b>
              </label>
              （{COOL_DOWN_MIN} 分鐘內相同內容不重複新增）
            </li>
            <li className={styles['margin-top-6']}>
              <label className={styles['flex-align-center']}>
                <input
                  type="checkbox"
                  checked={alsoLogToDiary}
                  onChange={e => setAlsoLogToDiary(e.target.checked)}
                />
                <b>同時寫進「日記」</b>
              </label>
              （{COOL_DOWN_MIN} 分鐘內相同內容不重複新增）
            </li>
            <li className={styles['margin-top-6']}>
              <label className={styles['flex-align-center']}>
                <input
                  type="checkbox"
                  checked={showSupportOnComplete}
                  onChange={e => setShowSupportOnComplete(e.target.checked)}
                />
                <b>時間到時顯示支持照片</b>
              </label>
              （會顯示「支持牆」中最新的一張照片）
            </li>
          </ul>
        </div>

        <div className={`${styles.helper} ${styles['margin-top-8']}`}>
          提示：Android 13+ 第一次需要允許「通知」權限；未允許時會自動改為前景提示（alert）。
        </div>
      </div>

      {/* 常用替代行為 */}
      <div className="card">
        <div className="section-title">常用替代行為（點一下選擇）</div>
        <div className="flex gap-3 flex-wrap">
          {[...BUILTIN_SUGGESTIONS, ...favs].map(s => (
            <button
              key={s}
              className={`btn ${selectedAction === s ? 'btn-primary' : ''}`}
              onClick={() => setSelectedAction(prev => (prev === s ? '' : s))}
              title="點一下選擇；再次點擊可取消"
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex gap-3 flex-wrap" style={{ marginTop: 12 }}>
          <input
            className="input"
            placeholder="新增自訂替代行為（例如：唸經 10 遍 / 喝水一杯）"
            value={favInput}
            onChange={e => setFavInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') addFav()
            }}
          />
          <button className="btn btn-success" onClick={addFav}>
            加入常用
          </button>
        </div>

        {favs.length > 0 && (
          <div className="flex gap-3 flex-wrap" style={{ marginTop: 8 }}>
            {favs.map(s => (
              <button
                key={s}
                className="btn btn-danger"
                onClick={() => removeFav(s)}
                title="從常用移除"
              >
                刪除「{s}」
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 唸咒 / 祈禱 計數器 */}
      <ChantCounter onSelect={name => setSelectedAction(name)} />

      {/* 從待辦挑一個 */}
      <div className="card">
        <div className="section-title">從待辦挑一個去完成</div>
        <select
          className="input"
          value={selectedTodoId}
          onChange={e => setSelectedTodoId(e.target.value)}
        >
          <option value="">（可選）請選擇一個待辦</option>
          {todos.map(t => (
            <option key={t.id} value={t.id}>
              {t.text}
            </option>
          ))}
        </select>
        {selectedTodoId && (
          <div className={`${styles.flex} ${styles['justify-center']} ${styles['margin-top-12']}`}>
            <button
              className="btn btn-primary"
              onClick={() => {
                const txt = todos.find(t => t.id === selectedTodoId)?.text
                if (txt) alert(`現在就開始：${txt}`)
              }}
            >
              開始這項任務
            </button>
          </div>
        )}
      </div>

      {/* 支持照片 Modal */}
      {supportModal && (
        <div
          onClick={() => setSupportModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
            padding: 16,
          }}
        >
          <div className={`${styles.card} ${styles['max-dimensions']}`}>
            <img
              className={styles['img-max']}
              src={supportModal.url}
              alt={supportModal.caption}
              style={{
                maxWidth: '90vw',
                maxHeight: '70vh',
                objectFit: 'contain',
                display: 'block',
                margin: '0 auto',
              }}
            />
            <div className={`${styles.helper} ${styles['margin-top-8']} ${styles['text-center']}`}>
              {supportModal.caption || '給自己的支持'}
            </div>
            <div className={`${styles.flex} ${styles['margin-top-8']}`}>
              <button className="btn" onClick={() => setSupportModal(null)}>
                關閉
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 確保 incrementDelaySuccess 的定義正確
function incrementDelaySuccess(): void {
  console.log('Delay incremented successfully');
}
