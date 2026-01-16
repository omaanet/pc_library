import { NextRequest, NextResponse } from 'next/server';
import { generateCsrfToken } from '@/lib/csrf';

export async function GET(request: NextRequest) {
    // Generate a new CSRF token
    const token = generateCsrfToken();
    
    // Return the token to the client
    // The client will store this and include it in subsequent requests
    return NextResponse.json({ token });
}
