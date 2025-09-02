// src/main.tsx
import './reset.css'
import './theme.css'
import './index.css';
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { applyLivelyIfNeeded } from './storage'
import { BrowserRouter } from "react-router-dom";
// ---- boot-time Theme Preset ----
;(function applyPresetEarly() {
  try {
    const preset = localStorage.getItem('urgecare.theme.preset.v1') as any
    if (preset === 'calm' || preset === 'lively') {
      const map = {
        calm: {
          appBg: '#0b1020',
          surface: '#111827',
          inputBg: '#0f172a',
          inputBorder: '#374151',
          text: '#ffffff',
          primary: '#3b82f6',
          navBg: 'transparent',
        },
        lively: {
          appBg: 'linear-gradient(180deg,#10172a,#1e293b)',
          surface: '#1f2937',
          inputBg: '#152238',
          inputBorder: '#3b4a63',
          text: '#f9fafb',
          primary: '#4f8ef7',
          navBg: 'rgba(12,17,28,.55)',
        },
      } as const
      const p = map[preset as keyof typeof map]
      const root = document.documentElement.style
      root.setProperty('--app-bg', p.appBg as string)
      root.setProperty('--surface', p.surface)
      root.setProperty('--input-bg', p.inputBg)
      root.setProperty('--input-border', p.inputBorder)
      root.setProperty('--text', p.text)
      root.setProperty('--primary', p.primary)
      root.setProperty('--nav-bg', p.navBg)
    }
  } catch {}
})()
// ---- boot-time CSS vars (from localStorage) ----
;(function applyCssVarsEarly() {
  const get = (k: string, d: string) => {
    const v = localStorage.getItem(k) || ''
    return v.trim() ? v : d
  }
  const root = document.documentElement.style
  root.setProperty('--surface', get('urgecare.theme.surface.v1', '#111827'))
  root.setProperty('--input-bg', get('urgecare.theme.inputbg.v1', '#0f172a'))
  root.setProperty('--input-border', get('urgecare.theme.inputborder.v1', '#374151'))
  const bg = localStorage.getItem('urgecare.bg.v1') || '#0b1020'
  if (!bg.trim().toLowerCase().startsWith('url(')) {
    root.setProperty('--app-bg', bg)
  }
})()
// ---- end boot-time CSS vars ----
// 首次載入套用「活潑」主題（避免閃白/閃黑）
applyLivelyIfNeeded()
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
