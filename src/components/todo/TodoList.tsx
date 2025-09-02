import { useEffect, useState } from 'react'
import { addTodo, listTodos, toggleTodo, deleteTodo } from '../../db/repo'

export default function TodoList() {
  const [list, setList] = useState([] as Awaited<ReturnType<typeof listTodos>>)
  const [text, setText] = useState('')
  useEffect(() => {
    refresh()
  }, [])
  async function refresh() {
    setList(await listTodos())
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="今天要完成…"
          className="flex-1"
        />
        <button
          className="btn"
          onClick={async () => {
            if (!text.trim()) return
            await addTodo(text.trim())
            setText('')
            refresh()
          }}
        >
          新增
        </button>
      </div>
      <ul className="divide-y">
        {list.map(t => (
          <li key={t.id} className="py-2 flex items-center gap-2">
            <input
              type="checkbox"
              checked={t.done}
              onChange={e => {
                toggleTodo(t.id).then(refresh)
              }}
            />
            <span className={`flex-1 truncate ${t.done ? 'line-through opacity-60' : ''}`}>
              {t.text}
            </span>
            <button
              className="btn-ghost"
              onClick={() => {
                deleteTodo(t.id).then(refresh)
              }}
            >
              刪
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
