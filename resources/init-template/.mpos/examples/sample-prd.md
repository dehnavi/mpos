<!--
MPOS EXAMPLE: this shows a filled-out PRD as it would appear at `docs/prd.md`.
Relative links below assume that location (not `.mpos/examples/`).
-->
---
id: prd
title: "Acme Boards — Product Requirements"
type: prd
status: draft
owner: "product@acme.example"
created_at: 2026-05-01
updated_at: 2026-06-10
tags: [acme-boards]
related:
  - business-rules.md
  - glossary.md
  - architecture.md
  - ../planning/roadmap.md
---

# Acme Boards — Product Requirements

## Overview

Acme Boards is a lightweight Kanban-style project board for small teams (2–20 people).
Teams organize work into **workspaces**, each containing boards, lists, and cards. The
initial release targets teams currently using spreadsheets or sticky notes.

## Goals & Success Metrics

- **[BUSINESS_RULE]** A new user must be able to create a workspace and their first
  board within 5 minutes of signing up.
- **[BUSINESS_RULE]** 30% of free-tier signups create at least 3 cards within 24 hours
  ("activation").

## Target Users / Personas

- **Team Lead** — creates the workspace, invites teammates, sets up the first board.
- **Contributor** — joins an existing workspace, works cards on boards they're a
  member of.

See [Glossary](glossary.md) for precise definitions of "workspace", "board", "card".

## Requirements

### Must Have

- Users can sign up, create an organization, and create a workspace.
- Users can create boards with lists and cards within a workspace.
- Free-tier organizations are limited per [Business Rules](business-rules.md) (BR-2).

### Should Have

- Email invitations to join a workspace.
- Basic activity log per board.

### Could Have

- Card due dates and reminders.

## Out of Scope

- Real-time collaborative editing (v1 uses optimistic save + refresh).
- Third-party integrations (Slack, GitHub) — tracked for a later milestone.

## Open Questions

- **[OPEN_QUESTION] (OQ-1)** Should free-tier organizations be limited to 1 workspace,
  or 1 workspace per member? (See [Business Rules](business-rules.md) BR-2.)

## Related Documents

- [Business Rules](business-rules.md)
- [Glossary](glossary.md)
- [Architecture](architecture.md)
- [Roadmap](../planning/roadmap.md)
