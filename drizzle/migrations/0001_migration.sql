-- The designated admin email becomes an admin only once the address is confirmed
-- (created as confirmed by the project owner, or confirmed via the inbox).
create or replace function public.provision_admin(_id uuid, _email text, _name text, _phone text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.admins (admin_id, name, email, phone, role)
  values (_id, coalesce(nullif(_name, ''), split_part(_email, '@', 1)), _email, nullif(_phone, ''), 'Super Admin')
  on conflict (admin_id) do nothing;
  insert into public.user_roles (user_id, role) values (_id, 'admin') on conflict do nothing;
  update public.clubs set created_by = _id where created_by is null;
  update public.events set created_by = _id where created_by is null;
end;
$$;

revoke execute on function public.provision_admin(uuid, text, text, text) from public, anon, authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  sem text := new.raw_user_meta_data ->> 'semester';
  is_admin_email boolean := lower(new.email) = 'admin@campus.edu';
begin
  if coalesce(new.raw_app_meta_data ->> 'seed_role', '') = 'admin'
     or (is_admin_email and new.email_confirmed_at is not null) then
    perform public.provision_admin(new.id, new.email, new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'phone');
  elsif is_admin_email then
    -- Unconfirmed sign-up for the admin address: wait for confirmation.
    null;
  else
    insert into public.students (student_id, name, email, phone, department, semester)
    values (
      new.id,
      coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(new.email, '@', 1)),
      new.email,
      nullif(new.raw_user_meta_data ->> 'phone', ''),
      nullif(new.raw_user_meta_data ->> 'department', ''),
      case when sem ~ '^[0-9]{1,2}$' and sem::int between 1 and 12 then sem::smallint else null end
    )
    on conflict (student_id) do nothing;
    insert into public.user_roles (user_id, role) values (new.id, 'student') on conflict do nothing;
  end if;
  return new;
end;
$$;

create or replace function public.handle_user_confirmed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.email_confirmed_at is null and new.email_confirmed_at is not null
     and lower(new.email) = 'admin@campus.edu' then
    perform public.provision_admin(new.id, new.email, new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'phone');
  end if;
  return new;
end;
$$;

create trigger on_auth_user_confirmed
  after update of email_confirmed_at on auth.users
  for each row execute function public.handle_user_confirmed();

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_user_confirmed() from public, anon, authenticated;
revoke execute on function public.guard_registration_update() from public, anon, authenticated;
revoke execute on function public.guard_student_update() from public, anon, authenticated;