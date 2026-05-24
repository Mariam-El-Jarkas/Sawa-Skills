import { useState, useEffect, useCallback } from 'react'
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { PageHeader, Table, ConfirmDialog, AlertBanner } from '../../components/ui'
import { adminApi } from '../../api/adminApi'
import { useAuthStore } from '../../store/authStore'
import clsx from 'clsx'

const STATUS_BADGE = { APPROVED: 'badge-green', PENDING_REVIEW: 'badge-yellow', REJECTED: 'badge-red' }
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString() : '—'

export default function VolunteerPage() {
  const { token } = useAuthStore()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  const load = useCallback(async () => {
    if (!token) return
    try { setLoading(true); setError(null); setSessions(await adminApi.getVolunteerSessions(token) || []) }
    catch (e) { setError(e.message) } finally { setLoading(false) }
  }, [token])

  useEffect(() => { if (token) load() }, [token, load])

  const doAction = async (fn) => { try { setActionLoading(true); await fn(); setConfirm(null); await load() } catch (e) { alert(`Failed: ${e.message}`) } finally { setActionLoading(false) } }

  return (
    <div className="space-y-4">
      <PageHeader title="Volunteer System" subtitle="Review and approve volunteer sessions" actions={<button className="btn-secondary text-sm" onClick={load}><RefreshCw size={14} className="inline mr-1" />Refresh</button>} />
      {error && <AlertBanner type="error" message={error} onRetry={load} />}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[['Total Sessions', sessions.length], ['Approved', sessions.filter(v => v.status === 'APPROVED').length], ['Pending Review', sessions.filter(v => v.status === 'PENDING_REVIEW').length], ['Total Spots', sessions.reduce((a, v) => a + (v.maxParticipants ?? 0), 0)]].map(([label, value]) => (
          <div key={label} className="card p-4 text-center"><p className="text-2xl font-bold text-primary-600">{loading ? '…' : value}</p><p className="text-sm text-gray-500 mt-1">{label}</p></div>
        ))}
      </div>
      <div className="card">
        <Table headers={['Session', 'Organizer', 'Date', 'Participants', 'Status', 'Actions']} empty={!loading && sessions.length === 0} loading={loading}>
          {sessions.map(v => (
            <tr key={v.id} className="table-row">
              <td className="table-td"><p className="font-medium text-gray-900 text-sm">{v.title}</p><p className="text-xs text-gray-400 truncate max-w-xs">{v.description}</p></td>
              <td className="table-td"><p className="text-gray-700 text-sm">{v.organizerName}</p><p className="text-xs text-gray-400">{v.organizerEmail}</p></td>
              <td className="table-td text-gray-500 text-xs">{fmtDate(v.sessionDate)}</td>
              <td className="table-td">
                <div className="text-xs"><span className="font-semibold text-gray-800">{v.participantCount ?? 0}</span>{v.maxParticipants && <span className="text-gray-400">/{v.maxParticipants}</span>}</div>
                {v.maxParticipants > 0 && <div className="w-16 h-1 bg-gray-100 rounded mt-1"><div className="h-full bg-primary-500 rounded" style={{ width: `${Math.min(100, ((v.participantCount ?? 0) / v.maxParticipants) * 100)}%` }} /></div>}
              </td>
              <td className="table-td"><span className={clsx('badge', STATUS_BADGE[v.status] ?? 'badge-gray')}>{(v.status ?? '').replace('_', ' ').toLowerCase()}</span></td>
              <td className="table-td">
                <div className="flex gap-1">
                  {v.status === 'PENDING_REVIEW' && <>
                    <button onClick={() => setConfirm({ msg: `Approve "${v.title}"?`, onConfirm: () => doAction(() => adminApi.approveSession(token, v.id)) })} className="p-1.5 hover:bg-green-50 rounded text-green-600" title="Approve"><CheckCircle size={15} /></button>
                    <button onClick={() => setConfirm({ msg: `Reject "${v.title}"?`, danger: true, onConfirm: () => doAction(() => adminApi.rejectSession(token, v.id)) })} className="p-1.5 hover:bg-red-50 rounded text-red-600" title="Reject"><XCircle size={15} /></button>
                  </>}
                  {v.status === 'APPROVED' && <span className="text-xs text-green-600 font-medium px-2">Live ✓</span>}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </div>
      {confirm && <ConfirmDialog message={confirm.msg} danger={confirm.danger} loading={actionLoading} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}
    </div>
  )
}
