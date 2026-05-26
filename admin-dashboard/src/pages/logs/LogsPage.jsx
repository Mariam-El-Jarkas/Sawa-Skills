import { useState, useEffect, useCallback, useRef } from 'react'
import { AlertTriangle, Info, AlertOctagon, RefreshCw, Download } from 'lucide-react'
import { PageHeader, Table, SearchBar, AlertBanner } from '../../components/ui'
import { adminApi } from '../../api/adminApi'
import { useAuthStore } from '../../store/authStore'
import clsx from 'clsx'

const getSeverity = (log) => { const t = (log.actionType ?? '').toLowerCase(); if (t === 'error') return 'error'; if (t === 'suspicious' || t === 'warning') return 'warning'; return 'info' }
const SEV = { info: { badge: 'badge-purple', icon: Info, row: '' }, warning: { badge: 'badge-yellow', icon: AlertTriangle, row: 'bg-yellow-50/50' }, error: { badge: 'badge-red', icon: AlertOctagon, row: 'bg-red-50/50' } }
const fmtDate = (iso) => iso ? new Date(iso).toLocaleString() : '—'

export default function LogsPage() {
  const { token } = useAuthStore()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const debounceRef = useRef(null)

  const load = useCallback(async (s, f) => {
    if (!token) return
    try { setLoading(true); setError(null); setLogs(await adminApi.getLogs(token, { search: s, severity: f }) || []) }
    catch (e) { setError(e.message) } finally { setLoading(false) }
  }, [token])

  useEffect(() => { if (token) load('', 'all') }, [token, load])

  const handleSearch = (v) => { setSearch(v); clearTimeout(debounceRef.current); debounceRef.current = setTimeout(() => load(v, filter), 300) }
  const handleExport = () => { const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `sawa-logs-${Date.now()}.json`; a.click(); URL.revokeObjectURL(url) }

  const infoCount = logs.filter(l => getSeverity(l) === 'info').length
  const warnCount = logs.filter(l => getSeverity(l) === 'warning').length
  const errCount  = logs.filter(l => getSeverity(l) === 'error').length

  return (
    <div className="space-y-4">
      <PageHeader title="System Logs" subtitle="Audit trail of admin actions and system events" />
      {error && <AlertBanner type="error" message={error} onRetry={() => load(search, filter)} />}
      <div className="grid grid-cols-3 gap-4">
        {[['Info Events', loading ? '…' : infoCount, 'text-primary-600'], ['Warnings', loading ? '…' : warnCount, 'text-yellow-600'], ['Errors', loading ? '…' : errCount, 'text-red-600']].map(([label, count, color]) => (
          <div key={label} className="card p-4 text-center"><p className={clsx('text-2xl font-bold', color)}>{count}</p><p className="text-sm text-gray-500 mt-1">{label}</p></div>
        ))}
      </div>
      <div className="card p-4 flex flex-wrap gap-3">
        <SearchBar value={search} onChange={handleSearch} placeholder="Search logs..." />
        <select className="input w-36" value={filter} onChange={e => { setFilter(e.target.value); load(search, e.target.value) }}>
          <option value="all">All Logs</option><option value="info">Info</option><option value="warning">Warning</option><option value="error">Error</option><option value="admin_action">Admin Actions</option>
        </select>
        <div className="ml-auto flex gap-2">
          <button className="btn-secondary text-sm" onClick={() => load(search, filter)}><RefreshCw size={14} className="inline mr-1" />Refresh</button>
          <button className="btn-secondary text-sm" onClick={handleExport}><Download size={14} className="inline mr-1" />Export</button>
        </div>
      </div>
      <div className="card">
        <Table headers={['Severity', 'Type', 'Action', 'User', 'IP', 'Timestamp']} empty={!loading && logs.length === 0} loading={loading}>
          {logs.map(log => {
            const sev = getSeverity(log); const s = SEV[sev]; const Icon = s.icon
            return (
              <tr key={log.id} className={clsx('table-row', s.row)}>
                <td className="table-td"><span className={clsx('badge flex items-center gap-1 w-fit', s.badge)}><Icon size={10} />{sev}</span></td>
                <td className="table-td"><span className="badge badge-gray capitalize">{(log.actionType ?? 'info').replace('_', ' ')}</span></td>
                <td className="table-td text-gray-800 max-w-xs"><p className="text-sm">{log.action}</p>{log.description && <p className="text-xs text-gray-400 truncate">{log.description}</p>}</td>
                <td className="table-td text-gray-500">{log.userName || 'System'}</td>
                <td className="table-td font-mono text-xs text-gray-500">{log.ipAddress || '—'}</td>
                <td className="table-td text-gray-500 text-xs whitespace-nowrap">{fmtDate(log.createdAt)}</td>
              </tr>
            )
          })}
        </Table>
      </div>
    </div>
  )
}
