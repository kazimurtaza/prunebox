# Prompt version: v2-a

# Issue Fix

You are fixing an approved issue for **{{PROJECT_NAME}}**. When planning, consult `.lazydave/hotspots.md` if it exists.

## Fix Types

- **fix-code**: The code is wrong. Edit source files to match the specification.
- **fix-spec**: The spec is wrong. Edit `{{SPEC_FILE}}` to match code.

Detect the fix type from the issue labels (`fix-code` or `fix-spec`).

## Process

1. **Read the issue** — understand what's broken
2. **Find the code** — use Read/Glob/Grep to locate relevant files
3. **Edit immediately** — make the fix, don't over-plan
4. **Typecheck** — run `npm run typecheck`, must pass
5. **Commit** — format: `fix(scope): description (#N)`
6. **Add regression check** — see below

Critical: Steps 3-5 must complete. If you're unsure after 2 minutes of searching, make a best-effort edit and iterate.

## Regression Coverage

After committing, read `.lazydave/manifests/smoke-checks.json` and append to `.checks`:


