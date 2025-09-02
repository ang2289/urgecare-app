import ChantCounter from '../components/chant/ChantCounter'

export default function SOSPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">SOS 延遲</h2>

      {/* 你的 SOS 既有區塊：
- 延遲按鈕(+1、+5 分鐘等)
- 待辦替代行為（喝水、深呼吸、外出）
- 支持照片（最多 3 張）
*/}

      {/* 唸咒 / 祈禱 計數器 */}
      <ChantCounter />
    </div>
  )
}
