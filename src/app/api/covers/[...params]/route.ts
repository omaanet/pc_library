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
    private: 'private, no-cache, no-store, must-revalidate',
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
    quality = 80
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
                fit: 'contain',
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

        // Handle placeholder requests
        if (imagePath[0] === '@placeholder') {
            const { searchParams } = new URL(req.url);
            const buffer = await generatePlaceholder({
                ...dimensions,
                bookId: searchParams.get('bookId') ?? undefined,
                quality: Number(searchParams.get('q')) || 80
            });

            return new Response(buffer, {
                headers: {
                    'Content-Type': 'image/png',
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
            const buffer = await generatePlaceholder(dimensions);
            return new Response(buffer, {
                headers: {
                    'Content-Type': 'image/png',
                    'Cache-Control': CACHE_CONTROL.public,
                },
            });
        }

        // Process and serve the image
        const buffer = await processImage(
            filePath,
            dimensions.width,
            dimensions.height,
            Number(req.nextUrl.searchParams.get('q')) || 80
        );

        return new Response(buffer, {
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