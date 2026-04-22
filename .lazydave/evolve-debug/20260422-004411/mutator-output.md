```markdown
# Prompt version: v2-a

# Issue Fix

Fixing approved issue for **{{PROJECT_NAME}}**. Check `.lazydave/hotspots.md` for context.

## CRITICAL: You MUST Edit Files

Recent runs failed with 0 files touched. **This run fails if you don't use the Edit tool.**

## Required Actions

1. **Find:** Read issue → Use Glob/Grep to locate the buggy file
2. **Edit:** Use Edit tool to fix the bug. **This step is mandatory.**
3. **Test:** `npm run typecheck`
4. **Commit:** `fix(scope): description (#ISSUE_NUM)`
5. **Track:** Append regression to `.lazydave/manifests/smoke-checks.json`

## Fix Type Logic

- `fix-code` → Edit source files
- `fix-spec` → Edit `{{SPEC_FILE}}`
- No label → Edit source files

## Example

Issue #123: "Login button broken"
1. Find bug at `src/components/Login.tsx:45`
2. Edit: Add `onClick={handleLogin}` to button element
3. Test → passes
4. Commit → `fix(login): add onClick handler (#123)`
5. Track → `{"id":"VR.123","title":"Regression: Login works",...}`

## Constraints

- Minimal changes only
- No comments or refactoring
- Follow existing patterns

```

```markdown
# Prompt version: v2-b

# Issue Fix

Fixing approved issue for **{{PROJECT_NAME}}**. Context in `.lazydave/hotspots.md`.

## Step 1: Locate Bug (Glob/Grep/Read)

Find the file/line causing the issue.

## Step 2: EDIT THE FILE (Edit tool)

**Non-negotiable:** You must use Edit tool to change code. No exceptions.

## Step 3: Typecheck

Run `npm run typecheck`. Fix errors.

## Step 4: Commit

`fix(scope): description (#ISSUE_NUM)`

## Step 5: Regression Test

Append to `.lazydave/manifests/smoke-checks.json`:
```json
{"id":"VR.{N}","title":"Regression: {what}","category":"regression","verified":true,"notes":"{evidence}"}
```

## Fix Labels

- `fix-code` → Edit source
- `fix-spec` → Edit `{{SPEC_FILE}}`
- Else → Edit source

## Sample Workflow

Issue #116: Settings page crashes on load
1. Grep "settings" → `src/app/settings/page.tsx:23`
2. Edit → Change `null.` to `null?.`
3. `npm run typecheck` → OK
4. `fix(settings): add optional chaining (#116)`
5. Add regression check

## Rules

- Touch exactly what needs fixing
- No "improvements"
- Match code style

```

```markdown
# Prompt version: v2-c

# Issue Fix for {{PROJECT_NAME}}

Check `.lazydave/hotspots.md` for context.

## FAILURE MODE: Reading Without Editing

Previous runs: 0 files touched, 2-5 iterations wasted, $200-$550 burned.

**You are forbidden from completing this task without editing a file.**

## Workflow

1. **Read issue** → Understand what breaks
2. **Locate code** (Glob/Grep) → Find exact file/line
3. **EDIT FILE** (Edit tool) → Apply minimal fix
4. **Typecheck** → `npm run typecheck`
5. **Commit** → `fix(scope): description (#ISSUE_NUM)`
6. **Regress** → Append to smoke-checks.json

## Type Detection

Issue label `fix-spec`? Edit `{{SPEC_FILE}}`.
Otherwise? Edit source code.

## Concrete Example

Issue #108: "Delete button shows wrong text"
- Found: `src/components/UserActions.tsx:67`
- Edited: Changed `"Delete"` to `"Remove"`
- Typechecked: passed
- Committed: `fix(ui): correct delete button text (#108)`
- Regressed: `{"id":"VR.108","title":"Regression: Delete button text correct",...}`

## What NOT To Do

- Don't explain without editing
- Don't refactor "while you're here"
- Don't add comments
- Don't touch unrelated files

Edit exactly one thing. Commit. Done.
```
