# Prompt version: v1

# Manifest Coverage Sync

You are analyzing **{{PROJECT_NAME}}** for manifest coverage gaps. Your job is to find features, components, routes, and behaviors that exist in the codebase or spec but have no corresponding QA check in the manifests.

## Input Sources

Read these in order:

1. **Existing manifests** — read these first to understand what's already covered:
   - `.lazydave/manifests/smoke-checks.json` — note the `.checks` array, ID scheme (V prefix), categories
   - `.lazydave/manifests/visual-areas.json` — note the `.areas` array, ID scheme (T prefix), categories
   - `.lazydave/manifests/audit-areas.json` — note the `.areas` array, ID scheme (A prefix), categories
2. **Specification** at `{{SPEC_FILE}}` — read for feature requirements, section structure, specified behaviors
3. **Codebase** — use Glob to discover the project structure, then Read to understand what exists:
   - Find widget/component directories (e.g., `src/widgets/`, `src/components/`, `app/views/`)
   - Find API route/endpoint files (e.g., `server/routes/`, `app/api/`, `src/handlers/`)
   - Find hooks, utilities, and shared modules

## Gap Detection Criteria

A gap exists when:
- A widget/component file exists in source but has no smoke check verifying its core functionality
- An API route is registered in the server but has no smoke check testing its response shape
- A spec section describes a feature but has no audit area tracking it
- A component has visual states (hover, loading, error, empty, responsive) described in spec but no visual area covering them
- A spec section references behavior (keyboard shortcuts, animations, transitions) that has no interaction check

## What NOT to Add

- Entries that duplicate existing checks — check by name/title and intent, not just ID
- Checks for test files, config files, build scripts, or tooling
- Overly granular checks (one per CSS property, one per prop on a component)
- Generic stubs — "Clock Widget" is useless when "V3.1: Clock Widget" already exists
- Checks you can't describe a concrete verification step for

## Critical: Preserve Manifest File Structure

The manifest files have a specific wrapper structure — **never rewrite the entire file**:
- `smoke-checks.json`: `{"version":"1.0","project":"...","checks":[...]}`
- `visual-areas.json`: `{"version":"1.0","project":"...","areas":[...]}`
- `audit-areas.json`: `{"version":"1.0","project":"...","areas":[...]}`

**Always use the Edit tool** to insert new entries into the existing `.checks` or `.areas` array. Do NOT use Write to replace the file. If a manifest appears empty or unreadable, run `jq . <filename>` first to inspect it.

## Output Format

For each gap found, **edit the manifest JSON directly** using the Edit tool.

### Smoke checks — append to `.checks` array in `.lazydave/manifests/smoke-checks.json`:
```json
{
  "id": "V{next_number}",
  "title": "{specific testable claim}",
  "category": "{existing_category}",
  "verified": false,
  "notes": "",
  "steps": "{concrete verification action}"
}
```

### Visual areas — append to `.areas` array in `.lazydave/manifests/visual-areas.json`:
```json
{
  "id": "T{next_number}",
  "name": "{specific visual aspect to check}",
  "category": "{existing_category}",
  "skill": null,
  "agent": null,
  "status": "pending",
  "notes": ""
}
```

### Audit areas — append to `.areas` array in `.lazydave/manifests/audit-areas.json`:
```json
{
  "id": "A{next_number}",
  "name": "Section {N}: {section title}",
  "category": "spec",
  "spec_sections": ["{N}"],
  "status": "pending",
  "notes": "",
  "improvements": [],
  "regressions": [],
  "issues_found": []
}
```

## Rules

- **ID numbering**: read the existing manifest to find the highest ID number in each prefix (V, T, A), then increment from there. Do not reuse or collide with existing IDs.
- **Category conventions**: use categories that already exist in the manifest. Don't invent new categories unless nothing existing fits.
- **Name quality**: names must be specific testable claims. Not "Weather Widget" but "Weather Lucide Icons Replace Emoji in Forecast Display." Not "API Route" but "XKCD API Endpoint Returns Comic JSON with title, img, num Fields."
- **Steps quality** (smoke only): describe a concrete verification action. "Run `curl localhost:8080/api/xkcd` and verify response contains `title`, `img`, `num` fields" not "Check that the XKCD endpoint works."

## Summary

After making all edits, output a summary:

```
## Sync Summary

### smoke-checks.json (+N entries)
- V10.1: [title]

### visual-areas.json (+N entries)
- T15: [name]

### audit-areas.json (+0 entries)
No gaps found.
```

If no gaps found in any manifest, say so clearly.
