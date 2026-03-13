# Panco — Implementation Plan

## BEFORE YOU START: What Kamil needs to do

1. Create a Supabase project at https://supabase.com
2. Copy the project URL and anon key to `.env.local` (replace the placeholder values)
3. Run the SQL from `supabase/migrations/001_initial.sql` in the Supabase SQL editor
4. In the Supabase dashboard → Table Editor → each table → Enable Realtime for `tasks` and `machine_schedule_overrides`
5. Run `npm run dev` to start the app locally

## How to Work

1. Read `plan/architecture.md` before writing any code.
2. Read `discovery/requirements.md` as the source of truth for what to build.
3. Find the first stage with incomplete tasks. Work only on that stage.
4. Mark `[x]` as each task is completed.
5. Run quality checks after each stage. Fix all failures before proceeding.
6. Stop and summarize. Wait for approval before starting the next stage.

ONE stage at a time. No skipping ahead.

## Quality Checks

```bash
npm run dev       # dev server starts without errors
npm run build     # production build succeeds
npm run lint      # no lint errors
npm run test      # all tests pass (when tests exist)
```

---

## Stage 1: Project Foundation

Depends on: nothing

- [x] Initialise Next.js project with TypeScript and Tailwind CSS in `/Users/kamil.puk/cc/panco/`
- [ ] Set up Supabase project; save credentials in `.env.local` (never commit this file) — **requires real Supabase credentials**
- [x] Create `.env.example` documenting all required env vars
- [x] Write and apply Supabase migration: `machines`, `machine_schedule_defaults`, `machine_schedule_overrides`, `tasks` tables (see `plan/architecture.md`)
- [x] Seed two machines: "Router 1", "Router 2" (in migration SQL)
- [x] Set up Supabase client in `src/lib/supabase.ts`
- [ ] Verify: app runs, DB connected, tables exist with seed data — **requires real Supabase credentials**

---

## Stage 2: Working Hours Configuration

Depends on: Stage 1

- [x] Create `src/lib/scheduler.ts` — scheduling engine (merged from original Stage 2 + 4 scope)
- [x] Create `/api/working-hours/defaults` route (GET, POST)
- [x] Create `/api/working-hours/overrides` route (GET, POST, DELETE)
- [x] Build working hours editor in settings page at `/settings`
- [x] Build day override editor in settings page
- [x] Wire up to a settings page at `/settings`
- [ ] Verify: can set default weekly hours and override a specific date per machine — **requires Supabase**

---

## Stage 3: Task List Management

Depends on: Stage 1

- [x] Create `/api/tasks` route (GET, POST)
- [x] Create `/api/tasks/[id]` route (PATCH, DELETE)
- [x] Create `/api/tasks/reorder` route (POST)
- [x] Build `TaskCard` component — displays task with actions
- [x] Build `AddTaskForm` component
- [x] Visually distinguish in-progress task (position 0) from queued tasks
- [ ] Verify: add, remove, and reorder tasks — **requires Supabase**

---

## Stage 4: Scheduling Engine + Calendar View

Depends on: Stage 2, Stage 3

- [x] Create `src/lib/scheduler.ts` — pure scheduling engine (algorithm from architecture.md)
- [x] Build `MachineCalendar` component — day columns with task tiles
- [x] Build `MachinePanel` component — integrates calendar + task list
- [x] `useMachineData` hook — fetches data, subscribes to Realtime, recomputes schedule on changes
- [ ] Verify: schedule renders correctly — **requires Supabase**

---

## Stage 5: Task Actions

Depends on: Stage 4

- [x] **Finish early:** PATCH duration_min then DELETE task
- [x] **Prolong:** PATCH duration_min
- [x] **Split:** POST to `/api/tasks/split`
- [x] **Move:** drag-to-reorder via `/api/tasks/reorder`
- [ ] Verify all actions — **requires Supabase**

---

## Stage 6: Real-Time Sync

Depends on: Stage 5

- [x] Subscribe to Supabase Realtime on `tasks` filtered by `machine_id`
- [x] Subscribe to Supabase Realtime on `machine_schedule_overrides` filtered by `machine_id`
- [x] On change: re-fetch, rerun scheduler, re-render
- [ ] Test with two browser windows — **requires Supabase**

---

## Stage 7: Polish

Depends on: Stage 6

- [x] UI strings in Polish
- [ ] Mobile layout improvements
- [ ] Working hours bulk-set
- [ ] Error states: failed API call, Realtime disconnected
- [ ] Deploy to Vercel
- [ ] Smoke test on production
