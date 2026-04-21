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

