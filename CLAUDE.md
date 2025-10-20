# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Primary development server:**
```bash
pnpm dev        # Next.js dev server with Turbopack on port 3005
pnpm dev2       # Next.js dev server without Turbopack on port 3005
pnpm devENV     # Dev server with environment variable validation
```

**Build and deployment:**
```bash
pnpm build         # Production build (can use --turbo for beta Turbopack builds)
pnpm start         # Start production server on port 3006
pnpm lint          # ESLint code quality checks (next lint deprecated in 15.5+)
pnpm check-env     # Validate environment variables
```

**Note:** This project uses **pnpm**, not npm. Always use pnpm for package management.

## Core Technology Stack

- **Framework:** Next.js 15.5.6 with React 19.2.0 (stable) and Turbopack
- **Database:** Neon PostgreSQL (serverless) with direct SQL queries
- **Styling:** Tailwind CSS 3.4.18 + shadcn/ui + Radix UI primitives
- **State Management:** React Context + TanStack Query (React Query v5.90.5)
- **Forms:** React Hook Form 7.65.0 + Zod 3.24.4 validation
- **Media:** Mux player for audiobooks, Sharp 0.33.5 for image optimization
- **Email:** Nodemailer 6.10.1
- **TypeScript:** 5.9.3

## Architecture Overview

### Database Layer Architecture

**No ORM - Direct SQL approach:**
- Singleton Neon client in `src/lib/db/client.ts` via `getNeonClient()`
- Query utilities in `src/lib/db/utils.ts`: `getFirstRow()`, `extractRows()`
- Database operations organized in `src/lib/db/queries/` by domain (books, audiobooks)
- Legacy user operations in `src/lib/user-db.ts`

**Response format handling:**
Neon client returns arrays directly (not `{rows: [...]}` objects). All database utilities handle both formats for compatibility.

**Query patterns:**
```typescript
const client = getNeonClient();
const result = await client.query('SELECT * FROM books WHERE id = $1', [id]);
const book = getFirstRow<Book>(result);  // Handles both array and object responses
```

### Authentication Architecture

**Custom session-based auth (no JWT library):**
- Context provider: `src/context/auth-context.tsx`
- Session storage: Base64-encoded JSON in HTTP-only cookies
- Session structure: `{userId: string, expires: string}`
- Password hashing: SHA256 + salt (not bcrypt) in `src/lib/user-db.ts`

**Two authentication flows:**
- `USE_NEW_AUTH_FLOW = true`: Immediate login after registration (3-hour sessions)
- `USE_NEW_AUTH_FLOW = false`: Email verification required (7-day sessions)
- Configuration in `src/config/auth-config.ts`

**Middleware protection:**
- `src/middleware.ts` validates sessions and protects routes
- Protected routes: `/profile`, `/settings`, `/read-book`
- Auth routes: `/login`, `/register`, `/activate`
- Session validation includes base64 decoding, JSON parsing, and expiration checks

### API Route Organization

**Structure:**
```
src/app/api/
├── auth/                    # Authentication endpoints
│   ├── register/           # POST - Create new user
│   ├── login/              # POST - User login
│   ├── logout/             # POST - User logout
│   ├── session/            # GET - Get current session
│   └── activate/           # POST - Activate account (email flow)
├── books/                   # Book CRUD
│   ├── route.ts            # GET (list), POST (create)
│   └── [id]/
│       ├── route.ts        # GET (single), PUT (update), DELETE
│       ├── comments/       # POST - Add comment
│       └── replies/        # GET - Get comment replies
├── audiobooks/[book_id]/   # GET - Audiobook metadata
├── covers/[...params]/     # GET - Serve optimized cover images
├── user/preferences/       # GET/PUT - User preferences
├── request-book/[book_id]/ # POST - Request book access
└── system/log/             # POST - Client-side logging
```

**Image serving:**
- `/api/covers/[width]/[height]/[...path]` - Dynamic image resizing with Sharp
- Security headers in `next.config.ts` for covers and EPUB routes
- Middleware validates dimensions (1-2000px) and sanitizes paths

### Book Management Architecture

**Book data flow:**
1. Database queries in `src/lib/db/queries/books.ts`
2. API routes in `src/app/api/books/`
3. Client hooks in `src/hooks/use-book-*.ts`
4. Components in `src/components/books/`

**Advanced filtering and sorting:**
- `getAllBooksOptimized()` supports search, audio filtering, visibility, previews
- Dynamic sorting with SQL injection protection (whitelist validation)
- Configurable default sort in `SITE_CONFIG.DEFAULT_SORT`
- Pagination with `page` and `perPage` parameters

**Audiobook relationship:**
- Separate `audiobooks` table with `book_id` foreign key
- Books have `has_audio` flag and optional `media_id` for Mux integration
- Audiobook data fetched and populated when `has_audio` is true

### Image-Based Page Reader Implementation

**Location:** `src/app/read-book/[book_id]/`

**Architecture:**
- Custom image-based page reader (not EPUB)
- Loads PNG page images from Wasabi S3 CDN
- Image URLs: `https://s3.eu-south-1.wasabisys.com/piero-audiolibri/bookshelf/{bookId}/pages/page-{pageNum}-or8.png`
- Page count stored in database (`pagesCount` field)

**Key features:**
- Single and double page viewing modes
- Pinch-to-zoom and pan gestures (touch and mouse)
- Fullscreen mode support
- Keyboard navigation (Arrow keys, +/- for zoom)
- Page preloading for smooth navigation
- Reading progress persistence via `useReadingProgress.ts`
- Theme customization via `useReaderTheme.ts`

**PDF Downloads:**
- Separate `/api/download-book/[book_id]` endpoint
- Downloads PDF files from CDN (not EPUB)

### Configuration Files

**`next.config.ts`:**
- Image optimization disabled (`unoptimized: true`)
- Console.log removal in production (keeps error, warn, info, debug, trace)
- Custom security headers for `/api/covers/*` routes
- CSP policies for cover images

**`middleware.ts`:**
- Session-based authentication validation
- Route protection with redirect to login
- Cover image request validation (dimensions, path security)
- Authenticated users redirected away from auth pages

**`tailwind.config.ts`:**
- Custom z-index values: 1010, 1020 (for overlays)
- HSL-based color system via CSS variables
- shadcn/ui component integration

**`src/config/`:**
- `auth-config.ts` - Authentication flow settings and session durations
- `site-config.ts` - Site-wide settings (pagination defaults, default sort)
- `fonts.ts` - Font configuration

### State Management Patterns

**Authentication state:**
- React Context (`AuthProvider`) in `src/context/auth-context.tsx`
- Reducer pattern for state updates
- Actions: SET_USER, SET_LOADING, SET_ERROR, SET_AUTHENTICATED
- Auto-initialization from session cookie on mount

**Server state:**
- TanStack Query for data fetching and caching
- Custom hooks wrap query logic (e.g., `use-audiobook.ts`, `use-preview-books.ts`)

**Form state:**
- React Hook Form for form management
- Zod schemas for validation
- `@hookform/resolvers` for integration

### TypeScript Type System

**Type locations:**
- `src/types/index.ts` - Core domain types (Book, User, UserPreferences)
- `src/types/context.d.ts` - Context and action types
- `src/types/api.ts` - API request/response types
- `src/lib/db/types.ts` - Database query types (BookQueryOptions, PaginatedResult)

**Important type conventions:**
- Database column names use snake_case
- TypeScript properties use camelCase
- Query results map snake_case to camelCase via SQL aliases (e.g., `cover_image as "coverImage"`)

### Italian Language Context

This is an Italian audiobook/ebook platform ("Racconti in Voce e Caratteri"). All user-facing text is in Italian. When making changes, maintain Italian language consistency for:
- UI labels and buttons
- Error messages
- Email templates
- API error responses

### Environment Variables

**Required:**
- `DATABASE_URL` - Neon PostgreSQL connection string
- `PASSWORD_SALT` - Salt for SHA256 password hashing
- `NEXT_PUBLIC_APP_URL` - Base URL for email verification links

**Email (optional, for email verification flow):**
- SMTP configuration for Nodemailer

### Common Gotchas

**Database queries:**
- Always use parameterized queries (`$1`, `$2`, etc.) to prevent SQL injection
- Handle both array responses and object responses with `rowCount`
- Use `getFirstRow()` and `extractRows()` utilities for consistent response handling

**Boolean columns:**
- PostgreSQL booleans stored as 0/1 in queries
- Convert to proper booleans: `Boolean(row.isAdmin)` or `row.hasAudio ? 1 : 0`

**Session management:**
- Sessions are base64-encoded JSON strings
- Middleware decodes and validates on every protected route
- Session expiration checked against `new Date()`

**Image optimization:**
- Next.js image optimization is disabled (`unoptimized: true`)
- Custom Sharp-based optimization in `/api/covers/` route
- Always validate image dimensions and paths in middleware

**React 19 Type Changes:**
- RefObject types must include `| null` (e.g., `RefObject<HTMLElement | null>`)
- `useRef` requires explicit initial values for non-nullable types
- Buffer objects need `.buffer as ArrayBuffer` when passed to Response constructor
- Stricter type checking overall - ensure all types are properly defined

**Next.js 15.5+ Updates:**
- Turbopack for production builds now in beta (`next build --turbo`)
- Node.js middleware runtime is stable
- `next lint` command deprecated (still works but shows warnings)
- TypeScript route type improvements available
- Improved performance and bug fixes over 15.0.3