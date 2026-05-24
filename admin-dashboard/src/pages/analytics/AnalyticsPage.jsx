import { useState, useEffect } from 'react'
import { AreaChart, Area, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Users, ArrowLeftRight, ShieldCheck, Flag, Heart, FileText, MessageCircle, Activity, TrendingUp, TrendingDown } from 'lucide-react'
import { PageHeader, AlertBanner } from '../../components/ui'
import { adminApi } from '../../api/adminApi'
import { useAuthStore } from '../../store/authStore'

const COLORS = ['#7C3AED', '#A78BFA', '#8B5CF6', '#6D28D9', '#C4B5FD', '#DDD6FE']

function KpiCard({ title, value, label, up, icon, iconBg }) {
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-500 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900 leading-none">{typeof value === 'number' ? value.toLocaleString() : (value ?? '—')}</p>
        <div className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${up ? 'text-green-600' : 'text-red-500'}`}>
          {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{label}
        </div>
      </div>
    </div>
  )
}

function SectionTitle({ children }) {
  return <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">{children}</h3>
}

export default function AnalyticsPage() {
  const { token } = useAuthStore()
  const [stats, setStats] = useState(null)
  const [userGrowth, setUserGrowth] = useState([])
  const [swapTrends, setSwapTrends] = useState({ completed: [], pending: [] })
  const [skillDemand, setSkillDemand] = useState([])
  const [topUsers, setTopUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!token) return
    const load = async () => {
      try {
        setLoading(true)
        const [s, ug, st, sd, tu] = await Promise.all([
          adminApi.getStats(token), adminApi.getUserGrowth(token),
          adminApi.getSwapTrends(token), adminApi.getSkillDemand(token), adminApi.getTopUsers(token),
        ])
        setStats(s)
        setUserGrowth((ug || []).map(p => ({ month: p.label, users: p.value })))
        setSwapTrends({ completed: (st?.completed || []).map(p => ({ month: p.label, completed: p.value })), pending: (st?.pending || []).map(p => ({ month: p.label, pending: p.value })) })
        setSkillDemand((sd || []).map(p => ({ name: p.label, value: p.value })))
        setTopUsers(tu || [])
      } catch (e) { setError(e.message) }
      finally { setLoading(false) }
    }
    load()
  }, [token])

  const exchangeData = swapTrends.completed.map((c, i) => ({ month: c.month, completed: c.completed, pending: swapTrends.pending[i]?.pending ?? 0 }))

  if (error) return <div className="space-y-4"><PageHeader title="Analytics" subtitle="Platform performance overview" /><AlertBanner type="error" message={`Failed to load: ${error}`} onRetry={() => window.location.reload()} /></div>

  const Sk = ({ h = 'h-24' }) => <div className={`animate-pulse bg-gray-100 rounded ${h}`} />

  return (
    <div className="space-y-8">
      <PageHeader title="Analytics" subtitle="Platform performance overview" />

      <div><SectionTitle>Key Metrics</SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? Array(4).fill(0).map((_, i) => <Sk key={i} />) : <>
            <KpiCard title="Total Users"   value={stats?.totalUsers}    label="All registered" up={true}  icon={<Users size={18} className="text-primary-600" />} iconBg="bg-primary-50" />
            <KpiCard title="Active Today"  value={stats?.activeToday}   label="Registered today" up={true} icon={<Activity size={18} className="text-green-600" />} iconBg="bg-green-50" />
            <KpiCard title="Total Swaps"   value={stats?.totalSwaps}    label={`${stats?.completedSwaps ?? 0} completed`} up={true} icon={<ArrowLeftRight size={18} className="text-blue-600" />} iconBg="bg-blue-50" />
            <KpiCard title="Messages Sent" value={stats?.totalMessages} label="All time" up={true} icon={<MessageCircle size={18} className="text-teal-600" />} iconBg="bg-teal-50" />
          </>}
        </div>
      </div>

      <div><SectionTitle>Needs Attention</SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? Array(4).fill(0).map((_, i) => <Sk key={i} />) : <>
            <KpiCard title="Pending Verifications" value={stats?.pendingVerifications} label="Awaiting review" up={false} icon={<ShieldCheck size={18} className="text-yellow-600" />} iconBg="bg-yellow-50" />
            <KpiCard title="Pending Reports"       value={stats?.pendingReports}       label="Requires action" up={false} icon={<Flag size={18} className="text-red-600" />} iconBg="bg-red-50" />
            <KpiCard title="Volunteer Sessions"    value={stats?.totalSessions}        label="Total sessions" up={true}  icon={<Heart size={18} className="text-pink-600" />} iconBg="bg-pink-50" />
            <KpiCard title="Total Posts"           value={stats?.totalPosts}           label="All time" up={true}  icon={<FileText size={18} className="text-indigo-600" />} iconBg="bg-indigo-50" />
          </>}
        </div>
      </div>

      <div><SectionTitle>Growth & Exchanges</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card p-5">
            <p className="font-semibold text-gray-800 mb-1">User Growth</p>
            <p className="text-xs text-gray-400 mb-4">New registrations per month (last 7 months)</p>
            {loading ? <Sk h="h-48" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={userGrowth} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs><linearGradient id="ug" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#7C3AED" stopOpacity={0.2} /><stop offset="95%" stopColor="#7C3AED" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }} />
                  <Area type="monotone" dataKey="users" stroke="#7C3AED" fill="url(#ug)" strokeWidth={2} name="New Users" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="card p-5">
            <p className="font-semibold text-gray-800 mb-1">Exchange Trends</p>
            <p className="text-xs text-gray-400 mb-4">Completed vs pending swaps per month</p>
            {loading ? <Sk h="h-48" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={exchangeData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="completed" stroke="#7C3AED" strokeWidth={2} dot={false} name="Completed" />
                  <Line type="monotone" dataKey="pending" stroke="#C4B5FD" strokeWidth={2} dot={false} name="Pending" strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div><SectionTitle>Skill Category Demand</SectionTitle>
        <div className="card p-5">
          {loading ? <Sk h="h-48" /> : skillDemand.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No skill categories yet</p>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="40%" height={200}>
                <PieChart><Pie data={skillDemand} cx="50%" cy="50%" innerRadius={52} outerRadius={82} dataKey="value" paddingAngle={3}>
                  {skillDemand.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie><Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }} /></PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2.5">
                {skillDemand.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-xs text-gray-600 flex-1 truncate">{item.name}</span>
                    <span className="text-xs font-semibold text-gray-800">{item.value} skills</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div><SectionTitle>Top Performing Users</SectionTitle>
        <div className="card divide-y divide-gray-50">
          {loading ? Array(5).fill(0).map((_, i) => <Sk key={i} h="h-14 m-2" />) : topUsers.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No completed swaps yet</p>
          ) : topUsers.map((u, i) => (
            <div key={u.id} className="flex items-center gap-4 px-5 py-3.5">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-100 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-gray-50 text-gray-400'}`}>{i + 1}</span>
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0"><span className="text-white text-xs font-bold">{u.name?.[0] ?? '?'}</span></div>
              <div className="flex-1 min-w-0"><span className="text-sm font-medium text-gray-800 block truncate">{u.name}</span><span className="text-xs text-gray-400 truncate">{u.email}</span></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
