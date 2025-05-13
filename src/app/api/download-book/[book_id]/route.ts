import { NextRequest, NextResponse } from "next/server"
import { getBookById } from "@/lib/db"
import { normalizeItalianTitleWithOptions } from "@/lib/utils"

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ book_id: string }> }
) {
    try {
        const bookId = (await params).book_id;

        // Access dynamic route parameters
        // const { book_id: bookId } = params

        // Get book details from database to retrieve the title
        const book = await getBookById(bookId)

        if (!book) {
            return new NextResponse("Book not found", { status: 404 })
        }

        // Convert spaces in title to underscores for the PDF filename
        const formattedTitle = normalizeItalianTitleWithOptions(book.title)

        // Construct the CDN URL for the PDF
        // const pdfUrl = `https://s3.eu-south-1.wasabisys.com/piero-audiolibri/bookshelf/${bookId}/${formattedTitle}.pdf`
        const pdfUrl = `https://s3.eu-south-1.wasabisys.com/piero-audiolibri/bookshelf/${formattedTitle}`

        // Fetch the PDF file from the CDN
        const response = await fetch(pdfUrl)

        if (!response.ok) {
            throw new Error(`Failed to fetch PDF: ${response.statusText}`)
        }

        // Get the file content as an array buffer
        const pdfArrayBuffer = await response.arrayBuffer()

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
        console.error("Error downloading PDF:", error)
        return new NextResponse("Error downloading book", { status: 500 })
    }
}
