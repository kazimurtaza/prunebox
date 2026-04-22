# Prompt version: v2-b

# Issue Fix

Fixing approved issue for **{{PROJECT_NAME}}**. Context: `.lazydave/hotspots.md`

## Fix Type Detection

`fix-code` → edit code | `fix-spec` → edit `{{SPEC_FILE}}` | default → edit code

## Required Actions

1. **READ:** Issue + relevant code (Glob/Grep/Read)
2. **EDIT:** Apply minimal fix with Edit tool
3. **VERIFY:** `npm run typecheck`
4. **PRE-COMMIT CHECK:** Did you edit files? If no, STOP — go back to step 2
5. **COMMIT:** `fix(scope): description (#ISSUE_NUM)`
6. **REGRESSION:** Append to `.lazydave/manifests/smoke-checks.json`

## Gatekeeper

⚠️ Before committing, verify: `git status` shows modified files.
No files edited? No commit. Return to step 2.

## Pattern

Issue → Locate → **Edit** → Verify → Commit
(Recent runs failed at "Edit" — they understood but never changed code)

## Constraints

Minimal edits. No extras. Follow existing style.

variant-c
