# AI Specification Breakdown

CS485 Project 2 – Frontend for transforming specification documents into Jira-ready issues.

## Overview

Single-page React app that lets project leads upload a spec (.txt or .md), generate suggested Jira issues via a mock API, review and edit them, approve, and publish. Implements **US1** (AI breakdown) and **US2** (review/edit before publishing).

## Run locally

```bash
cd frontend
npm install
npm run dev
```

Open the URL shown (e.g. `http://localhost:5173`).

## Routes / pages

Single-page app – no routes. All flows happen on one view with different states (empty, spec ready, loading, tasks, error, publish success).

## Demo loading / error states

- **Loading:** Upload a file, click Generate. Loading state shows spinner and “Analyzing Specification…”.

- **Generation error:** During loading, click **“Simulate error path”**. The Generation Failed screen appears with Retry Generation.

- **Publish error:** Edit `frontend/src/api/mockApi.js` – in `publishIssues`, temporarily add `|| true` to the `forceError` condition so it always throws, then Publish. The publish error banner appears with Retry Publish.

## Mockups

Figma mockup screenshots live in `/mockups` (desktop and mobile variants). See `docs/turn-in.md` for expected filenames.

## Docs

- `docs/user-stories.md` – US1/US2 with acceptance criteria
- `docs/turn-in.md` – Submission template
- `docs/test-plan.md` – Screen recording checklist
- `docs/responsive-notes.md` – Breakpoints and layout
- `docs/accessibility.md` – Accessibility summary
