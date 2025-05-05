import { NextResponse } from 'next/server';
import { getMailer } from '@/lib/mailer';

export async function GET(request: Request) {
    // Only return MAIL_* variables
    const env = Object.keys(process.env)
        .filter(key => key.startsWith('MAIL_'))
        .reduce<Record<string, string | undefined>>((acc, key) => {
            acc[key] = process.env[key];
            return acc;
        }, {});

    return NextResponse.json(env);
}

export async function POST(request: Request) {
    const url = new URL(request.url || '', 'http://localhost');
    const action = url.searchParams.get('action');
    try {
        const body = await request.json();
        const mailer = getMailer();
        let success = false;
        if (action === 'verify') {
            // Simulate sendVerificationEmail
            const { to, fullName = 'Test User', token = 'dummy-token-123' } = body;
            success = await mailer.sendVerificationEmail(to, fullName, token);
        } else if (action === 'welcome') {
            // Simulate sendWelcomeEmail
            const { to, fullName = 'Test User', password = 'test-password-xyz' } = body;
            success = await mailer.sendWelcomeEmail(to, fullName, password);
        } else {
            // Default: send raw email
            const { to, subject, message } = body;
            success = await mailer.sendEmail({ to, subject, html: message });
        }
        if (success) {
            return NextResponse.json({ status: 'SEND' });
        }
        return NextResponse.json({ status: 'ERROR', error: 'Failed to send email' }, { status: 500 });
    } catch (error: any) {
        return NextResponse.json({ status: 'ERROR', error: error.message || String(error) }, { status: 500 });
    }
}

