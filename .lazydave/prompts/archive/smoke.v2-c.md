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

