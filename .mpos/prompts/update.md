# Update Prompt

When updating existing documents, follow these guidelines.

## Update Principles

1. **Identify the target section** before making any changes
2. **Preserve existing content** unless explicitly replacing it
3. **Use [UPDATED] marker** on modified sections with today's date
4. **Bump document version** (patch-level) for every non-trivial change
5. **Update `last_updated` frontmatter** field
6. **Log in changelog** — add an entry to `docs/changelog.md`

## Section Update Strategy

### Appending new content
When adding new items to an existing section:
- Add below existing items
- Do NOT delete existing items
- Use bullet points for lists

### Replacing content
When content must be updated or replaced:
- Add `> [UPDATED] YYYY-MM-DD` above the changed section
- Keep the old content with `~~strikethrough~~` for 1 sprint, then remove

### Removing content
When content becomes obsolete:
- Add `[DEPRECATED]` marker
- Move to a "Deprecated" subsection
- Do NOT delete — maintain for audit trail

## Safe Update Patterns

```markdown
## Feature Name
> [UPDATED] 2025-01-15 — changed acceptance criteria

**New content here**

~~Old content (deprecated 2025-01-15)~~
```

## Frontmatter Update Template

```yaml
---
version: 0.2.0          # bump patch for minor, minor for features, major for rewrites
last_updated: 2025-01-15
status: active          # draft | active | deprecated | archived
---
```
