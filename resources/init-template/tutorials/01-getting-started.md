---
id: tutorial-01-getting-started
title: "Getting Started with MPOS"
type: onboarding
status: stable
owner: mpos
created_at: {{date}}
updated_at: {{date}}
tags: [tutorial, onboarding]
related:
  - 02-how-docs-work.md
  - ../docs/prd.md
---

# Getting Started with MPOS

This is the first tutorial. Read it before doing anything else in this workspace.

## What is MPOS?

MPOS (Markdown Project Operating System) keeps your product documentation, planning,
tasks, decisions, and change history as plain Markdown files in this repository. There
is no database — everything you see in `docs/`, `planning/`, `tasks/`, `decisions/`,
and `changes/` **is** the project state.

## Prerequisites

- Node.js 18+ and npm.
- Git (recommended, not strictly required).
- The `mpos` CLI installed (`npm install -g mpos`, or `npm link` from this repo during
  development).

## Initialize a Workspace

From an empty or existing repository:

```bash
mpos init --name "My Project"
```

Expected output (abridged):

```
✔ Created .mpos/ (config, rules, templates, examples)
✔ Created docs/ (prd.md, business-rules.md, glossary.md, architecture.md)
✔ Created planning/ (roadmap.md, epics/, stories/, sprints/)
✔ Created tasks/ (backlog/, active/, blocked/, done/)
✔ Created decisions/
✔ Created changes/ (requests/, reports/)
✔ Created tutorials/
MPOS workspace initialized. Run `mpos doctor` to verify, or `mpos ide` to open the
browser IDE.
```

If `mpos init` is run in a directory that already has some of these files, it will
**not** overwrite them — it only creates what's missing, and prints what it skipped.

## Tour of the Generated Structure

| Path | What it's for |
|------|-----------------|
| `.mpos/config.json` | Project configuration, ID counters, port defaults. |
| `.mpos/rules/` | The rules every document and command follows. **Read these.** |
| `.mpos/templates/` | The canonical shape of every document type. |
| `.mpos/examples/` | Filled-out sample documents for a fictional product ("Acme Boards"). |
| `docs/` | Your living product documents: PRD, business rules, glossary, architecture. |
| `planning/` | Roadmap, epics, stories, sprints. |
| `tasks/` | Work items, organized by status (`backlog`, `active`, `blocked`, `done`). |
| `decisions/` | Architecture/product/policy decision records (ADRs). |
| `changes/` | Change requests (before) and change reports (after). |
| `tutorials/` | This guide and the ones that follow. |

## Your First Commands

```bash
mpos doctor      # validate the workspace is set up correctly
mpos status      # project health: active sprint, open conflicts, task counts
mpos search "workspace"   # find docs by title/tag/marker/text
```

Expected `mpos status` output for a freshly-initialized project:

```
Project: My Project
Active sprint: (none)
Tasks: 0 backlog, 0 active, 0 blocked, 0 done
Open conflicts: 0 critical, 0 warning
Open questions: 0
```

## Next Steps

1. [How Docs Work](02-how-docs-work.md) — frontmatter, headings, markers, and how to
   edit safely.
2. [How Planning Works](03-how-planning-works.md) — epics, stories, tasks, sprints.
3. If you're using an AI coding assistant in this workspace, read
   [AI-Safe Usage Patterns](07-ai-safe-usage.md) **before** asking it to edit anything.
