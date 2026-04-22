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
