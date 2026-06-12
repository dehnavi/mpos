<!--
MPOS EXAMPLE: this shows a filled-out Decision record (ADR) as it would appear at
`decisions/ADR-001-use-postgresql-as-primary-datastore.md`. Relative links below assume
that location.
-->
---
id: ADR-001
title: "Use PostgreSQL as primary datastore"
type: decision
status: accepted
owner: "cto@acme.example"
created_at: 2026-05-05
updated_at: 2026-05-06
tags: [architecture, datastore]
related:
  - ../docs/architecture.md
priority: high
---

# Use PostgreSQL as primary datastore

## Context

Acme Boards needs a primary datastore for organizations, workspaces, boards, lists, and
cards. The team is comfortable with both PostgreSQL and MongoDB. Data residency
(BR-C1) requires per-region deployments, and we expect relational queries (e.g.
"all cards across boards in a workspace assigned to user X") to be common.

## Decision

- **[DECISION]** We will use PostgreSQL (one instance per supported region) as the
  primary datastore for all Acme Boards entities.

## Consequences

### Positive

- Strong relational integrity for workspace/board/card hierarchy.
- Mature per-region managed offerings simplify BR-C1 compliance.
- Team has more existing operational experience with Postgres.

### Negative / Trade-offs

- Schema migrations require more care than a schemaless store.
- Horizontal write scaling beyond a single region requires future work.

## Alternatives Considered

| Option | Rejected because |
|--------|--------------------|
| MongoDB | Weaker fit for relational queries central to the product; team has less operational experience. |
| DynamoDB | Per-region data residency (BR-C1) harder to model with single-table design at this stage. |

## Related Documents

- [Architecture](../docs/architecture.md)
