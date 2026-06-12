<!--
MPOS EXAMPLE: this shows a generated Change Report as it would appear at
`changes/reports/CHG-001-add-sso-login-support.md`. It corresponds to an illustrative
change request `CR-001-add-sso-login-support.md` (not included in this example set —
see .mpos/templates/change-request.md for that template).
-->
---
id: CHG-001
title: "Add SSO login support"
type: change-report
status: final
owner: "alex@acme.example"
created_at: 2026-06-11
updated_at: 2026-06-11
tags: [auth]
related:
  - ../requests/CR-001-add-sso-login-support.md
---

# Add SSO login support

## Summary

Adds SAML-based SSO login as an enterprise-tier feature. Updates the PRD requirements
and business rules, adds a new Epic (EPIC-002) and its first Story, and records ADR-002
for the SAML library choice.

## Files Changed

| File | Change Type | Sections Changed |
|------|-------------|--------------------|
| `docs/prd.md` | modification | `## Requirements` (Should Have) |
| `docs/business-rules.md` | modification | `## Rules` (new BR-5) |
| `planning/epics/EPIC-002-enterprise-sso.md` | addition | (new file) |
| `planning/stories/STORY-004-configure-saml-idp.md` | addition | (new file) |
| `planning/roadmap.md` | modification | `## Epic Index` |
| `decisions/ADR-002-use-passport-saml-for-sso.md` | addition | (new file) |

## Additions

- New Epic `EPIC-002 — Enterprise SSO` with its first Story `STORY-004 — Configure SAML
  IdP`.
- New ADR `ADR-002` documenting the SAML library choice (`passport-saml`).
- New business rule **BR-5**: "Enterprise-tier organizations may configure exactly one
  SAML identity provider per organization."

## Modifications

- `docs/prd.md` § Requirements (Should Have): added "Enterprise SSO via SAML" as a
  Should Have requirement, linking to EPIC-002.
- `planning/roadmap.md` § Epic Index: added row for EPIC-002 under the "Enterprise
  Readiness" milestone.

## Removals

- None.

## Unresolved Questions

- `STORY-004` carries forward **[OPEN_QUESTION] (OQ-1)**: "Do we support multiple SAML
  IdPs per organization in the future, or is one-per-org permanent?" — not blocking
  for v1.

## Recommended Actions

- Review BR-5 against existing BR-2 (free-tier workspace limit) to confirm no
  interaction between plan tier and SSO eligibility.
- Schedule ADR-002 for architecture review before implementation begins.

## Conflicts Detected

- `mpos conflict scan` run after this change: **0 critical, 0 warning, 1 info**
  (EPIC-002 has zero Stories beyond STORY-004 — expected for a newly-created epic).

## Related Documents

- [Change Request CR-001](../requests/CR-001-add-sso-login-support.md)
