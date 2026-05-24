import clsx from 'clsx'

export function StatCard({ title, value, icon, color = 'bg-primary-50 text-primary-600', change, changeType }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{typeof value === 'number' ? value.toLocaleString() : value}</p>
          {change && <p className={clsx('text-xs mt-1 font-medium', changeType === 'up' ? 'text-green-600' : changeType === 'down' ? 'text-red-600' : 'text-gray-500')}>{change}</p>}
        </div>
        <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', color)}>{icon}</div>
      </div>
    </div>
  )
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h2 className="text-xl font-bold text-primary-700">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Table({ headers, children, empty, loading }) {
  return (
    <div className="overflow-x-auto">
      <div className="max-h-[500px] overflow-y-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
            <tr>{headers.map(h => <th key={h} className="table-th">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={headers.length} className="px-4 py-12 text-center text-gray-400 text-sm">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
                  Loading...
                </div>
              </td></tr>
            ) : empty ? (
              <tr><td colSpan={headers.length} className="px-4 py-12 text-center text-gray-400 text-sm">No data found</td></tr>
            ) : children}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export function AlertBanner({ type, message, onRetry }) {
  const styles = { error: 'bg-red-50 border-red-200 text-red-700', warning: 'bg-yellow-50 border-yellow-200 text-yellow-700', info: 'bg-blue-50 border-blue-200 text-blue-700' }
  return (
    <div className={clsx('border rounded-lg px-4 py-3 text-sm mb-4 flex items-center justify-between gap-4', styles[type])}>
      <span>{message}</span>
      {onRetry && <button onClick={onRetry} className="underline font-medium flex-shrink-0">Retry</button>}
    </div>
  )
}

export function SearchBar({ value, onChange, placeholder = 'Search...' }) {
  return <input className="input w-64" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />
}

export function ConfirmDialog({ message, onConfirm, onCancel, danger, loading }) {
  return (
    <Modal title="Confirm Action" onClose={onCancel}>
      <p className="text-gray-600 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button className="btn-secondary" onClick={onCancel} disabled={loading}>Cancel</button>
        <button className={danger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm} disabled={loading}>
          {loading ? 'Processing…' : 'Confirm'}
        </button>
      </div>
    </Modal>
  )
}
