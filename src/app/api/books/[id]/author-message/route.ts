import { SITE_CONFIG } from '@/config/site-config';
import { getSessionUser } from '@/lib/auth-utils';
import { canAccessBook } from '@/lib/book-visibility';
import { withCSRFProtection } from '@/lib/csrf-middleware';
import { getBookById } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const MAX_MESSAGE_LENGTH = 5000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type RouteContext = {
    params: Promise<{ id: string }>;
};

export const POST = withCSRFProtection(async function POST(
    request: NextRequest,
    { params }: RouteContext
) {
    try {
        const user = await getSessionUser(request);
        if (!user) {
            return NextResponse.json(
                { error: 'Devi effettuare l\'accesso per scrivere all\'autore.' },
                { status: 401 }
            );
        }

        const { id: bookId } = await params;
        const book = await getBookById(bookId);
        if (!book || !canAccessBook(book, !!user.isAdmin)) {
            return NextResponse.json({ error: 'Libro non trovato.' }, { status: 404 });
        }

        let body: unknown;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: 'Messaggio non valido.' }, { status: 400 });
        }

        const message = typeof body === 'object' && body !== null && 'message' in body
            ? String(body.message).trim()
            : '';

        if (!message) {
            return NextResponse.json({ error: 'Il messaggio è obbligatorio.' }, { status: 400 });
        }
        if (message.length > MAX_MESSAGE_LENGTH) {
            return NextResponse.json(
                { error: `Il messaggio non può superare ${MAX_MESSAGE_LENGTH} caratteri.` },
                { status: 400 }
            );
        }

        const requestedDestination = typeof body === 'object'
            && body !== null
            && 'destinationEmail' in body
            ? String(body.destinationEmail).trim()
            : '';
        if (process.env.NODE_ENV === 'development'
            && requestedDestination
            && !EMAIL_PATTERN.test(requestedDestination)) {
            return NextResponse.json(
                { error: 'L\'email del destinatario non è valida.' },
                { status: 400 }
            );
        }
        const destinationEmail = process.env.NODE_ENV === 'development' && requestedDestination
            ? requestedDestination
            : SITE_CONFIG.CONTACT_EMAIL;
        const senderAddress = process.env.MAIL_FROM
            || process.env.MAIL_USER
            || SITE_CONFIG.PRIVACY_EMAIL;

        const transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port: Number.parseInt(process.env.MAIL_PORT || '587', 10),
            secure: process.env.MAIL_SECURE === 'true',
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASSWORD,
            },
            tls: process.env.NODE_ENV === 'development'
                ? { rejectUnauthorized: false }
                : undefined,
        });

        await transporter.sendMail({
            from: {
                name: `${user.fullName || 'Utente'} tramite Racconti in Voce e Caratteri`,
                address: senderAddress,
            },
            to: destinationEmail,
            replyTo: {
                name: user.fullName || 'Utente',
                address: user.email,
            },
            subject: `Messaggio per l'autore: ${book.title}`,
            text: [
                'Nuovo messaggio per l’autore',
                '',
                `Utente: ${user.fullName || 'Utente'} (ID: ${user.id})`,
                `Email: ${user.email}`,
                `Libro: ${book.title} (ID: ${bookId})`,
                `Data: ${new Date().toLocaleString('it-IT')}`,
                '',
                'Messaggio:',
                message,
            ].join('\n'),
        });

        return NextResponse.json({ success: true, message: 'Messaggio inviato con successo.' });
    } catch (error) {
        console.error('Errore durante l\'invio del messaggio all\'autore:', error);
        return NextResponse.json(
            { error: 'Si è verificato un errore durante l\'invio del messaggio.' },
            { status: 500 }
        );
    }
});
