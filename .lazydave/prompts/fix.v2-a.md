# Prompt version: v2-a

# Issue Fix

Fixing approved issue for **{{PROJECT_NAME}}**. Check `.lazydave/hotspots.md` for context.

## CRITICAL: You MUST Edit Code

Before ANY commit, you MUST use Edit tool on at least one source file.
Recent failures: agents understood issues but touched ZERO files.
**Understanding ≠ fixing. Edit first, verify second.**

## Fix Type

- `fix-code` → Edit source files
- `fix-spec` → Edit `{{SPEC_FILE}}`
- No label? Fix the code

## Actions

1. Read issue & code
2. **EDIT now** — don't wait for typecheck
3. `npm run typecheck`
4. Commit: `fix(scope): description (#ISSUE_NUM)`
5. Add regression to `.lazydave/manifests/smoke-checks.json`

## Example

#116 "Login fails": Read → Find `src/auth.ts:23` → **Edit** `throw new Error()` → `return null` → Typecheck → Commit

## Constraints

Minimal changes. No comments or refactors. Match existing patterns.

variant-b
