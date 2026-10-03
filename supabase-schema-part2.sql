-- Part 2: Realtime enable karo
-- Pehle Part 1 run karo, phir yeh chalao

alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.notifications;

select 'Part 2 complete! Realtime enabled ✅' as status;
