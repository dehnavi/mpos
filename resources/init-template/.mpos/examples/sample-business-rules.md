<!--
MPOS EXAMPLE: this shows a filled-out business rules doc as it would appear at
`docs/business-rules.md`. Relative links below assume that location.
-->
---
id: business-rules
title: "Acme Boards — Business Rules"
type: business-rules
status: draft
owner: "product@acme.example"
created_at: 2026-05-01
updated_at: 2026-06-10
tags: [acme-boards]
related:
  - prd.md
  - glossary.md
---

# Acme Boards — Business Rules

## Overview

Canonical business rules for Acme Boards. Every `[BUSINESS_RULE]` here should be
traceable to the [PRD](prd.md) and to the Epics/Stories that implement it.

## Rules

- **[BUSINESS_RULE] (BR-1)** A workspace name must be unique within an organization,
  case-insensitively.
- **[BUSINESS_RULE] (BR-2)** Free-tier organizations may create up to **1** workspace.
  Paid organizations may create unlimited workspaces.
- **[BUSINESS_RULE] (BR-3)** A board must belong to exactly one workspace and cannot be
  moved between workspaces.
- **[BUSINESS_RULE] (BR-4)** Only organization admins can delete a workspace; deleting
  a workspace soft-deletes all boards within it for 30 days before permanent removal.

## Constraints

- **[BUSINESS_RULE] (BR-C1)** All data must be stored in a region selectable at
  organization signup (data residency requirement).

## Assumptions

- **[ASSUMPTION]** Most organizations on the free tier will have a single team and
  therefore a single workspace is sufficient at launch (informs BR-2; see
  [PRD](prd.md) OQ-1).

## Related Documents

- [PRD](prd.md)
- [Glossary](glossary.md)
