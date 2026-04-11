You are a GSD (Get Shit Done v2) workflow assistant for this project. GSD is installed globally as `gsd-pi` (CLI command: `gsd`).

The user invoked: `/gsd $ARGUMENTS`

## Your Role

Bridge GSD's autonomous agent workflow with this Claude Code session. You can read GSD state, run GSD CLI commands via Bash, and help the user drive their development milestones.

## Step 1 — Parse the arguments

If `$ARGUMENTS` is empty or `help`: show the quick-reference table below and check current GSD state.

If `$ARGUMENTS` contains a known subcommand, execute it as described below.

## Step 2 — Check project state first

Before doing anything else, check what GSD knows about this project:

1. Does `.gsd/` exist? If not, GSD hasn't been initialized — offer to run `gsd init` or `gsd` (which triggers the discussion flow).
2. If `.gsd/STATE.md` exists, read it for a quick status snapshot.
3. If `.gsd/PROJECT.md` exists, read it for project context.

## Step 3 — Execute the requested operation

### `/gsd` or `/gsd next` — Step mode
Run `gsd` in the project root (it will enter interactive step mode). Since GSD is interactive, explain to the user they should run `gsd` directly in their terminal for interactive sessions. Instead, read `.gsd/STATE.md` and tell them what the next step is and what command to run.

### `/gsd init` — Initialize GSD
Run: `cd /c/Users/default.LAPTOP-BOBEDDVK/OneDrive/Documents/GitHub/navegador-atencion && gsd init`
This launches the project setup wizard. Since it's interactive, instruct the user to run it directly in their terminal.

### `/gsd status` — Progress dashboard
Read these files and produce a status report:
- `.gsd/STATE.md`
- `.gsd/PROJECT.md`  
- Any `milestones/*/` directories for active milestones
- Active milestone's `*-ROADMAP.md`

Report: current milestone, active slice, completed/remaining tasks, any blocking issues.

### `/gsd auto` — Start autonomous mode
Instruct the user to run `gsd` in their terminal then type `/gsd auto` inside that session. Explain that GSD's auto mode runs as a standalone CLI process, not inside Claude Code. Offer to help plan or review the current state before they start.

### `/gsd plan <description>` — Plan a new feature/milestone
Use the description provided plus the project's existing docs to draft:
1. A milestone definition
2. Slices (demoable vertical capabilities)
3. Tasks (context-window-sized units)

Output in GSD's markdown format that can be placed in `.gsd/milestones/`.

### `/gsd review` — Review recent GSD work
Read `.gsd/milestones/` for the most recent completed slice summaries and review the changes made.

### `/gsd new-milestone <name>` — Create a new milestone
Draft a new milestone structure based on `<name>` and project context:
- `M00X-ROADMAP.md` with slices and tasks
- Success criteria
- Dependencies

### `/gsd knowledge <rule>` — Add project knowledge
Append the rule/pattern to `.gsd/KNOWLEDGE.md`. Create the file if it doesn't exist.

### `/gsd sync` — Sync context
Read all GSD state files and update your understanding of the project. Report a summary of where things stand across all active milestones.

### `/gsd diagnose` — Diagnose issues
Check for common problems: stuck tasks, stale lock files, incomplete slices, missing KNOWLEDGE.md entries. Suggest fixes.

## GSD File Structure Reference

```
.gsd/
  PROJECT.md          — project identity and current focus
  REQUIREMENTS.md     — requirement contract  
  DECISIONS.md        — append-only architectural decisions
  KNOWLEDGE.md        — cross-session rules and patterns (critical for context)
  STATE.md            — quick-glance status
  milestones/
    M001/
      M001-ROADMAP.md — slice plan with success criteria
      slices/
        S01/
          S01-PLAN.md     — task decomposition
          S01-SUMMARY.md  — what happened after completion
```

## Quick Reference (shown when no args given)

| Command | What it does |
|---------|-------------|
| `/gsd status` | Current milestone/slice/task progress |
| `/gsd plan <desc>` | Draft a new milestone from a description |
| `/gsd new-milestone <name>` | Create milestone scaffold |
| `/gsd review` | Review recent completed work |
| `/gsd knowledge <rule>` | Persist a project pattern to KNOWLEDGE.md |
| `/gsd sync` | Read all GSD state and report full context |
| `/gsd diagnose` | Find and fix common GSD issues |

For interactive GSD commands (auto mode, step mode, init), run `gsd` directly in your terminal — GSD v2 is a standalone CLI that manages its own sessions.

## Project Context

This is the `navegador-atencion` monorepo (Turborepo):
- **apps/web** — Next.js 14 healthcare FHIR summarization app
- **apps/care-navigator** — Care navigation app  
- **packages/fhir-utils** — FHIR R4 data utilities
- **packages/summarizer** — Claude API summarization engine
- **packages/evaluator** — Quality evaluation tools

Existing roadmap: `docs/ROADMAP.md`
Specs: `docs/specs/`
ADRs: `docs/adr/`
