import { useEffect, useState } from 'react'
import { addWish, listWishes, voteWish } from '../../db/repo'

export interface WishItem {
  id: string;
  title: string;
  votes: number;
}

export default function WishWall() {
  const [title, setTitle] = useState('')
  const [list, setList] = useState([] as WishItem[])
  useEffect(() => {
    refresh()
  }, [])
  async function refresh() {
    setList(await listWishes())
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="我希望增加…"
          className="flex-1"
        />
        <button
          className="btn"
          onClick={async () => {
            if (!title.trim()) return
            await addWish(title.trim())
            setTitle('')
            refresh()
          }}
        >
          許願
        </button>
      </div>
      <ul className="space-y-2">
        {list.map(w => (
          <li key={w.id} className="card p-3 flex items-center justify-between">
            <span className="truncate mr-3">{w.title}</span>
            <button
              className="btn-sm"
              onClick={() => {
                voteWish(w.id)
                refresh()
              }}
            >
              +{w.votes || 0}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
