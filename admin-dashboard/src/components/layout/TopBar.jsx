import { Search, RefreshCw } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useState, useRef, useEffect } from 'react'

const PAGE_TITLES = {
  '/analytics': 'Analytics',
  '/users': 'User Management',
  '/skills': 'Skills Management',
  '/posts': 'Posts & Comments',
  '/reports': 'Reports',
  '/verification': 'Verification Requests',
  '/swaps': 'Skill Exchanges',
  '/volunteer': 'Volunteer System',
  '/notifications': 'Notifications',
  '/logs': 'System Logs',
  '/settings': 'Settings',
}

const mockBellNotifications = [
  { id: 1, type: 'report', message: 'New report submitted by Sarah M.', time: '2 min ago', unread: true },
  { id: 2, type: 'verification', message: 'Nour Farhat submitted adult verification docs', time: '15 min ago', unread: true },
  { id: 3, type: 'dispute', message: 'Swap SW004 has been marked as disputed', time: '1 hour ago', unread: true },
  { id: 4, type: 'report', message: 'Post #4102 received 5 reports — auto-flagged', time: '2 hours ago', unread: false },
  { id: 5, type: 'system', message: 'Backend API timeout detected on /api/swaps', time: '3 hours ago', unread: false },
  { id: 6, type: 'verification', message: 'Jad Mansour minor verification pending parent reply', time: '5 hours ago', unread: false },
]

const TYPE_ICON = {
  report: '🚩', verification: '🪪', dispute: '⚠️', system: '🔴',
}

export default function TopBar() {
  const location = useLocation()
  const { admin } = useAuthStore()
  const [showBell, setShowBell] = useState(false)
  const bellRef = useRef(null)
  const unreadCount = mockBellNotifications.filter(n => n.unread).length

  useEffect(() => {
    function handleClick(e) {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setShowBell(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>Sawa Skills</span>
        <span>/</span>
        <span className="text-gray-600 font-medium">{PAGE_TITLES[location.pathname] || 'Admin'}</span>
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative hidden sm:block">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="pl-8 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 w-44 bg-gray-50" placeholder="Quick search..." />
        </div>

        <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
          <RefreshCw size={16} className="text-gray-500" />
        </button>

        {/* Bell with dropdown */}
        <div className="relative" ref={bellRef}>
          <button
            onClick={() => setShowBell(!showBell)}
            className="p-2 hover:bg-gray-50 rounded-lg transition-colors relative"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                {unreadCount}
              </span>
            )}
          </button>

          {showBell && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="font-semibold text-gray-900 text-sm">Notifications</span>
                <span className="text-xs text-primary-600 font-medium cursor-pointer hover:underline">Mark all read</span>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                {mockBellNotifications.map(n => (
                  <div key={n.id} className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${n.unread ? 'bg-primary-50/40' : ''}`}>
                    <span className="text-base mt-0.5 flex-shrink-0">{TYPE_ICON[n.type]}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${n.unread ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                    </div>
                    {n.unread && <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1.5" />}
                  </div>
                ))}
              </div>
              <div className="px-4 py-2.5 border-t border-gray-100 text-center">
                <span className="text-xs text-primary-600 font-medium cursor-pointer hover:underline">View all in System Logs</span>
              </div>
            </div>
          )}
        </div>

        {/* Admin avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-gray-100 ml-1">
          <div className="w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">{admin?.name?.[0]}</span>
          </div>
          <span className="text-sm font-medium text-gray-700 hidden sm:block">{admin?.name}</span>
        </div>
      </div>
    </header>
  )
}
