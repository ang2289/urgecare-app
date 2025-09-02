import { Routes, Route, Navigate } from 'react-router-dom'
import SOSPage from './pages/SOSPage'
import PomodoroPage from './pages/PomodoroPage'
import PomodoroSettings from './pages/PomodoroSettings'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/sos" element={<SOSPage />} />
      <Route path="/pomodoro" element={<PomodoroPage />} />
      <Route path="/pomodoro-settings" element={<PomodoroSettings />} />
      <Route path="*" element={<Navigate to="/sos" replace />} />
    </Routes>
  )
}
