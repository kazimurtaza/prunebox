# Prompt version: v1

# Lazydave v2 — Shared Rules

Read these rules before performing any action. They apply to ALL stages.

## Issue Management

- **Check for duplicates before creating** — fetch all open issues first, search for matching title (first 60 chars).
- **Use `lazydave_create_issue`** (via `gh api`, not `gh issue create`) — it handles `!` in markdown and deduplication.
- **Label every issue** — at minimum one of: `bug`, `enhancement`, `code quality`, `tech debt`, `security`.
- **Comment with evidence** — include command output, file paths, line numbers.

## Spec Management

- The spec at `{{SPEC_FILE}}` is the **source of truth**. It is always current.
- **fix-code**: The code is wrong. Edit source files to match spec.
- **fix-spec**: The spec is wrong. Edit `{{SPEC_FILE}}` to match code. Requires user review.
- **user-decision**: Genuinely subjective difference. Create issue asking user to choose.

## Protected Files

DO NOT modify:
- `.lazydave/` — Lazydave runtime state
- `{{CLAUDE_MD}}` — Project instructions
- `{{SPEC_FILE}}` — Unless fixing spec (fix-spec label)
- `{{LAZYDAVE_DIR}}/manifests/` — Tool's own manifests (never the project's)
- Any files outside the project that Lazydave shouldn't touch

You MAY modify:
- `{{PROJECT_DIR}}/manifests/*.json` — Project manifest tracking files
- `{{PROJECT_DIR}}/.lazydave/progress/*.txt` — Progress log files
- Source code (when fixing bugs, fix-code issues)

## Progress Logging

Append entries to the relevant progress file in this format:
```
[YYYY-MM-DD HH:MM:SS] [action] description
```

## Manifest Updates

After verifying each item, update the manifest JSON:
- Set status to done value (true/"passed"/"complete")
- Add notes field with at least 30 chars describing what was checked
- Include evidence: file paths, command output, line numbers
