import { useState } from 'react'
import { CheckCircle, XCircle, Eye, ShieldCheck, Users } from 'lucide-react'
import { PageHeader, Table, Modal, ConfirmDialog } from '../../components/ui'
import { mockVerifications } from '../../data/mockData'
import clsx from 'clsx'

const STATUS_BADGE = {
  pending: 'badge-yellow',
  approved: 'badge-green',
  rejected: 'badge-red',
}

export default function VerificationPage() {
  const [selected, setSelected] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [tab, setTab] = useState('adult')
  const filtered = mockVerifications.filter(v => v.type === tab)

  const adultPending = mockVerifications.filter(v => v.type === 'adult' && v.status === 'pending').length
  const minorPending = mockVerifications.filter(v => v.type === 'minor' && v.status === 'pending').length

  return (
    <div className="space-y-4">
      <PageHeader title="Verification Requests" subtitle="Review and approve user identity verification submissions" />

      {/* Tab Switcher */}
      <div className="flex gap-3">
        <button
          onClick={() => setTab('adult')}
          className={clsx(
            'flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-medium transition-all border',
            tab === 'adult'
              ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          )}
        >
          <ShieldCheck size={16} />
          Adult Verification
          {adultPending > 0 && (
            <span className={clsx('px-1.5 py-0.5 rounded-full text-xs font-semibold', tab === 'adult' ? 'bg-white/25 text-white' : 'bg-red-100 text-red-600')}>
              {adultPending}
            </span>
          )}
        </button>

        <button
          onClick={() => setTab('minor')}
          className={clsx(
            'flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-medium transition-all border',
            tab === 'minor'
              ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          )}
        >
          <Users size={16} />
          Minor Verification
          {minorPending > 0 && (
            <span className={clsx('px-1.5 py-0.5 rounded-full text-xs font-semibold', tab === 'minor' ? 'bg-white/25 text-white' : 'bg-red-100 text-red-600')}>
              {minorPending}
            </span>
          )}
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending', value: filtered.filter(v => v.status === 'pending').length, color: 'text-yellow-600' },
          { label: 'Approved', value: filtered.filter(v => v.status === 'approved').length, color: 'text-green-600' },
          { label: 'Rejected', value: filtered.filter(v => v.status === 'rejected').length, color: 'text-red-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4 text-center">
            <p className={clsx('text-2xl font-bold', color)}>{value}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <Table
          headers={
            tab === 'adult'
              ? ['User', 'Email', 'Submitted', 'Documents', 'Status', 'Actions']
              : ['User', 'Email', 'Parent Email', 'Requested At', 'Status', 'Actions']
          }
          empty={filtered.length === 0}
        >
          {filtered.map(v => (
            <tr key={v.id} className="table-row">
              <td className="table-td">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-700 text-xs font-bold">{v.name[0]}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{v.name}</p>
                    <p className="text-xs text-gray-400">{v.userId}</p>
                  </div>
                </div>
              </td>
              <td className="table-td text-gray-500">{v.email}</td>

              {tab === 'adult'
                ? <td className="table-td text-gray-500 text-xs">{v.submittedAt}</td>
                : <td className="table-td text-gray-500 text-sm">{v.parentEmail || '—'}</td>
              }

              {tab === 'adult'
                ? <td className="table-td">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg font-medium">
                      {v.documents?.length || 0} files
                    </span>
                  </td>
                : <td className="table-td text-gray-500 text-xs">{v.requestedAt || '—'}</td>
              }

              <td className="table-td">
                <span className={clsx('badge', STATUS_BADGE[v.status])}>{v.status}</span>
              </td>

              <td className="table-td">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSelected(v)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
                    title="View details"
                  >
                    <Eye size={15} />
                  </button>
                  {v.status === 'pending' && (
                    <>
                      <button
                        onClick={() => setConfirm({ msg: `Approve verification for ${v.name}?`, danger: false, action: () => {} })}
                        className="p-1.5 hover:bg-green-50 rounded-lg text-green-600"
                        title="Approve"
                      >
                        <CheckCircle size={15} />
                      </button>
                      <button
                        onClick={() => setConfirm({ msg: `Reject verification for ${v.name}?`, danger: true, action: () => {} })}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-red-600"
                        title="Reject"
                      >
                        <XCircle size={15} />
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </div>

      {/* Detail Modal */}
      {selected && (
        <Modal title="Verification Details" onClose={() => setSelected(null)}>
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-700 text-lg font-bold">{selected.name[0]}</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{selected.name}</p>
                <p className="text-sm text-gray-500">{selected.email}</p>
              </div>
              <span className={clsx('badge ml-auto', STATUS_BADGE[selected.status])}>{selected.status}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['User ID', selected.userId],
                ['Type', selected.type === 'adult' ? 'Adult (18+)' : 'Minor (Under 18)'],
                ['Submitted', selected.submittedAt],
                ['Status', selected.status],
              ].map(([k, v]) => (
                <div key={k} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-0.5">{k}</p>
                  <p className="font-medium text-gray-800 capitalize">{v}</p>
                </div>
              ))}
            </div>

            {selected.type === 'adult' && selected.documents && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Submitted Documents</p>
                <div className="flex gap-2 flex-wrap">
                  {selected.documents.map(doc => (
                    <div key={doc} className="flex items-center gap-1.5 bg-primary-50 border border-primary-200 rounded-lg px-3 py-2 text-xs text-primary-700 font-medium">
                      <ShieldCheck size={12} />
                      {doc}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selected.type === 'minor' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Users size={15} className="text-blue-600" />
                  <p className="text-sm font-medium text-blue-800">Parental Approval Required</p>
                </div>
                <p className="text-sm text-blue-700">
                  Approval email sent to: <strong>{selected.parentEmail}</strong>
                </p>
                <p className="text-xs text-blue-500 mt-1">Waiting for parent/guardian to confirm.</p>
              </div>
            )}

            {selected.status === 'pending' && (
              <div className="flex gap-2 pt-2">
                <button className="btn-primary flex-1 text-sm" onClick={() => setSelected(null)}>
                  Approve
                </button>
                <button className="btn-danger flex-1 text-sm" onClick={() => setSelected(null)}>
                  Reject
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {confirm && (
        <ConfirmDialog
          message={confirm.msg}
          danger={confirm.danger}
          onConfirm={() => { confirm.action(); setConfirm(null) }}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  )
}
