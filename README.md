# ctx

Manage AI context across your team's codebase. Write rules, agents, memory, and docs once in `.ctx/` and sync them to Claude Code, Cursor, and Windsurf.

## Install

### From source

```bash
git clone <repo-url> ctx
cd ctx
npm install
npm run build
npm link
```

This makes the `ctx` command available globally.

### From npm (once published)

```bash
npm install -g ctx-ai
```

## Quick start

```bash
# Initialize in your project
cd my-project
ctx init --platforms claude-code,cursor,windsurf

# Add context slots
ctx add rules testing --description "Testing conventions"
ctx add agent reviewer --description "Code review agent"

# Edit your context files
# .ctx/rules/testing.md, .ctx/agents/reviewer.md, etc.

# Generate platform-specific files
ctx sync
```

## Commands

| Command | Description |
|---------|-------------|
| `ctx init` | Initialize `.ctx/` folder and `ctx.yaml` manifest |
| `ctx add <type> <name>` | Add a context slot (`agent`, `rules`, `memory`, `docs`) |
| `ctx sync` | Compile and sync to all configured platforms |
| `ctx status` | Show sync status of all context slots |
| `ctx diff` | Preview what would change on next sync |

## Team usage

Commit `.ctx/`, `ctx.yaml`, and `ctx.lock` to git. Platform output directories (`.claude/`, `.cursor/`, `.windsurf/`) are gitignored automatically.

After pulling changes, teammates run `ctx sync` to regenerate their local platform files.

## Project structure

```
.ctx/                     # Source of truth (committed)
  agents/
  rules/
  memory/
  docs/
ctx.yaml                  # Manifest (committed)
ctx.lock                  # Sync tracking (committed)

.claude/                  # Generated (gitignored)
.cursor/                  # Generated (gitignored)
.windsurf/                # Generated (gitignored)
```