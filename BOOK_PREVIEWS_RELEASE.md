# Book previews: release and operations

## Four-book transfer completed on 2026-09-08

Production release: `dpl_8bEBkR6hC3S5G4dzMv6rzBukd3K9`, promoted to
`https://pc-library.vercel.app`. Three parent books and four preview rows were
inserted in one transaction. All five image checksums and all transferred fields
matched; the existing Carillon parent and unrelated book/preview rows remained
unchanged. A repeated apply performed no writes. The actual data and rollback
were rehearsed in isolated PostgreSQL before applying. All four dialogs were
checked at desktop and mobile widths. Twelve preview tests, six transfer safety
tests, and local/Vercel builds passed. Repository lint remains blocked by the
pre-existing ESLint 10 / React plugin `getFilename` compatibility error.

`scripts/transfer-four-previews.mjs` transfers only `book-1746324080859`,
`book-1788793702419`, `book-1788814362610`, and `book-1788814413810` to the
linked Vercel `pc-library` production database. It leaves the first book's parent
row unchanged and inserts only missing, identical-or-absent new books/previews.
Conflicting existing records are rejected rather than overwritten.

Run from the repository root with Node 24 and installed pnpm dependencies:

```sh
node --test scripts/transfer-four-previews.test.mjs
node scripts/transfer-four-previews.mjs            # dry run; no database writes
node scripts/transfer-four-previews.mjs --apply    # assets must already be live
node scripts/transfer-four-previews.mjs --verify
node scripts/transfer-four-previews.mjs --rollback # guarded, explicit rollback
```

The script reads `.env.local` as source and `.env.production` as destination
explicitly. Before applying, verifying or rolling back, it uses the existing
Vercel CLI login (or `VERCEL_TOKEN` / `VERCEL_AUTH_FILE`) to compare only the
production database identity in memory. It never persists Vercel environment
values. Source and target must be different databases with matching columns.

The immutable dry-run manifest, complete destination `books`/`book_previews`
backup, source rows, image copies/checksums and execution receipts live in
gitignored `tmp/preview-transfer-20260908/`. Keep this directory securely and
retain the original manifest for repeat runs and rollback. Do not regenerate it
after applying. An identical repeat apply makes no writes. Concurrent book or
preview edits cause the transaction to abort; all inserted fields, generated
visibility and unrelated book/preview rows are checked before commit. Rollback
also refuses to delete new books if other foreign-key child rows reference them.

Five images are verified byte-for-byte before applying: the existing Carillon
cover, three new preview covers, and the saved (currently inactive) extract page.
Only these four new image files have Git exceptions; Next.js explicitly traces
all five into the preview asset function. This is a bundled, immutable Vercel
release, not support for live production uploads. Future deployments must retain
these files and tracing entries.

For CLI deployment, stage only tracked `src/`, `public/`, `scripts/migrations/`,
the required named build/package configuration files, and these explicitly named
assets into a clean directory, preserving the tracked `next-env.d.ts` in that
release. Inspect `vercel deploy --dry --json` there before deploying. The
working folder contains ignored database dumps and other local files that must
not be uploaded. Keep backups outside the release directory. Deploy images and
verify `/api/preview-assets/...` before applying the data transfer. No schema
migration is needed for this transfer.

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
`package.json` has neither `engines.node` nor `devEngines.runtime`. Use an installed
Node 24.x version (at least 24.15.0) locally for development, builds and the production
server. Select Node 24.x in Vercel's project settings for builds and deployed functions.
Vercel manages its minor/patch updates; the local and deployed patch versions may
differ. Redeploy after changing the runtime; an existing deployment keeps its original
runtime. The separate jsdom dependency override remains required for the workaround below.

### Diagnosing Vercel preview failures

- React error #419 reports that server rendering could not finish a Suspense boundary;
  the original exception is in the Vercel runtime logs, not the browser's minified stack.
- If `/api/previews` returns a Next.js **HTML** error page, inspect the failed request
  under the project's **Logs** for module initialization/runtime errors. The route's
  normal error handler returns JSON. Check the Node version and sanitizer dependency
  loading before assuming the database migration is missing.
- `ERR_REQUIRE_ESM` from `html-encoding-sniffer` loading `@exodus/bytes/encoding-lite.js`
  occurs while initializing the sanitizer, before the preview database query runs.
  Upgrading Node alone is insufficient: Vercel's module loader can still reject
  synchronous `require(esm)`. `pnpm-workspace.yaml` pins only the sanitizer's jsdom
  dependency to `25.0.1`, following the
  [maintainer's workaround](https://github.com/kkomelin/isomorphic-dompurify/issues/394).
  DOMPurify itself remains current. Keep this override until a replacement passes
  the import regression test with `--no-experimental-require-module` and a Vercel
  deployment check. Deploy `pnpm-workspace.yaml` and `pnpm-lock.yaml` together;
  redeploy without the existing build cache when replacing the failing deployment.
- If the logs or JSON response report `relation "book_previews" does not exist`, apply
  `20260905_add_book_previews.sql` through **Admin → Migrations** as described above.
- After redeploying, verify `/api/previews` returns HTTP 200 with `{ "previews": [...] }`
  and reload the homepage to check server rendering. Successful local tests alone do
  not confirm that the deployed runtime, database, or asset storage is configured.

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
