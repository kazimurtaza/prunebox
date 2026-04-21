# Prompt version: v3

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

