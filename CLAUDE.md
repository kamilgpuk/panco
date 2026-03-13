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
| `src/app/page.tsx` | Home — two-panel layout (Router 1 | Router 2) |
| `src/app/settings/page.tsx` | Working hours editor — defaults per day + per-date overrides |
| `src/app/api/tasks/` | Task CRUD, reorder, split endpoints |
| `src/app/api/working-hours/` | Defaults and overrides endpoints |
| `supabase/migrations/001_initial.sql` | Full DB schema + seed data (run once in Supabase SQL editor) |

## Architecture (key decisions)

- **Schedule is computed client-side** — tasks and working hours live in Supabase; start/end times are never stored, always derived by `scheduler.ts`
- **In-progress = position 0** — no status field; the first task in the queue is always the active one
- **Auto-advance** — finishing a task deletes it; next task becomes active automatically
- **Real-time** — Supabase Realtime on `tasks` and `machine_schedule_overrides` tables; all clients recompute on any change

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
| Move | queued tasks only | Drag-to-reorder |
| Finish early | in-progress only | Update duration → delete task |
| Prolong | in-progress or queued | Update duration_min |
| Split | in-progress or queued | Update first part; insert remainder at position+1 |

## Current status

All code written, build and lint clean. Needs real Supabase to run.

Remaining work — see `plan/tasks.md`:
- Runtime verification with real Supabase (all stages pending confirmation)
- Stage 7: mobile layout, error states, Vercel deploy
