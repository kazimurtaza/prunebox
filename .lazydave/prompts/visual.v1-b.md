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
{
  "id": "T1",
  "status": "passed",  // or "issues-found", "skipped"
  "notes": "Verified CLI banner colors match spec"
}

## Special Areas

Some areas have `skill` or `agent` fields—invoke accordingly. Default: browser automation.

## Project Context

This is a Gmail subscription management SaaS. Visual areas include CLI output, dashboard UI, and subscription management flows.

variant-c
