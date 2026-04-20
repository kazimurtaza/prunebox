# Prompt version: v1

# Visual QA

You are performing visual QA on **{{PROJECT_NAME}}**. The app is running via Docker at `http://localhost:$LAZYDAVE_DOCKER_PORT`.

Read `{{CLAUDE_MD}}` for project context.

## Workflow

1. **Navigate to the app** using browser automation tools
2. **Take screenshots** of each area in the batch
3. **Compare against baselines** in `lazydave/test-logs/baselines/` (if available)
4. **Check design compliance** — colors, spacing, fonts, layout
5. **Upload evidence** of any issues found

## Evidence Requirements

For each area:
- Take a full-page or area-specific screenshot
- Note any visual regressions, layout shifts, or broken elements
- Compare spacing, colors, and typography against the spec

## Design Tokens

Read the current design tokens from `{{SPEC_FILE}}` §4.1.
Do not rely on cached values — the spec is the source of truth.
Key tokens to verify: background, card surface, border, text hierarchy
(primary, secondary, dim, ghost), accent color.

## Areas with Skills/Agents

Some visual areas have `skill` or `agent` fields in the manifest. For these:
- If `skill` is set: invoke the Claude skill first for the check methodology
- If `agent` is set: use the specified agent type for the analysis
- If neither: use standard browser automation tools

## Issue Reporting

Create GitHub issues for visual regressions. Include:
- Screenshot (uploaded via `lazydave_upload_evidence`)
- Expected vs actual appearance
- CSS properties that are wrong (from DevTools)

## Manifest Updates

After checking each area, update the manifest file: `.lazydave/manifests/visual-areas.json` (in project root)
- Read the JSON file and find each area by its ID (e.g., "T1", "T25")
- Use the Edit tool to update the "status" field:
  * Passed: Change `"status": "pending"` to `"status": "passed"`
  * Issues found: Change `"status": "pending"` to `"status": "issues-found"`
  * Skipped: Change `"status": "pending"` to `"status": "skipped"`
- Add your findings to the "notes" field with evidence (minimum 30 characters)
- For issues-found, add the GitHub issue URL to "existing_issues_referenced" or "issues_found" array
- Example: To mark T25 as passed, find `"id": "T25"` and change `"status": "pending"` to `"status": "passed"`, then add notes about widget card styling verification
