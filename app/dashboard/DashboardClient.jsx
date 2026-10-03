'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import Navbar from '../../components/Navbar'
import { Plus, FolderOpen, CheckSquare, Users, Trash2, X, Loader2 } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

const COLORS = ['#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#8b5cf6','#06b6d4']

export default function DashboardClient({ initialProjects, taskCount, user }) {
  const router = useRouter()
  const supabase = createClient()
  const [projects, setProjects] = useState(initialProjects)
  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', color: '#6366f1' })

  const name = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'

  const createProject = async (e) => {
    e.preventDefault()
    setCreating(true)
    const { data, error } = await supabase
      .from('projects')
      .insert({ name: form.name, description: form.description, color: form.color, owner_id: user.id })
      .select(`*, profiles:owner_id(id, name), project_members(id, role, profiles(id, name))`)
      .single()

    if (error) {
      toast.error('Project nahi bana: ' + error.message)
    } else {
      // Owner ko member bhi banao
      await supabase.from('project_members').insert({ project_id: data.id, user_id: user.id, role: 'OWNER' })
      setProjects([data, ...projects])
      setShowModal(false)
      setForm({ name: '', description: '', color: '#6366f1' })
      toast.success('Project ban gaya! 🎉')
    }
    setCreating(false)
  }

  const deleteProject = async (projectId, e) => {
    e.preventDefault()
    if (!confirm('Pakka delete karna hai? Saare tasks bhi delete ho jaenge!')) return
    const { error } = await supabase.from('projects').delete().eq('id', projectId)
    if (error) toast.error('Delete nahi hua')
    else {
      setProjects(projects.filter(p => p.id !== projectId))
      toast.success('Project delete ho gaya')
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <Toaster position="top-right" />

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Namaste, {name.split(' ')[0]}! 👋</h1>
            <p className="text-gray-500 text-sm mt-1">Tumhare saare projects yahan hain</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus size={18} /> New Project
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Projects', value: projects.length, icon: FolderOpen, color: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' },
            { label: 'Total Tasks', value: taskCount, icon: CheckSquare, color: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400' },
            { label: 'Teams', value: projects.filter(p => p.project_members?.length > 1).length, icon: Users, color: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card p-5">
              <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
                <Icon size={20} />
              </div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Projects */}
        <div>
          <h2 className="font-semibold text-lg mb-4">Tumhare Projects</h2>
          {projects.length === 0 ? (
            <div className="card p-16 text-center">
              <FolderOpen size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="font-medium text-gray-600 dark:text-gray-400">Koi project nahi hai abhi</p>
              <p className="text-sm text-gray-400 mt-1">Upar "New Project" dabao!</p>
              <button onClick={() => setShowModal(true)} className="btn-primary mt-4 mx-auto w-fit">
                <Plus size={16} /> Pehla Project Banao
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map(project => (
                <Link key={project.id} href={`/projects/${project.id}`}
                  className="card p-6 hover:shadow-md hover:-translate-y-0.5 transition-all group block">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm"
                      style={{ backgroundColor: project.color }}>
                      {project.name.charAt(0).toUpperCase()}
                    </div>
                    {project.owner_id === user.id && (
                      <button onClick={(e) => deleteProject(project.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 transition-all">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                  <h3 className="font-semibold mb-1 truncate">{project.name}</h3>
                  {project.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">{project.description}</p>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700 mt-3">
                    <div className="flex -space-x-2">
                      {project.project_members?.slice(0, 4).map(m => (
                        <div key={m.id} title={m.profiles?.name}
                          className="w-7 h-7 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: project.color }}>
                          {m.profiles?.name?.charAt(0).toUpperCase()}
                        </div>
                      ))}
                    </div>
                    <span className="text-xs text-gray-400">{project.project_members?.length} members</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">Naya Project</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={createProject} className="space-y-4">
              <div>
                <label className="label">Project ka naam *</label>
                <input className="input" placeholder="e.g. E-commerce Website"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className="label">Description (optional)</label>
                <textarea className="input resize-none" rows={2} placeholder="Project ke baare mein..."
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label className="label">Color chuno</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                      className={`w-8 h-8 rounded-full transition-all hover:scale-110 ${form.color === c ? 'ring-2 ring-offset-2 ring-gray-600 scale-110' : ''}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1" disabled={creating}>
                  {creating ? <><Loader2 size={15} className="animate-spin" /> Bana raha hoon...</> : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
