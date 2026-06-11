import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { getNeonClient, runSqlTransaction } from '@/lib/db/client';
import { extractRows, getFirstRow } from '@/lib/db/utils';
import { ApiError, HttpStatus } from '@/lib/api-error-handler';
import type { User } from '@/types';

const MIGRATIONS_DIR = path.join(process.cwd(), 'scripts', 'migrations');
const PREVIEW_LENGTH = 4000;

type MigrationRunRow = {
    filename: string;
    checksum: string;
    executed_by: number | null;
    executed_at: string;
    status: MigrationRunStatus;
};

type MigrationRunStatus = 'executed' | 'archived';

export type PendingMigration = {
    filename: string;
    checksum: string;
    modifiedAt: string;
    size: number;
    preview: string;
};

export type ArchivedMigration = {
    filename: string;
    checksum: string;
    archivedAt: string;
    executedBy: number | null;
    fileExists: boolean;
    currentChecksum: string | null;
    checksumMatches: boolean | null;
    modifiedAt: string | null;
    size: number | null;
    preview: string | null;
};

export type LatestMigrationResponse = {
    pending: boolean;
    migration: PendingMigration | null;
};

export type ArchivedMigrationsResponse = {
    migrations: ArchivedMigration[];
};

export type RunMigrationResponse = {
    success: true;
    migration: {
        filename: string;
        checksum: string;
        executedAt: string;
        status: MigrationRunStatus;
    };
};

export async function ensureMigrationRunsTable(): Promise<void> {
    const client = getNeonClient();

    await client.query(`
        CREATE TABLE IF NOT EXISTS admin_migration_runs (
            filename TEXT PRIMARY KEY,
            checksum TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'executed',
            executed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
            executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            execution_metadata JSONB
        )
    `);

    await client.query(`
        ALTER TABLE admin_migration_runs
        ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'executed'
    `);
}

export async function getLatestPendingMigration(): Promise<LatestMigrationResponse> {
    await ensureMigrationRunsTable();

    const migrationFiles = await readMigrationFiles();
    if (!migrationFiles.length) {
        return { pending: false, migration: null };
    }

    const executedFilenames = await getExecutedMigrationFilenames();
    const latestPendingFile = migrationFiles.find((file) => !executedFilenames.has(file));

    if (!latestPendingFile) {
        return { pending: false, migration: null };
    }

    return {
        pending: true,
        migration: await readMigrationMetadata(latestPendingFile),
    };
}

export async function getArchivedMigrations(): Promise<ArchivedMigrationsResponse> {
    return getMigrationsByStatus('archived');
}

export async function getExecutedMigrations(): Promise<ArchivedMigrationsResponse> {
    return getMigrationsByStatus('executed');
}

async function getMigrationsByStatus(status: MigrationRunStatus): Promise<ArchivedMigrationsResponse> {
    await ensureMigrationRunsTable();

    const client = getNeonClient();
    const rows = extractRows<MigrationRunRow>(
        await client.query(
            `SELECT filename, checksum, status, executed_by, executed_at
             FROM admin_migration_runs
             WHERE status = $1
             ORDER BY filename DESC`,
            [status]
        )
    );

    const migrations = await Promise.all(
        rows.map(async (row) => {
            const metadata = await readMigrationMetadataIfExists(row.filename);

            return {
                filename: row.filename,
                checksum: row.checksum,
                archivedAt: row.executed_at,
                executedBy: row.executed_by,
                fileExists: metadata !== null,
                currentChecksum: metadata?.checksum ?? null,
                checksumMatches: metadata ? metadata.checksum === row.checksum : null,
                modifiedAt: metadata?.modifiedAt ?? null,
                size: metadata?.size ?? null,
                preview: metadata?.preview ?? null,
            };
        })
    );

    return { migrations };
}

export async function runLatestPendingMigration(filename: string, user: User): Promise<RunMigrationResponse> {
    await ensureMigrationRunsTable();
    assertSafeMigrationFilename(filename);

    const latest = await getLatestPendingMigration();
    if (!latest.pending || !latest.migration) {
        throw new ApiError(HttpStatus.CONFLICT, 'No pending migrations are available');
    }

    if (latest.migration.filename !== filename) {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Requested migration is not the latest pending migration',
            { requested: filename, latest: latest.migration.filename }
        );
    }

    const filePath = path.join(MIGRATIONS_DIR, filename);
    const sql = await fs.readFile(filePath, 'utf8');

    try {
        await executeMigrationSql(sql);
    } catch (error) {
        throw new ApiError(
            HttpStatus.INTERNAL_SERVER_ERROR,
            'Migration SQL execution failed',
            error instanceof Error ? error.message : 'Unknown SQL execution error'
        );
    }

    try {
        return await insertMigrationRun(latest.migration, user, 'executed');
    } catch (error) {
        throw new ApiError(
            HttpStatus.INTERNAL_SERVER_ERROR,
            'Migration SQL may have run, but archiving the migration failed',
            error instanceof Error ? error.message : 'Unknown archive error'
        );
    }
}

export async function runArchivedMigration(filename: string, user: User): Promise<RunMigrationResponse> {
    return rerunRecordedMigration(filename, user, 'archived');
}

export async function rerunExecutedMigration(filename: string, user: User): Promise<RunMigrationResponse> {
    return rerunRecordedMigration(filename, user, 'executed');
}

async function rerunRecordedMigration(
    filename: string,
    user: User,
    sourceStatus: MigrationRunStatus
): Promise<RunMigrationResponse> {
    await ensureMigrationRunsTable();
    assertSafeMigrationFilename(filename);

    const label = sourceStatus === 'archived' ? 'Archived' : 'Executed';

    const client = getNeonClient();
    const recorded = getFirstRow<MigrationRunRow>(
        await client.query(
            `SELECT filename, checksum, status, executed_by, executed_at
             FROM admin_migration_runs
             WHERE filename = $1 AND status = $2`,
            [filename, sourceStatus]
        )
    );

    if (!recorded) {
        throw new ApiError(HttpStatus.NOT_FOUND, `${label} migration not found`);
    }

    const migrationFile = await readMigrationFileIfExists(filename);
    if (!migrationFile) {
        throw new ApiError(HttpStatus.NOT_FOUND, `${label} migration SQL file not found`);
    }

    if (migrationFile.checksum !== recorded.checksum) {
        throw new ApiError(
            HttpStatus.CONFLICT,
            `${label} migration checksum does not match current SQL file`,
            {
                recordedChecksum: recorded.checksum,
                currentChecksum: migrationFile.checksum,
            }
        );
    }

    try {
        await executeMigrationSql(migrationFile.sql);
    } catch (error) {
        throw new ApiError(
            HttpStatus.INTERNAL_SERVER_ERROR,
            'Migration SQL execution failed',
            error instanceof Error ? error.message : 'Unknown SQL execution error'
        );
    }

    const updateRes = await client.query<MigrationRunRow>(
        `UPDATE admin_migration_runs
         SET status = 'executed',
             executed_by = $2,
             executed_at = CURRENT_TIMESTAMP,
             execution_metadata = $3::jsonb
         WHERE filename = $1 AND status = $4
         RETURNING filename, checksum, status, executed_by, executed_at`,
        [
            recorded.filename,
            user.id,
            JSON.stringify({
                size: migrationFile.size,
                modifiedAt: migrationFile.modifiedAt,
                ranFromArchive: sourceStatus === 'archived',
                reran: sourceStatus === 'executed',
            }),
            sourceStatus,
        ]
    );

    const executed = getFirstRow(updateRes);
    if (!executed) {
        throw new ApiError(HttpStatus.CONFLICT, `${label} migration was already updated`);
    }

    return {
        success: true,
        migration: {
            filename: executed.filename,
            checksum: executed.checksum,
            executedAt: executed.executed_at,
            status: executed.status,
        },
    };
}

export async function updateMigrationChecksum(filename: string): Promise<RunMigrationResponse> {
    await ensureMigrationRunsTable();
    assertSafeMigrationFilename(filename);

    const client = getNeonClient();
    const recorded = getFirstRow<MigrationRunRow>(
        await client.query(
            `SELECT filename, checksum, status, executed_by, executed_at
             FROM admin_migration_runs
             WHERE filename = $1`,
            [filename]
        )
    );

    if (!recorded) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Migration run not found');
    }

    const migrationFile = await readMigrationFileIfExists(filename);
    if (!migrationFile) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Migration SQL file not found');
    }

    const updateRes = await client.query<MigrationRunRow>(
        `UPDATE admin_migration_runs
         SET checksum = $2
         WHERE filename = $1
         RETURNING filename, checksum, status, executed_by, executed_at`,
        [recorded.filename, migrationFile.checksum]
    );

    const updated = getFirstRow(updateRes);
    if (!updated) {
        throw new ApiError(HttpStatus.CONFLICT, 'Migration checksum could not be updated');
    }

    return {
        success: true,
        migration: {
            filename: updated.filename,
            checksum: updated.checksum,
            executedAt: updated.executed_at,
            status: updated.status,
        },
    };
}

export async function archiveLatestPendingMigration(filename: string, user: User): Promise<RunMigrationResponse> {
    await ensureMigrationRunsTable();
    assertSafeMigrationFilename(filename);

    const latest = await getLatestPendingMigration();
    if (!latest.pending || !latest.migration) {
        throw new ApiError(HttpStatus.CONFLICT, 'No pending migrations are available');
    }

    if (latest.migration.filename !== filename) {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Requested migration is not the latest pending migration',
            { requested: filename, latest: latest.migration.filename }
        );
    }

    return insertMigrationRun(latest.migration, user, 'archived');
}

async function readMigrationFiles(): Promise<string[]> {
    let entries: string[];
    try {
        entries = await fs.readdir(MIGRATIONS_DIR);
    } catch (error) {
        throw new ApiError(
            HttpStatus.INTERNAL_SERVER_ERROR,
            'Unable to read migrations directory',
            error instanceof Error ? error.message : 'Unknown filesystem error'
        );
    }

    return entries
        .filter((entry) => entry.endsWith('.sql'))
        .sort((a, b) => b.localeCompare(a));
}

async function getExecutedMigrationFilenames(): Promise<Set<string>> {
    const client = getNeonClient();
    const rows = extractRows<Pick<MigrationRunRow, 'filename'>>(
        await client.query('SELECT filename FROM admin_migration_runs')
    );

    return new Set(rows.map((row) => row.filename));
}

async function readMigrationMetadata(filename: string): Promise<PendingMigration> {
    assertSafeMigrationFilename(filename);

    const migrationFile = await readMigrationFile(filename);

    return {
        filename,
        checksum: migrationFile.checksum,
        modifiedAt: migrationFile.modifiedAt,
        size: migrationFile.size,
        preview: migrationFile.preview,
    };
}

async function readMigrationMetadataIfExists(filename: string): Promise<PendingMigration | null> {
    const migrationFile = await readMigrationFileIfExists(filename);
    if (!migrationFile) {
        return null;
    }

    return {
        filename,
        checksum: migrationFile.checksum,
        modifiedAt: migrationFile.modifiedAt,
        size: migrationFile.size,
        preview: migrationFile.preview,
    };
}

async function readMigrationFile(filename: string): Promise<PendingMigrationFile> {
    const migrationFile = await readMigrationFileIfExists(filename);
    if (!migrationFile) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Migration SQL file not found');
    }

    return migrationFile;
}

type PendingMigrationFile = {
    sql: string;
    checksum: string;
    modifiedAt: string;
    size: number;
    preview: string;
};

async function readMigrationFileIfExists(filename: string): Promise<PendingMigrationFile | null> {
    assertSafeMigrationFilename(filename);

    const filePath = path.join(MIGRATIONS_DIR, filename);

    try {
        const [sql, stat] = await Promise.all([
            fs.readFile(filePath, 'utf8'),
            fs.stat(filePath),
        ]);

        return {
            sql,
            checksum: createHash('sha256').update(sql).digest('hex'),
            modifiedAt: stat.mtime.toISOString(),
            size: stat.size,
            preview: sql.length > PREVIEW_LENGTH ? `${sql.slice(0, PREVIEW_LENGTH)}\n...` : sql,
        };
    } catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
            return null;
        }

        throw new ApiError(
            HttpStatus.INTERNAL_SERVER_ERROR,
            'Unable to read migration SQL file',
            error instanceof Error ? error.message : 'Unknown filesystem error'
        );
    }
}

async function insertMigrationRun(
    migration: PendingMigration,
    user: User,
    status: MigrationRunStatus
): Promise<RunMigrationResponse> {
    const client = getNeonClient();
    const archiveRes = await client.query<MigrationRunRow>(
        `INSERT INTO admin_migration_runs (
            filename,
            checksum,
            status,
            executed_by,
            execution_metadata
        )
        VALUES ($1, $2, $3, $4, $5::jsonb)
        RETURNING filename, checksum, status, executed_by, executed_at`,
        [
            migration.filename,
            migration.checksum,
            status,
            user.id,
            JSON.stringify({
                size: migration.size,
                modifiedAt: migration.modifiedAt,
            }),
        ]
    );

    const archived = getFirstRow(archiveRes);
    if (!archived) {
        throw new Error('Archive insert returned no rows');
    }

    return {
        success: true,
        migration: {
            filename: archived.filename,
            checksum: archived.checksum,
            executedAt: archived.executed_at,
            status: archived.status,
        },
    };
}

async function executeMigrationSql(sql: string): Promise<void> {
    await runSqlTransaction(splitSqlStatements(sql));
}

function splitSqlStatements(sql: string): string[] {
    const statements: string[] = [];
    let current = '';
    let singleQuote = false;
    let doubleQuote = false;
    let lineComment = false;
    let blockComment = false;
    let dollarQuote: string | null = null;

    for (let i = 0; i < sql.length; i += 1) {
        const char = sql[i];
        const next = sql[i + 1];

        if (lineComment) {
            current += char;
            if (char === '\n') {
                lineComment = false;
            }
            continue;
        }

        if (blockComment) {
            current += char;
            if (char === '*' && next === '/') {
                current += next;
                i += 1;
                blockComment = false;
            }
            continue;
        }

        if (dollarQuote) {
            if (sql.startsWith(dollarQuote, i)) {
                current += dollarQuote;
                i += dollarQuote.length - 1;
                dollarQuote = null;
            } else {
                current += char;
            }
            continue;
        }

        if (singleQuote) {
            current += char;
            if (char === '\'' && next === '\'') {
                current += next;
                i += 1;
            } else if (char === '\'') {
                singleQuote = false;
            }
            continue;
        }

        if (doubleQuote) {
            current += char;
            if (char === '"' && next === '"') {
                current += next;
                i += 1;
            } else if (char === '"') {
                doubleQuote = false;
            }
            continue;
        }

        if (char === '-' && next === '-') {
            current += char + next;
            i += 1;
            lineComment = true;
            continue;
        }

        if (char === '/' && next === '*') {
            current += char + next;
            i += 1;
            blockComment = true;
            continue;
        }

        if (char === '\'') {
            current += char;
            singleQuote = true;
            continue;
        }

        if (char === '"') {
            current += char;
            doubleQuote = true;
            continue;
        }

        if (char === '$') {
            const tag = readDollarQuoteTag(sql, i);
            if (tag) {
                current += tag;
                i += tag.length - 1;
                dollarQuote = tag;
                continue;
            }
        }

        if (char === ';') {
            pushSqlStatement(statements, current);
            current = '';
            continue;
        }

        current += char;
    }

    if (singleQuote || doubleQuote || blockComment || dollarQuote) {
        throw new ApiError(HttpStatus.BAD_REQUEST, 'Migration SQL contains an unterminated quoted block');
    }

    pushSqlStatement(statements, current);
    return statements;
}

function readDollarQuoteTag(sql: string, start: number): string | null {
    const end = sql.indexOf('$', start + 1);
    if (end === -1) {
        return null;
    }

    const tagName = sql.slice(start + 1, end);
    if (tagName !== '' && !/^[A-Za-z_][A-Za-z0-9_]*$/.test(tagName)) {
        return null;
    }

    return sql.slice(start, end + 1);
}

function pushSqlStatement(statements: string[], statement: string): void {
    const trimmed = statement.trim();
    if (hasExecutableSql(trimmed)) {
        statements.push(trimmed);
    }
}

function hasExecutableSql(statement: string): boolean {
    return statement
        .replace(/--.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .trim().length > 0;
}

function assertSafeMigrationFilename(filename: string): void {
    if (!/^[A-Za-z0-9_.-]+\.sql$/.test(filename) || filename.includes('..') || path.basename(filename) !== filename) {
        throw new ApiError(HttpStatus.BAD_REQUEST, 'Invalid migration filename');
    }
}
