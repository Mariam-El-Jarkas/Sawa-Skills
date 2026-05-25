import { useState } from 'react'
import { Plus, Trash2, ShieldCheck } from 'lucide-react'
import { PageHeader, Table, Modal, ConfirmDialog } from '../../components/ui'
import { mockAdmins } from '../../data/mockData'
import clsx from 'clsx'

const ROLE_BADGE = {
  super_admin: 'badge-purple',
  moderator: 'badge-purple',
  support: 'badge-gray',
}

export default function AccountsPage() {
  const [showAdd, setShowAdd] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', role: 'moderator', password: '' })

  return (
    <div className="space-y-4">
      <PageHeader
        title="Admin Accounts"
        subtitle="Manage administrator access"
        actions={
          <button className="btn-primary text-sm flex items-center gap-2" onClick={() => setShowAdd(true)}>
            <Plus size={16} /> Add Admin
          </button>
        }
      />

      <div className="card">
        <Table headers={['Admin', 'Email', 'Role', 'Last Login', 'Status', 'Actions']} empty={mockAdmins.length === 0}>
          {mockAdmins.map(admin => (
            <tr key={admin.id} className="table-row">
              <td className="table-td">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">{admin.name[0]}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{admin.name}</p>
                    <p className="text-xs text-gray-400">{admin.id}</p>
                  </div>
                </div>
              </td>
              <td className="table-td text-gray-500">{admin.email}</td>
              <td className="table-td">
                <span className={clsx('badge', ROLE_BADGE[admin.role])}>
                  {admin.role.replace('_', ' ')}
                </span>
              </td>
              <td className="table-td text-gray-500 text-xs">{admin.lastLogin}</td>
              <td className="table-td">
                <span className="badge-green badge">{admin.status}</span>
              </td>
              <td className="table-td">
                <div className="flex gap-1">
                  <button title="Reset Password" className="p-1.5 hover:bg-primary-50 rounded text-primary-600">
                    <ShieldCheck size={15} />
                  </button>
                  {admin.role !== 'super_admin' && (
                    <button
                      title="Remove Admin"
                      onClick={() => setConfirm({ msg: `Remove admin access for ${admin.name}?`, action: () => {}, danger: true })}
                      className="p-1.5 hover:bg-red-50 rounded text-red-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </div>

      {showAdd && (
        <Modal title="Add Admin Account" onClose={() => setShowAdd(false)}>
          <div className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input className="input" placeholder="e.g. Content Moderator" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Email Address</label>
              <input className="input" type="email" placeholder="admin@sawa.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <label className="label">Role</label>
              <select className="input" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                <option value="super_admin">Super Admin</option>
                <option value="moderator">Moderator</option>
                <option value="support">Support</option>
              </select>
            </div>
            <div>
              <label className="label">Temporary Password</label>
              <input className="input" type="password" placeholder="Min 8 characters" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
            </div>
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 text-sm text-primary-700">
              ℹ️ The new admin will be prompted to change their password on first login.
            </div>
            <div className="flex gap-2 pt-1">
              <button className="btn-secondary flex-1" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn-primary flex-1" onClick={() => setShowAdd(false)}>Create Account</button>
            </div>
          </div>
        </Modal>
      )}

      {confirm && (
        <ConfirmDialog message={confirm.msg} danger={confirm.danger} onConfirm={() => { confirm.action(); setConfirm(null) }} onCancel={() => setConfirm(null)} />
      )}
    </div>
  )
}
