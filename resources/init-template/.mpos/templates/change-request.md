<!-- MPOS TEMPLATE: change-request | placeholders use {{...}} | see .mpos/rules/markdown-rules.md -->
---
id: "{{id}}"
title: "{{title}}"
type: change-request
status: pending
owner: "{{owner}}"
created_at: {{date}}
updated_at: {{date}}
tags: []
related: []
priority: medium
---

# {{title}}

## Summary

_(One paragraph: what is being changed and at a high level, why.)_

## Motivation

_(The triggering event — new input, scope discovery, conflict resolution, decision,
etc. Link to the source: an [OPEN_QUESTION], an ADR, a conversation summary.)_

## Affected Documents

- _(List every document expected to change, as relative links. `mpos change report`
  will compare this list against what actually changed.)_

## Proposed Changes

_(Per affected document, describe the intended section-level edits. Be specific:
"In `planning/epics/EPIC-002-...md`, add a new Story under `## Stories`.")_

## Impact Assessment

- **Change type:** _(addition | modification | removal | restructure)_
- **Impact level:** _(low | medium | high | critical)_
- **Rationale:** _(why this impact level)_

## Related Documents

- _(...)_

<!--
NOTE: Create this BEFORE making the change (see .mpos/rules/ai-safety-rules.md §5).
After applying the change, run `mpos change report --request {{id}}` to generate the
matching report in changes/reports/.
-->
