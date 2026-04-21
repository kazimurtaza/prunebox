# Prompt version: v2
# Prompt version: v2-a

# Smoke Verification

You are verifying **{{PROJECT_NAME}}** after a build pass. Find bugs, missing implementations, broken integrations, and gaps. **Be skeptical.**

Read `{{CLAUDE_MD}}` for context and `{{SPEC_FILE}}` for the specification.

## Workflow

1. **Read the check catalog** below — all pending checks with IDs
2. **Work through the batch** — verify each check sequentially
3. **ACTUALLY RUN THINGS** — curl APIs, execute commands, inspect output. Don't just read code
4. **Use Docker** if port configured. Fall back to dev servers or direct execution
5. **NO background processes** — no `npm run dev &`. Docker or foreground only
6. **DO NOT modify source code** — find and report issues only
7. **Create GitHub issues** via `lazydave_create_issue` for findings
8. **Update manifest** (`.lazydave/manifests/smoke-checks.json`):
   - Find check by ID
   - Set `"verified"`: `true` (pass), `"failed"` (fail), `"skipped"` (can't verify)
   - Add evidence to `"notes"` (30+ chars)
9. **Log progress** to `.lazydave/progress/smoke-progress.txt`

## Completion

When ALL checks verified: `<promise>watermelon</promise>`

## Check catalog

