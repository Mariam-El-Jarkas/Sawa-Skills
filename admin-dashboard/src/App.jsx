import { Routes, Route, Navigate } from 'react-router-dom'
import AdminLayout from './components/layout/AdminLayout'
import LoginPage from './pages/LoginPage'
import UsersPage from './pages/users/UsersPage'
import SkillsPage from './pages/skills/SkillsPage'
import PostsPage from './pages/posts/PostsPage'
import ReportsPage from './pages/reports/ReportsPage'
import VerificationPage from './pages/verification/VerificationPage'
import SwapsPage from './pages/swaps/SwapsPage'
import VolunteerPage from './pages/volunteer/VolunteerPage'
import NotificationsPage from './pages/notifications/NotificationsPage'
import AnalyticsPage from './pages/analytics/AnalyticsPage'
import LogsPage from './pages/logs/LogsPage'
import SettingsPage from './pages/settings/SettingsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AdminLayout />}>
        <Route path="/" element={<Navigate to="/analytics" replace />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/skills" element={<SkillsPage />} />
        <Route path="/posts" element={<PostsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/verification" element={<VerificationPage />} />
        <Route path="/swaps" element={<SwapsPage />} />
        <Route path="/volunteer" element={<VolunteerPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/logs" element={<LogsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/analytics" replace />} />
    </Routes>
  )
}
