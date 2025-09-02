import { useEffect, useState } from 'react'
import { getChant, addChant, setScripture, ChantState } from '../../storage/chant'
import { incrementChant } from '@/db/repo';

const SCRIPTURES = [
  { id: 'heart-sutra', name: '般若心經' },
  { id: 'great-compassion', name: '大悲咒' },
  { id: 'amitabha', name: '阿彌陀經' },
]

export default function ChantCounter() {
  const [s, setS] = useState<ChantState>()
  const [custom, setCustom] = useState<number>(0)

  useEffect(() => {
    setS(getChant())
  }, [])

  return (
    <div className="card p-3 space-y-3">
      <h3 className="font-semibold">誦念 / 唸咒 計數</h3>
      <div className="flex gap-2 items-center">
        <label className="text-sm opacity-70">經文：</label>
        <select
          className="input"
          value={s?.scriptureId || 'heart-sutra'}
          onChange={e => setS(setScripture(e.target.value))}
          title="選擇經文"
        >
          {SCRIPTURES.map(x => (
            <option key={x.id} value={x.id}>
              {x.name}
            </option>
          ))}
        </select>
      </div>
      <div className="text-sm opacity-70">
        今天：{s?.today ?? 0} ／ 總計：{s?.total ?? 0}
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <button className="btn" onClick={() => setS(addChant(1))}>
          +1
        </button>
        <button className="btn" onClick={() => setS(addChant(10))}>
          +10
        </button>
        <button className="btn" onClick={() => setS(addChant(108))}>
          +108
        </button>
        <input
          className="input w-28"
          type="number"
          value={custom || ''}
          onChange={e => setCustom(parseInt(e.target.value || '0'))}
          placeholder="自訂"
        />
        <button
          className="btn"
          onClick={() => {
            if (custom > 0) setS(addChant(custom))
          }}
        >
          加入
        </button>
      </div>
    </div>
  )
}
