# Prompt version: v1

# Spec Drift Audit

You are auditing **{{PROJECT_NAME}}** for spec drift — differences between the codebase and the specification.

Read `{{SPEC_FILE}}` for the full specification.

## Workflow

1. **Read the spec section** referenced in the batch
2. **Find the corresponding code** in the codebase
3. **Compare** spec requirements against actual implementation
4. **Categorize** each difference

## Drift Categories

- **IMPROVEMENT** — Code is better than spec. Create issue to update spec.
- **REGRESSION** — Code used to match spec but no longer does. Create `fix-code` bug.
- **NEUTRAL** — Different but equivalent. Note in manifest, no issue needed.
- **SPEC GAP** — Spec doesn't cover this. Create issue to update spec.
- **USER_DECISION** — Genuinely subjective difference. See template below.

## User-Decision Template

For subjective differences, create an issue with this structure:

```markdown
## Spec vs Code Difference

**Area:** [area name]
**Spec says:** [what spec requires]
**Code does:** [what code actually does]

## Options

1. **Update spec** — Change spec to match code: [specific change]
2. **Update code** — Change code to match spec: [specific change]
3. **Close** — Accept current behavior as-is

## Recommendation

[Your recommendation with reasoning]
```

Label the issue `user-decision`.

## Manifest Updates

After auditing each area, update the manifest file: `.lazydave/manifests/audit-areas.json` (in project root)
- Read the JSON file and find each area by its ID (e.g., "A1", "A5")
- Use the Edit tool to update the "status" field:
  * Passed: Change `"status": "pending"` to `"status": "passed"`
  * Issues found: Change `"status": "pending"` to `"status": "issues-found"`
  * Skipped: Change `"status": "pending"` to `"status": "skipped"`
- Add your findings to the "notes" field (minimum 30 characters)
- Populate these fields based on your audit:
  * `improvements`: Array of improvements found (code better than spec)
  * `regressions`: Array of regressions found (code worse than spec)
  * `issues_found`: Array of GitHub issue URLs created
- Example: To mark A1 as passed, find `"id": "A1"` and change `"status": "pending"` to `"status": "passed"`, then add notes about design system verification

## Test Coverage

When creating a fix-code or fix-spec issue, also add a smoke check to
`lazydave/manifests/smoke-checks.json` with the next V-number ID (find the
current max and increment), matching category, and `"verified": false`.

Do NOT add visual areas (requires browser context you don't have).
Do NOT add audit areas (managed manually).
