# Code Refactoring: OptionsSidebar and EPUBViewer Component Refactoring

## Context

Connect the various configuration options present in `EPUBViewer` with the component `OptionsSidebar` (used in `src\app\read-book\[book_id]\ClientReadBookPage.tsx`).

## Specific Tasks: OptionsSidebar options

1. Remove `Line Height` option.
2. Replace `Font Size` option with a control that works like the changeFontSize in `EPUBViewer` ('A-', 'A+', etc.). Add a reset to 100% button.
3. Implement `Font Family` option in `EPUBViewer`.

## Specific Tasks: EPUBViewer

If `EPUBViewer` has any configuration options missing from `OptionsSidebar`, create and implement them updating the `OptionsSidebar` component.

## General Code Guidelines and Important Considerations

-   Avoid modifying unrelated code.
-   Reuse existing utilities/components where possible.
-   Keep code simple and maintainable.
-   Ask for clarification when unsure.

## Expected Outcome

-   Code is more maintainable with clear separation of concerns
-   No duplicate or redundant code remains

## TO-DO

-   [x] **Remove 'Line Height' option** from `OptionsSidebar`

    -   [x] Identify and remove UI control and any state/effect logic.
    -   [x] Remove any corresponding props or events if present.

-   [x] **Replace 'Font Size' control** in `OptionsSidebar`

    -   [x] Remove old font size input or slider.
    -   [x] Add buttons: `A-`, `A+`, and `Reset` (use italian labels).
    -   [x] Connect these buttons to `changeFontSize` in `EPUBViewer`.
    -   [x] Ensure reset sets font size to 100%.

-   [x] **Implement 'Font Family' option** in `EPUBViewer` and `OptionsSidebar`

    -   [x] Use the existing font family dropdown/select in `OptionsSidebar` for font families (e.g., Serif, Sans-serif, Monospace).
    -   [x] Connect selection to a new function in `EPUBViewer` that changes the font family.
    -   [x] Ensure EPUB styling reflects the selected font family correctly.

-   [x] **Audit existing config options** in `EPUBViewer` vs `OptionsSidebar`

    -   [x] List all options supported by `EPUBViewer`.
    -   [x] Compare against controls present in `OptionsSidebar`.
    -   [x] For each missing config in sidebar:
        -   [x] Add UI control.
        -   [x] Connect control to corresponding `EPUBViewer` method or prop.
