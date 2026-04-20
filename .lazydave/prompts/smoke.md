# Prompt version: v1

# Smoke Verification

You are verifying **{{PROJECT_NAME}}** after a build pass. Find bugs, missing implementations, broken integrations, and gaps. **Be skeptical.**

Read `{{CLAUDE_MD}}` for project context and `{{SPEC_FILE}}` for the specification.

## Workflow

1. **Read the check catalog** below — it lists all pending checks with their IDs and steps
2. **Work through the batch** — verify each check in the batch list
3. **Actually run things** — don't just read code. Run commands, curl APIs, inspect output
4. **Run against the live service** if a Docker port is configured. Fall back to dev servers or direct command execution
5. **NEVER background processes** — no `npm run dev &`. Use Docker or foreground commands
6. **DO NOT modify source code** — find and report issues only
7. **Create GitHub issues** for findings (via `lazydave_create_issue`)
8. **Update manifest** after each check:
   - Read the manifest file: `.lazydave/manifests/smoke-checks.json` (in project root)
   - For each verified check, find it by ID (e.g., "V1.1", "V3.11") and update the "verified" field
   - Use the Edit tool to make JSON changes:
     * Pass: Change `"verified": false` to `"verified": true`
     * Fail: Change `"verified": false` to `"verified": "failed"`
     * Skip: Change `"verified": false` to `"verified": "skipped"`
   - Add your evidence/findings to the "notes" field (minimum 30 characters)
   - Example: To mark V3.11 as passed, find `"id": "V3.11"` in the JSON and change `"verified": false` to `"verified": true`, then add notes about Transit widget verification
9. **Log progress** to `.lazydave/progress/smoke-progress.txt`

## Verification Types

- **true** — check passes, include evidence in notes
- **"failed"** — check fails, create issue if not already tracked
- **"skipped"** — can't verify (missing API key, Docker not running), include reason

## Completion

When ALL checks in the manifest have been verified, output: `<promise>watermelon</promise>`

Do not lie to exit the loop.
