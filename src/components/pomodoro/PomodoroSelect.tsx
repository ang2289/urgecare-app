import { useEffect, useState } from 'react'

type PomodoroPreset = { id: string; name: string; focusMin: number; breakMin: number }
const BUILTIN: PomodoroPreset[] = [
  { id: 'p_25_5', name: '專注25・休息5', focusMin: 25, breakMin: 5 },
  { id: 'p_50_10', name: '專注50・休息10', focusMin: 50, breakMin: 10 },
  { id: 'p_90_20', name: '專注90・休息20', focusMin: 90, breakMin: 20 },
]

interface Props {
  value?: string
  onChange?: (p: PomodoroPreset) => void
}

export default function PomodoroSelect({ value, onChange }: Props) {
  const [list] = useState<PomodoroPreset[]>(BUILTIN)
  const [selected, setSelected] = useState<string>(value ?? list[0].id)

  useEffect(() => {
    onChange?.(list.find(x => x.id === selected) || list[0])
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value
    setSelected(id)
    onChange?.(list.find(x => x.id === id) || list[0])
  }

  return (
    <select className="input" value={selected} onChange={handleChange}>
      {list.map(p => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  )
}
