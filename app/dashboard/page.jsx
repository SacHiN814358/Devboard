import { createClient } from '../../lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Server mein projects fetch karo
  const { data: projects } = await supabase
    .from('projects')
    .select(`
      *,
      profiles!projects_owner_id_fkey(id, name),
      project_members(id, role, profiles(id, name))
    `)
    .order('created_at', { ascending: false })

  const { count: taskCount } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })

  return (
    <DashboardClient
      initialProjects={projects || []}
      taskCount={taskCount || 0}
      user={user}
    />
  )
}
