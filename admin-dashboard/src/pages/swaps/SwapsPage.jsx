import { useState } from 'react'
import { MessageCircle, XCircle, Star } from 'lucide-react'
import { PageHeader, Table, SearchBar, ConfirmDialog, Modal } from '../../components/ui'
import { mockSwaps } from '../../data/mockData'
import clsx from 'clsx'

const STATUS_STYLES = {
  active: 'badge-blue', completed: 'badge-green', pending: 'badge-yellow', disputed: 'badge-red',
}

const mockReviews = [
  { swapId: 'SW002', author: 'Maya Khalil', target: 'Omar Tabbara', rating: 4.8, text: 'Amazing photography session, very professional and patient teacher!', date: '2026-03-10' },
  { swapId: 'SW002', author: 'Omar Tabbara', target: 'Maya Khalil', rating: 4.5, text: 'Great Arabic tutor, clear explanations. Would swap again!', date: '2026-03-10' },
]

export default function SwapsPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [confirm, setConfirm] = useState(null)
  const [reviewsModal, setReviewsModal] = useState(null)
  const swapReviews = reviewsModal ? mockReviews.filter(r => r.swapId === reviewsModal) : []

  const filtered = mockSwaps.filter(s =>
    (filter === 'all' || s.status === filter) &&
    (s.user1.toLowerCase().includes(search.toLowerCase()) || s.user2.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-4">
      <PageHeader title="Skill Exchanges" subtitle="Monitor ongoing and completed skill swaps between users" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Active', count: mockSwaps.filter(s => s.status === 'active').length, color: 'text-blue-600' },
          { label: 'Completed', count: mockSwaps.filter(s => s.status === 'completed').length, color: 'text-green-600' },
          { label: 'Pending', count: mockSwaps.filter(s => s.status === 'pending').length, color: 'text-yellow-600' },
          { label: 'Disputed', count: mockSwaps.filter(s => s.status === 'disputed').length, color: 'text-red-600' },
        ].map(({ label, count, color }) => (
          <div key={label} className="card p-4 text-center">
            <p className={clsx('text-2xl font-bold', color)}>{count}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <SearchBar value={search} onChange={v => setSearch(v)} placeholder="Search by user name..." />
        <select className="input w-36" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="disputed">Disputed</option>
        </select>
      </div>

      <div className="card">
        <Table headers={['Swap ID', 'User 1', 'User 2', 'Skills', 'Progress', 'Ratings', 'Status', 'Reports', 'Actions']} empty={filtered.length === 0}>
          {filtered.map(swap => (
            <tr key={swap.id} className="table-row">
              <td className="table-td text-xs text-gray-400">{swap.id}</td>
              <td className="table-td font-medium text-gray-800">{swap.user1}</td>
              <td className="table-td font-medium text-gray-800">{swap.user2}</td>
              <td className="table-td">
                <div className="text-xs space-y-1">
                  <span className="badge-purple badge">{swap.skill1}</span>
                  <span className="text-gray-400 mx-1">⇄</span>
                  <span className="badge-blue badge">{swap.skill2}</span>
                </div>
              </td>
              <td className="table-td">
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-600 rounded-full" style={{ width: `${swap.progress}%` }} />
                  </div>
                  <span className="text-xs text-gray-500">{swap.progress}%</span>
                </div>
              </td>
              <td className="table-td text-xs">
                {swap.rating1 || swap.rating2 ? (
                  <div className="space-y-0.5">
                    {swap.rating1 && <div className="flex items-center gap-1"><Star size={10} className="text-yellow-400 fill-yellow-400" />{swap.rating1}</div>}
                    {swap.rating2 && <div className="flex items-center gap-1"><Star size={10} className="text-yellow-400 fill-yellow-400" />{swap.rating2}</div>}
                  </div>
                ) : <span className="text-gray-400">—</span>}
              </td>
              <td className="table-td"><span className={clsx('badge', STATUS_STYLES[swap.status])}>{swap.status}</span></td>
              <td className="table-td">{swap.reports > 0 ? <span className="badge-red badge">{swap.reports}</span> : <span className="text-gray-400">0</span>}</td>
              <td className="table-td">
                <div className="flex items-center gap-1">
                  {swap.status === 'completed' && mockReviews.some(r => r.swapId === swap.id) && (
                    <button onClick={() => setReviewsModal(swap.id)} className="px-2 py-1 text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors flex items-center gap-1">
                      <Star size={11} /> Reviews
                    </button>
                  )}
                  <button className="p-1.5 hover:bg-blue-50 rounded text-blue-600" title="Message users"><MessageCircle size={15} /></button>
                  {swap.status === 'disputed' && (
                    <button onClick={() => setConfirm({ msg: `Cancel swap ${swap.id}?`, action: () => {}, danger: true })} className="p-1.5 hover:bg-red-50 rounded text-red-600"><XCircle size={15} /></button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </div>

      {reviewsModal && (
        <Modal title="User Reviews" onClose={() => setReviewsModal(null)}>
          <div className="space-y-4">
            {swapReviews.map((r, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-semibold text-gray-900 text-sm">{r.author}</span>
                    <span className="text-gray-400 text-xs mx-2">→</span>
                    <span className="text-gray-600 text-sm">{r.target}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star size={14} className="text-yellow-400 fill-yellow-400" />
                    <span className="font-bold text-gray-800 text-sm">{r.rating}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-700 italic">"{r.text}"</p>
                <p className="text-xs text-gray-400 mt-2">{r.date}</p>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {confirm && <ConfirmDialog message={confirm.msg} danger={confirm.danger} onConfirm={() => { confirm.action(); setConfirm(null) }} onCancel={() => setConfirm(null)} />}
    </div>
  )
}
