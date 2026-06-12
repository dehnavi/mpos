<!--
MPOS EXAMPLE: this shows a filled-out Epic as it would appear at
`planning/epics/EPIC-001-team-workspaces.md`. Relative links below assume that location.
-->
---
id: EPIC-001
title: "Team Workspaces"
type: epic
status: active
owner: "product@acme.example"
created_at: 2026-05-02
updated_at: 2026-06-10
tags: [workspaces]
related:
  - ../../docs/prd.md
  - ../roadmap.md
priority: high
---

# Team Workspaces

## Summary

Deliver the core "workspace" concept: organizations can create a workspace, invite
members, and use it as the container for boards. This is the foundation every other
Acme Boards feature builds on.

## Goals

- Support [PRD](../../docs/prd.md) "Must Have": create organization, create workspace,
  invite members.
- Enforce [Business Rules](../../docs/business-rules.md) BR-1 (unique names) and BR-2
  (free-tier limit).

## Scope

### In Scope

- Workspace creation, naming, and uniqueness validation.
- Member invitation via email.
- Free-tier workspace limit enforcement.

### Out of Scope

- Workspace transfer between organizations (future epic).

## Stories

- [STORY-001 — Create a new workspace](../stories/STORY-001-create-a-new-workspace.md)

## Risks

- **[RISK]** Enforcing BR-2 (free-tier limit) requires the billing/plan field to exist
  on the organization model before this epic can be considered done.

## Related Documents

- [PRD](../../docs/prd.md)
- [Roadmap](../roadmap.md)
