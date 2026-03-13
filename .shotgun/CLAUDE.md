# Panco

Panco is a CNC workshop scheduling application that manages task queues across two independent machines with a Google Calendar-like dual-column grid view. You are redesigning the UI from a list-based layout to a time-based calendar with drag-and-drop task scheduling.

## .shotgun/ Files

Read ALL of these before writing any code:

- `.shotgun/specification.md` — Requirements, architecture, and acceptance criteria
- `.shotgun/research.md` — Research findings on codebase structure and tech stack
- `.shotgun/plan.md` — Implementation plan with 7 stages and dependencies
- `.shotgun/tasks.md` — **Start here.** Tasks by stage with `[x]` checkboxes

## Quality Checks

```
npx tsc --noEmit
npx eslint src/
npm run build
```

## How to Work

1. Read every `.shotgun/` file above. Do NOT modify them except `tasks.md` checkboxes.
2. Open `.shotgun/tasks.md`. Find the first stage with incomplete tasks. That is the ONLY stage to work on.
3. Plan how to complete that stage before writing code.
4. Execute each task. Mark `[x]` in `.shotgun/tasks.md` as you complete it.
5. Run all quality checks above. Fix any failures.
6. Stop. Summarize what was done. Wait for human review before starting the next stage.

ONE stage at a time. Do not skip ahead. Do not start the next stage without approval.
