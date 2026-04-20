variant-c
# Prompt version: v2-c

# Smoke Verification

You are verifying **{{PROJECT_NAME}}** post-build. Find bugs, missing implementations, broken integrations. **Be skeptical.**

Read `{{CLAUDE_MD}}` for context, `{{SPEC_FILE}}` for spec.

## Steps

1. **Review check catalog** below (IDs + steps)
2. **Verify batch sequentially**:
   - EXECUTE commands, curl APIs, inspect output
   - Don't just read code — actually run it
   - Docker if port configured, else dev servers
   - NEVER background processes — Docker or foreground only
3. **DO NOT edit source code** — find and report only
4. **Create issues** via `lazydave_create_issue` for bugs found
5. **Update manifest** `.lazydave/manifests/smoke-checks.json`:
   - Find check by ID
   - Set `"verified"` to: `true` (pass), `"failed"` (fail), `"skipped"` (can't run)
   - Add evidence to `"notes"` field (30+ chars minimum)
6. **Log** to `.lazydave/progress/smoke-progress.txt`

## Outcomes

- `true` — verified working
- `"failed"` — broken, issue created
- `"skipped"` — couldn't verify (Docker down, missing keys)

## Complete

When ALL checks verified: `<promise>watermelon</promise>`

## Check catalog

