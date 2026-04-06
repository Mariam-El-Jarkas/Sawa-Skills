import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
  Users, ArrowLeftRight, ShieldCheck, Flag,
  Heart, FileText, MessageCircle, Activity,
  TrendingUp, TrendingDown
} from 'lucide-react'
import { PageHeader } from '../../components/ui'
import {
  mockStats, mockUserGrowth, mockDailyActive,
  mockSkillDemand, mockExchangeStats
} from '../../data/mockData'

const COLORS = ['#7C3AED', '#A78BFA', '#8B5CF6', '#6D28D9', '#C4B5FD', '#DDD6FE']

const topUsers = [
  { name: 'Maya Khalil', swaps: 24, rating: 4.9 },
  { name: 'Sarah Mitchell', swaps: 19, rating: 4.8 },
  { name: 'Rania Saad', swaps: 17, rating: 5.0 },
  { name: 'Karim Nassar', swaps: 14, rating: 4.7 },
  { name: 'John Daher', swaps: 12, rating: 4.6 },
]

function KpiCard({ title, value, change, up, icon, iconBg }) {
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-500 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900 leading-none">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        <div className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${up ? 'text-green-600' : 'text-red-500'}`}>
          {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {change}
        </div>
      </div>
    </div>
  )
}

function SectionTitle({ children }) {
  return <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">{children}</h3>
}

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Analytics"
        subtitle="Platform performance overview"
        actions={
          <select className="input w-36 text-sm">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 6 months</option>
            <option>All time</option>
          </select>
        }
      />

      {/* ── Section 1: Key Metrics ─────────────────────────────────── */}
      <div>
        <SectionTitle>Key Metrics</SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard title="Total Users" value={mockStats.totalUsers} change="+12% this month" up={true} icon={<Users size={18} className="text-primary-600" />} iconBg="bg-primary-50" />
          <KpiCard title="Active Today" value={mockStats.activeToday} change="+5% vs yesterday" up={true} icon={<Activity size={18} className="text-green-600" />} iconBg="bg-green-50" />
          <KpiCard title="Skill Exchanges" value={mockStats.totalExchanges} change="+8% this month" up={true} icon={<ArrowLeftRight size={18} className="text-blue-600" />} iconBg="bg-blue-50" />
          <KpiCard title="Messages Sent" value={mockStats.messagesSent} change="+2.1k this week" up={true} icon={<MessageCircle size={18} className="text-teal-600" />} iconBg="bg-teal-50" />
        </div>
      </div>

      {/* ── Section 2: Needs Attention ─────────────────────────────── */}
      <div>
        <SectionTitle>Needs Attention</SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard title="Pending Verifications" value={mockStats.pendingVerifications} change="Awaiting review" up={false} icon={<ShieldCheck size={18} className="text-yellow-600" />} iconBg="bg-yellow-50" />
          <KpiCard title="Pending Reports" value={mockStats.pendingReports} change="Requires action" up={false} icon={<Flag size={18} className="text-red-600" />} iconBg="bg-red-50" />
          <KpiCard title="Volunteer Sessions" value={mockStats.volunteerSessions} change="+3 this week" up={true} icon={<Heart size={18} className="text-pink-600" />} iconBg="bg-pink-50" />
          <KpiCard title="Total Posts" value={mockStats.totalPosts} change="+127 this week" up={true} icon={<FileText size={18} className="text-indigo-600" />} iconBg="bg-indigo-50" />
        </div>
      </div>

      {/* ── Section 3: Growth Charts ───────────────────────────────── */}
      <div>
        <SectionTitle>Growth</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          <div className="card p-5">
            <p className="font-semibold text-gray-800 mb-1">User Growth</p>
            <p className="text-xs text-gray-400 mb-4">Total registered users over time</p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={mockUserGrowth} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }} />
                <Area type="monotone" dataKey="users" stroke="#7C3AED" fill="url(#userGrad)" strokeWidth={2} name="Users" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="card p-5">
            <p className="font-semibold text-gray-800 mb-1">Daily Active Users</p>
            <p className="text-xs text-gray-400 mb-4">This week's engagement</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={mockDailyActive} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }} />
                <Bar dataKey="users" fill="#7C3AED" radius={[4, 4, 0, 0]} name="Active Users" />
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>
      </div>

      {/* ── Section 4: Exchange & Skills ──────────────────────────── */}
      <div>
        <SectionTitle>Exchanges & Skills</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          <div className="card p-5">
            <p className="font-semibold text-gray-800 mb-1">Exchange Trends</p>
            <p className="text-xs text-gray-400 mb-4">Completed vs pending swaps per month</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={mockExchangeStats} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="completed" stroke="#7C3AED" strokeWidth={2} dot={false} name="Completed" />
                <Line type="monotone" dataKey="pending" stroke="#C4B5FD" strokeWidth={2} dot={false} name="Pending" strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card p-5">
            <p className="font-semibold text-gray-800 mb-1">Skill Category Demand</p>
            <p className="text-xs text-gray-400 mb-4">Most requested skill categories</p>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie data={mockSkillDemand} cx="50%" cy="50%" innerRadius={52} outerRadius={82} dataKey="value" paddingAngle={3}>
                    {mockSkillDemand.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2.5">
                {mockSkillDemand.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-xs text-gray-600 flex-1 truncate">{item.name}</span>
                    <span className="text-xs font-semibold text-gray-800">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Section 5: Top Users ───────────────────────────────────── */}
      <div>
        <SectionTitle>Top Performing Users</SectionTitle>
        <div className="card divide-y divide-gray-50">
          {topUsers.map((u, i) => (
            <div key={u.name} className="flex items-center gap-4 px-5 py-3.5">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-100 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-gray-50 text-gray-400'}`}>
                {i + 1}
              </span>
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">{u.name[0]}</span>
              </div>
              <span className="flex-1 text-sm font-medium text-gray-800">{u.name}</span>
              <span className="text-xs text-gray-400">{u.swaps} swaps</span>
              <div className="flex items-center gap-1">
                <span className="text-yellow-400 text-sm">★</span>
                <span className="text-sm font-semibold text-gray-700">{u.rating}</span>
              </div>
              <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary-500 rounded-full" style={{ width: `${(u.swaps / 25) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
