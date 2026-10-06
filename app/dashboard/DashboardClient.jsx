'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import Navbar from '../../components/Navbar'
import FloatingMascot from '../../components/FloatingMascot'
import { playPop, playWhoosh, playBoing } from '../../lib/sound'
import { Plus, FolderOpen, CheckCircle2, Users, Trash2, X, Loader2, ArrowUpRight } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

const COLORS = ['#6366f1','#8b5cf6','#ec4899','#f43f5e','#f59e0b','#10b981','#06b6d4','#3b82f6']

export default function DashboardClient({ initialProjects, taskCount, user }) {
  const router = useRouter()
  const supabase = createClient()
  const [projects, setProjects] = useState(initialProjects || [])
  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', color: '#6366f1' })

  const name = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'

  const createProject = async (e) => {
    e.preventDefault()
    setCreating(true)
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .insert({ name: form.name.trim(), description: form.description?.trim() || null, color: form.color, owner_id: user.id })
      .select('*')
      .single()

    if (projectError) {
      toast.error('Could not create project: ' + projectError.message)
      setCreating(false)
      return
    }

    playPop()
    // Owner ko member bhi banao
    await supabase.from('project_members').insert({ project_id: projectData.id, user_id: user.id, role: 'OWNER' })

    setProjects([projectData, ...projects])
    setShowModal(false)
    setForm({ name: '', description: '', color: '#6366f1' })
    toast.success('Project created successfully! ✨')
    setCreating(false)
    router.refresh()
  }

  const deleteProject = async (projectId, e) => {
    e.preventDefault()
    if (!confirm('Are you sure you want to delete this project? All associated tasks will be removed.')) return
    playWhoosh()
    const { error } = await supabase.from('projects').delete().eq('id', projectId)
    if (error) toast.error('Could not delete project')
    else {
      setProjects(projects.filter(p => p.id !== projectId))
      toast.success('Project deleted')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
      <Navbar />
      <Toaster position="top-right" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-9 animate-fade-in">
        {/* Header Section with playful waving greeting */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              onClick={() => playBoing()}
              className="relative group cursor-pointer"
              title="I am Bat-Buddy! 🦇"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-zinc-950 via-zinc-900 to-amber-500 p-0.5 shadow-md shadow-amber-500/15 animate-mascot-bob">
                <div className="w-full h-full bg-zinc-900 text-white rounded-[14px] flex items-center justify-center text-2xl select-none">
                  🦇
                </div>
              </div>
              <div className="absolute -top-2 -right-2 bg-amber-500 text-zinc-950 text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-xs animate-bounce">
                🦇
              </div>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                Welcome back, {name.split(' ')[0]}! <span className="inline-block animate-wave-hand">👋</span>
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                Your workspaces are ready. Drag, drop, and collaborate! ✨
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              playPop()
              setShowModal(true)
            }}
            className="btn-primary self-start sm:self-auto"
          >
            <Plus size={17} /> New Project
          </button>
        </div>

        {/* Minimalist Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          {[
            {
              label: 'Active Projects',
              value: projects.length,
              icon: FolderOpen,
              color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200/50 dark:border-indigo-900/50'
            },
            {
              label: 'Total Tasks',
              value: taskCount,
              icon: CheckCircle2,
              color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200/50 dark:border-emerald-900/50'
            },
            {
              label: 'Collaborators',
              value: projects.filter(p => p.project_members?.length > 1).length,
              icon: Users,
              color: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/50 border-violet-200/50 dark:border-violet-900/50'
            },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white dark:bg-zinc-900/90 rounded-2xl p-5 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{label}</p>
                <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-1">{value}</p>
              </div>
              <div className={`w-11 h-11 rounded-2xl ${color} border flex items-center justify-center shadow-2xs`}>
                <Icon size={20} />
              </div>
            </div>
          ))}
        </div>

        {/* Projects Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Your Projects
            </h2>
            <span className="text-xs text-zinc-400 font-medium">
              {projects.length} {projects.length === 1 ? 'workspace' : 'workspaces'}
            </span>
          </div>

          {projects.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900/60 rounded-3xl p-12 sm:p-16 text-center border border-dashed border-zinc-300 dark:border-zinc-800">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto mb-4">
                <FolderOpen size={22} />
              </div>
              <h3 className="font-semibold text-zinc-800 dark:text-zinc-200">No projects created yet</h3>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mx-auto mt-1 mb-5">
                Create your first board to start organizing tasks, dragging them across workflows, and collaborating.
              </p>
              <button onClick={() => setShowModal(true)} className="btn-primary mx-auto text-sm py-2">
                <Plus size={16} /> Create First Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {projects.map(project => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="group bg-white dark:bg-zinc-900/90 rounded-2xl p-5 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 block relative"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-base shadow-xs"
                      style={{ backgroundColor: project.color || '#6366f1' }}
                    >
                      {project.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex items-center gap-1">
                      {project.owner_id === user.id && (
                        <button
                          onClick={(e) => deleteProject(project.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-zinc-400 hover:text-rose-500 transition-all"
                          title="Delete Project"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      <div className="text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors p-1">
                        <ArrowUpRight size={16} />
                      </div>
                    </div>
                  </div>

                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {project.name}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 min-h-[32px] leading-relaxed">
                    {project.description || 'No description provided.'}
                  </p>

                  <div className="flex items-center justify-between pt-3.5 border-t border-zinc-100 dark:border-zinc-800/80 mt-4">
                    <div className="flex -space-x-1.5 overflow-hidden py-0.5">
                      {project.project_members?.slice(0, 4).map(m => (
                        <div
                          key={m.id}
                          title={m.profiles?.name}
                          className="w-6 h-6 rounded-full ring-2 ring-white dark:ring-zinc-900 flex items-center justify-center text-white text-[10px] font-semibold"
                          style={{ backgroundColor: project.color || '#6366f1' }}
                        >
                          {m.profiles?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      ))}
                    </div>
                    <span className="text-[11px] font-medium text-zinc-400">
                      {project.project_members?.length || 1} {project.project_members?.length === 1 ? 'member' : 'members'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* New Project Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-zinc-950/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-3xl p-6 sm:p-7 w-full max-w-md border border-zinc-200 dark:border-zinc-800 shadow-2xl animate-pop">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg tracking-tight">Create New Project</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={createProject} className="space-y-4">
              <div>
                <label className="label">Project Name</label>
                <input
                  required
                  autoFocus
                  className="input text-sm"
                  placeholder="e.g. Website Redesign"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Description (optional)</label>
                <textarea
                  className="input text-sm resize-none"
                  rows={2}
                  placeholder="What is this board for?"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Color Accent</label>
                <div className="flex items-center gap-2.5 pt-1">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm({ ...form, color: c })}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        form.color === c ? 'scale-125 ring-2 ring-offset-2 ring-zinc-400 dark:ring-offset-zinc-900' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2.5 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1 text-sm py-2.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn-primary flex-1 text-sm py-2.5"
                >
                  {creating ? <Loader2 size={16} className="animate-spin" /> : 'Create Board'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Interactive Mascot Pet */}
      <FloatingMascot />
    </div>
  )
}
