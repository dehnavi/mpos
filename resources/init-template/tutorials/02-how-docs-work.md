---
id: tutorial-02-how-docs-work
title: "How Documents Work"
type: onboarding
status: stable
owner: mpos
created_at: {{date}}
updated_at: {{date}}
tags: [tutorial, onboarding, markdown]
related:
  - 01-getting-started.md
  - ../.mpos/rules/markdown-rules.md
  - ../.mpos/rules/naming-rules.md
---

# How Documents Work

Every document MPOS manages follows the same shape, described in full in
[`.mpos/rules/markdown-rules.md`](../.mpos/rules/markdown-rules.md). This tutorial walks
through that shape with examples.

## Frontmatter

Every document starts with a YAML block:

```yaml
---
id: STORY-001
title: "Create a new workspace"
type: story
status: ready
owner: ""
created_at: 2026-06-12
updated_at: 2026-06-12
tags: [workspaces]
related:
  - ../epics/EPIC-001-team-workspaces.md
epic: EPIC-001
sprint: ""
priority: high
---
```

`id`, `title`, `type`, `status`, `created_at`, and `updated_at` are required on every
document. Other fields depend on the type — see
[`.mpos/rules/markdown-rules.md`](../.mpos/rules/markdown-rules.md) §1 for the full
table.

## Stable Headings & Section-Level Edits

Each document type has a fixed set of `##` headings, defined by its template in
`.mpos/templates/`. For a Story, that's: Summary, Description, Acceptance Criteria,
Tasks, Open Questions, Related Documents.

To change just one section, use:

```bash
mpos doc update --id STORY-001 --section "Acceptance Criteria" --file new-criteria.md
```

This replaces **only** the content under `## Acceptance Criteria`, up to the next `##`
heading. Everything else in the file — including any manual edits a teammate made —
is untouched.

### Good vs Bad

**Good** — section-level update (diff shows only the changed section):

```diff
 ## Acceptance Criteria

-- [ ] Admin can submit a workspace name from the "New Workspace" dialog.
+- [ ] Admin can submit a workspace name from the "New Workspace" dialog.
+- [ ] Duplicate names (case-insensitive) are rejected with a clear error (BR-1).
```

**Bad** — regenerating the whole file (diff touches everything, including unrelated
sections and any manual notes):

```diff
-# Create a new workspace
-
-## Summary
-As an organization admin, I can create a new workspace...
+# Create A New Workspace
+
+## Overview
+This story covers workspace creation...
```

## Section Markers

Use these inline, as bold tags at the start of a list item:

```markdown
- **[BUSINESS_RULE] (BR-1)** Workspace names must be unique within an organization.
- **[OPEN_QUESTION] (OQ-1)** Should free-tier orgs be limited to 1 workspace?
- **[RISK]** Migrating existing accounts may require downtime.
```

Find them with:

```bash
mpos search --marker OPEN_QUESTION
```

## Validating Documents

```bash
mpos doc validate
```

This checks frontmatter schema, required fields, heading structure, marker syntax,
duplicate IDs, and broken `related:`/link references. Fix issues it reports before
committing.

## Next Steps

- [How Planning Works](03-how-planning-works.md)
- [AI-Safe Usage Patterns](07-ai-safe-usage.md)
