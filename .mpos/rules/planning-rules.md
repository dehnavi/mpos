# Planning Rules

Rules that govern sprint and task planning in MPOS.

## Phase Rules

1. **Each phase must have** an objective, scope, deliverables, exit criteria, and risks.
2. **Phase exit criteria must be measurable** — avoid subjective criteria.
3. **Phases are sequential** — a new phase should not start before the current one is complete.
4. **Standard phases**: Discovery → MVP → Growth → Scale (customize as needed).

## Sprint Rules

1. **Each sprint must have a clear goal** stated in the Sprint Goal section.
2. **Sprint length** is typically 2 weeks (adjustable to 1 or 3 weeks).
3. **Definition of Done** must be explicitly stated per sprint.
4. **Tasks must link to sprints** via the `sprint:` frontmatter field.
5. **Dependencies must be named** — list explicit task/sprint IDs, not vague descriptions.
6. **Max tasks per sprint**: ~10-15 tasks for a typical team.

## Task Rules

1. **Each task must have** a title, summary, context, description, and acceptance criteria.
2. **Priority must be explicit** — critical, high, medium, or low.
3. **Estimate is required** — even if "TBD" initially; it should be refined before sprint start.
4. **Acceptance criteria must be verifiable** — testable, binary (done or not done).
5. **One owner per task** — assign a clear owner before sprint starts.

## Backlog Management

- The product backlog is the single source of truth for planned work
- Backlog items must be refined before entering a sprint
- The backlog should always be prioritized
- Items not planned for a release go to Icebox
