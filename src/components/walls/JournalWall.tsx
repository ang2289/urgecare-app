import { useEffect, useState } from 'react';
import { listJournal, prayerTotal$, recentDelays$ } from '@/db/repo';
import { addJournal } from '@/db/journalUtils';
import { fileToBase64 } from '@/utils/image';
import { DiaryEntry, Delay, DelayRecord } from '@/types/index';
import { useLiveQuery } from 'dexie-react-hooks';
import { firstValueFrom } from 'rxjs';
import { Observable } from 'rxjs';

export default function JournalWall() {
  const [list, setList] = useState([] as Awaited<ReturnType<typeof listJournal>>);
  const [text, setText] = useState('');
  const [images, setImages] = useState<string[]>([]);

  // 修正 prayerTotal$ 與 recentDelays$ 的渲染邏輯
  const prayerTotal = useLiveQuery(() => firstValueFrom(prayerTotal$ as unknown as Observable<number>)) || 0;
  const recentDelays = useLiveQuery(() => firstValueFrom(recentDelays$ as unknown as Observable<DelayRecord[]>)) || [];

  useEffect(() => { refresh(); }, []);
  async function refresh() { setList(await listJournal()); }


  async function onAdd() {
    if (!text.trim() && images.length === 0) return;
    await addJournal(text.trim(), images, true);
    setText(''); setImages([]); await refresh();
  }


  async function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const arr = [] as string[];
    for (const f of files) arr.push(await fileToBase64(f));
    setImages(arr);
  }

  // Mock a prayerIncrement function
  function prayerIncrement() {
    // Mock implementation
  }

  return (
    <div className="space-y-3">
      <div className="card p-3">
        <label htmlFor="journal-text" className="sr-only">日記內容</label>
        <textarea id="journal-text" value={text} onChange={e=>setText(e.target.value)} placeholder="寫下此刻的感受…" className="w-full" rows={3} aria-label="請輸入內容" />

        <label htmlFor="journal-images" className="sr-only">上傳圖片</label>
        <input id="journal-images" type="file" multiple accept="image/*" onChange={onPickFiles} title="Upload images" />
        
        <button className="btn" onClick={onAdd}>發佈</button>
      </div>
      <ul className="space-y-2">
        {list.map(item => ({ ...item, id: String(item.id) }))
          .map((p: DiaryEntry) => (
          <li key={p.id} className="card p-3">
            <div className="text-sm opacity-60">{new Date(p.createdAt).toLocaleString()}</div>
            <div className="whitespace-pre-wrap">{p.text}</div>
            {/* @ts-ignore */}
            {p.images?.length ? (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {/* @ts-ignore */}
                {p.images.map((img: string, i: number) => <img key={i} src={img} className="w-full rounded" alt={img ? `Image ${i + 1}` : ''} />)}
              </div>
            ) : null}
            {/* @ts-ignore */}
            <button className="btn-sm mt-2" onClick={async ()=>{ await prayerIncrement(); }}>+1 ({p.likes||0})</button>
          </li>
        ))}
      </ul>
      <div className="card p-3">
        <h2 className="text-lg font-semibold">Prayer Total: {prayerTotal || 0}</h2>
        <h3 className="text-md font-medium">Recent Delays:</h3>
        <ul className="list-disc list-inside">
          {(recentDelays.length > 0 ? recentDelays : [{ id: 'default', description: '（無資料）' }]).map((delay: any) => (
            <li key={delay.id}>{delay.description}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}