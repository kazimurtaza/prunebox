```
variant-a
# Prompt version: v4-a

# Smoke Verification

You are verifying **{{PROJECT_NAME}}** after a build pass. **Find bugs. Be skeptical.**

Read `{{CLAUDE_MD}}` then `{{SPEC_FILE}}`.

## Verification Protocol

1. Read check catalog below
2. **ACTUALLY EXECUTE** each check — curl, run commands, inspect output
3. Use Docker if configured. Else dev server or direct execution
4. Foreground only — no background processes
5. Don't read code — verify behavior empirically
6. Don't modify source — report issues only
7. Create issues via `lazydave_create_issue`
8. Update `.lazydave/manifests/smoke-checks.json`:
   - Find check by ID
   - Set `"verified": true` (pass) or `"failed"` (fail)
   - Add evidence to `"notes"`
9. Log to `.lazydave/progress/smoke-progress.txt`

## Check catalog

## Recent failures

[
  {"run_id": "1776703676-1235535", "ts": "2026-04-20T16:47:57Z", "outcome": "error", "iterations": 0},
  {"run_id": "1776699565-1070716", "ts": "2026-04-20T15:39:25Z", "outcome": "fail", "iterations": 5}
]

## Recent failure traces

[
  {
    "run_id": "1776703676-1235535",
    "ts": "2026-04-20T16:47:57Z",
    "stage": "smoke",
    "prompt_version": "",
    "outcome": "error",
    "issue_num": null,
    "iterations": 0,
    "cost_cents": 0,
    "files_touched": []
  },
  {
    "run_id": "1776699565-1070716",
    "ts": "2026-04-20T15:39:25Z",
    "stage": "smoke",
    "prompt_version": "",
    "outcome": "fail",
    "issue_num": null,
    "iterations": 5,
    "cost_cents": 0,
    "files_touched": []
  }
]
```

variant-b
# Prompt version: v4-b

# Smoke Verification

Verify **{{PROJECT_NAME}}** after a build pass. **Hunt for bugs. Be ruthless.**

Read `{{CLAUDE_MD}}` then `{{SPEC_FILE}}`.

## Checks

1. Read check catalog below
2. For each check: EXECUTE and verify — curl, run commands, inspect output
3. Use Docker if configured. Else dev server or direct execution
4. Foreground only — no background processes
5. Don't read code — verify behavior empirically
6. Don't modify source — report issues only
7. Create issues via `lazydave_create_issue`
8. Update `.lazydave/manifests/smoke-checks.json`:
   - Find check by ID
   - Set `"verified": true` (pass) or `"failed"` (fail)
   - Add evidence to `"notes"`
9. Log to `.lazydave/progress/smoke-progress.txt`

## Check catalog

## Recent failures

[
  {"run_id": "1776703676-1235535", "ts": "2026-04-20T16:47:57Z", "outcome": "error", "iterations": 0},
  {"run_id": "1776699565-1070716", "ts": "2026-04-20T15:39:25Z", "outcome": "fail", "iterations": 5}
]

## Recent failure traces

[
  {
    "run_id": "1776703676-1235535",
    "ts": "2026-04-20T16:47:57Z",
    "stage": "smoke",
    "prompt_version": "",
    "outcome": "error",
    "issue_num": null,
    "iterations": 0,
    "cost_cents": 0,
    "files_touched": []
  },
  {
    "run_id": "1776699565-1070716",
    "ts": "2026-04-20T15:39:25Z",
    "stage": "smoke",
    "prompt_version": "",
    "outcome": "fail",
    "issue_num": null,
    "iterations": 5,
    "cost_cents": 0,
    "files_touched": []
  }
]
```

variant-c
# Prompt version: v4-c

# Smoke Verification

Verifying **{{PROJECT_NAME}}** post-build. **Find bugs. Stay skeptical.**

Read `{{CLAUDE_MD}}` then `{{SPEC_FILE}}`.

## Execution

1. Read check catalog below
2. Verify each check by EXECUTING — curl, commands, output inspection
3. Docker if configured, else dev server or direct execution
4. Foreground only — no background processes
5. Don't read code — verify behavior empirically
6. Don't modify source — report issues only
7. Create issues via `lazydave_create_issue`
8. Update `.lazydave/manifests/smoke-checks.json`:
   - Find check by ID
   - Set `"verified": true` (pass) or `"failed"` (fail)
   - Add evidence to `"notes"`
9. Log to `.lazydave/progress/smoke-progress.txt`

## Check catalog

## Recent failures

[
  {"run_id": "1776703676-1235535", "ts": "2026-04-20T16:47:57Z", "outcome": "error", "iterations": 0},
  {"run_id": "1776699565-1070716", "ts": "2026-04-20T15:39:25Z", "outcome": "fail", "iterations": 5}
]

## Recent failure traces

[
  {
    "run_id": "1776703676-1235535",
    "ts": "2026-04-20T16:47:57Z",
    "stage": "smoke",
    "prompt_version": "",
    "outcome": "error",
    "issue_num": null,
    "iterations": 0,
    "cost_cents": 0,
    "files_touched": []
  },
  {
    "run_id": "1776699565-1070716",
    "ts": "2026-04-20T15:39:25Z",
    "stage": "smoke",
    "prompt_version": "",
    "outcome": "fail",
    "issue_num": null,
    "iterations": 5,
    "cost_cents": 0,
    "files_touched": []
  }
]
```
