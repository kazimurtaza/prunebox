```
variant-a
# Prompt version: v2-a

# Visual QA

You are performing visual QA on **{{PROJECT_NAME}}**. The app runs at `http://localhost:$LAZYDAVE_DOCKER_PORT` (default: 8080).

Read `{{CLAUDE_MD}}` and `docs/lazydave-spec-v3.md` for context.

## Workflow

1. **Navigate** using `browser_navigate` to localhost port
2. **Screenshot** each area from the batch (use `browser_take_screenshot`)
3. **Compare** against baselines in `lazydave/test-logs/baselines/` if they exist
4. **Verify** design tokens: spacing, colors, fonts, layout
5. **Report** findings via manifest update

## Evidence

For each area, capture:
- Full-page or component screenshot
- Visual regressions: layout shifts, broken elements, wrong colors
- Design token violations (check `docs/ui-ux/` for tokens)

Example areas from manifest:
- T1: CLI banner colors (CYAN borders, BLUE title)
- T25: Dashboard widget card styling
- Web areas: navigation, auth forms, subscription lists

## Design Tokens

Reference `docs/ui-ux/design-tokens.md` §4.1 for current values:
- Surfaces: background, card, modal
- Text hierarchy: primary, secondary, dim, ghost
- Accent color consistency

Do not rely on memory—spec is source of truth.

## Skills/Agents

Areas may have `skill` or `agent` fields:
- `skill`: Invoke via Skill tool for methodology
- `agent`: Use specified agent type
- Neither: Use browser automation directly

## Issue Reporting

Create GitHub issues for regressions:
- Upload screenshot via `lazydave_upload_evidence` (from `lazydave/lib/github.sh`)
- State expected vs actual
- Note wrong CSS properties from DevTools

## Manifest Updates

After each area, update `lazydave/.lazydave/manifests/visual-areas.json`:
- Find area by ID (e.g., "T1", "T25")
- Change `"status": "pending"` to `"passed"`, `"issues-found"`, or `"skipped"`
- Add findings to `"notes"` (min 30 chars)
- For issues: add GitHub URL to `"existing_issues_referenced"`

Example edit: Find `"id": "T25"` → change status → add notes about widget card verification.

```

```
variant-b
# Prompt version: v2-b

# Visual QA for {{PROJECT_NAME}}

App runs at `http://localhost:$LAZYDAVE_DOCKER_PORT`. Read `{{CLAUDE_MD}}` and `docs/lazydave-spec-v3.md` first.

## Step 1: Navigation

Use browser automation to navigate to the app. Default port is 8080 (from `lazydave/lib/config.sh:309`).

## Step 2: Screenshots

For each area in your batch:
- Use `browser_take_screenshot` with descriptive filename
- Capture full page or specific component as needed
- Save to temp dir for evidence upload

## Step 3: Comparison

Check against baselines in `lazydave/test-logs/baselines/` (if available).
Look for:
- Layout shifts or broken elements
- Color/spacing/typography regressions
- Missing or malformed components

## Step 4: Design Compliance

Verify tokens from `docs/ui-ux/design-tokens.md`:
- Backgrounds, cards, borders
- Text hierarchy (primary, secondary, dim, ghost)
- Accent color usage

## Step 5: Report Results

**Pass**: Update manifest status to `"passed"` with verification notes.

**Issues found**:
1. Create GitHub issue with screenshot
2. Upload via `lazydave_upload_evidence` function
3. Update manifest to `"issues-found"` with issue URL
4. Document expected vs actual in issue

## Manifest Format

Edit `lazydave/.lazydave/manifests/visual-areas.json`:
```json
{
  "id": "T1",
  "status": "passed",  // or "issues-found", "skipped"
  "notes": "Verified CLI banner colors match spec"
}
```

## Special Areas

Some areas have `skill` or `agent` fields—invoke accordingly. Default: browser automation.

## Project Context

This is a Gmail subscription management SaaS. Visual areas include CLI output, dashboard UI, and subscription management flows.
```

```
variant-c
# Prompt version: v2-c

# Visual QA

Performing visual QA on **{{PROJECT_NAME}}** at `http://localhost:$LAZYDAVE_DOCKER_PORT`.

Read `{{CLAUDE_MD}}` for project structure, `docs/lazydave-spec-v3.md` for requirements.

## Workflow

1. **Navigate** to the running Docker container
2. **Screenshot** each area from your assigned batch
3. **Compare** visual state against baselines (if they exist in `lazydave/test-logs/baselines/`)
4. **Validate** design tokens (spacing, colors, typography, layout)
5. **Document** findings in manifest

## Design Tokens

Check `docs/ui-ux/design-tokens.md` §4.1. Verify:
- Surface colors: background, cards, modals
- Text hierarchy: primary, secondary, dim, ghost
- Accent color consistency across components

Spec is source of truth—don't rely on cached values.

## Evidence Collection

For each area:
- Take targeted screenshot via `browser_take_screenshot`
- Note regressions: broken layouts, wrong colors, misaligned elements
- Check responsive behavior if applicable
- Compare against prior baselines

## Issue Reporting

Visual regressions become GitHub issues:
- Upload screenshot via `lazydave_upload_evidence` (defined in `lazydave/lib/github.sh:175`)
- Describe expected vs actual state
- Include incorrect CSS properties from DevTools inspection

## Manifest Updates

Edit `lazydave/.lazydave/manifests/visual-areas.json` after each area:

**Status values**: `"passed"`, `"issues-found"`, `"skipped"`

**Fields to update**:
- `status`: Change from `"pending"`
- `notes`: Add your findings (minimum 30 characters)
- `existing_issues_referenced`: Add GitHub issue URLs for failures

**Example**: To mark T1 passed, find `"id": "T1"`, set `"status": "passed"`, add `"notes": "CLI banner displays with correct CYAN border and BLUE title"`.

## Skills & Agents

Areas with `skill` field: invoke that skill for methodology
Areas with `agent` field: use specified agent type
Otherwise: standard browser automation

## Context

Prunebox is Gmail subscription management. Visual areas span CLI output (T1-T5), dashboard UI, subscription lists, and auth flows.
```
