import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Eye, ShieldCheck, Clock, Award, Mail } from 'lucide-react'
import { PageHeader, Table, Modal, ConfirmDialog } from '../../components/ui'
import { useAuthStore } from '../../store/authStore'
import clsx from 'clsx'

const STATUS_BADGE = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  PENDING_PARENT: 'bg-orange-100 text-orange-700',
  PENDING_ADMIN: 'bg-blue-100 text-blue-600',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
}

const BASE_URL = 'http://localhost:8080'

export default function VerificationPage() {
  const { token } = useAuthStore()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const [selected, setSelected] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [tab, setTab] = useState('ADULT')

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const res = await fetch(`${BASE_URL}/api/verification/admin/requests`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setRequests(data)
      } else {
        setFetchError(`Error ${res.status}: Failed to fetch`)
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error)
      setFetchError('Failed to connect to backend server')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await fetch(`${BASE_URL}/api/verification/admin/requests/${id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ status })
      })
      if (res.ok) {
        fetchRequests()
        setConfirm(null)
        setSelected(null)
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const filtered = requests.filter(v => v.type === tab)
  const adultPending = requests.filter(v => v.type === 'ADULT' && v.status === 'PENDING').length
  const minorPending = requests.filter(v => v.type === 'MINOR' && (v.status === 'PENDING_PARENT' || v.status === 'PENDING_ADMIN')).length
  const volunteerPending = requests.filter(v => v.type === 'VOLUNTEER' && v.status === 'PENDING').length

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Verification Management" 
        subtitle="Review and process user identity & volunteer applications" 
      />

      {/* Modern Tab Switcher */}
      <div className="flex p-1 bg-gray-100/50 rounded-xl w-fit">
        {[
          { id: 'ADULT', label: 'Adults', icon: ShieldCheck, count: adultPending },
          { id: 'MINOR', label: 'Minors', icon: Clock, count: minorPending },
          { id: 'VOLUNTEER', label: 'Volunteers', icon: Award, count: volunteerPending },
        ].map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={clsx(
              'flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all',
              tab === id
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <Icon size={16} />
            {label}
            {count > 0 && (
              <span className={clsx(
                'ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                tab === id ? 'bg-primary-100 text-primary-700' : 'bg-red-100 text-red-600'
              )}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {fetchError && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex justify-between items-center">
          <span>{fetchError}</span>
          <button onClick={fetchRequests} className="underline font-bold">Retry</button>
        </div>
      )}

      <div className="card overflow-hidden">
        <Table 
          headers={['User', 'Full Name', 'Date Submitted', 'Status', 'Actions']}
          empty={filtered.length === 0}
        >
          {filtered.map(req => (
            <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-xs">
                    {req.user?.name?.[0] || '?'}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{req.user?.name}</div>
                    <div className="text-xs text-gray-500">{req.user?.email}</div>
                  </div>
                </div>
              </td>
              <td className="px-5 py-4 font-medium text-gray-700">{req.fullName || '—'}</td>
              <td className="px-5 py-4 text-sm text-gray-500">{formatDate(req.submittedAt)}</td>
              <td className="px-5 py-4">
                <span className={clsx('px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider', STATUS_BADGE[req.status])}>
                  {req.status === 'PENDING_PARENT' ? 'Waiting for Parent' : 
                   req.status === 'PENDING_ADMIN' ? 'Parent Approved' : 
                   req.status}
                </span>
              </td>
              <td className="px-5 py-4 text-right">
                <div className="flex justify-end gap-2">
                  <button onClick={() => setSelected(req)} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all">
                    <Eye size={18} />
                  </button>
                  {['PENDING', 'PENDING_ADMIN'].includes(req.status) && (
                    <>
                      <button onClick={() => setConfirm({ id: req.id, status: 'APPROVED' })} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all">
                        <CheckCircle size={18} />
                      </button>
                      <button onClick={() => setConfirm({ id: req.id, status: 'REJECTED' })} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                        <XCircle size={18} />
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </div>

      {/* Details Modal */}
      {selected && (
        <Modal 
          title={`${tab.charAt(0) + tab.slice(1).toLowerCase()} Verification: ${selected.user?.name}`} 
          onClose={() => setSelected(null)}
        >
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-xl space-y-3">
              <div className="flex justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase">Submission Detail</span>
                <span className={clsx('px-2 py-0.5 rounded text-[10px] font-bold uppercase', STATUS_BADGE[selected.status])}>{selected.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Legal Name</label>
                  <p className="font-semibold text-gray-800">{selected.fullName || '—'}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Birth Date</label>
                  <p className="font-semibold text-gray-800">{selected.dob || '—'}</p>
                </div>
              </div>
              {selected.parentEmail && (
                <div className="pt-2 border-t flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-primary-500" />
                    <span className="text-xs text-gray-600">Guardian: <span className="font-bold">{selected.parentEmail}</span></span>
                  </div>
                  {selected.parentDecisionAt && (
                    <div className="flex items-center gap-2 px-2 py-1 bg-green-50 rounded text-[10px] text-green-700 font-bold self-start">
                      <CheckCircle size={10} />
                      Parent Approved at {new Date(selected.parentDecisionAt).toLocaleString()}
                    </div>
                  )}
                  {selected.status === 'PENDING_PARENT' && (
                    <div className="flex items-center gap-2 px-2 py-1 bg-orange-50 rounded text-[10px] text-orange-700 font-bold self-start animate-pulse">
                      <Clock size={10} />
                      Waiting for parental consent...
                    </div>
                  )}
                </div>
              )}
            </div>

            {selected.type === 'VOLUNTEER' && (
              <div className="space-y-4">
                {[
                  { lbl: 'Motivation', val: selected.why },
                  { lbl: 'Experience', val: selected.experience },
                  { lbl: 'Skills to share', val: selected.skillsToShare }
                ].map(f => (
                  <div key={f.lbl} className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">{f.lbl}</label>
                    <p className="text-sm text-gray-600 bg-white border border-gray-100 p-3 rounded-lg leading-relaxed">{f.val || '—'}</p>
                  </div>
                ))}
              </div>
            )}

            {selected.type === 'ADULT' && (
              <div className="grid grid-cols-2 gap-4">
                {[
                  { lbl: 'Front ID', path: selected.idFrontImage },
                  { lbl: 'Back ID', path: selected.idBackImage },
                  { lbl: 'Selfie', path: selected.selfieImage }
                ].map((img, i) => (
                  <div key={i} className={clsx("space-y-2", i === 2 && "col-span-2")}>
                    <label className="text-[10px] font-bold text-gray-400 uppercase">{img.lbl}</label>
                    <div className="aspect-[4/3] rounded-xl overflow-hidden border-2 border-gray-100 bg-gray-50">
                      {img.path ? (
                        <img src={`${BASE_URL}${img.path}`} alt={img.lbl} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 font-medium">No image uploaded</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {['PENDING', 'PENDING_ADMIN'].includes(selected.status) && (
              <div className="flex gap-4 pt-4 border-t">
                <button 
                  onClick={() => setConfirm({ id: selected.id, status: 'APPROVED' })}
                  className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-colors shadow-sm"
                >
                  Approve Application
                </button>
                <button 
                  onClick={() => setConfirm({ id: selected.id, status: 'REJECTED' })}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors shadow-sm"
                >
                  Reject Application
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Confirmation Dialog */}
      {confirm && (
        <ConfirmDialog
          message={`Are you sure you want to set this application as ${confirm.status.toLowerCase()}?`}
          danger={confirm.status === 'REJECTED'}
          onConfirm={() => handleUpdateStatus(confirm.id, confirm.status)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  )
}
