import { useState, useEffect, useCallback, useRef } from 'react'
import { CheckCircle, XCircle, Trash2, RefreshCw } from 'lucide-react'
import { PageHeader, Table, SearchBar, ConfirmDialog, AlertBanner } from '../../components/ui'
import { adminApi } from '../../api/adminApi'
import { useAuthStore } from '../../store/authStore'
import clsx from 'clsx'

const STATUS_BADGE = { PENDING: 'badge-yellow', RESOLVED: 'badge-green', DISMISSED: 'badge-gray' }
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString() : '—'

export default function ReportsPage() {
  const { token } = useAuthStore()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [confirm, setConfirm] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const debounceRef = useRef(null)

  const load = useCallback(async (s, f) => {
    if (!token) return
    try { setLoading(true); setError(null); setReports(await adminApi.getReports(token, { search: s, status: f }) || []) }
    catch (e) { setError(e.message) } finally { setLoading(false) }
  }, [token])

  useEffect(() => { if (token) load('', 'all') }, [token, load])

  const handleSearch = (v) => { setSearch(v); clearTimeout(debounceRef.current); debounceRef.current = setTimeout(() => load(v, filter), 300) }
  const doAction = async (fn) => { try { setActionLoading(true); await fn(); setConfirm(null); await load(search, filter) } catch (e) { alert(`Failed: ${e.message}`) } finally { setActionLoading(false) } }
  const pendingCount = reports.filter(r => r.status === 'PENDING').length

  return (
    <div className="space-y-4">
      <PageHeader title="Reports Management" subtitle={`${pendingCount} pending review`} actions={<button className="btn-secondary text-sm" onClick={() => load(search, filter)}><RefreshCw size={14} className="inline mr-1" />Refresh</button>} />
      {error && <AlertBanner type="error" message={error} onRetry={() => load(search, filter)} />}
      <div className="card p-4 flex flex-wrap gap-3">
        <SearchBar value={search} onChange={handleSearch} placeholder="Search by reason or reporter..." />
        <select className="input w-36" value={filter} onChange={e => { setFilter(e.target.value); load(search, e.target.value) }}>
          <option value="all">All Status</option><option value="PENDING">Pending</option><option value="RESOLVED">Resolved</option><option value="DISMISSED">Dismissed</option>
        </select>
      </div>
      <div className="card">
        <Table headers={['#', 'Post Author', 'Content', 'Reason', 'Reported By', 'Date', 'Status', 'Actions']} empty={!loading && reports.length === 0} loading={loading}>
          {reports.map(r => (
            <tr key={r.id} className="table-row">
              <td className="table-td text-gray-400 text-xs">#{r.id}</td>
              <td className="table-td font-medium text-gray-900">{r.postAuthorName ?? '—'}</td>
              <td className="table-td max-w-xs"><p className="text-xs text-gray-500 truncate">{r.postContent || '—'}</p></td>
              <td className="table-td"><span className="badge badge-red">{r.reason}</span></td>
              <td className="table-td text-gray-500 text-sm">{r.reporterName}</td>
              <td className="table-td text-gray-500 text-xs">{fmtDate(r.createdAt)}</td>
              <td className="table-td"><span className={clsx('badge', STATUS_BADGE[r.status] ?? 'badge-gray')}>{(r.status ?? 'PENDING').toLowerCase()}</span></td>
              <td className="table-td">
                {r.status === 'PENDING' && (
                  <div className="flex items-center gap-1">
                    <button title="Resolve" onClick={() => setConfirm({ msg: 'Resolve this report?', onConfirm: () => doAction(() => adminApi.resolveReport(token, r.id)) })} className="p-1.5 hover:bg-green-50 rounded text-green-600"><CheckCircle size={15} /></button>
                    <button title="Dismiss" onClick={() => setConfirm({ msg: 'Dismiss this report?', onConfirm: () => doAction(() => adminApi.dismissReport(token, r.id)) })} className="p-1.5 hover:bg-yellow-50 rounded text-yellow-600"><XCircle size={15} /></button>
                    {r.postId && <button title="Hide Post" onClick={() => setConfirm({ msg: 'Hide the reported post?', danger: true, onConfirm: () => doAction(async () => { await adminApi.hidePost(token, r.postId); await adminApi.resolveReport(token, r.id) }) })} className="p-1.5 hover:bg-red-50 rounded text-red-600"><Trash2 size={15} /></button>}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </Table>
      </div>
      {confirm && <ConfirmDialog message={confirm.msg} danger={confirm.danger} loading={actionLoading} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}
    </div>
  )
}
