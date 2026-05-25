import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, UtensilsCrossed, Music2, Globe, Monitor, Palette, Trophy, Briefcase, PenTool, BookOpen, Dumbbell, Star, Camera, FlaskConical, Hammer, Leaf, Microscope, Shirt, Plane, Sparkles, Heart } from 'lucide-react'
import { PageHeader, Modal, ConfirmDialog, AlertBanner } from '../../components/ui'
import { adminApi } from '../../api/adminApi'
import { useAuthStore } from '../../store/authStore'

// ── Icon registry — must match mobile app's FEATURED_ICONS keys ───────────────
const ICON_OPTIONS = [
  { key: 'Cooking',     Icon: UtensilsCrossed, label: 'Cooking'     },
  { key: 'Music',       Icon: Music2,          label: 'Music'       },
  { key: 'Languages',   Icon: Globe,           label: 'Languages'   },
  { key: 'Tech',        Icon: Monitor,         label: 'Tech'        },
  { key: 'Art',         Icon: Palette,         label: 'Art'         },
  { key: 'Sports',      Icon: Trophy,          label: 'Sports'      },
  { key: 'Business',    Icon: Briefcase,       label: 'Business'    },
  { key: 'Design',      Icon: PenTool,         label: 'Design'      },
  { key: 'Health',      Icon: Heart,           label: 'Health'      },
  { key: 'Education',   Icon: BookOpen,        label: 'Education'   },
  { key: 'Photography', Icon: Camera,          label: 'Photography' },
  { key: 'Fitness',     Icon: Dumbbell,        label: 'Fitness'     },
  { key: 'Science',     Icon: FlaskConical,    label: 'Science'     },
  { key: 'Crafts',      Icon: Hammer,          label: 'Crafts'      },
  { key: 'Nature',      Icon: Leaf,            label: 'Nature'      },
  { key: 'Research',    Icon: Microscope,      label: 'Research'    },
  { key: 'Fashion',     Icon: Shirt,           label: 'Fashion'     },
  { key: 'Travel',      Icon: Plane,           label: 'Travel'      },
  { key: 'Other',       Icon: Star,            label: 'Other'       },
]

const ICON_MAP = Object.fromEntries(ICON_OPTIONS.map(o => [o.key, o.Icon]))

function CategoryIcon({ iconKey, size = 20, className = '' }) {
  const Icon = ICON_MAP[iconKey] ?? Sparkles
  return <Icon size={size} className={className} />
}

export default function SkillsPage() {
  const { token } = useAuthStore()
  const [cats, setCats] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [newCat, setNewCat] = useState({ name: '', description: '', skills: '', iconKey: 'Other' })

  const load = useCallback(async () => {
    if (!token) return
    try { setLoading(true); setError(null); setCats(await adminApi.getSkillCategories(token) || []) }
    catch (e) { setError(e.message) } finally { setLoading(false) }
  }, [token])

  useEffect(() => { if (token) load() }, [token, load])

  const handleCreate = async () => {
    if (!newCat.name.trim()) return
    try {
      const created = await adminApi.createSkillCategory(token, {
        name: newCat.name.trim(),
        description: newCat.description.trim(),
        iconKey: newCat.iconKey,
      })
      for (const n of newCat.skills.split(',').map(s => s.trim()).filter(Boolean))
        await adminApi.addSkill(token, created.id, n)
      setNewCat({ name: '', description: '', skills: '', iconKey: 'Other' })
      setShowAdd(false)
      await load()
    } catch (e) { alert(`Failed: ${e.message}`) }
  }

  const handleDeleteCat = (id, name) => setConfirm({
    msg: `Delete "${name}" and all its skills?`, danger: true,
    onConfirm: async () => {
      try { setConfirmLoading(true); await adminApi.deleteSkillCategory(token, id); setConfirm(null); await load() }
      catch (e) { alert(`Failed: ${e.message}`) } finally { setConfirmLoading(false) }
    }
  })

  const handleAddSkill = async (catId, skillName) => {
    try {
      const skill = await adminApi.addSkill(token, catId, skillName)
      setCats(p => p.map(c => c.id === catId ? { ...c, skills: [...(c.skills || []), skill], skillCount: (c.skillCount || 0) + 1 } : c))
    } catch (e) { alert(`Failed: ${e.message}`) }
  }

  const handleRemoveSkill = async (catId, skillId) => {
    try {
      await adminApi.removeSkill(token, skillId)
      setCats(p => p.map(c => c.id === catId ? { ...c, skills: (c.skills || []).filter(s => s.id !== skillId), skillCount: Math.max(0, (c.skillCount || 1) - 1) } : c))
    } catch (e) { alert(`Failed: ${e.message}`) }
  }

  const totalSkills = cats.reduce((a, c) => a + (c.skillCount ?? 0), 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Skills Management"
        subtitle={`${cats.length} categories · ${totalSkills} total skills`}
        actions={
          <button className="btn-primary text-sm flex items-center gap-2" onClick={() => setShowAdd(true)}>
            <Plus size={16} /> New Category
          </button>
        }
      />
      {error && <AlertBanner type="error" message={error} onRetry={load} />}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[['Categories', cats.length, 'text-primary-600'], ['Total Skills', totalSkills, 'text-primary-600'], ['Top Category', loading ? '…' : cats[0]?.name ?? '—', 'text-green-600']].map(([label, value, color]) => (
          <div key={label} className="card p-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Category cards */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {Array(4).fill(0).map((_, i) => <div key={i} className="card h-40 animate-pulse bg-gray-50" />)}
        </div>
      ) : cats.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">No categories yet. Create one to get started.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {cats.map(cat => (
            <div key={cat.id} className="card p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600">
                    <CategoryIcon iconKey={cat.iconKey || 'Other'} size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                    {cat.description && <p className="text-xs text-gray-400 mt-0.5">{cat.description}</p>}
                    <p className="text-xs text-gray-500 mt-0.5">{cat.skillCount ?? 0} skills</p>
                  </div>
                </div>
                <button onClick={() => handleDeleteCat(cat.id, cat.name)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mb-3 min-h-[36px]">
                {(cat.skills || []).map(skill => (
                  <div key={skill.id} className="flex items-center gap-1 bg-primary-50 border border-primary-100 text-primary-700 rounded-full px-3 py-1 text-xs font-medium group">
                    <span>{skill.skillName}</span>
                    <button onClick={() => handleRemoveSkill(cat.id, skill.id)} className="opacity-0 group-hover:opacity-100 text-primary-400 hover:text-red-500 transition-all ml-1 leading-none">×</button>
                  </div>
                ))}
              </div>
              <AddSkillInline onAdd={(n) => handleAddSkill(cat.id, n)} />
            </div>
          ))}
        </div>
      )}

      {/* Create category modal */}
      {showAdd && (
        <Modal title="Add New Category" onClose={() => setShowAdd(false)}>
          <div className="space-y-4">
            <div>
              <label className="label">Category Name</label>
              <input className="input" placeholder="e.g. Photography" value={newCat.name} onChange={e => setNewCat(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Description <span className="text-gray-400 font-normal">(optional)</span></label>
              <input className="input" placeholder="Brief description..." value={newCat.description} onChange={e => setNewCat(p => ({ ...p, description: e.target.value }))} />
            </div>

            {/* Icon picker */}
            <div>
              <label className="label">Category Icon</label>
              <div className="grid grid-cols-5 gap-2 mt-1">
                {ICON_OPTIONS.map(({ key, Icon, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setNewCat(p => ({ ...p, iconKey: key }))}
                    title={label}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all text-xs font-medium ${
                      newCat.iconKey === key
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-primary-200 hover:bg-primary-50'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="truncate w-full text-center">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Initial Skills <span className="text-gray-400 font-normal">(comma separated)</span></label>
              <textarea className="input resize-none h-20" placeholder="e.g. Portrait, Landscape" value={newCat.skills} onChange={e => setNewCat(p => ({ ...p, skills: e.target.value }))} />
            </div>

            {/* Preview */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600">
                <CategoryIcon iconKey={newCat.iconKey} size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{newCat.name || 'Category Name'}</p>
                <p className="text-xs text-gray-400">{newCat.description || 'Description'}</p>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button className="btn-secondary flex-1" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn-primary flex-1" onClick={handleCreate} disabled={!newCat.name.trim()}>Create Category</button>
            </div>
          </div>
        </Modal>
      )}

      {confirm && <ConfirmDialog message={confirm.msg} danger={confirm.danger} loading={confirmLoading} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}
    </div>
  )
}

function AddSkillInline({ onAdd }) {
  const [value, setValue] = useState('')
  const [open, setOpen] = useState(false)
  if (!open) return (
    <button onClick={() => setOpen(true)} className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 font-medium">
      <Plus size={13} /> Add skill
    </button>
  )
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
