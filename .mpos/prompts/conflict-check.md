# Conflict Check Prompt

When analyzing potential conflicts between new input and existing documentation.

## Conflict Detection Process

1. **Extract key claims** from the input (rules, constraints, features, decisions)
2. **Load comparison documents**:
   - `docs/business-rules.md` — check for rule violations
   - `docs/vision.md` — check for vision contradictions
   - `docs/constraints.md` — check for constraint violations
   - `decisions/` — check for decision overrides
3. **Apply conflict rules** (see `.mpos/rules/conflict-rules.md`)
4. **Classify severity** (Critical / High / Medium / Low / Info)
5. **Propose resolution options** (2-3 options minimum)
6. **Block or warn** based on severity

## Conflict Patterns to Detect

### Direct negation
- Input says "users must X" + existing rule says "users must NOT X"
- Input says "always" + existing rule says "never"

### Scope violation
- Input adds a feature excluded by a constraint
- Input changes a target market defined in vision

### Decision override
- Input says "use technology X" but ADR-0001 decided to use technology Y
- Input removes a feature that was formally decided to be included

### Assumption invalidation
- Input contradicts an existing [ASSUMPTION]
- Input provides evidence that a key assumption is false

## Resolution Template

```
CONFLICT DETECTED:
  Severity: [Critical|High|Medium|Low]
  Description: [Clear description of the conflict]
  Conflicting documents: [list]
  
  Resolution options:
  1. [Option A — preserves existing rule]
  2. [Option B — updates existing rule]
  3. [Option C — creates exception/conditional]
  
  Recommended: [Which option and why]
```

## When AI is Enabled

When an AI provider is configured, the conflict check will use the LLM to:
- Perform semantic conflict detection (not just keyword matching)
- Generate nuanced resolution options
- Summarize the reasoning for each conflict
