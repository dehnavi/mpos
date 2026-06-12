<!-- MPOS TEMPLATE: sprint | placeholders use {{...}} | see .mpos/rules/markdown-rules.md -->
---
id: "{{id}}"
title: "{{title}}"
type: sprint
status: planned
owner: "{{owner}}"
created_at: {{date}}
updated_at: {{date}}
tags: []
related:
  - ../roadmap.md
---

# {{title}}

## Goal

_(One or two sentences: the single most important outcome of this sprint.)_

## Scope

_(Populated by `mpos sprint plan --sprint {{id}}`. Each item links to a Story or Task
and shows its current status at the time it was added to scope.)_

| Item | Type | Status |
|------|------|--------|
| _(none yet)_ | | |

## Capacity & Velocity

- **Capacity:** _(e.g. team capacity in points or hours)_
- **Reference velocity:** _(from prior sprints, if known)_

## Risks

- **[RISK]** _(...)_

## Definition of Done

- [ ] All scoped Stories/Tasks have `status: done`.
- [ ] `mpos conflict scan` reports no new `critical` findings introduced this sprint.
- [ ] Change report generated for any significant scope changes.

## Related Documents

- [Roadmap](../roadmap.md)
