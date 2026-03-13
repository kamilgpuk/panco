# Specification: Panco – CNC Workshop Scheduler

## TLDR

**Key Points:**
- Web-based scheduling application for a two-machine CNC workshop with Google Calendar-like UI (day/hours grid view)
- Tasks displayed as proportional event blocks, draggable across time and machines, with auto-cascade scheduling to prevent overlaps
- Per-machine working hours with global defaults and per-date overrides; tasks split across days when needed

**Major Features:**
- Dual-machine calendar view (two columns, time-based grid, scrollable days)
- Drag-to-reschedule tasks (time and machine); resize handles for duration adjustment
- Working hours management (weekly defaults + per-date overrides) in settings
- Position-based task queue with auto-advance scheduling
- Real-time multi-client sync via Supabase Realtime
- Polish-language UI

**Key Concerns:**
- Complete UI redesign required (calendar layout, task rendering, interaction patterns differ significantly from current implementation)
- Drag-and-drop with auto-cascade requires careful state management to prevent overlaps while maintaining backlog order
- Current task (position 0) immobility but with resize/end-early actions adds complexity to interaction rules

---

## Business Context

Panco is a workshop planning tool for small CNC operations. It manages task queues for two independent CNC routers, allowing team members to:
- See what is running and queued on each machine
- Schedule future work without conflicts
- Adjust running tasks (finish early, extend, split)
- Set up working hours (defaults per weekday + special dates)
- Track task execution across multiple days

The Google Calendar-like UI makes task visualization and scheduling intuitive and familiar to users, replacing the current list-based view.

---

## System Architecture

### High-Level Design

Panco uses a client-rendered calendar UI backed by a PostgreSQL database and real-time sync:

1. **Frontend (Next.js + React + Tailwind)**
   - Calendar view component renders a two-column grid (Machine 1 | Machine 2)
   - Each column displays a time-based hourly schedule with tasks as proportional event blocks
   - Drag-and-drop handlers manage task movement and resizing
   - Settings page for working hours configuration
   - Real-time subscriptions update calendar when other users make changes

2. **Scheduling Engine (Client-Side)**
   - Pure TypeScript logic that computes task start/end times from a sorted task list and working hours calendar
   - Runs after any task mutation (add, move, resize, delete) to recompute all downstream task positions
   - No server-side scheduling; times are derived and never persisted

3. **Backend (Next.js API Routes)**
   - REST API for task CRUD, reorder, split operations
   - Working hours defaults and overrides management
   - All operations are fully transactional; scheduling engine recalculates on fetch

4. **Data Layer (Supabase PostgreSQL)**
   - Machines table (two hardcoded CNC routers)
   - Tasks table (position-based queue per machine)
   - Schedule defaults table (weekly working hours)
   - Schedule overrides table (per-date working hours)
   - Realtime subscriptions notify all clients of changes

### Key Architectural Principles

- **Position-based queue:** A task's position in the queue (0, 1, 2, ...) determines execution order. Position 0 is always the active task.
- **Client-side scheduling:** All start/end times are computed on the client using the scheduling engine. This avoids sync issues and keeps the data model simple.
- **No-overlap guarantee:** When a task is moved, resized, or deleted, the scheduling engine recomputes all subsequent tasks to ensure no overlaps.
- **Auto-cascade:** Deleting or shortening a task automatically shifts all following tasks earlier; lengthening a task shifts following tasks later.
- **Real-time sync:** Supabase Realtime subscriptions keep all connected clients in sync; they all subscribe to changes and refetch/recompute.
- **Immobile active task:** The task at position 0 cannot be moved (no drag to time/machine), but can be resized or ended early.

---

## Features & Workflows

### 1. Calendar View (Main Page)

**Purpose:** Display two CNC machines side by side with a time-based grid, showing all scheduled tasks.

**Layout:**
- **Header:** Tabs or buttons to select date range (today, week, custom); optional navigation arrows
- **Two-column grid:** Left column = Machine 1, Right column = Machine 2
- **Time axis (left edge):** 24-hour or working-hours-only view; hour marks visible
- **Day columns (grid):** One or more columns representing days; each task spans across its scheduled time slots
- **Horizontal scrolling:** If multiple days are shown, user can scroll left/right to see more days
- **Grid lines:** Subtle hour and half-hour lines for alignment

**Task Rendering:**
- Each task appears as a colored block (event card) within its time slot
- Block height is proportional to task duration (e.g., 1 hour = 60px, 30 min = 30px)
- Block shows:
  - Task title
  - Start and end time (e.g., "09:00 - 10:30")
  - Remaining duration (e.g., "1h 30m")
- **Active task styling:** Task at position 0 on a machine is visually distinct (e.g., blue background, bold text)
- **Split indicators:** If a task spans multiple days, show a visual indicator (e.g., "Continues tomorrow" or "Continued from yesterday")

**Interactions:**
- Hovering over a task shows a context menu with available actions
- Clicking a task opens a detail panel (or modal) showing full task info and action buttons
- Scrolling vertically shows different times of day; scrolling horizontally shows different days

---

### 2. Task Movement (Drag-and-Drop)

**Constraint:** Only queued tasks (position > 0) can be moved. The active task (position 0) is immobile.

**Actions:**

#### 2.1 Move to Different Time (Same Machine)
- **Interaction:** Drag task to a new time slot on the same machine
- **Behavior:**
  1. Task is repositioned to the new time
  2. All tasks that were originally after this task in the backlog are recomputed
  3. No overlaps; if the new time overlaps existing tasks, both are adjusted forward
  4. Backlog order is preserved (task stays in same position in the queue)
- **Visual feedback:** Drag preview shows the task moving; grid highlights drop zone; shows conflict preview if overlap detected

#### 2.2 Move to Different Machine
- **Interaction:** Drag task from one column to the other
- **Behavior:**
  1. Task's machine_id is updated
  2. Task is removed from its old machine's queue and appended to the new machine's queue (becomes lowest position)
  3. Old machine's queue is recomputed (all tasks shift earlier)
  4. New machine's queue is recomputed (all tasks shift later)
- **Visual feedback:** As task is dragged across columns, highlight which machine it will be assigned to; show computed new time on drop

---

### 3. Task Resizing (Duration Adjustment)

**Constraint:** Active task (position 0) can be resized. Queued tasks (position > 0) can be resized only if the new duration does not create overlaps with the next task.

**Actions:**

#### 3.1 Resize by Dragging Task Edges
- **Interaction:** Hover over top or bottom edge of task block; cursor changes to resize cursor; drag to shorten/lengthen
- **Behavior (Lengthen):**
  1. Task's end time extends by the dragged amount
  2. All downstream tasks are recomputed (shifted later to avoid overlap)
  3. If the task splits across a day boundary, split point is recalculated
- **Behavior (Shorten):**
  1. Task's end time moves earlier
  2. All downstream tasks are recomputed (shifted earlier, may now fit on same day as predecessor)
- **Visual feedback:** Drag preview shows new height; shows time range as you drag; highlights conflicts if any
- **Validation:** Cannot shorten a task below a minimum duration (e.g., 5 minutes); cannot make it zero

#### 3.2 Resize via Input Dialog
- **Interaction:** Right-click task (or click three-dot menu) → "Edit duration"; modal opens with hour/minute inputs
- **Behavior:** Same as dragging, but with explicit number entry
- **Confirmation:** Modal has "Save" button to confirm changes

---

### 4. Active Task Actions

**Context:** The task at position 0 on a machine is active (currently executing or about to execute).

#### 4.1 End Immediately
- **Interaction:** Context menu → "End now" or "Finish early"
- **Behavior:**
  1. Task is deleted from the queue
  2. All remaining tasks shift up (position 1 becomes position 0, etc.)
  3. The new position 0 task is now active
  4. All tasks are recomputed (shift earlier)

#### 4.2 Prolong / Extend
- **Interaction:** Context menu → "Prolong" → enter additional duration
- **Behavior:**
  1. Task's duration is extended by the entered amount
  2. All downstream tasks are recomputed (shifted later)

#### 4.3 View / Edit Details
- **Interaction:** Click task → detail panel opens
- **Content:** Title, current position in queue, computed start/end times, slots (if split across days), all available actions

---

### 5. Queued Task Actions

**Context:** Tasks at position > 0 are queued and have not started yet.

#### 5.1 Reorder Within Queue
- **Interaction:** Right-click task → "Move up/down in queue" OR drag task's queue position indicator (TBD UI element)
- **Behavior:**
  1. Task's position is incremented/decremented
  2. All tasks between old and new position swap positions
  3. All tasks are recomputed
- **Alternative:** Dragging task to different time implicitly reorders if the new time lands before another task in the backlog

#### 5.2 Split Task
- **Interaction:** Context menu → "Split task" → enter how much to split off
- **Behavior:**
  1. Task is split into two: first part has new duration, second part inherits remainder
  2. New second task is inserted after the first task in the queue
  3. Both tasks are recomputed
- **Modal inputs:** "Duration of first part" (hours + minutes); "Duration of second part" (auto-calculated, read-only)

#### 5.3 Delete Task
- **Interaction:** Context menu → "Delete" → confirm
- **Behavior:**
  1. Task is removed from the queue
  2. All downstream tasks are recomputed (shift earlier)

#### 5.4 View / Edit Details
- Same as active task (section 4.3)

---

### 6. New Task Entry

**Purpose:** Add a new task to a machine's queue.

**Interaction:**
- Click "+ Add task" button on a machine column OR
- Right-click on empty space in calendar → "Add task"

**Modal / Form:**
- **Machine:** Pre-selected if user clicked on a specific machine column
- **Title:** Text input (required)
- **Duration:** Separate inputs for hours and minutes (required)
- **Start time:** Optional; if omitted, appends to end of queue. If specified, task is inserted at that time (backlog position TBD)
- **Submit:** "Add task" button

**Behavior:**
1. New task is appended to the end of the machine's queue (highest position number)
2. All tasks are recomputed
3. Task appears in the calendar at its computed time

**Visual feedback:** Modal closes; task appears in calendar with a brief highlight

---

### 7. Working Hours Management (Settings)

**Purpose:** Configure when each machine is available to work.

**Page:** `/settings`

**Structure:**
- **Machine selector:** Tabs to switch between Machine 1 and Machine 2
- **Two sections per machine:** Defaults + Overrides

#### 7.1 Default Working Hours (Per Weekday)
- **Display:** Table with 7 rows (Monday–Sunday)
- **Columns per row:** Day name, Start time, End time, "Working" toggle
- **Interactions:**
  - Click start/end time field → time picker (or HH:MM input)
  - Toggle "Working" checkbox to mark day as off (start/end disabled)
- **Behavior:**
  - Each row is independently saveable (or save button at bottom saves all rows)
  - Changes apply retroactively to all future tasks (reschedule immediately)
  - Requires confirmation dialog if changes would alter existing task schedules

#### 7.2 Per-Date Overrides (Holidays, Special Hours)
- **Display:** Table of overrides; each row shows date, start time, end time, or "Not working" flag
- **Interactions:**
  - Click "+ Add override" button
  - Modal opens: Date picker, start/end time, "Not working" toggle
  - Submit saves override
  - Table has delete button per override (with confirmation)
- **Behavior:**
  - Overrides take precedence over defaults for that date
  - Changes reschedule tasks immediately
  - Example: Dec 25 is "Not working" → no tasks scheduled that day

---

### 8. Real-Time Sync

**Purpose:** Keep all connected clients' calendars in sync.

**Mechanism:**
- Frontend subscribes to Supabase Realtime events on `tasks` and `machine_schedule_overrides` tables
- When any client makes a change (add, move, resize, delete task, or update working hours):
  1. Database is updated
  2. Realtime broadcasts change to all subscribers
  3. All clients refetch affected data
  4. Scheduling engine recomputes all tasks
  5. Calendar re-renders

**User Experience:**
- If another user edits a task you are viewing, the view updates automatically (with a visual indicator, e.g., "Updated by John")
- If working hours change, all tasks are immediately rescheduled
- Conflicts are resolved (e.g., if two users drag same task simultaneously, last write wins)

---

## Data Model

The data model is unchanged from the existing codebase. See `research.md` for details. Key entities:

- **Machines:** Two hardcoded CNC routers (UUID IDs)
- **Tasks:** Machine-specific queue with position-based ordering
- **Schedule Defaults:** Weekly working hours (per weekday, per machine)
- **Schedule Overrides:** Per-date working hours (e.g., holidays)

**Key invariant:** Position 0 task is always active; positions are contiguous (0, 1, 2, ..., n).

---

## Scheduling Algorithm

The scheduling engine (existing, reusable) computes start/end times for all tasks on a machine given:
1. A sorted list of tasks (by position)
2. A working hours calendar (defaults + overrides for the date range)

**Algorithm outline:**
1. Build a calendar of working time blocks for future days
2. For each task in order:
   - Place cursor at the earliest available working time (after previous task)
   - Allocate task duration across working days (split if needed)
   - Record start/end times and time slots
3. Return computed times for all tasks

**Properties:**
- Deterministic: same input always produces same output
- Runs client-side (cheap, no server latency)
- Called after any mutation (add, move, resize, delete, working hours change)
- Used by calendar component to render task blocks

See `src/lib/scheduler.ts` in the codebase for implementation details.

---

## UI Components (Redesigned)

All UI components are being redesigned to match the Google Calendar aesthetic. Existing component names and structure may change.

### 1. CalendarView (New Component Tree)
- **Purpose:** Main calendar grid layout
- **Subcomponents:**
  - `CalendarHeader`: Date/time navigation, view mode selector
  - `CalendarGrid`: Two-column time grid (machines as columns, hours as rows)
  - `MachineColumn`: One machine's worth of tasks and time slots
  - `TimeAxis`: Left-side hour labels
  - `TaskBlock`: Individual task as a proportional event card
  - `TaskMenu`: Context menu / detail panel for task actions

### 2. TaskBlock (New Component)
- **Purpose:** Render a single task as a calendar event
- **Visual:**
  - Colored rectangle (height = duration, position = time)
  - Title and time text
  - Hover effects (shadow, menu icon)
  - Resize handles (top/bottom edges)
  - Active task styling (bold, distinct color)
- **Interactions:**
  - Draggable (except position 0)
  - Resizable (edges draggable)
  - Click → detail panel
  - Right-click → context menu

### 3. SettingsPage (Redesigned)
- **Purpose:** Configure working hours
- **Structure:**
  - Machine tabs
  - Default hours table
  - Overrides section
- **Interactions:** All described in section 7 (Working Hours Management)

### 4. TaskDetailPanel (New Component)
- **Purpose:** Show and edit task details
- **Content:**
  - Title
  - Duration (editable)
  - Position in queue
  - Computed start/end times
  - Slots (if split)
  - Action buttons (if applicable)
- **Style:** Modal or side panel (TBD)

---

## API Contracts

All API endpoints are unchanged from the existing codebase. See `research.md` for the full list. The frontend makes the same calls but interprets results differently (calendar rendering instead of list rendering).

**Key endpoints:**
- `GET /api/tasks?machine_id=...` — Fetch all tasks for a machine
- `POST /api/tasks` — Create new task
- `PATCH /api/tasks/[id]` — Update task (e.g., duration, position, machine_id)
- `DELETE /api/tasks/[id]` — Delete task
- `POST /api/tasks/reorder` — Bulk reorder (for queue position changes)
- `POST /api/tasks/split` — Split a task
- Working hours endpoints (unchanged)

See `research.md` for full API specification.

---

## Acceptance Criteria

### Must Have ✅
1. Calendar grid displays two machines side by side with hour/day layout
2. Tasks render as proportional blocks (height = duration, position = time)
3. Only queued tasks (position > 0) are draggable; active task is immobile
4. Dragging a task reschedules it and recomputes all downstream tasks
5. Resizing a task (edges) updates duration and cascades changes
6. No overlapping tasks; auto-cascade handles all movements
7. Backlog order is preserved (except when explicitly reordered)
8. Tasks split across day boundaries when they exceed remaining working time
9. Active task can be ended, prolonged, or resized
10. Queued tasks can be split, deleted, or reordered
11. Working hours can be configured (defaults per weekday, overrides per date)
12. All changes sync in real-time across clients
13. Polish language UI

### Nice to Have 🎁
1. Keyboard shortcuts (e.g., Delete key to remove task)
2. Undo/redo for recent changes
3. Task templates or task history
4. Export calendar view as image or PDF
5. Mobile responsive layout (if not in scope, document as "desktop only")
6. Dark mode toggle
7. Task color coding by category/type

### Out of Scope ❌
1. Task archiving or history (noted as TBD in existing roadmap)
2. User authentication or multi-workspace (single trusted team)
3. Mobile app (web-only for now)
4. Integration with external calendar systems

---

## Testing Strategy

### Unit Tests
- Scheduling engine: verify correct time computation for single/multiple tasks, day splits, working hour edge cases
- Data mutations: task creation, deletion, reordering, duration changes

### Integration Tests
- API endpoints: CRUD operations, reorder, split
- Real-time sync: multiple clients making concurrent changes
- Working hours changes: retroactive rescheduling

### E2E Tests (User Workflows)
1. Add a task to Machine 1 queue
2. Drag task to a new time slot
3. Resize task (extend duration)
4. Active task ends early; next task moves up
5. Drag task to Machine 2
6. Split a queued task
7. Update default working hours; verify all tasks reschedule
8. Two clients simultaneously edit the same task (conflict resolution)

---

## Implementation Notes

- **UI redesign scope:** All components in `src/components/` need visual updates. Structure may change significantly.
- **Scheduling engine:** Reusable as-is; no changes needed.
- **API layer:** Reusable as-is; no changes needed.
- **Database:** Reusable as-is; no schema changes.
- **Real-time sync:** Existing subscription logic is reusable; may need adjustments for new component structure.
- **Polish UI strings:** Maintain existing Polish translations; add new strings as needed for calendar UI.
- **Build and deploy:** No new dependencies; use existing Next.js / Tailwind / TypeScript setup.

---

## References

- **Existing research:** See `research.md` for current codebase analysis
- **Existing architecture:** See `plan/architecture.md` in the codebase
- **Existing tasks:** See `plan/tasks.md` for implementation roadmap (may need updates after redesign)
