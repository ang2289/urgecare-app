// src/App.tsx
import { NavLink, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useState } from "react";
import PomodoroTimer from "./components/pomodoro/PomodoroTimer";
import Diary from "./pages/Diary";

// ⬇⬇ 把這些都對到「實際檔名」 ⬇⬇
import SOS from "./pages/SOS";
import Todos from "./pages/Todos";
// 如果你的 ExperienceWall.tsx 在 src/pages 底下用這行；若在 src 根目錄請改成 "../ExperienceWall"
import ExperienceWall from "./pages/ExperienceWall";
import Wish from "./pages/Wish";
import Support from "./pages/Support";
// ⬆⬆------------------------------------⬆⬆

function Page({ title }: { title: string }) {
  return (
    <main className="mx-auto max-w-5xl px-4 md:px-6 py-6 md:py-10">
      <h1 className="text-2xl md:text-3xl font-bold mb-4">{title}</h1>
      <p className="text-gray-500">（這是臨時內容，之後換成你的實際頁面元件）</p>
    </main>
  );
}

export default function App() {
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  const tabs = [
    { label: "日記",   to: "/diary" },
    { label: "SOS 延遲", to: "/sos" },
    { label: "待辦",   to: "/todo" },
    { label: "心得牆", to: "/chant" },
    { label: "許願牆", to: "/wish" },
    { label: "支持牆", to: "/support" },
    { label: "番茄鐘", to: "/pomodoro" },
  ];

  // 前 4 個直接顯示，其餘放進「更多」
  const primaryTabs = tabs.slice(0, 4);
  const overflowTabs = tabs.slice(4);

  return (
    <>
      {/* 頂部：Sticky + Logo + 標題 + 導覽分頁 */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75 border-b border-gray-200">
        {/* 第一行：Logo + 大標題 */}
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="h-10 w-10 rounded-full shrink-0" />
          <h1 className="text-2xl md:text-3xl font-bold tracking-wide">
            壞習慣追蹤器｜戒斷日記
          </h1>
        </div>

        {/* 分頁列區塊，標題與分頁之間加 mb-2，外層加 gap-6 */}
        <nav className="uc-tabs">
          {tabs.map(t => (
            <NavLink
              key={t.to}
              to={t.to}
              className={({ isActive }) =>
                `uc-tab ${isActive ? 'uc-tab--active' : 'uc-tab--inactive'}`
              }
            >
              {t.label}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* 內容 Routes */}
      
      <Routes>
  <Route path="/" element={<Navigate to="/pomodoro" replace />} />

  <Route
    path="/pomodoro"
    element={
      <main className="mx-auto max-w-6xl px-4 md:px-6 py-6 md:py-10">
        <PomodoroTimer />
      </main>
    }
  />

  <Route path="/diary" element={
    <main className="mx-auto max-w-6xl px-4 md:px-6 py-6 md:py-10">
      <Diary />
    </main>
  } />

  {/* 其它頁也一律包 uc-page —— 先用你的占位或真實頁面 */}
  <Route path="/sos" element={<main className="mx-auto max-w-6xl px-4 md:px-6 py-6 md:py-10"><SOS /></main>} />
  <Route path="/todo" element={<main className="mx-auto max-w-6xl px-4 md:px-6 py-6 md:py-10"><Todos /></main>} />
  <Route path="/chant" element={<main className="mx-auto max-w-6xl px-4 md:px-6 py-6 md:py-10"><ExperienceWall /></main>} />
  <Route path="/wish" element={<main className="mx-auto max-w-6xl px-4 md:px-6 py-6 md:py-10"><Wish /></main>} />
  <Route path="/support" element={<main className="mx-auto max-w-6xl px-4 md:px-6 py-6 md:py-10"><Support /></main>} />
  <Route path="*" element={<main className="mx-auto max-w-6xl px-4 md:px-6 py-6 md:py-10"><Page title="404 Not Found" /></main>} />
</Routes>

      <footer className="text-center py-4">
        <a href="/privacy.html">隱私權政策</a>
      </footer>
    </>
  );
}


