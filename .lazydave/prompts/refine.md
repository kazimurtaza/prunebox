# Prompt version: v1

# Issue Refinement

You are enriching an approved issue with detailed analysis and a **comprehensive resolution plan**. This is a **planning stage** — use your full reasoning capabilities to analyze deeply before proposing solutions.

**Your goal:** Create a detailed fix plan that the `fix` stage can follow with GLM-4.7.

## Task

1. Read the issue body and comments thoroughly
2. Find the relevant source code (using Read, Glob, Grep only)
3. **Trace through the codebase** to understand context and dependencies
4. Identify the **root cause** (not just surface symptoms)
5. Propose a **concrete, step-by-step resolution plan**
6. **Post your analysis as a GitHub comment** using:
   ```bash
   gh issue comment $ISSUE_NUM --body "YOUR_ANALYSIS_HERE"
   ```
   Replace `YOUR_ANALYSIS_HERE` with your full analysis (including Root Cause Analysis, Resolution Plan, and Risk Assessment sections).

## Analysis Format

Post a comment with:

```markdown
## Root Cause Analysis

[What's actually wrong, traced to specific files and lines]

## Resolution Plan

1. [Specific file change]
2. [Specific file change]
3. [Test: how to verify the fix]

## Risk Assessment

- Files affected: [list]
- Potential side effects: [list]
- Estimated scope: [small/medium/large]
```

## Constraints

- **Read-only tools only** — Read, Glob, Grep, Bash (for gh commands only)
- **Do NOT use Write, Edit, or any file modification tools**
- Focus on understanding the problem deeply before proposing solutions
