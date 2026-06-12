# Intake Prompt

This prompt guides the classification and processing of new product inputs.

## Purpose

When a user runs `mpos ingest "<text>"`, this prompt defines how the system should:
1. Understand what type of information was provided
2. Determine which documents to update
3. Assess risk and conflict potential

## Input Classification Categories

Classify the input into one or more of:

| Category | Trigger keywords / patterns |
|----------|---------------------------|
| `new-product-concept` | build, create, platform, vision, mission |
| `feature-request` | feature, users should be able to, the system should |
| `workflow-update` | workflow, process, flow, step, when a user |
| `business-rule-update` | rule, policy, must, shall, cannot, not allowed |
| `roadmap-change` | roadmap, milestone, release, quarter, timeline |
| `phase-definition` | phase, stage, MVP, discovery, growth, scale |
| `sprint-planning-request` | sprint, iteration, sprint goal |
| `task-generation-request` | task, ticket, story, user story |
| `assumption-update` | assume, assumption, given that |
| `constraint-update` | constraint, limitation, budget, technical limitation |
| `decision-record` | decided, chose, ADR, trade-off, we chose |
| `glossary-update` | definition, glossary, term, what we mean by |
| `persona-update` | persona, user type, target user, customer segment |
| `goal-update` | goal, KPI, metric, OKR, success criteria |
| `correction-refinement` | actually, correction, I meant, clarify |

## Document Mapping

| Category | Primary docs | Secondary docs |
|----------|-------------|----------------|
| new-product-concept | vision.md, prd.md | goals-and-kpis.md |
| feature-request | prd.md | backlog.md |
| workflow-update | workflows.md | prd.md |
| business-rule-update | business-rules.md | constraints.md |
| roadmap-change | roadmap.md | phases.md |
| assumption-update | assumptions.md | — |
| constraint-update | constraints.md | — |
| decision-record | decisions/adr-XXXX.md | — |
| glossary-update | glossary.md | — |
| goal-update | goals-and-kpis.md | — |

All ingests → `docs/changelog.md`

## Risk Assessment Questions

Before applying, check:
1. Does this contradict the Vision (`docs/vision.md`)?
2. Does this violate a Business Rule (`docs/business-rules.md`)?
3. Does this override an existing Decision (`decisions/`)?
4. Is this a destructive change (removal, deprecation, "remove", "delete")?
5. Does this change scope significantly (adding many new features at once)?
