import { useState } from 'react'
import { Plus, Trash2, TrendingUp, Users } from 'lucide-react'
import { PageHeader, Modal, ConfirmDialog } from '../../components/ui'
import { mockSkillCategories } from '../../data/mockData'

const CATEGORY_ICONS = {
  Technology: '💻', 'Creative Arts': '🎨', Music: '🎵', Languages: '🌍', Cooking: '🍳', Business: '💼',
}

export default function SkillsPage() {
  const [categories, setCategories] = useState(mockSkillCategories)
  const [showAdd, setShowAdd] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [newCat, setNewCat] = useState({ name: '', skills: '' })

  const deleteCategory = (id) => setCategories(c => c.filter(x => x.id !== id))
  const addSkillToCategory = (catId, skillName) => {
    setCategories(c => c.map(cat => cat.id === catId ? { ...cat, skills: [...cat.skills, skillName] } : cat))
  }
  const removeSkillFromCategory = (catId, skillIndex) => {
    setCategories(c => c.map(cat => cat.id === catId ? { ...cat, skills: cat.skills.filter((_, i) => i !== skillIndex) } : cat))
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Skills Management"
        subtitle={`${categories.length} categories · ${categories.reduce((a, c) => a + c.skills.length, 0)} total skills`}
        actions={
          <button className="btn-primary text-sm flex items-center gap-2" onClick={() => setShowAdd(true)}>
            <Plus size={16} /> New Category
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-primary-600">{categories.length}</p>
          <p className="text-sm text-gray-500 mt-1">Categories</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-primary-600">{categories.reduce((a, c) => a + c.skills.length, 0)}</p>
          <p className="text-sm text-gray-500 mt-1">Total Skills</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{categories.filter(c => c.trending).length}</p>
          <p className="text-sm text-gray-500 mt-1">Trending Now</p>
        </div>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {categories.map(cat => (
          <div key={cat.id} className="card p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-xl">
                  {CATEGORY_ICONS[cat.name] || '📚'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                    {cat.trending && (
                      <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full font-medium">
                        <TrendingUp size={10} /> Trending
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Users size={12} className="text-gray-400" />
                    <span className="text-xs text-gray-500">{cat.count} users · {cat.skills.length} skills</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setConfirm({ msg: `Delete category "${cat.name}"?`, action: () => deleteCategory(cat.id), danger: true })}
                className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-3 min-h-[36px]">
              {cat.skills.map((skill, i) => (
                <div key={i} className="flex items-center gap-1 bg-primary-50 border border-primary-100 text-primary-700 rounded-full px-3 py-1 text-xs font-medium group">
                  <span>{skill}</span>
                  <button onClick={() => removeSkillFromCategory(cat.id, i)} className="opacity-0 group-hover:opacity-100 text-primary-400 hover:text-red-500 transition-all ml-1 leading-none">×</button>
                </div>
              ))}
            </div>

            <AddSkillInline onAdd={(name) => addSkillToCategory(cat.id, name)} />
          </div>
        ))}
      </div>

      {showAdd && (
        <Modal title="Add New Category" onClose={() => setShowAdd(false)}>
          <div className="space-y-4">
            <div>
              <label className="label">Category Name</label>
              <input className="input" placeholder="e.g. Photography" value={newCat.name} onChange={e => setNewCat(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Initial Skills <span className="text-gray-400 font-normal">(comma separated)</span></label>
              <textarea className="input resize-none h-20" placeholder="e.g. Portrait, Landscape, Videography" value={newCat.skills} onChange={e => setNewCat(p => ({ ...p, skills: e.target.value }))} />
            </div>
            <div className="flex gap-2 pt-1">
              <button className="btn-secondary flex-1" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn-primary flex-1" onClick={() => {
                if (!newCat.name) return
                setCategories(c => [...c, { id: 'SC' + Date.now(), name: newCat.name, skills: newCat.skills.split(',').map(s => s.trim()).filter(Boolean), count: 0, trending: false }])
                setNewCat({ name: '', skills: '' })
                setShowAdd(false)
              }}>
                Create Category
              </button>
            </div>
          </div>
        </Modal>
      )}

      {confirm && <ConfirmDialog message={confirm.msg} danger={confirm.danger} onConfirm={() => { confirm.action(); setConfirm(null) }} onCancel={() => setConfirm(null)} />}
    </div>
  )
}

function AddSkillInline({ onAdd }) {
  const [value, setValue] = useState('')
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 font-medium transition-colors">
        <Plus size={13} /> Add skill
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <input
        autoFocus
        className="input text-xs py-1.5 h-8 flex-1"
        placeholder="Skill name..."
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && value.trim()) { onAdd(value.trim()); setValue(''); setOpen(false) }
          if (e.key === 'Escape') { setValue(''); setOpen(false) }
        }}
      />
      <button className="btn-primary text-xs py-1.5 h-8 px-3" onClick={() => { if (value.trim()) { onAdd(value.trim()); setValue(''); setOpen(false) } }}>Add</button>
      <button className="text-gray-400 hover:text-gray-600 text-lg leading-none" onClick={() => { setValue(''); setOpen(false) }}>×</button>
    </div>
  )
}
