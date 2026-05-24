import { useState, useEffect, useCallback } from 'react'
import { Send, Plus, Bell } from 'lucide-react'
import { PageHeader, Table, Modal, AlertBanner } from '../../components/ui'
import { adminApi } from '../../api/adminApi'
import { useAuthStore } from '../../store/authStore'

const autoNotifs = [
  { id: 1, trigger: 'New swap request', description: 'Sent when someone requests a swap with a user' },
  { id: 2, trigger: 'Swap accepted', description: 'Sent when a swap request is accepted' },
  { id: 3, trigger: 'Swap completed', description: 'Sent when both users mark a swap as complete' },
  { id: 4, trigger: 'New message received', description: 'Sent when a user receives a new chat message' },
  { id: 5, trigger: 'Verification approved', description: 'Sent when admin approves an identity verification' },
  { id: 6, trigger: 'Verification rejected', description: 'Sent when admin rejects a verification request' },
  { id: 7, trigger: 'Account suspended', description: 'Sent when an account is suspended by admin' },
  { id: 8, trigger: 'Volunteer session reminder', description: 'Sent 24h before a volunteer session the user joined' },
]

const fmtDate = (iso) => iso ? new Date(iso).toLocaleString() : '—'

export default function NotificationsPage() {
  const { token } = useAuthStore()
  const [tab, setTab] = useState('admin')
  const [broadcasts, setBroadcasts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sending, setSending] = useState(false)
  const [showCompose, setShowCompose] = useState(false)
  const [form, setForm] = useState({ title: '', message: '', audience: 'ALL' })

  const load = useCallback(async () => {
    if (!token) return
    try { setLoading(true); setError(null); setBroadcasts(await adminApi.getBroadcasts(token) || []) }
    catch (e) { setError(e.message) } finally { setLoading(false) }
  }, [token])

  useEffect(() => { if (token) load() }, [token, load])

  const handleSend = async () => {
    if (!form.title.trim() || !form.message.trim()) return
    try {
      setSending(true); await adminApi.sendBroadcast(token, { title: form.title, message: form.message, audience: form.audience })
      setForm({ title: '', message: '', audience: 'ALL' }); setShowCompose(false); await load()
    } catch (e) { alert(`Failed: ${e.message}`) } finally { setSending(false) }
  }

  const totalReach = broadcasts.reduce((a, n) => a + (n.recipientCount ?? 0), 0)

  return (
    <div className="space-y-4">
      <PageHeader title="Notifications" subtitle="Manage admin broadcasts and automatic system notifications"
        actions={tab === 'admin' ? <button className="btn-primary text-sm flex items-center gap-2" onClick={() => setShowCompose(true)}><Plus size={16} /> New Broadcast</button> : undefined} />
      <div className="flex gap-2">
        {[{ key: 'admin', label: '📢 Admin Broadcasts' }, { key: 'auto', label: '🤖 Automatic' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${tab === t.key ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>{t.label}</button>
        ))}
      </div>
      {error && <AlertBanner type="error" message={error} onRetry={load} />}
      {tab === 'admin' && <>
        <div className="grid grid-cols-3 gap-4">
          {[['Total Sent', loading ? '…' : broadcasts.length], ['Total Reach', loading ? '…' : totalReach.toLocaleString()], ['Avg. Reach', loading || !broadcasts.length ? '…' : Math.round(totalReach / broadcasts.length).toLocaleString()]].map(([label, value]) => (
            <div key={label} className="card p-4 text-center"><p className="text-2xl font-bold text-primary-600">{value}</p><p className="text-sm text-gray-500 mt-1">{label}</p></div>
          ))}
        </div>
        <div className="card">
          <Table headers={['Title', 'Message', 'Audience', 'Sent At', 'Recipients', 'Status']} empty={!loading && broadcasts.length === 0} loading={loading}>
            {broadcasts.map(n => (
              <tr key={n.id} className="table-row">
                <td className="table-td font-medium text-gray-900">{n.title}</td>
                <td className="table-td max-w-xs"><p className="text-sm text-gray-600 truncate">{n.message}</p></td>
                <td className="table-td"><span className="badge badge-purple capitalize">{(n.audience ?? 'ALL').toLowerCase()}</span></td>
                <td className="table-td text-gray-500 text-xs">{fmtDate(n.sentAt)}</td>
                <td className="table-td font-semibold text-gray-800">{(n.recipientCount ?? 0).toLocaleString()}</td>
                <td className="table-td"><span className="badge badge-green">Sent</span></td>
              </tr>
            ))}
          </Table>
        </div>
      </>}
      {tab === 'auto' && (
        <div className="card">
          <Table headers={['Trigger Event', 'Description', 'Status']}>
            {autoNotifs.map(n => (
              <tr key={n.id} className="table-row">
                <td className="table-td"><div className="flex items-center gap-2"><Bell size={14} className="text-primary-500" /><span className="font-medium text-gray-900 text-sm">{n.trigger}</span></div></td>
                <td className="table-td text-gray-500 text-sm">{n.description}</td>
                <td className="table-td"><span className="badge badge-green">Active</span></td>
              </tr>
            ))}
          </Table>
        </div>
      )}
      {showCompose && (
        <Modal title="Compose Broadcast" onClose={() => setShowCompose(false)}>
          <div className="space-y-4">
            <div><label className="label">Title</label><input className="input" placeholder="Notification title..." value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
            <div><label className="label">Message</label><textarea className="input resize-none h-24" placeholder="Write your announcement..." value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} /></div>
            <div><label className="label">Target Audience</label>
              <select className="input" value={form.audience} onChange={e => setForm(p => ({ ...p, audience: e.target.value }))}>
                <option value="ALL">All Users</option><option value="VERIFIED">Verified Users Only</option><option value="VOLUNTEERS">Volunteers Only</option>
              </select>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">⚠️ This will send an in-app notification to all selected users immediately.</div>
            <div className="flex gap-2 pt-1">
              <button className="btn-secondary flex-1" onClick={() => setShowCompose(false)}>Cancel</button>
              <button className="btn-primary flex-1 flex items-center justify-center gap-2" onClick={handleSend} disabled={sending || !form.title.trim() || !form.message.trim()}>{sending ? 'Sending…' : <><Send size={16} /> Send Now</>}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
