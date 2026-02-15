# AGENTS.md - 2nd Brain App

Personal knowledge management system — your digital second brain.

## Project Overview

Local-first Next.js app with glassmorphism UI, persistent storage via Zustand, and kanban-style task board. Connects to OpenClaw workspace for live filesystem view.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| State | Zustand + persist middleware |
| UI Components | Radix UI (Dialog) |
| Icons | Lucide React |
| Dates | date-fns |
| Markdown | react-markdown |

## Project Structure

```
app/
├── api/
│   ├── files/route.ts        # List all markdown files
│   └── file/[...path]/       # Read file contents
├── components/
│   ├── ui/                   # Reusable UI (button, card, input, etc.)
│   ├── sidebar.tsx
│   ├── command-palette.tsx
│   └── hydration-gate.tsx    # Prevents SSR flicker
├── stores/
│   ├── memories.ts
│   ├── documents.ts
│   ├── tasks.ts
│   └── filesystem.ts         # Live filesystem access + polling
├── lib/
│   ├── types.ts
│   ├── utils.ts
│   └── date-utils.ts         # Shared date normalization
├── memories/
├── documents/workspace/      # File viewer for workspace files
├── tasks/
└── page.tsx                  # Dashboard with filesystem view
```

## Key Conventions

### State Management
- Use Zustand for all global state
- Persist to localStorage via `persist` middleware
- Keep stores in `app/stores/`

### Date Handling
- Use `normalizeDate()` from `lib/date-utils.ts`
- Never duplicate date normalization logic

### API Routes
- Keep filesystem API in `app/api/files/`
- Validate paths stay within `WORKSPACE_ROOT`
- Return only `.md` files, never directories

### Components
- UI primitives go in `components/ui/`
- Use `hydration-gate.tsx` to prevent SSR flicker
- Add `aria-label` to interactive elements

## Common Tasks

### Adding a new store
1. Create file in `app/stores/`
2. Follow pattern: state + actions + persist
3. Export hook for components

### Adding an API route
1. Create `route.ts` in `app/api/<name>/`
2. Export named HTTP method handlers (GET, POST, etc.)
3. Return `NextResponse.json()`

### Working with the filesystem API
- Files are scanned from `/home/toilet/clawd`
- Auto-polling every 5 seconds on dashboard
- All markdown files shown with live timestamps

## Rules

1. **Lint before commit** — `npm run lint` must pass
2. **No SSR flicker** — use HydrationGate for client-only components
3. **Type safety** — all stores and props typed
4. **No directories in API** — files only, directories are traversed not returned
5. **Keep isDirectory field** — frontend relies on it (always `false` for files)

## Running

```bash
npm run dev              # localhost:3000
npm run dev -- --hostname 0.0.0.0  # Network access
npm run lint             # Check code
```

---

*Last updated: 2026-02-15 (post API bugfix)*
