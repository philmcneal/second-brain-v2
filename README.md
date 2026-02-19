# 2nd Brain

Personal knowledge management system — your digital second brain.

## Features

### Mission Control Center (`/mission-control`)

Unified dashboard for tracking Vap3's and Chief's active work at a glance.

- **Vap3's Tasks** — Reads from `TODO.md`; shows sections, completion status, and quick-open link.
- **Chief's Tasks** — Reads from `COMMITMENTS.md`; shows active and recently completed commitments.
- **Memory Activity Feed** — Live-updating list of the 10 most recently modified `.md` files from `~/clawd/memory/`. Auto-refreshes every 5 seconds with no manual intervention needed. Shows filename, file size, relative timestamp, and a plain-text preview. Click any entry to open the file in the workspace viewer.
- **OpenClaw Config Optimizer** — View and edit vital config files (SOUL.md, TOOLS.md, etc.) with inline optimization suggestions.

> **"Your second brain remembers what you forgot."**
> The Memory Activity feed automatically surfaces your recent thoughts, notes, and daily logs — no digging through folders required.

### Task Board (`/tasks`)

Kanban-style drag-and-drop board. Tasks are stored in markdown files (`TODO.md` / `COMMITMENTS.md`) and sync bidirectionally with the Mission Control view.

### Live Filesystem View

Real-time view of the OpenClaw workspace at `~/clawd`. All markdown files are scanned and kept current via 5-second polling.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| State | Zustand |
| UI Components | Radix UI |
| Icons | Lucide React |
| Dates | date-fns |
| Drag & Drop | @dnd-kit |

## Getting Started

```bash
npm run dev              # localhost:3000
npm run dev -- --hostname 0.0.0.0  # Network access
```

## Development

```bash
npm run lint             # ESLint check
npm test                 # Vitest unit tests
npm run build            # Production build
```

## API Reference

| Route | Method | Description |
|-------|--------|-------------|
| `/api/mission-control/memory-activity` | GET | 10 most recent `.md` files in `~/clawd/memory/` with previews |
| `/api/mission-control/todo` | GET | Parse TODO.md into sections |
| `/api/mission-control/commitments` | GET | Parse COMMITMENTS.md into active/completed lists |
| `/api/tasks` | GET/POST/PATCH/DELETE | Task CRUD (file-backed) |
| `/api/files` | GET | List all markdown files in workspace |
| `/api/file/[...path]` | GET | Read file content |
| `/api/config-files` | GET | List OpenClaw config files |
| `/api/config-files/[filename]` | GET/PUT | Read/write config file |
| `/api/config-analysis` | GET | Config optimization suggestions |
