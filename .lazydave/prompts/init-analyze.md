# Prompt version: v2

# Project Analysis for Manifest Generation

You are analyzing **{{PROJECT_NAME}}** to generate QA manifests and deployment artifacts.

**IMPORTANT: Execute this analysis now. Read files, analyze the project, and write the output. Do not just acknowledge this prompt — complete the full task.**

## Steps (execute in order)

1. Use Glob to discover the top-level project layout
2. Read key files to understand what this project is (README, Makefile, package.json, Dockerfile, etc.)
3. If `{{SPEC_FILE}}` exists, read it for feature requirements
4. Write `deploy-local.sh` to the project root — a script that starts the dev server for QA testing
5. If the project needs a Dockerfile or docker-compose.yml and they don't exist, create them
6. Write your analysis to `.lazydave/manifests/.init-analysis.json` (see format below)

## deploy-local.sh

Write a `deploy-local.sh` script to the project root that starts the development server for QA testing.

**IMPORTANT: Prefer Docker when a docker-compose.yml exists.** The QA pipeline needs a running server on a predictable port. Docker provides a consistent environment.

- **Docker project** (docker-compose.yml exists) — use `docker compose up -d --build`. Extract the host port from the compose file (first number before `:` in a port mapping like `"8080:3000"` → use `8080`)
- **npm project** (no Docker) — use `npm run dev` (or `npm run dev:all` if a `dev:server` script exists)
- **Python project** — use the appropriate venv/venv activation + server command
- **Go project** — use `go run` or the Makefile target
- **Bash project** — source the main entry point

The script must:
- Be executable (`chmod +x`)
- Use `set -euo pipefail`
- Wait for the server to be ready (poll with curl)
- Print the URL where the server is accessible
- Read the port from `.lazydave/manifests/config.json` under `docker.dev_port` or `docker.port` if available
- Work when run from the project root

## Optional: Dockerfile and docker-compose.yml

If the project has a build system but no Dockerfile, create a minimal production Dockerfile.
If the project has a Dockerfile but no docker-compose.yml, create one.

Only create these if the project clearly needs containerization (web apps, APIs, services).
Do NOT create Docker files for pure libraries, CLI tools, or bash script projects.

## What to determine

- **Project type** — web app, CLI tool, library, bash scripts, etc.
- **Key components** — main files/modules/directories to verify
- **Build system** — how is it built? Tests? Linting?
- **UI requirements** — does it have a visual/UI component? (CLI terminal output counts as UI — banners, colors, progress bars, formatted tables are all visual elements worth testing)
- **Spec coverage** — what spec sections need audit areas?

## Output format

Write a JSON object to `.lazydave/manifests/.init-analysis.json`:

```json
{
  "project_type": "string",
  "components": [
    {"path": "relative/path", "type": "script|module|config|directory", "description": "what it does"}
  ],
  "build_system": {"tool": "string", "command": "string", "has_tests": bool, "has_lint": bool},
  "has_ui": bool,
  "smoke_checks": [
    {"id": "V1", "category": "string", "title": "specific testable claim", "steps": "concrete verification action"}
  ],
  "visual_areas": [
    {"id": "T1", "category": "string", "title": "specific visual aspect"}
  ],
  "audit_areas": [
    {"id": "A1", "category": "string", "title": "Section N: title", "spec_sections": ["N"]}
  ]
}
```

## Rules

- Only include smoke checks that are actually verifiable (can run a command, check a file, test a behavior)
- Only include visual areas if the project has a UI (web app, desktop app, CLI tool with terminal output formatting, etc.)
- Only include audit areas if a spec file exists
- Categories should be descriptive (e.g., "scripts", "api", "config", "infra", "widgets")
- Steps must be concrete actions (e.g., "Run `make test` and verify all tests pass")
- Do NOT include checks for the lazydave tooling itself (lazydave/, .lazydave/, manifests/)
- Do NOT include checks for deploy-local.sh or other generated scripts
- Keep the total number of smoke checks reasonable (5-20, not 100+)
- Smoke check IDs should start at V1 and increment
- Visual area IDs should start at T1 and increment
- Audit area IDs should start at A1 and increment
- **Write valid JSON only** — no invalid escape sequences like \( or \) in strings
