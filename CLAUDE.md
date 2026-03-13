# Panco — CNC Scheduling App

Scheduling web app for a small machining shop. Manages task queues for 2 independent CNC routers. Tasks pack sequentially into working hours across days; any change triggers automatic rescheduling.

## Stack

- **Next.js 14** (App Router, TypeScript, Tailwind CSS)
- **Supabase** (Postgres + Supabase Realtime)
- **Hosting:** Vercel
- **UI language:** Polish

## Running locally

```bash
npm run dev      # http://localhost:3000
npm run build
npm run lint
```

Requires `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
APP_PASSWORD=...
```

## Key files

| File | What it does |
|------|-------------|
| `src/lib/scheduler.ts` | Pure scheduling engine — packs tasks into working hours, returns computed slots per task |
| `src/lib/supabase.ts` | Supabase client + all TypeScript types (Machine, Task, ScheduleDefault, ScheduleOverride) |
| `src/hooks/useMachineData.ts` | Fetches tasks + working hours, subscribes to Realtime, recomputes schedule on any change |
| `src/components/MachinePanel.tsx` | Main panel — calendar view + task queue + all actions |
| `src/components/MachineCalendar.tsx` | Day-column timeline, tasks as tiles |
| `src/components/TaskCard.tsx` | Task card with finish-early / prolong / split / remove actions |
| `src/components/AddTaskForm.tsx` | Add task form (title + hours + minutes) |
| `src/app/page.tsx` | Home — calendar grid + drag-to-trash + context menu |
| `src/app/help/page.tsx` | Polish documentation/help page |
| `src/app/login/page.tsx` | Password login page |
| `src/app/settings/page.tsx` | Working hours editor — defaults per day + per-date overrides |
| `src/app/api/tasks/` | Task CRUD, reorder, split endpoints |
| `src/app/api/working-hours/` | Defaults and overrides endpoints |
| `src/app/api/auth/login/route.ts` | Auth endpoint — sets httpOnly cookie |
| `src/middleware.ts` | Checks `panco_auth` cookie on every request |
| `src/components/CalendarGrid.tsx` | Multi-day calendar with machine columns |
| `src/components/CalendarHeader.tsx` | Top nav bar with view switcher, Pomoc, Ustawienia |
| `src/components/MachineColumn.tsx` | Single machine day column — drag/drop/resize |
| `src/components/TaskBlock.tsx` | Task tile with alternating colors per machine |
| `src/components/WorkingHoursEditor.tsx` | Per-day working hours modal (override/reset) |
| `supabase/migrations/001_initial.sql` | Full DB schema + seed data (run once in Supabase SQL editor) |

## Architecture (key decisions)

- **Schedule is computed client-side** — tasks and working hours live in Supabase; start/end times are never stored, always derived by `scheduler.ts`
- **In-progress ≠ position 0** — `position === 0` means first in queue (behavioral); "in progress" means position 0 AND current time is within the task's slot. Always use `isTaskInProgress()` for visual/action locks.
- **Auto-advance** — finishing a task deletes it; next task becomes active automatically
- **Real-time** — Supabase Realtime on `tasks` and `machine_schedule_overrides` tables; all clients recompute on any change
- **Auth** — stateless httpOnly cookie (`panco_auth`); value equals `APP_PASSWORD` env var. No DB. Changing `APP_PASSWORD` invalidates all sessions. Cookie lasts 7 days.
- **Supabase query filter bug** — `query.eq()` in Supabase JS v2 returns a NEW object. Always reassign: `let q = supabase.from(...).select(); if (id) q = q.eq('machine_id', id)`. Silent bug otherwise.
- **Timezone** — never use `toISOString().split('T')[0]` for local dates in Poland (UTC+1/+2). Always use `getFullYear()/getMonth()/getDate()` for local date keys.
- **nowMin cursor** — in `scheduler.ts`, only apply current time-of-day to the cursor when the first working day IS today. Future working days always start at `start_min`.

See `plan/architecture.md` for full data model and algorithm.

## Machines (hardcoded IDs)

```
Router 1: 00000000-0000-0000-0000-000000000001
Router 2: 00000000-0000-0000-0000-000000000002
```

## Task actions

| Action | Who | What happens |
|--------|-----|-------------|
| Add | anyone | Appended to end of queue |
| Remove | queued tasks only | Deleted; queue closes gap |
| Move | any non-in-progress task | Drag-to-reorder (including position 0 if not currently running) |
| Drag to trash | any non-in-progress task | Drop on bottom-right trash icon to delete |
| Finish early | in-progress only | Update duration → delete task |
| Prolong | in-progress or queued | Update duration_min |
| Split | in-progress or queued | Update first part; insert remainder at position+1 |
| Resize | non-in-progress tasks | Drag bottom handle to change duration |

## Working hours

- Defaults set per day-of-week in Settings
- Per-day overrides editable directly from calendar (click ✎ on date/machine header)
- Override shown with `*` badge; can be reset to default
- Gray overlay on non-working hours (tasks still render above overlay)

## Auth

- Password-protected via httpOnly cookie
- Set `APP_PASSWORD` env var on Vercel; users visit `/login` and enter password
- Session lasts 7 days; changing `APP_PASSWORD` invalidates all sessions

## Deployment

- GitHub: https://github.com/kamilgpuk/panco.git (auto-deploys to Vercel on push to main)
- Vercel env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `APP_PASSWORD`

## Current status

**Production-ready and deployed on Vercel.** Build and lint clean.

Features complete:
- Alternating blue/green color schemes per machine
- Working hours gray overlay in calendar
- Per-day working hours override from calendar view
- Drag-to-trash task deletion
- Password auth (7-day cookie)
- In-progress detection by actual time (not just queue position)
- Non-in-progress position-0 tasks are fully draggable/moveable
- Polish help/documentation page at `/help`
