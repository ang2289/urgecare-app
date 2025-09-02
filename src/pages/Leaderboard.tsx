import React, { useEffect, useMemo, useState } from 'react'

const KEY_LB_OPTIN = 'urgecare.settings.leaderboard.optin.v1'

type SosRec = { startedAt?: string; endedAt?: string; minutes?: number }

// 讀本機 SOS 延遲紀錄（相容多個舊 key）
function loadSosHistory(): SosRec[] {
  const candidates = ['urgecare.sos.history.v1', 'urgecare.sosHistory.v1', 'sos.history']
  for (const k of candidates) {
    try {
      const raw = localStorage.getItem(k)
      if (!raw) continue
      const arr = JSON.parse(raw)
      if (Array.isArray(arr) && arr.length) {
        return arr
          .map((x: any) => {
            if (typeof x?.minutes === 'number') {
              return { minutes: x.minutes, startedAt: x.startedAt, endedAt: x.endedAt }
            }
            if (x?.endedAt && x?.startedAt) {
              const m = Math.max(
                0,
                Math.round((+new Date(x.endedAt) - +new Date(x.startedAt)) / 60000)
              )
              return { minutes: m, startedAt: x.startedAt, endedAt: x.endedAt }
            }
            return {
              minutes: Number(x?.m ?? x?.min ?? 0) || 0,
              startedAt: x?.t || x?.startedAt,
              endedAt: x?.endedAt,
            }
          })
          .filter((r: SosRec) => Number.isFinite(r.minutes))
      }
    } catch {}
  }
  return []
}

// 簡易彙總
function summarize(recs: SosRec[]) {
  const count = recs.length
  const total = recs.reduce((s, r) => s + (r.minutes || 0), 0)
  const avg = count ? Math.round((total / count) * 10) / 10 : 0
  const max = recs.reduce((m, r) => Math.max(m, r.minutes || 0), 0)
  const since = Date.now() - 7 * 24 * 60 * 60 * 1000
  const last7 = recs.filter(r => r.endedAt && +new Date(r.endedAt) >= since).length
  return { count, total, avg, max, last7 }
}

export default function Leaderboard() {
  const [optIn, setOptIn] = useState<boolean>(false)
  const [records, setRecords] = useState<SosRec[]>([])

  useEffect(() => {
    setOptIn(localStorage.getItem(KEY_LB_OPTIN) === '1')
    setRecords(loadSosHistory())
  }, [])

  const stats = useMemo(() => summarize(records), [records])

  const enableOptIn = () => {
    localStorage.setItem(KEY_LB_OPTIN, '1')
    setOptIn(true)
  }
  const gotoSettings = () => {
    window.location.hash = '#/settings'
  }

  return (
    <div className="container">
      <div className="title" style={{ marginTop: 8 }}>
        延遲排行榜
      </div>
      {!optIn && (
        <div className="card">
          <div className="section-title">尚未加入排行榜</div>
          <div className="helper" style={{ marginBottom: 12 }}>
            你尚未啟用排行榜。請到「設定 → 排行榜設定」勾選「參加延遲排行榜」或直接加入。
          </div>
          <div className="actions-row">
            <button type="button" className="btn btn-primary" onClick={enableOptIn}>
              立即加入排行榜
            </button>
            <button type="button" className="btn" onClick={gotoSettings}>
              前往設定
            </button>
          </div>
        </div>
      )}

      {optIn && (
        <>
          <div className="card">
            <div className="section-title">我的統計（本機）</div>
            <div className="row" style={{ gap: 16, flexWrap: 'wrap' }}>
              <Stat label="成功次數" value={stats.count} />
              <Stat label="累積分鐘" value={stats.total} />
              <Stat label="平均分鐘" value={stats.avg} />
              <Stat label="最長一次" value={stats.max} />
              <Stat label="近 7 天次數" value={stats.last7} />
            </div>
            {records.length === 0 && (
              <div className="helper" style={{ marginTop: 8 }}>
                （目前沒有延遲紀錄。到「SOS 延遲」完成一次即可產生資料。）
              </div>
            )}
          </div>

          <div className="card">
            <div className="section-title">延遲排行榜（本機 Demo）</div>
            <div className="helper" style={{ marginBottom: 8 }}>
              僅顯示本機統計；未來可串接雲端顯示多人比較。
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: 8,
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    名次
                  </th>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: 8,
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    使用者
                  </th>
                  <th
                    style={{
                      textAlign: 'right',
                      padding: 8,
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    總分鐘
                  </th>
                  <th
                    style={{
                      textAlign: 'right',
                      padding: 8,
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    累積次數
                  </th>
                  <th
                    style={{
                      textAlign: 'right',
                      padding: 8,
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    最長一次
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: 8 }}>1</td>
                  <td style={{ padding: 8 }}>你</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>{stats.total}</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>{stats.count}</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>{stats.max}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        minWidth: 140,
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '12px 14px',
        background: 'var(--surface)',
      }}
    >
      <div style={{ fontSize: 13, opacity: 0.7 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800 }}>{value}</div>
    </div>
  )
}
