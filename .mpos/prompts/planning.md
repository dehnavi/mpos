# Planning Prompt

When generating phases, sprints, or tasks, follow these guidelines.

## Phase Generation

1. Read `docs/vision.md` and `docs/prd.md` for scope context
2. Read `planning/phases.md` to avoid duplicating phases
3. Standard phase sequence: Discovery → MVP → Growth → Scale
4. Each phase must have: objective, scope, deliverables, exit criteria, risks
5. Exit criteria must be **measurable** (no "complete enough" or "good")

## Sprint Generation

1. Read the parent phase to understand scope and deliverables
2. Each sprint = 2 weeks (adjustable)
3. Sprint goal must be a single sentence focused on user/business value
4. List 5-15 tasks per sprint (realistic capacity)
5. Name dependencies explicitly (sprint-XXX, task-XXX, or external names)
6. Include Definition of Done checklist

## Task Generation

1. Each task must be completable within one sprint
2. Title: verb + noun ("Implement user registration")
3. Acceptance criteria: testable, binary (done or not)
4. Priority mapping:
   - critical = must ship this sprint or sprint fails
   - high = important, but sprint can ship without it
   - medium = nice to have this sprint
   - low = can move to next sprint

## Sprint Naming

Format: `sprint-NNN — phase-NN`
Example: `sprint-001 — phase-01`

## Task Naming

Format: `task-NNN.md` (sequential)
Stored in: `tasks/{sprint-id}/task-NNN.md`

## Capacity Guidelines

- 2-week sprint, team of 3: ~30 story points / 15 tasks
- 2-week sprint, solo: ~10 story points / 5 tasks
- Don't over-commit: leave 20% buffer for unplanned work
