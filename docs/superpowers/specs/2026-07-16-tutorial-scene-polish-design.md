# Tutorial Scene Polish Design

## Goal

Make the foundation tutorial scene visually consistent with Jiuyu's existing
home and settings scenes, remove unsafe top-area overlap, and present the
tutorial before beginner in difficulty selection.

## Fixes

- Pass the explicit plaque label and style arguments so no style object is
  rendered as `[object Object]`.
- Use the same 32-pixel vertical safety offset, content width, warm background,
  rounded layers, and stacked-card treatment as the home scene.
- Replace the tutorial's hard-coded white/orange card palette with an olive-teal
  tutorial accent that remains distinct from beginner's pink-orange accent.
- Keep the existing three lessons, sequential lock state, and course hit areas.
- Put foundation before beginner in the initial difficulty choice and in the
  expanded difficulty ordering.

## Verification

- Scene tests verify safe top metrics, first-card ordering, card hit testing,
  and no object-style text is drawn.
- Full game tests verify home entry, tutorial state flow, and selection history.
