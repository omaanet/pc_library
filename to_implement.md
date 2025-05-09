Ensure to remove all previews code

### Implementation of Zoom and Padding

Analyze and rethink the zoom and pan feature from scratch.
Make sure you remove all code that relates to zoom and panning.

Ensure this required feature works exectly as desired with keyboard, mouse and gestures.
Double-tap and double-click to reset the zoom.
Always respect the priority of navigation controls.
These enhancements maintain the clean design of the original viewer while adding the requested functionality for a more interactive, natural and user-friendly experience.

## 1. Zoom Functionality

    I've implemented three ways to zoom:

    1. **Mouse wheel zoom**:
       - Use Ctrl+mousewheel to zoom in/out
       - Zooming occurs toward the mouse cursor position for a natural experience

    2. **Touch pinch-to-zoom**:
       - Place two fingers on the screen and pinch in/out to zoom
       - The zoom is centered between your fingers

    3. **Keyboard shortcuts**:
       - Ctrl+Plus/Minus to zoom in/out (overrides browser defaults)
       - Ctrl+0 to reset to 100% (overrides browser defaults)
       - Also works with just Plus/Minus/0 without Ctrl

## 2. Drag/Pan Functionality

    Users can now reposition images in the viewer by dragging:

    1. **Mouse dragging**:
       - Click and hold on an image to grab it
       - Drag to reposition
       - Cursor changes to "grab"/"grabbing" to indicate draggable state

    2. **Touch dragging**:
       - Touch and hold to grab
       - Drag with one finger to reposition

## 3. Additional Improvements

    1. **Position memory**: The viewer remembers zoom level and pan position between page changes and when the app is reloaded
    2. **Zoom limits**: I've implemented reasonable limits (10% minimum, 500% maximum) to prevent extreme zoom states
    3. **Visual feedback**: Cursor changes provide feedback when dragging

## 4. Important Notes and Environment Context

-   **Framework**: Next.js 15
-   **Frontend**: React 19+ (using modern features, no class components)
-   **Follow the separation of concerns principle.**
-   **Target Devices**: Desktop and mobile (touch and mouse support required)
-   **Component Type**: Functional components with hooks (e.g., `useRef`, `useEffect`, do not use something like React.useEffect)
-   **AVOID**: something like React.useEffect or React.FC<CopyrightFooterProps>
-   **Zoom Area**: A specific scrollable/zoomable container (e.g., `<div>` or `<img>`)
-   **UI Framework (optional)**: If using Tailwind, Shadcn, etc., specify here
-   **Constraints**:

    -   Avoid third-party libraries unless necessary (pure React/JS preferred)
    -   Must integrate cleanly with existing navigation controls
    -   Must support SSR/CSR behavior where appropriate (i.e., avoid browser-only code in SSR)

---

This section provides everything the AI needs to:

-   Pick the right event listeners (`pointerdown`, `wheel`, `gesturechange`, etc.)
-   Avoid server-side rendering pitfalls
-   Use the latest React features correctly
-   Generate zoom logic that works well across pointer and touch events
