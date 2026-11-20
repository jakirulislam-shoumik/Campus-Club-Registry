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
  if is_admin_email then
    -- The designated admin address is provisioned once it is confirmed.
    if new.email_confirmed_at is not null then
      perform public.provision_admin(new.id, new.email, new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'phone');
    end if;
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

revoke execute on function public.handle_new_user() from public, anon, authenticated;