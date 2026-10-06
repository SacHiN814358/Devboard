'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { createClient } from '../../../lib/supabase/client'
import Navbar from '../../../components/Navbar'
import CardMascot from '../../../components/CardMascot'
import {
  ArrowLeft,
  Plus,
  X,
  MessageSquare,
  Users,
  Calendar,
  CheckCircle2,
  Circle,
  Clock3,
  Trash2,
  Send,
  Search,
  Sparkles,
  Trophy,
  Filter
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { format } from 'date-fns'
import confetti from 'canvas-confetti'

const COLUMNS = [
  {
    id: 'TODO',
    label: 'To Do',
    dotColor: 'bg-indigo-500',
    icon: Circle,
    bg: 'bg-zinc-100/70 dark:bg-zinc-900/40 border border-zinc-200/70 dark:border-zinc-800/60'
  },
  {
    id: 'IN_PROGRESS',
    label: 'In Progress',
    dotColor: 'bg-amber-500',
    icon: Clock3,
    bg: 'bg-zinc-100/70 dark:bg-zinc-900/40 border border-zinc-200/70 dark:border-zinc-800/60'
  },
  {
    id: 'DONE',
    label: 'Done',
    dotColor: 'bg-emerald-500',
    icon: CheckCircle2,
    bg: 'bg-zinc-100/70 dark:bg-zinc-900/40 border border-zinc-200/70 dark:border-zinc-800/60'
  },
]

const PRIORITY_CONFIG = {
  HIGH: {
    label: 'High',
    dot: 'bg-rose-500',
    style: 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200/60 dark:border-rose-900/40',
  },
  MEDIUM: {
    label: 'Medium',
    dot: 'bg-amber-500',
    style: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-900/40',
  },
  LOW: {
    label: 'Low',
    dot: 'bg-emerald-500',
    style: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-900/40',
  },
}

export default function KanbanBoard({ project, initialTasks, user }) {
  const router = useRouter()
  const supabase = createClient()
  const [tasks, setTasks] = useState(initialTasks || [])
  const [selectedTask, setSelectedTask] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [showAddTask, setShowAddTask] = useState(null)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [memberEmail, setMemberEmail] = useState('')
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'MEDIUM', due_date: '' })
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPriority, setFilterPriority] = useState('ALL')

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'

  // Sync state whenever server sends updated initialTasks
  useEffect(() => {
    if (initialTasks) {
      setTasks(initialTasks)
    }
  }, [initialTasks])

  // Client-side verification: fetch exact comment counts for all tasks in this project
  useEffect(() => {
    async function syncCommentCounts() {
      if (!initialTasks || initialTasks.length === 0) return
      const taskIds = initialTasks.map(t => t.id)
      const { data, error } = await supabase
        .from('comments')
        .select('task_id')
        .in('task_id', taskIds)

      if (data && !error) {
        const counts = {}
        data.forEach(c => {
          counts[c.task_id] = (counts[c.task_id] || 0) + 1
        })
        setTasks(prev => prev.map(t => ({
          ...t,
          comment_count: counts[t.id] ?? t.comment_count ?? 0,
        })))
      }
    }
    syncCommentCounts()
  }, [project.id])

  // Supabase Realtime — live task updates & comment count synchronization
  useEffect(() => {
    const channel = supabase
      .channel(`project-realtime-${project.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'tasks',
        filter: `project_id=eq.${project.id}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          if (payload.new.creator_id !== user.id) {
            setTasks(prev => [{ ...payload.new, comment_count: 0 }, ...prev])
            toast(`New task added: "${payload.new.title}"`, { icon: '✨' })
          }
        } else if (payload.eventType === 'UPDATE') {
          setTasks(prev => prev.map(t => t.id === payload.new.id ? { ...t, ...payload.new, comment_count: t.comment_count ?? 0 } : t))
        } else if (payload.eventType === 'DELETE') {
          setTasks(prev => prev.filter(t => t.id !== payload.old.id))
        }
      })
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'comments',
      }, (payload) => {
        const addedComment = payload.new
        // Only increment for other users/tabs to avoid double-counting optimistic updates
        if (addedComment && addedComment.author_id !== user.id) {
          setTasks(prev => prev.map(t => {
            if (t.id === addedComment.task_id) {
              return { ...t, comment_count: (Number(t.comment_count) || 0) + 1 }
            }
            return t
          }))
        }
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [project.id])

  // Task filtering with search and priority
  const getByStatus = (status) => tasks.filter(t => {
    if (t.status !== status) return false
    if (filterPriority !== 'ALL' && t.priority !== filterPriority) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const titleMatch = t.title && t.title.toLowerCase().includes(q)
      const descMatch = t.description && t.description.toLowerCase().includes(q)
      return titleMatch || descMatch
    }
    return true
  })

  // Calculate Progress Stats
  const totalTasks = tasks.length
  const doneTasks = tasks.filter(t => t.status === 'DONE').length
  const progressPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  const onDragEnd = async ({ destination, source, draggableId }) => {
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) return
    const newStatus = destination.droppableId
    setTasks(prev => prev.map(t => t.id === draggableId ? { ...t, status: newStatus } : t))
    await supabase.from('tasks').update({ status: newStatus }).eq('id', draggableId)

    // Joyful celebration animation when moving task to DONE!
    if (newStatus === 'DONE' && source.droppableId !== 'DONE') {
      try {
        confetti({
          particleCount: 65,
          spread: 70,
          origin: { y: 0.6 }
        })
      } catch (e) {}
      toast('Task Completed! 🎉 Superb job!', { icon: '🌟' })
    }
  }

  const createTask = async (status) => {
    if (!taskForm.title.trim()) return
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title: taskForm.title.trim(),
        description: taskForm.description?.trim() || null,
        priority: taskForm.priority,
        due_date: taskForm.due_date || null,
        status,
        project_id: project.id,
        creator_id: user.id,
      })
      .select('*')
      .single()

    if (error) return toast.error('Could not create task: ' + error.message)

    setTasks(prev => [{ ...data, comment_count: 0 }, ...prev])
    setShowAddTask(null)
    setTaskForm({ title: '', description: '', priority: 'MEDIUM', due_date: '' })
    toast.success('Task created! ✨')
  }

  const deleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return
    await supabase.from('tasks').delete().eq('id', taskId)
    setTasks(prev => prev.filter(t => t.id !== taskId))
    setSelectedTask(null)
    toast.success('Task deleted')
  }

  const openTask = async (task) => {
    setSelectedTask(task)
    setNewComment('')

    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('task_id', task.id)
      .order('created_at', { ascending: true })

    const commentList = data || []
    const formatted = commentList.map(c => ({
      ...c,
      author: { name: c.author_id === user.id ? userName : 'Member' }
    }))
    setComments(formatted)

    // Synchronize exact count directly on the task card
    setTasks(prev => prev.map(t =>
      t.id === task.id ? { ...t, comment_count: commentList.length } : t
    ))
  }

  const addComment = async () => {
    if (!newComment.trim() || !selectedTask) return
    const commentContent = newComment.trim()
    const targetTaskId = selectedTask.id

    const { data, error } = await supabase
      .from('comments')
      .insert({
        content: commentContent,
        task_id: targetTaskId,
        author_id: user.id
      })
      .select('*')
      .single()

    if (error) {
      toast.error('Could not post comment: ' + error.message)
      return
    }

    const newCommentObj = {
      ...data,
      author: { name: userName }
    }

    // Instantly append to drawer comments list
    setComments(prev => [...prev, newCommentObj])
    setNewComment('')

    // Instantly update the comment count on the task card
    setTasks(prev => prev.map(t => {
      if (t.id === targetTaskId) {
        return { ...t, comment_count: (Number(t.comment_count) || 0) + 1 }
      }
      return t
    }))

    toast.success('Comment posted! 💬')
  }

  const addMember = async () => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('email', memberEmail.trim())
      .single()

    if (!profile) return toast.error('User not found. They need an existing account.')
    await supabase.from('project_members').upsert({ project_id: project.id, user_id: profile.id })
    toast.success(`${profile.name} added to the project!`)
    setMemberEmail('')
    setShowMemberModal(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors relative overflow-x-hidden">
      {/* Ambient Cartoon Floating Glow Blobs */}
      <div className="fixed top-24 left-10 w-96 h-96 bg-indigo-400/10 dark:bg-indigo-600/5 rounded-full blur-3xl pointer-events-none -z-10 animate-float" />
      <div className="fixed bottom-10 right-10 w-96 h-96 bg-pink-400/10 dark:bg-pink-600/5 rounded-full blur-3xl pointer-events-none -z-10 animate-float" style={{ animationDelay: '1.5s' }} />

      <Navbar />
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-7 animate-fade-in relative z-10">
        {/* Project Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2.5 rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-900 transition-all active:scale-95 border border-transparent hover:border-zinc-300/60 dark:hover:border-zinc-800 shadow-2xs"
              title="Back to Dashboard"
            >
              <ArrowLeft size={18} />
            </button>
            <div
              className="w-11 h-11 rounded-2xl shadow-sm flex items-center justify-center text-white font-bold text-lg shadow-indigo-500/15"
              style={{ backgroundColor: project.color || '#6366f1' }}
            >
              {project.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                {project.name}
              </h1>
              {project.description && (
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1">
                  {project.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {project.project_members && project.project_members.length > 0 && (
              <div className="flex -space-x-2 overflow-hidden py-1">
                {project.project_members.slice(0, 5).map(m => (
                  <div
                    key={m.id}
                    title={m.profiles?.name}
                    className="w-8 h-8 rounded-full ring-2 ring-white dark:ring-zinc-950 flex items-center justify-center text-white text-xs font-semibold shadow-xs"
                    style={{ backgroundColor: project.color || '#6366f1' }}
                  >
                    {m.profiles?.name?.charAt(0).toUpperCase()}
                  </div>
                ))}
              </div>
            )}
            {project.owner_id === user.id && (
              <button
                onClick={() => setShowMemberModal(true)}
                className="btn-secondary text-xs sm:text-sm py-2 px-3.5"
              >
                <Users size={15} /> Add Member
              </button>
            )}
          </div>
        </div>

        {/* Playful Sprint Progress Banner */}
        <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-pink-950/40 rounded-3xl p-5 border border-indigo-200/60 dark:border-indigo-900/40 shadow-xs relative overflow-hidden backdrop-blur-xs">
          {/* Subtle floating background decorations */}
          <div className="absolute top-2 right-6 text-xl opacity-40 animate-pulse select-none">✨</div>
          <div className="absolute bottom-1 right-20 text-sm opacity-30 animate-bounce select-none">⭐</div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-800 shadow-md flex items-center justify-center text-2xl select-none animate-mascot-bob">
                {progressPct === 100 ? '🏆' : progressPct > 50 ? '🚀' : '🎯'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Sprint Progress
                  </h2>
                  <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-zinc-800 px-2.5 py-0.5 rounded-full border border-indigo-200/60 dark:border-indigo-800 shadow-2xs">
                    {progressPct}% Completed
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {progressPct === 100
                    ? 'All tasks completed! You are a superstar! 🎉'
                    : `${doneTasks} of ${totalTasks} tasks done — ${
                        progressPct > 50 ? 'Over halfway there! Keep pushing! 🔥' : 'Let’s crush today’s goals! 💪'
                      }`}
                </p>
              </div>
            </div>

            {/* Candy-striped Progress Bar */}
            <div className="w-full sm:w-64 flex flex-col gap-1.5">
              <div className="w-full h-3.5 bg-white dark:bg-zinc-800/90 rounded-full overflow-hidden p-0.5 border border-indigo-100 dark:border-zinc-700/60 shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500 shadow-xs relative"
                  style={{ width: `${progressPct}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
                </div>
              </div>
              <div className="flex justify-between text-[11px] font-semibold text-zinc-400 px-1">
                <span>0%</span>
                <span>{doneTasks} / {totalTasks} Tasks</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Priority Filter Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input pl-9 text-xs sm:text-sm py-2"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-semibold text-zinc-400 mr-1 hidden sm:inline flex-items-center gap-1">
              <Filter size={12} className="inline mr-1" /> Priority:
            </span>
            {[
              { id: 'ALL', label: 'All Tasks' },
              { id: 'HIGH', label: '🔴 High' },
              { id: 'MEDIUM', label: '🟡 Medium' },
              { id: 'LOW', label: '🟢 Low' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setFilterPriority(p.id)}
                className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-all active:scale-95 ${
                  filterPriority === p.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Modern Kanban Board Columns */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {COLUMNS.map(col => {
              const columnTasks = getByStatus(col.id)
              return (
                <div
                  key={col.id}
                  className={`rounded-3xl p-4.5 ${col.bg} min-h-[580px] flex flex-col shadow-xs transition-colors`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-4 px-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${col.dotColor} animate-pulse`} />
                      <span className="font-bold text-sm tracking-tight text-zinc-800 dark:text-zinc-200">
                        {col.label}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 bg-white/90 dark:bg-zinc-800/90 px-2.5 py-0.5 rounded-full border border-zinc-200/60 dark:border-zinc-700/60 shadow-2xs">
                      {columnTasks.length}
                    </span>
                  </div>

                  {/* Task List Droppable Area */}
                  <Droppable droppableId={col.id}>
                    {(provided, snap) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`space-y-4 flex-1 min-h-[140px] rounded-2xl transition-all duration-150 p-1 pt-3 ${
                          snap.isDraggingOver ? 'bg-indigo-50/50 dark:bg-indigo-950/20 ring-2 ring-indigo-500/20' : ''
                        }`}
                      >
                        {columnTasks.map((task, i) => {
                          const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM
                          return (
                            <Draggable key={task.id} draggableId={task.id} index={i}>
                              {(provided, snap) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={() => openTask(task)}
                                  className={`group relative bg-white dark:bg-zinc-900/95 rounded-2xl p-4.5 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-indigo-400 dark:hover:border-indigo-600/70 hover:shadow-xl transition-all duration-200 cursor-pointer hover:z-30 ${
                                    snap.isDragging
                                      ? 'shadow-2xl rotate-2 scale-[1.03] ring-2 ring-indigo-500 z-50'
                                      : 'shadow-xs hover:-translate-y-1'
                                  }`}
                                >
                                  {/* Dynamic Cartoon Mascot that changes on every hover! */}
                                  <CardMascot index={i} taskId={task.id} columnId={col.id} />

                                  {/* Task Title & Priority */}
                                  <div className="flex items-start justify-between gap-2.5 relative z-10">
                                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex-1 leading-snug line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                      {task.title}
                                    </h3>
                                    <div
                                      className={`flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-lg border ${priority.style}`}
                                    >
                                      <div className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
                                      <span>{priority.label}</span>
                                    </div>
                                  </div>

                                  {/* Optional Description snippet */}
                                  {task.description && (
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 line-clamp-2 leading-relaxed relative z-10">
                                      {task.description}
                                    </p>
                                  )}

                                  {/* Footer: Date & Comment Badge */}
                                  <div className="flex items-center justify-between mt-3.5 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 relative z-10">
                                    <div className="flex items-center gap-2">
                                      {task.due_date ? (
                                        <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1 bg-zinc-100/80 dark:bg-zinc-800/80 px-2 py-0.5 rounded-md">
                                          <Calendar size={12} className="text-zinc-400" />
                                          {format(new Date(task.due_date), 'MMM d')}
                                        </span>
                                      ) : (
                                        <div />
                                      )}
                                      {task.assignee && (
                                        <div
                                          className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-xs"
                                          style={{ backgroundColor: project.color || '#6366f1' }}
                                          title={`Assigned to ${task.assignee.name}`}
                                        >
                                          {task.assignee.name.charAt(0)}
                                        </div>
                                      )}
                                    </div>

                                    {/* Playful Interactive Comment Pill */}
                                    <div
                                      className="flex items-center gap-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-100/90 dark:bg-zinc-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 px-2.5 py-1 rounded-full border border-zinc-200/60 dark:border-zinc-700/60 transition-colors shadow-2xs group-hover:border-indigo-300 dark:group-hover:border-indigo-700"
                                      title={`${task.comment_count || 0} comments`}
                                    >
                                      <MessageSquare size={12} className="text-zinc-400 group-hover:text-indigo-500 transition-colors" />
                                      <span>{task.comment_count || 0}</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          )
                        })}

                        {/* Playful Empty Column Mascot State */}
                        {columnTasks.length === 0 && (
                          <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-2xl bg-white/40 dark:bg-zinc-900/30 border border-dashed border-zinc-200 dark:border-zinc-800/60 my-2">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-2xl flex items-center justify-center mb-2 animate-float shadow-2xs select-none">
                              {col.id === 'TODO' ? '🐾' : col.id === 'IN_PROGRESS' ? '⚡' : '🏆'}
                            </div>
                            <p className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
                              {col.id === 'TODO' ? 'No tasks yet!' : col.id === 'IN_PROGRESS' ? 'Nothing in progress' : 'Nothing completed yet'}
                            </p>
                            <p className="text-[11px] text-zinc-400 mt-0.5">
                              {col.id === 'TODO' ? 'Add a task below' : col.id === 'IN_PROGRESS' ? 'Drag a task here to start' : 'Drag finished tasks here!'}
                            </p>
                          </div>
                        )}

                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>

                  {/* Add Task Interactive Area */}
                  {showAddTask === col.id ? (
                    <div className="mt-3 bg-white dark:bg-zinc-900 rounded-2xl p-4 space-y-3 border border-zinc-200 dark:border-zinc-800 shadow-md animate-pop">
                      <input
                        autoFocus
                        className="input text-sm"
                        placeholder="Task title..."
                        value={taskForm.title}
                        onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                        onKeyDown={e => e.key === 'Enter' && createTask(col.id)}
                      />
                      <textarea
                        className="input text-sm resize-none"
                        rows={2}
                        placeholder="Add some details..."
                        value={taskForm.description}
                        onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          className="input text-xs"
                          value={taskForm.priority}
                          onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
                        >
                          <option value="LOW">🟢 Low Priority</option>
                          <option value="MEDIUM">🟡 Medium Priority</option>
                          <option value="HIGH">🔴 High Priority</option>
                        </select>
                        <input
                          type="date"
                          className="input text-xs"
                          value={taskForm.due_date}
                          onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })}
                        />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button className="btn-primary flex-1 text-xs py-2" onClick={() => createTask(col.id)}>
                          Add Task
                        </button>
                        <button
                          className="btn-secondary text-xs py-2 px-3"
                          onClick={() => setShowAddTask(null)}
                        >
                          <X size={15} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAddTask(col.id)}
                      className="mt-3 w-full flex items-center justify-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-2.5 rounded-xl hover:bg-white/80 dark:hover:bg-zinc-800/60 border border-dashed border-zinc-300/80 dark:border-zinc-800 transition-all active:scale-[0.98]"
                    >
                      <Plus size={14} /> New Task
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </DragDropContext>
      </div>

      {/* Modern Slide-Over Task Drawer */}
      {selectedTask && (
        <div
          className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs z-50 flex justify-end transition-opacity"
          onClick={() => setSelectedTask(null)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 h-full overflow-y-auto shadow-2xl animate-slide-in border-l border-zinc-200 dark:border-zinc-800 flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer Top Header */}
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-3 py-1 rounded-full font-medium ${
                    selectedTask.status === 'TODO'
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                      : selectedTask.status === 'IN_PROGRESS'
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                  }`}
                >
                  {selectedTask.status === 'IN_PROGRESS'
                    ? 'In Progress'
                    : selectedTask.status === 'TODO'
                    ? 'To Do'
                    : 'Done'}
                </span>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                    PRIORITY_CONFIG[selectedTask.priority]?.style
                  }`}
                >
                  {PRIORITY_CONFIG[selectedTask.priority]?.label} Priority
                </span>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body Content */}
            <div className="p-6 space-y-6 flex-1">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 leading-snug">
                  {selectedTask.title}
                </h2>
              </div>

              {selectedTask.description && (
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Description
                  </span>
                  <div className="text-sm text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 whitespace-pre-wrap leading-relaxed">
                    {selectedTask.description}
                  </div>
                </div>
              )}

              {selectedTask.due_date && (
                <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <Calendar size={15} className="text-zinc-400" />
                  <span>Due {format(new Date(selectedTask.due_date), 'MMMM d, yyyy')}</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={() => deleteTask(selectedTask.id)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:underline"
                >
                  <Trash2 size={13} /> Delete this task
                </button>
              </div>

              {/* Comments Section */}
              <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <MessageSquare size={16} className="text-zinc-400" />
                    <span>Activity & Comments</span>
                    <span className="text-xs font-normal text-zinc-400">({comments.length})</span>
                  </h3>
                </div>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {comments.length === 0 ? (
                    <div className="text-center py-8 rounded-2xl bg-zinc-50 dark:bg-zinc-800/30 border border-dashed border-zinc-200 dark:border-zinc-800">
                      <p className="text-xs text-zinc-400">No comments yet. Start the discussion!</p>
                    </div>
                  ) : (
                    comments.map(c => (
                      <div key={c.id} className="flex gap-3 items-start">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 shadow-2xs mt-0.5"
                          style={{ backgroundColor: project.color || '#6366f1' }}
                        >
                          {c.author?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 bg-zinc-100/80 dark:bg-zinc-800/70 rounded-2xl px-4 py-2.5 border border-zinc-200/50 dark:border-zinc-700/50">
                          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-200">
                            {c.author?.name}
                          </p>
                          <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-1 leading-relaxed">
                            {c.content}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Comment Input */}
                <div className="flex gap-2 pt-2">
                  <input
                    className="input text-sm flex-1"
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addComment()}
                  />
                  <button
                    className="btn-primary text-sm px-4 py-2.5"
                    onClick={addComment}
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-zinc-950/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-sm p-6 animate-pop shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100">Add Team Member</h2>
              <button
                onClick={() => setShowMemberModal(false)}
                className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3.5">
              Enter their registered email address to collaborate on this board.
            </p>
            <input
              className="input text-sm mb-4"
              placeholder="teammate@example.com"
              value={memberEmail}
              onChange={e => setMemberEmail(e.target.value)}
            />
            <button className="btn-primary w-full py-2.5 text-sm" onClick={addMember}>
              Add to Project
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
