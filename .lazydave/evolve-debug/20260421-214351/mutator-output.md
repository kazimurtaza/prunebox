```
variant-a
# Prompt version: v2-a

# Issue Fix

Fixing approved issue for **{{PROJECT_NAME}}**. Consult `.lazydave/hotspots.md` first.

## Fix Type Detection

Check issue labels for:
- `fix-code` → Edit source code to match spec
- `fix-spec` → Edit `{{SPEC_FILE}}` to match code

If neither label is present, default to `fix-code`.

## Execution Protocol

1. **Identify the target:** What file/line needs to change? State it clearly.
2. **Make the edit:** Use Edit tool to apply the minimal fix.
3. **Verify:** Run `npm run typecheck`. If it fails, fix the errors.
4. **Commit:** Format: `fix(scope): description (#N)`
5. **Add regression:** Append to `.lazydave/manifests/smoke-checks.json`:
   ```json
   {"id": "VR.{N}", "title": "Regression: {desc}", "category": "regression", "verified": true, "notes": "{evidence}"}
   ```

## Critical Constraints

- **You must edit at least one file.** No edits = failed fix.
- Minimal changes only. Don't refactor.
- No comments or docstrings.
- Follow existing code patterns.
- Title under 80 chars.

## Think-Then-Execute Balance

Plan briefly (under 3 minutes), then execute. Don't overanalyze. If uncertain, make the best guess and verify with typecheck.

## Recent Failures

Recent runs failed with 0 files edited. Focus on **making the edit**, not just understanding the issue.

## Constraints

- Minimal changes only — fix the specific issue, nothing more
- Don't add comments, docstrings, or "improvements" beyond the fix
- Don't refactor surrounding code
- Follow existing code patterns in the files you touch
```

```
variant-b
# Prompt version: v2-b

# Issue Fix

Fixing approved issue for **{{PROJECT_NAME}}**. Hotspots: `.lazydave/hotspots.md`

## Fix Type (from issue labels)

- `fix-code`: Code is wrong → Edit source files
- `fix-spec`: Spec is wrong → Edit `{{SPEC_FILE}}`
- No label? Assume `fix-code`

## 5-Step Fix Process

1. **Read issue** — What's broken?
2. **Find code** — Use Glob/Grep/Read. Locate exact spot.
3. **Edit file** — Make minimal fix with Edit tool.
4. **Typecheck** — `npm run typecheck` must pass.
5. **Commit** — `fix(scope): desc (#N)` + add regression check.

## Regression Check Format

Append to `.lazydave/manifests/smoke-checks.json`:
```json
{"id": "VR.{ISSUE_NUM}", "title": "Regression: {brief}", "category": "regression", "verified": true, "notes": "Verified: {how you know it works}"}
```

## Action Required

**You must use Edit tool on at least one file.** If you finish without editing, you failed.

Common pitfall: Spending too much time planning. Plan quickly, then **edit**.

## Edge Cases

- Unclear fix type? Default to fixing code.
- Multiple approaches? Pick the simplest one.
- Typecheck fails? Fix errors, don't ignore them.

## Constraints

- Minimal changes only — fix the specific issue, nothing more
- Don't add comments, docstrings, or "improvements" beyond the fix
- Don't refactor surrounding code
- Follow existing code patterns in the files you touch
```

```
variant-c
# Prompt version: v2-c

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
```
