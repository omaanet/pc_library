import { NextRequest, NextResponse } from "next/server"
import { getBookById } from "@/lib/db"
import { normalizeItalianTitleWithOptions } from "@/lib/utils"
import { getSessionUser } from "@/lib/auth-utils"
import { Logger } from "@/lib/logging"
import { User } from "@/types"

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ book_id: string }> }
) {
    let user: User | null = null;
    try {
        // Check if user is authenticated
        user = await getSessionUser(req);

        // If not authenticated, return 401 Unauthorized
        if (!user) {
            return new NextResponse("Autenticazione richiesta per scaricare questo libro", {
                status: 401,
                headers: { 'Content-Type': 'text/plain' }
            });
        }

        const bookId = (await params).book_id;

        // Get book details from database to retrieve the title
        const book = await getBookById(bookId)

        if (!book) {
            return new NextResponse("Libro non trovato", { status: 404 })
        }

        // Convert spaces in title to underscores for the PDF filename
        const formattedTitle = normalizeItalianTitleWithOptions(book.title)

        // Construct the CDN URL for the PDF
        // const pdfUrl = `https://s3.eu-south-1.wasabisys.com/piero-audiolibri/bookshelf/${bookId}/${formattedTitle}.pdf`
        const pdfUrl = `https://s3.eu-south-1.wasabisys.com/piero-audiolibri/bookshelf/${formattedTitle}`

        // Fetch the PDF file from the CDN
        const response = await fetch(pdfUrl)

        if (!response.ok) {
            throw new Error(`Errore scaricamento PDF: ${response.statusText}`)
        }

        // Get the file content as an array buffer
        const pdfArrayBuffer = await response.arrayBuffer()


        // Log the download to system_logs
        const requestContext = Logger.extractRequestContext(req);
        await Logger.info(
            'download-book',
            `Libro scaricato: ${book.title}`,
            {
                bookId,
                bookTitle: book.title,
                fileSize: pdfArrayBuffer.byteLength,
                responseStatus: 200
            },
            {
                userId: user.id.toString(),
                ...requestContext
            }
        );

        // Create a new response with the PDF content
        const newResponse = new NextResponse(pdfArrayBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${formattedTitle}"`,
                'Content-Length': pdfArrayBuffer.byteLength.toString()
            }
        })

        return newResponse
    } catch (error) {
        console.error("Errore scaricamento PDF:", error)

        // Log the error to system_logs
        try {
            const requestContext = Logger.extractRequestContext(req);
            await Logger.error(
                'download-book',
                'Errore scaricamento libro',
                Logger.extractErrorDetails(error),
                {
                    userId: user?.id?.toString(),
                    ...requestContext
                }
            );
        } catch (logError) {
            // Prevent logging errors from affecting response
            console.error("Errore durante il logging:", logError);
        }

        return new NextResponse("Errore scaricamento libro", { status: 500 })
    }
}
