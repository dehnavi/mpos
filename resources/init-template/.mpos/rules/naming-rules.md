---
id: rules-naming
title: "Naming & ID Rules"
type: rules
status: stable
owner: mpos
created_at: 2026-06-12
updated_at: 2026-06-12
tags: [rules, naming, ids]
related:
  - markdown-rules.md
  - planning-rules.md
---

# Naming & ID Rules

These rules are **enforced by `mpos doc validate`, `mpos doctor`, and `mpos conflict scan`**.
Do not invent alternative naming schemes. If a document does not fit these rules, fix the
document — do not change the rules without a [DECISION] record.

## 1. ID format

Every managed document (except the four "living" docs in `docs/`) has a unique `id` in its
frontmatter, formed as `<PREFIX>-<NNN>`:

| Document type    | Prefix  | Counter key (`.mpos/config.json` → `counters`) |
|-------------------|---------|--------------------------------------------------|
| Epic              | `EPIC`  | `epic`              |
| Story             | `STORY` | `story`             |
| Task              | `TASK`  | `task`              |
| Sprint            | `SPRINT`| `sprint`            |
| Decision (ADR)    | `ADR`   | `decision`          |
| Change Request    | `CR`    | `change_request`    |
| Change Report     | `CHG`   | `change_report`     |

- `NNN` is a **zero-padded, 3-digit, monotonically increasing integer** (`001`, `002`, … `999`).
- Counters live in `.mpos/config.json` and are incremented by the relevant `mpos` command —
  never assign IDs by hand.
- IDs are **permanent**. They are never reused, renumbered, or recycled, even if the
  underlying file is deleted or the work is cancelled.
- The four living docs (`docs/prd.md`, `docs/business-rules.md`, `docs/glossary.md`,
  `docs/architecture.md`) use a fixed `id` equal to their filename without extension
  (`prd`, `business-rules`, `glossary`, `architecture`). There is only ever one of each.

## 2. File naming

File names are derived from the ID and a short kebab-case slug of the title:

```
<ID>-<slug>.md
```

- `slug` = title, lowercased, non-alphanumeric characters replaced with `-`, collapsed
  repeats, trimmed to 40 characters, no trailing `-`.
- The slug is **descriptive only** — tooling matches on `id`, never on filename. Renaming
  a file's slug portion (to reflect a retitled doc) is safe; changing the `<ID>` prefix or
  number is not.

### Examples

| Type   | Title                              | Correct filename                          |
|--------|------------------------------------|--------------------------------------------|
| Epic   | "Team Workspaces"                  | `EPIC-001-team-workspaces.md`               |
| Story  | "Create a new workspace"           | `STORY-001-create-a-new-workspace.md`       |
| Sprint | "Sprint 1 — Workspace Foundations" | `SPRINT-001-sprint-1-workspace-foundations.md` |
| Task   | "Implement workspace creation API" | `TASK-001-implement-workspace-creation-api.md` |
| ADR    | "Use PostgreSQL as primary datastore" | `ADR-001-use-postgresql-as-primary-datastore.md` |
| CR     | "Add SSO login support"            | `CR-001-add-sso-login-support.md`           |
| Report | "Add SSO login support"            | `CHG-001-add-sso-login-support.md`          |

**Bad examples** (rejected by `mpos doc validate`):

- `epic1.md` — no ID prefix, no zero padding.
- `EPIC-1-team-workspaces.md` — number not zero-padded to 3 digits.
- `Team_Workspaces.md` — missing ID entirely, uses underscores/casing.
- `EPIC-001.md` — missing descriptive slug (allowed but discouraged; validator warns).

## 3. Directory placement

| Type           | Directory                                  |
|-----------------|---------------------------------------------|
| Epic            | `planning/epics/`                           |
| Story           | `planning/stories/`                         |
| Sprint          | `planning/sprints/`                         |
| Task            | `tasks/<status>/` (status = folder name)    |
| Decision        | `decisions/`                                 |
| Change Request  | `changes/requests/`                         |
| Change Report   | `changes/reports/`                          |
| PRD, Business Rules, Glossary, Architecture | `docs/` (fixed filenames) |

A document's directory must match its `type`. Moving a file across directories without
also updating `type`/`status` in frontmatter is a **validation error**.

## 4. Tags and slugs in frontmatter

- `tags` are free-form lowercase kebab-case strings, e.g. `tags: [auth, billing]`.
- `related` entries are **relative file paths** from the document's own directory (see
  [markdown-rules.md](markdown-rules.md) for link conventions), not bare IDs. This keeps
  links clickable in any Markdown viewer, including GitHub and the MPOS browser IDE.

## 5. Prohibited

- Do not hand-edit `.mpos/config.json` counters.
- Do not reuse an ID after deleting a document.
- Do not create documents outside the directories listed above.
- Do not use spaces, uppercase letters, or special characters in filenames other than
  the ID prefix and hyphens.
