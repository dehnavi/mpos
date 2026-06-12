<!-- MPOS TEMPLATE: business-rules | placeholders use {{...}} | see .mpos/rules/markdown-rules.md -->
---
id: business-rules
title: "{{title}}"
type: business-rules
status: draft
owner: "{{owner}}"
created_at: {{date}}
updated_at: {{date}}
tags: []
related:
  - prd.md
  - glossary.md
---

# {{title}}

## Overview

_(What this document governs — the canonical list of business rules the product must
enforce. Every `[BUSINESS_RULE]` here should be traceable to the PRD and, where
applicable, to the Epics/Stories that implement it.)_

## Rules

- **[BUSINESS_RULE] (BR-1)** _(State a rule precisely and testably, e.g. "A workspace
  name must be unique within an organization, case-insensitively.")_

## Constraints

- **[BUSINESS_RULE] (BR-C1)** _(Technical, legal, or operational constraints that limit
  how rules can be implemented.)_

## Assumptions

- **[ASSUMPTION]** _(State assumptions underlying the rules above. If an assumption
  becomes false, the affected rules must be re-reviewed.)_

## Related Documents

- [PRD](prd.md)
- [Glossary](glossary.md)
