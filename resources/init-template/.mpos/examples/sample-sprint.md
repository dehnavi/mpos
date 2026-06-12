<!--
MPOS EXAMPLE: this shows a filled-out Sprint as it would appear at
`planning/sprints/SPRINT-001-sprint-1-workspace-foundations.md`. Relative links below
assume that location.
-->
---
id: SPRINT-001
title: "Sprint 1 — Workspace Foundations"
type: sprint
status: active
owner: "alex@acme.example"
created_at: 2026-06-01
updated_at: 2026-06-11
tags: [workspaces]
related:
  - ../roadmap.md
---

# Sprint 1 — Workspace Foundations

## Goal

Ship workspace creation end-to-end (API + UI) so an admin can create a workspace and
land on it, enforcing BR-1 and BR-2.

## Scope

| Item | Type | Status |
|------|------|--------|
| [STORY-001 — Create a new workspace](../stories/STORY-001-create-a-new-workspace.md) | story | in-progress |
| [TASK-001 — Implement workspace creation API](../../tasks/active/TASK-001-implement-workspace-creation-api.md) | task | active |

## Capacity & Velocity

- **Capacity:** ~20 points (2 engineers × 2 weeks)
- **Reference velocity:** n/a (first sprint)

## Risks

- **[RISK]** OQ-1 (free-tier limit definition) is still open; if unresolved by mid-sprint,
  STORY-001's acceptance criteria may need to change mid-flight.

## Definition of Done

- [ ] All scoped Stories/Tasks have `status: done`.
- [ ] `mpos conflict scan` reports no new `critical` findings introduced this sprint.
- [ ] Change report generated for any significant scope changes.

## Related Documents

- [Roadmap](../roadmap.md)
