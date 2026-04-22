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
