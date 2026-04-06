import { useState } from 'react'
import { CheckCircle, XCircle, Ban, Trash2 } from 'lucide-react'
import { PageHeader, Table, SearchBar, ConfirmDialog } from '../../components/ui'
import { mockReports } from '../../data/mockData'
import clsx from 'clsx'

const STATUS_BADGE = { pending: 'badge-yellow', resolved: 'badge-green', dismissed: 'badge-gray' }
const REASON_BADGE = { Harassment: 'badge-red', Spam: 'badge-yellow', 'Fake Profile': 'badge-gray', 'Inappropriate Content': 'badge-red', Scam: 'badge-red' }

export default function ReportsPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [confirm, setConfirm] = useState(null)

  const filtered = mockReports.filter(r =>
    (filter === 'all' || r.status === filter) &&
    (r.reportedName.toLowerCase().includes(search.toLowerCase()) || r.reason.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-4">
      <PageHeader title="Reports Management" subtitle={`${filtered.filter(r => r.status === 'pending').length} pending review`} />
      <div className="card p-4 flex flex-wrap gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search reports..." />
        <select className="input w-36" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
      </div>
      <div className="card">
        <Table headers={['#', 'Type', 'Reported', 'Reason', 'Reported By', 'Date', 'Status', 'Actions']} empty={filtered.length === 0}>
          {filtered.map(r => (
            <tr key={r.id} className="table-row">
              <td className="table-td text-gray-400 text-xs">{r.id}</td>
              <td className="table-td"><span className={clsx('badge', r.type === 'user' ? 'badge-purple' : 'badge-blue')}>{r.type}</span></td>
              <td className="table-td font-medium text-gray-900">{r.reportedName}</td>
              <td className="table-td"><span className={clsx('badge', REASON_BADGE[r.reason] || 'badge-gray')}>{r.reason}</span></td>
              <td className="table-td text-gray-500">{r.reportedBy}</td>
              <td className="table-td text-gray-500 text-xs">{r.date}</td>
              <td className="table-td"><span className={clsx('badge', STATUS_BADGE[r.status])}>{r.status}</span></td>
              <td className="table-td">
                <div className="flex items-center gap-1">
                  <button title="Dismiss" onClick={() => setConfirm({ msg: 'Dismiss this report?', action: () => {} })} className="p-1.5 hover:bg-green-50 rounded text-green-600"><CheckCircle size={15} /></button>
                  <button title="Warn User" onClick={() => setConfirm({ msg: 'Send warning to user?', action: () => {}, danger: true })} className="p-1.5 hover:bg-yellow-50 rounded text-yellow-600"><XCircle size={15} /></button>
                  <button title="Suspend" onClick={() => setConfirm({ msg: 'Suspend this user?', action: () => {}, danger: true })} className="p-1.5 hover:bg-red-50 rounded text-red-600"><Ban size={15} /></button>
                  <button title="Delete Content" onClick={() => setConfirm({ msg: 'Delete the reported content?', action: () => {}, danger: true })} className="p-1.5 hover:bg-red-50 rounded text-red-600"><Trash2 size={15} /></button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </div>
      {confirm && <ConfirmDialog message={confirm.msg} danger={confirm.danger} onConfirm={() => { confirm.action(); setConfirm(null) }} onCancel={() => setConfirm(null)} />}
    </div>
  )
}
