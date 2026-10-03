-- Part 1: Tables + RLS + Trigger
-- Pehle purana sab drop karo (agar partial create hua ho)
drop table if exists public.notifications cascade;
drop table if exists public.comments cascade;
drop table if exists public.tasks cascade;
drop table if exists public.project_members cascade;
drop table if exists public.projects cascade;
drop table if exists public.profiles cascade;
drop function if exists public.handle_new_user() cascade;

-- Profiles table
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  avatar_url text,
  created_at timestamptz default now()
);

-- Projects table
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  color text default '#6366f1',
  owner_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now()
);

-- Project Members
create table public.project_members (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text default 'MEMBER',
  joined_at timestamptz default now(),
  unique(project_id, user_id)
);

-- Tasks table
create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  status text default 'TODO',
  priority text default 'MEDIUM',
  due_date date,
  project_id uuid references public.projects(id) on delete cascade not null,
  assignee_id uuid references public.profiles(id) on delete set null,
  creator_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now()
);

-- Comments table
create table public.comments (
  id uuid default gen_random_uuid() primary key,
  content text not null,
  task_id uuid references public.tasks(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now()
);

-- Notifications table
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  message text not null,
  type text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- RLS Enable
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.tasks enable row level security;
alter table public.comments enable row level security;
alter table public.notifications enable row level security;

-- Profiles policies
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- Projects policies
create policy "projects_select" on public.projects for select
  using (owner_id = auth.uid() or exists (
    select 1 from public.project_members where project_id = id and user_id = auth.uid()
  ));
create policy "projects_insert" on public.projects for insert with check (auth.uid() = owner_id);
create policy "projects_update" on public.projects for update using (auth.uid() = owner_id);
create policy "projects_delete" on public.projects for delete using (auth.uid() = owner_id);

-- Project Members policies
create policy "members_select" on public.project_members for select
  using (exists (select 1 from public.project_members pm where pm.project_id = project_id and pm.user_id = auth.uid()));
create policy "members_insert" on public.project_members for insert
  with check (
    exists (select 1 from public.projects where id = project_id and owner_id = auth.uid())
    or auth.uid() = user_id
  );
create policy "members_delete" on public.project_members for delete
  using (exists (select 1 from public.projects where id = project_id and owner_id = auth.uid()));

-- Tasks policies
create policy "tasks_select" on public.tasks for select
  using (exists (select 1 from public.project_members where project_id = tasks.project_id and user_id = auth.uid()));
create policy "tasks_insert" on public.tasks for insert
  with check (exists (select 1 from public.project_members where project_id = tasks.project_id and user_id = auth.uid()));
create policy "tasks_update" on public.tasks for update
  using (exists (select 1 from public.project_members where project_id = tasks.project_id and user_id = auth.uid()));
create policy "tasks_delete" on public.tasks for delete
  using (creator_id = auth.uid() or exists (select 1 from public.projects where id = tasks.project_id and owner_id = auth.uid()));

-- Comments policies
create policy "comments_select" on public.comments for select using (true);
create policy "comments_insert" on public.comments for insert with check (auth.uid() = author_id);
create policy "comments_delete" on public.comments for delete using (auth.uid() = author_id);

-- Notifications policies
create policy "notifications_select" on public.notifications for select using (auth.uid() = user_id);
create policy "notifications_update" on public.notifications for update using (auth.uid() = user_id);

-- Auto profile trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

select 'Part 1 complete! Saari tables ban gayi ✅' as status;
