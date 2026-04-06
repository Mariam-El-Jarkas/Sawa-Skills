import { useState } from 'react'
import { Eye, EyeOff, Trash2, AlertTriangle } from 'lucide-react'
import { PageHeader, Table, SearchBar, ConfirmDialog } from '../../components/ui'
import { mockPosts } from '../../data/mockData'
import clsx from 'clsx'

export default function PostsPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [confirm, setConfirm] = useState(null)

  const filtered = mockPosts.filter(p =>
    (filter === 'all' || p.status === filter || (filter === 'reported' && p.reports > 0)) &&
    (p.author.toLowerCase().includes(search.toLowerCase()) || p.content.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-4">
      <PageHeader title="Posts & Comments" subtitle="Moderate community content" />
      <div className="card p-4 flex flex-wrap gap-3">
        <SearchBar value={search} onChange={v => setSearch(v)} placeholder="Search posts..." />
        <select className="input w-36" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All Posts</option>
          <option value="visible">Visible</option>
          <option value="hidden">Hidden</option>
          <option value="reported">Reported</option>
        </select>
      </div>
      <div className="card">
        <Table headers={['Post ID', 'Author', 'Content Preview', 'Likes', 'Comments', 'Reports', 'Status', 'Actions']} empty={filtered.length === 0}>
          {filtered.map(post => (
            <tr key={post.id} className="table-row">
              <td className="table-td text-xs text-gray-400">{post.id}</td>
              <td className="table-td">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-700 text-xs font-bold">{post.author[0]}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-800">{post.author}</span>
                </div>
              </td>
              <td className="table-td max-w-xs"><p className="text-sm text-gray-600 truncate">{post.content}</p></td>
              <td className="table-td text-gray-500">♥ {post.likes}</td>
              <td className="table-td text-gray-500">💬 {post.comments}</td>
              <td className="table-td">
                {post.reports > 0
                  ? <span className="badge-red badge flex items-center gap-1"><AlertTriangle size={10} />{post.reports}</span>
                  : <span className="text-gray-400 text-sm">0</span>}
              </td>
              <td className="table-td">
                <span className={clsx('badge', post.status === 'visible' ? 'badge-green' : 'badge-red')}>{post.status}</span>
              </td>
              <td className="table-td">
                <div className="flex items-center gap-1">
                  <button title={post.status === 'visible' ? 'Hide Post' : 'Show Post'} onClick={() => setConfirm({ msg: `${post.status === 'visible' ? 'Hide' : 'Show'} this post?`, action: () => {} })}
                    className={clsx('p-1.5 rounded transition-colors', post.status === 'visible' ? 'hover:bg-yellow-50 text-yellow-600' : 'hover:bg-green-50 text-green-600')}>
                    {post.status === 'visible' ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  <button title="Delete Post" onClick={() => setConfirm({ msg: 'Permanently delete this post?', action: () => {}, danger: true })} className="p-1.5 hover:bg-red-50 rounded text-red-600">
                    <Trash2 size={15} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </div>
      {confirm && <ConfirmDialog message={confirm.msg} danger={confirm.danger} onConfirm={() => { confirm.action(); setConfirm(null) }} onCancel={() => setConfirm(null)} />}
    </div>
  )
}
