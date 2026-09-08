// One-off, guarded transfer. Run from the repository root with Node 24.
// Default: save a dry-run manifest in gitignored tmp/. See BOOK_PREVIEWS_RELEASE.md.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { parseEnv } from 'node:util';
import { pathToFileURL } from 'node:url';
import { neon } from '@neondatabase/serverless';

export const IDS = ['book-1746324080859', 'book-1788793702419', 'book-1788814362610', 'book-1788814413810'];
const NEW_IDS = IDS.slice(1);
const SITE = 'https://pc-library.vercel.app';
const MANIFEST = 'tmp/preview-transfer-20260908/manifest.json';
const TABLES = { books: 'id', book_previews: 'book_id' };
const digest = value => createHash('sha256').update(value).digest('hex');
const canonical = value => JSON.stringify(value, function (_key, item) {
    return item && typeof item === 'object' && !Array.isArray(item)
        ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b))) : item;
});
const equal = (a, b) => canonical(a) === canonical(b);
const quote = name => { assert.match(name, /^[a-z_][a-z_0-9]*$/); return `"${name}"`; };
const rows = result => Array.isArray(result) ? result : result.rows;

export const SNAPSHOT_SQL = `SELECT jsonb_build_object(
    'books', COALESCE((SELECT jsonb_agg(to_jsonb(b) ORDER BY id) FROM books b), '[]'::jsonb),
    'book_previews', COALESCE((SELECT jsonb_agg(to_jsonb(p) ORDER BY book_id) FROM book_previews p), '[]'::jsonb)
) AS snapshot`;
const SCHEMA_SQL = `SELECT table_name, column_name, udt_name, is_nullable, column_default,
    is_generated, generation_expression, is_identity FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name IN ('books', 'book_previews')
    ORDER BY table_name, ordinal_position`;
const GUARD_SQL = `SELECT 1 / ((snapshot = $1::jsonb)::integer) AS unchanged FROM (${SNAPSHOT_SQL}) s`;

export function scoped(snapshot) {
    return Object.fromEntries(Object.entries(TABLES).map(([table, key]) =>
        [table, snapshot[table].filter(row => IDS.includes(row[key]))]));
}

export function desiredState(source, before) {
    assert.deepEqual(source.books.map(b => b.id).sort(), [...IDS].sort(), 'Source must contain all four books');
    assert.deepEqual(source.book_previews.map(p => p.book_id).sort(), [...IDS].sort(), 'Source must contain all four previews');
    assert.equal(before.books.filter(b => b.id === IDS[0]).length, 1, 'Existing production book is missing');
    const after = structuredClone(before);
    for (const id of NEW_IDS) {
        const book = source.books.find(b => b.id === id);
        assert.equal(book.is_reading_visible, false);
        assert.equal(book.is_audio_visible, false);
        assert.equal(Number(book.is_visible), 0);
        assert.equal(Number(book.is_preview), 1);
        const existing = before.books.find(b => b.id === id);
        assert.ok(!existing || equal(existing, book), `Conflicting destination book: ${id}`);
        if (!existing) after.books.push(book);
    }
    for (const preview of source.book_previews) {
        assert.equal(preview.is_visible, true);
        const existing = before.book_previews.find(p => p.book_id === preview.book_id);
        assert.ok(!existing || equal(existing, preview), `Conflicting destination preview: ${preview.book_id}`);
        if (!existing) after.book_previews.push(preview);
    }
    for (const [table, key] of Object.entries(TABLES)) after[table].sort((a, b) => a[key].localeCompare(b[key]));
    return after;
}

// SQL identifiers come only from the two-table schema, and must be simple identifiers.
// jsonb_populate_record preserves PostgreSQL date/timestamp precision and array values.
export function transactionStatements(before, after, schema, rollback = false, dependencies = []) {
    const expected = rollback ? after : before;
    const result = rollback ? before : after;
    const statements = [
        { sql: "SET LOCAL lock_timeout = '5s'", params: [] },
        { sql: "SET LOCAL statement_timeout = '30s'", params: [] },
        { sql: 'LOCK TABLE books, book_previews IN SHARE ROW EXCLUSIVE MODE', params: [] },
        { sql: GUARD_SQL, params: [JSON.stringify(expected)] },
    ];
    if (rollback) {
        const insertedIds = after.books.filter(b => !before.books.some(old => old.id === b.id)).map(b => b.id);
        // Refuse rollback if any other child records now reference the inserted books.
        for (const dep of dependencies) {
            if (dep.table_schema === 'public' && dep.table_name === 'book_previews') continue;
            const table = `${quote(dep.table_schema)}.${quote(dep.table_name)}`;
            statements.push({ sql: `LOCK TABLE ${table} IN SHARE ROW EXCLUSIVE MODE`, params: [] });
            statements.push({ sql: `SELECT 1 / ((NOT EXISTS (SELECT 1 FROM ${table} WHERE ${quote(dep.column_name)} = ANY($1::text[])))::integer) AS no_new_dependencies`, params: [insertedIds] });
        }
        for (const [table, key] of Object.entries(TABLES).reverse()) {
            const inserted = after[table].filter(row => !before[table].some(old => old[key] === row[key]));
            for (const row of inserted) statements.push({ sql: `DELETE FROM ${quote(table)} WHERE ${quote(key)} = $1`, params: [row[key]] });
        }
    } else {
        for (const [table, key] of Object.entries(TABLES)) {
            const columns = schema.filter(c => c.table_name === table && c.is_generated === 'NEVER' && c.is_identity === 'NO');
            assert.ok(columns.length);
            const names = columns.map(c => quote(c.column_name)).join(', ');
            for (const row of after[table].filter(row => !before[table].some(old => old[key] === row[key]))) {
                assert.ok((table === 'books' ? NEW_IDS : IDS).includes(row[key]), 'Out-of-scope insertion');
                statements.push({
                    sql: `INSERT INTO ${quote(table)} (${names}) SELECT ${names} FROM jsonb_populate_record(NULL::${quote(table)}, $1::jsonb)`,
                    params: [JSON.stringify(row)],
                });
            }
        }
    }
    // Runs inside the same transaction: triggers, precision loss or generated-column
    // differences roll back all writes, including changes to unrelated rows.
    statements.push({ sql: GUARD_SQL, params: [JSON.stringify(result)] });
    statements.push({ sql: SNAPSHOT_SQL, params: [] });
    return statements;
}

async function config(file) { return parseEnv(await fs.readFile(file, 'utf8')); }
function databaseIdentity(url) {
    const db = new URL(url);
    return digest(db.hostname.replace('-pooler.', '.') + db.pathname);
}

async function verifyVercel(targetUrl) {
    const project = JSON.parse(await fs.readFile('.vercel/repo.json', 'utf8')).projects.find(p => p.name === 'pc-library');
    assert.ok(project, 'Linked Vercel pc-library project required');
    const authFile = process.env.VERCEL_AUTH_FILE || path.join(process.env.APPDATA, 'xdg.data/com.vercel.cli/auth.json');
    const token = process.env.VERCEL_TOKEN || JSON.parse(await fs.readFile(authFile, 'utf8')).token;
    const response = await fetch(`https://api.vercel.com/v10/projects/${project.id}/env?teamId=${project.orgId}`, {
        headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(20000),
    });
    assert.equal(response.status, 200, 'Vercel login required to verify the production database');
    const data = await response.json();
    const db = data.envs.find(e => e.key === 'DATABASE_URL' && e.target?.includes('production'));
    assert.ok(db?.id, 'Production DATABASE_URL could not be found');
    const decrypted = await fetch(`https://api.vercel.com/v1/projects/${project.id}/env/${db.id}?teamId=${project.orgId}`, {
        headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(20000),
    });
    assert.equal(decrypted.status, 200, 'Production DATABASE_URL could not be verified');
    const setting = await decrypted.json();
    assert.ok(setting.value?.startsWith('postgres'), 'Expected a database connection string');
    assert.equal(databaseIdentity(setting.value), databaseIdentity(targetUrl), 'Vercel production database does not match target');
    return { projectId: project.id, site: SITE, databaseIdentity: databaseIdentity(targetUrl), verifiedAt: new Date().toISOString() };
}

async function assetsFor(source) {
    const assets = new Map();
    async function add(file, url) {
        const bytes = await fs.readFile(file);
        assets.set(file, { file, url, bytes: bytes.length, sha256: digest(bytes) });
    }
    for (const p of source.book_previews) {
        const b = source.books.find(b => b.id === p.book_id);
        const cover = p.cover_path || b.cover_image;
        if (cover && cover !== '@placeholder') {
            assert.match(cover, /^[a-zA-Z0-9_.-]+$/);
            const root = p.cover_source === 'preview' ? 'public/previews/covers' : 'public/covers';
            await add(`${root}/${cover}`, `/api/preview-assets/${p.cover_source === 'preview' ? 'preview' : 'book'}/${cover}`);
        }
        for (const page of p.extract_image_paths) {
            assert.match(page, /^[a-zA-Z0-9_.-]+$/);
            await add(`public/previews/${p.book_id}/pages/${page}`, `/api/preview-assets/pages/${p.book_id}/${page}`);
        }
    }
    return [...assets.values()];
}

async function verifyAssets(assets, deployed = false) {
    for (const asset of assets) {
        assert.equal(digest(await fs.readFile(asset.file)), asset.sha256, `Local asset changed: ${asset.file}`);
        if (deployed) {
            const response = await fetch(SITE + asset.url, { signal: AbortSignal.timeout(20000) });
            assert.equal(response.status, 200, `Missing deployed asset: ${asset.url}`);
            assert.ok(response.headers.get('content-type')?.startsWith('image/'));
            assert.equal(digest(Buffer.from(await response.arrayBuffer())), asset.sha256, `Deployed image differs: ${asset.url}`);
        }
    }
}

const snapshot = async sql => rows(await sql.query(SNAPSHOT_SQL))[0].snapshot;
async function writeJson(filename, data) {
    await fs.mkdir(path.dirname(filename), { recursive: true });
    await fs.writeFile(filename, JSON.stringify(data, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
}
function summary(manifest) {
    return {
        manifest: MANIFEST, target: SITE,
        booksToInsert: manifest.after.books.filter(b => !manifest.before.books.some(old => old.id === b.id)).map(b => ({ id: b.id, title: b.title })),
        previewsToInsert: manifest.after.book_previews.filter(p => !manifest.before.book_previews.some(old => old.book_id === p.book_id)).map(p => p.book_id),
        existingBookUnchanged: equal(manifest.before.books.find(b => b.id === IDS[0]), manifest.after.books.find(b => b.id === IDS[0])),
        assets: manifest.assets.map(a => ({ file: a.file, bytes: a.bytes, sha256: a.sha256 })),
    };
}

export async function main(args = process.argv.slice(2)) {
    assert.ok(args.length <= 1 && (!args.length || ['--apply', '--rollback', '--verify'].includes(args[0])), 'Use no arguments (dry run), --apply, --verify or --rollback');
    const sourceUrl = (await config('.env.local')).DATABASE_URL;
    const targetUrl = (await config('.env.production')).DATABASE_URL;
    assert.notEqual(databaseIdentity(sourceUrl), databaseIdentity(targetUrl), 'Source and target must differ');
    const local = neon(sourceUrl), production = neon(targetUrl);
    const [sourceSchema, targetSchema] = await Promise.all([local.query(SCHEMA_SQL), production.query(SCHEMA_SQL)]);
    assert.deepEqual(rows(sourceSchema), rows(targetSchema), 'Source and destination schemas differ');
    const schema = rows(targetSchema);
    let manifest;
    try { manifest = JSON.parse(await fs.readFile(MANIFEST, 'utf8')); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (!manifest) {
        assert.equal(args.length, 0, 'Run a dry run before applying');
        const [source, before] = await Promise.all([snapshot(local).then(scoped), snapshot(production)]);
        const after = desiredState(source, before);
        manifest = { version: 1, createdAt: new Date().toISOString(), targetIdentity: databaseIdentity(targetUrl), schema, source, before, after, assets: await assetsFor(source) };
        await writeJson(MANIFEST, manifest);
        for (const asset of manifest.assets) {
            const destination = path.join(path.dirname(MANIFEST), 'assets', asset.file);
            await fs.mkdir(path.dirname(destination), { recursive: true });
            await fs.copyFile(asset.file, destination, 1);
        }
    }
    assert.equal(manifest.targetIdentity, databaseIdentity(targetUrl), 'Target changed since backup');
    assert.deepEqual(manifest.schema, schema, 'Schema changed since backup');
    assert.deepEqual(desiredState(manifest.source, manifest.before), manifest.after, 'Invalid manifest');
    console.log(JSON.stringify(summary(manifest), null, 2));
    if (!args.length) {
        await verifyAssets(manifest.assets);
        console.log('Dry run complete. No database writes. Assets and full destination book/preview backup saved.');
        return;
    }
    const verification = await verifyVercel(targetUrl);
    const current = await snapshot(production);
    const rollback = args[0] === '--rollback';
    const expected = rollback ? manifest.after : manifest.before;
    const intended = rollback ? manifest.before : manifest.after;
    if (equal(scoped(current), scoped(intended))) {
        console.log('Target already matches. No writes performed.');
        if (args[0] === '--verify') {
            await verifyAssets(manifest.assets, true);
            assert.deepEqual(current, manifest.after, 'Unrelated book/preview records changed since backup');
            console.log('All transferred fields, assets and unrelated book/preview records verified.');
        }
        return;
    }
    assert.notEqual(args[0], '--verify', 'Target does not match source');
    assert.deepEqual(current, expected, 'Destination changed since backup; refusing to overwrite');
    if (!rollback) {
        assert.deepEqual(scoped(await snapshot(local)), manifest.source, 'Source changed since dry run');
        await verifyAssets(manifest.assets, true);
    }
    const dependencies = rollback ? rows(await production.query(`SELECT ns.nspname AS table_schema, cl.relname AS table_name, a.attname AS column_name
        FROM pg_constraint c JOIN pg_class cl ON cl.oid=c.conrelid JOIN pg_namespace ns ON ns.oid=cl.relnamespace
        JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=ANY(c.conkey)
        WHERE c.contype='f' AND c.confrelid='public.books'::regclass`)) : [];
    const statements = transactionStatements(manifest.before, manifest.after, schema, rollback, dependencies);
    const result = await production.transaction(tx => statements.map(s => tx.query(s.sql, s.params)));
    assert.deepEqual(rows(result.at(-1))[0].snapshot, intended);
    await writeJson(`${path.dirname(MANIFEST)}/${rollback ? 'rollback' : 'applied'}-${Date.now()}.json`, { verification, completedAt: new Date().toISOString(), snapshot: intended });
    console.log(rollback ? 'Rollback complete. Original destination state restored.' : 'Transfer committed. All fields and unrelated book/preview records match the expected state.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
    main().catch(error => {
        // Assertions may contain whole records; do not print assertion objects or secrets.
        console.error(String(error.message).split('\n')[0].replace(/postgres(?:ql)?:\/\/\S+/g, '[database URL redacted]'));
        process.exitCode = 1;
    });
}
