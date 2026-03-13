# Panco Codebase Research

## Overview
**panco** is a CNC workshop scheduling application for managing task queues across two independent CNC machines (routers). It uses a Google Calendar-like UI to visualize scheduled tasks across days and working hours.

**Key Finding:** The codebase has a complete working backend and data model. The UI components exist but the user reports they "look nothing like what I need." The data models and scheduling engine are likely reusable.

---

## Tech Stack

### Frontend
- **Framework:** Next.js 16.1.6 (App Router, TypeScript)
- **Styling:** Tailwind CSS 4 + PostCSS
- **React:** 19.2.3
- **State Management:** React hooks (useState, useEffect, useCallback) + Supabase Realtime subscriptions

### Backend
- **Server:** Next.js API routes (server-side logic)
- **Database:** Supabase (managed PostgreSQL)
- **Real-time:** Supabase Realtime for pub/sub on table changes
- **Client Library:** @supabase/supabase-js 2.99.1 + @supabase/ssr 0.9.0
- **Hosting Target:** Vercel

### Development Tools
- **Language:** TypeScript 5
- **Linting:** ESLint 9
- **Build:** Next.js built-in bundler

---

## Project Structure

### Key Directories
```
src/
  ├── app/                          # Next.js App Router
  │   ├── page.tsx                  # Home: two-panel layout (Router 1 | Router 2)
  │   ├── layout.tsx                # Root layout
  │   ├── globals.css               # Global styles
  │   ├── settings/                 # Settings page (working hours editor)
  │   │   └── page.tsx
  │   └── api/                      # API routes
  │       ├── tasks/
  │       │   ├── route.ts          # GET (list), POST (create)
  │       │   ├── [id]/route.ts     # PATCH (update), DELETE
  │       │   ├── split/route.ts    # POST (split a task)
  │       │   └── reorder/route.ts  # POST (reorder queue)
  │       ├── working-hours/
  │       │   ├── defaults/route.ts # GET, POST (default weekly hours)
  │       │   └── overrides/route.ts# GET, POST, DELETE (per-date overrides)
  │       └── machines/
  │           └── route.ts          # (likely GET machines, not detailed)
  │
  ├── lib/
  │   ├── supabase.ts               # Supabase client + TypeScript type definitions
  │   └── scheduler.ts              # Pure scheduling engine (computes task start/end times)
  │
  ├── components/
  │   ├── MachinePanel.tsx          # Main panel: calendar + task list + actions
  │   ├── MachineCalendar.tsx       # Day-column timeline view with task tiles
  │   ├── TaskCard.tsx              # Individual task card (with action menu)
  │   └── AddTaskForm.tsx           # Form to add new tasks
  │
  └── hooks/
      └── useMachineData.ts         # Fetches tasks, defaults, overrides; subscribes to Realtime
```

### Database Setup
- **Migrations:** `supabase/migrations/001_initial.sql` — defines all tables and seeds two machines
- **Environment:** `.env.example` documents required env vars (Supabase URL + anon key)

### Existing Plans & Architecture
- **`plan/architecture.md`** — Full design doc, data model, scheduling algorithm, task actions
- **`plan/tasks.md`** — Implementation stages (currently incomplete; real Supabase needed to verify)

---

## Data Models

All entities are in PostgreSQL (via Supabase). No migrations exist beyond the initial schema.

### Machines
```typescript
type Machine = {
  id: string                // UUID
  name: string              // "Router 1", "Router 2"
  created_at: string        // ISO timestamp
}
```
**Hardcoded IDs in app:**
- Router 1: `00000000-0000-0000-0000-000000000001`
- Router 2: `00000000-0000-0000-0000-000000000002`

### Tasks
```typescript
type Task = {
  id: string                // UUID
  machine_id: string        // FK → machines
  title: string             // e.g., "Cutting lid frames"
  duration_min: number      // Planned duration in minutes
  position: int             // Queue order (0-indexed; position 0 = in progress)
  created_at: string        // ISO timestamp
}
```
**No status field.** In-progress task = lowest position per machine.

### Schedule Defaults (Weekly)
```typescript
type ScheduleDefault = {
  id: string                // UUID
  machine_id: string        // FK → machines
  day_of_week: number       // 0 = Monday … 6 = Sunday
  start_time: string        // Time, e.g., "06:00"
  end_time: string          // Time, e.g., "14:00"
  is_working: boolean       // true = working day
}
```
**Unique constraint:** (machine_id, day_of_week)

### Schedule Overrides (Per-Date)
```typescript
type ScheduleOverride = {
  id: string                // UUID
  machine_id: string        // FK → machines
  date: string              // YYYY-MM-DD
  start_time: string | null // null if not working
  end_time: string | null   // null if not working
  is_working: boolean       // false = day off
}
```
**Unique constraint:** (machine_id, date)

---

## Scheduling Engine

### How It Works
**Location:** `src/lib/scheduler.ts`

**Input:** Sorted task list + working hours calendar (defaults + overrides)

**Algorithm:**
1. Build a calendar for enough days ahead
2. For each task in order:
   - Start a cursor at the next available working time
   - Fill the task's duration across working days
   - Produce time slots (date, start_min, end_min) for the task
3. Return computed start/end times (ISO strings) for each task

**Output:**
```typescript
type ScheduledTask = Task & {
  slots: TimeSlot[]         // Array of {date, start_min, end_min}
  computed_start: string    // ISO string of first slot start
  computed_end: string      // ISO string of last slot end
}
```

**Key:** Times are **always computed client-side**, never stored. This avoids sync issues and simplifies the data model.

### Usage
- Called by `useMachineData` hook on initial load and whenever tasks/hours change
- Also called in `MachinePanel` when rendering the calendar

---

## UI Components

### MachinePanel (Main Container)
- Displays one machine's full interface
- Contains calendar view + task list
- Handles all task actions (add, remove, finish, prolong, split, reorder)
- Calls `useMachineData` to manage data

### MachineCalendar (Timeline View)
- Shows tasks grouped by date (day columns)
- Each task appears in its computed slot(s)
- Color-coded by task (active task = blue)
- Horizontally scrollable for many days

### TaskCard (Individual Task)
- Shows task title, duration, and computed start/end times
- **Visually distinguished** if active (position 0)
- Three-dot menu with context-sensitive actions:
  - **Active:** Finish early, Prolong, Split
  - **Queued:** Change time, Split, Remove
- Modals for user input (duration changes)
- All UI strings in Polish

### AddTaskForm (New Task Entry)
- Collapsible form
- Inputs: task title, hours, minutes
- Auto-appends to end of queue (highest position)

### Settings Page (`/settings`)
- Machine selector (tabs)
- Default working hours editor (per day of week)
- Per-date override manager (add/remove holidays, shorter days)
- All in Polish

---

## API Endpoints

### Task Management

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/tasks?machine_id=...` | Fetch all tasks for a machine |
| POST | `/api/tasks` | Create new task (appends to queue) |
| PATCH | `/api/tasks/[id]` | Update task (e.g., duration) |
| DELETE | `/api/tasks/[id]` | Delete task (shifts others up) |
| POST | `/api/tasks/reorder` | Bulk reorder (receives sorted array of IDs) |
| POST | `/api/tasks/split` | Split a task in two |

### Working Hours

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/working-hours/defaults?machine_id=...` | Fetch weekly schedule |
| POST | `/api/working-hours/defaults` | Upsert weekly schedule (one day) |
| GET | `/api/working-hours/overrides?machine_id=...` | Fetch all per-date overrides |
| POST | `/api/working-hours/overrides` | Upsert per-date override |
| DELETE | `/api/working-hours/overrides` | Delete override by ID |

---

## Real-Time Sync

### Mechanism
- **Supabase Realtime** subscriptions on `tasks` and `machine_schedule_overrides` tables
- Filtered by `machine_id` for efficiency
- On any change (INSERT, UPDATE, DELETE):
  1. All connected clients receive the event
  2. `useMachineData.fetchAll()` refetches data
  3. Scheduling engine recomputes
  4. Calendar re-renders

### Implementation
**Location:** `src/hooks/useMachineData.ts`
- Subscribes on component mount
- Unsubscribes on unmount
- Uses a `refresh()` callback for manual refetch (e.g., after API calls)

---

## Current Status

### Complete ✅
- Next.js project setup with TypeScript + Tailwind
- Supabase schema migration (machines, tasks, schedules)
- All API routes (task CRUD, working hours, reorder, split)
- Scheduling engine (pure, tested logic)
- All React components (panel, calendar, task card, form)
- Settings page (working hours editor)
- Real-time subscriptions
- Polish UI strings
- ESLint config, no errors

### Incomplete / Pending ⚠️
- **Stage 1 (verification):** Requires real Supabase project to test
- **Stage 7 (polish):** Mobile layout, error handling, Vercel deployment
- **Archiving:** Tasks currently deleted; no archive/history (TBD)

### Known Issues
- **UI does not match user vision:** User reports current components look wrong. Will need visual redesign.
- **No error boundaries:** Failed API calls not shown to user
- **No offline support:** Requires live Supabase connection

---

## Dependencies

Full list from `package.json`:

### Runtime
- `next` 16.1.6
- `react` 19.2.3
- `react-dom` 19.2.3
- `@supabase/supabase-js` 2.99.1 (core Supabase client)
- `@supabase/ssr` 0.9.0 (server-side rendering helpers)

### Dev
- `typescript` 5
- `@types/node`, `@types/react`, `@types/react-dom`
- `tailwindcss` 4
- `@tailwindcss/postcss` 4
- `postcss` (implicit)
- `eslint` 9
- `eslint-config-next` 16.1.6

---

## Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Schedule computation | Client-side only | No sync issues; trivial load at this scale |
| Status representation | Derived (lowest position) | No separate field; auto-advance for free |
| Working hours model | Defaults + overrides | Practical; avoids manual setup every week |
| Real-time | Supabase Realtime | Built-in; no extra service needed |
| Authentication | None | Single access level; small trusted team |
| Task deletion | Permanent | Archive/history marked as TBD |
| Active task detection | Position = 0 | Simple; no enum overhead |

---

## See Also
- `plan/architecture.md` — Full architectural design
- `plan/tasks.md` — Implementation roadmap (stages 1-7)
- `.env.example` — Required environment variables
- `CLAUDE.md` — Brief project summary (same as above, condensed)
