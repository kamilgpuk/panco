# Panco — Architecture

## Core Principle

Panco is a **scheduling visualizer**, not a work-tracking system. The source of truth is the ordered task list + working hours. Everything else is derived.

---

## Data Model (Supabase / Postgres)

```sql
machines
  id            uuid  PK
  name          text  -- "Router 1", "Router 2"
  created_at    timestamptz

-- Default weekly working hours per machine
machine_schedule_defaults
  id            uuid  PK
  machine_id    uuid  FK → machines
  day_of_week   int   -- 0 = Monday … 6 = Sunday
  start_time    time
  end_time      time
  is_working    bool  -- false = day off by default

-- Per-date overrides (holidays, breakdowns, shorter days)
machine_schedule_overrides
  id            uuid  PK
  machine_id    uuid  FK → machines
  date          date
  start_time    time  -- null when is_working = false
  end_time      time  -- null when is_working = false
  is_working    bool

-- Tasks
tasks
  id            uuid  PK
  machine_id    uuid  FK → machines
  title         text
  duration_min  int   -- planned duration in minutes
  position      int   -- order within machine queue; unique per machine
  created_at    timestamptz
```

**No status field.** In-progress = the task with the lowest `position` for a given machine. Done tasks are deleted (or archived — TBD).

**No stored start/end times.** Schedule is always computed client-side.

---

## Rescheduling Engine (client-side TypeScript)

Runs in the browser. Input: sorted task list + working hours calendar. Output: for each task, one or more time slots (a task may span multiple days).

```
function computeSchedule(tasks, workingHours):
  cursor = start of today's working block (or now if mid-day)
  for each task in position order:
    remaining = task.duration_min
    while remaining > 0:
      available = working minutes left in cursor's day
      if available <= 0:
        advance cursor to start of next working day
        continue
      take = min(remaining, available)
      assign slot { date, start, end }
      remaining -= take
      advance cursor by take minutes
```

Triggered by: any change to the tasks table or working hours. Supabase Realtime pushes raw data; each client independently recomputes.

---

## Task States (derived)

| State | Definition |
|-------|-----------|
| In progress | Lowest `position` task for the machine |
| Queued | All other tasks |
| Done | Removed from the queue (not shown, or archived) |

Auto-advance: when the in-progress task is finished (finish early / on time), it is removed (or archived) and the next task automatically becomes in-progress.

---

## Task Actions

| Action | Mutation |
|--------|---------|
| Add | INSERT task at given position; shift others down |
| Remove | DELETE queued task; shift others up |
| Move | UPDATE positions to reorder queued tasks |
| Finish early | UPDATE duration_min to actual; then DELETE (or archive) |
| Prolong | UPDATE duration_min |
| Split | UPDATE in-progress task duration; INSERT new task at position + 1 |

All mutations go through API routes (Next.js). Supabase Realtime broadcasts the change to all clients. Each client reruns the scheduling engine.

---

## Real-Time Architecture

```
User action
  → Next.js API route
    → Supabase mutation (tasks / working hours)
      → Supabase Realtime broadcasts row change
        → All connected clients receive event
          → Client reruns scheduling engine
            → Calendar re-renders
```

Supabase Realtime: subscribe to `tasks` and `machine_schedule_overrides` tables per machine.

---

## UI Structure

```
/ (home)
  └── Two-panel layout: Router 1 | Router 2 (or tabs on mobile)

Each panel:
  ├── Calendar/timeline view  ← computed schedule, tasks as tiles
  └── Task sidebar/list       ← add task, reorder, actions per task
```

No authentication. Single shared URL for the whole team.

---

## Key Decisions Log

| Decision | Choice | Reason |
|----------|--------|--------|
| Schedule storage | Computed client-side | No sync risk; trivial computation at this scale |
| In-progress detection | Derived (lowest position) | No status field needed; auto-advance for free |
| Working hours | Default weekly + per-day overrides | Practical; avoids manual setup every week |
| Real-time | Supabase Realtime | Built into the stack; no extra service |
| Auth | None | Single access level; small trusted team |
