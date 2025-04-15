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

        const html = `
            <h1>Verify Your Account</h1>
            <p>Hello ${fullName},</p>
            <p>Thank you for registering! Please click the link below to verify your email address:</p>
            <p><a href="${verificationUrl}">Verify Email</a></p>
            <p>This link will expire in 24 hours.</p>
            <p>If you did not create an account, you can safely ignore this email.</p>
        `;

        return this.sendEmail({
            to,
            subject: 'Verify Your Account',
            html,
        });
    }

    /**
     * Send a welcome email with generated password
     */
    async sendWelcomeEmail(to: string, fullName: string, password: string): Promise<boolean> {
        const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3005'}/login`;

        const html = `
            <h1>Welcome to Our Platform!</h1>
            <p>Hello ${fullName},</p>
            <p>Your account has been activated successfully!</p>
            <p>Here is your temporary password: <strong>${password}</strong></p>
            <p>You can log in <a href="${loginUrl}">here</a>.</p>
            <p>For security reasons, we recommend changing your password after logging in.</p>
        `;

        return this.sendEmail({
            to,
            subject: 'Welcome to Our Platform!',
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
