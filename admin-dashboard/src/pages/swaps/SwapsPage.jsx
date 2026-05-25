import { useState, useEffect, useCallback, useRef } from 'react'
import { XCircle, RefreshCw } from 'lucide-react'
import { PageHeader, Table, SearchBar, ConfirmDialog, AlertBanner } from '../../components/ui'
import { adminApi } from '../../api/adminApi'
import { useAuthStore } from '../../store/authStore'
import clsx from 'clsx'

const STATUS_BADGE = { ACTIVE: 'badge-purple', COMPLETED: 'badge-green', PENDING: 'badge-yellow', REJECTED: 'badge-red', PENDING_PARENT_APPROVAL: 'badge-yellow' }
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString() : '—'

export default function SwapsPage() {
  const { token } = useAuthStore()
  const [swaps, setSwaps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [confirm, setConfirm] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const debounceRef = useRef(null)

  const load = useCallback(async (s, f) => {
    if (!token) return
    try { setLoading(true); setError(null); setSwaps(await adminApi.getSwaps(token, { search: s, status: f }) || []) }
    catch (e) { setError(e.message) } finally { setLoading(false) }
  }, [token])

  useEffect(() => { if (token) load('', 'all') }, [token, load])

  const handleSearch = (v) => { setSearch(v); clearTimeout(debounceRef.current); debounceRef.current = setTimeout(() => load(v, filter), 300) }
  const doAction = async (fn) => { try { setActionLoading(true); await fn(); setConfirm(null); await load(search, filter) } catch (e) { alert(`Failed: ${e.message}`) } finally { setActionLoading(false) } }

  const counts = { ACTIVE: 0, COMPLETED: 0, PENDING: 0, REJECTED: 0 }
  swaps.forEach(s => { if (counts[s.status] !== undefined) counts[s.status]++ })

  return (
    <div className="space-y-4">
      <PageHeader title="Skill Exchanges" subtitle="Monitor ongoing and completed skill swaps" actions={<button className="btn-secondary text-sm" onClick={() => load(search, filter)}><RefreshCw size={14} className="inline mr-1" />Refresh</button>} />
      {error && <AlertBanner type="error" message={error} onRetry={() => load(search, filter)} />}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[['Active', counts.ACTIVE, 'text-primary-600'], ['Completed', counts.COMPLETED, 'text-green-600'], ['Pending', counts.PENDING, 'text-yellow-600'], ['Rejected', counts.REJECTED, 'text-red-600']].map(([label, count, color]) => (
          <div key={label} className="card p-4 text-center"><p className={clsx('text-2xl font-bold', color)}>{loading ? '…' : count}</p><p className="text-sm text-gray-500 mt-1">{label}</p></div>
        ))}
      </div>
      <div className="card p-4 flex flex-wrap gap-3">
        <SearchBar value={search} onChange={handleSearch} placeholder="Search by user name..." />
        <select className="input w-36" value={filter} onChange={e => { setFilter(e.target.value); load(search, e.target.value) }}>
          <option value="all">All Status</option><option value="ACTIVE">Active</option><option value="COMPLETED">Completed</option><option value="PENDING">Pending</option><option value="REJECTED">Rejected</option>
        </select>
      </div>
      <div className="card">
        <Table headers={['ID', 'Requester', 'Receiver', 'Skills', 'Status', 'Date', 'Actions']} empty={!loading && swaps.length === 0} loading={loading}>
          {swaps.map(swap => (
            <tr key={swap.id} className="table-row">
              <td className="table-td text-xs text-gray-400">#{swap.id}</td>
              <td className="table-td"><p className="font-medium text-gray-800 text-sm">{swap.requesterName}</p><p className="text-xs text-gray-400">{swap.requesterEmail}</p></td>
              <td className="table-td"><p className="font-medium text-gray-800 text-sm">{swap.receiverName}</p><p className="text-xs text-gray-400">{swap.receiverEmail}</p></td>
              <td className="table-td"><div className="text-xs space-y-1"><span className="badge badge-purple">{swap.offeredSkill || '—'}</span><span className="text-gray-400 mx-1">⇄</span><span className="badge badge-purple">{swap.wantedSkill || '—'}</span></div></td>
              <td className="table-td"><span className={clsx('badge', STATUS_BADGE[swap.status] ?? 'badge-gray')}>{(swap.status ?? '').toLowerCase()}</span></td>
              <td className="table-td text-xs text-gray-500">{fmtDate(swap.createdAt)}</td>
              <td className="table-td">{!['COMPLETED', 'REJECTED'].includes(swap.status) && <button onClick={() => setConfirm({ msg: `Cancel swap #${swap.id}?`, danger: true, onConfirm: () => doAction(() => adminApi.cancelSwap(token, swap.id)) })} className="p-1.5 hover:bg-red-50 rounded text-red-600" title="Cancel"><XCircle size={15} /></button>}</td>
            </tr>
          ))}
        </Table>
      </div>
      {confirm && <ConfirmDialog message={confirm.msg} danger={confirm.danger} loading={actionLoading} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}
    </div>
  )
}
