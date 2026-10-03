-- Create profiles for auth users that signed up before the on_auth_user_created
-- trigger existed (the init migration reached production after the first sign-ups).
-- Safe to re-run: existing profiles are left alone.

insert into public.profiles (id)
select u.id
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);
