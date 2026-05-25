import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Lock, Mail, Eye, EyeOff, AlertCircle, ShieldCheck } from 'lucide-react'
import logo from '../assets/logo.png'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password) return
    setLoading(true)
    setError('')
    const ok = await login(email.trim(), password)
    setLoading(false)
    if (ok) navigate('/')
    else setError('Invalid email or password.')
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-2/5 bg-gradient-to-br from-primary-900 via-primary-700 to-primary-500 p-12 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-white/5 rounded-full" />
        <div className="absolute -bottom-16 -right-16 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-white/5 rounded-full" />

        {/* Top bar */}
        <div className="relative flex items-center justify-between">
          <span className="text-white/50 text-xs font-semibold tracking-widest uppercase">Sawa Skills</span>
          <span className="text-white/30 text-xs">Admin Panel</span>
        </div>

        {/* Main content — text left, logo right */}
        <div className="relative flex items-end justify-between gap-6">
          <div className="space-y-6 flex-1">
            <div>
              <p className="text-primary-300 text-xs font-semibold uppercase tracking-widest mb-3">Admin Dashboard</p>
              <h2 className="text-4xl font-bold text-white leading-tight whitespace-nowrap">
                Admin Control Center
              </h2>
              <p className="text-primary-200 mt-4 text-sm leading-relaxed max-w-[260px]">
                Manage users, content, and platform settings from one secure place.
              </p>
            </div>
            <div className="space-y-2.5">
              {['User & content moderation', 'Verification management', 'Platform analytics'].map(f => (
                <div key={f} className="flex items-center gap-2.5">
                  <div className="w-1 h-1 rounded-full bg-primary-300 flex-shrink-0" />
                  <span className="text-primary-200 text-xs">{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Logo — right side */}
          <div className="w-28 h-28 rounded-2xl overflow-hidden shadow-2xl shadow-black/40 flex-shrink-0 mb-1">
            <img src={logo} alt="Sawa Skills" className="w-full h-full object-cover" />
          </div>
        </div>

        <div className="relative flex items-center gap-2 text-primary-300 text-xs">
          <ShieldCheck size={14} />
          <span>Restricted access — administrators only</span>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-sm animate-[fadeIn_0.4s_ease]">

          {/* Mobile logo (hidden on lg) */}
          <div className="lg:hidden text-center mb-8">
            <img src={logo} alt="Sawa Skills" className="w-14 h-14 rounded-2xl mx-auto mb-3 shadow-lg" />
            <h1 className="text-xl font-bold text-gray-900">Sawa Skills</h1>
            <p className="text-sm text-gray-500">Admin Dashboard</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-gray-900">Sign in</h2>
              <p className="text-sm text-gray-500 mt-1">Enter your admin credentials to continue</p>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-5 text-sm animate-[fadeIn_0.2s_ease]">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 transition"
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError('') }}
                    placeholder="your@email.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    className="w-full pl-10 pr-11 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 transition"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError('') }}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full mt-2 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
              >
                {loading
                  ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Signing in…</>
                  : 'Sign In'}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-gray-400 mt-5 flex items-center justify-center gap-1.5">
            <ShieldCheck size={12} />
            Secured · Sawa Skills Admin Panel
          </p>
        </div>
      </div>
    </div>
  )
}
