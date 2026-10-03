-- Trigger hata do (yahi problem hai)
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Pehle ka failed user clean karo
delete from auth.users where email = 'sachingupta00134@gmail.com';

select 'Done! Ab register karo ✅' as status;
