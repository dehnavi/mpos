---
id: tutorial-05-how-conflicts-work
title: "How Conflicts & Drift Detection Work"
type: onboarding
status: stable
owner: mpos
created_at: {{date}}
updated_at: {{date}}
tags: [tutorial, onboarding, conflicts]
related:
  - 04-how-change-management-works.md
  - ../.mpos/rules/conflict-rules.md
---

# How Conflicts & Drift Detection Work

`mpos conflict scan` is a **heuristic, fully local** check — no AI API calls. It looks
for the issues listed in
[`.mpos/rules/conflict-rules.md`](../.mpos/rules/conflict-rules.md) §2: contradictory
business rules, PRD/planning mismatches, broken references, blocking open questions,
unmapped tasks, scope creep, and decisions contradicting active rules.

## Running a Scan

```bash
mpos conflict scan
```

Example output:

```
Conflict scan: 5 documents checked
  [critical] STORY-007: `story:` reference TASK-014 → no matching story file
  [warning]  EPIC-003: epic has no stories
  [warning]  STORY-002: open question OQ-1 blocks status "in-progress"
  [info]     EPIC-002: epic has 1 story (newly created)

2 critical, 2 warning, 1 info
```

`mpos doctor` and `mpos doc validate` exit non-zero if any `critical` findings exist.

## Reading `[CONFLICT]` Markers

With `--annotate`, MPOS inserts a block directly above the offending content:

```markdown
> [CONFLICT] (auto-detected 2026-06-12, severity: warning)
> This rule appears to contradict `docs/business-rules.md` §"Rules":
> "Free-tier organizations may create up to 1 workspace."
> Resolve by editing one of the two documents, then re-run `mpos conflict scan`.

- **[BUSINESS_RULE]** Free-tier orgs may create up to 3 workspaces.
```

It never edits or deletes the flagged content — only adds the block above it.

## Resolving Findings

1. Read the finding (or `[CONFLICT]` block) to find the documents/sections involved.
2. Open both and decide which is correct (or how to reconcile them).
3. Edit the documents — section-level only.
4. Delete the `[CONFLICT]` block once resolved.
5. Re-run `mpos conflict scan` to confirm it's gone.

## Worked Example

Given the contradiction above:

```bash
# Decide docs/business-rules.md BR-2 is correct (1 workspace for free tier).
mpos doc update --id STORY-009 --section "Acceptance Criteria" \
  --file ./corrected-criteria.md   # removes the "up to 3 workspaces" line and the
                                    # [CONFLICT] block above it

mpos conflict scan
# → 0 critical, 0 warning
```

## Next Steps

- [How the Browser IDE Works](06-how-browser-ide-works.md) — conflicts and open
  questions are also surfaced visually there.
