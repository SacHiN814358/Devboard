import { createClient } from '../../../lib/supabase/server'
import { redirect } from 'next/navigation'
import KanbanBoard from './KanbanBoard'

export const dynamic = 'force-dynamic'

export default async function ProjectPage({ params }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const resolvedParams = await params

  const { data: project, error } = await supabase
    .from('projects')
    .select(`
      *,
      profiles:owner_id(id, name),
      project_members(id, role, profiles(id, name))
    `)
    .eq('id', resolvedParams.id)
    .single()

  if (error || !project) redirect('/dashboard')

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', resolvedParams.id)
    .order('created_at', { ascending: false })

  // Fetch comment counts per task in this project
  const taskIds = (tasks || []).map(t => t.id)

  let commentCountMap = {}
  if (taskIds.length > 0) {
    const { data: commentRows } = await supabase
      .from('comments')
      .select('task_id')
      .in('task_id', taskIds)

    // Count comments per task_id
    ;(commentRows || []).forEach(row => {
      commentCountMap[row.task_id] = (commentCountMap[row.task_id] || 0) + 1
    })
  }

  const tasksWithCounts = (tasks || []).map(task => ({
    ...task,
    comment_count: commentCountMap[task.id] || 0,
  }))

  return (
    <KanbanBoard
      project={project}
      initialTasks={tasksWithCounts}
      user={user}
    />
  )
}
