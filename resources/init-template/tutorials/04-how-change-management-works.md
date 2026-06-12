---
id: tutorial-04-how-change-management-works
title: "How Change Management Works"
type: onboarding
status: stable
owner: mpos
created_at: {{date}}
updated_at: {{date}}
tags: [tutorial, onboarding, change-management]
related:
  - 03-how-planning-works.md
  - ../.mpos/rules/planning-rules.md
  - ../.mpos/templates/change-request.md
  - ../.mpos/templates/change-report.md
---

# How Change Management Works

Any update big enough to affect requirements, planning relationships, or more than one
document should be tracked with a **change request** (before) and a **change report**
(after). Small, single-section edits (fixing a typo, checking off an acceptance
criterion) do not need this — use judgment, and when in doubt, create the request.

## Step 1 — Change Request

Before making the change:

```bash
mpos change request "Add SSO login support"
```

Creates `changes/requests/CR-001-add-sso-login-support.md` from
`.mpos/templates/change-request.md`, status `pending`. Fill in:

- `## Motivation` — why this change is happening now.
- `## Affected Documents` — every file you expect to touch.
- `## Proposed Changes` — per-document, what sections will change.
- `## Impact Assessment` — change type and impact level.

## Step 2 — Make the Edits

Make the edits described in the change request, **section by section**, using
`mpos doc update` and the `mpos plan` / `mpos task` / `mpos decision` commands as
appropriate. Do not silently touch documents not listed in `## Affected Documents` —
if you discover you need to, update the change request first.

## Step 3 — Change Report

After the edits are applied:

```bash
mpos change report --request CR-001
```

This generates `changes/reports/CHG-001-add-sso-login-support.md` from
`.mpos/templates/change-report.md`, status `final`. It is **generated, not
hand-written** — it summarizes:

- `## Files Changed` — every file actually touched, with section names.
- `## Additions` / `## Modifications` / `## Removals`.
- `## Unresolved Questions` — any `[OPEN_QUESTION]` markers still open in touched docs.
- `## Conflicts Detected` — result of running `mpos conflict scan` as part of report
  generation.

See [`.mpos/examples/sample-change-report.md`](../.mpos/examples/sample-change-report.md)
for a fully worked example covering exactly this scenario (adding SSO support).

## Worked Example

```bash
mpos change request "Add SSO login support"
# ... edit changes/requests/CR-001-add-sso-login-support.md to fill in motivation,
#     affected documents, proposed changes ...

mpos plan epic create "Enterprise SSO"
mpos plan story create "Configure SAML IdP" --epic EPIC-002
mpos doc update --id prd --section "Requirements" --file ./sso-requirement.md
mpos decision create "Use passport-saml for SSO"

mpos change report --request CR-001
mpos conflict scan
```

## Next Steps

- [How Conflicts Work](05-how-conflicts-work.md)
