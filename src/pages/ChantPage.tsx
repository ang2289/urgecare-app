import ChantCounter from '../components/chant/ChantCounter'

export default function ChantPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">誦念</h2>
      {/* 你的其他誦念內容（例如：經文選擇、音效、引導卡等）可放在這裡 */}

      {/* 共用計數器：兩頁讀寫同一份 Dexie chant_stats */}
      <ChantCounter />
    </div>
  )
}
