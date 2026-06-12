<!--
MPOS EXAMPLE: this shows a filled-out Task as it would appear at
`tasks/active/TASK-001-implement-workspace-creation-api.md`. Relative links below
assume that location. Note that `status: active` matches the `tasks/active/` directory
— see .mpos/rules/planning-rules.md.
-->
---
id: TASK-001
title: "Implement workspace creation API"
type: task
status: active
owner: "alex@acme.example"
created_at: 2026-05-10
updated_at: 2026-06-11
tags: [workspaces, backend]
related:
  - ../../planning/stories/STORY-001-create-a-new-workspace.md
story: STORY-001
epic: EPIC-001
sprint: SPRINT-001
priority: high
---

# Implement workspace creation API

## Summary

Add `POST /api/workspaces` to create a workspace for the caller's organization.

## Context

Implements the backend half of
[STORY-001 — Create a new workspace](../../planning/stories/STORY-001-create-a-new-workspace.md).
Enforces BR-1 (unique name) and BR-2 (free-tier limit) from
[Business Rules](../../docs/business-rules.md).

## Description

- Validate `name` is non-empty and ≤ 60 characters.
- Reject if a workspace with the same name (case-insensitive) already exists in the
  organization → `409 Conflict`, error code `workspace_name_taken`.
- If the organization's plan is `free` and it already owns a workspace → `403
  Forbidden`, error code `workspace_limit_reached`.
- On success, create the workspace, add the caller as its first admin member, return
  `201 Created` with the workspace record.

## Acceptance Criteria

- [ ] `POST /api/workspaces` implemented per description above.
- [ ] Unit tests cover: success, duplicate name, free-tier limit.
- [ ] Error codes documented in API reference.

## Dependencies

- Organization `plan` field must exist (tracked separately — see
  [EPIC-001](../../planning/epics/EPIC-001-team-workspaces.md) Risks).

## Notes

- **[TODO]** Confirm with design whether the `workspace_limit_reached` error should
  include an upgrade URL in the response body or only in the frontend copy.

## Related Documents

- [Story STORY-001](../../planning/stories/STORY-001-create-a-new-workspace.md)
