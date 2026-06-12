<!-- MPOS TEMPLATE: task | placeholders use {{...}} | see .mpos/rules/markdown-rules.md -->
---
id: "{{id}}"
title: "{{title}}"
type: task
status: backlog
owner: "{{owner}}"
created_at: {{date}}
updated_at: {{date}}
tags: []
related:
  - ../../planning/stories/{{story_id}}-{{story_slug}}.md
story: "{{story_id}}"
epic: "{{epic_id}}"
sprint: ""
priority: medium
---

# {{title}}

## Summary

_(One sentence: the concrete unit of work.)_

## Context

_(Why this task exists — link back to the story/epic and any relevant business rules.)_

## Description

_(What needs to be built/changed. Be specific enough that another engineer or an AI
agent can implement it without re-deriving intent.)_

## Acceptance Criteria

- [ ] _(Criterion 1)_

## Dependencies

- _(Other tasks, stories, or external systems this depends on, as links.)_

## Notes

_(Implementation notes, gotchas, follow-ups. Add **[TODO]** items here for anything
deferred.)_

## Related Documents

- [Story {{story_id}}](../../planning/stories/{{story_id}}-{{story_slug}}.md)

<!--
NOTE: This task's `status` field MUST match the directory it lives in
(tasks/backlog|active|blocked|done). Use `mpos task move {{id}} <status>` to change
both together — see .mpos/rules/planning-rules.md.
-->
