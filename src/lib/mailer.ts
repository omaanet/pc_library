// src/lib/mailer.ts
import nodemailer from 'nodemailer';

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}

class Mailer {
    private transporter: nodemailer.Transporter;

    constructor() {
        // Create a transporter using environment variables
        this.transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST || 'smtp.example.com',
            port: parseInt(process.env.MAIL_PORT || '587'),
            secure: process.env.MAIL_SECURE === 'true',
            auth: {
                user: process.env.MAIL_USER || '',
                pass: process.env.MAIL_PASSWORD || '',
            },
            tls: {
                // Ignore certificate errors (like expiration)
                rejectUnauthorized: false
            }
        });
    }

    /**
     * Send an email
     */
    async sendEmail(options: EmailOptions): Promise<boolean> {
        try {
            await this.transporter.sendMail({
                from: process.env.MAIL_FROM || 'noreply@example.com',
                to: options.to,
                subject: options.subject,
                html: options.html,
            });

            return true;
        } catch (error) {
            console.error('Error sending email:', error);
            return false;
        }
    }

    /**
     * Send an account verification email
     */
    async sendVerificationEmail(to: string, fullName: string, token: string): Promise<boolean> {
        const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3005'}/activate/${token}`;

        const html = `<!DOCTYPE html>
            <html lang="it">

            <head>
                <meta charset="UTF-8">
                <title>Verifica il tuo account</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {
                        margin: 0;
                        padding: 0;
                        background-color: #f5f5f5;
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                        color: #333;
                    }

                    .container {
                        max-width: 600px;
                        margin: 40px auto;
                        background-color: #ffffff;
                        padding: 40px;
                        border: 1px solid #e0e0e0;
                        border-radius: 8px;
                    }

                    h1 {
                        font-size: 24px;
                        margin-bottom: 24px;
                        color: #222;
                    }

                    p {
                        font-size: 16px;
                        line-height: 1.6;
                        margin: 16px 0;
                    }

                    a.button {
                        display: inline-block;
                        margin-top: 16px;
                        padding: 12px 20px;
                        background-color: #1a73e8;
                        color: white;
                        text-decoration: none;
                        border-radius: 4px;
                        font-size: 16px;
                    }

                    .signature {
                        margin-top: 40px;
                        font-style: italic;
                        font-size: 15px;
                        color: #555;
                    }
                </style>
            </head>

            <body>
                <div class="container">
                    <h1>Verifica il tuo account</h1>
                    <p>Ciao <strong>${fullName}</strong>,</p>
                    <p>Grazie per esserti registrato! Clicca sul link qui sotto per verificare il tuo indirizzo email:</p>
                    <p><a href="${verificationUrl}" class="button">Verifica Email</a></p>
                    <p>Questo link scadrà tra 24 ore.</p>
                    <p>Se non hai creato un account, puoi ignorare tranquillamente questa email.</p>
                    <p class="signature">
                        Grazie e benvenuto,<br />
                        <strong>Piero Carbonetti</strong>
                    </p>
                </div>
            </body>

            </html>`;

        return this.sendEmail({
            to,
            subject: 'Verifica il tuo account - Racconti in Voce e Caratteri',
            html,
        });
    }

    /**
     * Send a welcome email with generated password
     */
    async sendWelcomeEmail(to: string, fullName: string, password: string): Promise<boolean> {
        const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}`;

        const html = `<!DOCTYPE html>
            <html lang="it">

            <head>
                <meta charset="UTF-8">
                <title>Benvenuto in Racconti in Voce e Caratteri</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {
                        margin: 0;
                        padding: 0;
                        background-color: #f5f5f5;
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                        color: #333;
                    }

                    .container {
                        max-width: 600px;
                        margin: 40px auto;
                        background-color: #ffffff;
                        padding: 40px;
                        border: 1px solid #e0e0e0;
                        border-radius: 8px;
                    }

                    h1 {
                        font-size: 24px;
                        margin-bottom: 24px;
                        color: #222;
                    }

                    p {
                        font-size: 16px;
                        line-height: 1.6;
                        margin: 16px 0;
                    }

                    a.button {
                        display: inline-block;
                        margin-top: 24px;
                        padding: 12px 20px;
                        background-color: #1a73e8;
                        color: white;
                        text-decoration: none;
                        border-radius: 4px;
                        font-size: 16px;
                    }

                    .signature {
                        margin-top: 40px;
                        font-style: italic;
                        font-size: 15px;
                        color: #555;
                    }
                </style>
            </head>

            <body>
                <div class="container">
                    <h1>Benvenuto in "Racconti in Voce e Caratteri"</h1>
                    <p>Ciao <strong>${fullName}</strong>,</p>
                    <p>Grazie per esserti registrato. Il tuo account è stato attivato con successo.</p>
                    <p>La tua password è: <strong>${password}</strong></p>
                    <p>Ti consigliamo di conservarla in un luogo sicuro.</p>
                    <p>
                        Puoi accedere al sito cliccando qui:<br />
                        <a href="${loginUrl}" class="button">Accedi al sito</a>
                    </p>
                    <p class="signature">
                        A presto,<br />
                        <strong>Piero Carbonetti</strong>
                    </p>
                </div>
            </body>

            </html>`;

        return this.sendEmail({
            to,
            subject: 'Benvenuto in Racconti in Voce e Caratteri!',
            html,
        });
    }
}

// Create a singleton instance
let mailerInstance: Mailer | null = null;

export function getMailer(): Mailer {
    if (!mailerInstance) {
        mailerInstance = new Mailer();
    }
    return mailerInstance;
}
