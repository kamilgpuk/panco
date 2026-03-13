# Panco — Project Brief

## Business Context

Small metal machining company, 10–12 people. Two CNC routers plus other stations (cutting, sorting, etc.). For now, scope is limited to the two CNC routers only.

Each router has its own dedicated team (operators). The key people who interact with the system: owner, main technologist, workshop leader, and machine operators.

## Problem

No system to visualize or manage the production backlog for the two routers. Scheduling is manual. When anything changes mid-day (task finishes early, runs long, gets added/removed), there is no way to instantly see the updated plan — everything has to be recalculated manually.

## What We're Building

A web app that visualizes and manages the task backlog for each CNC router independently.

**Core mental model:** a calendar where each day has defined working hours. Tasks are tiles that pack sequentially into those hours. When anything changes, all downstream tasks automatically recalculate to fill available time — respecting working hours, breaking across days when needed.

### Task Properties
- Title
- Machine (Router 1 or Router 2)
- Duration (in hours/minutes)

### Working Hours
- Defined per machine, per day
- Each machine can have different hours on the same day
- Must accommodate irregular schedules (shorter days, holidays, machine downtime)

### Task Actions
| Action | Description |
|--------|-------------|
| Add | Insert a new task into the backlog |
| Remove | Delete a task; downstream tasks recalculate |
| Finish early | Mark current task done with actual (shorter) duration; downstream recalculates |
| Prolong | Extend a task's duration; downstream recalculates |
| Move | Reorder a task within the backlog; downstream recalculates |
| Split | Divide one task into two; downstream recalculates |

All six actions trigger a full downstream recalculation.

### Scale
- Up to 20–30 tasks in backlog per machine

## Users & Access

Web app. No authentication roles — everyone (owner, technologist, workshop leader, operators) can do everything.

## Out of Scope (for now)
- Other stations (cutting, sorting, etc.)
- Invoicing, costing, materials
- Integrations with external tools
- Reporting / analytics
