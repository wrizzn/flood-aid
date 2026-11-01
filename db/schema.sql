-- Flood relief: help request feature (Supabase / PostgreSQL)

-- Staff (officials / volunteer coordinators) linked to Supabase auth users
create table staff_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null default 'volunteer' check (role in ('volunteer', 'coordinator', 'admin')),
  created_at timestamptz not null default now()
);

-- Help requests from people affected by the flood
create table help_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  requester_name text not null,
  phone text not null,
  lat double precision not null,
  lng double precision not null,
  address_note text,                       -- landmark / house details

  people_count int not null default 1 check (people_count > 0),
  has_elderly boolean not null default false,
  has_children boolean not null default false,
  has_patient_or_disabled boolean not null default false,

  need_types text[] not null,              -- e.g. {food,water,boat,medical,shelter}
  urgency text not null default 'normal' check (urgency in ('normal', 'urgent', 'critical')),
  details text,

  status text not null default 'pending'
    check (status in ('pending', 'assigned', 'in_progress', 'done', 'cancelled')),
  assigned_to uuid references staff_profiles(id)
);

-- History of status changes (audit trail)
create table request_updates (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references help_requests(id) on delete cascade,
  staff_id uuid references staff_profiles(id),
  old_status text,
  new_status text not null,
  note text,
  created_at timestamptz not null default now()
);

create index on help_requests (status, urgency);
create index on help_requests (lat, lng);

-- Row Level Security: anyone can submit, only staff can read/update
alter table help_requests enable row level security;
alter table request_updates enable row level security;
alter table staff_profiles enable row level security;

create policy "anyone can submit a request"
  on help_requests for insert
  with check (true);

create policy "staff can read requests"
  on help_requests for select
  using (exists (select 1 from staff_profiles s where s.id = auth.uid()));

create policy "staff can update requests"
  on help_requests for update
  using (exists (select 1 from staff_profiles s where s.id = auth.uid()));

create policy "staff can read and write updates"
  on request_updates for all
  using (exists (select 1 from staff_profiles s where s.id = auth.uid()))
  with check (exists (select 1 from staff_profiles s where s.id = auth.uid()));

create policy "staff can read own profile"
  on staff_profiles for select
  using (id = auth.uid());
