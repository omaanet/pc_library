import fs from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';

import { requireManagedPageAccess } from '@/lib/admin-auth';
import { handleApiError } from '@/lib/api-error-handler';

const COVERS_DIR = path.join(process.cwd(), 'public', 'covers');
const IMAGE_EXTENSIONS = new Set([
    '.avif',
    '.gif',
    '.jpeg',
    '.jpg',
    '.png',
    '.svg',
    '.webp',
]);
const coverPathCollator = new Intl.Collator('it', {
    numeric: true,
    sensitivity: 'base',
});

async function listCoverImages(
    directory: string,
    relativeDirectory = ''
): Promise<string[]> {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    const covers = await Promise.all(entries.map(async (entry) => {
        const relativePath = relativeDirectory
            ? path.join(relativeDirectory, entry.name)
            : entry.name;

        if (entry.isDirectory()) {
            return listCoverImages(path.join(directory, entry.name), relativePath);
        }

        if (!entry.isFile() || !IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
            return [];
        }

        return [relativePath.split(path.sep).join('/')];
    }));

    return covers.flat();
}

export async function GET() {
    try {
        await requireManagedPageAccess('books');

        const covers = await listCoverImages(COVERS_DIR);
        covers.sort((left, right) => coverPathCollator.compare(left, right));

        return NextResponse.json(
            { covers },
            {
                headers: {
                    'Cache-Control': 'no-store',
                },
            }
        );
    } catch (error) {
        console.error('[Covers API] Failed to list covers:', error);
        return handleApiError(error, 'Failed to list cover images');
    }
}
