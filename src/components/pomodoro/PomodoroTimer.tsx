import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** ====== 型別與常數（新版） ====== */
type FocusLog = { id: string; task: string; minutes: number; finishedAt: string };
const LOGS_KEY = "uc.pomo.logs.v1";
const TASKS_KEY = "uc.pomo.tasks.v1";
const MINUTES_KEY = "uc.pomo.focusMinutes.v1";

const DEFAULT_TASKS = ["寫功課", "閱讀", "運動", "家務", "冥想"];

/** ====== 元件 ====== */
export default function PomodoroTimer() {
  /** 狀態（只保留「專注時間」） */
  const [focusMinutes, setFocusMinutes] = useState<number>(25);
  const [remaining, setRemaining] = useState<number>(25 * 60);
  const [running, setRunning] = useState(false);

  const [tasks, setTasks] = useState<string[]>(DEFAULT_TASKS);
  const [selectedTask, setSelectedTask] = useState<string>(DEFAULT_TASKS[0]);
  const [newTask, setNewTask] = useState<string>("");

  const [logs, setLogs] = useState<FocusLog[]>([]);
  const [showFinish, setShowFinish] = useState(false);

  // 重複完成保護
  const finishedRef = useRef(false);

  /** 初始化（載入 localStorage；申請通知權限） */
  useEffect(() => {
    try {
      const tRaw = localStorage.getItem(TASKS_KEY);
      if (tRaw) {
        const list = JSON.parse(tRaw) as string[];
        if (Array.isArray(list) && list.length) {
          setTasks(list);
          setSelectedTask(list[0]);
        }
      }
    } catch {}

    try {
      const raw = localStorage.getItem(LOGS_KEY);
      if (raw) setLogs(JSON.parse(raw));
    } catch {}

    try {
      const m = localStorage.getItem(MINUTES_KEY);
      if (m) {
        const n = Math.max(1, Math.min(999, Number(m)));
        setFocusMinutes(n);
        setRemaining(n * 60);
      }
    } catch {}

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  /** minutes 持久化；不在倒數時同步 remaining */
  useEffect(() => {
    try { localStorage.setItem(MINUTES_KEY, String(focusMinutes)); } catch {}
    if (!running) setRemaining(focusMinutes * 60);
    // 重置「完成旗標」
    finishedRef.current = false;
  }, [focusMinutes, running]);

  /** 原子追加與清空（寫入與 setState 同步完成） */
  const appendLog = useCallback((entry: FocusLog) => {
    setLogs(prev => {
      const next = [entry, ...prev].slice(0, 1000);
      try { localStorage.setItem(LOGS_KEY, JSON.stringify(next)); } catch {}
      if (import.meta.env.DEV) console.log("[logs] +1", entry, "total=", next.length);
      return next;
    });
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
    try { localStorage.removeItem(LOGS_KEY); } catch {}
    if (import.meta.env.DEV) console.log("[logs] cleared");
  }, []);

  /** 控制：開始/暫停/重設 */
  function start() {
    if (remaining <= 0) setRemaining(focusMinutes * 60);
    setRunning(true);
  }
  function pause() { setRunning(false); }
  function reset() {
    setRunning(false);
    setRemaining(focusMinutes * 60);
  }

  /** 完成處理：停止→寫入紀錄→通知→彈窗→（時間重設） */
  function handleFinish() {
    setRunning(false);
    setRemaining(focusMinutes * 60);

    const entry: FocusLog = {
      id: crypto?.randomUUID?.() ?? String(Date.now()),
      task: selectedTask || "未命名",
      minutes: focusMinutes,
      finishedAt: new Date().toISOString(),
    };
    appendLog(entry);

    try {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("專注時間完成", { body: `${entry.task}：${entry.minutes} 分鐘` });
      }
    } catch {}

    setShowFinish(true);
  }

  /** 倒數（running=true 時啟動 interval；歸零觸發 handleFinish） */
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setRemaining((sec) => {
        if (sec <= 1) {
          clearInterval(timer);
          if (!finishedRef.current) {
            finishedRef.current = true;
            handleFinish();
          }
          return 0;
        }
        return sec - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [running]);

  /** 顯示 mm:ss 與圓形進度 */
  const mmss = useMemo(() => {
    const m = Math.floor(remaining / 60).toString().padStart(2, "0");
    const s = Math.floor(remaining % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, [remaining]);

  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const total = Math.max(1, focusMinutes * 60);
  const progress = 1 - remaining / total;
  const dashoffset = (1 - progress) * circumference;

  /** 新增專注項目 */
  function addTask() {
    const name = newTask.trim();
    if (!name) return;
    const next = [name, ...tasks.filter(t => t !== name)];
    setTasks(next);
    setSelectedTask(name);
    setNewTask("");
    try { localStorage.setItem(TASKS_KEY, JSON.stringify(next)); } catch {}
  }

  /** 匯出 CSV（BOM＋CRLF，Excel 友善） */
  function logsToCSV(rows: FocusLog[]) {
    const esc = (s: string) => `"${String(s).replace(/"/g, '""')}"`;
    const header = ["專注項目", "分鐘數", "完成時間"];
    const lines = [header.join(",")];
    for (const r of rows) {
      lines.push([esc(r.task), String(r.minutes), esc(new Date(r.finishedAt).toLocaleString())].join(","));
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
  function exportFocusLogsCSV() {
    if (!logs.length) { alert("目前尚無完成紀錄可匯出。"); return; }
    const csv = logsToCSV(logs);
    const ts = new Date().toISOString().slice(0,19).replace(/[:T]/g,"-");
    downloadCSV(`pomodoro-logs-${ts}.csv`, csv);
  }

  /** UI */
  return (
    <div className="w-full flex flex-col items-center">
      {/* 上半：卡片 */}
      <section className="uc-section p-4 md:p-6 max-w-3xl w-full shadow-lg rounded-3xl">
        <div className="grid gap-8 md:grid-cols-2 items-center">
          {/* 左：計時圈 —— 強制置中 */}
          <div className="flex justify-center">
            <div className="relative w-[360px] h-[360px] md:w-[420px] md:h-[420px]">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 260 260">
                <circle cx="130" cy="130" r={radius} className="text-gray-200"
                        stroke="currentColor" strokeWidth={16} fill="none" />
                <circle cx="130" cy="130" r={radius} className="text-green-500 transition-[stroke-dashoffset] duration-500 ease-linear"
                        stroke="currentColor" strokeWidth={16} strokeLinecap="round"
                        strokeDasharray={circumference} strokeDashoffset={dashoffset} fill="none" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center select-none text-6xl md:text-8xl font-extrabold tracking-wider leading-none text-purple-700">
                {mmss}
              </div>
            </div>
          </div>

          {/* 右：控制列 —— 手機置中、桌面靠左 */}
          <div className="flex flex-col items-center md:items-start gap-6">
            {/* 專注分鐘 */}
            <div className="flex items-center flex-wrap justify-center md:justify-start gap-3 md:gap-4">
              <span className="shrink-0 text-sm font-medium text-gray-700">專注分鐘</span>
              <button className="w-12 h-12 rounded-2xl bg-gray-100 hover:bg-gray-200 text-2xl leading-none"
                      onClick={() => setFocusMinutes(n => Math.max(1, n - 1))}>−</button>
          <input
                type="text" inputMode="numeric" pattern="[0-9]*"
                className="w-32 min-w-[8rem] text-center text-lg md:text-xl px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={focusMinutes}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9]/g, "");
              const n = Math.max(1, Math.min(999, Number(v || "0")));
              setFocusMinutes(n);
            }}
              />
              <button className="w-12 h-12 rounded-2xl bg-gray-100 hover:bg-gray-200 text-2xl leading-none"
                      onClick={() => setFocusMinutes(n => Math.min(999, n + 1))}>＋</button>
        </div>

            {/* 專注項目 */}
            <div className="uc-toolbar md:justify-start md:gap-4">
              <span className="shrink-0 text-sm font-medium text-gray-700">專注項目</span>
          <select
                className="min-w-44 px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedTask}
            onChange={(e) => setSelectedTask(e.target.value)}
          >
                {tasks.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

            {/* 新增專注項目 */}
            <div className="uc-toolbar md:justify-start md:gap-4">
          <input
                className="flex-1 min-w-[14rem] px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="新增專注項目"
            value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
              />
              <button className="uc-btn uc-btn-ghost" onClick={addTask}>新增</button>
      </div>

            {/* 控制按鈕 */}
            <div className="flex items-center justify-center md:justify-start gap-4 pt-4">
              {running ? (
                <button className="px-5 py-3 md:text-lg font-semibold rounded-2xl shadow-sm !bg-yellow-500 hover:!bg-yellow-600 !text-black" onClick={pause}>暫停</button>
              ) : (
                <button className="px-5 py-3 md:text-lg font-semibold rounded-2xl shadow-sm !bg-green-600 hover:!bg-green-700 !text-white" onClick={start}>開始</button>
              )}
              <button className="px-5 py-3 md:text-lg font-semibold rounded-2xl shadow-sm !bg-red-600 hover:!bg-red-700 !text-white" onClick={reset}>重設</button>
            </div>
          </div>
        </div>
      </section>

      {/* 下半：完成紀錄卡片 */}
      <section className="uc-section p-4 md:p-6 mt-10 max-w-3xl w-full shadow-lg rounded-3xl">
        <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-extrabold">完成紀錄</h2>
            <div className="flex gap-2">
              <button className="uc-btn uc-btn-ghost"
                      onClick={exportFocusLogsCSV}
                      disabled={!logs.length}
                      title={!logs.length ? "沒有資料可匯出" : "匯出 CSV"}>
              匯出 CSV
            </button>
              <button className="uc-btn uc-btn-ghost"
                      onClick={clearLogs}
                      disabled={!logs.length}>
              清空紀錄
            </button>
          </div>
        </div>

          {!logs.length ? (
          <p className="text-gray-500">目前尚無完成紀錄</p>
        ) : (
          <div className="overflow-x-auto px-2">
              <table className="min-w-full text-lg md:text-xl">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="py-2 pr-4">專注項目</th>
                    <th className="py-2 pr-4">分鐘數</th>
                    <th className="py-2 pr-4">完成時間</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(r => (
                    <tr key={r.id} className="border-t border-gray-100">
                      <td className="py-2 pr-4">{r.task}</td>
                      <td className="py-2 pr-4">{r.minutes} 分鐘</td>
                      <td className="py-2 pr-4">{new Date(r.finishedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
          </div>
        )}
        
      </section>

      {/* 完成彈窗 */}
    {showFinish && (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowFinish(false)} />
        <div className="relative z-10 w-[90vw] max-w-md rounded-3xl bg-white p-6 shadow-xl ring-1 ring-gray-200">
          <h3 className="text-xl md:text-2xl font-extrabold text-center mb-2">專注時間完成！</h3>
          <p className="text-gray-600 text-center mb-6">「{selectedTask || "未命名"}」已完成 {focusMinutes} 分鐘。</p>
          <div className="flex gap-3 justify-center">
            <button
              className="px-5 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold"
              onClick={() => setShowFinish(false)}
            >
              稍後
            </button>
            <button
              className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              onClick={() => { setShowFinish(false); start(); }}
            >
              開始下一個專注時段
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}
