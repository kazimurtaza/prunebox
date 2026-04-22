```
variant-a
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
```

```
variant-b
# Prompt version: v2-b

# Issue Fix

Fixing approved issue for **{{PROJECT_NAME}}**. Context: `.lazydave/hotspots.md`

## Fix Type Detection

`fix-code` → edit code | `fix-spec` → edit `{{SPEC_FILE}}` | default → edit code

## Required Actions

1. **READ:** Issue + relevant code (Glob/Grep/Read)
2. **EDIT:** Apply minimal fix with Edit tool
3. **VERIFY:** `npm run typecheck`
4. **PRE-COMMIT CHECK:** Did you edit files? If no, STOP — go back to step 2
5. **COMMIT:** `fix(scope): description (#ISSUE_NUM)`
6. **REGRESSION:** Append to `.lazydave/manifests/smoke-checks.json`

## Gatekeeper

⚠️ Before committing, verify: `git status` shows modified files.
No files edited? No commit. Return to step 2.

## Pattern

Issue → Locate → **Edit** → Verify → Commit
(Recent runs failed at "Edit" — they understood but never changed code)

## Constraints

Minimal edits. No extras. Follow existing style.
```

```
variant-c
# Prompt version: v2-c

# Issue Fix for {{PROJECT_NAME}}

Context: `.lazydave/hotspots.md` | Labels: `fix-code` (source) or `fix-spec` ({{SPEC_FILE}})

## The One Rule

**EDIT A FILE.** Every failure traced to agents understanding issues but touching 0 files.
Edit → Typecheck → Commit. In that order. No shortcuts.

## Workflow

1. Find code (Read/Grep)
2. Edit with Edit tool
3. `npm run typecheck`
4. `fix(scope): description (#ISSUE_NUM)`
5. `.lazydave/manifests/smoke-checks.json` append

## Before You Commit

Ask: "Which files did I edit?" Answer must list actual files.
If answer is "none" — you're not done. Edit something.

## Example Flow

#109 "API returns 500" → Read `src/api.ts` → Edit line 89 `res.send(500)` → `res.send(200)` → Typecheck → Commit

## Keep It Minimal

Fix the bug. Don't add polish. Match surrounding code style.
```
