<!-- MPOS TEMPLATE: onboarding-guide | placeholders use {{...}} | see .mpos/rules/markdown-rules.md -->
---
id: onboarding-guide
title: "{{title}} — Onboarding Guide"
type: onboarding
status: draft
owner: "{{owner}}"
created_at: {{date}}
updated_at: {{date}}
tags: [onboarding]
related:
  - ../../docs/prd.md
  - ../../tutorials/01-getting-started.md
---

# {{title}} — Onboarding Guide

## Welcome

_(A short welcome paragraph for new team members joining this project.)_

## Project Structure

- `docs/` — living product documents (PRD, business rules, glossary, architecture).
- `planning/` — roadmap, epics, stories, sprints.
- `tasks/` — work items by status (`backlog`, `active`, `blocked`, `done`).
- `decisions/` — architecture/product/policy decision records (ADRs).
- `changes/` — change requests and reports.
- `.mpos/` — rules, templates, examples, and configuration. Read `.mpos/rules/` first.
- `tutorials/` — step-by-step guides (start with `01-getting-started.md`).

## Where Things Live

| I want to... | Look in / use |
|---------------|-----------------|
| Understand the product vision | `docs/prd.md` |
| Find a defined term | `docs/glossary.md` |
| See current priorities | `planning/roadmap.md` |
| Find my assigned work | `tasks/active/` |
| Understand a past decision | `decisions/` |
| Propose a significant change | `mpos change request` |

## Daily Workflow

1. `mpos status` — see active sprint, open conflicts, your tasks.
2. Pick up a task from `tasks/active/`.
3. Update the task's `## Notes` as you go (`mpos doc update`).
4. Move it to `done` when finished: `mpos task move <ID> done`.
5. If you discover new work, file it as a Story/Task — don't expand scope silently.

## Key Commands

```bash
mpos status              # project health overview
mpos search "<query>"    # find docs by title/tag/marker/text
mpos conflict scan        # check for contradictions/drift
mpos doc validate          # check markdown/frontmatter conventions
mpos ide                  # launch the local browser IDE
```

## Getting Help

- Read `tutorials/` in order if you're new.
- Read `.mpos/rules/ai-safety-rules.md` before using an AI assistant on this workspace.
- When unsure, prefer asking a question (`[OPEN_QUESTION]`) over guessing.
