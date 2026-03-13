-- Machines
create table machines (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- Default weekly working hours per machine
create table machine_schedule_defaults (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid not null references machines(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6), -- 0=Monday
  start_time time not null,
  end_time time not null,
  is_working boolean not null default true,
  unique(machine_id, day_of_week)
);

-- Per-date overrides (holidays, breakdowns, different hours)
create table machine_schedule_overrides (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid not null references machines(id) on delete cascade,
  date date not null,
  start_time time,
  end_time time,
  is_working boolean not null default true,
  unique(machine_id, date)
);

-- Tasks
create table tasks (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid not null references machines(id) on delete cascade,
  title text not null,
  duration_min int not null check (duration_min > 0),
  position int not null,
  created_at timestamptz default now(),
  unique(machine_id, position)
);

-- Seed data
insert into machines (id, name) values
  ('00000000-0000-0000-0000-000000000001', 'Router 1'),
  ('00000000-0000-0000-0000-000000000002', 'Router 2');

-- Default schedule: Mon-Fri 6:00-14:00 for both machines
insert into machine_schedule_defaults (machine_id, day_of_week, start_time, end_time, is_working)
select m.id, d.day, '06:00', '14:00', d.day < 5
from machines m
cross join (select generate_series(0,6) as day) d;
