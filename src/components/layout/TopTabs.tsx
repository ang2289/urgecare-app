import { NavLink } from "react-router-dom";

type Paths = {
  diary?: string;
  sos?: string;
  todo?: string;
  mood?: string;     // 心得牆
  wish?: string;     // 許願牆
  support?: string;  // 支持牆
  pomodoro?: string;
};

const DEFAULTS: Required<Paths> = {
  diary: "/diary",
  sos: "/sos",                // 若你是 /sos-delay 請在 App 引用處覆蓋
  todo: "/todo",
  mood: "/chant",             // 很多專案用 chant 當「心得牆」，若不同再覆蓋
  wish: "/walls/wish",
  support: "/walls/support",
  pomodoro: "/pomodoro",
};

export default function TopTabs({ paths = {} as Paths }) {
  const p = { ...DEFAULTS, ...paths };

  const TABS = [
    { label: "日記",     to: p.diary },
    { label: "SOS 延遲", to: p.sos },
    { label: "待辦",     to: p.todo },
    { label: "心得牆",   to: p.mood },
    { label: "許願牆",   to: p.wish },
    { label: "支持牆",   to: p.support },
    { label: "番茄鐘",   to: p.pomodoro },
  ];

  const base =
    "px-5 py-3 text-base font-medium rounded-full whitespace-nowrap snap-start transition shadow-sm";
  const active = "bg-indigo-600 text-white";
  const idle   = "bg-gray-100 hover:bg-gray-200 text-gray-800";

  return (
    <div className="sticky top-0 z-40 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <nav className="flex items-center gap-3 overflow-x-auto no-scrollbar px-4 py-3 snap-x snap-mandatory">
        {TABS.map(t => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) => `${base} ${isActive ? active : idle}`}
          >
            {t.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
