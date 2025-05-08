Okay, here is the detailed technical documentation blueprint based on the provided codebase.

---

# Technical Documentation Blueprint

## Introduction

This document serves as the authoritative technical guide for developing features within this project. It outlines the core technologies, architectural patterns, implementation guidelines, and best practices established in the current codebase. Adhering to this blueprint ensures consistency, maintainability, and efficient development. All developers and automation tools should use this document as a foundation.

## 1. Project Tech Stack

The project is built using the following technologies:

-   **Frontend Framework:** Next.js 15 (App Router) with React 19
-   **Language:** TypeScript
-   **UI Components:** Shadcn UI built on Radix UI primitives
-   **Styling:** Tailwind CSS
    -   Configuration: `tailwind.config.ts`
    -   Global Styles: `src/app/globals.css` (via `src/styles/globals.css` import) & `src/app/globals.cs_s` (likely a typo, standard is `globals.css`)
    -   Utility: `clsx` and `tailwind-merge` via `src/lib/utils.ts` (`cn` function)
-   **State Management:** React Context API
    -   Auth State: `src/context/auth-context.tsx` (`useAuth`)
    -   Library State: `src/context/library-context.tsx` (`useLibrary`)
-   **Backend/API:** Next.js API Route Handlers (`src/app/api/.../route.ts`)
-   **Database:** SQLite
    -   File: `db/books.db3` (as per `.windsurfrules`)
    -   Schema: `db/schema.sql`
    -   Driver: `better-sqlite3`
    -   DB Access Layer: `src/lib/db.ts` (for books), `src/lib/user-db.ts` (for users)
-   **Image Optimization:**
    -   Runtime Resizing/Placeholders: `src/app/api/covers/[...params]/route.ts` using `sharp`
    -   Utility: `src/lib/image-utils.ts`
-   **EPUB Reading:** `epubjs` and `react-reader`
    -   Viewer Component: `src/app/read-book/[book_id]/EPUBViewer.tsx`
-   **Audio Playback:** Standard HTML5 Audio & potentially Mux ( `MuxPlayer` is imported in `src/app/page.tsx` but `HTML5Player.tsx` is also present)
    -   Component: `src/components/HTML5Player.tsx`
-   **Forms:** React Hook Form (`react-hook-form`) with Zod (`zod`) for validation
    -   Example: `src/components/temp/books/book-form.tsx`
-   **Linting:** ESLint (`.eslintrc.json`)
-   **Formatting:** Prettier (`.prettierrc`)
-   **Email:** Nodemailer (`src/lib/mailer.ts`)
-   **Middleware:** Next.js Middleware (`src/middleware.ts`) for routing rules and potentially auth checks.

## 2. API Integration Guide

### API Structure

The backend API is built using Next.js Route Handlers located within the `src/app/api/` directory. Each API endpoint is defined by a `route.ts` file within a directory structure that mirrors the desired URL path.

-   **Location:** `src/app/api/`
-   **Pattern:** `src/app/api/path/to/endpoint/[dynamic_param]/route.ts`
-   **Request/Response:** Uses standard `Request` and `NextResponse` objects.

### Key API Endpoints

-   `src/app/api/books/route.ts`:
    -   `GET`: Fetches a list of books (potentially paginated/filtered). `getAllBooksOptimized` from `src/lib/db.ts`.
    -   `POST`: Creates a new book. `createBook` from `src/lib/db.ts`.
-   `src/app/api/books/[id]/route.ts`:
    -   `GET`: Fetches a single book by ID. `getBookById` from `src/lib/db.ts`.
    -   `PUT`: Updates a book by ID. `updateBook` from `src/lib/db.ts`.
    -   `DELETE`: Deletes a book by ID. `deleteBook` from `src/lib/db.ts`.
-   `src/app/api/audiobooks/[book_id]/route.ts`:
    -   `GET`: Fetches audiobook details for a specific book ID. Uses `audiobooksService` (`src/lib/services/audiobooks-service.ts`).
    -   `POST`: Saves/updates audiobook details. Uses `audiobooksService`.
-   `src/app/api/auth/register/route.ts`: Handles user registration. Uses `userExists`, `createUser` from `src/lib/user-db.ts` and `getMailer` from `src/lib/mailer.ts`.
-   `src/app/api/auth/activate/route.ts`: Handles user account activation via token. Uses `findUserByVerificationToken`, `activateUser` from `src/lib/user-db.ts`.
-   `src/app/api/auth/login/route.ts`: Handles user login. Uses `validateUserCredentials` from `src/lib/user-db.ts`.
-   `src/app/api/auth/logout/route.ts`: Handles user logout (likely clears session cookie).
-   `src/app/api/auth/session/route.ts`: Fetches the current user session details. Uses `getUserById` from `src/lib/user-db.ts`.
-   `src/app/api/user/preferences/route.ts`:
    -   `GET`: Fetches user preferences.
    -   `PATCH`: Updates user preferences.
-   `src/app/api/covers/[...params]/route.ts`: Dynamically generates/resizes cover images or placeholders using `sharp`.
-   `src/app/api/epub/[book_id]/route.ts`: Serves EPUB file content (seems basic, might need review for security/efficiency).
-   `src/app/api/placeholder/[width]/[height]/route.ts`: Generates simple SVG placeholder images (may be partially superseded by the `/api/covers` endpoint).

### Making API Calls

**Shared Fetch Utility:** There is currently no dedicated shared fetch utility function used across the frontend. API calls are typically made directly using the standard `fetch` API within components or hooks.

**Calling APIs from Client Components:**

Use standard `fetch` within `useEffect` or event handlers. Manage loading and error states using `useState`. Use the `useToast` hook for user feedback.

```typescript
// Example within a client component (e.g., inside a settings page)
'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import type { UserPreferences } from '@/types'; // Assuming types are correctly defined

function UpdatePreferencesButton() {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleUpdate = async (newPrefs: Partial<UserPreferences>) => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/user/preferences', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newPrefs),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Failed to update preferences');
            }

            const data = await response.json();
            toast({ title: 'Success', description: 'Preferences updated successfully.' });
            // Optionally update local state based on response data
        } catch (error) {
            console.error('Error updating preferences:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error instanceof Error ? error.message : 'An unknown error occurred.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    // ... JSX to trigger handleUpdate with some preference data
    return (
        <button onClick={() => handleUpdate({ theme: 'dark' })} disabled={isLoading}>
            Update
        </button>
    );
}
```

**Calling APIs from Server Components:**

Server Components should **not** typically call their own internal API routes using `fetch`. Instead, they should directly import and call the underlying server-side functions (e.g., database access functions from `src/lib/db.ts`). Calling external APIs using `fetch` is acceptable.

```typescript
// Example within a Server Component (e.g., a page displaying books)
import { getAllBooksOptimized } from '@/lib/db'; // Direct import
import { BookCollection } from '@/components/books/book-collection'; // Assuming BookCollection can handle the data

export default async function BooksPage() {
    // Direct data fetching, no fetch('/api/books') needed
    let booksData;
    let error = null;
    try {
        // Pass appropriate options if needed
        booksData = await getAllBooksOptimized({ displayPreviews: 10 });
    } catch (e) {
        console.error('Failed to fetch books:', e);
        error = 'Could not load books at this time.';
        booksData = { data: [], pagination: { total: 0, page: 1, perPage: 10, totalPages: 0 } }; // Provide default structure on error
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    // Pass the fetched data directly to a client or server component
    // Note: BookCollection appears to be a client component making its own fetch calls.
    // This example shows how a *server* component *would* fetch data.
    // You might need a different display component here or adapt BookCollection.
    // return <DisplayBooksComponent books={booksData.data} />;

    // If BookCollection *must* be used and fetches its own data, the server fetch here might be redundant
    // unless used for SSR/initial data. This indicates a potential area for refactoring.
    // For now, assuming we need a wrapper or different component for direct server data:
    return (
        <div>
            <h1>Books</h1>
            {/* Render the fetched books using a suitable component */}
            <ul>
                {booksData.data.map((book) => (
                    <li key={book.id}>{book.title}</li>
                ))}
            </ul>
        </div>
    );
}
```

**Handling Success and Error States:**

-   Use `try...catch` blocks for asynchronous operations.
-   Check `response.ok` after `fetch`.
-   Parse JSON error messages if available (`await response.json()`).
-   Update loading states using `finally`.
-   Use `useToast` (imported from `@/components/ui/use-toast`) for user-visible success or error messages in client components. Use `variant: 'destructive'` for errors.
-   Log errors to the console for debugging.

## 3. Implementation Guidelines

### Code Patterns & File Structure

-   **Routing:** Use the Next.js App Router convention (`src/app/page.tsx`, `src/app/layout.tsx`, `src/app/loading.tsx`, `src/app/error.tsx`, `src/app/not-found.tsx`, `src/app/route-name/page.tsx`).
-   **Components:**
    -   **UI Primitives:** Located in `src/components/ui/`. These are generally Shadcn UI components. Use them whenever possible for consistency.
    -   **Feature Components:** Group components related to a specific feature in subdirectories within `src/components/`. Examples: `src/components/books/`, `src/components/auth/`, `src/components/settings/`.
    -   **Layout Components:** Place global layout components like navigation in `src/components/layout/`. Example: `src/components/layout/root-nav.tsx`.
    -   **Shared Components:** Place components reusable across different features in `src/components/shared/`. Example: `src/components/shared/view-switcher.tsx`.
    -   **Temporary/Admin Components:** Place components used for temporary features or internal admin tasks in `src/components/temp/`. Example: `src/components/temp/books/`.
-   **Hooks:** Place reusable React hooks in `src/hooks/`. Categorize if needed (e.g., `src/hooks/temp/`).
-   **Utilities:** Place general utility functions in `src/lib/`. Examples: `src/lib/utils.ts`, `src/lib/image-utils.ts`.
-   **Context (State Management):** Define React contexts in `src/context/`. Examples: `src/context/auth-context.tsx`, `src/context/library-context.tsx`.
-   **Types:** Define shared TypeScript types in `src/types/`. Main types in `index.ts` or `index.d.ts`, context-specific types in `context.d.ts`, image types in `images.ts`.
-   **API Routes:** Place API Route Handlers in `src/app/api/`.
-   **Database:** Schema in `db/schema.sql`. Database access logic in `src/lib/db.ts` and `src/lib/user-db.ts`. Service layers like `src/lib/services/audiobooks-service.ts` can encapsulate specific data logic.
-   **Public Assets:** Static assets like SVGs are in `public/`.

### Standard Reusable Utilities/Hooks/Components

-   **Utilities (`src/lib/utils.ts`):**
    -   `cn(...inputs: ClassValue[])`: Merges Tailwind classes, handling conflicts and conditional classes. **Use this for all component styling.**
        ```typescript
        import { cn } from '@/lib/utils';
        // Usage: <div className={cn("p-4", isActive && "bg-blue-100", className)}>...</div>
        ```
    -   `formatDate(input: string | number | Date): string`: Formats dates consistently.
    -   `formatAudioLength(seconds: number): string`: Formats audio duration in HH:MM:SS or MM:SS.
-   **Image Utilities (`src/lib/image-utils.ts`):**
    -   `getCoverImageUrl(imagePath: string, viewType: keyof typeof DEFAULT_COVER_SIZES, options?: CoverImageOptions): string`: Generates the correct URL for book covers, pointing to the `/api/covers` endpoint for resizing or placeholders.
        ```typescript
        import { getCoverImageUrl } from '@/lib/image-utils';
        // Usage: <Image src={getCoverImageUrl(book.coverImage, 'grid', { bookId: book.id })} ... />
        ```
-   **Hooks:**
    -   `useAuth` (from `@/context/auth-context`): Accesses auth state (user, loading, error, isAuthenticated) and methods (login, logout, register, updatePreferences).
    -   `useLibrary` (from `@/context/library-context`): Accesses library state (books, filters, sort, viewMode) and methods (fetchBooks, updateFilters, etc.).
    -   `useToast` (from `@/components/ui/use-toast`): Displays toast notifications.
    -   `useUserPreferences` (from `@/hooks/use-user-preferences`): Fetches and updates user preferences, syncing with `useAuth` and backend.
    -   `useBooks` (from `@/hooks/temp/use-books`): Hook specifically for the temporary book management table (`add-book` page).
    -   `useAudiobook` (from `@/hooks/use-audiobook`): Fetches and saves audiobook details.
-   **Core UI Components (`src/components/ui/`):**
    -   `Button`: Standard button component.
    -   `Input`, `Textarea`, `Switch`, `Select`, `Checkbox`: Form elements.
    -   `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`: Card layout.
    -   `Dialog`, `DialogContent`, etc.: Modal dialogs.
    -   `DropdownMenu`: Dropdown menus.
    -   `Table`, `TableHeader`, etc.: Data tables.
    -   `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`: Tabbed interfaces.
    -   `Skeleton`: Loading placeholder.
    -   `Alert`, `AlertTitle`, `AlertDescription`: Callout boxes.
    -   `Toaster`: Renders toasts generated by `useToast`. Must be included in the root layout.
-   **Core Feature Components:**
    -   `RootNav` (`@/components/layout/root-nav.tsx`): Main site navigation.
    -   `AuthModal` (`@/components/auth/auth-modal.tsx`): Combined Login/Register modal.
    -   `BookGridCard`, `BookListCard` (`@/components/books/...`): Display books in different views.
    -   `BookDialog` (`@/components/books/book-dialog.tsx`): Modal displaying book details.

### Structuring Shared Logic

-   **General Utilities:** Functions reusable across any part of the application (formatting, calculations, type guards) go in `src/lib/utils.ts` or new files within `src/lib/`.
-   **Database Interaction:** All direct SQLite queries should be encapsulated within functions in `src/lib/db.ts` (for books/general) or `src/lib/user-db.ts` (for users). Do not perform raw DB queries directly in components or API routes. For complex data logic involving multiple tables or specific business rules, consider creating dedicated services like `src/lib/services/audiobooks-service.ts`.
-   **Reusable React Logic/Data Fetching:** Encapsulate complex stateful logic, side effects, or data fetching patterns related to components into custom hooks within `src/hooks/`.
-   **Global State:** Use React Context (`src/context/`) for state that needs to be accessed by many components across different levels of the tree (e.g., authentication status, global library filters).

### State Management Approach

The application primarily uses **React Context API** for global/shared state:

-   **`AuthProvider` (`src/context/auth-context.tsx`):** Manages user authentication state (`user`, `isAuthenticated`, `isLoading`, `error`) and provides functions for `login`, `logout`, `register`, `updatePreferences`. Uses `useReducer` internally. Accessed via the `useAuth` hook.
-   **`LibraryProvider` (`src/context/library-context.tsx`):** Manages the state of the main book library view, including fetched books, loading/error states, filters, sorting, pagination, and view mode. Uses `useReducer` internally. Accessed via the `useLibrary` hook.
-   **Local State:** Standard `useState` and `useReducer` are used for component-level state.
-   **Server State Caching:** Next.js App Router handles server-side data fetching caching implicitly. Client-side caching related to API calls is handled manually within contexts or hooks if needed (e.g., refetching logic).

## 4. Authentication System Overview

### Implementation and Flow

1.  **Registration:** User provides email/full name (`src/components/auth/register-modal.tsx` or `AuthModal`). Backend (`/api/auth/register`) creates user with `is_activated = 0` and a verification token (`src/lib/user-db.ts`), then sends a verification email (`src/lib/mailer.ts`).
2.  **Activation:** User clicks link in email, hitting `/activate/[token]` (`src/app/activate/[token]/page.tsx`). This page calls the backend (`/api/auth/activate`) which verifies the token, sets `is_activated = 1`, sets a password (seems to generate one initially in the activation POST handler - `generateRandomPassword`, then sends a welcome email with it), and marks the user as active (`src/lib/user-db.ts`). _Note: The flow where the user sets their own password might be missing or handled differently._
3.  **Login:** User provides email/password (`src/components/auth/login-modal.tsx` or `AuthModal`). Backend (`/api/auth/login`) validates credentials against `password_hash` (`src/lib/user-db.ts::validateUserCredentials`). On success, a session is likely established via an HTTP-only cookie (managed by Next.js/middleware).
4.  **Session Management:**
    -   A session cookie likely stores the user ID or a session token.
    -   `src/middleware.ts` inspects requests, potentially checks for the session cookie, and redirects unauthenticated users from protected routes.
    -   Client-side, `useAuth` hook fetches session details (`/api/auth/session`) on initial load (`initializeAuth` function) to populate the context.
5.  **Logout:** User clicks logout. Frontend calls (`/api/auth/logout`) which clears the session cookie. `useAuth` hook updates state to unauthenticated.

### Key Auth Hooks and Components

-   **`useAuth` hook (`src/context/auth-context.tsx`):** The primary way to interact with auth state and functions in client components.
    -   Provides `state.user`, `state.isAuthenticated`, `state.isLoading`.
    -   Provides `login`, `logout`, `register`, `updatePreferences` functions.
-   **`AuthProvider` (`src/context/auth-context.tsx`):** Context provider wrapping the application (in `src/providers/providers.tsx`).
-   **`AuthModal` (`src/components/auth/auth-modal.tsx`):** A combined dialog for login and registration tabs. Interacts with `useAuth`.
-   **`LoginModal` / `RegisterModal` (`src/components/auth/...`):** Separate modal components (might be used by `AuthContainer` or directly).
-   **`middleware.ts` (`src/middleware.ts`):** Handles server-side route protection based on authentication status (cookie).

### Authenticating Users

-   **Client Components:** Use the `useAuth` hook.

    ```typescript
    import { useAuth } from '@/context/auth-context';

    function MyComponent() {
        const { state, login } = useAuth();

        if (state.isLoading) return <div>Loading...</div>;
        if (!state.isAuthenticated) {
            return <button onClick={() => /* trigger login modal or redirect */}>Please Log In</button>;
        }
        return <div>Welcome, {state.user?.fullName}!</div>;
    }
    ```

-   **Server Components:** Cannot use hooks. Accessing user information typically involves reading session data passed down from middleware or layout components, or potentially making server-side checks using helper functions that read request cookies/headers. _There isn't an explicit shared server-side session helper visible in `src/lib`, so rely on middleware for protection._ Data specific to the user might need to be fetched using an ID obtained server-side.
-   **API Routes:** Protect routes by verifying the session cookie or token passed with the request. This logic might reside within the route handler itself or potentially be abstracted into a higher-order function or middleware helper (currently seems implicit or handled per-route). The `/api/auth/session` route reads the cookie to get the user ID. Other protected routes would need similar logic.

### Best Practices

-   **Protecting Routes:**
    -   **Server-side:** Use `src/middleware.ts` to protect pages/routes based on the presence and validity of the session cookie. Redirect unauthenticated users.
    -   **Client-side:** Use `useAuth` hook to check `state.isAuthenticated`. Conditionally render UI elements or redirect using `useRouter` from `next/navigation`.
-   **Working with Session Data:**
    -   **Client:** Always rely on `useAuth` hook as the source of truth for user data and authentication status.
    -   **Server:** Do not assume client-side context exists. If user data is needed server-side, fetch it based on an identifier obtained securely (e.g., from a verified session cookie parsed in middleware or route).
-   **Avoid Common Mistakes:** See Section 6.

## 5. Common Pitfalls to Avoid

### Assuming Client Context on Server

-   **Incorrect:** Trying to use `useAuth` or any other React hook within Server Components or API routes.
-   **Correct:** For Server Components, pass necessary user data as props or fetch it server-side. For API routes, verify session from request headers/cookies. Use `src/middleware.ts` for route-level protection.

### Calling Internal APIs from Server Components via `fetch`

-   **Incorrect:** `fetch('/api/books')` inside a Server Component.
-   **Correct:** `import { getAllBooksOptimized } from '@/lib/db'; await getAllBooksOptimized();` inside the Server Component. Fetching is for _external_ APIs or client-side calls.

### Inconsistent Error Handling

-   **Incorrect:** Not checking `response.ok`, not using `try...catch`, inconsistent user feedback.
-   **Correct:** Implement robust `try...catch...finally` blocks, check response status, use `useToast` consistently for user feedback in client components, log detailed errors server-side or in the console.

### Ignoring File Structure Conventions

-   **Incorrect:** Placing a book-related utility function in `src/components/auth` or a UI primitive modification outside `src/components/ui`.
-   **Correct:** Follow the structure outlined in Section 3. Place files in their designated directories (`lib`, `hooks`, `components/feature`, `components/ui`, etc.).

### Direct DOM Manipulation

-   **Incorrect:** Using `document.getElementById` or similar in React components.
-   **Correct:** Use React state, refs (`useRef`), and declarative patterns.
-   **Not Using `cn` for Class Merging:**
    -   **Incorrect:** Manually concatenating strings: `className={"base " + (condition ? "active" : "")}`. This doesn't handle Tailwind conflicts well.
    -   **Correct:** `import { cn } from '@/lib/utils'; className={cn("base", condition && "active")}`.
-   **Prop Drilling:**
    -   **Incorrect:** Passing props down multiple levels of components when they aren't needed in intermediate components.
    -   **Correct:** Use React Context (`useAuth`, `useLibrary`) for globally needed state. Consider component composition or potentially Zustand/Jotai if context performance becomes an issue (though not currently used).
-   **Over-fetching or Under-abstracting Data:**
    -   **Incorrect:** Fetching an entire book object when only the title is needed. Writing complex SQL queries directly in API routes.
    -   **Correct:** Create specific data-fetching functions in `src/lib/db.ts` or services that retrieve only necessary fields. Ensure API endpoints allow filtering/selection where appropriate.

---

This blueprint provides a detailed overview of the project's technical landscape. By following these guidelines, developers can contribute effectively and maintain the integrity of the codebase. Remember to consult the specific files referenced for implementation details.
