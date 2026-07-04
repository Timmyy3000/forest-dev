# Forest — instructions for coding agents

You are reading this because you have been asked to use Forest while working in a repository. Follow this document exactly; it is the complete contract.

## What Forest is

Forest (`forest`) is a repo-local Git worktree manager built for parallel work by coding agents. Every task gets its own Git worktree — a full checkout on its own branch — inside the repository at `.forest/worktrees/<name>`. Forest tracks who is working on what in `.forest/state/worktrees.json`, and makes creation, status reporting, and cleanup safe.

Key facts:

- Worktrees live INSIDE the repo, under `.forest/worktrees/`. The `.forest/` directory is gitignored.
- Git remains the source of truth; Forest state augments it and is reconciled against `git worktree list` before anything destructive.
- Every command works from anywhere inside the repo, including from inside a worktree — Forest resolves the owning repository through Git's common directory, so you can never nest a `.forest/` inside a worktree.
- Every command accepts `--json` for machine-readable output. Prefer it.

## Install

macOS / Linux (and Git Bash / WSL on Windows):

```
curl -fsSL https://forest.timi.click/install.sh | sh
```

Windows (PowerShell):

```
irm https://forest.timi.click/install.ps1 | iex
```

Or with Go on any platform: `go install github.com/Timmyy3000/git-forest/cmd/forest@latest`

Verify: `forest doctor` (run inside a Git repository).

## The workflow you must follow

### 1. Before starting work

```
forest status --json
```

See what already exists. Never reuse another agent's dirty worktree.

### 2. Create your worktree

```
forest add <short-task-name> --agent <your-name> --json
```

- This creates branch `forest/<short-task-name>`, a worktree at `.forest/worktrees/<short-task-name>`, and records you as the owner. The JSON result includes the worktree path — `cd` into it and do all your work there.
- If the repo has branch naming conventions (e.g. `feat/...`), use `-b` — the branch name becomes the worktree identity: `forest add -b feat/login-copy --agent <your-name> --json`
- To base the branch on something other than the default branch: `--from <ref>`.
- Forest copies repo-configured local files (`.env`, agent config, etc., per `[add] copy` in `.forest/config.toml`) into the new worktree automatically.
- No `forest init` needed — `add` auto-initializes on first use.
- Forest does not fetch from remotes unless the branch cannot be resolved locally, or you pass `--fetch`.

### 3. Report activity with `forest mark`

Run from inside your worktree (target is inferred from your working directory), or name it explicitly.

```
forest mark --phase working --agent <your-name> --note "what you are doing"
forest mark --phase blocked --note "need DB credentials"
forest mark --phase ready --note "tests pass"
```

Phases: `claimed`, `working`, `waiting`, `blocked`, `ready`, `done`.

Mark at minimum: when you start (`working`), when you cannot proceed (`blocked`, with the reason in `--note`), and when you finish (`ready` or `done`). Omitting `--agent`/`--note` keeps the stored values; passing an empty string clears them.

### 4. Find your way around

```
forest path <name>        # print a worktree's absolute path
forest path --current     # path of the worktree you are inside
forest list --json        # every worktree: agent, phase, git state, integration
```

### 5. Cleanup — only when told to

```
forest close <name> --yes
```

- Close ONLY when the human instructs you to, or when the work is proven integrated (merged or squash-merge patch-equivalent — Forest checks this itself).
- Non-interactive use requires `--yes`. Dirty, unmerged, current, or in-use worktrees are refused unless you pass `--include-dirty` / `--include-unmerged` — do not pass those without explicit human instruction.
- Bulk cleanup of everything integrated: `forest close --merged --yes`.
- NEVER delete `.forest/worktrees/*` directories or run `git worktree remove` yourself. Always go through `forest close`.

## Rules

1. One task, one worktree. Create it with `forest add`, work only inside it.
2. Always pass `--agent <your-name>` when creating, and keep your activity current with `forest mark`.
3. Always prefer `--json` and parse the output rather than scraping human-readable text.
4. Never work directly on the main checkout when Forest is in use.
5. Never remove worktrees, branches, or `.forest/` contents by hand.
6. If a command reports "Forest state is locked", another Forest process is running — wait and retry. Only suggest `forest doctor --fix` to the human if the lock persists.
7. If anything looks inconsistent (missing paths, unknown worktrees), run `forest doctor --json` and report the findings; do not attempt manual repair.

## Command reference

| Command | Purpose | Key flags |
|---|---|---|
| `forest init` | Make repo Forest-managed (usually automatic) | `--json` `--quiet` |
| `forest add <name>` | Create branch `forest/<name>` + worktree | `-b <branch>` `--from <ref>` `--agent` `--fetch` `--json` `--quiet` |
| `forest list` | Dashboard: name, agent, phase, git state, integration | `--agent` `--phase` `--all` `--verbose` `--json` |
| `forest status` | Grouped view: active / blocked / ready to close / needs attention | `--agent` `--phase` `--json` |
| `forest mark` | Update phase/agent/note for a worktree | `--phase` `--agent` `--note` `--json` |
| `forest path [name]` | Print worktree path | `--current` `--relative` `--json` |
| `forest close <name>` | Safely remove a finished worktree | `--merged` `--yes` `--include-dirty` `--include-unmerged` `--delete-branch` `--json` |
| `forest doctor` | Diagnose and repair state/setup issues | `--fix` `--verbose` `--json` |

Source: https://github.com/Timmyy3000/git-forest
