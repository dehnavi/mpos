---
id: tutorial-07-ai-safe-usage
title: "AI-Safe Usage Patterns"
type: onboarding
status: stable
owner: mpos
created_at: {{date}}
updated_at: {{date}}
tags: [tutorial, onboarding, ai-safety]
related:
  - ../.mpos/rules/ai-safety-rules.md
  - 02-how-docs-work.md
---

# AI-Safe Usage Patterns

If you're using Claude, ChatGPT, or any AI coding assistant in this workspace, point it
at [`.mpos/rules/ai-safety-rules.md`](../.mpos/rules/ai-safety-rules.md) first — that
file is the authoritative contract. This tutorial summarizes it with examples.

## The Golden Rule

> Change only the section(s) the request is about. Never regenerate a whole file.

Everything else in this document follows from that.

## Good vs Bad: Section Edits

**Good** — ask the AI to do this:

> "In `STORY-001`, under `## Acceptance Criteria`, add a checkbox for the free-tier
> limit error message."

**Bad** — avoid asking the AI to do this:

> "Rewrite `STORY-001` to be clearer."

The second request invites a full-file rewrite, which risks dropping the
`[OPEN_QUESTION]`, changing heading text, and producing a diff a reviewer can't quickly
assess.

## Good vs Bad: Linking

**Good:**

```yaml
related:
  - ../epics/EPIC-001-team-workspaces.md
```

```markdown
See [Business Rules § Rules](../../docs/business-rules.md#rules) for BR-2.
```

**Bad:**

```yaml
related:
  - EPIC-001        # bare ID — not a link, not validated
```

```markdown
See the business rules doc for the limit.   <!-- no link at all -->
```

## Good vs Bad: Markers

**Good** — preserving an unresolved question while adding new information:

```markdown
## Open Questions

- **[OPEN_QUESTION] (OQ-1)** Should free-tier orgs be limited to 1 workspace, or 1 per
  member? *(Still open as of 2026-06-12 — affects AC for BR-2.)*
```

**Bad** — deleting it because it "seems answered" without recording the answer:

```markdown
## Open Questions

_(none)_
```

If OQ-1 has actually been answered, convert it to a `[DECISION]` (and an ADR if
significant), then remove the marker — don't just delete it.

## Checklist Before You Commit

From [`.mpos/rules/ai-safety-rules.md`](../.mpos/rules/ai-safety-rules.md) §7:

- [ ] I read the relevant template/example for this document type.
- [ ] I changed only the relevant section(s).
- [ ] I preserved `id`, frontmatter schema, and heading set.
- [ ] New markers use the exact syntax from
      [`.mpos/rules/markdown-rules.md`](../.mpos/rules/markdown-rules.md) §3.
- [ ] Significant changes have a `changes/requests/CR-NNN-*.md`.
- [ ] `mpos doc validate` and `mpos conflict scan` pass (or findings are understood).

## Common Mistakes — Quick Reference

See [`.mpos/rules/ai-safety-rules.md`](../.mpos/rules/ai-safety-rules.md) §8 for the
full table of common mistakes and the correct alternative for each.

## Further Reading

- [`.mpos/rules/markdown-rules.md`](../.mpos/rules/markdown-rules.md)
- [`.mpos/rules/naming-rules.md`](../.mpos/rules/naming-rules.md)
- [`.mpos/rules/planning-rules.md`](../.mpos/rules/planning-rules.md)
- [`.mpos/rules/conflict-rules.md`](../.mpos/rules/conflict-rules.md)
