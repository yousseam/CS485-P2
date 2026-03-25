/**
 * Tests for Edit Button Icon Visibility (Bug: invisible icon on unapproved issues)
 *
 * The edit-icon SVG uses stroke='currentColor', which inherits the text color
 * of its parent button. When a parent button has white text (e.g. btn-primary),
 * the icon becomes white-on-blue and invisible.
 *
 * These tests verify that the edit icon always has adequate contrast regardless
 * of the approval state of the issue.
 *
 * Run with: node --test tests/editIconVisibility.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cssContent = readFileSync(resolve(__dirname, '../src/App.css'), 'utf-8');
const jsxContent = readFileSync(resolve(__dirname, '../src/App.jsx'), 'utf-8');

describe('Edit button icon visibility', () => {

  it('edit-icon SVG should NOT use currentColor for its stroke', () => {
    // Extract the .edit-icon CSS rule's background URL
    const editIconMatch = cssContent.match(/\.edit-icon\s*\{[^}]*\}/s);
    assert.ok(editIconMatch, '.edit-icon rule should exist in App.css');

    const editIconRule = editIconMatch[0];

    // The SVG data URI uses stroke='currentColor' which inherits the parent
    // element's CSS color. On btn-primary (white text), this makes the icon
    // white and invisible against the blue background.
    // The fix should use an explicit color value instead of currentColor.
    assert.ok(
      !editIconRule.includes("stroke='currentColor'"),
      "edit-icon SVG stroke should not use 'currentColor' — it causes the icon " +
      "to be invisible when the parent button has white text (btn-primary)"
    );
  });

  it('check-icon SVG should NOT use currentColor for its stroke', () => {
    // The check-icon on the Approve/Unapprove button has the same problem:
    // when unapproved, the button is btn-primary (white text), making the
    // check icon invisible.
    const checkIconMatch = cssContent.match(/\.check-icon\s*\{[^}]*\}/s);
    assert.ok(checkIconMatch, '.check-icon rule should exist in App.css');

    const checkIconRule = checkIconMatch[0];

    assert.ok(
      !checkIconRule.includes("stroke='currentColor'"),
      "check-icon SVG stroke should not use 'currentColor' — it causes the icon " +
      "to be invisible when the parent button has white text (btn-primary)"
    );
  });

  it('edit-icon should have sufficient contrast on btn-primary background', () => {
    // btn-primary has background #2563eb and color #fff.
    // If the icon stroke uses currentColor, it inherits #fff, which is
    // invisible on #2563eb. This test checks that the SVG stroke color
    // would provide adequate contrast against #2563eb.
    const editIconMatch = cssContent.match(/\.edit-icon\s*\{[^}]*\}/s);
    assert.ok(editIconMatch, '.edit-icon rule should exist in App.css');

    const editIconRule = editIconMatch[0];

    // Extract the stroke color from the SVG data URI
    const strokeMatch = editIconRule.match(/stroke='([^']+)'/);
    assert.ok(strokeMatch, 'edit-icon SVG should have a stroke attribute');

    const strokeColor = strokeMatch[1];

    // currentColor will resolve to white (#fff) on btn-primary, which is
    // invisible against the blue background. The stroke should be an
    // explicit color that contrasts with both btn-primary and btn-secondary.
    assert.notStrictEqual(
      strokeColor,
      'currentColor',
      'edit-icon stroke must be an explicit color, not currentColor, to ensure ' +
      'visibility on both btn-primary (blue) and btn-secondary (white) backgrounds'
    );
  });

  it('Edit button icon should remain visible regardless of issue approval state', () => {
    // In the JSX, the Edit button next to the Approve button should not
    // rely on a styling approach that yields invisible icons.
    //
    // Currently, the edit-icon span inherits color from its parent button
    // via currentColor. If the parent ever has color: #fff, the icon
    // becomes invisible.
    //
    // Verify that either:
    // a) The edit-icon CSS does NOT use currentColor, OR
    // b) The Edit button always uses a class with dark text color

    const editIconMatch = cssContent.match(/\.edit-icon\s*\{[^}]*\}/s);
    assert.ok(editIconMatch, '.edit-icon rule should exist');

    const usesCurrentColor = editIconMatch[0].includes("currentColor");

    if (usesCurrentColor) {
      // If using currentColor, the edit button must NEVER be inside a
      // btn-primary (which has color: #fff). Check JSX to ensure the
      // edit button only uses btn-secondary or similar dark-text class.
      //
      // Also verify the Approve button's check-icon doesn't have the
      // same problem.
      const checkIconMatch = cssContent.match(/\.check-icon\s*\{[^}]*\}/s);
      const checkUsesCurrentColor = checkIconMatch && checkIconMatch[0].includes("currentColor");

      // The approve button toggles between btn-primary and btn-secondary.
      // If check-icon uses currentColor, it will be invisible on btn-primary.
      const approveButtonToggle = jsxContent.includes("btn-primary") &&
                                   jsxContent.includes("btn-secondary");

      assert.ok(
        !(checkUsesCurrentColor && approveButtonToggle),
        'Icons using currentColor must not be placed in buttons that toggle to ' +
        'btn-primary (white text), as the icon becomes invisible. ' +
        'Use an explicit stroke color in the SVG instead.'
      );
    }
  });

  it('btn-icon elements inside btn-primary should have visible icon color', () => {
    // This test checks that the CSS provides an override for .btn-icon
    // elements inside .btn-primary so that the icon is visible.
    //
    // A proper fix could be:
    //   .btn-primary .btn-icon { filter: ... } or explicit SVG colors
    //
    // Currently, no such override exists, and currentColor makes icons
    // white (invisible) on btn-primary's blue background.

    // Check if there's a CSS rule that provides visibility for icons in btn-primary
    const hasBtnPrimaryIconOverride =
      cssContent.includes('.btn-primary .btn-icon') ||
      cssContent.includes('.btn-primary .edit-icon') ||
      cssContent.includes('.btn-primary .check-icon');

    // If icons use currentColor, there MUST be an override for btn-primary
    const iconsUseCurrentColor = cssContent.match(/\.(edit-icon|check-icon)\s*\{[^}]*currentColor[^}]*\}/s);

    if (iconsUseCurrentColor) {
      assert.ok(
        hasBtnPrimaryIconOverride,
        'When icon SVGs use currentColor, a CSS override must exist for ' +
        '.btn-primary .btn-icon to ensure icon visibility on blue backgrounds. ' +
        'No such override was found.'
      );
    } else {
      // Icons don't use currentColor — this is fine, they have explicit colors
      assert.ok(true);
    }
  });
});
