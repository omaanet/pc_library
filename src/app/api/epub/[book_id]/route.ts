import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { stat } from 'fs/promises';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ book_id: string }> }
) {
    try {
        const resolvedParams = await params;
        const { book_id } = resolvedParams;

        // Validate book_id to prevent directory traversal attacks
        if (typeof book_id !== 'string' || !book_id.startsWith('book-')) {
            return new Response('Invalid book ID', { status: 400 });
        }

        // Get the EPUB file path from the public directory
        const filePath = path.join(process.cwd(), 'public', 'epub', book_id, 'output.epub');

        // Check if the file exists
        try {
            await stat(filePath);
        } catch {
            return new Response('File not found', { status: 404 });
        }

        // Create a stream from the file
        const fileStream = fs.createReadStream(filePath);
        const fileStats = await stat(filePath);

        // Return the file as a streaming response
        return new Response(fileStream as unknown as ReadableStream, {
            status: 200,
            headers: {
                'Content-Type': 'application/epub+zip',
                'Content-Length': fileStats.size.toString(),
                'Content-Disposition': `inline; filename="${book_id}.epub"`,
                'Content-Encoding': 'identity',
                'Accept-Ranges': 'bytes',
            },
        });
    } catch (error) {
        console.error('Error serving EPUB file:', error);
        return new Response('Error serving EPUB file', { status: 500 });
    }
}

// export async function GET(
//     request: NextRequest,
//     { params }: { params: Promise<{ book_id: string }> }
// ) {
//     try {
//         const resolvedParams = await params;
//         const { book_id } = resolvedParams;

//         // Validate book_id to prevent directory traversal attacks
//         if (typeof book_id !== 'string' || !book_id.startsWith('book-')) {
//             return new NextResponse('Invalid book ID', { status: 400 });
//         }

//         // Get the EPUB file path from the public directory
//         const filePath = path.join(process.cwd(), 'public', 'epub', book_id, 'output.epub');

//         // Check if the file exists
//         if (!fs.existsSync(filePath)) {
//             return new NextResponse('File not found', { status: 404 });
//         }

//         // Read the file as a buffer
//         const fileBuffer = fs.readFileSync(filePath);

//         // Return the file with appropriate headers
//         return new NextResponse(fileBuffer, {
//             status: 200,
//             headers: {
//                 'Content-Type': 'application/epub+zip',
//                 'Content-Length': fileBuffer.length.toString(),
//                 'Content-Disposition': `inline; filename="${book_id}.epub"`,
//                 'Content-Encoding': 'identity',  // Disable any compression middleware that might be active
//                 'Accept-Ranges': 'bytes',
//                 // 'Cache-Control': 'public, max-age=3600',
//             },
//         });
//     } catch (error) {
//         console.error('Error serving EPUB file:', error);
//         return new NextResponse('Error serving EPUB file', { status: 500 });
//     }
// }