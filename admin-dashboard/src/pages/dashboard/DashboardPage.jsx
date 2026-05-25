import { Users, ArrowLeftRight, ShieldCheck, Flag, Heart, FileText, MessageCircle, Activity, AlertTriangle } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { StatCard, AlertBanner } from '../../components/ui'
import { mockStats, mockUserGrowth, mockDailyActive, mockSkillDemand, mockExchangeStats } from '../../data/mockData'

const PIE_COLORS = ['#7C3AED', '#A78BFA', '#C4B5FD', '#8B5CF6', '#6D28D9', '#DDD6FE']

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Alerts */}
      <AlertBanner type="warning" message="⚠️ 14 reports are awaiting admin review. 28 verification requests pending." />
      <AlertBanner type="error" message="🔴 Suspicious login attempts detected from IP 45.33.32.156 — check System Logs." />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={mockStats.totalUsers} icon={<Users size={20} />} color="bg-primary-50 text-primary-600" change="+12% this month" changeType="up" />
        <StatCard title="Active Today" value={mockStats.activeToday} icon={<Activity size={20} />} color="bg-primary-100 text-primary-700" change="+5% vs yesterday" changeType="up" />
        <StatCard title="Total Exchanges" value={mockStats.totalExchanges} icon={<ArrowLeftRight size={20} />} color="bg-primary-50 text-primary-600" change="+8% this month" changeType="up" />
        <StatCard title="Pending Verifications" value={mockStats.pendingVerifications} icon={<ShieldCheck size={20} />} color="bg-yellow-50 text-yellow-600" change="Requires attention" changeType="neutral" />
        <StatCard title="Pending Reports" value={mockStats.pendingReports} icon={<Flag size={20} />} color="bg-red-50 text-red-600" change="Requires review" changeType="neutral" />
        <StatCard title="Volunteer Sessions" value={mockStats.volunteerSessions} icon={<Heart size={20} />} color="bg-primary-100 text-primary-600" change="+3 this week" changeType="up" />
        <StatCard title="Total Posts" value={mockStats.totalPosts} icon={<FileText size={20} />} color="bg-primary-50 text-primary-700" change="+127 this week" changeType="up" />
        <StatCard title="Messages Sent" value={mockStats.messagesSent} icon={<MessageCircle size={20} />} color="bg-primary-100 text-primary-600" change="+2.1k this week" changeType="up" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">User Growth</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={mockUserGrowth}>
              <defs>
                <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area type="monotone" dataKey="users" stroke="#7C3AED" fill="url(#userGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Daily Active Users (This Week)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={mockDailyActive}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="users" fill="#7C3AED" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Skill Exchange Trends</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={mockExchangeStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed" fill="#7C3AED" radius={[4, 4, 0, 0]} name="Completed" />
              <Bar dataKey="pending" fill="#C4B5FD" radius={[4, 4, 0, 0]} name="Pending" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Skill Category Demand</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="60%" height={220}>
              <PieChart>
                <Pie data={mockSkillDemand} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                  {mockSkillDemand.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {mockSkillDemand.map((item, i) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i] }} />
                  <span className="text-xs text-gray-600 flex-1">{item.name}</span>
                  <span className="text-xs font-semibold text-gray-800">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <AlertTriangle size={18} className="text-yellow-500" />
          Requires Immediate Attention
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Pending Reports', value: 14, color: 'bg-red-50 border-red-200', textColor: 'text-red-700', link: '/reports' },
            { label: 'Verification Requests', value: 28, color: 'bg-yellow-50 border-yellow-200', textColor: 'text-yellow-700', link: '/verification' },
            { label: 'Disputed Swaps', value: 1, color: 'bg-orange-50 border-orange-200', textColor: 'text-orange-700', link: '/swaps' },
          ].map(item => (
            <a key={item.label} href={item.link} className={`border rounded-xl p-4 ${item.color} hover:shadow-sm transition-shadow`}>
              <p className={`text-3xl font-bold ${item.textColor}`}>{item.value}</p>
              <p className={`text-sm font-medium mt-1 ${item.textColor}`}>{item.label}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
