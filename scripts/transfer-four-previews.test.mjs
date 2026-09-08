import assert from 'node:assert/strict';
import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import { IDS, SNAPSHOT_SQL, desiredState, transactionStatements, scoped } from './transfer-four-previews.mjs';

async function fixture() {
    const db = new PGlite();
    await db.exec(`SET TIME ZONE 'UTC'; CREATE TABLE books (
        id text PRIMARY KEY, title text NOT NULL, is_preview integer,
        is_reading_visible boolean NOT NULL, is_audio_visible boolean NOT NULL,
        is_visible integer GENERATED ALWAYS AS (CASE WHEN is_reading_visible OR is_audio_visible THEN 1 ELSE 0 END) STORED,
        created_at timestamp DEFAULT '2026-09-07 11:12:13.123456'
    );
    CREATE TABLE book_previews (
        book_id text PRIMARY KEY REFERENCES books(id) ON DELETE CASCADE,
        title text NOT NULL, is_visible boolean NOT NULL, extract_image_paths text[],
        expected_publication_date date, updated_at timestamptz DEFAULT '2026-09-07 11:12:13.654321+00'
    );
    CREATE TABLE comments (book_id text REFERENCES books(id) ON DELETE CASCADE, body text);`);
    await db.query('INSERT INTO books(id,title,is_preview,is_reading_visible,is_audio_visible) VALUES ($1,$2,0,false,false),($3,$4,0,true,false)', [IDS[0], 'Existing production title', 'unrelated', 'Unrelated']);
    const before = (await db.query(SNAPSHOT_SQL)).rows[0].snapshot;
    const source = {
        books: IDS.map(id => ({ ...before.books[0], id, title: `Local ${id}`, is_preview: 1 })),
        book_previews: IDS.map(book_id => ({ book_id, title: `Preview ${book_id}`, is_visible: true, extract_image_paths: ['page-01.png'], expected_publication_date: '2026-12-31', updated_at: '2026-09-07T11:12:13.654321+00:00' })),
    };
    const schema = (await db.query("SELECT table_name,column_name,is_generated,is_identity FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('books','book_previews') ORDER BY table_name,ordinal_position")).rows;
    return { db, before, after: desiredState(source, before), source, schema };
}
async function execute(db, statements) {
    return db.transaction(async tx => {
        let result;
        for (const statement of statements) result = await tx.query(statement.sql, statement.params);
        return result.rows[0].snapshot;
    });
}

test('transfer preserves generated visibility, microseconds, arrays, unrelated rows and existing parent; rerun is empty', async () => {
    const f = await fixture();
    try {
        const actual = await execute(f.db, transactionStatements(f.before, f.after, f.schema));
        assert.deepEqual(actual, f.after);
        assert.deepEqual(actual.books.find(b => b.id === IDS[0]), f.before.books.find(b => b.id === IDS[0]));
        const repeated = desiredState(f.source, actual);
        const statements = transactionStatements(actual, repeated, f.schema);
        assert.equal(statements.some(s => /^(INSERT|UPDATE|DELETE)/.test(s.sql)), false);
        assert.deepEqual(await execute(f.db, statements), actual);
    } finally { await f.db.close(); }
});

test('a changed destination aborts before any insertion', async () => {
    const f = await fixture();
    try {
        await f.db.query('UPDATE books SET title=$1 WHERE id=$2', ['Concurrent edit', IDS[0]]);
        await assert.rejects(execute(f.db, transactionStatements(f.before, f.after, f.schema)), /division by zero/);
        assert.equal((await f.db.query('SELECT count(*)::int AS n FROM book_previews')).rows[0].n, 0);
        assert.equal((await f.db.query('SELECT count(*)::int AS n FROM books')).rows[0].n, 2);
    } finally { await f.db.close(); }
});

test('a failed insert rolls back all earlier inserts', async () => {
    const f = await fixture();
    try {
        await f.db.exec("ALTER TABLE book_previews ADD CHECK (title <> 'Preview book-1788814413810')");
        await assert.rejects(execute(f.db, transactionStatements(f.before, f.after, f.schema)), /check constraint/);
        assert.deepEqual((await f.db.query(SNAPSHOT_SQL)).rows[0].snapshot, f.before);
    } finally { await f.db.close(); }
});

test('rollback restores the exact original tables and refuses later edits', async () => {
    const f = await fixture();
    try {
        await execute(f.db, transactionStatements(f.before, f.after, f.schema));
        const rollback = transactionStatements(f.before, f.after, f.schema, true);
        assert.deepEqual(await execute(f.db, rollback), f.before);
        await execute(f.db, transactionStatements(f.before, f.after, f.schema));
        await f.db.query('UPDATE book_previews SET title=$1 WHERE book_id=$2', ['Later edit', IDS[1]]);
        await assert.rejects(execute(f.db, rollback), /division by zero/);
        assert.equal((await f.db.query('SELECT count(*)::int AS n FROM book_previews')).rows[0].n, 4);
    } finally { await f.db.close(); }
});

test('rollback refuses to cascade-delete new dependent records', async () => {
    const f = await fixture();
    try {
        await execute(f.db, transactionStatements(f.before, f.after, f.schema));
        await f.db.query('INSERT INTO comments VALUES ($1,$2)', [IDS[1], 'Keep this comment']);
        await assert.rejects(execute(f.db, transactionStatements(f.before, f.after, f.schema, true, [{ table_schema: 'public', table_name: 'comments', column_name: 'book_id' }])), /division by zero/);
        assert.deepEqual((await f.db.query(SNAPSHOT_SQL)).rows[0].snapshot, f.after);
    } finally { await f.db.close(); }
});

test('preflight rejects conflicting records and publicly readable new books', async () => {
    const f = await fixture();
    try {
        const conflict = structuredClone(f.before);
        conflict.books.push({ ...f.source.books[1], title: 'Different book' });
        assert.throws(() => desiredState(f.source, conflict), /Conflicting destination book/);
        const bad = structuredClone(f.source);
        bad.books[1].is_reading_visible = true;
        assert.throws(() => desiredState(bad, f.before));
        assert.equal(scoped(f.before).books.length, 1);
    } finally { await f.db.close(); }
});
