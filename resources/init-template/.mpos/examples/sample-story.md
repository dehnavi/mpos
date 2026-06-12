<!--
MPOS EXAMPLE: this shows a filled-out Story as it would appear at
`planning/stories/STORY-001-create-a-new-workspace.md`. Relative links below assume
that location.
-->
---
id: STORY-001
title: "Create a new workspace"
type: story
status: in-progress
owner: "alex@acme.example"
created_at: 2026-05-03
updated_at: 2026-06-10
tags: [workspaces]
related:
  - ../epics/EPIC-001-team-workspaces.md
epic: EPIC-001
sprint: SPRINT-001
priority: high
---

# Create a new workspace

## Summary

As an organization admin, I can create a new workspace so my team has a place to start
adding boards.

## Description

As an **organization admin**, I want to **create a workspace by giving it a name**, so
that **my team can begin organizing work in Acme Boards**.

- The workspace name must be unique within the organization (BR-1).
- If the organization is on the free tier and already has a workspace, creation must be
  blocked with a clear error referencing the upgrade path (BR-2).

## Acceptance Criteria

- [ ] Admin can submit a workspace name from the "New Workspace" dialog.
- [ ] Duplicate names (case-insensitive) within the same organization are rejected with
      a clear error (BR-1).
- [ ] Free-tier organizations that already have one workspace see an upgrade prompt
      instead of the creation form (BR-2).
- [ ] On success, the admin is redirected to the new (empty) workspace.

## Tasks

- [TASK-001 — Implement workspace creation API](../../tasks/active/TASK-001-implement-workspace-creation-api.md)

## Open Questions

- **[OPEN_QUESTION] (OQ-1)** Should the free-tier limit (BR-2) be 1 workspace per
  organization, or 1 per member? Blocks finalizing the acceptance criteria above —
  see [PRD](../../docs/prd.md) OQ-1.

## Related Documents

- [Epic EPIC-001](../epics/EPIC-001-team-workspaces.md)
