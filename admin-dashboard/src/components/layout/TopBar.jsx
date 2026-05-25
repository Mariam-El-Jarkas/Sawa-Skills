import { Search, RefreshCw, LogOut, ShieldCheck, Flag, Users, FileText, BarChart2, ArrowLeftRight } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { adminApi } from '../../api/adminApi'
import { useState, useRef, useEffect, useCallback } from 'react'

const PAGE_TITLES = { '/analytics': 'Analytics', '/users': 'User Management', '/skills': 'Skills Management', '/posts': 'Posts & Comments', '/reports': 'Reports', '/verification': 'Verification Requests', '/swaps': 'Skill Exchanges', '/volunteer': 'Volunteer System', '/notifications': 'Notifications', '/logs': 'System Logs', '/settings': 'Settings' }

const SEARCH_SCOPES = [
  { label: 'Users',   path: '/users',   Icon: Users },
  { label: 'Posts',   path: '/posts',   Icon: FileText },
  { label: 'Reports', path: '/reports', Icon: Flag },
  { label: 'Swaps',   path: '/swaps',   Icon: ArrowLeftRight },
]

export default function TopBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { admin, token, logout } = useAuthStore()

  // Bell state
  const [showBell, setShowBell] = useState(false)
  const [stats, setStats] = useState(null)
  const bellRef = useRef(null)

  // Search state
  const [query, setQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const searchRef = useRef(null)

  // Profile dropdown
  const [showProfile, setShowProfile] = useState(false)
  const profileRef = useRef(null)

  const loadStats = useCallback(async () => {
    if (!token) return
    try { setStats(await adminApi.getStats(token)) } catch { /* silent */ }
  }, [token])

  useEffect(() => { if (token) loadStats() }, [token, loadStats])

  // Close bell on outside click
  useEffect(() => {
    const fn = (e) => { if (bellRef.current && !bellRef.current.contains(e.target)) setShowBell(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  // Close search on outside click
  useEffect(() => {
    const fn = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  // Close profile on outside click
  useEffect(() => {
    const fn = (e) => { if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const pendingVerifications = stats?.pendingVerifications ?? 0
  const pendingReports = stats?.pendingReports ?? 0
  const totalBadge = pendingVerifications + pendingReports

  const bellItems = [
    pendingVerifications > 0 && { icon: <ShieldCheck size={15} className="text-primary-500" />, message: `${pendingVerifications} verification${pendingVerifications > 1 ? 's' : ''} pending review`, link: '/verification' },
    pendingReports > 0 && { icon: <Flag size={15} className="text-red-500" />, message: `${pendingReports} report${pendingReports > 1 ? 's' : ''} need attention`, link: '/reports' },
  ].filter(Boolean)

  const doSearch = (path) => {
    const q = query.trim()
    navigate(q ? `${path}?search=${encodeURIComponent(q)}` : path)
    setShowSearch(false)
    setQuery('')
  }

  const handleSearchKey = (e) => {
    if (e.key === 'Enter' && query.trim()) doSearch('/users')
    if (e.key === 'Escape') setShowSearch(false)
  }

  const handleRefresh = () => {
    loadStats()
    window.location.reload()
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>Sawa Skills</span><span>/</span>
        <span className="text-gray-600 font-medium">{PAGE_TITLES[location.pathname] || 'Admin'}</span>
      </div>

      <div className="flex items-center gap-2">

        {/* Global Search */}
        <div className="relative hidden sm:block" ref={searchRef}>
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            className="pl-8 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 w-44 bg-gray-50"
            placeholder="Quick search..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setShowSearch(true)}
            onKeyDown={handleSearchKey}
          />
          {showSearch && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
              {query.trim() ? (
                <>
                  <div className="px-3 py-2 border-b border-gray-100 text-xs text-gray-400 font-medium">Search in...</div>
                  {SEARCH_SCOPES.map(s => (
                    <button key={s.path} onClick={() => doSearch(s.path)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-primary-50 transition-colors text-left">
                      <s.Icon size={14} className="text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-800">Search <span className="font-medium">{s.label}</span> for "<span className="text-primary-600">{query}</span>"</span>
                    </button>
                  ))}
                </>
              ) : (
                <>
                  <div className="px-3 py-2 border-b border-gray-100 text-xs text-gray-400 font-medium">Quick navigation</div>
                  {SEARCH_SCOPES.map(s => (
                    <button key={s.path} onClick={() => doSearch(s.path)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-primary-50 transition-colors text-left">
                      <s.Icon size={14} className="text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Go to <span className="font-medium">{s.label}</span></span>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Refresh */}
        <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors" onClick={handleRefresh} title="Refresh page">
          <RefreshCw size={16} className="text-gray-500" />
        </button>

        {/* Bell */}
        <div className="relative" ref={bellRef}>
          <button onClick={() => setShowBell(!showBell)} className="p-2 hover:bg-gray-50 rounded-lg transition-colors relative">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
            {totalBadge > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">{totalBadge > 9 ? '9+' : totalBadge}</span>}
          </button>
          {showBell && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="font-semibold text-gray-900 text-sm">Action Required</span>
                {totalBadge > 0 && <span className="text-xs bg-red-500 text-white font-bold px-2 py-0.5 rounded-full">{totalBadge}</span>}
              </div>
              <div className="divide-y divide-gray-50">
                {bellItems.length === 0
                  ? <div className="px-4 py-6 text-center text-sm text-gray-400">All clear — no pending actions</div>
                  : bellItems.map((item, i) => (
                    <button key={i} onClick={() => { navigate(item.link); setShowBell(false) }} className="w-full flex items-start gap-3 px-4 py-3 hover:bg-primary-50/40 transition-colors text-left">
                      <span className="mt-0.5 flex-shrink-0">{item.icon}</span>
                      <p className="text-sm text-gray-900 font-medium leading-snug">{item.message}</p>
                      <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1.5" />
                    </button>
                  ))}
              </div>
              <div className="px-4 py-2.5 border-t border-gray-100 text-center">
                <button onClick={() => { navigate('/logs'); setShowBell(false) }} className="text-xs text-primary-600 font-medium hover:underline">View system logs</button>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative pl-2 border-l border-gray-100 ml-1" ref={profileRef}>
          <button onClick={() => setShowProfile(!showProfile)} className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors">
            <div className="w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{admin?.name?.[0]}</span>
            </div>
            <span className="text-sm font-medium text-gray-700 hidden sm:block">{admin?.name}</span>
          </button>
          {showProfile && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900">{admin?.name}</p>
                <p className="text-xs text-gray-400 truncate">{admin?.email}</p>
              </div>
              <div className="p-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  )
}
