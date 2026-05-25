import { useState, useEffect, useCallback } from 'react'
import { Save, User, Mail, Lock, Eye, EyeOff, Shield, Globe } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { adminApi } from '../../api/adminApi'

export default function SettingsPage() {
  const { admin, token, login } = useAuthStore()
  const [activeTab, setActiveTab] = useState('account')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [saving, setSaving] = useState(false)
  const [accountMsg, setAccountMsg] = useState(null) // { type: 'success'|'error', text }
  const [platformMsg, setPlatformMsg] = useState(null)
  const [loadingSettings, setLoadingSettings] = useState(true)

  const [accountForm, setAccountForm] = useState({
    name: admin?.name || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [platformSettings, setPlatformSettings] = useState({
    platformName: 'Sawa Skills',
    supportEmail: 'support@sawa.com',
    maintenanceMode: 'false',
    allowRegistrations: 'true',
    requireEmailVerification: 'true',
    autoModeration: 'false',
    autoSuspendThreshold: '5',
  })

  const loadSettings = useCallback(async () => {
    if (!token) return
    try {
      setLoadingSettings(true)
      const data = await adminApi.getSettings(token)
      if (data) setPlatformSettings(p => ({ ...p, ...data }))
    } catch { /* use defaults */ } finally { setLoadingSettings(false) }
  }, [token])

  useEffect(() => { if (token) loadSettings() }, [token, loadSettings])

  const flash = (setter, type, text) => {
    setter({ type, text })
    setTimeout(() => setter(null), 3000)
  }

  const handleSaveAccount = async () => {
    const nameTrimmed = accountForm.name.trim()
    if (!nameTrimmed) return flash(setAccountMsg, 'error', 'Display name cannot be empty')

    const changingPassword = accountForm.currentPassword || accountForm.newPassword || accountForm.confirmPassword
    if (changingPassword) {
      if (!accountForm.currentPassword) return flash(setAccountMsg, 'error', 'Enter your current password')
      if (accountForm.newPassword.length < 8) return flash(setAccountMsg, 'error', 'New password must be at least 8 characters')
      if (accountForm.newPassword !== accountForm.confirmPassword) return flash(setAccountMsg, 'error', 'New passwords do not match')
    }

    try {
      setSaving(true)
      if (nameTrimmed !== admin?.name) {
        await adminApi.updateAdminName(token, nameTrimmed)
        useAuthStore.setState(s => ({ admin: { ...s.admin, name: nameTrimmed } }))
        localStorage.setItem('admin_data', JSON.stringify({ ...admin, name: nameTrimmed }))
      }
      if (changingPassword) {
        await adminApi.changeAdminPassword(token, accountForm.currentPassword, accountForm.newPassword)
        setAccountForm(p => ({ ...p, currentPassword: '', newPassword: '', confirmPassword: '' }))
      }
      flash(setAccountMsg, 'success', 'Changes saved successfully')
    } catch (e) {
      flash(setAccountMsg, 'error', e.message)
    } finally { setSaving(false) }
  }

  const handleSavePlatform = async () => {
    try {
      setSaving(true)
      await adminApi.saveSettings(token, platformSettings)
      flash(setPlatformMsg, 'success', 'Platform settings saved')
    } catch (e) {
      flash(setPlatformMsg, 'error', e.message)
    } finally { setSaving(false) }
  }

  const toggleBool = (key) => setPlatformSettings(p => ({ ...p, [key]: p[key] === 'true' ? 'false' : 'true' }))

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

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === key ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {/* ── My Account ─────────────────────────────────────────────────────── */}
      {activeTab === 'account' && (
        <div className="space-y-4">
          <div className="card p-6 space-y-5">
            <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
              <div className="w-14 h-14 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl font-bold">{accountForm.name?.[0]?.toUpperCase() ?? 'A'}</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{accountForm.name || admin?.name}</p>
                <p className="text-sm text-gray-500">Administrator</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label flex items-center gap-1"><User size={13} /> Display Name</label>
                <input className="input" value={accountForm.name}
                  onChange={e => setAccountForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label className="label flex items-center gap-1"><Mail size={13} /> Login Email</label>
                <input className="input bg-gray-50 cursor-not-allowed" type="email" value={admin?.email || ''} disabled />
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed from here</p>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <p className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Lock size={15} className="text-primary-500" /> Change Password
              </p>
              <p className="text-xs text-gray-400 mb-3">Leave all three fields empty to keep your current password.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="label">Current Password</label>
                  <div className="relative">
                    <input className="input pr-9" type={showCurrentPw ? 'text' : 'password'}
                      value={accountForm.currentPassword}
                      onChange={e => setAccountForm(p => ({ ...p, currentPassword: e.target.value }))}
                      placeholder="••••••••" />
                    <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                      {showCurrentPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label">New Password</label>
                  <div className="relative">
                    <input className="input pr-9" type={showNewPw ? 'text' : 'password'}
                      value={accountForm.newPassword}
                      onChange={e => setAccountForm(p => ({ ...p, newPassword: e.target.value }))}
                      placeholder="••••••••" />
                    <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                      {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label">Confirm Password</label>
                  <input className="input" type="password"
                    value={accountForm.confirmPassword}
                    onChange={e => setAccountForm(p => ({ ...p, confirmPassword: e.target.value }))}
                    placeholder="••••••••" />
                </div>
              </div>
            </div>
          </div>

          {accountMsg && (
            <div className={`px-4 py-3 rounded-lg text-sm font-medium ${accountMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {accountMsg.text}
            </div>
          )}

          <button onClick={handleSaveAccount} disabled={saving}
            className="btn-primary flex items-center gap-2">
            <Save size={16} />{saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      )}

      {/* ── Platform ───────────────────────────────────────────────────────── */}
      {activeTab === 'platform' && (
        <div className="space-y-4">
          {loadingSettings
            ? <div className="card p-8 text-center text-sm text-gray-400 animate-pulse">Loading settings…</div>
            : <>
              <div className="card p-6 space-y-4">
                <p className="text-sm font-semibold text-gray-800 mb-2">General</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Platform Name</label>
                    <input className="input" value={platformSettings.platformName}
                      onChange={e => setPlatformSettings(p => ({ ...p, platformName: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Support Email</label>
                    <input className="input" type="email" value={platformSettings.supportEmail}
                      onChange={e => setPlatformSettings(p => ({ ...p, supportEmail: e.target.value }))} />
                  </div>
                </div>
              </div>

              <div className="card p-6 space-y-4">
                <p className="text-sm font-semibold text-gray-800 mb-2">Controls</p>
                {[
                  { key: 'maintenanceMode',          label: 'Maintenance Mode',            desc: 'Blocks all user access',                danger: true },
                  { key: 'allowRegistrations',        label: 'Allow New Registrations',     desc: 'Let new users sign up' },
                  { key: 'requireEmailVerification',  label: 'Require Email Verification',  desc: 'New accounts must verify email' },
                  { key: 'autoModeration',            label: 'Auto-Moderation',             desc: 'Hide spam posts automatically' },
                ].map(({ key, label, desc, danger }) => {
                  const on = platformSettings[key] === 'true'
                  return (
                    <div key={key} className="flex items-start justify-between gap-4 py-3 border-b border-gray-50 last:border-0">
                      <div><p className="text-sm font-medium text-gray-800">{label}</p><p className="text-xs text-gray-500 mt-0.5">{desc}</p></div>
                      <button onClick={() => toggleBool(key)}
                        className={`relative inline-flex h-6 w-11 rounded-full transition-colors flex-shrink-0 mt-0.5 ${on ? (danger ? 'bg-red-500' : 'bg-primary-600') : 'bg-gray-200'}`}>
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform mt-0.5 ${on ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                  )
                })}
                <div className="pt-2">
                  <label className="label">Auto-suspend after reports</label>
                  <div className="flex items-center gap-3">
                    <input className="input w-24" type="number" min={1} max={50}
                      value={platformSettings.autoSuspendThreshold}
                      onChange={e => setPlatformSettings(p => ({ ...p, autoSuspendThreshold: e.target.value }))} />
                    <p className="text-xs text-gray-500">Reports before auto-flag</p>
                  </div>
                </div>
              </div>

              {platformMsg && (
                <div className={`px-4 py-3 rounded-lg text-sm font-medium ${platformMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {platformMsg.text}
                </div>
              )}

              <button onClick={handleSavePlatform} disabled={saving}
                className="btn-primary flex items-center gap-2">
                <Save size={16} />{saving ? 'Saving…' : 'Save Settings'}
              </button>
            </>}
        </div>
      )}

      {/* ── Security ───────────────────────────────────────────────────────── */}
      {activeTab === 'security' && (
        <div className="card p-6 space-y-5">
          <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
            <Shield size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-800">Your session is secure</p>
              <p className="text-xs text-green-700 mt-0.5">JWT token active · Admin: {admin?.email}</p>
            </div>
          </div>

          <div className="space-y-1 text-sm text-gray-700">
            <p className="font-semibold text-gray-800 mb-3">Security information</p>
            <div className="flex justify-between py-3 border-b border-gray-50">
              <span className="text-gray-600">Authentication method</span>
              <span className="font-medium">Email + Password (JWT)</span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-50">
              <span className="text-gray-600">Two-factor authentication</span>
              <span className="text-gray-400">Not available</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-gray-600">To change your password</span>
              <button onClick={() => setActiveTab('account')}
                className="text-primary-600 hover:underline text-sm font-medium">
                Go to My Account →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
