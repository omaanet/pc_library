// src/app/api/covers/[...params]/route.ts
import { type NextRequest } from 'next/server';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

// Types
interface PathParams {
    params: string[];
}

interface ImageDimensions {
    width: number;
    height: number;
}

interface PlaceholderOptions extends ImageDimensions {
    bookId?: string;
    quality?: number;
}

// Constants
const COVERS_DIR = path.join(process.cwd(), 'public', 'covers');
const CACHE_CONTROL = {
    public: 'public, max-age=31536000, immutable',
};

// Type guard for valid dimensions
function isValidDimensions(width: unknown, height: unknown): width is number {
    return !isNaN(Number(width)) && !isNaN(Number(height)) &&
        Number(width) > 0 && Number(height) > 0 &&
        Number(width) <= 2000 && Number(height) <= 2000;
}

// Helper 1: Generate gradient definition
function createGradientSVG(hue: number): string {
    return `
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:hsl(${hue},70%,85%);stop-opacity:1" />
        <stop offset="100%" style="stop-color:hsl(${hue},70%,75%);stop-opacity:1" />
    </linearGradient>`;
}

// Helper 2: Generate pattern definition
function createPatternSVG(): string {
    return `
    <pattern id="pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
        <rect width="20" height="20" fill="url(#grad)"/>
        <path d="M0 20L20 0M-1 1L1 -1M19 21L21 19" stroke="white" stroke-width="0.5" opacity="0.2"/>
    </pattern>`;
}

// Helper 3: Generate text element
function createTextSVG(width: number, height: number, fontSize: number): string {
    return `
    <text x="50%" y="50%" font-family="system-ui, sans-serif" 
          font-size="${fontSize}px" fill="white" text-anchor="middle" 
          dominant-baseline="middle">
        ${width}×${height}
    </text>`;
}

// Main function
async function generatePlaceholder({
    width,
    height,
    bookId,
    quality = 80
}: PlaceholderOptions): Promise<Buffer> {
    const hue = bookId ?
        Math.abs(bookId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360) :
        Math.floor(Math.random() * 360);

    const fontSize = Math.min(width, height) * (width > 300 ? 0.08 : 0.1);

    const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
            ${createGradientSVG(hue)}
            ${createPatternSVG()}
        </defs>
        <rect width="100%" height="100%" fill="url(#pattern)"/>
        <rect width="90%" height="90%" x="5%" y="5%" 
              fill="url(#grad)" stroke="white" stroke-width="1" stroke-opacity="0.3"/>
        ${createTextSVG(width, height, fontSize)}
    </svg>`;

    return sharp(Buffer.from(svg))
        .png({ quality })
        .toBuffer();
}

/**
 * Processes and optimizes a real image file
 */
async function processImage(
    filePath: string,
    width: number,
    height: number,
    quality = 80,
    fit: 'contain' | 'inside' = 'contain'
): Promise<Buffer> {
    try {
        const image = sharp(filePath);
        const metadata = await image.metadata();

        // Ensure an alpha channel exists before any processing
        // If it doesn't have alpha, add a fully transparent one.
        // Also call ensureAlpha if it *does* have alpha, to ensure consistency.
        image.ensureAlpha();

        // Handle animations if present
        const isAnimated = metadata.pages && metadata.pages > 1;
        if (isAnimated) {
            // Just optimize without resizing animated content
            return image
                .webp({
                    quality,
                    effort: 6, // Higher compression effort
                    smartSubsample: true, // Better chroma subsampling
                    force: true // Force WebP output
                })
                .toBuffer();
        }

        // Only resize if the target dimensions are smaller than the original
        if (metadata.width && metadata.height &&
            (width < metadata.width || height < metadata.height)) {
            image.resize({
                width,
                height,
                fit,
                // Use black transparent background {r:0,g:0,b:0,alpha:0}
                background: { r: 255, g: 255, b: 0, alpha: 0 },
                kernel: 'lanczos3', // High-quality resampling
                withoutEnlargement: true, // Prevent upscaling beyond original size
                fastShrinkOnLoad: true // Optimize initial scaling operations
            });

            // Apply a subtle sharpening effect after resize to enhance details
            image.sharpen({
                sigma: 0.5, // Radius of the Gaussian mask
                m1: 0.2,    // Flat areas sharpening
                m2: 0.3,    // Edge sharpening
                x1: 2,      // Threshold for flat areas
                y2: 10,     // Threshold for edge areas
                y3: 20      // Maximum sharpening
            });

            // Ensure alpha again after resize/sharpen
            image.ensureAlpha();
        }

        // Convert to WebP with enhanced options
        return image
            .webp({
                quality,
                alphaQuality: 100,        // Preserve alpha channel quality
                lossless: quality >= 95,  // Use lossless for very high quality requests
                nearLossless: quality >= 90 && quality < 95, // Near lossless for high quality
                smartSubsample: true,     // Better chroma subsampling
                effort: 6,                // Higher compression effort (0-6)
                loop: 0,                  // Default loop setting
                delay: 100,               // Default delay between frames if animated
                force: true              // Force WebP output
            })
            .withMetadata({
                orientation: metadata.orientation, // Preserve orientation
                density: metadata.density          // Preserve density information
            })
            .toBuffer();
    } catch (error) {
        console.error('Error processing image:', error);
        throw new Error(`Failed to process image: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
}

/**
 * Places a cover inside an exact-size transparent canvas without cropping.
 */
async function processCoverImage(
    filePath: string,
    width: number,
    height: number,
    quality = 80
): Promise<Buffer> {
    try {
        const image = sharp(filePath);
        const metadata = await image.metadata();
        const isAnimated = metadata.pages && metadata.pages > 1;

        // Keep animated-cover behavior aligned with the default processing path.
        if (isAnimated) {
            return image
                .ensureAlpha()
                .webp({
                    quality,
                    effort: 6,
                    smartSubsample: true,
                    force: true
                })
                .toBuffer();
        }

        const shouldDownscale = Boolean(
            metadata.width &&
            metadata.height &&
            (metadata.width > width || metadata.height > height)
        );

        image
            .ensureAlpha()
            .resize({
                width,
                height,
                fit: 'contain',
                position: 'centre',
                background: { r: 0, g: 0, b: 0, alpha: 0 },
                kernel: 'lanczos3',
                withoutEnlargement: true,
                fastShrinkOnLoad: true
            });

        if (shouldDownscale) {
            image.sharpen({
                sigma: 0.5,
                m1: 0.2,
                m2: 0.3,
                x1: 2,
                y2: 10,
                y3: 20
            });
        }

        return image
            .ensureAlpha()
            .webp({
                quality,
                alphaQuality: 100,
                lossless: quality >= 95,
                nearLossless: quality >= 90 && quality < 95,
                smartSubsample: true,
                effort: 6,
                loop: 0,
                delay: 100,
                force: true
            })
            .withMetadata({
                orientation: metadata.orientation,
                density: metadata.density
            })
            .toBuffer();
    } catch (error) {
        console.error('Error processing cover image:', error);
        throw new Error(`Failed to process cover image: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
}

/**
 * Produces the fixed landscape JPEG used by Open Graph and messaging clients.
 */
async function processSocialImage(
    input: string | Buffer,
    width: number,
    height: number,
    quality = 90
): Promise<Buffer> {
    const cover = await sharp(input)
        .rotate()
        .resize({
            width: Math.round(width * 0.34),
            height: Math.round(height * 0.9),
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();
    const coverMetadata = await sharp(cover).metadata();
    const coverWidth = coverMetadata.width ?? Math.round(width * 0.34);
    const coverHeight = coverMetadata.height ?? Math.round(height * 0.9);
    const framePadding = Math.max(8, Math.round(width * 0.008));
    const frameWidth = coverWidth + framePadding * 2;
    const frameHeight = coverHeight + framePadding * 2;
    const frameLeft = Math.round((width - frameWidth) / 2);
    const frameTop = Math.round((height - frameHeight) / 2);
    const coverLeft = frameLeft + framePadding;
    const coverTop = frameTop + framePadding;

    const backdrop = Buffer.from(`
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="base" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#081916"/>
                    <stop offset="58%" stop-color="#12342e"/>
                    <stop offset="100%" stop-color="#10231f"/>
                </linearGradient>
                <radialGradient id="leaf" cx="10%" cy="15%" r="55%">
                    <stop offset="0%" stop-color="#a7d977" stop-opacity="0.42"/>
                    <stop offset="100%" stop-color="#a7d977" stop-opacity="0"/>
                </radialGradient>
                <radialGradient id="gold" cx="86%" cy="8%" r="50%">
                    <stop offset="0%" stop-color="#efc866" stop-opacity="0.34"/>
                    <stop offset="100%" stop-color="#efc866" stop-opacity="0"/>
                </radialGradient>
                <radialGradient id="coral" cx="72%" cy="84%" r="58%">
                    <stop offset="0%" stop-color="#f28c6f" stop-opacity="0.26"/>
                    <stop offset="100%" stop-color="#f28c6f" stop-opacity="0"/>
                </radialGradient>
                <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="22"/>
                </filter>
            </defs>
            <rect width="100%" height="100%" fill="url(#base)"/>
            <rect width="100%" height="100%" fill="url(#leaf)"/>
            <rect width="100%" height="100%" fill="url(#gold)"/>
            <rect width="100%" height="100%" fill="url(#coral)"/>
            <rect
                x="${frameLeft - 18}"
                y="${frameTop - 14}"
                width="${frameWidth + 36}"
                height="${frameHeight + 36}"
                rx="28"
                fill="#a7d977"
                fill-opacity="0.28"
                filter="url(#shadow)"
            />
            <rect
                x="${frameLeft}"
                y="${frameTop}"
                width="${frameWidth}"
                height="${frameHeight}"
                rx="18"
                fill="#fff8e8"
                fill-opacity="0.94"
                stroke="#ffffff"
                stroke-opacity="0.38"
                stroke-width="2"
            />
        </svg>
    `);

    return sharp(backdrop)
        .composite([{ input: cover, left: coverLeft, top: coverTop }])
        .flatten({ background: '#081916' })
        .jpeg({
            quality,
            chromaSubsampling: '4:4:4',
            progressive: true,
        })
        .toBuffer();
}

/**
 * Route handler for cover images
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<PathParams> }
) {
    try {
        const awaitedParams = await params;

        // Parse path parameters
        const [width, height, ...imagePath] = awaitedParams.params;

        // Validate dimensions
        if (!isValidDimensions(Number(width), Number(height))) {
            return new Response('Invalid dimensions', { status: 400 });
        }

        const dimensions: ImageDimensions = {
            width: Number(width),
            height: Number(height)
        };
        const isSocialImage = req.nextUrl.searchParams.get('variant')?.startsWith('social') ?? false;
        const quality = Number(req.nextUrl.searchParams.get('q')) || (isSocialImage ? 90 : 80);

        // Handle placeholder requests
        if (imagePath[0] === '@placeholder') {
            const bookId = req.nextUrl.searchParams.get('bookId') ?? undefined;
            const placeholderDimensions = isSocialImage
                ? { width: 400, height: 600 }
                : dimensions;
            const placeholder = await generatePlaceholder({
                ...placeholderDimensions,
                bookId,
                quality,
            });
            const buffer = isSocialImage
                ? await processSocialImage(placeholder, dimensions.width, dimensions.height, quality)
                : placeholder;

            return new Response(buffer.buffer as ArrayBuffer, {
                headers: {
                    'Content-Type': isSocialImage ? 'image/jpeg' : 'image/png',
                    'Cache-Control': CACHE_CONTROL.public,
                },
            });
        }

        // Handle real image files 
        const filePath = path.join(COVERS_DIR, ...imagePath);

        // Security check: Ensure the resolved path is within COVERS_DIR
        const resolvedPath = path.resolve(filePath);
        if (!resolvedPath.startsWith(COVERS_DIR)) {
            return new Response('Invalid path', { status: 400 });
        }

        // Check if file exists
        try {
            await fs.access(filePath);
        } catch {
            // File doesn't exist, generate a placeholder
            const placeholderDimensions = isSocialImage
                ? { width: 400, height: 600 }
                : dimensions;
            const placeholder = await generatePlaceholder({
                ...placeholderDimensions,
                bookId: req.nextUrl.searchParams.get('bookId') ?? undefined,
                quality,
            });
            const buffer = isSocialImage
                ? await processSocialImage(placeholder, dimensions.width, dimensions.height, quality)
                : placeholder;

            return new Response(buffer.buffer as ArrayBuffer, {
                headers: {
                    'Content-Type': isSocialImage ? 'image/jpeg' : 'image/png',
                    'Cache-Control': CACHE_CONTROL.public,
                },
            });
        }

        if (isSocialImage) {
            const buffer = await processSocialImage(
                filePath,
                dimensions.width,
                dimensions.height,
                quality
            );

            return new Response(buffer.buffer as ArrayBuffer, {
                headers: {
                    'Content-Type': 'image/jpeg',
                    'Cache-Control': CACHE_CONTROL.public,
                },
            });
        }

        // Process and serve the image
        const buffer = req.nextUrl.searchParams.get('mode') === 'cover'
            ? await processCoverImage(
                filePath,
                dimensions.width,
                dimensions.height,
                quality
            )
            : await processImage(
                filePath,
                dimensions.width,
                dimensions.height,
                quality,
                req.nextUrl.searchParams.get('fit') === 'inside' ? 'inside' : 'contain'
            );

        return new Response(buffer.buffer as ArrayBuffer, {
            headers: {
                'Content-Type': 'image/webp',
                'Cache-Control': CACHE_CONTROL.public,
            },
        });
    } catch (error) {
        console.error('Error handling image request:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}
