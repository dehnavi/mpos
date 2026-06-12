---
id: rules-markdown
title: "Markdown Conventions"
type: rules
status: stable
owner: mpos
created_at: 2026-06-12
updated_at: 2026-06-12
tags: [rules, markdown, frontmatter, sections]
related:
  - naming-rules.md
  - planning-rules.md
  - conflict-rules.md
---

# Markdown Conventions

All files managed by MPOS (anything under `docs/`, `planning/`, `tasks/`, `decisions/`,
`changes/`) follow the conventions in this document. They exist so that `mpos doc update`
can find and replace a single section **without touching the rest of the file**, and so
that humans and AI tools read documents the same way.

## 1. Frontmatter schema

Every managed document starts with a YAML frontmatter block:

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
sprint: SPRINT-001
priority: high
---
```

| Field        | Required | Notes |
|--------------|----------|-------|
| `id`         | yes      | See [naming-rules.md](naming-rules.md). |
| `title`      | yes      | Human-readable title. Must match the document's `# H1`. |
| `type`       | yes      | One of: `prd`, `business-rules`, `glossary`, `architecture`, `epic`, `story`, `task`, `sprint`, `decision`, `change-request`, `change-report`. |
| `status`     | yes      | See [planning-rules.md](planning-rules.md) for allowed values per type. |
| `owner`      | no       | Free text (name, team, or empty string). |
| `created_at` | yes      | `YYYY-MM-DD`, set once, never changed. |
| `updated_at` | yes      | `YYYY-MM-DD`, updated by `mpos doc update` on every section change. |
| `tags`       | no       | Array of kebab-case strings. |
| `related`    | no       | Array of relative paths to related documents. |
| `epic`       | story/task only | ID of the parent epic. |
| `story`      | task only | ID of the parent story. |
| `sprint`     | story/task | ID of the assigned sprint, if any. |
| `priority`   | story/task/decision | One of `critical`, `high`, `medium`, `low`. |

Unknown extra fields are preserved but not validated — prefer `tags` for ad-hoc metadata
instead of inventing new top-level keys.

## 2. Stable headings

Each document type has a **fixed set of top-level (`##`) headings**, defined by its
template in `.mpos/templates/`. These headings are the unit of update for
`mpos doc update --section "<Heading>"`.

Rules:

- Do not rename a `##` heading defined by the template. If you need a new heading, add it
  as a `###` (or deeper) subsection under an existing `##` section, or propose a template
  change via a [DECISION] record.
- Do not reorder the top-level `##` headings from the template. Stable order means stable
  diffs.
- Exactly one `# H1` per document, matching `title` in frontmatter.

## 3. Section markers

Use these inline markers to flag content that tooling and humans should be able to find
with `mpos search --marker <NAME>`:

| Marker            | Meaning                                                       |
|-------------------|----------------------------------------------------------------|
| `[BUSINESS_RULE]` | A rule that the product must enforce. Should also exist (or be summarized) in `docs/business-rules.md`. |
| `[OPEN_QUESTION]` | Something unresolved that may block planning or implementation. |
| `[CONFLICT]`      | A detected or suspected contradiction with another document. Usually inserted by `mpos conflict scan`, not by hand. |
| `[DECISION]`      | A decision has been made inline; for significant decisions, also create an ADR via `mpos decision create`. |
| `[ASSUMPTION]`    | Something assumed true but not verified. |
| `[RISK]`          | A risk to delivery, quality, or correctness. |
| `[TODO]`          | An outstanding action item not yet tracked as a Task. |

### Syntax

Markers are written as a bold tag at the start of a list item, optionally followed by a
stable local ID in parentheses:

```markdown
- **[BUSINESS_RULE]** Workspace names must be unique within an organization.
- **[OPEN_QUESTION] (OQ-1)** Should free-tier orgs be limited to 1 workspace?
- **[RISK]** Migrating existing single-workspace accounts may require downtime.
```

The regex used by tooling is:

```
^\s*-\s+\*\*\[(BUSINESS_RULE|OPEN_QUESTION|CONFLICT|DECISION|ASSUMPTION|RISK|TODO)\]\*\*(\s+\(([A-Za-z0-9_-]+)\))?\s+(.*)$
```

- Group 1 = marker name, group 3 = optional local ID, group 4 = text.
- Local IDs (`OQ-1`, `RISK-3`, …) are unique **within the document**, not globally. They
  let `mpos conflict scan` and change reports reference a specific item
  (e.g. "resolves OQ-1 in `STORY-001`").

### `[CONFLICT]` blocks

When `mpos conflict scan` detects an issue, it inserts a block immediately **above** the
offending content rather than editing it:

```markdown
> [CONFLICT] (auto-detected 2026-06-12, severity: warning)
> This rule appears to contradict `docs/business-rules.md` §"Workspace Limits":
> "Free-tier orgs are limited to 1 workspace."
> Resolve by editing one of the two documents, then re-run `mpos conflict scan`.

- **[BUSINESS_RULE]** Free-tier orgs may create up to 3 workspaces.
```

Resolve a `[CONFLICT]` block by fixing the underlying contradiction and deleting the
block — never by deleting only the block.

## 4. Links

- Use **relative Markdown links** between documents:
  `[EPIC-001](../epics/EPIC-001-team-workspaces.md)`.
- Link to a specific heading with a standard anchor:
  `[Business Rules § Workspace Limits](../../docs/business-rules.md#workspace-limits)`.
- Do not use absolute filesystem paths or `file://` URLs.
- `mpos doc validate` and `mpos doctor` check that every relative link resolves to a file
  that exists.

## 5. General formatting

- One blank line between sections; no trailing whitespace; UTF-8; LF line endings.
- Use `-` for unordered lists (not `*` or `+`), so diffs from `mpos doc update` are
  minimal.
- Code blocks use fenced triple backticks with a language tag.
- Tables are allowed and encouraged for structured data (acceptance criteria, comparisons).
- Prefer short paragraphs and lists over long prose — this keeps section-level diffs small
  and keeps documents skimmable for both humans and AI tools.
