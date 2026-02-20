# 🎯 TONIGHT_FOCUS — Nightly PM Prioritization

**Date:** 2026-02-20  
**Session:** Nightly Feature Development v2  
**Selected Feature:** Slash Command Inbox for Mission Control

---

## Selected Feature

### Slash Command Inbox for Mission Control
Add a new Mission Control widget that scans `TODO.md` for product-planning slash commands (`/feature`, `/bug`, `/marketing`, including bracketed forms like `[/feature]`) and surfaces them as a prioritized queue.

---

## Why This One (Impact Rationale)

- **Directly supports nightly automation flow:** The cron system now depends on slash-command-driven prioritization, but there is no in-app visibility for those commands yet.
- **High user impact:** Gives Vap3 a fast way to see planning directives without manually grepping markdown.
- **Quick win:** Can be built on existing file-reading patterns (`/api/mission-control/*`) with small-to-medium scope.
- **Bridges PM + execution:** Keeps planning artifacts visible inside the same dashboard used for daily execution.

---

## Marketing Angle

**"Turn plain markdown into an executable product queue."**

Mission Control now auto-detects `/feature`, `/bug`, and `/marketing` directives from TODO.md so ideas become visible priorities immediately.

---

## Estimated Scope

**Medium**

- Add API route for slash command extraction
- Add Mission Control widget with command cards + empty state
- Add tests for parser/route
- Update README with new capability

---

## Candidate Scoring

| Candidate | User Impact | Marketing Value | Quick Win | Total | Notes |
|---|---:|---:|---:|---:|---|
| **Slash Command Inbox (selected)** | 5/5 | 5/5 | 4/5 | **14** | Supports cron v2 workflow and is demo-friendly |
| Task Board Filters (assignee/priority) | 4/5 | 3/5 | 4/5 | 11 | Useful but less differentiated |
| Mission Control Status Digest Card | 3/5 | 3/5 | 5/5 | 11 | Easy but lower strategic leverage |

---

## Phase-1 Notes

- `TODO.md` and `COMMITMENTS.md` were **not present in this repo path** (`/home/toilet/Projects/second-brain`).
- Used workspace canonical files at `/home/toilet/clawd/TODO.md` and `/home/toilet/clawd/COMMITMENTS.md` for signal.
- No explicit `[/feature]`, `[/bug]`, `[/marketing]` entries currently exist in TODO.md, which increases the value of adding visibility and discoverability in-app.
