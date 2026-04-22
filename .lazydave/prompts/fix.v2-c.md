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
