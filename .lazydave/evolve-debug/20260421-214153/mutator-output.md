```markdown
# Prompt version: v2-a

# Issue Fix

Fixing an approved issue for **{{PROJECT_NAME}}**. Check `.lazydave/hotspots.md` first.

## Fix Type (Detect FIRST)

Check issue labels:
- `fix-code` → Edit source files to match spec
- `fix-spec` → Edit `{{SPEC_FILE}}` to match code

This determines WHAT you edit. Know it before proceeding.

## Fix Flow

1. **Understand** (read issue, find code via Glob/Grep)
2. **Plan** (minimal fix — no refactoring)
3. **Edit** (use Edit tool on specific files)
4. **Typecheck** (`npm run typecheck` must pass)
5. **Commit** (`fix(scope): description (#N)`)
6. **Regress** (add check to manifest)

Stop planning after step 2. Execute.

## Regression Check

After committing:
1. Read `.lazydave/manifests/smoke-checks.json`
2. Append to `.checks` array:
```json
{"id": "VR.{ISSUE_NUM}", "title": "Regression: {desc}", "category": "regression", "verified": true, "notes": "Verified - {evidence}"}
```
Keep title under 80 chars. Example: `{"id": "VR.286", "title": "Regression: Portfolio API timeout", "category": "regression", "verified": true, "notes": "Responds within 30s"}`

## Constraints

- Minimal changes only
- No comments, docstrings, or improvements beyond the fix
- No refactoring surrounding code
- Match existing code patterns
```

```markdown
# Prompt version: v2-b

# Issue Fix

Fix issue for **{{PROJECT_NAME}}**. Consult `.lazydave/hotspots.md` if present.

## Fix Types

From issue labels:
- `fix-code`: Code is wrong → Edit source files
- `fix-spec`: Spec is wrong → Edit `{{SPEC_FILE}}`

## Steps

1. **Read issue** — Understand the problem fully
2. **Find code** — Use Read, Glob, Grep to locate relevant files
3. **Make fix** — Use Edit tool. Minimal change only.
4. **Typecheck** — Run `npm run typecheck`. Must pass.
5. **Commit** — Format: `fix(scope): description (#N)`
6. **Add regression** — Edit `.lazydave/manifests/smoke-checks.json`

## Regression Entry

Append to `.checks`:
```json
{"id": "VR.{ISSUE_NUM}", "title": "Regression: {brief}", "category": "regression", "verified": true, "notes": "{what you confirmed}"}
```

Example: `{"id": "VR.286", "title": "Regression: Portfolio timeout", "category": "regression", "verified": true, "notes": "Endpoint responds under 30s"}`

## Critical Rules

- Fix ONE thing — the issue, nothing more
- No refactoring, no improvements, no comments
- Typecheck MUST pass before finishing
- Commit before adding regression check
```

```markdown
# Prompt version: v2-c

# Issue Fix

Fix approved issue for **{{PROJECT_NAME}}**. Check `.lazydave/hotspots.md` first.

## Determine Fix Type

Issue labels tell you what to edit:
- `fix-code` → Source files (match spec)
- `fix-spec` → `{{SPEC_FILE}}` (match code)

## Process

1. **Analyze** — Read issue, understand bug
2. **Locate** — Find relevant code (Glob/Grep/Read)
3. **Edit** — Make minimal fix using Edit tool
4. **Verify** — `npm run typecheck` (zero errors)
5. **Commit** — `fix(scope): description (#N)`
6. **Document** — Add regression check to manifest

## Regression Check

Read `.lazydave/manifests/smoke-checks.json`, append to `.checks`:
```json
{"id": "VR.{N}", "title": "Regression: {desc}", "category": "regression", "verified": true, "notes": "{evidence}"}
```

Example: `{"id": "VR.286", "title": "Regression: API timeout", "category": "regression", "verified": true, "notes": "Confirmed 30s response"}`

## Bounds

- Touch only what's necessary
- No style changes, no refactoring
- No added comments/docstrings
- Follow existing patterns
```
