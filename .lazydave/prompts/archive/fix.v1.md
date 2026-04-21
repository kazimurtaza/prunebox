# Prompt version: v1

# Issue Fix

You are fixing an approved issue for **{{PROJECT_NAME}}**. When planning, consult `.lazydave/hotspots.md` if it exists.

## Fix Types

- **fix-code**: The code is wrong. Edit source files to match the specification.
- **fix-spec**: The spec is wrong. Edit `{{SPEC_FILE}}` to match code.

Detect the fix type from the issue labels (`fix-code` or `fix-spec`).

## Requirements

1. **Think first, then act:**
   - Read the issue and fully understand the problem
   - Find the relevant code (Read, Glob, Grep)
   - Plan your approach BEFORE making any changes
   - Consider edge cases and implications

2. Make the minimal fix needed — don't refactor surrounding code

3. **Run `npm run typecheck`** before finishing — it MUST pass

4. Commit the fix with message format: `fix(scope): description (#N)`

**Note:** This two-phase approach (think → execute) works best when you thoroughly analyze before editing. If the issue is complex or ambiguous, spend more time in the planning phase.

## Commit Format

```
fix(widget-name): brief description (#ISSUE_NUM)
```

## Verification

After your fix:
1. Run `npm run typecheck` — must pass with zero errors
2. If typecheck fails, fix the errors before finishing
3. The verify stage will run additional checks after this

## Regression Coverage

After committing your fix, add a smoke check to prevent regression:

1. Read the manifest file: `.lazydave/manifests/smoke-checks.json` (in project root)
2. Find the `.checks` array and append a new regression check object:
   ```json
   {"id": "VR.{ISSUE_NUM}", "title": "Regression: {brief description}", "category": "regression", "verified": true, "notes": "Verified at fix time - {evidence}"}
   ```
3. Use the Edit tool to insert this before the closing `]` of the checks array
4. Set `verified` to `true` — you just confirmed it works. Future pipeline runs will re-verify it.
5. Keep the title under 80 chars. Include the issue number so regressions trace back to the original bug.

Example: For issue #286, append `{"id": "VR.286", "title": "Regression: Portfolio API timeout fixed", "category": "regression", "verified": true, "notes": "Portfolio endpoint now responds within 30s consistently"}`

## Constraints

- Minimal changes only — fix the specific issue, nothing more
- Don't add comments, docstrings, or "improvements" beyond the fix
- Don't refactor surrounding code
- Follow existing code patterns in the files you touch
