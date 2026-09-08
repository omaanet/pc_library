import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';
import { PGlite } from '@electric-sql/pglite';
import { emptyPreview, previewSchema, publicPreview, isCalendarDate, publicationAnnouncement, safeAssetPath, previewAssetUrl } from './book-preview.ts';
import { sanitizePreviewHtml, hasPreviewText } from './preview-html.ts';
import { canFitSpread, spreadStart, clampPan } from './preview-reader.ts';
import { assetRoot, resolveAsset, listAssets, uploadCover, uploadPage, PREVIEW_ASSET_LIMITS } from './preview-assets.ts';

test('server sanitizer loads without synchronous require(esm) support', () => {
    // Reproduce the Vercel loader restriction in a fresh process: ordinary local
    // Node 24 imports succeed even with the incompatible jsdom dependency chain.
    for (const mode of ['module', 'commonjs']) {
        const loader = mode === 'module'
            ? "import DOMPurify from 'isomorphic-dompurify';"
            : "const DOMPurify = require('isomorphic-dompurify').default;";
        const result = spawnSync(process.execPath, [
            '--no-experimental-require-module', `--input-type=${mode}`, '-e',
            `${loader} process.stdout.write(DOMPurify.sanitize('<p>Ciao</p><script>bad()</script>'));`,
        ], { cwd: new URL('../../', import.meta.url), encoding: 'utf8' });
        assert.ifError(result.error);
        assert.equal(result.status, 0, `${mode}: ${result.stderr}`);
        assert.equal(result.stdout, '<p>Ciao</p>');
    }
});

test('strict calendar dates and announcement have no timezone or parent date inheritance', () => {
    for (const date of ['2028-02-29', '2026-12-31', '1900-01-01']) assert.ok(isCalendarDate(date));
    for (const date of ['2026-02-29', '1900-02-29', '2026-04-31', '2026-13-01', '0000-01-01', '2026-1-01', '']) assert.equal(isCalendarDate(date), false);
    assert.equal(publicationAnnouncement('2026-12-31'), 'Pubblicazione sul sito entro il 31 dicembre 2026');
    assert.equal(emptyPreview('Titolo').expectedPublicationDate, null);
});

test('validation is strict, nullable covers clear, all media combinations preserve inactive values', () => {
    const base = { ...emptyPreview('Titolo'), videoPlaybackId: 'playback', extractHtml: '<p>Testo</p>', extractImagePaths: ['page-002.webp', 'page-001.webp'] };
    for (const videoEnabled of [false, true]) for (const extractEnabled of [false, true]) {
        const input = { ...base, videoEnabled, extractEnabled };
        assert.ok(previewSchema.safeParse(input).success);
        const result = publicPreview({ ...input, bookId: '123', bookCover: null });
        assert.equal(!!result.video, videoEnabled);
        assert.equal(!!result.extract, extractEnabled);
        assert.equal(JSON.stringify(result).includes('page-002'), false);
    }
    assert.ok(previewSchema.safeParse({ ...base, extractEnabled: true, extractSource: 'images' }).success);
    for (const invalid of [{ isVisible: 1 }, { displayOrder: '2' }, { displayOrder: 1.5 }, { title: '  ' }, { coverSource: 'book' }, { coverPath: 'cover.jpg' }, { videoEnabled: true, videoPlaybackId: ' ' }, { extractEnabled: true, extractHtml: '<script>bad()</script>' }, { extractEnabled: true, extractSource: 'images', extractImagePaths: [] }, { extractImagePaths: ['a.jpg', 'a.jpg'] }]) {
        assert.equal(previewSchema.safeParse({ ...base, ...invalid }).success, false, JSON.stringify(invalid));
    }
    const images = publicPreview({ ...base, extractEnabled: true, extractSource: 'images', bookId: '123', bookCover: null });
    assert.equal(images.extract.pagesCount, 2);
    assert.ok(images.extract.images[0].endsWith('page-002.webp'));
    assert.equal('html' in images.extract, false);
});

test('cover namespaces are distinct and placeholders never become preview images', () => {
    for (const cover of [null, '', '  ', '@placeholder']) assert.equal(publicPreview({ ...emptyPreview('A'), bookId: '1', bookCover: cover }).coverUrl, null);
    const base = { ...emptyPreview('A'), bookId: '1', bookCover: 'same.jpg' };
    assert.equal(publicPreview(base).coverUrl, '/api/preview-assets/book/same.jpg');
    assert.equal(publicPreview({ ...base, coverSource: 'preview', coverPath: 'same.jpg' }).coverUrl, '/api/preview-assets/preview/same.jpg');
    assert.notEqual(previewAssetUrl('book', 'same.jpg'), previewAssetUrl('preview', 'same.jpg'));
});

test('HTML allowlist removes executable markup and styling without newline conversion', () => {
    const source = '<p class="x" style="color:red" onclick="bad()">Uno\nDue<br><em>Tre</em></p><script>bad()</script><iframe src="x"></iframe><img src=x onerror=bad()><a href="javascript:bad()">Link</a><a href="https://example.org">Safe</a>';
    const result = sanitizePreviewHtml(source);
    assert.equal(result, '<p>Uno\nDue<br><em>Tre</em></p><a>Link</a><a href="https://example.org">Safe</a>');
    for (const html of [' ', '<p>&nbsp; &#160; &#xA0; </p>', '<script>alert(1)</script>', '<img src=x>', '<p>\u200b</p>']) assert.equal(hasPreviewText(html), false, html);
    assert.ok(hasPreviewText('<h2>Ciao</h2><ul><li>Pagina</li></ul>'));
});

test('spread calculation, odd final page, responsive preference and bounded pan', () => {
    assert.equal(spreadStart(1, true), 0);
    assert.equal(spreadStart(2, true), 2);
    assert.equal(spreadStart(1, false), 1);
    assert.ok(canFitSpread(1000, 600, [0.7, 0.7]));
    assert.equal(canFitSpread(390, 600, [0.7, 0.7]), false);
    assert.equal(canFitSpread(1000, 600, [0.2, 0.2]), false);
    assert.equal(canFitSpread(1000, 600, [0.7]), false);
    assert.deepEqual(clampPan(999, -999, 2, { width: 500, height: 600 }, { width: 700, height: 600 }), { x: 150, y: -300 });
    assert.deepEqual(clampPan(999, -999, 1, { width: 500, height: 600 }, { width: 700, height: 600 }), { x: 0, y: 0 });
});

test('assets reject traversal, wrong extensions and symlink escapes', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'preview-assets-'));
    try {
        await fs.mkdir(path.join(root, 'inside'));
        await fs.mkdir(path.join(root, 'outside'));
        await fs.writeFile(path.join(root, 'inside', 'same.jpg'), 'fixture');
        await fs.writeFile(path.join(root, 'outside', 'secret.jpg'), 'fixture');
        await fs.symlink(path.join(root, 'outside'), path.join(root, 'inside', 'escape'), 'junction');
        assert.deepEqual(await listAssets(path.join(root, 'inside')), ['same.jpg']);
        for (const relative of ['../outside/secret.jpg', '..\\outside\\secret.jpg', 'C:/secret.jpg', '/secret.jpg', '%2e%2e/secret.jpg', 'same.jpg:stream', 'same.jpg?', 'same.jpg#x', 'escape/secret.jpg', 'x.txt']) {
            await assert.rejects(resolveAsset(path.join(root, 'inside'), relative));
        }
        for (const relative of ['../x.jpg', '..\\x.jpg', 'C:/x.jpg', 'a//b.jpg', '/x.jpg', 'https://x.jpg']) assert.equal(safeAssetPath(relative), false);
        assert.throws(() => assetRoot('pages', '../other'));
        assert.throws(() => assetRoot('pages', 'covers'));
    } finally { await fs.rm(root, { recursive: true, force: true }); }
});

test('cover uploads decode, bound pixels/bytes, use immutable names and preserve references', async () => {
    await assert.rejects(uploadCover(Buffer.from('not an image')));
    await assert.rejects(uploadCover(Buffer.alloc(PREVIEW_ASSET_LIMITS.uploadBytes + 1)));
    const tooManyPixels = await sharp({ create: { width: 6400, height: 6400, channels: 3, background: '#fff' } }).png().toBuffer();
    await assert.rejects(uploadCover(tooManyPixels));
    const bytes = await sharp({ create: { width: 20, height: 30, channels: 3, background: '#369' } }).png().toBuffer();
    const files = [];
    try {
        files.push(await uploadCover(bytes), await uploadCover(bytes));
        assert.notEqual(files[0], files[1]);
        for (const file of files) {
            assert.match(file, /^[0-9a-f-]+\.webp$/);
            assert.equal((await sharp(await fs.readFile(await resolveAsset(assetRoot('preview'), file))).metadata()).format, 'webp');
        }
    } finally { for (const file of files) await fs.unlink(await resolveAsset(assetRoot('preview'), file)); }
});

test('page uploads preserve full resolution, remain book-scoped and reject invalid input', async () => {
    const bookId = `upload-test-${Date.now()}`;
    const root = assetRoot('pages', bookId);
    const bytes = await sharp({ create: { width: 2500, height: 100, channels: 3, background: '#369' } }).png().toBuffer();
    await assert.rejects(uploadPage('../escape', bytes, 'test.png'));
    await assert.rejects(uploadPage(bookId, Buffer.from('invalid'), 'test.png'));
    await assert.rejects(uploadPage(bookId, Buffer.alloc(PREVIEW_ASSET_LIMITS.uploadBytes + 1), 'test.png'));
    try {
        const first = await uploadPage(bookId, bytes, '../../page-001.png');
        const second = await uploadPage(bookId, bytes, '../../page-001.png');
        assert.notEqual(first, second);
        assert.ok(safeAssetPath(first));
        assert.equal(first.includes('/'), false);
        const metadata = await sharp(await fs.readFile(await resolveAsset(root, first))).metadata();
        assert.equal(metadata.width, 2500);
        assert.equal(metadata.height, 100);
        assert.equal(metadata.format, 'png');
        assert.equal((await listAssets(root)).length, 2);
        await assert.rejects(resolveAsset(assetRoot('preview'), first));
    } finally {
        // This directory belongs solely to the generated fixture book.
        assert.ok(root.startsWith(path.join(process.cwd(), 'public', 'previews') + path.sep));
        await fs.rm(path.dirname(root), { recursive: true, force: true });
    }
});

test('real isolated PostgreSQL migration and preview CRUD never modify books; reruns preserve edits', async () => {
    // Never use a .env file or an external database. Replace the Neon adapter with PGlite.
    process.env.DATABASE_URL = 'postgresql://fixture:fixture@localhost/fixture';
    const db = new PGlite();
    const migration = await fs.readFile('scripts/migrations/20260905_add_book_previews.sql', 'utf8');
    const { getNeonClient } = await import('./db/client.ts');
    const client = getNeonClient();
    const originalQuery = client.query;
    client.query = async (sql, params) => (await db.query(sql, params)).rows;
    try {
        await db.exec(`CREATE TABLE books (
            id TEXT PRIMARY KEY, title TEXT NOT NULL, cover_image TEXT, publishing_date DATE,
            is_preview INTEGER, is_visible INTEGER, is_reading_visible BOOLEAN, is_audio_visible BOOLEAN,
            display_order INTEGER, media_id TEXT, media_title TEXT, media_uid TEXT, preview_placement TEXT,
            extract TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        INSERT INTO books (id,title,is_preview,is_visible,is_reading_visible,is_audio_visible,media_id,preview_placement,publishing_date,extract)
        VALUES ('a','Visible',1,1,false,false,' mux ','left','2025-01-01','Do not publish'),
               ('b','Hidden',1,0,false,false,'   ','invalid','2024-02-29','Legacy'),
               ('c','Ordinary',0,1,true,false,NULL,NULL,NULL,NULL),
               ('d','Nullable',1,NULL,false,false,NULL,NULL,NULL,NULL);`);
        const snapshot = async () => (await db.query('SELECT to_jsonb(b) AS row FROM books b ORDER BY id')).rows;
        const before = await snapshot();
        await db.exec(migration);
        assert.deepEqual(await snapshot(), before);
        const { getBookPreview, getPublicPreviews, saveBookPreview } = await import('./db/queries/book-previews.ts');
        assert.equal((await db.query('SELECT * FROM book_previews')).rows.length, 3);
        const imported = await getBookPreview('a');
        assert.equal(imported.expectedPublicationDate, null);
        assert.equal(imported.videoEnabled, true);
        assert.equal(imported.videoPlacement, 'left');
        assert.equal(imported.extractEnabled, false);
        assert.equal(imported.extractHtml, null);
        assert.equal((await getBookPreview('b')).videoEnabled, false);
        assert.equal((await getBookPreview('b')).videoPlacement, 'right');
        assert.equal((await getBookPreview('d')).isVisible, false);
        assert.deepEqual((await getPublicPreviews()).map(p => p.bookId), ['a']);
        const edited = { ...emptyPreview('Changed independently'), expectedPublicationDate: '2028-02-29', isVisible: true, extractHtml: '<p>Retain me</p>', extractImagePaths: ['second.jpg', 'first.jpg'] };
        await saveBookPreview('b', edited);
        await saveBookPreview('c', { ...edited, displayOrder: 0 });
        assert.deepEqual((await getPublicPreviews()).map(p => p.bookId), ['c', 'a', 'b']);
        await saveBookPreview('b', { ...edited, expectedPublicationDate: null });
        assert.equal((await getBookPreview('b')).expectedPublicationDate, null);
        assert.deepEqual((await getBookPreview('b')).extractImagePaths, ['second.jpg', 'first.jpg']);
        assert.equal((await getBookPreview('b')).extractHtml, '<p>Retain me</p>');
        const previewBefore = (await db.query('SELECT to_jsonb(p) AS row FROM book_previews p ORDER BY book_id')).rows;
        await db.exec(migration);
        assert.deepEqual((await db.query('SELECT to_jsonb(p) AS row FROM book_previews p ORDER BY book_id')).rows, previewBefore);
        assert.deepEqual(await snapshot(), before);
        await assert.rejects(saveBookPreview('orphan', edited), /foreign key/);
        await assert.rejects(db.query("INSERT INTO book_previews(book_id,title) VALUES('a','Duplicate')"), /duplicate key/);
        await db.query("DELETE FROM books WHERE id='b'");
        assert.equal(await getBookPreview('b'), null);
    } finally { client.query = originalQuery; await db.close(); }
});

test('new mutation CSRF wrapper rejects absent/short tokens before handler execution', async () => {
    const { withCSRFProtection } = await import('./csrf-middleware.ts');
    const { NextRequest, NextResponse } = await import('next/server');
    let calls = 0;
    const handler = withCSRFProtection(async () => { calls++; return NextResponse.json({ ok: true }); });
    for (const method of ['PUT', 'POST']) {
        for (const token of ['', 'short']) {
            assert.equal((await handler(new NextRequest('http://localhost/api/books/a/preview', { method, headers: { 'x-csrf-token': token } }))).status, 403);
        }
    }
    assert.equal(calls, 0);
    assert.equal((await handler(new NextRequest('http://localhost/api/books/a/preview', { method: 'PUT', headers: { 'x-csrf-token': 'x'.repeat(32) } }))).status, 200);
});

test('migration also normalizes boolean legacy flags without changing source rows', async () => {
    const db = new PGlite();
    try {
        await db.exec(`CREATE TABLE books (id TEXT PRIMARY KEY, title TEXT NOT NULL,
            is_preview BOOLEAN, is_visible BOOLEAN, display_order INTEGER,
            media_id TEXT, media_title TEXT, media_uid TEXT, preview_placement TEXT);
            INSERT INTO books(id,title,is_preview,is_visible) VALUES
            ('visible','Visible',true,true), ('hidden','Hidden',true,false), ('ordinary','Ordinary',false,true);`);
        const before = (await db.query('SELECT * FROM books ORDER BY id')).rows;
        await db.exec(await fs.readFile('scripts/migrations/20260905_add_book_previews.sql', 'utf8'));
        assert.deepEqual((await db.query('SELECT * FROM books ORDER BY id')).rows, before);
        assert.deepEqual((await db.query('SELECT book_id, is_visible FROM book_previews ORDER BY book_id')).rows,
            [{ book_id: 'hidden', is_visible: false }, { book_id: 'visible', is_visible: true }]);
    } finally { await db.close(); }
});
