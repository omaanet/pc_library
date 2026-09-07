# Book previews: implementation plan

Prepared on 5 September 2026 for later execution by ChatGPT Astra.

## 1. Purpose and execution scope

Implement a small, book-owned preview feature with optional cover, video, expected publication date, and an extract supplied as HTML or local page images. Present previews in the existing homepage section and a dedicated responsive dialog.

This document is the implementation handoff. No application code, database migration, or asset changes were made while preparing it. Read the current repository instructions and inspect the current implementation again before executing: file contents may have changed since this plan was written.

Use `pnpm`. Follow the actual authorization, CSRF, SQL, styling, and error-handling conventions in the repository. Prefer localized changes and small reusable components. Do not redesign ordinary books, authentication, the full reader, or promotional landing pages.

The agreed requirements below take precedence over earlier discussion. Implementation defaults are provided where the discussion did not specify a detail; adjust ordinary technical choices to the actual repository without repeatedly requesting approval.

## 2. Agreed product requirements

### Ownership and administration

- A preview cannot be standalone. It belongs to an existing book entry.
- A book has at most one preview. An administrator may create a minimally populated book solely to host a preview.
- Preview management stays inside book administration; no independent preview creation page is needed.
- Store preview-specific content in a dedicated database table. Existing `books` rows are a read-only migration source and must not be changed by migration or preview saves.
- Preserve existing `books.is_preview` values and their existing library-filtering meaning. Do not remove, repurpose, or automatically synchronize that field.
- Normal, explicitly requested book creation/editing remains normal book CRUD. The read-only requirement applies to migration and preview operations; it does not prevent administrators from creating the parent book.

### Publication announcement

- A dedicated nullable date, default null, represents expected publication on the website.
- Render, for example, `Pubblicazione sul sito entro il 31 dicembre 2026`.
- No fallback to the parent book's date. No visible date line when null.
- Allow future dates and clearing the date. This is an announcement, not scheduled activation, expiry, or automatic book publication.

### Content combinations

- Video and extract have independent enabled flags.
- Support neither, video only, extract only, or both.
- Disabling either feature retains its saved content.
- Extract source options shown to the administrator are **Text** and **Images** (localized consistently with the surrounding form).
- Text is always HTML source entered in a simple multiline textarea. No rich-text editor, plain-text interpretation mode, or automatic newline conversion.
- Images are prepared locally using external tools. The app does not import or convert Word or PDF files.
- One extract source is active at a time. Video may coexist with either extract source.

### Covers and page images

- Uploaded preview covers: `public/previews/covers/`.
- Existing ordinary covers remain in `public/covers/` and can be referenced without copying.
- Extract page images: `public/previews/<book-id>/pages/`.
- Cover selection defaults to no override: selected preview cover, otherwise the linked book's real cover, otherwise no image.
- Treat a missing/blank book cover and `@placeholder` as no real cover for this feature. Do not manufacture a placeholder in the preview UI.
- Cover-source UI: use linked book cover if available, upload a cover, choose a preview cover, or choose a book cover.
- The previously suggested `public/covers-preview/` directory is superseded and must not be introduced.

### Public presentation

- Retain the homepage section `Racconti In Anteprima`.
- Show title, optional date, optional cover, and enabled video there. Extract content is displayed only in the dedicated dialog.
- Provide an explicit `Leggi l'estratto` action when an extract is available.
- The dialog can show cover, video, and extract together. Missing elements reserve no empty space.
- Use one adaptive image viewer: one image shows zoom controls only; multiple images add navigation, a page indicator, and single/double-page selection.
- Support zoom buttons, pinch, mouse interaction, keyboard zoom, and panning of enlarged content.
- Adapt double-page viewing to actual available space.

## 3. Current implementation and integration points

These are starting points, not a requirement to preserve current component boundaries.

| Area | Relevant files / current behavior |
| --- | --- |
| Homepage | `src/app/page.tsx` separates the ordinary library and preview collection. |
| Preview listing | `src/components/books/previews-collection.tsx`, `src/hooks/use-preview-books.ts`, and `src/lib/services/book-api-service.ts` currently fetch books with `displayPreviews=1` and `isVisible=1`. |
| Preview rendering | `src/components/books/preview-cover.tsx` renders a book cover and optional Mux video, with left/right placement. |
| Book management | `src/app/add-book/page.tsx`, `src/components/admin/books/book-form.tsx`, `src/hooks/admin/use-books.ts`, and `src/components/admin/books/book-table.tsx`. Inspect all schemas and submit serialization, not only the form controls. |
| Existing cover picker | `src/components/admin/books/cover-image-picker.tsx` lists book covers and includes placeholder behavior unsuitable for preview fallback. |
| Existing cover APIs | `src/app/api/covers/route.ts` lists files; `src/app/api/covers/[...params]/route.ts` reads and resizes files specifically under `public/covers`. |
| Book persistence | `src/lib/db/queries/books.ts`, `src/app/api/books/route.ts`, `src/app/api/books/[id]/route.ts`. Legacy preview media currently resides in book fields. |
| HTML | `src/components/books/book-extract.tsx` calls `sanitizePlainText`, converts newlines, and line-clamps text. Do not reuse this rendering behavior for preview HTML. Inspect `src/lib/sanitization.ts`; its DOMPurify usage needs a deliberate browser/server boundary. |
| Reader reference | `src/app/read-book/[book_id]/PageReader.tsx` contains pinch, pan, wheel, keyboard, and single/double-page behavior. Use as a reference, not as a dependency that brings in full-book state. |
| Dialog primitives | `src/components/ui/dialog.tsx`, plus existing book dialogs and lightboxes for visual conventions. |
| Authorization | Current book routes use `requireManagedPageAccess('books')`. Match this gate for preview management and uploads. |
| Migrations | `scripts/migrations/`, `src/lib/admin-migrations.ts`, and the existing admin migration UI/API. Preserve its checksum-based workflow; add a new migration rather than editing executed ones. |
| Configuration | `src/config/site-config.ts`, `src/proxy.ts`, `next.config.ts`, and deployment configuration. |

Current code has separate reading/audio visibility and a derived legacy overall visibility. Preview public visibility must not depend on either format being published. A preview-only parent can have both book formats hidden.

The current book form requires a title and a book publication date. Keep ordinary validation unless a narrowly necessary adjustment is identified. Its date must never become the preview announcement date. The initial implementation can create the parent using the existing minimum form, then configure its preview.

## 4. Data model

Create a `book_previews` table. Since there is exactly one preview per parent, using `book_id` as both primary key and foreign key is sufficient; a separate preview ID is unnecessary. Match the actual type of `books.id`.

Suggested columns and defaults:

| Column | Meaning / constraints |
| --- | --- |
| `book_id` | Required unique parent reference; primary key. No standalone creation. |
| `title` | Required nonblank preview title. Prefilled from the book when first configured; independently stored thereafter. |
| `expected_publication_date` | Nullable PostgreSQL date; default null. Transport as a date-only string. |
| `is_visible` | Boolean, default false for newly configured previews. Independent public preview visibility. |
| `display_order` | Nullable integer. Explicit values first, ascending; deterministic tie-breaker by book ID. |
| `cover_source` | Nullable discriminator: `preview` or `book`. Null means automatic linked-book fallback. |
| `cover_path` | Nullable path relative to the selected cover root. Must agree with `cover_source`. |
| `video_enabled` | Boolean, default false. |
| `video_playback_id` | Nullable Mux playback ID, separate from audiobook media. |
| `video_title` | Nullable; player metadata falls back to preview title. |
| `video_viewer_uid` | Nullable compatibility metadata copied from legacy `media_uid`; no prominent new editor field needed. |
| `video_placement` | `left` or `right`, default right. Preserve valid legacy values. New UI can use the consistent default without adding a layout editor. |
| `extract_enabled` | Boolean, default false. |
| `extract_source` | `text` or `images`, default `text`. Text always means HTML. |
| `extract_html` | Nullable HTML source. |
| `extract_image_paths` | Ordered list of relative page filenames/paths; empty by default. Prefer a PostgreSQL text array for this small list. |
| `created_at`, `updated_at` | Server-managed timestamps. |

Do not store a separate editable page count. Derive `pagesCount` from the ordered image list in the application/API. The array order is authoritative; do not rescan and silently reorder files on each public request.

Keep inactive extract content when switching source. This allows reverting without losing HTML or the selected page list. Public responses expose only the active, enabled extract content.

Validation rules:

- Video enabled requires a nonblank playback ID.
- Extract enabled with Text requires meaningful content after HTML sanitization, not only stripped scripts or whitespace.
- Extract enabled with Images requires at least one valid selected image.
- Selected cover source/path must be a valid pair; clearing a cover must persist explicit nulls rather than disappear through `undefined` serialization.
- Validate dates strictly as calendar dates, including invalid dates and leap years. Avoid timezone shifts in display.
- Validate all paths against server-owned roots. Never accept arbitrary absolute paths, remote URLs, or parent-directory traversal.
- Validate booleans and numbers explicitly; follow existing Neon result-shape helpers and parameterized SQL conventions.

For parent deletion, a cascading foreign key that removes only the preview row is a reasonable default. Verify it fits the current book deletion flow. It must not delete shared cover files or introduce filesystem deletion as a hidden side effect.

## 5. Migration and compatibility

### Migration contract

1. Create the new table and constraints using the existing migration mechanism.
2. Read all legacy `books` rows where `is_preview = 1`, including hidden ones.
3. Insert one preview per book. On an existing target row, do nothing: reruns must not overwrite administrator edits.
4. Do not issue updates, deletes, column changes, flag changes, or timestamp changes against `books`.
5. Do not move, rename, duplicate, or delete existing files.

### Field mapping

- Copy parent ID and title.
- Initialize expected publication date to null, even if the book has a date.
- Copy legacy overall visibility into initial preview visibility, normalizing numeric/boolean values correctly.
- Copy display order; use the new deterministic ordering thereafter. Do not inherit the ordinary library's NEW/audio/date prioritization.
- Leave cover override null so the original real book cover is used by fallback. Existing `@placeholder` covers intentionally become no image under the new requirements.
- Copy media ID, title, UID, and valid placement. Enable video only when its trimmed playback ID is nonempty; invalid placement falls back to right.
- Initialize extract disabled, HTML null, and page list empty. Do not silently publish the book's existing extract as new preview content.

### Post-migration behavior

- The homepage uses only `book_previews` for preview content and visibility, with a read-only parent-cover join for fallback.
- No runtime reimport, dual-write, or fallback to legacy book media fields after cutover.
- A missing preview row means the book has no new preview configured, even if its legacy flag is set. A rerun of the migration is an explicit import operation, not a request-time repair strategy.
- Keep the legacy `is_preview` library filter operational. Do not automatically flip it when a preview is enabled/disabled. Explain its existing library effect in the admin UI so publication is deliberate.
- It is valid to retain a preview for a regular library book; the independent preview row and its visibility control the preview section. The legacy flag still controls the book's ordinary-library classification.
- Saving preview-only edits must not invoke `updateBook()` or serialize legacy media fields back into `books`.

Validate migration against a disposable database or isolated fixture schema. Capture before/after book rows or equivalent complete row fingerprints and assert equality, not merely unchanged counts. Verify rerun safety, hidden previews, blank media IDs, nullable fields, and existing destination edits.

## 6. Local assets and deployment

### Directory responsibilities

| Directory | Contents |
| --- | --- |
| `public/previews/covers/` | New preview cover uploads and manually provisioned preview covers. Shared/selectable across previews. |
| `public/previews/<book-id>/pages/` | Already prepared extract page images for that book. |
| `public/covers/` | Existing book covers; reference in place. |

Keep the three namespaces explicit in validation, storage references, and URL generation. A preview cover and book cover with the same filename must remain distinguishable.

### Provisioning and selection

- Implement cover upload, as explicitly requested, plus selection from both cover directories.
- For extract pages, the minimal initial workflow is local preparation and placement into the book's page directory, followed by selection in the book's preview form.
- List available page images, show thumbnails, select the desired files, and allow simple move-up/move-down ordering and removal from the selection. No drag-and-drop framework is necessary.
- Show derived page count. Newly copied files appear on refresh but do not become published until selected and saved.
- A naming convention such as `page-001.webp`, `page-002.webp` is useful operational guidance, not a runtime requirement or editable filename-template feature.
- Do not add PDF/Word upload, conversion, OCR, or HTML-file import services. The HTML textarea and prepared page images are the inputs.

### Serving and durability

Inspect the actual hosting environment before implementing uploads. Confirm writable persistent directories and successful serving of files added after a production build. Do not assume Next.js static `public` serving discovers runtime uploads in every deployment arrangement.

If necessary, use a small Node-runtime asset route that reads from these exact local directories, or the deployment's persistent local static-file mapping. This still satisfies local storage. Do not substitute a CDN or temporary/serverless filesystem silently.

If production is immutable/serverless and cannot support persistent local files, report that concrete deployment constraint and complete unaffected work; a persistent host/volume or explicit deployment decision is then required.

For new uploads, support common raster formats such as JPEG, PNG, and WebP. Validate actual image decoding, byte and pixel limits, and generate collision-resistant filenames rather than overwriting existing files. Choose and document practical limits in one place. Existing book-cover selection should remain compatible with formats already supported by the book-cover API.

Reuse Sharp where useful for validation and bounded cover resizing. Do not reduce page image resolution so far that zoom becomes ineffective. Set correct content types and `nosniff`; use safe containment checks including Windows separators and symlink resolution where applicable.

New upload names should be immutable. Replacing a file reference must invalidate the relevant image URL/cache; avoid retaining a stale cover after save. Do not expand the old cover API into an arbitrary filesystem reader.

Uploaded covers may be shared. Changing or clearing a reference must not delete its file. Failed/cancelled edits can leave reusable uploaded covers; automatic garbage collection is out of scope. Document backup and deployment preservation of runtime assets; do not commit arbitrary user uploads by default.

## 7. APIs, types, and save boundaries

Introduce a dedicated preview type rather than forcing previews into `Book`. Separate stored/admin fields from the public view model, including resolved cover URL, active extract, and derived page count.

Suggested endpoint boundaries (names may follow repository conventions):

- Public preview collection GET: visible preview rows, with read-only book cover fallback. Do not filter by parent reading/audio visibility or require authentication to view public promotional content.
- Book-scoped preview GET/PUT: load or upsert one preview for an existing parent. Require book-management permission. GET may return no configured preview.
- Management-only cover/page listing endpoints and preview-cover upload endpoint.
- Same-origin preview asset serving endpoint if runtime/static hosting requires it.

All new mutations must use the existing CSRF wrapper and managed book-page authorization. Authenticated multipart requests must preserve the browser-generated boundary. Keep filesystem APIs server-only, use parameterized SQL, and avoid exposing directory listings publicly.

The public metadata response must omit disabled and inactive extract content. It may include enabled active extract data in the first version to avoid unnecessary request orchestration; lazy detail fetching is not required for a small preview collection.

Use a dedicated preview service/query module and a collection hook. Keep loading, error, retry, and empty states. Verify saved changes refresh the admin state and appear on a fresh public fetch without stale caching.

Prefer an independent `Salva anteprima` action within the existing book editor. This guarantees preview-only changes do not rewrite the book. Avoid nested HTML forms. For a new book, save the parent first, retain its ID and entered state, then enable preview configuration; never create an orphan or duplicate parent when retrying a failed preview save.

Do not implement a separate delete-preview feature initially: visibility off is sufficient. Ordinary parent deletion follows the established book flow and foreign-key behavior.

## 8. Admin experience

Inside the existing book editor, provide a clearly separated preview section:

1. Preview title (initially copied from book), public visibility, optional publication announcement date, optional display order.
2. Cover source choice, related upload/list UI, and resolved cover preview. Label default as `Usa la copertina del libro, se disponibile`, not a misleading `Nessuna` that implies hiding fallback.
3. Video switch; when enabled, playback ID and optional title. Preserve existing values while disabled.
4. Extract switch; source selector `Testo` / `Immagini`.
5. Text source: multiline HTML textarea with a short explanation that paragraphs and line breaks require HTML tags.
6. Images source: selectable local page files, ordered selection, thumbnails, derived count, and missing-file feedback.
7. A rendered preview action using the same public dialog components, allowing hidden draft inspection by the authorized administrator.
8. Independent save with clear success/error feedback and retained form data on failure.

Reuse existing form, date picker, buttons, and searchable selection patterns. Adapt the existing cover picker without breaking its ordinary-book placeholder behavior. Avoid exposing technical paths beyond filenames/source labels needed to select assets.

A preview-only book must be configurable with reading and audio hidden. No PDF, book page count, audiobook track, or real cover is required to publish its preview. Do not automatically overwrite the parent visibility settings.

## 9. Homepage card and dialog

Suggested components: `BookPreviewCard`, `BookPreviewDialogSimple`, `PreviewHtmlExtract`, and `PreviewExtractReader`, under an appropriate preview-specific component folder.

### Homepage card

- Use the existing section styling, fonts, rounded surfaces, theme colors, and spacing.
- Title is always present; date, cover, and video are conditional.
- Cover and video can sit beside each other when space permits; stack on narrow screens and avoid fixed widths that overflow.
- Preserve migrated left/right placement on wide layouts. New previews default to right.
- Video plays inline without autoplay. Keep its controls interactive; do not put the whole player inside a clickable button.
- Show `Leggi l'estratto` only when the active extract is enabled and valid. It opens the dialog with the extract in view.
- Cover/title may open the dialog when video or extract content exists. Cover/title-only cards need no empty dialog action.
- No automatic NEW badge derived from a book publication date, ratings, download controls, or audiobook badges unless separately requested.

### Dialog

- Use existing Radix dialog primitives for focus trapping, Escape, and focus restoration.
- Keep title and close control readily accessible. Date is optional.
- Show optional media and extract in one coherent layout, without tabs or collapsed text by default.
- HTML has comfortable line spacing, untruncated paragraphs, and a limited reading width. Do not wrap arbitrary block HTML inside a paragraph element.
- On `Leggi l'estratto`, bring the extract section into view after layout is ready without starting media or unnecessarily moving keyboard focus away from the dialog.
- Pause homepage video when opening its dialog. Stop/pause dialog playback on close. Avoid simultaneous audio from duplicate Mux instances; do not preload every dialog player.
- Keep previews publicly viewable without full-book access prompts.
- Ensure long HTML and zoomed images do not trap scrolling or push the close control off screen.

## 10. HTML rendering contract

Use the same sanitized rendering policy for admin inspection and public display.

- Treat input as an HTML fragment. Raw newlines have standard HTML whitespace behavior; never call `sanitizePlainText` or apply `whitespace-pre-line` to simulate plaintext formatting.
- Allow basic paragraphs, breaks, emphasis, headings, lists, blockquotes, and safe links.
- Remove scripts, event handlers, embedded media, forms, unsafe URL schemes, and document-level styling. Prefer removing imported classes and inline styles so site typography stays consistent.
- Make the DOMPurify runtime explicit. Do not assume the current browser-oriented helper works in Node or that a branded TypeScript string is a security check.
- Select one reliable sanitization strategy that works with Next.js rendering, and sanitize immediately before any HTML injection. If sanitizing on the server, use a supported DOM-backed/server-compatible setup and verify production build behavior.
- Retain source editing without adding a formatting toolbar, HTML file uploader, or Word processing.

## 11. Adaptive image reader

Use one component for all image counts. It accepts an ordered image list and title/context for accessible labels; it does not fetch book pages from Wasabi.

### Controls and layout

| Condition | Visible controls |
| --- | --- |
| One image | Zoom minus/plus at top right; percentage/reset is acceptable as a compact control. No navigation, page counter, or layout toggle. |
| Multiple images | Zoom controls plus previous/next, page indicator, and single/double-page preference. |

- Fit the page or spread to the actual viewer viewport while preserving aspect ratio.
- Treat 100% as fit-to-view, not necessarily original pixel dimensions.
- Use available container width and image dimensions to determine whether two pages can remain readable; do not rely only on the browser width.
- Default to showing two pages when the user has not chosen a mode and space permits. A user-selected single-page preference remains single. A selected double-page preference temporarily collapses to single when space is insufficient and restores when it fits again.
- First spread is pages 1 and 2. A final odd page appears alone, without a fake blank page.
- Track a canonical current page. Mode changes and resizes must keep it visible; map to the appropriate spread start as needed.
- Previous/next moves by one page or one spread according to effective mode. Disable unavailable directions; no wraparound.
- When all pages fit in the current spread, boundary arrows can be disabled; avoid implying additional content exists.
- Reset zoom/pan to fit on explicit page navigation. On resize/mode change, recompute fit and clamp/reset pan so content is never stranded offscreen.

### Input behavior

- Zoom plus/minus and reset controls remain outside the transformed image surface and do not move with panning.
- Support pinch zoom anchored around the gesture midpoint and drag-to-pan when enlarged.
- Default mouse policy: Ctrl/Cmd + wheel zooms over the viewer, ordinary wheel scrolls the dialog. This preserves mouse zoom without trapping routine reading scroll.
- Keyboard when the viewer is focused: plus/minus zoom, 0 resets, left/right navigate when applicable. Ignore shortcuts originating in inputs, textareas, or editable elements.
- Prevent browser defaults only for gestures actually handled inside the viewer. Do not install unconditional document-wide wheel or keyboard interception.
- Scope touch handling to the image interaction surface; the rest of the dialog remains scrollable. Handle pointer cancellation and gesture end cleanly.
- Use bounded zoom, for example 100% to 400%, with consistent button increments and clamped pan. Tune the bound to source quality rather than adding a settings UI.
- Keep reader state local to the dialog session. Do not reuse the full reader's persisted zoom/view mode, reading progress, bookmarks, statistics, or copyright-page substitution.

### Loading and accessibility

- Load only the active image/spread when opening the extract; optionally preload the next page/spread. Do not load page images in the homepage cards.
- Avoid treating two separate files as one image load. A manually prepared spread image is one asset; there is no automatic splitting or joining.
- Give pages labels such as `Estratto di [titolo], pagina 1 di 2` and controls clear Italian accessible names.
- Show useful loading and retry states for missing or failed images. Never silently decrement the page count.
- Check mouse, keyboard, and touch interactions against the full reader's familiar behavior, while keeping this implementation independent and small.

## 12. Implementation sequence

1. **Preflight:** inspect current files, local instructions, existing tests, deployment/storage, and actual database column types. Do not print secrets or run the environment script merely for discovery.
2. **Persistence:** add the new migration, preview types, validation, and parameterized query module. Verify backfill and rerun behavior in isolation.
3. **Asset access:** implement preview-cover upload, source-specific cover/page listings, safe URL/path resolution, and runtime asset serving if required. Verify persistence and production access.
4. **Preview APIs:** add the public collection and protected book-scoped management operations; keep preview saves separate from book saves.
5. **Admin UI:** add the preview section, source-dependent inputs, asset selection/order, rendered inspection, and correct new-parent flow.
6. **Rendering:** implement sanitized HTML and the adaptive image reader; integrate them into the dedicated dialog.
7. **Homepage cutover:** switch the preview collection to its new API/type, add cards/actions, and coordinate video playback. Remove obsolete preview fetching/rendering only where no longer used; preserve legacy book fields and filters.
8. **Validation and documentation:** complete the checklist below; document asset placement, migration application, deployment persistence, and any actual limitations. Update AGENTS.md only where the new implementation changes its descriptions.

Deploy the additive migration before code that requires the table. Use the existing migration mechanism. The plan itself is not evidence that a live migration has run; follow the execution session's actual authorization and environment context for live changes.

Rollback is to restore the previous application version while leaving the additive table and local assets intact. Legacy book preview data remains available because migration and preview saves do not alter it. New preview-only edits will not appear in the old UI; document that limitation rather than reverse-copying them into books.

## 13. Acceptance and validation checklist

### Data and API

- [ ] Cannot create an orphan or second preview for a book.
- [ ] Migration imports every flagged book, including hidden ones, without changing any existing book value.
- [ ] Migration rerun neither duplicates rows nor overwrites new preview edits.
- [ ] Announcement date begins null, stays null when the book has a date, clears correctly, and renders the exact intended calendar day.
- [ ] Preview visibility works when both parent book formats are hidden.
- [ ] Preview saves leave book timestamps, media fields, flags, extracts, and visibility untouched.
- [ ] Legacy library filtering remains intact; a preview save never flips `is_preview`.
- [ ] Disabling/switching features retains inactive content but omits it from public responses/rendering.
- [ ] Unauthorized mutations/listings and missing/invalid CSRF requests fail appropriately.

### Covers and images

- [ ] Both cover directories are selectable without copying, including equal filenames in different roots.
- [ ] Upload writes only into the preview-cover directory, cannot overwrite arbitrary files, and is available after production build/deployment restart.
- [ ] Cover fallback works for a real book cover; blank and placeholder fallback produce no image.
- [ ] Clearing a preview cover removes the override and saves nulls correctly.
- [ ] Selected page order survives save/reload; derived count matches the list; missing files are reported.
- [ ] Corrupt/oversized uploads, traversal attempts, invalid formats, and source/path mismatches are rejected.
- [ ] Replacing references does not remove shared files or display stale cached content.

### Presentation and interaction

- [ ] All four video/extract switch combinations work, with and without a cover/date.
- [ ] Text source renders allowed HTML, does not convert raw newlines, does not truncate prose, and strips malicious markup safely.
- [ ] Admin inspection matches public HTML and image presentation.
- [ ] One image exposes no navigation/layout controls; two images work together on wide screens and separately on narrow screens.
- [ ] Three images verify odd-final-page behavior; test this even though typical extracts have at most two pages.
- [ ] Resize/mode switches retain the current page and avoid offscreen content.
- [ ] Zoom buttons, wheel modifier, keyboard, pinch, reset, and pan work without hijacking dialog scrolling or full-reader preferences.
- [ ] Opening/closing a dialog leaves only the intended video playing.
- [ ] Extract action reveals the extract, focus returns to the trigger, Escape closes, and controls have accessible names.
- [ ] Light/dark themes, long titles, long HTML, image failures, empty lists, and mobile layouts remain usable.

### Engineering checks

- [ ] Run focused tests for migration invariants, preview validation, asset containment, sanitization, and page/spread calculations using the repository's current test setup.
- [ ] Run `pnpm lint` and `pnpm build`; record pre-existing or environment-related failures separately from introduced failures.
- [ ] Use real browser inspection for desktop and mobile layouts and input behavior. If native touch testing is unavailable, state the unverified pinch limitation instead of claiming it passed.
- [ ] Smoke-test existing ordinary cover selection, book save/create, library filtering, full reader, and audiobook playback where affected by shared changes.
- [ ] Deliver a concise implementation summary, migration/deployment instructions, validation results, and any unresolved concrete limitation.

## 14. Explicitly outside this version

- Standalone previews or multiple previews per book.
- Server-side Word/PDF conversion, OCR, document import pipelines, or a rich-text editor.
- Separate manually managed page-count fields, configurable filename templates, or a generic media-management system.
- Automatic announcement scheduling/expiry, date inheritance, or automatic conversion of a preview book into a regular library book.
- New preview analytics, bookmarks, reader progress, downloads, comments, accounts, or full-book toolbars.
- Forced changes to existing book rows, schema cleanup of legacy preview columns, automatic asset deletion, or a CDN migration.
- An explicit hide-cover override: current scope uses override then book-cover fallback then no image. Add a hide option only if subsequently requested.

Keep the implementation proportional to a small collection of previews, typically containing one or two extract images.
