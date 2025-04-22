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
