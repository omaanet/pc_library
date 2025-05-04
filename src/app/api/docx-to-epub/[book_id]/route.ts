import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';

// Helper: Save uploaded file to temp location
async function saveUploadedFile(formData: FormData, tempDir: string) {
    const file = formData.get('file') as File;
    if (!file) throw new Error('No file uploaded');
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const tempPath = path.join(tempDir, `${Date.now()}_${file.name}`);
    await fs.writeFile(tempPath, buffer);
    return tempPath;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ book_id: string }> }): Promise<NextResponse> {
    try {
        const { book_id: bookId } = await params;
        const tempDir = path.resolve('./tmp');
        await fs.mkdir(tempDir, { recursive: true });
        // Read form data once
        const formData = await request.formData();
        // Save DOCX file
        const docxPath = await saveUploadedFile(formData, tempDir);

        // Get title from form data
        const title = (formData.get('title') as string) || '';
        // const author = (formData.get('author') as string) || 'Unknown';
        const author = 'Piero Carbonetti';

        // Prepare output path
        const outputDir = path.resolve(`./public/epub/${bookId}`);
        await fs.mkdir(outputDir, { recursive: true });
        const outputPath = path.join(outputDir, 'output.epub');

        // Calibre path (customize as needed)
        const calibrePath = 'G:/Utils/Calibre Portable/Calibre/ebook-convert.exe';

        // Build args (customize as needed)
        const args = [
            docxPath,
            outputPath,
            '--output-profile', 'default',
            '--title', title,
            '--authors', author,
            '--epub-version', '3',
            '--no-default-epub-cover',
            '--preserve-cover-aspect-ratio',
            '--embed-all-fonts',
            '--subset-embedded-fonts',
            '--keep-ligatures',
            '--level1-toc', '//h:h1',
            '--chapter-mark', 'pagebreak',
            '--chapter', "//*[((name()='h1' or name()='h2') and re:test(., '\s*((chapter|book|section|part)\\s+)|((prolog|prologue|epilogue)(\\s+|$))', 'i')) or @class = 'chapter']"
        ];

        // Spawn Calibre process
        await new Promise<void>((resolve, reject) => {
            const proc = spawn(calibrePath, args, { stdio: 'ignore' });
            proc.on('error', reject);
            proc.on('exit', code => {
                if (code === 0) resolve();
                else reject(new Error(`Calibre exited with code ${code}`));
            });
        });

        // Clean up temp file
        await fs.unlink(docxPath);
        // Confirm EPUB file exists
        let epubExists = false;
        try {
            await fs.access(outputPath);
            epubExists = true;
        } catch { }
        return NextResponse.json({ success: true, epub: `/epub/${bookId}/output.epub`, exists: epubExists });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
