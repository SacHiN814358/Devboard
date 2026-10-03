import { createClient } from '../../../lib/supabase/server'
import { redirect } from 'next/navigation'
import KanbanBoard from './KanbanBoard'

export default async function ProjectPage({ params }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: project, error } = await supabase
    .from('projects')
    .select(`
      *,
      profiles:owner_id(id, name),
      project_members(id, role, profiles(id, name))
    `)
    .eq('id', params.id)
    .single()

  if (error || !project) redirect('/dashboard')

  const { data: tasks } = await supabase
    .from('tasks')
    .select(`
      *,
      assignee:assignee_id(id, name),
      creator:creator_id(id, name)
    `)
    .eq('project_id', params.id)
    .order('created_at', { ascending: false })

  const { data: allComments } = await supabase
    .from('comments')
    .select('id, task_id')

  const tasksWithCommentCount = (tasks || []).map(task => ({
    ...task,
    comment_count: (allComments || []).filter(c => c.task_id === task.id).length
  }))

  return (
    <KanbanBoard
      project={project}
      initialTasks={tasksWithCommentCount}
      user={user}
    />
  )
}
