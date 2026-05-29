import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { getNeonClient } from '@/lib/db/client';
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

export type LatestMigrationResponse = {
    pending: boolean;
    migration: PendingMigration | null;
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

    const client = getNeonClient();
    const filePath = path.join(MIGRATIONS_DIR, filename);
    const sql = await fs.readFile(filePath, 'utf8');

    try {
        await client.query(sql);
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

    const filePath = path.join(MIGRATIONS_DIR, filename);
    const [sql, stat] = await Promise.all([
        fs.readFile(filePath, 'utf8'),
        fs.stat(filePath),
    ]);

    return {
        filename,
        checksum: createHash('sha256').update(sql).digest('hex'),
        modifiedAt: stat.mtime.toISOString(),
        size: stat.size,
        preview: sql.length > PREVIEW_LENGTH ? `${sql.slice(0, PREVIEW_LENGTH)}\n...` : sql,
    };
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

function assertSafeMigrationFilename(filename: string): void {
    if (!/^[A-Za-z0-9_.-]+\.sql$/.test(filename) || filename.includes('..') || path.basename(filename) !== filename) {
        throw new ApiError(HttpStatus.BAD_REQUEST, 'Invalid migration filename');
    }
}
