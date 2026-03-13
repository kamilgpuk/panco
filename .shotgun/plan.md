# Panco UI Redesign Implementation Plan

## Overview

**Goal:** Redesign the Panco calendar UI from a two-panel list-based layout to a Google Calendar-like dual-machine grid view with drag-and-drop scheduling.

**Scope:** UI layer only. All backend (API routes, data models, database, Supabase Realtime) and scheduling engine are reusable as-is.

**Architecture:**
- Replace existing components (`MachinePanel`, `MachineCalendar`, `TaskCard`) with calendar grid layout
- Implement drag-and-drop for task movement and resizing
- Build time-based grid rendering (hours × machines) instead of day columns
- Maintain all existing API contracts and data flow
- Keep scheduling engine unchanged; use it to compute task positions

---

## Stage 1: Calendar Grid Foundation

### Purpose
Establish the core calendar grid layout that displays two machines side-by-side with a time-based hourly view, replacing the current day-column layout.

### Depends on
None

### Key Components
- **CalendarGrid** — Main container; renders time axis + two machine columns
- **TimeAxis** — Left sidebar with hour labels (00:00–24:00 or configurable)
- **MachineColumn** — Single machine column; renders hourly slots
- **CalendarHeader** — Date navigation (today, next day, custom range); view mode selector

### Success Criteria
- Calendar displays two machines as columns, hours as rows
- Time axis shows readable hour marks
- Grid properly lays out proportional to viewport size
- Horizontal/vertical scrolling works smoothly for navigating days and hours
- Grid lines (hour and half-hour) visible for alignment

---

## Stage 2: Task Block Rendering and Positioning

### Purpose
Render tasks as proportional event blocks within the calendar grid based on computed start/end times, with visual distinction for active tasks.

### Depends on
Stage 1

### Key Components
- **TaskBlock** — Individual task rendered as positioned, colored rectangle
  - Height proportional to duration
  - Position calculated from computed_start and working hours
  - Shows title, time range (e.g., "09:00 - 10:30"), duration
  - Visual distinction for active task (position 0)
  - Split indicators if task spans multiple days
- **TaskBlockRenderer** — Maps scheduled tasks to grid positions

### Success Criteria
- Tasks appear as colored blocks at correct positions in grid
- Block height matches task duration
- Active task (position 0) is visually distinct (blue background, bold text)
- Tasks spanning multiple days show visual indicators ("Continues tomorrow" badge)
- No overlapping tasks (verified by computed schedule)
- Hover effects show action menu icon

---

## Stage 3: Drag-and-Drop for Task Movement

### Purpose
Enable queued tasks (position > 0) to be dragged to new time slots or different machines, with real-time recomputation of all downstream tasks.

### Depends on
Stage 2

### Key Components
- **DragDropProvider** — Wrapper for drag context; tracks dragging state
- **DraggableTaskBlock** — Extends TaskBlock; makes position > 0 tasks draggable
  - On drag start: capture task ID and original position
  - On drag over: show drop zone highlight; preview new computed time
  - On drop: call API to move task (machine_id or position change); trigger refresh
- **DropZoneHighlight** — Visual feedback showing valid drop areas

### Success Criteria
- Queued tasks (position > 0) can be dragged to any time slot or machine
- Active task (position 0) cannot be dragged
- Dragging shows preview of new time and target machine
- On drop, task moves to new time/machine; all downstream tasks recompute immediately
- No overlaps; cascade handled by backend scheduler
- Backlog order preserved (except explicit reorder)

---

## Stage 4: Task Resizing (Duration Adjustment)

### Purpose
Enable users to resize task blocks (extend/shorten duration) by dragging edges, with auto-cascade to downstream tasks.

### Depends on
Stage 2

### Key Components
- **ResizableTaskBlock** — Extends TaskBlock; adds resize handles on top/bottom edges
  - Top handle: shortens task (move end_min earlier)
  - Bottom handle: lengthens task (move end_min later)
  - Cursor changes to resize cursor on hover
- **ResizeHandler** — Logic to compute new duration and call API

### Success Criteria
- Hover over top/bottom edge of task block → resize cursor
- Drag to lengthen/shorten task
- Visual preview shows new height and time range as dragging
- On release, duration updates; all downstream tasks recompute
- Cannot resize below minimum duration (e.g., 5 minutes)
- Lengthening shifts downstream tasks later; shortening shifts them earlier

---

## Stage 5: Task Actions and Interactions

### Purpose
Implement context menus and detail panels for task operations (end early, prolong, split, delete, reorder).

### Depends on
Stage 2

### Key Components
- **TaskContextMenu** — Right-click menu or three-dot icon menu
  - Actions vary by task status (active vs. queued)
  - Active task: "End now", "Prolong", "Edit duration", "View details"
  - Queued task: "Edit", "Split", "Delete", "Move up/down", "View details"
- **TaskDetailPanel** — Modal or side panel showing full task info
  - Title, position in queue, computed times, slots (if split)
  - Action buttons for applicable operations
  - Duration input field (hours + minutes)
- **ConfirmDialog** — Confirmation modals for destructive actions (delete, end early)

### Success Criteria
- Right-click or click menu icon on task → context menu appears
- Click task title → detail panel opens
- All actions listed in spec (4.1–5.4) are implemented and functional
- Modals for duration, split, prolong have clear inputs and validation
- Confirmation dialogs prevent accidental deletion

---

## Stage 6: Working Hours Management (Settings Page)

### Purpose
Redesign the settings page to allow configuration of default weekly hours and per-date overrides with visual feedback and confirmation dialogs.

### Depends on
None (parallel to UI stages)

### Key Components
- **SettingsPage** — Full page layout with machine tabs
- **DefaultHoursTable** — Editable table (7 rows, one per day of week)
  - Columns: Day name, Start time, End time, "Working" toggle
  - Time picker or input fields for start/end
  - Save individually or batch save at bottom
- **OverridesManager** — Add/edit/delete per-date overrides
  - Table view with add button
  - Modal for new override (date picker, start/end time)
  - Delete button per override with confirmation
- **ConfirmChangesDialog** — Warns user if changes would reschedule existing tasks

### Success Criteria
- Machine selector tabs switch between Router 1 and Router 2
- Default hours table is editable and saveable
- All 7 days of week shown with correct formatting
- Per-date override section has add/remove functionality
- Changes to working hours immediately reschedule tasks
- Confirmation dialog appears if changes affect existing tasks
- Polish language UI maintained throughout

---

## Stage 7: Real-Time Sync and Polish

### Purpose
Ensure all connected clients stay in sync, add refinements (keyboard shortcuts, error handling, accessibility), and prepare for production.

### Depends on
Stages 1–6

### Key Components
- **RealtimeSubscriptionManager** — Enhanced Supabase Realtime subscriptions
  - Subscribe to `tasks` changes (INSERT, UPDATE, DELETE)
  - Subscribe to `machine_schedule_overrides` changes
  - On change event: refetch data and recompute calendar
  - Show visual indicator when updated by another user (e.g., "Updated by John")
- **ErrorBoundary** — Catches failed API calls; displays user-friendly messages
- **KeyboardShortcuts** — Optional shortcuts (e.g., Delete key to remove task, Escape to close modal)
- **Accessibility** — ARIA labels, keyboard navigation, focus management

### Success Criteria
- Multiple clients editing simultaneously sync without conflicts (last-write-wins)
- Failed API calls show error messages (not silent failures)
- Visual indicators show when other users edit tasks
- Keyboard shortcuts work as expected
- All components have proper ARIA labels
- Mobile layout tested and documented (desktop-first, mobile TBD)
- Build passes ESLint; no TypeScript errors
- Settings page and main calendar both fully functional
- Ready for Vercel deployment

---

## Integration Notes

### API Reuse
All existing API endpoints (`/api/tasks`, `/api/working-hours/*`) remain unchanged. No new endpoints needed.

### Scheduling Engine Reuse
The `scheduler.ts` computation function is called whenever tasks or working hours change. Output format (ScheduledTask[]) is consumed by TaskBlock positioning logic.

### Real-Time Sync Reuse
Existing Supabase Realtime subscriptions in `useMachineData` hook are enhanced; no schema changes needed.

### Data Flow
1. Component fetches tasks/overrides via `useMachineData` hook
2. `computeSchedule()` called to get ScheduledTask[] with slots
3. TaskBlock components read computed_start, slots, position from ScheduledTask
4. On user interaction (drag, resize, etc.), API called → database updated → Realtime event → refresh → recompute

### Component Tree (New)
```
App (page.tsx)
├── CalendarHeader
├── CalendarGrid
│   ├── TimeAxis
│   ├── MachineColumn (Machine 1)
│   │   ├── HourSlot (00:00)
│   │   │   └── TaskBlock (if present)
│   │   ├── HourSlot (01:00)
│   │   └── ...
│   └── MachineColumn (Machine 2)
│       ├── HourSlot (00:00)
│       │   └── TaskBlock (if present)
│       └── ...
├── TaskContextMenu (floating)
├── TaskDetailPanel (modal/side panel)
├── ConfirmDialog (modal)
└── ErrorNotification (toast)
```

---

## Acceptance Criteria Summary

### Must Have ✅
- Calendar grid displays two machines with time-based hourly layout
- Tasks render as proportional blocks with correct positioning
- Drag-and-drop works for queued tasks only; active task immobile
- Resizing updates duration and cascades changes
- All task actions (end early, prolong, split, delete, reorder) functional
- Working hours configurable (defaults + overrides)
- Real-time sync across clients
- Polish UI throughout

### Nice to Have 🎁
- Keyboard shortcuts (Delete to remove, Escape to close modals)
- Undo/redo for recent changes
- Dark mode toggle
- Mobile responsive layout
- Offline support

### Not in Scope
- Task archiving/history
- External calendar integrations
- Multi-workspace/user authentication
