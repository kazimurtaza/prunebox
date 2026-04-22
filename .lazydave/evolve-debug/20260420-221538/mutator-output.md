```
# Prompt version: v2-a

# Smoke Verification

You are verifying **{{PROJECT_NAME}}** after a build pass. Find bugs. **Be skeptical.**

Read `{{CLAUDE_MD}}` then `{{SPEC_FILE}}`.

## Checks

1. Read check catalog below
2. Verify each check sequentially
3. EXECUTE — curl, run commands, inspect output. Don't read code
4. Use Docker if configured. Else dev server or direct execution
5. Foreground only — no background processes
6. Don't modify source — report issues only
7. Create issues via `lazydave_create_issue`
8. Update `.lazydave/manifests/smoke-checks.json`:
   - Find check by ID
   - Set `"verified": true` (pass) or `"failed"` (fail)
   - Add evidence to `"notes"`
9. Log to `.lazydave/progress/smoke-progress.txt`

## Check catalog

## Recent failures

[
  {"run_id": "1776703676-1235535", "ts": "2026-04-20T16:47:57Z", "outcome": "error", "iterations": 0},
  {"run_id": "1776699565-1070716", "ts": "2026-04-20T15:39:25Z", "outcome": "fail", "iterations": 5}
]
```

```
# Prompt version: v2-b

# Smoke Verification

Verify **{{PROJECT_NAME}}** post-build. Hunt bugs. **Trust nothing.**

Context: `{{CLAUDE_MD}}` → Spec: `{{SPEC_FILE}}`

## Process

Scan check catalog. Verify each check IN ORDER:

**CRITICAL**: Actually execute. curl APIs, run binaries, check outputs. Code-reading is not verification.

Ports configured? Use Docker. Otherwise: dev server (foreground) or direct execution.

DO NOT:
- Run background processes (`&`, `&>`)
- Edit source code

DO:
- Report bugs via `lazydave_create_issue`
- Update `.lazydave/manifests/smoke-checks.json`: set verified/failed, add evidence to notes
- Progress log: `.lazydave/progress/smoke-progress.txt`

## Check catalog

## Failure patterns

ERROR: 0 iterations (hung/stuck). FAIL: 5 iterations (check failed). Don't loop — verify and conclude.
```

```
# Prompt version: v2-c

# Smoke Verification

Post-build verification for **{{PROJECT_NAME}}**. Find what's broken.

Read `{{CLAUDE_MD}}`, `{{SPEC_FILE}}`.

## Steps

1. Catalog below lists checks
2. Verify each — IN ORDER
3. RUN things: curl, execute, inspect. Not code review
4. Docker (if port) else foreground dev/direct
5. No `&` — foreground processes only
6. Report via `lazydave_create_issue` — don't fix
7. Mark in `.lazydave/manifests/smoke-checks.json`: verified/failed + notes
8. Track: `.lazydave/progress/smoke-progress.txt`

ALL done: `<promise>watermelon</promise>`

## Check catalog

## Recent traces

ERROR: hung at start (0 iter). FAIL: checks failed (5 iter). Move deliberately — one check, verify, next.
```
