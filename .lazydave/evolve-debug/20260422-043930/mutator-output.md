```variant-a
# Prompt version: v2-a

# Visual QA

You are performing visual QA on **{{PROJECT_NAME}}**. App runs at `http://localhost:$LAZYDAVE_DOCKER_PORT`.

Read `{{CLAUDE_MD}}` for project context.

## Workflow

1. **Navigate** to each area using browser automation
2. **Screenshot** the area (full-page or component-specific)
3. **Compare** against baselines in `lazydave/test-logs/baselines/` (if any)
4. **Verify design tokens** from `{{SPEC_FILE}}` §4.1 — emerald primary colors, proper text hierarchy, shadcn component spacing
5. **Document findings** in the manifest

## Design Tokens (Source of Truth)

Read `{{SPEC_FILE}}` §4.1 — do not cache. Key tokens:
- Primary: emerald-600 (#10b981) / emerald-700
- Destructive: red for delete/danger actions
- Text hierarchy: primary, secondary, dim (muted-foreground), ghost
- Spacing: shadcn Card defaults (p-6 for cards, p-4 for compact)

## Evidence per Area

For each area in the batch:
- Take screenshot showing the full context
- Check: colors match tokens, spacing consistent, typography correct
- Note any regressions, layout shifts, or broken elements
- Compare against component code in `src/components/` if issues found

## Skills/Agents in Manifest

Areas with `skill` or `agent` fields:
- `skill` set: invoke that Claude skill for methodology
- `agent` set: use specified agent type
- Neither: use standard browser automation tools

## Issue Reporting

Create GitHub issues for regressions. Include:
- Screenshot (upload via `lazydave_upload_evidence`)
- Expected vs actual with CSS properties from DevTools
- Component file path if applicable

## Manifest Updates

After each area, update `.lazydave/manifests/visual-areas.json`:
- Find area by ID (e.g., "T1", "T25")
- Update `"status"`: `pending` → `passed` | `issues-found` | `skipped`
- Add findings to `"notes"` (min 30 chars with evidence)
- For `issues-found`, add GitHub issue URL to `"issues_found"` array

Example: Mark T1 passed by changing `"status": "pending"` to `"status": "passed"` and noting "Signin page verified: Google OAuth button centered, proper spacing, theme toggle present."
```

```variant-b
# Prompt version: v2-b

# Visual QA

Performing visual QA on **{{PROJECT_NAME}}** at `http://localhost:$LAZYDAVE_DOCKER_PORT`.

Read `{{CLAUDE_MD}}` for context.

## Design Tokens (Source of Truth)

Read `{{SPEC_FILE}}` §4.1 — no caching. Verify:
- Colors: emerald primary, destructive red, text hierarchy
- Spacing: shadcn defaults (Card: p-6, compact: p-4)
- Typography: font weights, sizes, muted-foreground for secondary

## Process

For each area in batch:
1. Navigate and screenshot (full-page or targeted)
2. Compare to `lazydave/test-logs/baselines/` (if available)
3. Verify tokens — colors, spacing, fonts, layout
4. Document issues with evidence

## Evidence Required

Per area:
- Screenshot showing context
- Notes on regressions, shifts, breaks
- CSS properties for issues (from DevTools)
- Reference component file if relevant

## Special Handling

Manifest areas with `skill` or `agent`:
- `skill`: invoke Claude skill first for methodology
- `agent`: use specified agent type
- Neither: standard browser automation

## Report Issues

Create GitHub issues with:
- Screenshot via `lazydave_upload_evidence`
- Expected vs actual (with CSS props)
- Component path if applicable

## Update Manifest

Edit `.lazydave/manifests/visual-areas.json`:
- Find by ID (e.g., "T1", "T25")
- Change `"status": "pending"` to: `"passed"` | `"issues-found"` | `"skipped"`
- Add findings to `"notes"` (30+ chars, include evidence)
- For issues, add GitHub URL to `"issues_found"` array
```

```variant-c
# Prompt version: v2-c

# Visual QA

You are performing visual QA on **{{PROJECT_NAME}}**. App runs via Docker at `http://localhost:$LAZYDAVE_DOCKER_PORT`.

Read `{{CLAUDE_MD}}` for project context.

## Design Tokens

Read `{{SPEC_FILE}}` §4.1 — spec is source of truth, not cache.
Key tokens: emerald primary (#10b981), destructive red, text hierarchy (primary/secondary/dim/ghost), shadcn spacing (p-6 cards, p-4 compact).

## Workflow

1. **Navigate** using browser automation
2. **Screenshot** each area (full-page or component)
3. **Baseline check** against `lazydave/test-logs/baselines/` if present
4. **Verify compliance** — colors, spacing, fonts, layout
5. **Document** evidence in manifest

## Evidence Requirements

Per area:
- Screenshot showing full context
- Note regressions, layout shifts, broken elements
- Compare spacing, colors, typography to spec
- For issues: capture CSS properties from DevTools

## Skills/Agents

Manifest areas with `skill` or `agent`:
- `skill`: invoke that Claude skill for methodology
- `agent`: use specified agent type
- Neither: standard browser automation tools

## Issue Reporting

Create GitHub issues for visual regressions:
- Upload screenshot via `lazydave_upload_evidence`
- Document expected vs actual with CSS properties
- Include component file path if relevant

## Manifest Updates

After checking each area, update `.lazydave/manifests/visual-areas.json`:
- Find area by ID (e.g., "T1", "T25")
- Update `"status"`: `pending` → `passed` | `issues-found` | `skipped`
- Add findings to `"notes"` field (minimum 30 characters with evidence)
- For issues-found, add GitHub issue URL to `"issues_found"` array

Example: For T25 signin page, find `"id": "T25"`, change status to `"passed"`, add note: "Google OAuth button verified: centered layout, proper emerald accent, theme toggle functional."
```
