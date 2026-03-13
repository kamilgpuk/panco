# Requirements

## Functional Requirements

### F1 — Dual Machine Backlog
- Two independent backlog/schedule views, one per CNC router
- Each machine's schedule has no dependency on the other

### F2 — Working Hours Configuration
- Working hours defined per machine, per day
- Each machine can have different hours on the same day
- Days can be marked as non-working (holidays, downtime)

### F3 — Task States
Each task is in one of three states:
- **Queued** — waiting in the backlog
- **In progress** — currently running on the machine (exactly one per machine at any time)
- **Done** — completed

### F4 — Task Actions

| Action | Applies to | Description |
|--------|-----------|-------------|
| Add | — | Create a new task with title + duration, insert into backlog |
| Remove | Queued | Delete a queued task; downstream recalculates |
| Move | Queued | Reorder a queued task within the backlog; downstream recalculates |
| Split | Queued or In progress | Divide a task into two parts with specified durations; downstream recalculates |
| Finish early | In progress | Mark done with actual (shorter) duration; downstream recalculates |
| Prolong | In progress or Queued | Extend a task's duration; downstream recalculates |

**Active task rules:** the in-progress task cannot be moved or removed. It can be finished early, prolonged, or split (split produces a remainder task that re-enters the queue at position #1 and can then be moved).

### F5 — Automatic Rescheduling Engine
- Tasks pack sequentially into available working hours, strictly in backlog order
- Any action in F4 triggers a full downstream recalculation
- Tasks break across day boundaries automatically when they exceed remaining hours for that day
- Result is always the earliest-possible schedule given the current backlog order and working hours

### F6 — Calendar Visualization
- Timeline view per machine showing tasks as tiles across days
- Tiles display: title, duration, scheduled start/end time
- Day boundaries, working hours, and non-working time clearly visible
- Visual distinction between queued, in-progress, and done tasks

### F7 — Real-Time Multi-User Sync
- All connected users see changes immediately when any action is performed
- No page refresh needed

## Non-Functional Requirements

- Web app — responsive, usable on desktop, tablet, and phone
- UI language: Polish
- No authentication / user roles — single access level
- Up to 20–30 tasks per machine
- Hosted on Vercel (frontend + API routes); Supabase for database and real-time
- Domain and custom server to be decided later with the friend

## Out of Scope (for now)
- Other production stations (cutting, sorting, etc.)
- Invoicing, costing, materials, inventory
- External integrations
- Reporting / analytics
- User authentication or roles
