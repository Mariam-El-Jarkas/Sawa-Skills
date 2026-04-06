import { useState } from 'react'
import { Save, User, Mail, Lock, Eye, EyeOff, Shield, Globe } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

export default function SettingsPage() {
  const { admin } = useAuthStore()
  const [activeTab, setActiveTab] = useState('account')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [saved, setSaved] = useState(false)

  const [accountForm, setAccountForm] = useState({
    name: admin?.name || 'Platform Admin',
    email: admin?.email || 'admin@sawa.com',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [platformSettings, setPlatformSettings] = useState({
    platformName: 'Sawa Skills',
    supportEmail: 'support@sawa.com',
    apiBaseUrl: 'http://localhost:8080/api',
    maintenanceMode: false,
    allowRegistrations: true,
    requireEmailVerification: true,
    autoModeration: false,
    maxReportsBeforeSuspend: 5,
  })

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const tabs = [
    { key: 'account', label: 'My Account', icon: User },
    { key: 'platform', label: 'Platform', icon: Globe },
    { key: 'security', label: 'Security', icon: Shield },
  ]

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-primary-700">Settings</h2>
        <p className="text-sm text-gray-500 mt-0.5">Manage your account and platform configuration</p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === key ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* My Account Tab */}
      {activeTab === 'account' && (
        <div className="space-y-4">
          <div className="card p-6 space-y-5">
            <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
              <div className="w-14 h-14 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl font-bold">{accountForm.name[0]}</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{accountForm.name}</p>
                <p className="text-sm text-gray-500">Administrator</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label flex items-center gap-1"><User size={13} /> Display Name</label>
                <input className="input" value={accountForm.name} onChange={e => setAccountForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label className="label flex items-center gap-1"><Mail size={13} /> Login Email</label>
                <input className="input" type="email" value={accountForm.email} onChange={e => setAccountForm(p => ({ ...p, email: e.target.value }))} />
                <p className="text-xs text-gray-400 mt-1">This is the email you use to log in</p>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <p className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2"><Lock size={15} className="text-primary-500" /> Change Password</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="label">Current Password</label>
                  <div className="relative">
                    <input className="input pr-9" type={showCurrentPw ? 'text' : 'password'} value={accountForm.currentPassword} onChange={e => setAccountForm(p => ({ ...p, currentPassword: e.target.value }))} placeholder="••••••••" />
                    <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                      {showCurrentPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label">New Password</label>
                  <div className="relative">
                    <input className="input pr-9" type={showNewPw ? 'text' : 'password'} value={accountForm.newPassword} onChange={e => setAccountForm(p => ({ ...p, newPassword: e.target.value }))} placeholder="••••••••" />
                    <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                      {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label">Confirm Password</label>
                  <input className="input" type="password" value={accountForm.confirmPassword} onChange={e => setAccountForm(p => ({ ...p, confirmPassword: e.target.value }))} placeholder="••••••••" />
                </div>
              </div>
            </div>
          </div>

          <button onClick={handleSave} className="btn-primary flex items-center gap-2">
            <Save size={16} /> {saved ? '✓ Saved!' : 'Save Changes'}
          </button>
        </div>
      )}

      {/* Platform Tab */}
      {activeTab === 'platform' && (
        <div className="space-y-4">
          <div className="card p-6 space-y-4">
            <p className="text-sm font-semibold text-gray-800 mb-2">General</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Platform Name</label>
                <input className="input" value={platformSettings.platformName} onChange={e => setPlatformSettings(p => ({ ...p, platformName: e.target.value }))} />
              </div>
              <div>
                <label className="label">Support Email</label>
                <input className="input" type="email" value={platformSettings.supportEmail} onChange={e => setPlatformSettings(p => ({ ...p, supportEmail: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="label">Backend API URL</label>
              <input className="input font-mono text-sm" value={platformSettings.apiBaseUrl} onChange={e => setPlatformSettings(p => ({ ...p, apiBaseUrl: e.target.value }))} />
              <p className="text-xs text-gray-400 mt-1">Replace with your Spring Boot server URL when deploying</p>
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <p className="text-sm font-semibold text-gray-800 mb-2">Controls</p>
            {[
              { key: 'maintenanceMode', label: 'Maintenance Mode', desc: 'Blocks all user access and shows maintenance screen', danger: true },
              { key: 'allowRegistrations', label: 'Allow New Registrations', desc: 'Let new users sign up on the platform' },
              { key: 'requireEmailVerification', label: 'Require Email Verification', desc: 'New accounts must verify email before accessing' },
              { key: 'autoModeration', label: 'Auto-Moderation', desc: 'Automatically hide posts flagged for spam or profanity' },
            ].map(({ key, label, desc, danger }) => (
              <div key={key} className="flex items-start justify-between gap-4 py-3 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
                <button
                  onClick={() => setPlatformSettings(p => ({ ...p, [key]: !p[key] }))}
                  className={`relative inline-flex h-6 w-11 rounded-full transition-colors flex-shrink-0 mt-0.5 ${platformSettings[key] ? (danger ? 'bg-red-500' : 'bg-primary-600') : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform mt-0.5 ${platformSettings[key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            ))}
            <div className="pt-2">
              <label className="label">Auto-suspend after reports</label>
              <div className="flex items-center gap-3">
                <input className="input w-24" type="number" min={1} max={50} value={platformSettings.maxReportsBeforeSuspend} onChange={e => setPlatformSettings(p => ({ ...p, maxReportsBeforeSuspend: +e.target.value }))} />
                <p className="text-xs text-gray-500">User accounts with this many reports will be auto-flagged</p>
              </div>
            </div>
          </div>

          <button onClick={handleSave} className="btn-primary flex items-center gap-2">
            <Save size={16} /> {saved ? '✓ Saved!' : 'Save Settings'}
          </button>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="card p-6 space-y-5">
          <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
            <Shield size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-800">Your session is secure</p>
              <p className="text-xs text-green-700 mt-0.5">JWT token active · Last login: Today 6:08 PM · IP: 192.168.1.1</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Two-Factor Authentication', desc: '2FA adds an extra layer of security to your account', status: 'Not enabled', btnLabel: 'Enable 2FA', btnStyle: 'btn-primary' },
              { label: 'Active Sessions', desc: 'You have 1 active session on this device', status: '1 session', btnLabel: 'Revoke all', btnStyle: 'btn-secondary' },
              { label: 'Audit Log', desc: 'View all actions performed by your admin account', status: '', btnLabel: 'View Logs', btnStyle: 'btn-secondary' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
                <div className="flex items-center gap-3">
                  {item.status && <span className="text-xs text-gray-400">{item.status}</span>}
                  <button className={`${item.btnStyle} text-sm px-3 py-1.5`}>{item.btnLabel}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
