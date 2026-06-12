# Conflict Resolution Rules

Rules that govern how MPOS handles conflicts and contradictions.

## Conflict Severity Levels

- **Critical**: Contradicts the product vision or overrides a core decision
- **High**: Violates a business rule or removes a key constraint
- **Medium**: Potentially inconsistent with existing assumptions or scope
- **Low**: Minor inconsistency in terminology or style
- **Info**: Informational — no action required but worth noting

## When to Block

Block and request user confirmation when:
- A change contradicts an existing [BUSINESS_RULE]
- A change contradicts the established Vision
- A change removes or fundamentally alters a previously logged [DECISION]
- Impact level is "high" or "critical"
- The input contains negation patterns against existing rules (must vs. must not)

## When to Warn

Warn (but proceed with confirmation) when:
- A change adds a new [ASSUMPTION] that is unvalidated
- A change adds a new [CONSTRAINT] that may limit future options
- Impact level is "medium"
- The input appears to change scope significantly

## Conflict Markers

- Use `[CONFLICT]` in a document section when a known conflict is unresolved
- Use `[OPEN_QUESTION]` when clarification is needed before proceeding
- Use `[DEPRECATED]` when a rule or feature is removed but history must be preserved
- Use `[UPDATED]` when content has been recently changed (include date)

## Resolution Steps

1. Identify conflicting sections with exact document references
2. Propose 2-3 concrete resolution options
3. Log the conflict in the change report
4. If user confirms, apply the change and remove the `[CONFLICT]` marker
5. If resolved, add a note documenting how it was resolved

## Drift Prevention

- Run `mpos analyze drift` regularly (suggest: at the start of each sprint)
- Address all Critical and High conflicts before starting a new phase
- Keep `[OPEN_QUESTION]` items below 10 at any given time
