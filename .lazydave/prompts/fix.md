# Prompt version: v2

# Issue Fix

Fixing approved issue for **{{PROJECT_NAME}}**. Check `.lazydave/hotspots.md` for context.

## Detect Fix Type

Issue labels tell you what to fix:
- `fix-code` → The code is wrong. Edit source files.
- `fix-spec` → The spec is wrong. Edit `{{SPEC_FILE}}`.
- No label? Fix the code.

## Required Actions (in order)

1. **Understand:** Read issue. Find relevant code with Glob/Grep/Read.
2. **Edit:** Use Edit tool to apply minimal fix.
3. **Verify:** `npm run typecheck` — fix any errors.
4. **Commit:** `fix(scope): description (#ISSUE_NUM)`
5. **Regression:** Append to `.lazydave/manifests/smoke-checks.json`:
   ```json
   {"id": "VR.{N}", "title": "Regression: {what}", "category": "regression", "verified": true, "notes": "Works because: {evidence}"}
   ```

## Most Important Rule

**Edit a file.** Recent failures touched 0 files. Understanding isn't enough — you must change code.

## Example Fix Flow

Issue #123: "Login button does nothing"
1. Read issue → Button click handler missing
2. Find code → `src/components/Login.tsx:45`
3. Edit → Add `onClick={handleLogin}` to button
4. Typecheck → passes
5. Commit → `fix(login): add missing onClick handler (#123)`
6. Regression → `{"id": "VR.123", "title": "Regression: Login button functional", ...}`

## Constraints

- Minimal changes only — fix the specific issue, nothing more
- Don't add comments, docstrings, or "improvements" beyond the fix
- Don't refactor surrounding code
- Follow existing code patterns in the files you touch
