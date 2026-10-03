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
      creator:creator_id(id, name),
      comments:comments(id)
    `)
    .eq('project_id', params.id)
    .order('created_at', { ascending: false })

  return (
    <KanbanBoard
      project={project}
      initialTasks={tasks || []}
      user={user}
    />
  )
}
