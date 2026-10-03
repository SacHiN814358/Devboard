'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { createClient } from '../../../lib/supabase/client'
import Navbar from '../../../components/Navbar'
import { ArrowLeft, Plus, X, Flame, MessageSquare, Loader2, Users } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { format } from 'date-fns'

const COLUMNS = [
  { id: 'TODO', label: '📋 To Do', bg: 'bg-gray-50 dark:bg-gray-800/50' },
  { id: 'IN_PROGRESS', label: '⚙️ In Progress', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  { id: 'DONE', label: '✅ Done', bg: 'bg-green-50 dark:bg-green-900/20' },
]

const PRIORITY_COLOR = { HIGH: 'text-red-500', MEDIUM: 'text-yellow-500', LOW: 'text-green-500' }

export default function KanbanBoard({ project, initialTasks, user }) {
  const router = useRouter()
  const supabase = createClient()
  const [tasks, setTasks] = useState(initialTasks)
  const [selectedTask, setSelectedTask] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [showAddTask, setShowAddTask] = useState(null)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [memberEmail, setMemberEmail] = useState('')
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'MEDIUM', due_date: '' })

  // Supabase Realtime — live task updates
  useEffect(() => {
    const channel = supabase
      .channel(`project-${project.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'tasks',
        filter: `project_id=eq.${project.id}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          if (payload.new.creator_id !== user.id) {
            setTasks(prev => [payload.new, ...prev])
            toast(`Naya task add hua: "${payload.new.title}"`, { icon: '📋' })
          }
        } else if (payload.eventType === 'UPDATE') {
          setTasks(prev => prev.map(t => t.id === payload.new.id ? { ...t, ...payload.new } : t))
        } else if (payload.eventType === 'DELETE') {
          setTasks(prev => prev.filter(t => t.id !== payload.old.id))
        }
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
        title: taskForm.title,
        description: taskForm.description || null,
        priority: taskForm.priority,
        due_date: taskForm.due_date || null,
        status,
        project_id: project.id,
        creator_id: user.id,
      })
      .select(`*, assignee:assignee_id(id, name), creator:creator_id(id, name)`)
      .single()

    if (error) return toast.error('Task nahi bana')
    setTasks(prev => [data, ...prev])
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
    const { data, error } = await supabase
      .from('comments')
      .select(`*, profiles:author_id(id, name)`)
      .eq('task_id', task.id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Comments fetch error:', error)
    }

    const formatted = (data || []).map(c => ({
      ...c,
      author: c.profiles || { name: 'User' }
    }))
    setComments(formatted)
  }

  const addComment = async () => {
    if (!newComment.trim()) return
    const { data, error } = await supabase
      .from('comments')
      .insert({ content: newComment, task_id: selectedTask.id, author_id: user.id })
      .select(`*, profiles:author_id(id, name)`)
      .single()

    if (error) {
      toast.error('Comment nahi hua: ' + error.message)
      return
    }

    const formattedComment = {
      ...data,
      author: data.profiles || { name: userName }
    }

    setComments(prev => [...prev, formattedComment])
    setNewComment('')
    toast.success('Comment post ho gaya!')
  }

  const addMember = async () => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('email', memberEmail)
      .single()

    if (!profile) return toast.error('Yeh user nahi mila. Pehle register karna hoga.')
    await supabase.from('project_members').upsert({ project_id: project.id, user_id: profile.id })
    toast.success(`${profile.name} ko add kar diya!`)
    setMemberEmail('')
    setShowMemberModal(false)
  }

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0]

  return (
    <div className="min-h-screen">
      <Navbar />
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl shadow-sm" style={{ backgroundColor: project.color }} />
            <div>
              <h1 className="text-xl font-bold">{project.name}</h1>
              {project.description && <p className="text-sm text-gray-500">{project.description}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {project.project_members?.slice(0, 5).map(m => (
                <div key={m.id} title={m.profiles?.name}
                  className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: project.color }}>
                  {m.profiles?.name?.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
            {project.owner_id === user.id && (
              <button onClick={() => setShowMemberModal(true)} className="btn-secondary text-sm py-1.5">
                <Users size={15} /> Add Member
              </button>
            )}
          </div>
        </div>

        {/* Kanban Board */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {COLUMNS.map(col => (
              <div key={col.id} className={`rounded-2xl p-3 ${col.bg} min-h-[500px]`}>
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="font-semibold text-sm">{col.label}</span>
                  <span className="bg-white dark:bg-gray-800 text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                    {getByStatus(col.id).length}
                  </span>
                </div>

                <Droppable droppableId={col.id}>
                  {(provided, snap) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}
                      className={`space-y-2 min-h-[80px] rounded-xl transition-colors p-1 ${snap.isDraggingOver ? 'bg-primary-100/50 dark:bg-primary-900/20' : ''}`}>
                      {getByStatus(col.id).map((task, i) => (
                        <Draggable key={task.id} draggableId={task.id} index={i}>
                          {(provided, snap) => (
                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                              onClick={() => openTask(task)}
                              className={`card p-3.5 cursor-pointer hover:shadow-md transition-all ${snap.isDragging ? 'shadow-xl rotate-1 scale-105' : ''}`}>
                              <div className="flex items-start gap-2">
                                <p className="text-sm font-medium flex-1 line-clamp-2">{task.title}</p>
                                <Flame size={14} className={`flex-shrink-0 mt-0.5 ${PRIORITY_COLOR[task.priority]}`} />
                              </div>
                              {task.due_date && (
                                <p className="text-xs text-gray-400 mt-1.5">
                                  📅 {format(new Date(task.due_date), 'MMM d')}
                                </p>
                              )}
                              <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-100 dark:border-gray-700">
                                {task.assignee ? (
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                      style={{ backgroundColor: project.color }}>
                                      {task.assignee.name.charAt(0)}
                                    </div>
                                    <span className="text-xs text-gray-500">{task.assignee.name.split(' ')[0]}</span>
                                  </div>
                                ) : <div />}
                                <div className="flex items-center gap-1 text-xs text-gray-400">
                                  <MessageSquare size={11} /> 0
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
                  <div className="mt-2 card p-3 space-y-2">
                    <input autoFocus className="input text-sm" placeholder="Task ka naam..."
                      value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                      onKeyDown={e => e.key === 'Enter' && createTask(col.id)} />
                    <textarea className="input text-sm resize-none" rows={2} placeholder="Description..."
                      value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} />
                    <select className="input text-sm" value={taskForm.priority}
                      onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}>
                      <option value="LOW">🟢 Low</option>
                      <option value="MEDIUM">🟡 Medium</option>
                      <option value="HIGH">🔴 High</option>
                    </select>
                    <input type="date" className="input text-sm" value={taskForm.due_date}
                      onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })} />
                    <div className="flex gap-2">
                      <button className="btn-primary flex-1 text-sm py-1.5" onClick={() => createTask(col.id)}>Add</button>
                      <button className="btn-secondary text-sm py-1.5 px-3" onClick={() => setShowAddTask(null)}><X size={14} /></button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowAddTask(col.id)}
                    className="mt-2 w-full flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-2 rounded-xl hover:bg-white/60 dark:hover:bg-gray-700/40 transition-colors">
                    <Plus size={15} /> Task add karo
                  </button>
                )}
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* Task Drawer */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end"
          onClick={() => setSelectedTask(null)}>
          <div className="w-full max-w-md bg-white dark:bg-gray-800 h-full overflow-y-auto shadow-2xl animate-slide-in"
            onClick={e => e.stopPropagation()}>
            <div className="p-6 space-y-5">
              <div className="flex items-start justify-between">
                <h2 className="text-lg font-bold flex-1 pr-4">{selectedTask.title}</h2>
                <button onClick={() => setSelectedTask(null)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  selectedTask.status === 'TODO' ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300' :
                  selectedTask.status === 'IN_PROGRESS' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600' :
                  'bg-green-100 dark:bg-green-900/40 text-green-600'}`}>
                  {selectedTask.status === 'IN_PROGRESS' ? 'In Progress' : selectedTask.status === 'TODO' ? 'To Do' : 'Done'}
                </span>
                <span className={`text-xs font-medium ${PRIORITY_COLOR[selectedTask.priority]}`}>
                  🔥 {selectedTask.priority}
                </span>
              </div>

              {selectedTask.description && (
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase mb-1">Description</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{selectedTask.description}</p>
                </div>
              )}

              {selectedTask.due_date && (
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase mb-1">Due Date</p>
                  <p className="text-sm">📅 {format(new Date(selectedTask.due_date), 'MMMM d, yyyy')}</p>
                </div>
              )}

              {selectedTask.assignee && (
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase mb-1">Assigned To</p>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: project.color }}>
                      {selectedTask.assignee.name.charAt(0)}
                    </div>
                    <span className="text-sm">{selectedTask.assignee.name}</span>
                  </div>
                </div>
              )}

              <button onClick={() => deleteTask(selectedTask.id)}
                className="text-sm text-red-500 hover:text-red-600 hover:underline">
                🗑️ Task delete karo
              </button>

              {/* Comments */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <p className="text-xs font-medium text-gray-400 uppercase mb-3">Comments ({comments.length})</p>
                <div className="space-y-3 max-h-64 overflow-y-auto mb-3">
                  {comments.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">Pehla comment likho! 💬</p>
                  ) : comments.map(c => (
                    <div key={c.id} className="flex gap-2.5">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: project.color }}>
                        {c.author?.name?.charAt(0)}
                      </div>
                      <div className="flex-1 bg-gray-50 dark:bg-gray-700/50 rounded-xl px-3 py-2">
                        <p className="text-xs font-semibold text-gray-500">{c.author?.name}</p>
                        <p className="text-sm mt-0.5">{c.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input className="input text-sm flex-1" placeholder="Comment likho..."
                    value={newComment} onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addComment()} />
                  <button className="btn-primary text-sm px-4 py-2" onClick={addComment}>Send</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-sm p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Member Add Karo</h2>
              <button onClick={() => setShowMemberModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-3">Member ki email daalo (unka account pehle se hona chahiye)</p>
            <input className="input text-sm mb-3" placeholder="member@example.com"
              value={memberEmail} onChange={e => setMemberEmail(e.target.value)} />
            <button className="btn-primary w-full" onClick={addMember}>
              <Users size={16} /> Add Member
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
