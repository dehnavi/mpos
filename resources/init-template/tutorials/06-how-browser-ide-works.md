---
id: tutorial-06-how-browser-ide-works
title: "How the Browser IDE Works"
type: onboarding
status: stable
owner: mpos
created_at: {{date}}
updated_at: {{date}}
tags: [tutorial, onboarding, ide]
related:
  - 05-how-conflicts-work.md
  - ../.mpos/config.json
---

# How the Browser IDE Works

The MPOS browser IDE is a **local-only** web UI over the same core services the CLI
uses. It does not require, and will never require, a network connection or cloud
account.

## Starting the IDE

```bash
mpos ide
```

By default this uses `ide.default_port` from `.mpos/config.json` (`4317`). To choose a
different port:

```bash
mpos ide --port 3020
mpos ide --host localhost --port 3020
```

Expected output:

```
MPOS IDE running at http://localhost:3020
Press Ctrl+C to stop.
```

## Port Selection Behavior

- If `--port` is omitted, MPOS uses `.mpos/config.json` → `ide.default_port`.
- If the chosen port is already in use, MPOS picks the next free port
  (`requested + 1`, `+2`, ...) and prints a notice:

  ```
  Port 3020 is in use. Using port 3021 instead.
  MPOS IDE running at http://localhost:3021
  ```

- `--host` defaults to `localhost`. The server only binds to the given host — it is
  not exposed on your network by default.

## Layout Overview

- **File explorer** (left) — `docs/`, `planning/`, `tasks/`, `decisions/`, `changes/`,
  grouped by type, mirroring the directory structure exactly.
- **Editor** (center) — Markdown source, frontmatter-aware: `id`, `type`, and `status`
  are shown in a header bar and are not freely editable text.
- **Preview** (right, toggleable) — rendered Markdown, with `[BUSINESS_RULE]`,
  `[OPEN_QUESTION]`, `[CONFLICT]`, `[RISK]`, `[ASSUMPTION]`, `[DECISION]`, `[TODO]`
  markers highlighted with distinct colors/icons.
- **Change panel** (right, toggleable) — shows the diff for the currently-edited
  document versus the last saved version, and any open `changes/requests/` relevant
  to it.

## Editing Safely

- Saving in the IDE goes through the same `SectionEditor`/`MarkdownWriter` services as
  `mpos doc update` — section-level patches, no silent full-file rewrites.
- The diff pane shows exactly what will change **before** you save.
- Conflict and open-question indicators in the file explorer come from the same
  `mpos conflict scan` heuristics — there is no separate "IDE-only" rule set.

## Search & Navigation

- Use the search box to find documents by title, ID, tag, marker, or text — same
  results as `mpos search`.
- Click any relative link (e.g. `[EPIC-001](../epics/EPIC-001-team-workspaces.md)`) to
  navigate directly to that document in the editor.

## Next Steps

- [AI-Safe Usage Patterns](07-ai-safe-usage.md)
