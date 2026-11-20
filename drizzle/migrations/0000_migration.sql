-- Enums
create type public.app_role as enum ('admin', 'student');
create type public.admin_level as enum ('Super Admin', 'Club Admin');
create type public.club_status as enum ('Active', 'Inactive');
create type public.membership_status as enum ('Pending', 'Active', 'Rejected');
create type public.club_role as enum ('Member', 'Executive');
create type public.registration_status as enum ('Registered', 'Cancelled', 'Attended');

-- user_roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Users read own roles" on public.user_roles
  for select to authenticated using (user_id = auth.uid());
create policy "Admins read all roles" on public.user_roles
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

-- students
create table public.students (
  student_id uuid primary key,
  name text not null,
  email text not null unique,
  phone text,
  department text,
  semester smallint check (semester between 1 and 12),
  registration_date timestamptz not null default now()
);
grant select, update on public.students to authenticated;
grant all on public.students to service_role;
alter table public.students enable row level security;
create policy "Students read own profile" on public.students
  for select to authenticated using (student_id = auth.uid());
create policy "Admins read all students" on public.students
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Students update own profile" on public.students
  for update to authenticated using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy "Admins update students" on public.students
  for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- admins
create table public.admins (
  admin_id uuid primary key,
  name text not null,
  email text not null unique,
  phone text,
  role public.admin_level not null default 'Club Admin'
);
grant select, insert, update, delete on public.admins to authenticated;
grant all on public.admins to service_role;
alter table public.admins enable row level security;
create policy "Admins read admins" on public.admins
  for select to authenticated using (admin_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "Admins manage admins" on public.admins
  for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- clubs
create table public.clubs (
  club_id uuid primary key default gen_random_uuid(),
  club_name text not null unique,
  description text not null default '',
  category text not null,
  email text not null unique,
  established_date date,
  status public.club_status not null default 'Active',
  created_by uuid references public.admins(admin_id) on delete set null,
  created_at timestamptz not null default now()
);
create index clubs_status_idx on public.clubs(status);
create index clubs_created_by_idx on public.clubs(created_by);
grant select, insert, update, delete on public.clubs to authenticated;
grant all on public.clubs to service_role;
alter table public.clubs enable row level security;
create policy "Anyone signed in reads active clubs" on public.clubs
  for select to authenticated using (status = 'Active' or public.has_role(auth.uid(), 'admin'));
create policy "Admins manage clubs" on public.clubs
  for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- memberships
create table public.memberships (
  membership_id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(student_id) on delete cascade,
  club_id uuid not null references public.clubs(club_id) on delete cascade,
  join_date timestamptz not null default now(),
  status public.membership_status not null default 'Pending',
  role_in_club public.club_role not null default 'Member',
  unique (student_id, club_id)
);
create index memberships_club_idx on public.memberships(club_id);
create index memberships_status_idx on public.memberships(status);
grant select, insert, update, delete on public.memberships to authenticated;
grant all on public.memberships to service_role;
alter table public.memberships enable row level security;
create policy "Students read own memberships" on public.memberships
  for select to authenticated using (student_id = auth.uid());
create policy "Students request membership" on public.memberships
  for insert to authenticated with check (
    student_id = auth.uid()
    and status = 'Pending'
    and role_in_club = 'Member'
    and exists (select 1 from public.clubs c where c.club_id = memberships.club_id and c.status = 'Active')
  );
create policy "Admins manage memberships" on public.memberships
  for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- events
create table public.events (
  event_id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(club_id) on delete cascade,
  event_name text not null,
  description text not null default '',
  event_date date not null,
  start_time time not null,
  end_time time not null,
  venue text not null,
  created_by uuid references public.admins(admin_id) on delete set null,
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);
create index events_club_idx on public.events(club_id);
create index events_date_idx on public.events(event_date);
create index events_created_by_idx on public.events(created_by);
grant select, insert, update, delete on public.events to authenticated;
grant all on public.events to service_role;
alter table public.events enable row level security;
create policy "Signed in users read events" on public.events
  for select to authenticated using (true);
create policy "Admins manage events" on public.events
  for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- event_registrations
create table public.event_registrations (
  registration_id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(student_id) on delete cascade,
  event_id uuid not null references public.events(event_id) on delete cascade,
  registration_date timestamptz not null default now(),
  status public.registration_status not null default 'Registered',
  feedback text check (feedback is null or char_length(feedback) <= 1000),
  unique (student_id, event_id)
);
create index event_registrations_event_idx on public.event_registrations(event_id);
grant select, insert, update, delete on public.event_registrations to authenticated;
grant all on public.event_registrations to service_role;
alter table public.event_registrations enable row level security;
create policy "Students read own registrations" on public.event_registrations
  for select to authenticated using (student_id = auth.uid());
create policy "Students register for events of active clubs" on public.event_registrations
  for insert to authenticated with check (
    student_id = auth.uid()
    and status = 'Registered'
    and feedback is null
    and exists (
      select 1 from public.events e join public.clubs c on c.club_id = e.club_id
      where e.event_id = event_registrations.event_id and c.status = 'Active' and e.event_date >= current_date
    )
  );
create policy "Students update own registrations" on public.event_registrations
  for update to authenticated using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy "Admins manage registrations" on public.event_registrations
  for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- Students may only: cancel an upcoming registration, re-register a cancelled one
-- (upcoming event, active club), or leave feedback once marked Attended.
create or replace function public.guard_registration_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ev_date date;
  club_active boolean;
begin
  if public.has_role(auth.uid(), 'admin') or auth.uid() is null then
    return new;
  end if;

  if new.student_id <> old.student_id or new.event_id <> old.event_id
     or new.registration_date <> old.registration_date then
    raise exception 'You can only change the status or feedback of your own registration.';
  end if;

  select e.event_date, (c.status = 'Active') into ev_date, club_active
  from public.events e join public.clubs c on c.club_id = e.club_id
  where e.event_id = new.event_id;

  if new.status <> old.status then
    if old.status = 'Registered' and new.status = 'Cancelled' then
      if ev_date < current_date then
        raise exception 'This event has already happened, so the registration cannot be cancelled.';
      end if;
    elsif old.status = 'Cancelled' and new.status = 'Registered' then
      if ev_date < current_date or not club_active then
        raise exception 'Registration is closed for this event.';
      end if;
    else
      raise exception 'Only an admin can change a registration to %.', new.status;
    end if;
  end if;

  if new.feedback is distinct from old.feedback and old.status <> 'Attended' then
    raise exception 'Feedback can be added once the event is marked Attended.';
  end if;

  return new;
end;
$$;

create trigger guard_registration_update
  before update on public.event_registrations
  for each row execute function public.guard_registration_update();

-- Students may update only their contact/profile fields, not id/email/registration date.
create or replace function public.guard_student_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.has_role(auth.uid(), 'admin') or auth.uid() is null then
    return new;
  end if;
  if new.student_id <> old.student_id or new.email <> old.email
     or new.registration_date <> old.registration_date then
    raise exception 'You can only update your name, phone, department and semester.';
  end if;
  return new;
end;
$$;

create trigger guard_student_update
  before update on public.students
  for each row execute function public.guard_student_update();

-- New auth user -> student profile + role. Admins are seeded with app metadata
-- (only settable server-side), never from user-editable metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  sem text := new.raw_user_meta_data ->> 'semester';
begin
  if coalesce(new.raw_app_meta_data ->> 'seed_role', '') = 'admin' then
    insert into public.admins (admin_id, name, email, phone, role)
    values (
      new.id,
      coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(new.email, '@', 1)),
      new.email,
      nullif(new.raw_user_meta_data ->> 'phone', ''),
      'Super Admin'
    )
    on conflict (admin_id) do nothing;
    insert into public.user_roles (user_id, role) values (new.id, 'admin') on conflict do nothing;
    update public.clubs set created_by = new.id where created_by is null;
    update public.events set created_by = new.id where created_by is null;
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Seed clubs and upcoming events
insert into public.clubs (club_name, description, category, email, established_date, status) values
  ('Photography Society', 'Weekly photo walks, darkroom sessions and an end-of-term exhibition for every skill level.', 'Arts', 'photo@campus.edu', '2012-09-15', 'Active'),
  ('Competitive Programming Club', 'Practice contests, algorithm workshops and team training for national programming contests.', 'Technology', 'cpc@campus.edu', '2015-02-01', 'Active'),
  ('Debate Union', 'Parliamentary-style debates, public speaking drills and inter-university tournaments.', 'Academic', 'debate@campus.edu', '2009-10-05', 'Active');

insert into public.events (club_id, event_name, description, event_date, start_time, end_time, venue)
select club_id, 'Golden Hour Photo Walk', 'A guided walk across campus at sunset. Bring any camera, phones welcome.', current_date + 7, '16:30', '18:30', 'Main Gate'
from public.clubs where club_name = 'Photography Society';

insert into public.events (club_id, event_name, description, event_date, start_time, end_time, venue)
select club_id, 'Intra-Campus Coding Contest', 'Three hours, eight problems, teams of up to three. Prizes for the top five teams.', current_date + 14, '10:00', '13:00', 'CSE Lab 3'
from public.clubs where club_name = 'Competitive Programming Club';

insert into public.events (club_id, event_name, description, event_date, start_time, end_time, venue)
select club_id, 'Freshers'' Open Debate', 'Motion announced on the day. Open to first-year students and new members.', current_date + 21, '15:00', '17:30', 'Auditorium B'
from public.clubs where club_name = 'Debate Union';