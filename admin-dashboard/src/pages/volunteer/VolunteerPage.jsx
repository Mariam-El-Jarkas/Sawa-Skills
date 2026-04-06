import { useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import { PageHeader, Table, ConfirmDialog } from '../../components/ui'
import { mockVolunteer } from '../../data/mockData'
import clsx from 'clsx'

export default function VolunteerPage() {
  const [confirm, setConfirm] = useState(null)

  return (
    <div className="space-y-4">
      <PageHeader title="Volunteer System" subtitle="Review and approve volunteer sessions" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Sessions', value: mockVolunteer.length },
          { label: 'Approved', value: mockVolunteer.filter(v => v.status === 'approved').length },
          { label: 'Pending Review', value: mockVolunteer.filter(v => v.status === 'pending').length },
          { label: 'Total Spots', value: mockVolunteer.reduce((a, v) => a + v.maxParticipants, 0) },
        ].map(({ label, value }) => (
          <div key={label} className="card p-4 text-center">
            <p className="text-2xl font-bold text-primary-600">{value}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <Table headers={['Session', 'Organizer', 'Location', 'Date', 'Spots', 'Status', 'Actions']} empty={mockVolunteer.length === 0}>
          {mockVolunteer.map(v => (
            <tr key={v.id} className="table-row">
              <td className="table-td">
                <p className="font-medium text-gray-900 text-sm">{v.title}</p>
                <p className="text-xs text-gray-400">{v.id}</p>
              </td>
              <td className="table-td text-gray-600">{v.organizer}</td>
              <td className="table-td text-gray-500">{v.location}</td>
              <td className="table-td text-gray-500 text-xs">{v.date}</td>
              <td className="table-td">
                <div className="text-xs">
                  <span className="font-semibold text-gray-800">{v.participants}</span>
                  <span className="text-gray-400">/{v.maxParticipants}</span>
                </div>
                <div className="w-16 h-1 bg-gray-100 rounded mt-1">
                  <div className="h-full bg-primary-500 rounded" style={{ width: `${(v.participants / v.maxParticipants) * 100}%` }} />
                </div>
              </td>
              <td className="table-td">
                <span className={clsx('badge', v.status === 'approved' ? 'badge-green' : 'badge-yellow')}>
                  {v.status}
                </span>
              </td>
              <td className="table-td">
                <div className="flex gap-1">
                  {v.status === 'pending' && (
                    <>
                      <button onClick={() => setConfirm({ msg: `Approve "${v.title}"?`, action: () => {} })} className="p-1.5 hover:bg-green-50 rounded text-green-600" title="Approve">
                        <CheckCircle size={15} />
                      </button>
                      <button onClick={() => setConfirm({ msg: `Reject "${v.title}"?`, action: () => {}, danger: true })} className="p-1.5 hover:bg-red-50 rounded text-red-600" title="Reject">
                        <XCircle size={15} />
                      </button>
                    </>
                  )}
                  {v.status === 'approved' && <span className="text-xs text-green-600 font-medium px-2">Live ✓</span>}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </div>

      {confirm && (
        <ConfirmDialog message={confirm.msg} danger={confirm.danger} onConfirm={() => { confirm.action(); setConfirm(null) }} onCancel={() => setConfirm(null)} />
      )}
    </div>
  )
}
