```
variant-a
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
```

```
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
```

```
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
```
