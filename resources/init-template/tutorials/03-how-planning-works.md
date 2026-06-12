---
id: tutorial-03-how-planning-works
title: "How Planning Works"
type: onboarding
status: stable
owner: mpos
created_at: {{date}}
updated_at: {{date}}
tags: [tutorial, onboarding, planning]
related:
  - 02-how-docs-work.md
  - ../.mpos/rules/planning-rules.md
---

# How Planning Works

MPOS planning artifacts form a strict hierarchy:

```
Roadmap
  └─ Epic
       └─ Story
            └─ Task

Sprint ── references Stories/Tasks for that iteration
```

Full rules: [`.mpos/rules/planning-rules.md`](../.mpos/rules/planning-rules.md).

## Creating an Epic

```bash
mpos plan epic create "Team Workspaces"
```

This creates `planning/epics/EPIC-001-team-workspaces.md` from
`.mpos/templates/epic.md`, assigns the next `EPIC-NNN` ID, and adds a row to
`planning/roadmap.md` under `## Epic Index`.

## Creating a Story

```bash
mpos plan story create "Create a new workspace" --epic EPIC-001
```

Creates `planning/stories/STORY-001-create-a-new-workspace.md`, sets `epic: EPIC-001`
in its frontmatter, and adds a link to it under `## Stories` in `EPIC-001`.

## Creating Tasks

```bash
mpos task create "Implement workspace creation API" --story STORY-001
```

Creates `tasks/backlog/TASK-001-implement-workspace-creation-api.md` with
`story: STORY-001` and `epic: EPIC-001` (inherited from the story).

## Sprints & the Roadmap

```bash
mpos sprint create "Sprint 1 — Workspace Foundations"
mpos sprint plan --sprint SPRINT-001 --add STORY-001 --add TASK-001
```

`sprint create` makes `planning/sprints/SPRINT-001-sprint-1-workspace-foundations.md`.
`sprint plan` sets `sprint: SPRINT-001` on the named items and lists them under
`## Scope` in the sprint document with their current status.

`planning/roadmap.md` is the index of Epics and milestones — see
[`.mpos/rules/planning-rules.md`](../.mpos/rules/planning-rules.md) §4. It is not
edited directly for individual stories/tasks/sprints.

## Moving Tasks Through Statuses

A task's `status` field and the directory it lives in (`tasks/backlog|active|blocked|done`)
must always match. Use:

```bash
mpos task move TASK-001 active
```

This moves the file from `tasks/backlog/` to `tasks/active/` **and** updates
`status: active` in its frontmatter, in one operation. Never move the file manually.

## Full Example

```bash
mpos plan epic create "Team Workspaces"
mpos plan story create "Create a new workspace" --epic EPIC-001
mpos task create "Implement workspace creation API" --story STORY-001
mpos sprint create "Sprint 1 — Workspace Foundations"
mpos sprint plan --sprint SPRINT-001 --add STORY-001 --add TASK-001
mpos task move TASK-001 active
mpos status
```

After this, `.mpos/examples/` shows what each of these documents looks like once filled
in with real content — use them as a reference for tone and structure.

## Next Steps

- [How Change Management Works](04-how-change-management-works.md)
- [How Conflicts Work](05-how-conflicts-work.md)
