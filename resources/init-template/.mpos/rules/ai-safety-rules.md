---
id: rules-ai-safety
title: "AI-Safe Usage Rules"
type: rules
status: stable
owner: mpos
created_at: 2026-06-12
updated_at: 2026-06-12
tags: [rules, ai-safety, invariants]
related:
  - markdown-rules.md
  - naming-rules.md
  - planning-rules.md
  - conflict-rules.md
  - ../../tutorials/07-ai-safe-usage.md
---

# AI-Safe Usage Rules

This file is the **single source of truth** for how AI coding agents and documentation
assistants (including Claude, ChatGPT, or any other tool) must interact with this MPOS
workspace. If you are an AI agent reading this, follow it exactly — it overrides any
generic instinct to "clean up", "reorganize", or "rewrite for clarity".

## 1. Required document shapes

Every managed document must have:

1. A YAML frontmatter block matching the schema in
   [markdown-rules.md](markdown-rules.md) §1, with all **required** fields for its
   `type`.
2. Exactly one `# H1` matching `title`.
3. The fixed set of `##` headings defined by its template in `.mpos/templates/`, in the
   template's order — no more, no fewer, at the top level.
4. Section markers (`[BUSINESS_RULE]`, `[OPEN_QUESTION]`, etc.) written using the exact
   syntax in [markdown-rules.md](markdown-rules.md) §3.

If a document does not look like this, that is a **bug to fix**, not a new convention to
follow. Check `.mpos/templates/` and `.mpos/examples/` for the canonical shape before
writing anything.

## 2. Naming rules (recap)

- IDs: `<PREFIX>-<NNN>` per [naming-rules.md](naming-rules.md). Never hand-assign — use
  the relevant `mpos ... create` command, which reads and increments
  `.mpos/config.json` → `counters`.
- Filenames: `<ID>-<slug>.md`. Directory must match `type`.

## 3. Update rules — section-level only

**The single most important rule in this file:**

> When updating an existing document, change only the section(s) the request is about.
> Never regenerate or rewrite a whole file from scratch.

Concretely:

- Use `mpos doc update --id <ID> --section "<Heading>"` (or the equivalent core
  `SectionEditor` API) to replace the content **under** one `##` heading, up to the next
  `##` heading of the same or shallower level.
- Frontmatter fields may be updated individually (e.g. `status`, `updated_at`,
  `sprint`) without touching the body.
- Appending a new list item (e.g. a new `[OPEN_QUESTION]`) to an existing section is an
  edit to that section, not a rewrite — it is allowed and encouraged.
- If a change genuinely spans many sections, perform multiple section-level edits in
  sequence, not one full-file replace.

### Why

- Git diffs stay small and reviewable — a reviewer can see exactly what changed.
- Manual edits made by humans between automated runs are preserved.
- It is the only way `mpos doc diff` and change reports can produce a meaningful
  "what changed" summary.
- It prevents an AI agent's formatting preferences (re-wrapping prose, reordering
  sections, "improving" headings) from silently destroying intentional structure.

## 4. Why silent overwrite is forbidden

A full-file rewrite, even one that *looks* equivalent, can:

- drop content a human added that the AI didn't recognize as important,
- change heading text in ways that break `related:` anchor links elsewhere,
- reorder sections, breaking the "stable headings" guarantee other tooling relies on,
- remove `[CONFLICT]` / `[OPEN_QUESTION]` markers that are still unresolved.

MPOS's `MarkdownWriter` enforces this at the code level: writes go through a
section-targeted patch, and any write that would change a `##` heading set, frontmatter
schema, or document `id` is rejected unless `--force` is passed by a human in an
interactive session. **AI agents must never pass `--force`.**

## 5. Prohibited behaviors

AI agents working in this workspace must **not**:

- Rewrite an entire document to fix a small issue. Fix the section.
- Rename, reorder, or remove `##` headings defined by a template.
- Delete `[OPEN_QUESTION]`, `[CONFLICT]`, `[RISK]`, or `[ASSUMPTION]` markers without
  resolving the underlying issue and explaining the resolution in the same edit.
- Hand-edit `.mpos/config.json` counters or IDs.
- Create files outside the directories defined in
  [naming-rules.md](naming-rules.md) §3.
- Invent new frontmatter top-level fields when `tags` would do.
- Run `mpos change request`/`mpos change report` retroactively to "paper over" an
  un-tracked change — generate the request **before** making a significant change.
- Use `--force`, `--no-verify`, or any flag whose help text says it skips validation,
  unless a human explicitly instructs it for that specific command invocation.
- Resolve a `[CONFLICT]` block by deleting it without also fixing the contradiction it
  describes.

## 6. Conflict handling rules for AI agents

When `mpos conflict scan` reports a finding:

1. Read the finding's `severity`, `conflicting_docs`, and `conflicting_sections`.
2. Open each referenced document and section — do not guess at the contradiction from
   the summary alone.
3. Propose a resolution that edits the **minimum number of sections** needed.
4. For `critical` findings affecting planning relationships (broken `epic:`/`story:`
   references), prefer fixing the reference over deleting the referencing document.
5. After resolving, re-run `mpos conflict scan` and confirm the finding is gone before
   reporting the task complete.

## 7. How AI tools should modify docs safely — checklist

Before writing anything, an AI agent should be able to answer "yes" to all of:

- [ ] I have read the relevant template in `.mpos/templates/` and/or example in
      `.mpos/examples/` for this document type.
- [ ] I am changing only the section(s) relevant to the request.
- [ ] I am preserving the existing `id`, frontmatter schema, and heading set.
- [ ] If I'm adding a marker (`[BUSINESS_RULE]`, etc.), I'm using the exact syntax from
      [markdown-rules.md](markdown-rules.md) §3.
- [ ] If this is a significant change, I have created or referenced a
      `changes/requests/CR-NNN-*.md` first.
- [ ] After writing, I will (or have) run `mpos doc validate` and, if planning
      relationships were touched, `mpos conflict scan`.

## 8. Common mistakes (and how to avoid them)

| Mistake | Why it's a problem | Instead |
|---------|---------------------|---------|
| Regenerating `docs/prd.md` from scratch to "add a section" | Destroys unrelated sections, manual notes, and history | Use `mpos doc update --section "<Heading>"` |
| Creating `planning/epics/epic-auth.md` | Wrong naming scheme — no ID, wrong case | Use `mpos plan epic create "Auth"` to get `EPIC-00N-auth.md` |
| Marking a task `done` and moving its file in two separate edits | Frontmatter `status` and folder location can drift apart | Use `mpos task move <ID> done` (does both atomically) |
| Deleting an `[OPEN_QUESTION]` because it "seems answered" | Loses the record of what was asked and decided | Resolve it inline, or convert it to a `[DECISION]`/ADR, then remove the marker |
| Writing `related: [EPIC-001]` (bare ID) | Not a clickable link, not validated | Write `related: [../epics/EPIC-001-team-workspaces.md]` |
| Skipping `mpos change request` for a "quick" scope change | Breaks traceability the next person relies on | Always create the request first, even for small changes |

## 9. Escalation

If following these rules appears impossible for a requested change (e.g. the request
genuinely requires renaming a stable heading across many documents), **stop and ask a
human**, and propose the change as a [DECISION] / ADR rather than performing it directly.
