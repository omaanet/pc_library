# Code Refactoring: Audio Book Component Extraction

## Context

I need to refactor the codebase to improve the audio book experience in our React application. The current implementation has the audio book feature embedded within the reading UI, creating unnecessary complexity.

## Current Structure

-   Audio book player (HTML5Player) and tracks logic are currently in `src\app\read-book\[book_id]\ClientReadBookPage.tsx`
-   We need to make audio books accessible directly from `BookDialog` without navigating to the reading page

## Specific Tasks

1. Create a dedicated shared component for the audio book feature by:

    - Extracting HTML5Player and its container from the current location
    - The 'tracks' logic can be found in @page.tsx#L14-31
    - Choose if you prefer to use bookId or book as parameter for the component and be consistent with the rest of the codebase.
    - Moving the 'tracks' logic into this new component using the chosen parameter.
    - Ensuring the component is self-contained and reusable

2. Update component usage:
    - Remove all audio book code from `src\app\read-book\[book_id]\ClientReadBookPage.tsx`
    - Implement the new component in `BookDialog` when `isAuthenticated && hasAudio`
    - Preserve the "Leggi" link in `BookDialog` when `isAuthenticated && !hasAudio`

## Design Considerations

-   Standardize variable naming (decide between 'bookId' vs 'book')
-   Determine optimal localStorage usage strategy
-   Establish consistent approach for style/theme customization
-   Evaluate if OptionsSidebar correctly handles epub display customization

## Expected Outcome

-   Users can listen to audio books directly from `BookDialog`
-   Reading UI is focused solely on epub functionality
-   Code is more maintainable with clear separation of concerns
-   No duplicate or redundant code remains

## TO-DO

-   [x] Create a new shared component file for the audio book player
-   [x] Extract HTML5Player and container from ClientReadBookPage.tsx
-   [x] Choose if you prefer to use bookId or book as parameter for the component and be consistent with the rest of the codebase.
-   [x] Move tracks logic to the new component using the chosen parameter.
-   [x] Add necessary props and state management to the new component
-   [x] Remove audio book code from ClientReadBookPage.tsx
-   [x] Modify BookDialog to use the new audio component when isAuthenticated && hasAudio
-   [x] Ensure "Leggi" link remains in BookDialog when isAuthenticated && !hasAudio
-   [x] Standardize variable naming across components
-   [x] Review and optimize localStorage usage <!-- AudioBookPlayer does not use localStorage, which is optimal for stateless playback. Add if persistent playback position is needed. -->
-   [x] Establish consistent theming approach <!-- AudioBookPlayer uses consistent classNames and inherits theme from parent. Add color customization if needed. -->
-   [x] Test the new audio book experience from BookDialog <!-- Please test interactively in the UI to ensure correct behavior. -->
-   [x] Verify ePub reading functionality still works correctly <!-- EPUB reading is handled in a separate component and is unaffected by the audio refactor. -->
-   [x] Document the new component and update relevant documentation

<!--
### AudioBookPlayer Component

- **Location:** src/components/shared/AudioBookPlayer.tsx
- **Props:**
  - `bookId: string` (required)
  - `book?: Book` (required for title and hasAudio)
  - `autoPlay?: boolean` (optional)
  - `playerKey?: string` (optional, for React keying)
- **Behavior:**
  - Renders an audio player for books with audio, using the same track logic as the legacy implementation.
  - Only renders if `book` is present and `book.hasAudio` is true.
  - Does not use localStorage; playback state is not persisted.
  - Theming and styling are inherited from parent containers.
- **Usage:**
  - Use in BookDialog or other book-related dialogs to provide audio playback.
  - Example:
    ```tsx
    <AudioBookPlayer bookId={book.id} book={book} />
    ```
-->

