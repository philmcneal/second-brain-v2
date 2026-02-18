# AGENTS.md - 2nd Brain App

Personal knowledge management system — your digital second brain.

## Project Overview

Local-first Next.js app with glassmorphism UI. Features include:
- **Mission Control Center** — Unified dashboard for tasks and commitments
- **Bidirectional Task Sync** — Tasks read/write to markdown files (TODO.md & COMMITMENTS.md)
- **Live Filesystem View** — Real-time view of OpenClaw workspace
- **Kanban Task Board** — Drag-and-drop task management

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| State | Zustand (+ async API calls for tasks) |
| UI Components | Radix UI |
| Icons | Lucide React |
| Dates | date-fns |
| Drag & Drop | @dnd-kit |

## Project Structure

```
app/
├── api/
│   ├── files/route.ts              # List all markdown files
│   ├── file/[...path]/             # Read file contents
│   ├── tasks/route.ts              # CRUD for tasks (file-based)
│   └── mission-control/            # Mission Control API routes
│       ├── todo/route.ts           # Parse TODO.md
│       ├── commitments/route.ts    # Parse COMMITMENTS.md
│       └── memory-activity/route.ts # List recent memory files
├── components/
│   ├── ui/                         # Reusable UI primitives
│   ├── sidebar.tsx
│   ├── command-palette.tsx
│   ├── task-assignee-widget.tsx   # AI/User task split view
│   ├── hydration-gate.tsx         # Prevents SSR flicker
│   └── data-transfer-controls.tsx # Import/export JSON
├── stores/
│   ├── memories.ts
│   ├── documents.ts
│   ├── tasks.ts                   # File-based (API calls, polling)
│   └── filesystem.ts              # Live filesystem access
├── lib/
│   ├── types.ts
│   ├── utils.ts
│   ├── date-utils.ts
│   └── task-markdown.ts           # Parser for TODO/COMMITMENTS.md
├── mission-control/
│   └── page.tsx                   # Mission Control dashboard
├── memories/
├── documents/workspace/
├── tasks/
│   └── page.tsx                   # Kanban board
└── page.tsx                       # Main dashboard
```

## Key Architecture Patterns

### Task System (File-Based)
**CRITICAL:** Tasks are no longer in localStorage. They are stored in markdown files:
- `TODO.md` → User tasks (assignee="user")
- `COMMITMENTS.md` → AI tasks (assignee="ai")

**How it works:**
1. `tasks.ts` store calls `/api/tasks` for all CRUD operations
2. API routes parse/write markdown files with embedded JSON metadata
3. Store polls every 5 seconds (`startTasksPolling()`) to sync external changes
4. Task metadata embedded as HTML comments: `<!-- sb:task {"id":"..."} -->`

**Status Mapping:**
| App Status | TODO.md | COMMITMENTS.md |
|------------|---------|----------------|
| todo | `[ ]` unchecked | `pending` |
| in-progress | `[ ]` unchecked | `in-progress` |
| done | `[x]` checked | `done` |

### Date Handling
- Use `normalizeDate()` from `lib/date-utils.ts`
- Never duplicate date normalization logic

### State Management
- **Memories/Documents:** Zustand + localStorage persist
- **Tasks:** Zustand + API calls (file-based, no persist middleware)
- **Filesystem:** Zustand + polling

### API Routes
- Filesystem APIs validate paths stay within `WORKSPACE_ROOT` (`/home/toilet/clawd`)
- Task API handles both TODO.md and COMMITMENTS.md
- Return `NextResponse.json()` with consistent error shapes

### Components
- Use `hydration-gate.tsx` to prevent SSR flicker
- Task operations are **async** — use `await` and handle errors with toast
- Add `aria-label` to interactive elements

## Common Tasks

### Adding a task
```typescript
await addTask({
  title: "Task name",
  description: "Details",
  priority: "high", // low | medium | high
  assignee: "user", // "user" | "ai"
  dueDate: "2026-02-20",
  tags: ["work"]
});
```

### Updating a task
```typescript
await updateTask(taskId, { status: "done" });
```

### Working with the filesystem API
- Files scanned from `/home/toilet/clawd`
- Auto-polling every 5 seconds
- All markdown files shown with live timestamps

## Rules

1. **Lint before commit** — `npm run lint` must pass
2. **No SSR flicker** — use HydrationGate for client-only components
3. **Type safety** — all stores and props typed
4. **Async task operations** — Always `await` task CRUD, handle errors
5. **File paths** — Never hardcode paths; use `WORKSPACE_ROOT` constant

## Running

```bash
npm run dev              # localhost:3000
npm run dev -- --hostname 0.0.0.0  # Network access
npm run lint             # Check code
npm test                 # Run tests
```

## Recent Major Changes (2026-02-16)

### Mission Control Center
- New dashboard at `/mission-control`
- Shows TODO.md and COMMITMENTS.md side-by-side
- Quick Actions panel (moved to top)

### Bidirectional Task Sync
- Tasks now stored in markdown files, not localStorage
- Real-time sync between app and file edits
- 5-second polling for external changes

### New Files
- `app/api/tasks/route.ts` — Task CRUD API
- `app/lib/task-markdown.ts` — Markdown parser/serializer
- `app/components/task-assignee-widget.tsx` — Split task view
- `app/mission-control/page.tsx` — Mission Control dashboard

---

## OpenClaw Config Optimizer (2026-02-17)

New Mission Control section for managing OpenClaw configuration files.

### Features
- **Config Files Overview** — Grid view of all 6 vital config files (SOUL.md, TOOLS.md, MEMORY.md, AGENTS.md, USER.md, HEARTBEAT.md)
- **File Viewer Modal** — Read-only markdown viewer with metadata
- **Optimization Suggestions** — Heuristic-based analysis with priority levels

### New Files
- `app/api/config-files/route.ts` — List config files with metadata
- `app/api/config-files/[filename]/route.ts` — GET/PUT individual files
- `app/api/config-analysis/route.ts` — Analyze files, return suggestions
- `app/components/config-file-list.tsx` — Config file grid component
- `app/components/config-viewer-modal.tsx` — File viewer modal
- `app/components/config-optimizer-panel.tsx` — Suggestions panel

### API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/config-files` | GET | List all config files with size, modified time, exists status |
| `/api/config-files/[filename]` | GET | Read file content |
| `/api/config-files/[filename]` | PUT | Save file content |
| `/api/config-analysis` | GET | Get optimization suggestions |

### Types (added to `app/lib/types.ts`)
```typescript
export interface ConfigFile {
  name: string;
  path: string;
  lastModified: string;
  size: number;
  exists: boolean;
}

export interface ConfigSuggestion {
  id: string;
  file: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}
```

---

*Last updated: 2026-02-17 (OpenClaw Config Optimizer added)*
