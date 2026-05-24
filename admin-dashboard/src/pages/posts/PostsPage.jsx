import { useState, useEffect, useCallback, useRef } from 'react'
import { Eye, EyeOff, Trash2, AlertTriangle, RefreshCw } from 'lucide-react'
import { PageHeader, Table, SearchBar, ConfirmDialog, AlertBanner } from '../../components/ui'
import { adminApi } from '../../api/adminApi'
import { useAuthStore } from '../../store/authStore'
import clsx from 'clsx'

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString() : '—'

export default function PostsPage() {
  const { token } = useAuthStore()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [confirm, setConfirm] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const debounceRef = useRef(null)

  const load = useCallback(async (s, f) => {
    if (!token) return
    try { setLoading(true); setError(null); setPosts(await adminApi.getPosts(token, { search: s, status: f }) || []) }
    catch (e) { setError(e.message) } finally { setLoading(false) }
  }, [token])

  useEffect(() => { if (token) load('', 'all') }, [token, load])

  const handleSearch = (v) => { setSearch(v); clearTimeout(debounceRef.current); debounceRef.current = setTimeout(() => load(v, filter), 300) }
  const handleFilter = (f) => { setFilter(f); load(search, f) }
  const doAction = async (fn) => { try { setActionLoading(true); await fn(); setConfirm(null); await load(search, filter) } catch (e) { alert(`Failed: ${e.message}`) } finally { setActionLoading(false) } }

  return (
    <div className="space-y-4">
      <PageHeader title="Posts & Comments" subtitle="Moderate community content" actions={<button className="btn-secondary text-sm" onClick={() => load(search, filter)}><RefreshCw size={14} className="inline mr-1" />Refresh</button>} />
      {error && <AlertBanner type="error" message={error} onRetry={() => load(search, filter)} />}
      <div className="card p-4 flex flex-wrap gap-3">
        <SearchBar value={search} onChange={handleSearch} placeholder="Search posts or authors..." />
        <select className="input w-36" value={filter} onChange={e => handleFilter(e.target.value)}>
          <option value="all">All Posts</option><option value="visible">Visible</option><option value="hidden">Hidden</option><option value="reported">Reported</option>
        </select>
      </div>
      <div className="card">
        <Table headers={['ID', 'Author', 'Content Preview', 'Likes', 'Comments', 'Reports', 'Status', 'Actions']} empty={!loading && posts.length === 0} loading={loading}>
          {posts.map(post => (
            <tr key={post.id} className="table-row">
              <td className="table-td text-xs text-gray-400">#{post.id}</td>
              <td className="table-td"><div className="flex items-center gap-2"><div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0"><span className="text-primary-700 text-xs font-bold">{post.authorName?.[0] ?? '?'}</span></div><div><span className="text-sm font-medium text-gray-800 block">{post.authorName}</span><span className="text-xs text-gray-400">{fmtDate(post.createdAt)}</span></div></div></td>
              <td className="table-td max-w-xs"><p className="text-sm text-gray-600 truncate">{post.content || '(no text)'}</p></td>
              <td className="table-td text-gray-500">♥ {post.likesCount ?? 0}</td>
              <td className="table-td text-gray-500">💬 {post.commentsCount ?? 0}</td>
              <td className="table-td">{(post.reportCount ?? 0) > 0 ? <span className="badge badge-red flex items-center gap-1"><AlertTriangle size={10} />{post.reportCount}</span> : <span className="text-gray-400 text-sm">0</span>}</td>
              <td className="table-td"><span className={clsx('badge', post.adminHidden ? 'badge-red' : 'badge-green')}>{post.adminHidden ? 'hidden' : 'visible'}</span></td>
              <td className="table-td">
                <div className="flex items-center gap-1">
                  <button title={post.adminHidden ? 'Show' : 'Hide'} onClick={() => setConfirm({ msg: `${post.adminHidden ? 'Show' : 'Hide'} this post?`, onConfirm: () => doAction(() => post.adminHidden ? adminApi.showPost(token, post.id) : adminApi.hidePost(token, post.id)) })} className={clsx('p-1.5 rounded', post.adminHidden ? 'hover:bg-green-50 text-green-600' : 'hover:bg-yellow-50 text-yellow-600')}>{post.adminHidden ? <Eye size={15} /> : <EyeOff size={15} />}</button>
                  <button title="Delete" onClick={() => setConfirm({ msg: 'Permanently delete this post?', danger: true, onConfirm: () => doAction(() => adminApi.deletePost(token, post.id)) })} className="p-1.5 hover:bg-red-50 rounded text-red-600"><Trash2 size={15} /></button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </div>
      {confirm && <ConfirmDialog message={confirm.msg} danger={confirm.danger} loading={actionLoading} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}
    </div>
  )
}
