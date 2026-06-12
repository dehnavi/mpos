<!-- MPOS TEMPLATE: story | placeholders use {{...}} | see .mpos/rules/markdown-rules.md -->
---
id: "{{id}}"
title: "{{title}}"
type: story
status: backlog
owner: "{{owner}}"
created_at: {{date}}
updated_at: {{date}}
tags: []
related:
  - ../epics/{{epic_id}}-{{epic_slug}}.md
epic: "{{epic_id}}"
sprint: ""
priority: medium
---

# {{title}}

## Summary

_(One or two sentences: what the user can do once this story is done.)_

## Description

_(As a <persona>, I want <capability>, so that <benefit>. Add detail as needed —
edge cases, UX notes, links to designs.)_

## Acceptance Criteria

- [ ] _(Criterion 1 — must be testable.)_
- [ ] _(Criterion 2)_

## Tasks

_(Linked as Tasks are created via `mpos task create --story {{id}}`.)_

- _(none yet)_

## Open Questions

- **[OPEN_QUESTION] (OQ-1)** _(...)_

## Related Documents

- [Epic {{epic_id}}](../epics/{{epic_id}}-{{epic_slug}}.md)
