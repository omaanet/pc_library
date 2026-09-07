// Node-only module: imported exclusively by API handlers, never client components.
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { safeAssetPath } from './book-preview';

export const PREVIEW_ASSET_LIMITS = { uploadBytes: 10 * 1024 * 1024, pixels: 40_000_000, coverEdge: 2400 };
const imageTypes: Record<string, string> = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif', '.gif': 'image/gif', '.svg': 'image/svg+xml' };
export type AssetSource = 'preview' | 'book' | 'pages';

export function assetRoot(source: AssetSource, bookId?: string) {
    const publicDir = path.join(process.cwd(), 'public');
    if (source === 'book') return path.join(publicDir, 'covers');
    if (source === 'preview') return path.join(publicDir, 'previews', 'covers');
    if (!bookId || !/^[a-zA-Z0-9_-]+$/.test(bookId) || bookId === 'covers') throw new Error('Identificativo libro non valido');
    return path.join(publicDir, 'previews', bookId, 'pages');
}

function contained(root: string, target: string) {
    const relative = path.relative(root, target);
    return relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative);
}

export async function resolveAsset(root: string, relative: string): Promise<string> {
    if (!safeAssetPath(relative) || !imageTypes[path.extname(relative).toLowerCase()]) throw new Error('Percorso immagine non valido');
    const actualRoot = await fs.realpath(root);
    const actualFile = await fs.realpath(path.resolve(root, relative));
    if (!contained(actualRoot, actualFile) || !(await fs.stat(actualFile)).isFile()) throw new Error('Immagine non valida');
    return actualFile;
}

export async function listAssets(root: string): Promise<string[]> {
    const result: string[] = [];
    async function walk(relative: string) {
        const entries = await fs.readdir(path.join(root, relative), { withFileTypes: true });
        for (const entry of entries) {
            const name = relative ? `${relative}/${entry.name}` : entry.name;
            if (!safeAssetPath(name) || entry.isSymbolicLink()) continue;
            if (entry.isDirectory()) await walk(name);
            else if (entry.isFile() && imageTypes[path.extname(name).toLowerCase()]) {
                await resolveAsset(root, name);
                result.push(name);
            }
        }
    }
    try { await walk(''); } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    return result.sort((a, b) => a.localeCompare(b, 'it', { numeric: true }));
}

export async function readAsset(source: AssetSource, relative: string, bookId?: string) {
    const filename = await resolveAsset(assetRoot(source, bookId), relative);
    return { bytes: await fs.readFile(filename), contentType: imageTypes[path.extname(filename).toLowerCase()] };
}

export async function validatePageImage(bookId: string, relative: string) {
    const filename = await resolveAsset(assetRoot('pages', bookId), relative);
    const metadata = await sharp(await fs.readFile(filename), { limitInputPixels: PREVIEW_ASSET_LIMITS.pixels }).metadata();
    if (!metadata.width || !metadata.height) throw new Error('Immagine pagina non valida');
}

async function decodeUpload(bytes: Buffer) {
    if (!bytes.length || bytes.length > PREVIEW_ASSET_LIMITS.uploadBytes) throw new Error('Immagine troppo grande (massimo 10 MB)');
    const decoder = sharp(bytes, { limitInputPixels: PREVIEW_ASSET_LIMITS.pixels, failOn: 'warning' });
    const metadata = await decoder.metadata();
    if (!['jpeg', 'png', 'webp'].includes(metadata.format || '') || (metadata.pages || 1) > 1) throw new Error('Usa JPEG, PNG o WebP non animati');
    return decoder;
}

export async function uploadCover(bytes: Buffer): Promise<string> {
    const decoder = await decodeUpload(bytes);
    // Fully decode and re-encode, removing metadata and rejecting corrupt data.
    const output = await decoder.rotate().resize({ width: PREVIEW_ASSET_LIMITS.coverEdge, height: PREVIEW_ASSET_LIMITS.coverEdge, fit: 'inside', withoutEnlargement: true }).webp({ quality: 90 }).toBuffer();
    const root = assetRoot('preview');
    await fs.mkdir(root, { recursive: true });
    const name = `${randomUUID()}.webp`;
    await fs.writeFile(path.join(await fs.realpath(root), name), output, { flag: 'wx' });
    return name;
}

export async function uploadPage(bookId: string, bytes: Buffer, originalName: string): Promise<string> {
    const root = assetRoot('pages', bookId);
    const decoder = await decodeUpload(bytes);
    // Decode fully and remove metadata, retaining every source pixel for zoom.
    const output = await decoder.rotate().png().toBuffer();
    const stem = path.basename(originalName, path.extname(originalName)).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 60) || 'pagina';
    const filename = `${stem}-${randomUUID()}.png`;
    await fs.mkdir(root, { recursive: true });
    await fs.writeFile(path.join(await fs.realpath(root), filename), output, { flag: 'wx' });
    return filename;
}
