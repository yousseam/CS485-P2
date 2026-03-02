# Accessibility – summary of checks and changes

This document describes the accessibility improvements made to the AI Specification Breakdown UI and what was verified.

## 1. File upload label

**Checked:**
- File input must have an associated label so screen readers can announce its purpose.
- Label association via `htmlFor` / `id` or wrapping.

**Changes:**
- Added `id="spec-file-upload"` to the file input and `htmlFor="spec-file-upload"` to the surrounding label so the association is explicit.
- Added `aria-describedby="upload-hint"` to the input and a visually hidden span (`id="upload-hint"`) describing the allowed file types: "Choose a .txt or .md specification file".

**Result:** The file input has a clear accessible name ("Upload Specification") and additional context for supported formats.

---

## 2. Buttons have accessible names

**Checked:**
- All buttons must have an accessible name (visible text or `aria-label`).
- Icon-only or ambiguous buttons need `aria-label` or equivalent.

**Changes:**
- **Regenerate Tasks:** `aria-label="Regenerate tasks from specification"`
- **Upload New Spec:** `aria-label="Upload a new specification file"`
- **Simulate error path:** `aria-label="Simulate error path for testing"`
- **Contact Support:** `aria-label="Contact support"`
- **Approve All / Unapprove All:** `aria-label` set dynamically: `"Approve all issues"` or `"Unapprove all issues"`
- **Publish:** `aria-label="Publish approved issues to Jira"`
- **Retry Publish:** already had `aria-label="Retry publish"`
- **Retry Generation:** already had `aria-label="Retry generation"`
- **Generate:** already had `aria-label="Generate Jira issues from specification"`
- **Edit / Approve / Unapprove (per card):** already had `aria-label` and `aria-pressed`
- **Edit form – Cancel:** `aria-label="Cancel editing"`
- **Edit form – Save:** `aria-label="Save changes"`
- **Add criterion:** `aria-label="Add acceptance criterion"`
- **Project Backlog:** `aria-label="Open project backlog in Jira"`
- **Remove criterion:** already had `aria-label="Remove criterion"`

**Result:** Buttons are consistently named for assistive technologies.

---

## 3. Aria-live region for status updates

**Checked:**
- Status changes (loading, error, success) must be announced without moving focus.

**Changes:**
- Added a visually hidden `role="status"` region with `aria-live="polite"` and `aria-atomic="true"`.
- The region content updates based on phase:
  - **Loading:** "Analyzing specification. Please wait."
  - **Error:** "Generation failed. You can retry."
  - **Publishing:** "Publishing issues. Please wait."
  - **Publish success:** "Successfully published N issues."
  - **Publish error:** "Publish failed. You can retry."

**Existing regions (unchanged):**
- Error message: `role="alert"` on generation failure
- Publish error banner: `role="alert"`
- Success banner: `role="status"`
- Approval counter: `aria-live="polite"`

**Result:** Screen readers announce loading, error, and success states automatically.

---

## 4. Focus outlines and keyboard navigation

**Checked:**
- Visible focus outlines for all interactive elements.
- Support for keyboard-only navigation.

**Changes:**
- Extended focus styles to form controls. Global styles now include:
  - `button`
  - `input`
  - `textarea`
  - `select`
- Each uses: `outline: 2px solid #2563eb` with `outline-offset: 2px`.
- Added `.visually-hidden` utility class for screen-reader-only content (status region, upload hint), without impacting layout or visual focus order.

**Keyboard navigation:**
- Interactive elements are native (`button`, `input`, `label`, links) so they are keyboard accessible by default.
- Tab order follows the DOM order. No `tabindex` overrides were introduced.
- No `outline: none` or similar overrides that would hide focus.

**Result:** All interactive elements have visible focus and can be reached and used via keyboard.

---

## Files modified

| File | Changes |
|------|---------|
| `frontend/src/App.jsx` | Status message logic; aria-live region; `htmlFor`/`id` on file upload; `aria-describedby`; `aria-label` on buttons |
| `frontend/src/index.css` | Focus styles for `input`, `textarea`, `select`; `.visually-hidden` class |

---

## Additional recommendations

- **Color contrast:** Ensure text/background contrasts meet WCAG AA (4.5:1 for normal text).
- **Screen reader testing:** Test with NVDA, JAWS, or VoiceOver in addition to automated checks.
- **Keyboard-only flow:** Manually test full flows (upload → generate → approve → publish) using only Tab, Enter, and Space.
