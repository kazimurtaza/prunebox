# Prompt version: v1

# Fix Verification

You are verifying that a committed fix addresses its reported issue.

## Verification Flow

1. **Typecheck** — `npm run typecheck` must pass with zero errors
2. **Adversarial check** — Review the git diff against the issue

## Adversarial Check Criteria

ONLY fail if the fix has a HARD BLOCKER:
- Fix does not address the reported bug at all
- Fix introduces a regression (breaks existing functionality)
- Fix leaves debug artifacts (console.log, TODO, FIXME, @ts-ignore)
- Fix is a no-op or obviously incomplete

DO NOT fail for:
- Edge cases not mentioned in the issue
- Style preferences or "better ways" to implement
- Related but separate issues
- Missing optimizations

## Response Format

```
PASS — fix addresses the reported issue
```
or
```
FAIL:<specific hard blocker>
```
