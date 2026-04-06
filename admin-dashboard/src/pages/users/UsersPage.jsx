import { useState } from 'react'
import { Eye, Ban, RefreshCw, ShieldCheck, Trash2, MoreHorizontal } from 'lucide-react'
import { PageHeader, Table, SearchBar, Modal, ConfirmDialog } from '../../components/ui'
import { mockUsers } from '../../data/mockData'
import clsx from 'clsx'

const STATUS_BADGE = {
  active: 'badge-green', suspended: 'badge-yellow', banned: 'badge-red',
}
const VERIFY_BADGE = {
  adult: 'badge-purple', minor: 'badge-blue', none: 'badge-gray',
}

export default function UsersPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [verifyFilter, setVerifyFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)
  const [openMenuId, setOpenMenuId] = useState(null)

  const filtered = mockUsers.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) || u.id.includes(search)
    const matchStatus = statusFilter === 'all' || u.status === statusFilter
    const matchVerify = verifyFilter === 'all' || u.verified === verifyFilter
    return matchSearch && matchStatus && matchVerify
  })

  return (
    <div className="space-y-4">
      <PageHeader
        title="User Management"
        subtitle={`${filtered.length} users found`}
        actions={<button className="btn-primary text-sm">Export CSV</button>}
      />

      <div className="card p-4 flex flex-wrap items-center gap-3">
        <SearchBar value={search} onChange={v => setSearch(v)} placeholder="Search by name, email, ID..." />
        <select className="input w-36" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>
        <select className="input w-40" value={verifyFilter} onChange={e => setVerifyFilter(e.target.value)}>
          <option value="all">All Verification</option>
          <option value="adult">Adult Verified</option>
          <option value="minor">Minor Verified</option>
          <option value="none">Unverified</option>
        </select>
      </div>

      <div className="card">
        <Table headers={['User', 'Email', 'Role', 'Verified', 'Location', 'Status', 'Reports', 'Actions']} empty={filtered.length === 0}>
          {filtered.map(user => (
            <tr key={user.id} className="table-row">
              <td className="table-td">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-700 text-xs font-bold">{user.name[0]}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{user.name}</p>
                    <p className="text-xs text-gray-400">{user.id}</p>
                  </div>
                </div>
              </td>
              <td className="table-td text-gray-500">{user.email}</td>
              <td className="table-td"><span className="badge-purple badge capitalize">{user.role}</span></td>
              <td className="table-td"><span className={clsx('badge', VERIFY_BADGE[user.verified])}>{user.verified}</span></td>
              <td className="table-td text-gray-500">{user.location}</td>
              <td className="table-td"><span className={clsx('badge', STATUS_BADGE[user.status])}>{user.status}</span></td>
              <td className="table-td">
                {user.reports > 0 ? <span className="badge-red badge">{user.reports}</span> : <span className="text-gray-400">0</span>}
              </td>
              <td className="table-td">
                <div className="relative">
                  <button onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                    <MoreHorizontal size={16} />
                  </button>
                  {openMenuId === user.id && (
                    <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-gray-100 z-20 overflow-hidden">
                      {[
                        { icon: Eye, label: 'View Profile', action: () => { setSelectedUser(user); setOpenMenuId(null) } },
                        { icon: ShieldCheck, label: 'Verify Manually', action: () => { setConfirmAction({ label: `Manually verify ${user.name}?`, action: () => {} }); setOpenMenuId(null) } },
                        { icon: RefreshCw, label: 'Reset Password', action: () => { setConfirmAction({ label: `Send password reset to ${user.email}?`, action: () => {} }); setOpenMenuId(null) } },
                        { icon: Ban, label: user.status === 'suspended' ? 'Unsuspend' : 'Suspend', danger: true, action: () => { setConfirmAction({ label: `${user.status === 'suspended' ? 'Unsuspend' : 'Suspend'} ${user.name}?`, danger: true, action: () => {} }); setOpenMenuId(null) } },
                        { icon: Trash2, label: 'Ban User', danger: true, action: () => { setConfirmAction({ label: `Permanently ban ${user.name}?`, danger: true, action: () => {} }); setOpenMenuId(null) } },
                      ].map(({ icon: Icon, label, action, danger }) => (
                        <button key={label} onClick={action} className={clsx('w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors', danger ? 'text-red-600' : 'text-gray-700')}>
                          <Icon size={14} />{label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </div>

      {selectedUser && (
        <Modal title="User Profile" onClose={() => setSelectedUser(null)}>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-700 text-xl font-bold">{selectedUser.name[0]}</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{selectedUser.name}</p>
                <p className="text-sm text-gray-500">{selectedUser.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[['User ID', selectedUser.id], ['Role', selectedUser.role], ['Status', selectedUser.status], ['Verified', selectedUser.verified], ['Location', selectedUser.location], ['Joined', selectedUser.joinDate], ['Reports', String(selectedUser.reports)]].map(([k, v]) => (
                <div key={k} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-0.5">{k}</p>
                  <p className="font-medium text-gray-800 capitalize">{v}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <button className="btn-danger flex-1 text-sm">Suspend User</button>
              <button className="btn-secondary flex-1 text-sm">Reset Password</button>
            </div>
          </div>
        </Modal>
      )}

      {confirmAction && (
        <ConfirmDialog message={confirmAction.label} danger={confirmAction.danger} onConfirm={() => { confirmAction.action(); setConfirmAction(null) }} onCancel={() => setConfirmAction(null)} />
      )}
    </div>
  )
}
