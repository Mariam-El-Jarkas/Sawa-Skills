import { NavLink, useNavigate } from 'react-router-dom'
import { Users, BookOpen, FileText, ArrowLeftRight, Flag, ShieldCheck, Heart, Bell, BarChart3, ScrollText, Settings, LogOut, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '../../store/authStore'
import { adminApi } from '../../api/adminApi'
import clsx from 'clsx'

const NAV_ITEMS = [
  { path: '/analytics',    icon: BarChart3,      label: 'Analytics' },
  { path: '/users',        icon: Users,          label: 'Users' },
  { path: '/skills',       icon: BookOpen,       label: 'Skills' },
  { path: '/posts',        icon: FileText,       label: 'Posts & Comments' },
  { path: '/reports',      icon: Flag,           label: 'Reports',      badgeKey: 'pendingReports' },
  { path: '/verification', icon: ShieldCheck,    label: 'Verification', badgeKey: 'pendingVerifications' },
  { path: '/swaps',        icon: ArrowLeftRight, label: 'Skill Exchanges' },
  { path: '/volunteer',    icon: Heart,          label: 'Volunteer' },
  { path: '/notifications',icon: Bell,           label: 'Notifications' },
  { path: '/logs',         icon: ScrollText,     label: 'System Logs' },
  { path: '/settings',     icon: Settings,       label: 'Settings' },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [stats, setStats] = useState({})
  const { admin, token, logout } = useAuthStore()
  const navigate = useNavigate()

  const loadStats = useCallback(async () => {
    if (!token) return
    try { setStats(await adminApi.getStats(token) || {}) } catch { /* silent */ }
  }, [token])

  useEffect(() => {
    if (token) loadStats()
    const interval = setInterval(() => { if (token) loadStats() }, 60_000)
    return () => clearInterval(interval)
  }, [token, loadStats])

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <aside className={clsx('h-screen flex flex-col bg-white border-r border-gray-100 transition-all duration-300 relative flex-shrink-0', collapsed ? 'w-16' : 'w-60')}>
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0"><span className="text-white font-bold text-sm">SS</span></div>
        {!collapsed && <div><p className="font-bold text-gray-900 text-sm">Sawa Skills</p><p className="text-xs text-gray-400">Admin Panel</p></div>}
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV_ITEMS.map(({ path, icon: Icon, label, badgeKey }) => {
          const count = badgeKey ? (stats[badgeKey] ?? 0) : 0
          return (
            <NavLink key={path} to={path} className={({ isActive }) => clsx('flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative', isActive ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800')}>
              <Icon size={17} className="flex-shrink-0" />
              {!collapsed && <span className="text-sm flex-1">{label}</span>}
              {!collapsed && count > 0 && <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center leading-none">{count}</span>}
              {collapsed && <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">{label}{count > 0 ? ` (${count})` : ''}</div>}
            </NavLink>
          )
        })}
      </nav>
      <div className="border-t border-gray-100 p-3 space-y-1">
        {!collapsed && (
          <div className="flex items-center gap-2 px-2 py-2">
            <div className="w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0"><span className="text-white text-xs font-bold">{admin?.name?.[0]}</span></div>
            <div className="min-w-0"><p className="text-xs font-semibold text-gray-800 truncate">{admin?.name}</p><p className="text-xs text-gray-400">Administrator</p></div>
          </div>
        )}
        <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"><LogOut size={16} />{!collapsed && <span className="text-sm font-medium">Logout</span>}</button>
      </div>
      <button onClick={() => setCollapsed(!collapsed)} className="absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow z-10">{collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}</button>
    </aside>
  )
}
