import React, { useEffect, useState } from 'react'
import { db } from '../../storage/db'

// 將 File 轉 base64
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

export default function SupportWall() {
  const [list, setList] = useState<any[]>([])
  const [text, setText] = useState('')
  const [dataUrl, setDataUrl] = useState('')

  async function refresh() {
    const rows = await db.photos.orderBy('createdAt').reverse().toArray()
    setList(rows.filter(x => x.type === 'support'))
  }
  useEffect(() => {
    refresh()
  }, [])

  return (
    <div className="space-y-3">
      <div className="card p-3 space-y-2">
        <input
          className="input w-full"
          placeholder="想給大家的一句話…"
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <input
          type="file"
          accept="image/*"
          onChange={async e => {
            const f = e.target.files?.[0]
            if (f) setDataUrl(await fileToBase64(f))
          }}
        />
        {dataUrl && <img src={dataUrl} className="w-full rounded" alt="preview" />}
        <button
          className="btn"
          onClick={async () => {
            if (!text.trim() && !dataUrl) return
            await db.photos.add({
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
              type: 'support',
              text: text.trim() || '',
              dataUrl,
            })
            setText('')
            setDataUrl('')
            await refresh()
          }}
        >
          送出
        </button>
      </div>

      <ul className="space-y-2">
        {list.map((s, index) => (
          <li key={s.id} className="card p-3 relative">
            <div className="text-xs opacity-60">{new Date(s.createdAt).toLocaleString()}</div>
            {s.text && <div className="mt-1">{s.text}</div>}
            {s.dataUrl && <img src={s.dataUrl} className="mt-2 w-full rounded" />}

            <div className="absolute top-2 right-2 flex flex-col space-y-1">
              {index > 0 && (
                <button
                  className="btn btn-sm"
                  onClick={async () => {
                    const newList = [...list]
                    const temp = newList[index - 1]
                    newList[index - 1] = newList[index]
                    newList[index] = temp
                    setList(newList)
                    await db.photos.update(newList[index - 1].id, { createdAt: new Date().toISOString() })
                    await db.photos.update(newList[index].id, { createdAt: new Date().toISOString() })
                  }}
                >
                  上移
                </button>
              )}
              {index < list.length - 1 && (
                <button
                  className="btn btn-sm"
                  onClick={async () => {
                    const newList = [...list]
                    const temp = newList[index + 1]
                    newList[index + 1] = newList[index]
                    newList[index] = temp
                    setList(newList)
                    await db.photos.update(newList[index + 1].id, { createdAt: new Date().toISOString() })
                    await db.photos.update(newList[index].id, { createdAt: new Date().toISOString() })
                  }}
                >
                  下移
                </button>
              )}
              <button
                className="btn btn-sm btn-danger"
                onClick={async () => {
                  await db.photos.delete(s.id)
                  await refresh()
                }}
              >
                刪除
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
