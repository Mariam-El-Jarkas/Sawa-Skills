import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Trash2, AlertTriangle, RefreshCw, MessageSquare, Heart } from 'lucide-react'
import { PageHeader, Table, SearchBar, ConfirmDialog, AlertBanner, Modal } from '../../components/ui'
import { adminApi } from '../../api/adminApi'
import { useAuthStore } from '../../store/authStore'
import clsx from 'clsx'

const fmtDate  = (iso) => iso ? new Date(iso).toLocaleDateString() : '—'
const fmtTime  = (iso) => iso ? new Date(iso).toLocaleString() : '—'

export default function PostsPage() {
  const { token } = useAuthStore()
  const [searchParams] = useSearchParams()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState(() => searchParams.get('search') || '')
  const [filter, setFilter] = useState('all')
  const [confirm, setConfirm] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const debounceRef = useRef(null)

  // Comments modal state
  const [commentsPost, setCommentsPost] = useState(null)
  const [comments, setComments] = useState([])
  const [commentsLoading, setCommentsLoading] = useState(false)

  const load = useCallback(async (s, f) => {
    if (!token) return
    try { setLoading(true); setError(null); setPosts(await adminApi.getPosts(token, { search: s, status: f }) || []) }
    catch (e) { setError(e.message) } finally { setLoading(false) }
  }, [token])

  useEffect(() => { if (token) load(searchParams.get('search') || '', 'all') }, [token, load])

  const handleSearch = (v) => { setSearch(v); clearTimeout(debounceRef.current); debounceRef.current = setTimeout(() => load(v, filter), 300) }
  const handleFilter = (f) => { setFilter(f); load(search, f) }
  const doAction = async (fn) => { try { setActionLoading(true); await fn(); setConfirm(null); await load(search, filter) } catch (e) { alert(`Failed: ${e.message}`) } finally { setActionLoading(false) } }

  const openComments = async (post) => {
    setCommentsPost(post)
    setCommentsLoading(true)
    try { setComments(await adminApi.getPostComments(token, post.id) || []) }
    catch (e) { alert(`Failed to load comments: ${e.message}`) }
    finally { setCommentsLoading(false) }
  }

  const handleDeleteComment = (comment) => {
    setConfirm({
      msg: `Delete this comment by ${comment.authorName}?`,
      danger: true,
      onConfirm: async () => {
        try {
          setActionLoading(true)
          await adminApi.deleteComment(token, commentsPost.id, comment.id)
          setConfirm(null)
          // Refresh comments list and post counts
          setComments(await adminApi.getPostComments(token, commentsPost.id) || [])
          await load(search, filter)
        } catch (e) { alert(`Failed: ${e.message}`) }
        finally { setActionLoading(false) }
      }
    })
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Posts & Comments" subtitle="Moderate community content" actions={<button className="btn-secondary text-sm" onClick={() => load(search, filter)}><RefreshCw size={14} className="inline mr-1" />Refresh</button>} />
      {error && <AlertBanner type="error" message={error} onRetry={() => load(search, filter)} />}
      <div className="card p-4 flex flex-wrap gap-3">
        <SearchBar value={search} onChange={handleSearch} placeholder="Search posts or authors..." />
        <select className="input w-40" value={filter} onChange={e => handleFilter(e.target.value)}>
          <option value="all">All Posts</option>
          <option value="visible">Visible</option>
          <option value="hidden">Hidden</option>
          <option value="reported">Reported</option>
          <option value="deleted">Deleted Users</option>
        </select>
      </div>
      <div className="card">
        <Table headers={['ID', 'Author', 'Content Preview', 'Likes', 'Comments', 'Reports', 'Status', 'Actions']} empty={!loading && posts.length === 0} loading={loading}>
          {posts.map(post => (
            <tr key={post.id} className="table-row">
              <td className="table-td text-xs text-gray-400">#{post.id}</td>
              <td className="table-td">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-700 text-xs font-bold">{post.authorName?.[0] ?? '?'}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-800 block">{post.authorName}</span>
                    <span className="text-xs text-gray-400">{fmtDate(post.createdAt)}</span>
                  </div>
                </div>
              </td>
              <td className="table-td max-w-xs"><p className="text-sm text-gray-600 truncate">{post.content || '(no text)'}</p></td>
              <td className="table-td text-gray-500">♥ {post.likesCount ?? 0}</td>
              <td className="table-td">
                <button
                  onClick={() => openComments(post)}
                  title="View comments"
                  className="flex items-center gap-1 text-primary-600 hover:text-primary-800 hover:bg-primary-50 px-2 py-1 rounded-lg transition-colors text-xs font-medium"
                >
                  <MessageSquare size={13} />
                  {post.commentsCount ?? 0}
                </button>
              </td>
              <td className="table-td">{(post.reportCount ?? 0) > 0 ? <span className="badge badge-red flex items-center gap-1"><AlertTriangle size={10} />{post.reportCount}</span> : <span className="text-gray-400 text-sm">0</span>}</td>
              <td className="table-td"><span className={clsx('badge', post.adminHidden ? 'badge-red' : 'badge-green')}>{post.adminHidden ? 'hidden' : 'visible'}</span></td>
              <td className="table-td">
                <div className="flex items-center gap-1">
                  <button
                    title={post.adminHidden ? 'Show' : 'Hide'}
                    onClick={() => setConfirm({ msg: `${post.adminHidden ? 'Show' : 'Hide'} this post?`, onConfirm: () => doAction(() => post.adminHidden ? adminApi.showPost(token, post.id) : adminApi.hidePost(token, post.id)) })}
                    className={clsx('p-1.5 rounded', post.adminHidden ? 'hover:bg-green-50 text-green-600' : 'hover:bg-primary-50 text-primary-600')}
                  >
                    {post.adminHidden ? <Eye size={15} /> : <EyeOff size={15} />}
                  </button>
                  <button
                    title="Delete post"
                    onClick={() => setConfirm({ msg: 'Permanently delete this post?', danger: true, onConfirm: () => doAction(() => adminApi.deletePost(token, post.id)) })}
                    className="p-1.5 hover:bg-red-50 rounded text-red-600"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </div>

      {/* Comments modal */}
      {commentsPost && (
        <Modal
          title={`Comments on post #${commentsPost.id} · ${commentsPost.authorName}`}
          onClose={() => { setCommentsPost(null); setComments([]) }}
        >
          {/* Post preview */}
          <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm text-gray-600 border border-gray-100">
            {commentsPost.content || <span className="italic text-gray-400">(no text)</span>}
          </div>

          {commentsLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-gray-400 text-sm">
              <div className="w-4 h-4 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
              Loading comments…
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No comments on this post yet.</div>
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {comments.map(c => (
                <div key={c.id} className="flex items-start gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:border-gray-200 transition-colors group">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 text-primary-700 text-xs font-bold">
                    {c.authorName?.[0] ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-gray-900">{c.authorName}</span>
                      <span className="text-xs text-gray-400">{fmtTime(c.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{c.content}</p>
                    {c.likeCount > 0 && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                        <Heart size={11} />
                        {c.likeCount}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteComment(c)}
                    className="p-1.5 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                    title="Delete comment"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400">
            <span>{comments.length} comment{comments.length !== 1 ? 's' : ''}</span>
            <button onClick={() => { setCommentsPost(null); setComments([]) }} className="btn-secondary text-xs px-3 py-1.5">Close</button>
          </div>
        </Modal>
      )}

      {confirm && <ConfirmDialog message={confirm.msg} danger={confirm.danger} loading={actionLoading} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}
    </div>
  )
}
