// src/app/api/placeholder/[width]/[height]/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface PlaceholderOptions {
    width: number;
    height: number;
    background?: string;
    foreground?: string;
}

function generatePastelColor(): string {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 80%)`;
}

function getContrastColor(background: string): string {
    const hslMatch = background.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (!hslMatch) return '#000000';
    const lightness = parseInt(hslMatch[3]);
    return lightness > 60 ? '#000000' : '#FFFFFF';
}

function generateBookCoverSVG({
    width,
    height,
    background = generatePastelColor(),
    foreground = getContrastColor(background),
}: PlaceholderOptions): string {
    const patternId = `pattern_${Math.random().toString(36).substr(2, 9)}`;
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"
    xmlns="http://www.w3.org/2000/svg">
    <defs>
        <pattern id="${patternId}" patternUnits="userSpaceOnUse"
            width="50" height="50" patternTransform="rotate(45)">
            <rect width="50" height="50" fill="${background}"/>
            <rect width="25" height="25" fill="${foreground}" fill-opacity="0.1"/>
        </pattern>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#${patternId})"/>
    <rect x="10%" y="10%" width="80%" height="80%"
        fill="${background}" stroke="${foreground}"
        stroke-width="2" stroke-opacity="0.2"/>
    <text x="50%" y="50%"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="${Math.min(width, height) * 0.1}px"
        fill="${foreground}"
        text-anchor="middle"
        dominant-baseline="middle">
        ${width} × ${height}
    </text>
    <path d="M ${width * 0.4} ${height * 0.3}
             L ${width * 0.6} ${height * 0.3}
             L ${width * 0.6} ${height * 0.7}
             L ${width * 0.4} ${height * 0.7} Z"
        fill="none"
        stroke="${foreground}"
        stroke-width="2"
        stroke-opacity="0.5"/>
</svg>`;
}

const cacheControl = {
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Content-Type': 'image/svg+xml',
    'Content-Security-Policy': "default-src 'self'; script-src 'none'; sandbox;",
    'X-Content-Type-Options': 'nosniff',
};

type RouteSegment = string;

export interface RouteParams {
    width: RouteSegment;
    height: RouteSegment;
}

// The correct type definition for Next.js App Router dynamic route parameters
export async function GET(
    _request: NextRequest,
    context: { params: Promise<RouteParams> }
): Promise<NextResponse> {
    try {
        const resolvedParams = await context.params;
        const width = parseInt(resolvedParams.width);
        const height = parseInt(resolvedParams.height);

        if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
            return new NextResponse('Invalid dimensions', { status: 400 });
        }

        const maxDimension = 2000;
        if (width > maxDimension || height > maxDimension) {
            return new NextResponse('Dimensions too large', { status: 400 });
        }

        const svg = generateBookCoverSVG({ width, height });

        return new NextResponse(svg, {
            headers: {
                ...cacheControl,
                'Vary': 'Accept',
            },
        });
    } catch (error) {
        console.error('Error generating placeholder:', error);
        return new NextResponse('Error generating placeholder', { status: 500 });
    }
}
