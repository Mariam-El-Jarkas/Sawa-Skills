import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Eye, Ban, ShieldCheck, Trash2, MoreHorizontal, RefreshCw } from 'lucide-react'
import { PageHeader, Table, SearchBar, Modal, ConfirmDialog, AlertBanner } from '../../components/ui'
import { adminApi } from '../../api/adminApi'
import { useAuthStore } from '../../store/authStore'
import clsx from 'clsx'

const STATUS_BADGE = { ACTIVE: 'badge-green', SUSPENDED: 'badge-yellow', BANNED: 'badge-red' }
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString() : '—'

export default function UsersPage() {
  const { token } = useAuthStore()
  const [searchParams] = useSearchParams()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState(() => searchParams.get('search') || '')
  const [statusFilter, setStatusFilter] = useState('all')
  const [verifyFilter, setVerifyFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)
  const [openMenuId, setOpenMenuId] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const debounceRef = useRef(null)

  const load = useCallback(async (s, st, vf) => {
    if (!token) return
    try {
      setLoading(true); setError(null)
      const data = await adminApi.getUsers(token, { search: s, status: st === 'all' ? '' : st, verified: vf === 'all' ? '' : vf })
      setUsers(data || [])
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [token])

  useEffect(() => {
    if (token) load(searchParams.get('search') || '', 'all', 'all')
  }, [token, load])

  const handleSearch = (v) => {
    setSearch(v); clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => load(v, statusFilter, verifyFilter), 300)
  }
  const handleFilter = (st, vf) => { setStatusFilter(st); setVerifyFilter(vf); load(search, st, vf) }

  const doAction = async (fn) => {
    try { setActionLoading(true); await fn(); setConfirmAction(null); setOpenMenuId(null); await load(search, statusFilter, verifyFilter) }
    catch (e) { alert(`Failed: ${e.message}`) }
    finally { setActionLoading(false) }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="User Management" subtitle={`${users.length} users found`} actions={<button className="btn-secondary text-sm" onClick={() => load(search, statusFilter, verifyFilter)}><RefreshCw size={14} className="inline mr-1" />Refresh</button>} />
      {error && <AlertBanner type="error" message={error} onRetry={() => load(search, statusFilter, verifyFilter)} />}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <SearchBar value={search} onChange={handleSearch} placeholder="Search by name or email..." />
        <select className="input w-36" value={statusFilter} onChange={e => handleFilter(e.target.value, verifyFilter)}>
          <option value="all">All Status</option><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option><option value="BANNED">Banned</option>
        </select>
        <select className="input w-40" value={verifyFilter} onChange={e => handleFilter(statusFilter, e.target.value)}>
          <option value="all">All Verification</option><option value="true">Verified</option><option value="false">Unverified</option>
        </select>
      </div>
      <div className="card">
        <Table headers={['User', 'Email', 'Role', 'Verified', 'Location', 'Status', 'Reports', 'Actions']} empty={!loading && users.length === 0} loading={loading}>
          {users.map(user => (
            <tr key={user.id} className="table-row">
              <td className="table-td"><div className="flex items-center gap-2"><div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0"><span className="text-primary-700 text-xs font-bold">{user.name?.[0] ?? '?'}</span></div><div><p className="font-medium text-gray-900 text-sm">{user.name}</p><p className="text-xs text-gray-400">#{user.id}</p></div></div></td>
              <td className="table-td text-gray-500">{user.email}</td>
              <td className="table-td"><span className="badge badge-purple capitalize">{user.role ?? 'user'}</span></td>
              <td className="table-td">{user.verified ? <span className="badge badge-green">Verified</span> : <span className="badge badge-gray">None</span>}</td>
              <td className="table-td text-gray-500">{user.locationCity ?? '—'}</td>
              <td className="table-td"><span className={clsx('badge', STATUS_BADGE[user.accountStatus] ?? 'badge-gray')}>{(user.accountStatus ?? 'ACTIVE').toLowerCase()}</span></td>
              <td className="table-td">{user.reportCount > 0 ? <span className="badge badge-red">{user.reportCount}</span> : <span className="text-gray-400">0</span>}</td>
              <td className="table-td">
                <div className="relative">
                  <button onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)} className="p-1.5 hover:bg-gray-100 rounded-lg"><MoreHorizontal size={16} /></button>
                  {openMenuId === user.id && (
                    <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-gray-100 z-20 overflow-hidden">
                      {[
                        { icon: Eye, label: 'View Profile', action: () => { setSelectedUser(user); setOpenMenuId(null) } },
                        { icon: ShieldCheck, label: 'Verify Manually', action: () => setConfirmAction({ label: `Verify ${user.name}?`, onConfirm: () => doAction(() => adminApi.verifyUser(token, user.id)) }) },
                        user.accountStatus === 'BANNED'
                          ? { icon: RefreshCw, label: 'Unban', danger: false, action: () => setConfirmAction({ label: `Unban ${user.name}?`, onConfirm: () => doAction(() => adminApi.unbanUser(token, user.id)) }) }
                          : { icon: Ban, label: 'Suspend', danger: true, action: () => setConfirmAction({ label: `Suspend ${user.name}?`, danger: true, onConfirm: () => doAction(() => adminApi.suspendUser(token, user.id)) }) },
                        { icon: Ban, label: 'Ban User', danger: true, action: () => setConfirmAction({ label: `Ban ${user.name}? This will anonymize their account.`, danger: true, onConfirm: () => doAction(() => adminApi.banUser(token, user.id)) }) },
                        { icon: Trash2, label: 'Delete Account', danger: true, action: () => setConfirmAction({ label: `Permanently delete ${user.name}'s account? This cannot be undone.`, danger: true, onConfirm: () => doAction(() => adminApi.deleteUser(token, user.id)) }) },
                      ].map(({ icon: Icon, label, action, danger }) => (
                        <button key={label} onClick={action} className={clsx('w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors', danger ? 'text-red-600' : 'text-gray-700')}><Icon size={14} />{label}</button>
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
            <div className="flex items-center gap-3"><div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center"><span className="text-primary-700 text-xl font-bold">{selectedUser.name?.[0]}</span></div><div><p className="font-semibold text-gray-900">{selectedUser.name}</p><p className="text-sm text-gray-500">{selectedUser.email}</p></div></div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[['ID', `#${selectedUser.id}`], ['Role', selectedUser.role ?? 'user'], ['Status', selectedUser.accountStatus ?? 'ACTIVE'], ['Verified', selectedUser.verified ? 'Yes' : 'No'], ['Location', selectedUser.locationCity ?? '—'], ['Joined', fmtDate(selectedUser.createdAt)], ['Reports', String(selectedUser.reportCount ?? 0)]].map(([k, v]) => (
                <div key={k} className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-400 mb-0.5">{k}</p><p className="font-medium text-gray-800 capitalize">{v}</p></div>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <button className="btn-danger flex-1 text-sm" onClick={() => { setConfirmAction({ label: `Suspend ${selectedUser.name}?`, danger: true, onConfirm: () => doAction(() => adminApi.suspendUser(token, selectedUser.id)) }); setSelectedUser(null) }}>Suspend</button>
              <button className="btn-danger flex-1 text-sm" onClick={() => { setConfirmAction({ label: `Permanently delete ${selectedUser.name}'s account? This cannot be undone.`, danger: true, onConfirm: () => doAction(() => adminApi.deleteUser(token, selectedUser.id)) }); setSelectedUser(null) }}>Delete Account</button>
              <button className="btn-secondary flex-1 text-sm" onClick={() => setSelectedUser(null)}>Close</button>
            </div>
          </div>
        </Modal>
      )}
      {confirmAction && <ConfirmDialog message={confirmAction.label} danger={confirmAction.danger} loading={actionLoading} onConfirm={confirmAction.onConfirm} onCancel={() => setConfirmAction(null)} />}
    </div>
  )
}
