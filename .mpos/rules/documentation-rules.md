# Documentation Rules

These rules govern how MPOS creates and maintains project documentation.

## Core Rules

1. **Never silently overwrite** user-authored content. Always show what changed.
2. **Preserve manual edits** — insert/update in the correct section only.
3. **Single source of truth** — each concept should appear in exactly one document.
4. **Frontmatter required** — all documents must have valid YAML frontmatter.
5. **Markers** — use [DECISION], [ASSUMPTION], [CONSTRAINT], [OPEN_QUESTION], [CONFLICT], [UPDATED], [DEPRECATED], [BUSINESS_RULE] appropriately.
6. **Section hierarchy** — h1 for document title, h2 for major sections, h3 for subsections.
7. **Version bump** — increment patch version on every non-trivial update.

## Document Update Policy

- Append new content to existing sections rather than replacing
- When content must be replaced, use [UPDATED] marker with date
- When content is removed, use [DEPRECATED] if history must be preserved
- When content conflicts, use [CONFLICT] and record resolution options

## Quality Standards

- Every document must have a clear purpose stated in the first paragraph
- Open questions ([OPEN_QUESTION]) must be tracked and resolved
- Business rules ([BUSINESS_RULE]) must be unambiguous and enforceable
- All decisions ([DECISION]) must include rationale
