'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { createClient } from '../../../lib/supabase/client'
import Navbar from '../../../components/Navbar'
import { ArrowLeft, Plus, X, Flame, MessageSquare, Users } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { format } from 'date-fns'

const COLUMNS = [
  { id: 'TODO', label: '📋 To Do', bg: 'bg-gray-100/90 dark:bg-gray-900/90 border border-gray-200/80 dark:border-gray-800' },
  { id: 'IN_PROGRESS', label: '⚙️ In Progress', bg: 'bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/40' },
  { id: 'DONE', label: '✅ Done', bg: 'bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/40' },
]

const PRIORITY_COLOR = {
  HIGH: 'text-red-600 dark:text-red-400',
  MEDIUM: 'text-amber-600 dark:text-amber-400',
  LOW: 'text-emerald-600 dark:text-emerald-400',
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
            toast(`Naya task add hua: "${payload.new.title}"`, { icon: '📋' })
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
        // Increment comment count for the corresponding task
        setTasks(prev => prev.map(t => {
          if (t.id === addedComment.task_id) {
            return { ...t, comment_count: (Number(t.comment_count) || 0) + 1 }
          }
          return t
        }))
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [project.id])

  const getByStatus = (status) => tasks.filter(t => t.status === status)

  const onDragEnd = async ({ destination, source, draggableId }) => {
    if (!destination || destination.droppableId === source.droppableId) return
    const newStatus = destination.droppableId
    setTasks(prev => prev.map(t => t.id === draggableId ? { ...t, status: newStatus } : t))
    await supabase.from('tasks').update({ status: newStatus }).eq('id', draggableId)
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

    if (error) return toast.error('Task nahi bana: ' + error.message)

    setTasks(prev => [{ ...data, comment_count: 0 }, ...prev])
    setShowAddTask(null)
    setTaskForm({ title: '', description: '', priority: 'MEDIUM', due_date: '' })
    toast.success('Task add ho gaya!')
  }

  const deleteTask = async (taskId) => {
    if (!confirm('Task delete karna hai?')) return
    await supabase.from('tasks').delete().eq('id', taskId)
    setTasks(prev => prev.filter(t => t.id !== taskId))
    setSelectedTask(null)
    toast.success('Task delete ho gaya')
  }

  const openTask = async (task) => {
    setSelectedTask(task)
    setNewComment('')

    // Fetch comments for this specific task
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
      toast.error('Comment nahi hua: ' + error.message)
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

    toast.success('Comment post ho gaya!')
  }

  const addMember = async () => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('email', memberEmail.trim())
      .single()

    if (!profile) return toast.error('Yeh user nahi mila. Pehle register karna hoga.')
    await supabase.from('project_members').upsert({ project_id: project.id, user_id: profile.id })
    toast.success(`${profile.name} ko add kar diya!`)
    setMemberEmail('')
    setShowMemberModal(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
      <Navbar />
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
            title="Dashboard wapas jao"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl shadow-sm flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: project.color }}>
              {project.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{project.name}</h1>
              {project.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{project.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {project.project_members?.slice(0, 5).map(m => (
                <div
                  key={m.id}
                  title={m.profiles?.name}
                  className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center text-white text-xs font-bold shadow-sm"
                  style={{ backgroundColor: project.color }}
                >
                  {m.profiles?.name?.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
            {project.owner_id === user.id && (
              <button onClick={() => setShowMemberModal(true)} className="btn-secondary text-sm py-1.5 px-3">
                <Users size={15} /> Add Member
              </button>
            )}
          </div>
        </div>

        {/* Kanban Board Columns */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {COLUMNS.map(col => (
              <div key={col.id} className={`rounded-2xl p-4 ${col.bg} min-h-[520px] flex flex-col shadow-sm`}>
                <div className="flex items-center justify-between mb-4 px-1">
                  <span className="font-bold text-sm text-gray-900 dark:text-gray-100">{col.label}</span>
                  <span className="bg-indigo-600 text-white dark:bg-indigo-500 text-xs font-extrabold px-2.5 py-0.5 rounded-full shadow-sm min-w-[24px] text-center">
                    {getByStatus(col.id).length}
                  </span>
                </div>

                <Droppable droppableId={col.id}>
                  {(provided, snap) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-3 flex-1 min-h-[80px] rounded-xl transition-colors p-1 ${
                        snap.isDraggingOver ? 'bg-indigo-100/60 dark:bg-indigo-950/40' : ''
                      }`}
                    >
                      {getByStatus(col.id).map((task, i) => (
                        <Draggable key={task.id} draggableId={task.id} index={i}>
                          {(provided, snap) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => openTask(task)}
                              className={`card p-4 cursor-pointer hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-600 transition-all ${
                                snap.isDragging ? 'shadow-xl rotate-1 scale-105 ring-2 ring-indigo-500' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex-1 line-clamp-2">
                                  {task.title}
                                </p>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <Flame size={15} className={PRIORITY_COLOR[task.priority]} />
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    {task.priority}
                                  </span>
                                </div>
                              </div>

                              {task.description && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                                  {task.description}
                                </p>
                              )}

                              <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-800">
                                <div className="flex items-center gap-2">
                                  {task.due_date && (
                                    <span className="text-xs text-gray-600 dark:text-gray-400 font-medium bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">
                                      📅 {format(new Date(task.due_date), 'MMM d')}
                                    </span>
                                  )}
                                  {task.assignee && (
                                    <div className="flex items-center gap-1.5">
                                      <div
                                        className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm"
                                        style={{ backgroundColor: project.color }}
                                      >
                                        {task.assignee.name.charAt(0)}
                                      </div>
                                      <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                                        {task.assignee.name.split(' ')[0]}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* High-Contrast Comment Badge */}
                                <div
                                  className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800 shadow-xs"
                                  title={`${task.comment_count || 0} comments`}
                                >
                                  <MessageSquare size={13} className="text-indigo-600 dark:text-indigo-400" />
                                  <span>{task.comment_count || 0}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

                {/* Add Task Form */}
                {showAddTask === col.id ? (
                  <div className="mt-3 card p-3.5 space-y-2.5 shadow-md">
                    <input
                      autoFocus
                      className="input text-sm"
                      placeholder="Task ka naam..."
                      value={taskForm.title}
                      onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                      onKeyDown={e => e.key === 'Enter' && createTask(col.id)}
                    />
                    <textarea
                      className="input text-sm resize-none"
                      rows={2}
                      placeholder="Description..."
                      value={taskForm.description}
                      onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        className="input text-sm"
                        value={taskForm.priority}
                        onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
                      >
                        <option value="LOW">🟢 Low Priority</option>
                        <option value="MEDIUM">🟡 Medium Priority</option>
                        <option value="HIGH">🔴 High Priority</option>
                      </select>
                      <input
                        type="date"
                        className="input text-sm"
                        value={taskForm.due_date}
                        onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button className="btn-primary flex-1 text-sm py-2" onClick={() => createTask(col.id)}>
                        Add Task
                      </button>
                      <button className="btn-secondary text-sm py-2 px-3" onClick={() => setShowAddTask(null)}>
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddTask(col.id)}
                    className="mt-3 w-full flex items-center justify-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 p-2.5 rounded-xl hover:bg-white/80 dark:hover:bg-gray-800/80 border border-dashed border-gray-300 dark:border-gray-700 transition-colors"
                  >
                    <Plus size={16} /> Task add karo
                  </button>
                )}
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* Task Drawer */}
      {selectedTask && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-end"
          onClick={() => setSelectedTask(null)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 h-full overflow-y-auto shadow-2xl animate-slide-in border-l border-gray-200 dark:border-gray-800"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 space-y-6">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex-1 leading-snug">
                  {selectedTask.title}
                </h2>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-wrap gap-2.5">
                <span className={`text-xs px-3 py-1 rounded-full font-bold shadow-xs ${
                  selectedTask.status === 'TODO' ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700' :
                  selectedTask.status === 'IN_PROGRESS' ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800' :
                  'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                }`}>
                  {selectedTask.status === 'IN_PROGRESS' ? 'In Progress' : selectedTask.status === 'TODO' ? 'To Do' : 'Done'}
                </span>
                <span className={`text-xs font-bold px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 ${PRIORITY_COLOR[selectedTask.priority]}`}>
                  🔥 {selectedTask.priority}
                </span>
              </div>

              {selectedTask.description && (
                <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                    Description
                  </p>
                  <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                    {selectedTask.description}
                  </p>
                </div>
              )}

              {selectedTask.due_date && (
                <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Due Date
                  </p>
                  <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                    📅 {format(new Date(selectedTask.due_date), 'MMMM d, yyyy')}
                  </p>
                </div>
              )}

              {selectedTask.assignee && (
                <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                    Assigned To
                  </p>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
                      style={{ backgroundColor: project.color }}
                    >
                      {selectedTask.assignee.name.charAt(0)}
                    </div>
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{selectedTask.assignee.name}</span>
                  </div>
                </div>
              )}

              <div>
                <button
                  onClick={() => deleteTask(selectedTask.id)}
                  className="text-sm font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:underline transition-colors"
                >
                  🗑️ Task delete karo
                </button>
              </div>

              {/* Comments Section */}
              <div className="border-t border-gray-200 dark:border-gray-800 pt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Comments ({comments.length})
                  </p>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {comments.length === 0 ? (
                    <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                      Pehla comment likho! 💬
                    </p>
                  ) : (
                    comments.map(c => (
                      <div key={c.id} className="flex gap-2.5">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-xs"
                          style={{ backgroundColor: project.color }}
                        >
                          {c.author?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-xl px-3.5 py-2.5 border border-gray-200/80 dark:border-gray-700/80">
                          <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{c.author?.name}</p>
                          <p className="text-sm mt-0.5 text-gray-900 dark:text-gray-100">{c.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <input
                    className="input text-sm flex-1"
                    placeholder="Comment likho..."
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addComment()}
                  />
                  <button className="btn-primary text-sm px-4 py-2 font-semibold" onClick={addComment}>
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-sm p-6 animate-fade-in shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg text-gray-900 dark:text-gray-100">Member Add Karo</h2>
              <button
                onClick={() => setShowMemberModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Member ki email daalo (unka account pehle se hona chahiye)
            </p>
            <input
              className="input text-sm mb-4"
              placeholder="member@example.com"
              value={memberEmail}
              onChange={e => setMemberEmail(e.target.value)}
            />
            <button className="btn-primary w-full py-2.5" onClick={addMember}>
              <Users size={16} /> Add Member
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
