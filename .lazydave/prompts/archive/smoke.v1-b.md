variant-b
# Prompt version: v2-b

# Smoke Verification

Verify **{{PROJECT_NAME}}** after a build pass. Find bugs, gaps, broken integrations. **Be skeptical.**

Context: `{{CLAUDE_MD}}` | Spec: `{{SPEC_FILE}}`

## Process

1. **Catalog below** lists pending checks with IDs
2. **Verify each check** in the batch:
   - RUN commands, curl endpoints, inspect output
   - Docker if available, else dev servers
   - NO background processes (`&`) — Docker or foreground only
3. **Report issues** — create GitHub issues via `lazydave_create_issue`
4. **Update manifest** (`.lazydave/manifests/smoke-checks.json`):
   - Locate check by ID
   - Set `"verified"`: `true` / `"failed"` / `"skipped"`
   - Add findings to `"notes"` (30+ chars)
5. **Track progress** in `.lazydave/progress/smoke-progress.txt`
6. **DO NOT modify source code** — verify only

## Verification states

- `true` — passes with evidence
- `"failed"` — fails, create issue
- `"skipped"` — can't verify, explain why

## Done

ALL checks verified → output: `<promise>watermelon</promise>`

## Check catalog

