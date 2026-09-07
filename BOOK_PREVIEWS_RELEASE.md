# Book previews: release and operations

## Migration supplied, not applied

New file: `scripts/migrations/20260905_add_book_previews.sql`.

No production migration or deployment was performed for this implementation.
Tests use an in-memory PGlite PostgreSQL instance, never the configured Neon database.

After deploying the release files, use the existing **Admin → Migrations** workflow
to execute `20260905_add_book_previews.sql`. The runner uses a transaction and records
the filename/checksum. Do not edit a recorded migration or substitute a manual schema
change for the recorded workflow. Confirm existing migrations (including legacy preview
media and book visibility columns) have already been applied.

The homepage's new preview collection requires this table. Coordinate deployment and
migration in a maintenance window, or put the migration file on the current server and
run it before switching application traffic. Until it runs, the collection reports an
error; the book editor displays an explicit migration notice and allows draft inspection
with preview saving disabled. Reload the editor after migration. Unsaved browser input
is not persisted through a reload; copy it if necessary.

The migration creates a one-to-one child of `books` (`book_id TEXT` primary/foreign key).
It imports **all** legacy `is_preview` books, including hidden rows. Expected publication
date starts null; legacy extract content is never published automatically. Existing book
values, timestamps, flags, media, visibility and files are untouched. Rerunning imports
missing legacy previews but never overwrites existing preview edits. There is no runtime
reimport or dual-write. Deleting a parent book cascades only to its preview row.

Suggested release verification (read-only SQL):

```sql
SELECT b.id
FROM books b LEFT JOIN book_previews p ON p.book_id = b.id
WHERE b.is_preview::text IN ('1', 'true', 't') AND p.book_id IS NULL;

SELECT book_id, title, is_visible, expected_publication_date,
       video_enabled, extract_enabled
FROM book_previews ORDER BY display_order NULLS LAST, book_id;
```

The first query should return no rows immediately after import. For live assurance,
take a complete `books` export before migration and compare it afterwards in the
maintenance window; exclude concurrent ordinary book editing from that comparison.

## Runtime and storage prerequisite

Use Node.js **24.15 or newer in the 24.x line** (validation used 24.18). The new
isomorphic DOMPurify dependency also supports Node 22.22.2+ and 26+; older Node 20
hosts must be upgraded before release. Install with the repository's pnpm workflow.

Local storage must persist across restarts and application deployments:

| Directory relative to the application working directory | Purpose |
| --- | --- |
| `public/previews/covers/` | Shared uploaded/manually provisioned preview covers |
| `public/previews/<book-id>/pages/` | Prepared page images for that book |
| `public/covers/` | Existing ordinary covers, referenced without copying |

Mount or preserve `public/previews` on a persistent volume, and preserve existing
`public/covers`. The application account needs directory listing/read access and write
access to `public/previews/covers` and creation/write access to the book page directories
under `public/previews`. Use the application directory as the process working
directory, including for standalone Next builds. Multiple server instances need the
same persistent filesystem view. Trusted root mounts are supported; symlinks escaping
an individual asset root are rejected, and listings do not follow symlinks.

The repository contains Vercel linkage files, but persistent production storage could
not be confirmed. **A standard Vercel/serverless deployment cannot provide the agreed
runtime local-upload storage.** Uploads return an explicit 503 when `VERCEL` is set.
A persistent Node host/volume is required to release the complete feature. No storage
provider or CDN substitution has been made. Immutable provisioned assets alone do not
satisfy the cover-upload requirement.

`GET /api/preview-assets/...` reads these directories at request time, so newly added
files work after a production build and restart. It sends source-specific MIME types,
`nosniff`, a restrictive asset CSP and revalidation headers. Listings are management-only;
individual promotional image URLs are publicly readable. Hidden draft files are not
private storage: files under `public` can also be directly addressed by the host.

Back up the preview table and local asset directories together. Do not replace the
runtime asset directory with an empty release directory. User assets are gitignored;
provision manually prepared files separately. Keep filenames immutable when changing
content; uploads generate UUID WebP filenames. Switching/clearing references never
deletes files; unused uploads remain reusable, and garbage collection is out of scope.

## Editorial workflow

1. Create/save the parent using the normal book form. The new book remains open with
   its ID for preview configuration. Reading and audio may both remain hidden.
2. In **Preview Book → Anteprima del libro**, configure the independent title, optional
   announcement date/order, cover, video and extract. The legacy **Preview Book** toggle
   controls ordinary library classification and expands/collapses the editor; it does
   not publish this preview. Collapsing retains unsaved preview input. Saving only the
   preview does not persist a change to the book's legacy toggle.
   The video section includes Media ID, Media Title, Use Book Title, Media UserID and
   left/right placement, all stored in the preview table.
   **Video** and **Estratto** have matching sections with green toggles; settings collapse
   when disabled and retain their draft values. Placement controls appear only with a
   cover; the saved preference is retained when hidden. Page reorder controls appear
   only for multiple selected pages.
3. Covers can fall back to the linked book, be selected from either cover directory, or
   be uploaded when the preview-cover source is selected. Upload/list refresh controls
   are hidden when using the linked book's cover. Blank/`@placeholder` fallback renders
   no image. File dropdowns show thumbnails and filenames, with the refresh button
   beside the selector (directly below on small screens). Resetting the source to
   the linked book clears both override fields with explicit nulls.
4. Choose **Testo** for an HTML fragment (`<p>`, `<br>`, headings, lists, emphasis,
   blockquotes and safe links). Raw newlines remain normal HTML whitespace. Imported
   styling/classes, scripts, event handlers and embedded media are removed for display.
5. For **Immagini**, use **Carica immagini dell’estratto** to select one or more prepared
   JPEG/PNG/WebP files (10 MiB and 40 million pixels per file). Uploads retain full image
   resolution, normalize to lossless PNG with immutable names, and are automatically
   appended to the draft selection in upload order. Batch failures retain successful
   uploads and identify failed files. Check thumbnails/order, then save the preview.
   Alternatively copy prepared files to the book's directory and use **Aggiorna pagine
   disponibili**, then select them from the thumbnail dropdown. Selected pages are
   excluded from that dropdown; removing a selection never deletes its file. Selection order is persisted;
   adding a file alone does not publish it. Missing selected files are reported and
   prevent saving an enabled image extract; disable it to retain a temporarily missing
   selection. Switching sources retains the inactive HTML and image list.
6. **Visualizza anteprima** uses the same dialog as public cards and works for drafts.
   **Salva anteprima** writes only the child row. **Update Book** remains normal book
   CRUD. Preview input Enter keys do not implicitly submit the book form.

Homepage cards retain the compact cover/title presentation; clicking either opens the
dialog. There is no separate extract button or visible generic extract heading in the
dialog. The extract keeps its accessible section label.

The announcement date is an optional date-only value, never inherited from the book,
never a schedule. Clear the date input to remove the announcement. Video and extract
switches are independent and retain saved values when disabled. Public metadata omits
disabled/inactive extract data. A visible preview may accompany an ordinary library book.

Limits are defined in `src/lib/preview-assets.ts`: cover uploads at most 10 MiB and
40 million decoded pixels, nonanimated JPEG/PNG/WebP, normalized to WebP at maximum
2400 px per edge without upscaling. Uploaded and manually prepared pages are not resized; selected pages must
decode as images within the pixel limit. The preview payload allows up to 50 selected
pages and 200,000 HTML characters. Avoid oversized manually provisioned image files.

## Validation

- `pnpm test:previews`: isolated PostgreSQL migration, complete book-row equality,
  rerun/edit preservation, foreign key/uniqueness/cascade, date/null behavior, public
  projection, strict input validation, HTML allowlist, path/symlink containment, corrupt/
  excessive uploads, immutable filenames, spread calculations and CSRF rejection.
- `pnpm lint` and `pnpm build` validate the application. Test dependencies are development
  dependencies; DOMPurify uses an explicit server DOM and browser implementation.
- Browser checks use real application components with fixture preview API responses;
  no production preview data is written. They cover desktop/mobile spreads, odd final
  page, single-image controls, zoom buttons/keyboard, modifier-wheel zoom, drag panning,
  emulated two-finger pinch, light/dark themes, focus restoration, editor layout,
  HTML inspection, source retention and ordered save/reload.
- Runtime image serving was checked using files created **after** the production build.
  Authorization and missing-CSRF HTTP checks run against the local production server.

Native physical touch/pinch and real external Mux media playback still require release
device/content checks. Browser fixtures do not prove production disk durability, host
permissions or deployment preservation; verify these on the target persistent host.
The ordinary library was smoke-tested; no full-book reading progress or audiobook data
was modified. Existing local Vercel Analytics script 404s are unrelated to previews.

## Rollback

Restore the previous application version while leaving the additive table and asset
directories intact. Legacy preview fields and library flags remain available. New
preview-only edits will not appear in the old UI. Do not reverse-copy into `books`, drop
the table, or delete shared files as part of rollback.
