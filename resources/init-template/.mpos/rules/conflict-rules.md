---
id: rules-conflict
title: "Conflict & Drift Detection Rules"
type: rules
status: stable
owner: mpos
created_at: 2026-06-12
updated_at: 2026-06-12
tags: [rules, conflicts, drift, validation]
related:
  - markdown-rules.md
  - planning-rules.md
  - ai-safety-rules.md
---

# Conflict & Drift Detection Rules

`mpos conflict scan` runs a fixed set of heuristic checks across the workspace. It never
calls an external AI service — every check below is deterministic and explainable.

## 1. Severity levels

| Severity   | Meaning | Default behavior |
|------------|---------|-------------------|
| `info`     | Worth noting, no action required. | Reported only. |
| `warning`  | Should be reviewed soon; does not block normal commands. | Reported; `mpos status` counts it. |
| `critical` | Likely to cause incorrect planning, broken links, or contradictory rules. | Reported; `mpos doctor` and `mpos doc validate` exit non-zero if any critical findings exist. |

Internally these map onto the finer-grained `ConflictSeverity` enum
(`critical`, `high`, `medium`, `low`, `info`) used by the core `ConflictAnalyzer`:
`critical`→`critical`, `high`/`medium`→`warning`, `low`/`info`→`info`.

## 2. Checks performed

1. **Contradictory business rules** — two `[BUSINESS_RULE]` entries (in
   `docs/business-rules.md` or elsewhere) make incompatible statements about the same
   subject (detected via shared key terms + opposing qualifiers, e.g. "must" vs.
   "must not", numeric limits that disagree). → `critical`.

2. **Requirement mismatch (PRD vs. planning)** — a requirement or feature named in
   `docs/prd.md` has no corresponding Epic/Story, or an Epic/Story references a feature
   not mentioned anywhere in `docs/prd.md`. → `warning`.

3. **Missing related documents** — any `related:` entry, inline link, or
   `epic:`/`story:`/`sprint:` reference that does not resolve to an existing file.
   → `critical`.

4. **Blocking open questions** — an `[OPEN_QUESTION]` inside a Story/Task whose
   `status` is `in-progress` or later. → `warning` (escalates to `critical` if the
   story's `status` is `done`).

5. **Unmapped tasks** — a Task with no `story:`, or a Story with no `epic:`.
   → `critical` (see [planning-rules.md](planning-rules.md) §1).

6. **Scope expansion without planning update** — new `[BUSINESS_RULE]` or acceptance
   criteria lines added to a Story/Task after its `sprint:` was assigned, with no
   matching entry in `changes/requests/`. → `warning`.

7. **Decisions contradicting active rules** — an `accepted` ADR whose `## Decision`
   text conflicts with a currently-active (non-superseded) `[BUSINESS_RULE]`.
   → `critical`.

## 3. Annotation behavior

- Findings are written to `changes/reports/` only when `mpos conflict scan --report` is
  used; by default, `conflict scan` prints to the terminal / returns JSON for the IDE.
- When `--annotate` is passed, MPOS inserts `[CONFLICT]` blocks (see
  [markdown-rules.md](markdown-rules.md) §3) directly above the offending lines. It
  **never deletes or rewrites** the offending content itself.
- Re-running `mpos conflict scan` does not duplicate an existing `[CONFLICT]` block for
  the same finding (matched by a stable finding hash stored in the block's HTML comment,
  e.g. `<!-- mpos-conflict: c7f1ac -->`).

## 4. Resolving findings

1. Read the `[CONFLICT]` block (or scan output) to understand which documents/sections
   are involved.
2. Edit the documents to remove the contradiction — section-level edits only.
3. Delete the `[CONFLICT]` block once resolved.
4. Re-run `mpos conflict scan` to confirm the finding no longer appears.
5. If the resolution changes planning (re-scoping, re-prioritizing), follow the change
   management flow: `mpos change request` → make edits → `mpos change report`.

## 5. What this is not

Conflict scanning is a **heuristic aid**, not a source of truth. A finding does not mean
a document is "wrong" — it means two documents disagree and a human should decide which
one is correct (or how to reconcile them). Tooling must never auto-resolve a `critical`
finding by deleting content.
