# Test Plan – Screen Recording Checklist

Step-by-step checklist for recording the AI Specification Breakdown demo. Tick each item as you complete it.

---

## US1: AI breaks specification into Jira issues

### Empty state
- [ ] App loads at `http://localhost:5173` (or current port)
- [ ] Left panel shows "Upload Specification" with dashed drop zone
- [ ] Right panel shows "No tasks generated yet" with hint text
- [ ] Stepper shows step 01 active

### Loading state
- [ ] Click "Upload Specification" and select a `.txt` or `.md` file (or drag & drop)
- [ ] Left panel switches to "Uploaded Specification" with spec text
- [ ] Right panel shows "Generate" button → click it
- [ ] Right panel shows spinner, "Analyzing Specification...", and progress bar
- [ ] Stepper shows step 02 active

### Success (generated tasks)
- [ ] After ~2s, right panel shows suggested Jira issues (EPIC-1, STORY-2, etc.)
- [ ] Each card shows summary, description, Size, ACCEPTANCE CRITERIA, Edit, Approve
- [ ] Stepper shows step 03 active

### Error state
- [ ] From empty/specReady, upload a file and click Generate
- [ ] During loading, click "Simulate error path"
- [ ] Right panel shows "Generation Failed" with error code, timestamp, Request ID
- [ ] "Retry Generation" visible
- [ ] Click "Retry Generation" → tasks appear (success path)
- [ ] Stepper shows step 04 active when in error

---

## US2: Review and edit before publishing

### Edit
- [ ] With tasks visible, click "Edit" on one card
- [ ] Inline form shows editable summary, description, acceptance criteria
- [ ] Change text; click "Save" → card updates
- [ ] Click "Edit" again; click "Cancel" → changes discarded

### Approve toggle
- [ ] Click "Approve" on a card → button changes to "Unapprove"; approval count updates (e.g. 1/4)
- [ ] Click "Unapprove" → approval count decreases

### Approve All
- [ ] Click "Approve All" → all cards approved; count shows 4/4; button becomes "Unapprove All"
- [ ] Click "Unapprove All" → all unapproved

### Publish
- [ ] Approve all issues (4/4 Approved)
- [ ] "Publish" button becomes enabled
- [ ] Click "Publish" → right panel shows "Publishing issues..." (loading)
- [ ] After success: green banner "Successfully published X issues to Project ABC"
- [ ] Published issues list with "PUBLISHED" tag; Edit and "Project Backlog" on each card
- [ ] Stepper shows step 05 active

### Publish error (optional)
- [ ] In mockApi, temporarily force publish error (e.g. `forceError: true`) and retry publish
- [ ] Publish error banner appears with "Retry Publish"; issues remain visible

---

## Responsive checks

### Desktop 1440×900
- [ ] Open DevTools (F12) → Toggle device toolbar (Ctrl+Shift+M / Cmd+Shift+M)
- [ ] Set dimensions to 1440×900 (custom size)
- [ ] Two-column layout: spec left, tasks right
- [ ] No horizontal scroll
- [ ] Buttons and text readable

### Mobile 390×844
- [ ] In DevTools device toolbar, select "iPhone 14" or set 390×844
- [ ] Single-column layout: spec on top, tasks below
- [ ] No horizontal scroll
- [ ] Buttons stack/wrap; min tap size comfortable
- [ ] Spec text scrolls inside panel

---

## Accessibility quick checks

### Keyboard / tabbing
- [ ] Tab from top → focus moves through: stepper (if interactive), upload button / Generate, panel actions, issue cards (Edit, Approve), Publish
- [ ] Focus outline visible (blue ring) on each control
- [ ] Enter/Space activates buttons
- [ ] Tab order is logical (top → bottom, left → right)

### Screen reader (optional)
- [ ] With NVDA/VoiceOver, upload file → "Upload Specification" announced
- [ ] During loading → "Analyzing specification. Please wait." announced
- [ ] On error → "Generation failed. You can retry." announced
- [ ] On publish success → "Successfully published N issues." announced

---

## Reset between takes

- [ ] Click "Upload New Spec" to return to empty state (clears tasks, spec, approvals)
- [ ] Refresh page if testing localStorage restore
