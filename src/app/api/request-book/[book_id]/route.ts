import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getSessionUser } from '@/lib/auth-utils';
import { getNeonClient, getBookById } from '@/lib/db';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ book_id: string }> }
) {
    try {
        // Get the book ID from params
        const bookId = (await params).book_id;
        // Parse request body if needed
        // const body = await req.json();

        // Verify user is authenticated
        const user = await getSessionUser(req);
        if (!user) {
            return NextResponse.json(
                { error: 'Devi effettuare l\'accesso per richiedere un PDF' },
                { status: 401 }
            );
        }

        const userId = user.id;
        const userEmail = user.email;
        const userName = user.fullName || 'Utente';

        // Get book details
        const book = await getBookById(bookId);

        if (!book) {
            return NextResponse.json(
                { error: 'Libro non trovato' },
                { status: 404 }
            );
        }

        const bookTitle = book.title;
        const requestDate = new Date().toLocaleString('it-IT', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Create email transporter
        const transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port: parseInt(process.env.MAIL_PORT || '587'),
            secure: process.env.MAIL_SECURE === 'true',
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASSWORD,
            },
            tls: process.env.NODE_ENV === 'development' ? {
                rejectUnauthorized: false
            } : undefined,
        });

        // Email content
        const mailOptions = {
            from: process.env.MAIL_FROM || 'noreply@omaa.it',
            to: process.env.NODE_ENV === 'development' ? 'oscar@omaa.it' : 'racconti@pierocarbonetti.it',
            subject: `Richiesta PDF libro: ${bookTitle}`,
            html: `
            <h2>Richiesta PDF</h2>
            <p><strong>Utente:</strong> ${userName} (ID: ${userId})</p>
            <p><strong>Email:</strong> ${userEmail}</p>
            <p><strong>Libro:</strong> ${bookTitle} (ID: ${bookId})</p>
            <p><strong>Data richiesta:</strong> ${requestDate}</p>
        `,
        };

        // Send email
        await transporter.sendMail(mailOptions);
        // console.log(mailOptions, process.env.MAIL_HOST, process.env.MAIL_PORT, process.env.MAIL_SECURE, process.env.MAIL_USER, process.env.MAIL_PASSWORD);

        // Return success response
        return NextResponse.json({
            success: true,
            message: 'Richiesta inviata con successo',
        });

    } catch (error) {
        const is_devenv = process.env.NODE_ENV === 'development';
        console.error('Errore durante l\'invio della richiesta PDF:', error);

        // Estrai informazioni più dettagliate dall'errore
        let errorMessage = 'Si è verificato un errore durante l\'invio della richiesta';
        let errorDetails = {};

        if (error instanceof Error) {
            errorMessage = error.message;
            errorDetails = {
                name: error.name,
                stack: is_devenv ? error.stack : undefined
            };

            // Aggiungi dettagli specifici per errori di nodemailer
            if (is_devenv && 'code' in error) {
                const smtpError = error as Error & { code?: string; responseCode?: number; command?: string; };
                errorDetails = {
                    ...errorDetails,
                    code: smtpError.code,
                    responseCode: smtpError.responseCode,
                    command: smtpError.command
                };

                // Personalizza messaggio in base al codice di errore
                if (smtpError.code === 'ECONNREFUSED') {
                    errorMessage = 'Impossibile connettersi al server email. Verifica le impostazioni SMTP.';
                } else if (smtpError.code === 'ETIMEDOUT') {
                    errorMessage = 'Connessione al server email scaduta. Riprova più tardi.';
                } else if (smtpError.code === 'EAUTH') {
                    errorMessage = 'Autenticazione al server email fallita. Verifica username e password.';
                }
            }
        }

        return NextResponse.json(
            {
                error: errorMessage,
                details: is_devenv ? errorDetails : undefined,
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
}
