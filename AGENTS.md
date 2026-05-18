# AGENTS.md

This file provides guidance to Codex when working in this repository. Keep it aligned with the actual codebase, not older product assumptions.

## Development Commands

This project uses `pnpm`, not `npm`.

```bash
pnpm dev              # Next.js dev server with Turbopack on port 3005
pnpm dev2             # Next.js dev server without Turbopack on port 3005
pnpm devENV           # Dev server with scripts/check-env.js preloaded
pnpm build            # Production build
pnpm start            # Production server on port 3006
pnpm lint             # ESLint via eslint.config.cjs
pnpm check-env        # Print selected env vars at startup
pnpm knip:json        # Write reports/knip.json
pnpm knip:md          # Write reports/knip.md
pnpm knip:compact     # Print compact knip report
pnpm knip:all         # Run all knip reports
pnpm knip:timestamped # Generate timestamped knip reports
```

## Core Stack

- Framework: Next.js `16.2.6` + React `19.2.0`
- Language: TypeScript `5.9.3`
- Database: Neon PostgreSQL via direct SQL, no ORM
- Styling: Tailwind CSS `3.4.18`, shadcn/ui, Radix UI, `next-themes`
- State: React Context, TanStack Query `5.90.5`, Zustand `5.0.9`
- Charts/UI: Recharts, Lucide React
- Media: custom HTML5 audio player, Mux player dependency, Sharp for cover resizing
- Email: Nodemailer `8.0.7`

## Architecture Overview

### App Router Surface

The live app pages under `src/app/` are:

- `/` home page with the public library and previews
- `/add-book` admin book management UI
- `/animations-manager` admin animation management UI
- `/read-book/[book_id]` image-based reader
- `/settings` user preferences UI
- `/user-statistics` admin analytics dashboard

Authentication is modal-driven from the client. The proxy still treats `/login` and `/register` as auth routes, but there are no dedicated page files for them in `src/app/`.

### Database Layer

- Main Neon client: `src/lib/db/client.ts`
- DB exports barrel: `src/lib/db/index.ts`
- Query helpers: `src/lib/db/utils.ts`
- Transaction helper: `src/lib/db/transaction.ts`
- Domain queries:
  - `src/lib/db/queries/books.ts`
  - `src/lib/db/queries/audiobooks.ts`
- Legacy/auth-related user access: `src/lib/user-db.ts`

The code expects Neon query results to sometimes be arrays and sometimes row objects. Use `getFirstRow()` and `extractRows()` instead of assuming a single shape.

Use parameterized SQL only. Dynamic sort clauses must stay whitelist-based, as in `getAllBooksOptimized()`.

### Authentication

The current auth flow is passwordless and session-based.

- Client auth state: `src/context/auth-context.tsx`
- Session helper: `src/lib/auth-utils.ts`
- Admin gate: `src/lib/admin-auth.ts`
- Session cookie:
  - name: `session`
  - format: base64-encoded JSON
  - shape: `{ userId, expires }`
- Session duration: `SESSION_DURATION.AUTH` in `src/config/auth-config.ts` currently `3 hours`

Current behavior:

- Registration requires `email` and `fullName`
- Registration immediately creates an activated user and sets a session cookie
- Login requires email only
- Logout clears the session
- Middleware protects `/profile`, `/settings`, `/read-book`, and `/add-book`

Do not assume the old password-hash or email-verification flow is active. `src/lib/user-db.ts` currently inserts users with `password_hash = NULL`, `verification_token = NULL`, and `is_activated = true`.

### CSRF

State-changing authenticated requests use a lightweight CSRF token flow.

- Token endpoint: `src/app/api/csrf-token/route.ts`
- Validation wrapper: `src/lib/csrf-middleware`
- Token utilities: `src/lib/csrf.ts`

Notes:

- The client auth context caches the CSRF token and adds it on `POST`/`PUT`/`DELETE`/`PATCH`
- `/api/auth/login`, `/api/auth/register`, and `/api/auth/logout` are exempted from CSRF validation
- Current validation is intentionally minimal: token presence plus length check

### State Management

The app uses multiple state layers:

- `AuthProvider` in `src/context/auth-context.tsx` for session/user state
- `LibraryProvider` in `src/context/library-context.tsx` for library filters, sorting, view mode, and selected book
- TanStack Query via `src/providers/query-provider.tsx` for server data fetching
- Zustand store in `src/stores/preferences-store.ts` for reader preferences persisted in `localStorage`

`src/providers/providers.tsx` wires `QueryProvider`, `ThemeProvider`, `AuthProvider`, and `LibraryProvider`.

### Books and Audiobooks

Book flow:

1. Queries live in `src/lib/db/queries/books.ts`
2. API handlers live in `src/app/api/books/`
3. Client hooks live in `src/hooks/` and `src/hooks/admin/`
4. UI lives in `src/components/books/` and `src/components/admin/books/`

Current book model includes fields such as:

- `title`, `summary`, `extract`
- `coverImage`
- `publishingDate`
- `hasAudio`, `audioLength`
- `rating`
- `isPreview`, `previewPlacement`
- `displayOrder`, `isVisible`
- `pagesCount`
- `mediaId`, `mediaTitle`, `mediaUid`
- nested `audiobook.mediaId` in some UI/API flows

Sorting/filtering behavior in `getAllBooksOptimized()`:

- supports search, audio filter, preview filter, visibility filter, paging
- validates sortable columns against a whitelist
- prefixes sort order with a “new book” badge priority derived from `SITE_CONFIG.BOOK_BADGES.NEW_DAYS`
- uses `SITE_CONFIG.DEFAULT_SORT` when no explicit sort is provided

Admin mutations to books require `requireAdmin()`. `POST /api/books` is wrapped with CSRF protection; `PUT` and `DELETE` on `/api/books/[id]` require admin but are not currently wrapped by `withCSRFProtection`.

### Reader

The reader under `src/app/read-book/[book_id]/` is image-based, not EPUB-based.

- Main page: `page.tsx`
- Client shell: `ClientReadBookPage.tsx`
- Reader component: `PageReader.tsx`
- Reading progress hook: `useReadingProgress.ts`
- Theme hook: `useReaderTheme.ts`

Current reader preferences persisted with Zustand:

- `viewMode`: `single` or `double`
- `zoomLevel`

The reader loads page images from Wasabi S3 and the download endpoint serves PDFs from the same CDN family.

## API Route Map

Current `src/app/api/` structure includes:

- `auth/login` `POST`
- `auth/logout` `POST`
- `auth/register` `POST`
- `auth/session` `GET`
- `books` `GET`, `POST`
- `books/[id]` `GET`, `PUT`, `DELETE`
- `books/[id]/comments` `GET`, `POST`
- `books/[id]/replies` `GET`
- `audiobooks/[book_id]` `GET`, `POST`
- `covers/[...params]` `GET`
- `csrf-token` `GET`
- `download-book/[book_id]` `GET`
- `placeholder/[width]/[height]` `GET`
- `request-book/[book_id]` `POST`
- `statistics/downloads` `GET`
- `statistics/errors` `GET`
- `statistics/popular-books` `GET`
- `statistics/reading-sessions` `GET`
- `statistics/user-activity` `GET`
- `system/log` `POST`
- `user/preferences` `GET`, `PATCH`
- `users` `GET`

Important behavior:

- `users` and all `statistics/*` endpoints are admin-only
- `download-book/[book_id]` requires an authenticated session and logs successful and failed downloads to `system_logs`
- `request-book/[book_id]` sends an email to `SITE_CONFIG.CONTACT_EMAIL`
- `user/preferences` is currently stubbed and returns merged in-memory defaults rather than writing to the database

## Middleware and Security

`src/proxy.ts` currently does three things:

- validates the session cookie for protected routes
- redirects authenticated users away from `/login` and `/register`
- validates `/api/covers/...` width/height/path inputs

It also adds broad security headers and a CSP for non-cover requests. `next.config.ts` separately adds headers for `/api/covers/:path*`.

`next.config.ts` currently:

- disables built-in Next image optimization with `unoptimized: true`
- allows SVG images
- removes only `console.log` in production builds
- adds cover-route security headers

## Config Files

- `src/config/auth-config.ts`: auth session duration only
- `src/config/site-config.ts`: contact email, pagination, preview constants, default sort, metadata, statistics IP filtering
- `src/config/fonts.ts`: font classes used in the UI
- `tailwind.config.ts`: active Tailwind config

There is also an older `tailwind.config.js` in the repo. Treat `tailwind.config.ts` as the primary config unless the code is explicitly using the JS file.

## Types and Conventions

Primary type locations:

- `src/types/index.ts`
- `src/types/api.ts`
- `src/types/context.d.ts`
- `src/types/database.ts`
- `src/lib/db/types.ts`

Conventions:

- database columns are snake_case
- app-level TypeScript properties are usually camelCase
- SQL queries often alias DB columns into camelCase response fields

Be careful with boolean-ish DB values. Some queries still convert numeric `0`/`1` values into booleans at the application boundary.

## Language and Content

The user-facing product is primarily Italian, but some admin UI text is still English. Prefer preserving the existing language of the area you are editing instead of “fixing” the whole app opportunistically.

For public-facing UI, API messages, and email content, default to Italian unless the surrounding feature is already intentionally bilingual.

## Environment Variables

Variables referenced by the current codebase include:

- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL`
- `MAIL_HOST`
- `MAIL_PORT`
- `MAIL_SECURE`
- `MAIL_USER`
- `MAIL_PASSWORD`
- `MAIL_FROM`

Notes:

- `DATABASE_URL` is required for the DB client and DB scripts
- `NEXT_PUBLIC_APP_URL` is still referenced by `src/lib/mailer.ts`
- `scripts/check-env.js` logs `DATABASE_URL` and `MAIL_USER`; it does not validate a schema

## Common Gotchas

- Use `Get-Content -LiteralPath ...` in PowerShell for files under `[param]` route folders.
- Do not reintroduce the old activate-email flow unless the code is being intentionally redesigned.
- `src/app/api/user/preferences/route.ts` is a placeholder implementation, so DB-backed preference changes need new persistence work.
- `src/app/add-book/page.tsx` and parts of the admin UI still contain English copy; keep changes localized.
- The statistics endpoints depend on `system_logs` and on `SITE_CONFIG.AVOID_LOCAL_ADDRESS_POLLUTION`.
- The proxy matcher excludes `_next/static`, `_next/image`, and `favicon.ico`, but otherwise runs broadly.
