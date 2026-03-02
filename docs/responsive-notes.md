# Responsive layout – behavior and breakpoints

This document describes how the AI Specification Breakdown UI adapts to viewport width and how horizontal scrolling is avoided.

## Breakpoints

| Breakpoint | Viewport | Layout |
|------------|----------|--------|
| **Mobile** | ≤ 480px | Single column, spec panel first, tasks panel below. Tighter padding and touch-friendly controls. |
| **Tablet / narrow desktop** | 481px – 1023px | Single column, same order (spec first, then tasks). Standard padding. |
| **Desktop** | ≥ 1024px | Two columns: specification on the left, suggested Jira issues on the right. |

## Behavior by breakpoint

### Desktop (≥ 1024px)

- **Layout:** Two-column grid; left column = “Uploaded Specification” (or upload zone), right column = “Suggested Jira Issues” (or empty/loading/error/success).
- **Spacing:** Main content padding 1.5rem, gap between columns 1.5rem.
- **Header:** Standard padding (1.25rem 1.5rem 1rem).
- **Max width:** Content area is capped at 1400px and centered.

### Tablet / narrow desktop (481px – 1023px)

- **Layout:** Single column; panels stack vertically in DOM order (spec first, tasks second).
- **Spacing:** Main padding 1rem, gap between stacked panels 1rem.
- **Header:** Slightly reduced padding on smaller widths within this range.

### Mobile (≤ 480px)

- **Layout:** Single column, spec first, tasks below (same as tablet).
- **Spacing:** Reduced main padding (0.75rem) and gap (0.75rem) to use space and avoid overflow.
- **Header:** Smaller title (1.35rem) and subtitle (0.875rem); header padding 0.75rem.
- **Panels:** Padding 1rem; minimum height 240px so content remains usable.
- **Buttons:** Minimum size 44×44px for touch targets; button groups wrap so all actions stay usable.
- **Spec content:** Spec text area has a max-height (280px) and scrolls vertically; text uses `word-break: break-word` to avoid long words causing horizontal overflow.
- **Issue cards:** Titles and descriptions use `word-break: break-word` to prevent horizontal scrolling.

## Avoiding horizontal scrolling

- **Root and body:** `overflow-x: hidden` on `.app` and `body` so the page does not scroll horizontally.
- **Grid:** `.app-main` and `.panel` use `min-width: 0` so grid/flex children can shrink and do not force overflow.
- **Text:** Long words and URLs in spec text, issue titles, and descriptions break with `word-break: break-word` on small viewports (≤ 480px).
- **Actions:** Button containers (e.g. panel actions, issue card actions, error actions) use `flex-wrap: wrap` so buttons wrap instead of overflowing.

## File references

- Layout and breakpoints: `frontend/src/App.css` (`.app`, `.app-main`, `.panel`, and `@media` blocks).
- Global overflow: `frontend/src/index.css` (`body`).
